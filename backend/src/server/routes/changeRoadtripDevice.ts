import SpotifyTakeoverServer from "../SpotifyTakeover";
import Persistence from "../../wrappers/MongoDB";
import { SpotifyClient } from "../../wrappers/SpotifyAPI";

export function initChangeRoadtripDevice(server: SpotifyTakeoverServer, route: string) {
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
    server.currentRoadtripDeviceSpotify = new SpotifyClient(authenticatedUser.slaveRefreshToken);
    const devices = await server.currentRoadtripDeviceSpotify.getAvailableDevices();
    console.log(devices);
    const boi = devices.find(device => device.type === "Smartphone" && !device.is_restricted);
    console.log(boi);
    res.status(200).send({ devices });
  });
}
