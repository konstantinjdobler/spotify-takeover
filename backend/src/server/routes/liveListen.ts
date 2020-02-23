import SpotifyTakeoverServer from "../SpotifyTakeover";
import Persistence from "../../wrappers/MongoDB";
import { SpotifyClient } from "../../wrappers/SpotifyAPI";
import { clearIntervalAsync, SetIntervalAsyncTimer, setIntervalAsync } from "set-interval-async/dynamic";
const INTERVAL_CLEARED_INDICATOR = 0;

export function initLiveListen(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    if (!authenticatedUser.slaveRefreshToken) {
      res.status(403).send({ error: "Insufficient permission" });
      return;
    }
    if (!server.linkedSpotify) {
      res.status(403).send({ error: "No linked spotify" });
      return;
    }

    const liveListenDuration = parseFloat(req.query.duration);
    console.log("Starting live listen");
    const slaveSpotify = new SpotifyClient(authenticatedUser.refreshToken);

    await liveListenIntervalHandler(server, slaveSpotify);
    const interval = setIntervalAsync(() => liveListenIntervalHandler(server, slaveSpotify), 8000);

    server.liveListen[authenticityToken] = { user: authenticatedUser, interval };

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
  server.liveListen[authenticityToken] = undefined;
  console.log("Live listen ended");
}

const liveListenIntervalHandler = async (server: SpotifyTakeoverServer, slaveSpotify: SpotifyClient) => {
  console.log("iteration of playback check");
  if (!server.linkedSpotify) {
    console.log("No master spotify available");
    return;
  }
  const masterPlayback = await server.linkedSpotify.client.getCurrentPlayback();

  if (!masterPlayback.is_playing || !masterPlayback.item) {
    console.log("master playback not playing");
    slaveSpotify.setCurrentPlayback(null);
  } else {
    const slavePlayback = await slaveSpotify.getCurrentPlayback();

    if (!slavePlayback.is_playing || slavePlayback.item?.id !== masterPlayback.item.id) {
      await slaveSpotify.setCurrentPlayback(
        masterPlayback.item!.uri,
        masterPlayback.progress_ms!,
        masterPlayback.context,
      );
      //TODO: take timestamp into account to combat http request and polling point differences
    } else if (Math.abs(slavePlayback.progress_ms! - masterPlayback.progress_ms!) > 8000) {
      await slaveSpotify.seekPositionInCurrentPlayback(masterPlayback.progress_ms!);
    }
    console.log("master playback", masterPlayback.item.name, masterPlayback.progress_ms);
    console.log("slave playback", slavePlayback.item?.name, slavePlayback.progress_ms);
  }
};