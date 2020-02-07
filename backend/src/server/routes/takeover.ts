import SpotifyTakeoverServer from "../SpotifyTakeover";
import Persistence from "../../wrappers/MongoDB";
import { setIntervalAsync, clearIntervalAsync, SetIntervalAsyncTimer } from "set-interval-async/dynamic";
import { SpotifyClient } from "../../wrappers/SpotifyAPI";

const INTERVAL_CLEARED_INDICATOR = 0;
export function initTakeover(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    //TODO: verify if request is valid
    console.log("Takeover");

    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      console.log("Unauthorized voting attempt, votingToken:", authenticityToken);
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    if (!authenticatedUser.masterRefreshToken) {
      console.log("Need more permissions for takeover");
      res.status(200).send({
        requestPermissionLink: server.applicationSpotify.getMasterAuthUrl(authenticatedUser.authenticityToken),
      });
      return;
    }
    if (await Persistence.userHasAlreadyHadTakeoverToday(authenticatedUser.spotify.id)) {
      //TODO:reject request
      console.log("Illegal takeover");
    }
    if (server.activeTakeoverInfo) {
      return res.status(409).send("Cannot process takeover because of currently active takeover");
    }

    const masterSpotify = new SpotifyClient(authenticatedUser.refreshToken);
    const interval = setIntervalAsync(() => takeoverIntervalHandler(server, masterSpotify), 4000);
    server.activeTakeoverInfo = { user: authenticatedUser, interval };
    Persistence.addTakeoverEvent(authenticatedUser.spotify);

    setTimeout(() => {
      console.log("jo");
      endTakeover(server, interval);
    }, server.takeoverDurationMS);

    res.status(200);
  });
}

async function endTakeover(server: SpotifyTakeoverServer, interval: SetIntervalAsyncTimer) {
  if (interval.id === INTERVAL_CLEARED_INDICATOR) return;
  await clearIntervalAsync(interval);
  interval.id = INTERVAL_CLEARED_INDICATOR;
  server.activeTakeoverInfo = undefined;
  console.log("Takeover ended");
}

export function initStopTakeover(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      console.log("Unauthorized  attempt, authenticityToken:", authenticityToken);
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    if (!server.activeTakeoverInfo) {
      console.log("No takeover active:", authenticityToken);
      res.status(400).send({ error: "No active takeover" });
      return;
    }
    if (authenticatedUser.authenticityToken !== server.activeTakeoverInfo.user.authenticityToken) {
      console.log("Only takeover user can terminate takeover:", authenticityToken);
      res.status(401).send({ error: "Only the takeover user can terminate the takeover" });
      return;
    }
    console.log("jojo");
    endTakeover(server, server.activeTakeoverInfo.interval);
  });
}

const takeoverIntervalHandler = async (server: SpotifyTakeoverServer, masterSpotify: SpotifyClient) => {
  console.log("iteration of playback check");
  const masterPlayback = await masterSpotify.getCurrentPlayback();
  if (!server.currentRoadtripDeviceSpotify) {
    console.log("No slave spotify available");
    return;
  }
  if (!masterPlayback.is_playing || !masterPlayback.item) {
    console.log("master playback not playing");
    server.currentRoadtripDeviceSpotify.setCurrentPlayback(null);
  } else {
    const slavePlayback = await server.currentRoadtripDeviceSpotify.getCurrentPlayback();

    if (!slavePlayback.is_playing || slavePlayback.item?.id !== masterPlayback.item.id) {
      await server.currentRoadtripDeviceSpotify.setCurrentPlayback(masterPlayback.item!.uri);
      await server.currentRoadtripDeviceSpotify.seekPositionInCurrentPlayback(masterPlayback.progress_ms!);
      //TODO: take timestamp into account to combat http request and polling point differences
    } else if (Math.abs(slavePlayback.progress_ms! - masterPlayback.progress_ms!) > 8000) {
      await server.currentRoadtripDeviceSpotify.seekPositionInCurrentPlayback(masterPlayback.progress_ms!);
    }
    console.log("master playback", masterPlayback.item.name, masterPlayback.progress_ms);
    console.log("slave playback", slavePlayback.item?.name, slavePlayback.progress_ms);
  }
};
