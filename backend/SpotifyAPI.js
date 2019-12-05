const SpotifyWebApi = require("spotify-web-api-node");

function isToday(utcDate) {
  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
  const shiftedUTCDate = utcDate.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
  return shiftedUTCDate === today;
}
export default class SpotifyAppUserClient {
  constructor(refreshToken, clientId, clientSecret, redirectUri, dailySongsPlaylistID, seleçionPlaylistID) {
    this.dailySongsPlaylistID = dailySongsPlaylistID;
    this.seleçionPlaylistID = seleçionPlaylistID;
    this.engine = new SpotifyWebApi({ clientId, clientSecret, redirectUri });
    this.engine.setRefreshToken(refreshToken);
  }
  get accessToken() {
    return this.engine.getAccessToken();
  }
  async refreshAccessToken() {
    await this.engine
      .refreshAccessToken()
      .then(result => this.engine.setAccessToken(result.body.access_token))
      .catch(e => console.log("Error while refreshing acess token", e));
  }
  async getDailySongs() {
    await this.refreshAccessToken();
    return this.engine
      .getPlaylistTracks(this.dailySongsPlaylistID)
      .then(resp => {
        return resp.body.items.filter(track => {
          return isToday(new Date(track.added_at));
        });
      })
      .catch(e => console.log("error while getting todays songs", e));
  }
  async addSongToPlaylist(trackURI, playlistID = this.seleçionPlaylistID) {
    await this.refreshAccessToken();
    this.engine
      .addTracksToPlaylist(playlistID, [trackURI])
      .then(resp => console.log(`Added track ${trackURI} to playlist ${playlistID}`))
      .catch(e => console.log("error while trying to add track to playlist", e));
  }
}

export class SpotifyUserAuth {
  static authDict = {};
  static init(clientId, clientSecret, redirectUri) {
    this.engine = new SpotifyWebApi({
      clientId,
      clientSecret,
      redirectUri,
    });
  }
  static getAuthorizeURL() {
    return this.engine.createAuthorizeURL(["user-read-email"], "nicerstate", true);
  }

  static async getUserInfo(userRefreshToken) {
    await this.authorizeRequest(userRefreshToken);

    const userInfo = await this.engine.getMe().catch(error => console.log(error));
    return userInfo.body;
  }
  static async authorizeRequest(refreshToken) {
    this.engine.setRefreshToken(refreshToken);
    await this.engine
      .refreshAccessToken()
      .then(result => {
        this.engine.setAccessToken(result.body.access_token);
      })
      .catch(e => console.log("Error while refreshing acess token", e));
  }
}
