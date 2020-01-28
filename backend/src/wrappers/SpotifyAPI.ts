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
    this.engine = new SpotifyWebApi(SpotifyClient.spotifyCredentials);
    this.engine.setRefreshToken(refreshToken);
  }

  get accessToken() {
    return this.engine.getAccessToken();
  }

  //TODO: implement refreshing only when necessary
  async refreshAccessToken() {
    await this.engine.refreshAccessToken().then(result => this.engine.setAccessToken(result.body.access_token));
  }


}
export class ApplicationSpotifyClient extends SpotifyClient {
  setCurrentPlayback() { }

  getUserAuthUrl() {
    return this.engine.createAuthorizeURL(["user-read-currently-playing", "user-read-currently-playing"], "nicerstate", true);
  }
}

export class UserSpotifyClient extends SpotifyClient {
  getCurrentPlayback() { }

  async getUserInfo() {
    await this.refreshAccessToken();
    const userInfo = await this.engine.getMe();
    return userInfo.body;
  }
}

