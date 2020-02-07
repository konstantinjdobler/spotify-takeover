import SpotifyTakeoverServer from "../SpotifyTakeover";
import Persistence from "../../wrappers/MongoDB";
import { InitialRequestResponse } from "src/sharedTypes";

export function initInitialRoute(server: SpotifyTakeoverServer, route: string) {
  server.app.get("/api/initial", async (req, res) => {
    const authenticityToken = req.cookies.authenticityToken as string | null;
    const tempCode = req.query.tempCode as string | null;
    if (authenticityToken) {
      const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
      if (authenticatedUser) {
        console.log("User authenticated", authenticatedUser.spotify.display_name);

        const masterPermissionLink = !authenticatedUser.masterRefreshToken
          ? server.applicationSpotify.getMasterAuthUrl(authenticatedUser.authenticityToken)
          : undefined;
        const slavePermissionLink = !authenticatedUser.slaveRefreshToken
          ? server.applicationSpotify.getSlaveAuthUrl(authenticatedUser.authenticityToken)
          : undefined;
        const playback = await server.currentRoadtripDeviceSpotify?.getCurrentPlayback();
        const activeTakeoverUser = server.activeTakeoverInfo
          ? { name: server.activeTakeoverInfo.user.name, id: server.activeTakeoverInfo.user.spotify.id }
          : undefined;

        const response: InitialRequestResponse = {
          ok: true,
          user: { name: authenticatedUser.name, spotify: authenticatedUser.spotify },
          slavePermissionLink,
          masterPermissionLink,
          activeTakeoverUser,
          playback,
        };
        res.status(200).send(response);
        return;
      }
    }
    console.log("Initial request without authenticityToken, sending authentication link");
    const spotifyAuthUrl = server.applicationSpotify.getUserSignupUrl(tempCode || "no-code-provided");
    console.log("Spotify Auth url: ", spotifyAuthUrl);
    res.status(200).send({ authRequired: spotifyAuthUrl });
  });
}
