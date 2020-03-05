import SpotifyTakeoverServer from "../SpotifyTakeover";
import Persistence from "../../wrappers/MongoDB";
import { SpotifyClient } from "../../wrappers/SpotifyAPI";

export function initSearch(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    if (!server.linkedSpotify) {
      return res.status(400).send({ error: "No linked spotify account" });
    }
    const song = req.query.song as string | undefined;
    const artist = req.query.artist as string | undefined;
    if (!song) {
      res.status(400).send({ error: "No song" });
      return;
    }
    const searchResult = await SpotifyClient.with(authenticatedUser.refreshToken).search(song, artist);

    res.status(200).send({ tracks: searchResult.body.tracks?.items });
  });
}

export function initSongInjection(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    if (!server.linkedSpotify) {
      return res.status(400).send({ error: "No linked spotify account" });
    }
    const injectedSongsByUser = await Persistence.totalSongInjectionsForUser(authenticatedUser.authenticityToken);
    if (injectedSongsByUser >= authenticatedUser.capabilities.wishSongs) {
      res.status(403).send({ error: "Song limit reached" });
      return;
    }
    const songID = req.query.songID;
    if (!songID) {
      res.status(400).send({ error: "No song" });
      return;
    }

    const previousPlayback = await server.linkedSpotify.client.getCurrentPlayback();
    const injectionSong = (await server.linkedSpotify.client.engine.getTrack(songID)).body;
    if (previousPlayback && previousPlayback.item) {
      setTimeout(async () => {
        const afterTimeoutPlayback = await server.linkedSpotify?.client.getCurrentPlayback();
        if (afterTimeoutPlayback?.item?.uri && afterTimeoutPlayback?.item?.uri === injectionSong.uri)
          setTimeout(
            () =>
              server.linkedSpotify?.client.setCurrentPlayback(
                previousPlayback.item!.uri,
                previousPlayback.progress_ms,
                previousPlayback.context,
              ),
            8000,
          );
      }, injectionSong.duration_ms - 10_000);
    }
    await server.linkedSpotify.client.setCurrentPlayback(injectionSong.uri);
    await Persistence.addSongInjection(authenticatedUser, injectionSong.uri);
    server.activeWishedSongInfo = { previousPlayback, user: authenticatedUser, wishedSong: injectionSong };
    res.status(200).send({ ok: true });
  });
}
