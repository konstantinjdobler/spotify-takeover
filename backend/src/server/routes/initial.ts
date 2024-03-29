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
        if (
          server.activeWishedSongInfo &&
          server.activeWishedSongInfo.timestamp < Date.now() - 10_000 &&
          server.activeWishedSongInfo.wishedSong.uri !== playback?.item?.uri
        ) {
          console.log("removing active song wish", server.activeWishedSongInfo?.wishedSong.name, playback?.item?.name);
          server.activeWishedSongInfo = undefined;
        }
        const activeWishedSongInfo =
          server.activeWishedSongInfo && server.activeWishedSongInfo.wishedSong.uri === playback?.item?.uri
            ? { user: stripPrivateInfoFromUser(server.activeWishedSongInfo.user) }
            : undefined;
        const userIsLiveListening = !!server.liveListen[authenticityToken];
        const currentlyLiveListening = Object.values(server.liveListen)
          .map(v => v?.user.name)
          .filter(v => v !== undefined) as string[];
        const wishSongsLeft =
          authenticatedUser.capabilities.wishSongs -
          (await Persistence.totalSongInjectionsForUser(authenticatedUser.authenticityToken));
        const response: InitialRequestResponse = {
          ok: true,
          user: stripPrivateInfoFromUser(authenticatedUser),
          slavePermissionLink,
          masterPermissionLink,
          playback,
          linkedSpotifyUser,
          userIsLiveListening,
          activeWishedSongInfo,
          wishSongsLeft,
          currentlyLiveListening,
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
