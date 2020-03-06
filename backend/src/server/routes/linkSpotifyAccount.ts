import SpotifyTakeoverServer from "../SpotifyTakeover";
import Persistence from "../../wrappers/MongoDB";
import { SpotifyClient } from "../../wrappers/SpotifyAPI";
import { endLiveListen } from "./liveListen";

export function initLinkSpotify(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    if (!authenticatedUser.slaveRefreshToken || !authenticatedUser.capabilities.linkSpotify) {
      res.status(403).send({ error: "Insufficient permissions" });
      return;
    }

    server.linkedSpotify = { client: new SpotifyClient(authenticatedUser.slaveRefreshToken), user: authenticatedUser };
    res.status(200).send({ ok: true });
  });
}

export function initUnlinkSpotify(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    if (authenticatedUser.authenticityToken !== server.linkedSpotify?.user.authenticityToken) {
      res.status(400).send({ error: "You are not linked" });
      return;
    }
    server.linkedSpotify = undefined;
    Object.entries(server.liveListen).forEach(([liveListenerAuthenticityToken, liveListenerInfo]) => {
      if (!liveListenerInfo) return;
      endLiveListen(server, liveListenerAuthenticityToken, liveListenerInfo.interval);
    });
    if (server.activeWishedSongInfo?.timeout) clearTimeout(server.activeWishedSongInfo.timeout);
    server.activeWishedSongInfo = undefined;

    res.status(200).send({ ok: true });
  });
}
