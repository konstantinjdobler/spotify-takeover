import SpotifyTakeoverServer from "../SpotifyTakeover";
import Persistence from "../../wrappers/MongoDB";
import { SpotifyClient } from "../../wrappers/SpotifyAPI";
import { endTakeover } from "./takeover";
import { endLiveListen } from "./liveListen";

export function initLinkSpotify(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      console.log("Unauthorized attempt, authenticityToken:", authenticityToken);
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    if (!authenticatedUser.slaveRefreshToken) {
      console.log("Need more permissions for roadtrip device");
      res.status(200).send({
        requestPermissionLink: server.applicationSpotify.getSlaveAuthUrl(authenticatedUser.authenticityToken),
      });
      return;
    }
    server.linkedSpotify = { client: new SpotifyClient(authenticatedUser.slaveRefreshToken), user: authenticatedUser };
    const devices = await server.linkedSpotify.client.getAvailableDevices();
    const boi = devices.find(device => device.type === "Smartphone" && !device.is_restricted);
    console.log("Devices", devices, "Smartphone device", boi);
    res.status(200).send({ devices });
  });
}

export function initUnlinkSpotify(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken: string = req.cookies.authenticityToken;
    const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
    if (!authenticatedUser) {
      console.log("Unauthorized attempt, authenticityToken:", authenticityToken);
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    if (authenticatedUser.authenticityToken !== server.linkedSpotify?.user.authenticityToken) {
      console.log("Unlink requested but account is not linked");
      res.status(400).send({
        error: "You are not linked",
      });
      return;
    }
    server.linkedSpotify = undefined;
    if (server.activeTakeoverInfo) endTakeover(server, server.activeTakeoverInfo.interval);
    Object.entries(server.liveListen).forEach(([liveListenerAuthenticityToken, liveListenerInfo]) => {
      if (!liveListenerInfo) return;
      endLiveListen(server, liveListenerAuthenticityToken, liveListenerInfo.interval);
    });
    res.status(200).send({ ok: true });
  });
}
