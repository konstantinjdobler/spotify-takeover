import SpotifyWebApi from "spotify-web-api-node";
import { TrackURI, SpotifyCallbackState } from "src/schemas";

function isToday(utcDate: Date) {
  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
  const shiftedUTCDate = utcDate.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
  return shiftedUTCDate === today;
}

export type SpotifyApiCredentials = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};
export class SpotifyClient {
  engine: SpotifyWebApi;
  static accessTokenDict: {
    [refreshToken: string]: { access_token: string; expirationEpoch: number } | undefined;
  } = {};
  static spotifyCredentials: SpotifyApiCredentials;
  static setCredentials(credentials: SpotifyApiCredentials) {
    this.spotifyCredentials = credentials;
  }
  constructor(refreshToken: string) {
    if (!SpotifyClient.spotifyCredentials) throw new Error("Set credentials before instantiating");
    // IMPORTANT: avoid pass by reference of SpotifyClient.spotifyCredentials
    this.engine = new SpotifyWebApi({ ...SpotifyClient.spotifyCredentials });
    this.engine.setRefreshToken(refreshToken);
  }

  static with(refreshToken: string) {
    return new SpotifyClient(refreshToken);
  }
  //TODO: implement refreshing only when necessary
  async refreshAccessToken() {
    const nowEpoch = Date.now() + 120_000;
    const cachedAccesTokenEntry = SpotifyClient.accessTokenDict[this.engine.getRefreshToken()!];
    if (cachedAccesTokenEntry && nowEpoch < cachedAccesTokenEntry.expirationEpoch  ) {
      console.log(
        "Saved refresh, expires at:",
        new Date(cachedAccesTokenEntry.expirationEpoch).toString(),
        '"now":',
        new Date(nowEpoch).toString(),
      );
      return;
    }
    await this.engine
      .refreshAccessToken()
      .then(result => {
        const access_token = result.body.access_token;
        this.engine.setAccessToken(result.body.access_token);
        SpotifyClient.accessTokenDict[this.engine.getRefreshToken()!] = {
          access_token,
          expirationEpoch: Date.now() + result.body.expires_in * 1000,
        };
        console.log("##!!@@: valididty duration:", result.body.expires_in);
      })
      .catch(error => {
        console.log("refresh error", error);
      });
  }

  async setCurrentPlayback(
    song: TrackURI | null,
    positionMS?: number | null,
    context?: SpotifyApi.ContextObject | null,
  ) {
    await this.refreshAccessToken();
    if (!song) {
      console.log("pause");
      this.engine.pause();
    } else {
      console.log("play", song);
      if (context && context.type !== "artist") {
        console.log("context");
        this.engine
          .play({ position_ms: positionMS ?? undefined, context_uri: context?.uri, offset: { uri: song } })
          .catch(r => console.log(r));
      } else {
        this.engine.play({ uris: [song], position_ms: positionMS ?? undefined }).catch(r => console.log(r));
      }
    }
  }

  async seekPositionInCurrentPlayback(postionInMS: number) {
    await this.refreshAccessToken();
    console.log(`seeking ${postionInMS} in current track`);
    this.engine.seek(postionInMS).catch(r => console.log(r));
  }
  async getCurrentPlayback(): Promise<SpotifyApi.CurrentlyPlayingObject> {
    await this.refreshAccessToken();
    const s = await this.engine.getMyCurrentPlaybackState().catch(r => {
      console.log(r);
      return undefined;
    });
    return s!.body;
  }

  async getRefreshToken(code: string) {
    return (await this.engine.authorizationCodeGrant(code)).body.refresh_token;
  }

  async getAvailableDevices() {
    await this.refreshAccessToken();
    return (await this.engine.getMyDevices()).body.devices;
  }

  getSlaveAuthUrl(authenticityToken: string) {
    const state: SpotifyCallbackState = { slaveScope: true, authenticityToken };
    return this.engine.createAuthorizeURL(
      ["user-modify-playback-state", "user-read-playback-state", "user-read-currently-playing"],
      JSON.stringify(state),
      true,
    );
  }
  getUserSpotifyAuthUrl(tempCode: string) {
    const state: SpotifyCallbackState = { tempCode, basicScope: true };
    return this.engine.createAuthorizeURL(["user-read-email"], JSON.stringify(state), true);
  }
  getMasterAuthUrl(authenticityToken: string) {
    const state: SpotifyCallbackState = { authenticityToken, masterScope: true };
    return this.engine.createAuthorizeURL(
      ["user-read-currently-playing", "user-read-playback-state"],
      JSON.stringify(state),
      true,
    );
  }

  async getUserInfo() {
    await this.refreshAccessToken();
    const userInfo = await this.engine.getMe();
    return userInfo.body;
  }
}
