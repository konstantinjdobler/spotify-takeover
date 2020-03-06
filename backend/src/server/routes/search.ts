import SpotifyTakeoverServer from "../SpotifyTakeover";
import Persistence from "../../wrappers/MongoDB";
import { SpotifyClient } from "../../wrappers/SpotifyAPI";
const delay = (t: number) => new Promise(resolve => setTimeout(resolve, t));

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
    if (!song && !artist) {
      res.status(400).send({ error: "No song nor artist" });
      return;
    }
    const searchResult = await SpotifyClient.with(authenticatedUser.refreshToken).search({ song, artist });

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
    if (server.activeWishedSongInfo && server.activeWishedSongInfo.wishedSong.uri === previousPlayback.item?.uri) {
      res.status(400).send({ error: "Requested song is currently playing" });
      return;
    }

    const injectionSong = (await server.linkedSpotify.client.engine.getTrack(songID)).body;
    let timeout;
    if (previousPlayback && previousPlayback.item) {
      timeout = setTimeout(async () => {
        if (!server.activeWishedSongInfo) return;
        if (!server.linkedSpotify) return;
        const afterTimeoutPlayback = await server.linkedSpotify.client.getCurrentPlayback();
        const previousPlayback = server.activeWishedSongInfo.previousPlayback;
        const injectedSongIsStillPlaying =
          !!afterTimeoutPlayback.item &&
          afterTimeoutPlayback.item.uri === injectionSong.uri &&
          afterTimeoutPlayback.progress_ms;
        if (injectedSongIsStillPlaying) {
          await delay(injectionSong.duration_ms - afterTimeoutPlayback.progress_ms!);
          await server.linkedSpotify.client.setCurrentPlayback(
            previousPlayback.item?.uri ?? null,
            previousPlayback.progress_ms,
            previousPlayback.context,
          );
        }
        server.activeWishedSongInfo = undefined;
      }, injectionSong.duration_ms - 4_000);
    }
    await server.linkedSpotify.client.setCurrentPlayback(injectionSong.uri);
    await Persistence.addSongInjection(authenticatedUser, injectionSong.uri);
    server.activeWishedSongInfo = {
      previousPlayback,
      user: authenticatedUser,
      wishedSong: injectionSong,
      timeout,
      timestamp: Date.now(),
    };
    res.status(200).send({ ok: true });
  });
}
export function initSkipSongInjection(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      return res.status(401).send({ error: "Unauthorized" });
    }
    if (!server.activeWishedSongInfo) {
      return res.status(403).send({ error: "No song injection active" });
    }
    if (!server.linkedSpotify || server.linkedSpotify?.user.authenticityToken !== authenticatedUser.authenticityToken) {
      return res.status(403).send({ error: "Not currently linked" });
    }
    const previousPlayback = server.activeWishedSongInfo.previousPlayback;
    if (!previousPlayback.item) {
      await server.linkedSpotify.client.setCurrentPlayback(null);
      return res.status(200).send({ ok: "Paused playback" });
    }
    if (server.activeWishedSongInfo.timeout) clearTimeout(server.activeWishedSongInfo.timeout);

    server.linkedSpotify.client.setCurrentPlayback(
      previousPlayback.item.uri,
      previousPlayback.progress_ms,
      previousPlayback.context,
    );
    server.activeWishedSongInfo = undefined;
    res.status(200).send({ ok: true });
  });
}
