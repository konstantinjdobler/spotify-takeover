import express from "express";
import { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import basicAuth from "express-basic-auth";
import { SetIntervalAsyncTimer } from "set-interval-async/dynamic";

import { SpotifyClient } from "../wrappers/SpotifyAPI";
import Persistence from "../wrappers/MongoDB";
import { makeID } from "./server-utils";
import { FullUser } from "../schemas";
import { initLinkSpotify, initUnlinkSpotify } from "./routes/linkSpotifyAccount";
import { initInitialRoute } from "./routes/initial";
import { initAfterSpotifyAuth } from "./routes/afterSpotifyAuth";
import { initLiveListen, initStopLiveListen } from "./routes/liveListen";
import { actions, routes } from "../sharedTypes";
import { initSearch, initSongInjection, initSkipSongInjection } from "./routes/search";
require("dotenv").config();

export default class SpotifyTakeoverServer {
  public app: Application;
  public readonly takeoverDurationMS = 600_000; // 10 min
  public readonly maxKeepAliveMS = 36_000_000; // 10 h

  public activeWishedSongInfo?: {
    timestamp: number;
    timeout?: NodeJS.Timeout;
    user: FullUser;
    wishedSong: SpotifyApi.TrackObjectFull;
    previousPlayback: SpotifyApi.CurrentlyPlayingObject;
  };
  public liveListen: {
    [authenticityToken: string]:
      | {
          user: FullUser;
          interval: SetIntervalAsyncTimer;
          previousPlayback: SpotifyApi.CurrentlyPlayingObject;
        }
      | undefined;
  } = {};
  public linkedSpotify?: { client: SpotifyClient; user: FullUser };
  constructor(public applicationSpotify: SpotifyClient, public frontendUrl: string, private developmentMode: boolean) {
    this.app = express();
    this.initExpressApp();
    this.initRoutes();
  }

  start(port: number) {
    this.developmentMode
      ? console.log("Starting server in development mode...")
      : console.log("Starting server in production mode...");
    this.app.listen(port, "0.0.0.0", () => {
      console.log(`Server listening on port ${port}`);
    });
  }

  initExpressApp() {
    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use(routes.createSignupLink, basicAuth({ challenge: true, users: { admin: "admin" } }));
    this.app.use(
      cors({
        origin: this.frontendUrl,
        credentials: true,
        methods: ["GET", "POST"],
      }),
    );
  }

  /// ##### Route Handlers ###### ///

  initRoutes() {
    this.app.get(routes.createSignupLink, async (req, res) => {
      const name = req.query.name;
      const wishSongs = parseInt(req.query.wishSongs);
      const liveListen = req.query.liveListen === "true";
      const linkSpotify = req.query.linkSpotify === "true";

      const tempCode = makeID(20);
      Persistence.addTemp(tempCode, name, { wishSongs, linkSpotify, liveListen });

      res.status(200).send(`${this.frontendUrl}?action=${actions.startSignup}&tempCode=${tempCode}`);
    });
    initSongInjection(this, routes.injectSong);
    initSkipSongInjection(this, routes.skipInjectedSong);
    initSearch(this, routes.search);
    initLiveListen(this, routes.liveListen);
    initStopLiveListen(this, routes.stopLiveListen);
    initLinkSpotify(this, routes.linkSpotifyAccount);
    initUnlinkSpotify(this, routes.unlinkSpotifyAccount);
    initInitialRoute(this, routes.initial);
    initAfterSpotifyAuth(this, routes.afterSpotifyAuth);
  }
}

type RouteInit = (server: SpotifyTakeoverServer, route: string) => void;
