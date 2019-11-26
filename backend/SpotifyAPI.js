const SpotifyWebApi = require("spotify-web-api-node");

export default class SpotifyAPI {
  constructor(refreshToken, clientId, clientSecret, redirectUri, dailySongsPlaylistID, seleçionPlaylistID) {
    this.refreshToken = refreshToken;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.dailySongsPlaylistID = dailySongsPlaylistID;
    this.seleçionPlaylistID = seleçionPlaylistID;
    this.api = new SpotifyWebApi({ clientId, clientSecret, refreshToken });
    this.api.setRefreshToken(refreshToken);
  }
  get accessToken() {
    return this.api.getAccessToken();
  }
  async refreshAccessToken() {
    await this.api
      .refreshAccessToken()
      .then(result => this.api.setAccessToken(result.body.access_token))
      .catch(e => console.log("Error while refreshing acess token", e));
  }
  async getDailySongs() {
    await this.refreshAccessToken();
    return this.api
      .getPlaylistTracks(this.dailySongsPlaylistID)
      .then(resp => {
        console.log(`Fetched daily tracks`);
        const today = new Date();
        return resp.body.items.filter(track => new Date(track.added_at).toDateString() === today.toDateString());
      })
      .catch(e => console.log("error while tring to add track to playlist", e));
  }
  async addSongToPlaylist(trackURI, playlistID = this.seleçionPlaylistID) {
    await this.refreshAccessToken();
    this.api
      .addTracksToPlaylist(playlistID, [trackURI])
      .then(resp => console.log(`Added track ${trackURI} to playlist ${playlistID}`))
      .catch(e => console.log("error while tring to add track to playlist", e));
  }
}
