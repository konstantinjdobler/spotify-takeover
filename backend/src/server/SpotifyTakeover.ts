import express from "express";
import { Application, Response as ExpressResponse } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import basicAuth from "express-basic-auth";
import { setIntervalAsync, clearIntervalAsync } from "set-interval-async/dynamic";

import { SpotifyClient } from "../wrappers/SpotifyAPI";
import Persistence from "../wrappers/MongoDB";
import { makeID, getRefreshToken } from "./server-utils";
require("dotenv").config();

export default class SpotifyTakeoverServer {
  private app: Application;
  private takeoverDurationMS = 60000;
  private takeoverActive = false;
  constructor(
    private applicationSpotify: SpotifyClient,
    private spotifyAuthCallback: string,
    private frontendUrl: string,
    private developmentMode: boolean,
  ) {
    this.app = express();
    this.initExpressApp();
    this.initRoutes();
  }

  start(port: number) {
    this.developmentMode
      ? console.log("Starting server in development mode...", this.applicationSpotify.getAppAuthUrl())
      : console.log("Starting server in production mode...");
    this.app.listen(port, "0.0.0.0", () => {
      console.log(`Server listening on port ${port}`);
    });
  }

  initExpressApp() {
    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use("/api/create-signup-link", basicAuth({ challenge: true, users: { admin: "admin" } }));
    this.app.use(
      cors({
        origin: this.frontendUrl,
        credentials: true,
        methods: ["GET", "POST"],
      }),
    );
  }
  takeoverIntervalHandler = async (userSpotify: SpotifyClient) => {
    console.log("iteration of playback check");
    const masterPlayback = await userSpotify.getCurrentPlayback();
    if (!masterPlayback.is_playing || !masterPlayback.item) {
      console.log("master playback not playing");
      this.applicationSpotify.setCurrentPlayback(null);
    } else {
      const slavePlayback = await this.applicationSpotify.getCurrentPlayback();

      if (!slavePlayback.is_playing || slavePlayback.item?.id !== masterPlayback.item.id) {
        await this.applicationSpotify.setCurrentPlayback(masterPlayback.item!.uri);
        await this.applicationSpotify.seekPositionInCurrentPlayback(masterPlayback.progress_ms!);
        //TODO: take timestamp into account to combat http request and polling point differences
      } else if (Math.abs(slavePlayback.progress_ms! - masterPlayback.progress_ms!) > 8000) {
        await this.applicationSpotify.seekPositionInCurrentPlayback(masterPlayback.progress_ms!);
      }
      console.log("master playback", masterPlayback.item.name, masterPlayback.progress_ms);
      console.log("slave playback", slavePlayback.item?.name, slavePlayback.progress_ms);
    }
  };
  initRoutes() {
    this.app.get("/api/create-signup-link", async (req, res) => {
      // TODO: basix auth
      const name = req.query.name;
      const tempCode = makeID(20);

      // persist
      Persistence.addTemp(tempCode, name);

      res.status(200).send(`${this.frontendUrl}?action=complete-signup&tempCode=${tempCode}`);
    });

    this.app.get("/api/after-spotify-auth", async (req, res) => {
      const code = req.query.code;
      console.log("Retrieved authorization code from spotify: ", code);
      const refreshToken = await this.applicationSpotify.getRefreshToken(code);
      console.log("Retrieved refresh token from spotify: ", refreshToken);
      if (req.query.state === "app-user") return;
      console.log(req.query.state);
      const validTempInfo = await Persistence.validateTempCode(req.query.state);
      const userInfo = await new SpotifyClient(refreshToken).getUserInfo();
      if (validTempInfo) {
        const authenticityToken = makeID(10);
        await Persistence.addUser(authenticityToken, userInfo, refreshToken, validTempInfo.name);
        console.log("Sending new authenticityToken with response", authenticityToken);
        res.redirect(this.frontendUrl + "?action=signup-successful&authenticityToken=" + authenticityToken);
        return;
      }
      const previouslyKnownUser = await Persistence.userForSpotifyID(userInfo.id);
      if (previouslyKnownUser) {
        console.log("Previously known user logging in");
        res.redirect(
          this.frontendUrl + "?action=login-successful&authenticityToken=" + previouslyKnownUser.authenticityToken,
        );
      } else {
        console.log("Invalid tempCode for unkown user");
        res.redirect(this.frontendUrl + "?action=signup-error");
      }
    });

    this.app.get("/api/takeover", async (req, res) => {
      //TODO: verify if request is valid
      console.log("Takeover");

      const authenticityToken: string = req.cookies.authenticityToken;
      const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
      if (!authenticatedUser) {
        console.log("Unauthorized voting attempt, votingToken:", authenticityToken);
        res.status(401).send({ error: "Unauthorized" });
        return;
      }
      if (await Persistence.userHasAlreadyHadTakeoverToday(authenticatedUser.spotify.id)) {
        //TODO:reject request
        console.log("Illegal takeover");
      }
      if (this.takeoverActive) {
        return res.status(409).send("Cannot process takeover becasue of currently active takeover");
      }
      this.takeoverActive = true;
      Persistence.addTakeoverEvent(authenticatedUser.spotify);

      const userSpotify = new SpotifyClient(authenticatedUser.refreshToken);
      const interval = setIntervalAsync(() => this.takeoverIntervalHandler(userSpotify), 4000);
      setTimeout(async () => {
        await clearIntervalAsync(interval);
        this.takeoverActive = false;
      }, this.takeoverDurationMS);

      res.status(200);
    });

    this.app.get("/api/initial", async (req, res) => {
      const authenticityToken = req.cookies.authenticityToken as string | null;
      const tempCode = req.query.tempCode as string | null;
      if (authenticityToken) {
        const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
        if (authenticatedUser) {
          console.log("User authenticated", authenticatedUser.spotify.display_name);
          res.status(200).send({ ok: "ok", user: authenticatedUser.spotify });
          return;
        }
      }
      console.log("Initial request without authenticityToken, sending authentication link");
      const spotifyAuthUrl = this.applicationSpotify.getUserAuthUrl(tempCode || "no-code-provided");
      console.log("Spotify Auth url: ", spotifyAuthUrl);
      res.status(200).send({ authRequired: spotifyAuthUrl });
    });
  }
}
