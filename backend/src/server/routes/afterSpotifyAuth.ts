import SpotifyTakeoverServer from "../SpotifyTakeover";
import Persistence from "../../wrappers/MongoDB";
import { SpotifyCallbackState } from "../../schemas";
import { SpotifyClient } from "../../wrappers/SpotifyAPI";
import { makeID } from "../server-utils";
import { actions } from "../../sharedTypes";

export function initAfterSpotifyAuth(server: SpotifyTakeoverServer, route: string) {
  server.app.get("/api/after-spotify-auth", async (req, res) => {
    const code = req.query.code;
    console.log("Retrieved authorization code from spotify: ", code);
    const refreshToken = await server.applicationSpotify.getRefreshToken(code);
    console.log("Retrieved refresh token from spotify: ", refreshToken);

    const state: SpotifyCallbackState = JSON.parse(req.query.state);

    if (state.slaveScope) {
      await Persistence.addSlaveRefreshTokenToUser(state.authenticityToken, refreshToken);
      res.redirect(server.frontendUrl + `?action=${actions.permissionGranted}`);
    }
    if (state.masterScope) {
      await Persistence.addMasterRefreshTokenToUser(state.authenticityToken, refreshToken);
      res.redirect(server.frontendUrl + `?action=${actions.permissionGranted}`);
    }
    if (state.basicScope) {
      const validTempInfo = await Persistence.validateTempCode(state.tempCode);
      const userInfo = await new SpotifyClient(refreshToken).getUserInfo();
      if (validTempInfo) {
        const authenticityToken = makeID(10);
        await Persistence.addUser(
          authenticityToken,
          userInfo,
          refreshToken,
          validTempInfo.name,
          validTempInfo.capabilities,
        );
        console.log("Sending new authenticityToken with response", authenticityToken);
        res.redirect(server.frontendUrl + `?action=${actions.signupSuccessful}&authenticityToken=${authenticityToken}`);
        return;
      }
      const previouslyKnownUser = await Persistence.userForSpotifyID(userInfo.id);
      if (previouslyKnownUser) {
        console.log("Previously known user logging in");
        res.redirect(
          server.frontendUrl +
            `?action=${actions.loginSuccessful}&authenticityToken=${previouslyKnownUser.authenticityToken}`,
        );
      } else {
        console.log("Invalid tempCode for unkown user");
        res.redirect(server.frontendUrl + `?action=${actions.signupError}`);
      }
    }
  });
}
