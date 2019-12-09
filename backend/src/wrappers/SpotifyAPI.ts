import SpotifyWebApi from "spotify-web-api-node";

function isToday(utcDate: Date) {
  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
  const shiftedUTCDate = utcDate.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
  return shiftedUTCDate === today;
}
export default class SpotifyAppUserClient {
  engine: SpotifyWebApi;
  constructor(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    private dailySongsPlaylistID: string,
    private seleçionPlaylistID: string,
  ) {
    this.dailySongsPlaylistID = dailySongsPlaylistID;
    this.seleçionPlaylistID = seleçionPlaylistID;
    this.engine = new SpotifyWebApi({ clientId, clientSecret, redirectUri });
    this.engine.setRefreshToken(refreshToken);
  }
  get accessToken() {
    return this.engine.getAccessToken();
  }
  async refreshAccessToken() {
    await this.engine.refreshAccessToken().then(result => this.engine.setAccessToken(result.body.access_token));
  }
  async getDailySongs() {
    await this.refreshAccessToken();
    return this.engine.getPlaylistTracks(this.dailySongsPlaylistID).then(resp => {
      return resp.body.items.filter(track => {
        return isToday(new Date(track.added_at));
      });
    });
  }
  async addSongsToPlaylist(trackURIs: string[], playlistID = this.seleçionPlaylistID) {
    await this.refreshAccessToken();
    await this.engine
      .addTracksToPlaylist(playlistID, trackURIs)
      .then(resp => console.log(`Added track ${trackURIs} to playlist ${playlistID}`));
  }
}

export class SpotifyUserAuth {
  static authDict = {};
  static engine: SpotifyWebApi;
  static init(clientId: string, clientSecret: string, redirectUri: string) {
    this.engine = new SpotifyWebApi({
      clientId,
      clientSecret,
      redirectUri,
    });
  }
  static getAuthorizeURL() {
    return this.engine.createAuthorizeURL(["user-read-email"], "nicerstate", true);
  }

  static async getUserInfo(userRefreshToken: string) {
    await this.authorizeRequest(userRefreshToken);
    const userInfo = await this.engine.getMe();
    return userInfo.body;
  }
  static async authorizeRequest(refreshToken: string) {
    this.engine.setRefreshToken(refreshToken);
    await this.engine.refreshAccessToken().then(result => this.engine.setAccessToken(result.body.access_token));
  }
}
