import SpotifyTakeoverServer from "../SpotifyTakeover";
import Persistence from "../../wrappers/MongoDB";
import { InitialRequestResponse } from "../../sharedTypes";
import { stripPrivateInfoFromUser } from "../../schemas";

export function initInitialRoute(server: SpotifyTakeoverServer, route: string) {
  server.app.get(route, async (req, res) => {
    const authenticityToken = req.cookies.authenticityToken as string | null;
    const tempCode = req.query.tempCode as string | null;
    if (authenticityToken) {
      const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
      if (authenticatedUser) {
        const masterPermissionLink = !authenticatedUser.masterRefreshToken
          ? server.applicationSpotify.getMasterAuthUrl(authenticatedUser.authenticityToken)
          : undefined;
        const slavePermissionLink = !authenticatedUser.slaveRefreshToken
          ? server.applicationSpotify.getSlaveAuthUrl(authenticatedUser.authenticityToken)
          : undefined;
        const linkedSpotifyUser = server.linkedSpotify?.user
          ? stripPrivateInfoFromUser(server.linkedSpotify!.user)
          : undefined;
        const playback = await server.linkedSpotify?.client.getCurrentPlayback();
        const activeTakeoverUser = server.activeTakeoverInfo
          ? stripPrivateInfoFromUser(server.activeTakeoverInfo.user)
          : undefined;

        const response: InitialRequestResponse = {
          ok: true,
          user: stripPrivateInfoFromUser(authenticatedUser),
          slavePermissionLink,
          masterPermissionLink,
          activeTakeoverUser,
          playback,
          linkedSpotifyUser,
        };
        res.status(200).send(response);
        return;
      }
    }
    console.log("Initial request without authenticityToken, sending authentication link");
    const spotifyAuthUrl = server.applicationSpotify.getUserSpotifyAuthUrl(tempCode ?? "no-code-provided");
    console.log("Spotify Auth url: ", spotifyAuthUrl);
    res.status(200).send({ authRequired: spotifyAuthUrl });
  });
}
