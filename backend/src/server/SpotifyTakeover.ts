import express from "express";
import { Application, Response as ExpressResponse } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
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
    this.app.get("/api/after-spotify-auth", async (req, res) => {
      const code = req.query.code;
      console.log("Retrieved authorization code from spotify: ", code);
      const refreshToken = await this.applicationSpotify.getRefreshToken(code);
      console.log("Retrieved refresh token from spotify: ", refreshToken);
      if (req.query.state === "app-user") return;

      const userInfo = await new SpotifyClient(refreshToken).getUserInfo();
      // if (!this.spotifyUserWhitelist.includes(userInfo.id)) {
      //   console.log("Unauthorized user attempted to login", userInfo);
      //   res.status(401).send({ error: "Unauthorized user, sucker" });
      // }
      const votingToken = makeID(10);
      await Persistence.addUser(votingToken, userInfo, refreshToken);
      console.log("Sending new authenticityToken with response", votingToken);
      res.redirect(this.frontendUrl + "?authenticityToken=" + votingToken);
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
      const authenticityToken = req.cookies.authenticityToken;
      if (!authenticityToken) {
        console.log("Initial request without authenticityToken, sending authentication link");
        const spotifyAuthUrl = this.applicationSpotify.getUserAuthUrl();
        console.log("Spotify Auth url: ", spotifyAuthUrl);
        res.status(200).send({ authRequired: spotifyAuthUrl });
        return;
      }
      const authenticatedUser = await Persistence.getUserForToken(authenticityToken);
      if (authenticatedUser) {
        console.log("User authenticated", authenticatedUser.spotify.display_name);
        res.status(200).send({ ok: "ok", user: authenticatedUser.spotify });
      } else {
        console.log("Initial Request with invalid authenticity, sending authentication link", authenticityToken);
        const spotifyAuthUrl = this.applicationSpotify.getUserAuthUrl();
        console.log("Spotify Auth url: ", spotifyAuthUrl);
        res.status(200).send({ authRequired: spotifyAuthUrl });
      }
    });
  }
}
