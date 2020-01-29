import SpotifyWebApi from "spotify-web-api-node";

function isToday(utcDate: Date) {
  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
  const shiftedUTCDate = utcDate.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
  return shiftedUTCDate === today;
}

export type SpotifyApiCredentials = {
  clientId: string,
  clientSecret: string,
  redirectUri: string,
}
export default abstract class SpotifyClient {
  engine: SpotifyWebApi;
  static spotifyCredentials: SpotifyApiCredentials
  static setCredentials(credentials: SpotifyApiCredentials) {
    this.spotifyCredentials = credentials
  }
  constructor(
    refreshToken: string,
  ) {
    if (!SpotifyClient.spotifyCredentials) throw new Error("Set credentials before instantiating")
    // IMPORTANT: avoid pass by reference of SpotifyClient.spotifyCredentials
    this.engine = new SpotifyWebApi({ ...SpotifyClient.spotifyCredentials });
    this.engine.setRefreshToken(refreshToken);
  }

  //TODO: implement refreshing only when necessary
  async refreshAccessToken() {
    await this.engine.refreshAccessToken().then(result => this.engine.setAccessToken(result.body.access_token));
  }


}
export class ApplicationSpotifyClient extends SpotifyClient {
  async setCurrentPlayback(song: string | null, postionInMS?: number) {
    await this.refreshAccessToken();
    if (!song) {
      console.log("pause")
      this.engine.pause()
    } else {
      console.log("play", song)
      this.engine.play({ uris: [song] }).catch(r => console.log(r, r.reason))

    }
  }
  getAppAuthUrl() {
    return this.engine.createAuthorizeURL(["user-modify-playback-state"], "statee", true)
  }
  getUserAuthUrl() {
    return this.engine.createAuthorizeURL(["user-read-currently-playing", "user-read-currently-playing"], "nicerstate", true);
  }
}

export class UserSpotifyClient extends SpotifyClient {
  async getCurrentPlayback(): Promise<SpotifyApi.CurrentlyPlayingObject> {
    await this.refreshAccessToken();
    const s = await this.engine.getMyCurrentPlayingTrack().catch(r => { console.log(r); return undefined })
    return s!.body
  }

  async getUserInfo() {
    await this.refreshAccessToken();
    const userInfo = await this.engine.getMe();
    return userInfo.body;
  }
}

