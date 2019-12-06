/* eslint-disable require-jsdoc */
import express from "express";
import { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import SpotifyAppUserClient, { SpotifyUserAuth } from "../wrappers/SpotifyAPI";
import Persistence from "../wrappers/MongoDB";
import { PartialVote } from "../schemas";
import { makeID, getRefreshToken } from "./server-utils";
require("dotenv").config();

export default class DailySongVoteServer {
  private app: Application;
  constructor(
    private spotifyAPI: SpotifyAppUserClient,
    private spotifyUserWhitelist: string[],
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
      ? console.log("Starting server in development mode...")
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

  initRoutes() {
    this.app.get("/songs-of-the-day", async (req, res) => {
      try {
        const dailySongs = await this.spotifyAPI.getDailySongs();
        res.status(200).json({ d: dailySongs });
      } catch (error) {
        console.log("Error while getting songs of the day", error);
        res.status(500).send();
      }
    });

    this.app.post("/vote", async (req, res) => {
      const votingToken: string = req.cookies.votingToken;
      const votes: PartialVote[] = req.body.votes;
      const validVotingToken = await Persistence.checkVotingToken(votingToken);
      if (!validVotingToken) {
        console.log("Unauthorized voting attempt, votingToken:", votingToken);
        res.status(401).send({ error: "Unauthorized" });
        return;
      }
      const authenticatedUser = validVotingToken.user.id;
      const totalVotes = votes.reduce((count, currentPartialVote) => (count += currentPartialVote.vote), 0);
      if (totalVotes > 5) {
        console.log("Voting attempt with more than 5 points, user:", authenticatedUser);
        res.status(400).send("Nice try Mot$!#fu#@er");
        return;
      }
      const todaysSongs = await this.spotifyAPI.getDailySongs();
      if (!todaysSongs) return;
      for (const vote of req.body.votes) {
        const songInTodaysSongs = todaysSongs.find(song => song.track.uri === vote.trackURI);
        if (!songInTodaysSongs) {
          console.log("Voting attempt for song not in todays songs, user:", authenticatedUser);
          res.status(400).send("Nice try Mot*!#fu#@er");
          return;
        }
        if (songInTodaysSongs.added_by.id === authenticatedUser) {
          console.log("Voting attempt for own song, user:", authenticatedUser);
          res.status(400).send("Nice try Mot$!@fu#@er");
          return;
        }
      }
      await Persistence.addVote(votingToken, req.body.votes);
      res.status(201).send({ ok: "created" });
    });

    this.app.get("/after-spotify-auth", async (req, res) => {
      const code = req.query.code;
      console.log("Retrieved authorization code from spotify: ", code);
      const refreshToken = (await getRefreshToken(code, this.spotifyAuthCallback)).refresh_token;
      console.log("Retrieved refresh token from spotify: ", refreshToken);
      const userInfo = await SpotifyUserAuth.getUserInfo(refreshToken);
      if (!this.spotifyUserWhitelist.includes(userInfo.id)) {
        console.log("Unauthorized user attempted to login", userInfo);
        res.status(401).send({ error: "Unauthorized user, sucker" });
      }
      const votingToken = makeID(10);
      await Persistence.addUser(votingToken, userInfo, refreshToken);
      console.log("Sending new votingToken with response", votingToken);
      res.redirect(this.frontendUrl + "?votingToken=" + votingToken);
    });

    this.app.get("/initial", async function(req, res) {
      const cookieVotingToken = req.cookies.votingToken;
      const validVotingToken = await Persistence.checkVotingToken(cookieVotingToken);
      if (cookieVotingToken && validVotingToken) {
        console.log("User authenticated", validVotingToken.user.display_name);
        res.status(200).json({ ok: "ok", user: validVotingToken.user });
      } else if (cookieVotingToken && !validVotingToken) {
        console.log("Initial Request with invalid votingToken, sending authentication link", cookieVotingToken);
        const spotifyAuthUrl = SpotifyUserAuth.getAuthorizeURL();
        console.log("Spotify Auth url: ", spotifyAuthUrl);
        res.status(200).json({ authRequired: spotifyAuthUrl });
      } else {
        console.log("Initial request without votingToken, sending authentication link");
        const spotifyAuthUrl = SpotifyUserAuth.getAuthorizeURL();
        console.log("Spotify Auth url: ", spotifyAuthUrl);
        res.status(200).json({ authRequired: spotifyAuthUrl });
      }
    });

    this.app.post("/add-song-to-selecion", async (req, res) => {
      try {
        const trackURI = req.body.trackURI;
        const providedSecret = req.body.secret;
        //if (providedSecret !== SECRET) res.status(401).send("Unauthorized. Make another guess. I dare you.");
        await this.spotifyAPI.addSongToPlaylist(trackURI);
        res.status(200).send("Added");
      } catch (error) {
        console.log("Error while adding song to seleçion", error);
        res.status(500).send();
      }
    });
  }
}
