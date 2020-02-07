import express, { Request } from "express";
import { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import basicAuth from "express-basic-auth";
import { setIntervalAsync, clearIntervalAsync, SetIntervalAsyncTimer } from "set-interval-async/dynamic";

import { SpotifyClient } from "../wrappers/SpotifyAPI";
import Persistence from "../wrappers/MongoDB";
import { makeID } from "./server-utils";
import { User } from "src/schemas";
import { initChangeRoadtripDevice } from "./routes/changeRoadtripDevice";
import { initInitialRoute } from "./routes/initial";
import { initTakeover, initStopTakeover } from "./routes/takeover";
import { initAfterSpotifyAuth } from "./routes/afterSpotifyAuth";
import { actions, routes } from "src/sharedTypes";
require("dotenv").config();

export default class SpotifyTakeoverServer {
  public app: Application;
  public readonly takeoverDurationMS = 60000;
  public activeTakeoverInfo?: { user: User; interval: SetIntervalAsyncTimer };
  public currentRoadtripDeviceSpotify?: SpotifyClient;
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
      const isRoadtripParticipant = req.query.name;

      const tempCode = makeID(20);
      Persistence.addTemp(tempCode, name, isRoadtripParticipant);

      res.status(200).send(`${this.frontendUrl}?action=${actions.createSignupLink}&tempCode=${tempCode}`);
    });
    initTakeover(this, routes.takeover);
    initStopTakeover(this, routes.stopTakeover);
    initChangeRoadtripDevice(this, routes.changeRoadtripDevice);
    initInitialRoute(this, routes.initial);
    initAfterSpotifyAuth(this, routes.afterSpotifyAuth);
  }
}

type RouteInit = (server: SpotifyTakeoverServer, route: string) => void;
