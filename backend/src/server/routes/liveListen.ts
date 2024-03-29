import SpotifyTakeoverServer from "../SpotifyTakeover";
import Persistence from "../../wrappers/MongoDB";
import { SpotifyClient } from "../../wrappers/SpotifyAPI";
import { clearIntervalAsync, SetIntervalAsyncTimer, setIntervalAsync } from "set-interval-async/dynamic";
const INTERVAL_CLEARED_INDICATOR = -1;

export function initLiveListen(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    if (!authenticatedUser.slaveRefreshToken || !authenticatedUser.capabilities.liveListen) {
      res.status(403).send({ error: "Insufficient permission" });
      return;
    }
    if (!server.linkedSpotify) {
      res.status(403).send({ error: "No linked spotify" });
      return;
    }

    if (server.linkedSpotify.user.authenticityToken === authenticityToken) {
      res.status(403).send({ error: "Cannot Live Listen to yourself" });
      return;
    }

    const liveListenDuration = parseFloat(req.query.duration);
    console.log("Starting live listen", liveListenDuration);
    const slaveSpotify = new SpotifyClient(authenticatedUser.slaveRefreshToken);

    const currentSlavePlayback = await slaveSpotify.getCurrentPlayback();

    await liveListenIntervalHandler(server, slaveSpotify, authenticatedUser.spotify.country).catch(r =>
      console.log("initial liveListen", r),
    );
    const interval = setIntervalAsync(
      () => liveListenIntervalHandler(server, slaveSpotify, authenticatedUser.spotify.country),
      10_000,
    );

    server.liveListen[authenticityToken] = {
      user: authenticatedUser,
      interval,
      previousPlayback: currentSlavePlayback,
    };

    setTimeout(() => {
      endLiveListen(server, authenticityToken, interval);
    }, Math.min(liveListenDuration, server.maxKeepAliveMS));
    res.status(200).send({ ok: true });
  });
}

export function initStopLiveListen(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      console.log("Unauthorized attempt, authenticityToken:", authenticityToken);
      res.status(401).send({ error: "Unauthorized" });
      return;
    }

    if (!server.liveListen[authenticityToken]) {
      console.log("user is not live listening");
      res.status(400).send({
        error: "You are not live listeneing",
      });
      return;
    }

    await endLiveListen(server, authenticityToken, server.liveListen[authenticityToken]!.interval);
    res.status(200).send({ ok: true });
  });
}

export async function endLiveListen(
  server: SpotifyTakeoverServer,
  authenticityToken: string,
  interval: SetIntervalAsyncTimer,
) {
  if (interval.id === INTERVAL_CLEARED_INDICATOR) return;
  await clearIntervalAsync(interval);
  interval.id = INTERVAL_CLEARED_INDICATOR;

  const listenerSpotify = new SpotifyClient(server.liveListen[authenticityToken]!.user.slaveRefreshToken!);
  const listenInfo = server.liveListen[authenticityToken];
  server.liveListen[authenticityToken] = undefined;

  console.log("Live listen ended");
  await listenerSpotify.setCurrentPlayback(
    listenInfo!.previousPlayback.item?.uri ?? null,
    listenInfo!.previousPlayback.progress_ms,
    listenInfo!.previousPlayback.context,
  );
}

interface PlayingCurrentlyPlayingObject extends SpotifyApi.CurrentlyPlayingObject {
  is_playing: true;
  item: SpotifyApi.TrackObjectFull;
  progress_ms: number;
}
function isPlaying(playback: SpotifyApi.CurrentlyPlayingObject): playback is PlayingCurrentlyPlayingObject {
  return !!playback.is_playing && !!playback.item;
}

const liveListenIntervalHandler = async (
  server: SpotifyTakeoverServer,
  slaveSpotify: SpotifyClient,
  slaveMarket: string,
) => {
  console.log("######## iteration of playback check");
  if (!server.linkedSpotify) {
    console.log("No master spotify available");
    return;
  }
  const masterPlayback = await server.linkedSpotify.client.getCurrentPlayback(slaveMarket);
  const slavePlayback = await slaveSpotify.getCurrentPlayback();
  console.log("master playback", masterPlayback.item?.name, masterPlayback.progress_ms);
  console.log("slave playback", slavePlayback.item?.name, slavePlayback.progress_ms);

  if (!isPlaying(masterPlayback) || !masterPlayback.item.is_playable) {
    console.log("master playback not playing, playable in slave market:", masterPlayback.item?.is_playable);
    if (isPlaying(slavePlayback) && Math.abs(slavePlayback.item.duration_ms - slavePlayback.progress_ms) > 2000)
      await slaveSpotify.setCurrentPlayback(null);
  } else {
    if (!isPlaying(slavePlayback) || slavePlayback.item.id !== masterPlayback.item.id) {
      console.log(await slaveSpotify.getAvailableDevices());
      await slaveSpotify.setCurrentPlayback(
        masterPlayback.item.uri,
        masterPlayback.progress_ms,
        masterPlayback.context,
      );
      //TODO: take timestamp into account to combat http request and polling point differences
    } else if (Math.abs(slavePlayback.progress_ms - masterPlayback.progress_ms) > 8000) {
      await slaveSpotify.seekPositionInCurrentPlayback(masterPlayback.progress_ms);
    }
    console.log("############\n");
  }
};
