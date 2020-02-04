import SpotifyWebApi from "spotify-web-api-node";
import { TrackURI } from "src/schemas";

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

  //TODO: implement refreshing only when necessary
  async refreshAccessToken() {
    await this.engine.refreshAccessToken().then(result => this.engine.setAccessToken(result.body.access_token));
  }

  async setCurrentPlayback(song: TrackURI | null) {
    await this.refreshAccessToken();
    if (!song) {
      console.log("pause");
      this.engine.pause();
    } else {
      console.log("play", song);
      this.engine.play({ uris: [song] }).catch(r => console.log(r));
    }
  }

  async seekPositionInCurrentPlayback(postionInMS: number) {
    await this.refreshAccessToken();
    console.log(`seeking ${postionInMS} in current track`);
    this.engine.seek(postionInMS).catch(r => console.log(r));
  }
  async getCurrentPlayback(): Promise<SpotifyApi.CurrentlyPlayingObject> {
    await this.refreshAccessToken();
    const s = await this.engine.getMyCurrentPlayingTrack().catch(r => {
      console.log(r);
      return undefined;
    });
    return s!.body;
  }

  async getRefreshToken(code: string) {
    return (await this.engine.authorizationCodeGrant(code)).body.refresh_token;
  }

  getAppAuthUrl() {
    return this.engine.createAuthorizeURL(
      ["user-modify-playback-state", "user-read-playback-state", "user-read-currently-playing"],
      "app-user",
      true,
    );
  }
  getUserAuthUrl(tempCode: string) {
    return this.engine.createAuthorizeURL(["user-read-currently-playing", "user-read-playback-state"], tempCode, true);
  }

  async getUserInfo() {
    await this.refreshAccessToken();
    const userInfo = await this.engine.getMe();
    return userInfo.body;
  }
}
