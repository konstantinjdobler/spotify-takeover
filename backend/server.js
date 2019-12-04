/* eslint-disable require-jsdoc */
import SpotifyAppUserClient, { SpotifyUserAuth } from "./SpotifyAPI.js";
import Persistence from "./Persistence";
import { schduleCron } from "./cronjob";
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

require("dotenv").config();
schduleCron();
const app = express();
const SECRET = process.env.SECRET;
const isDevelop = process.env.NODE_ENV !== "production";
console.log("Starting in development mode: (true | false)", isDevelop);
const developRedirectUri = "https://mousiki1234.localtunnel.me/after-spotify-auth";

const spotifyAuthCallback = isDevelop ? developRedirectUri : process.env.REDIRECT_URI;
const frontendUrl = isDevelop ? "http://localhost:3000" : process.env.FRONTEND_URL;

const spotifyUserWhitelist = process.env.SPOTIFY_USER_WHITELIST.split(",");
const spotifyAppUser = new SpotifyAppUserClient(
  process.env.APP_USER_REFRESH_TOKEN,
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  spotifyAuthCallback,
  process.env.DAILY_SONGS_PLAYLIST_ID,
  process.env.SELECION_PLAYLIST_ID,
);

SpotifyUserAuth.init(process.env.CLIENT_ID, process.env.CLIENT_SECRET, spotifyAuthCallback);
const axios = require("axios");
const qs = require("querystring");

async function getRefreshToken(code) {
  const body = {
    grant_type: "authorization_code",
    code,
    redirect_uri: spotifyAuthCallback,
  };
  return axios
    .post(`https://accounts.spotify.com/api/token`, qs.stringify(body), {
      headers: {
        Authorization: `Basic ${new Buffer(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString(
          "base64",
        )}`,
      },
    })
    .catch(e => console.log(e))
    .then(response => response.data);
}

function makeID(length) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
app.use(express.json());
app.use(cookieParser());

const corsOptions = isDevelop
  ? {
      origin: "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST"],
      allowedheaders: ["Cookie"],
    }
  : {
      origin: "https://vote.konstantin-dobler.de",
      credentials: true,
      methods: ["GET", "POST"],
      allowedheaders: ["Cookie"],
    };
app.use(cors(corsOptions));

app.get("/songs-of-the-day", async function(req, res) {
  try {
    const dailySongs = await spotifyAppUser.getDailySongs();
    res.status(200).json({ d: dailySongs });
  } catch (error) {
    console.log("Error while getting songs of the day", error);
    res.status(500).send();
  }
});

app.post("/vote", async function(req, res) {
  const votingToken = req.cookies.votingToken;

  if (!(await Persistence.checkVotingToken(votingToken))) {
    console.log("Unauthorized voting attempt, votingToken:", votingToken);
    res.status(401).send({ error: "Unauthorized" });
    return;
  }

  const totalVotes = req.body.votes.reduce((count, curr) => (count += curr.vote), 0);
  if (totalVotes > 5) {
    console.log("Voting attempt with more than 5 points, votingToken:", votingToken);
    res.status(400).send("Nice try Mot$!#fu#@er");
    return;
  }
  await Persistence.addVote(votingToken, req.body.votes);
  res.status(201).send({ ok: "created" });
});

app.get("/after-spotify-auth", async function(req, res) {
  const code = req.query.code;
  console.log("Retrieved authorization code from spotify: ", code);
  const refreshToken = (await getRefreshToken(code)).refresh_token;
  console.log("Retrieved refresh token from spotify: ", refreshToken);
  const userInfo = await SpotifyUserAuth.getUserInfo(refreshToken);
  if (!spotifyUserWhitelist.includes(userInfo.id)) {
    console.log("Unauthorized user attempted to login", userInfo);
    res.status(401).send({ error: "Unauthorized user, sucker" });
  }
  const votingToken = makeID(10);
  await Persistence.addUser(votingToken, userInfo, refreshToken);
  console.log("Sending new votingToken with response", votingToken);
  res.redirect(frontendUrl + "?votingToken=" + votingToken);
});

app.get("/initial", async function(req, res) {
  const cookieVotingToken = req.cookies.votingToken;
  const validVotingToken = await Persistence.checkVotingToken(cookieVotingToken);
  if (cookieVotingToken && validVotingToken) {
    console.log("User authenticated", cookieVotingToken);
    res.status(200).json({ ok: "ok" });
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

app.post("/add-song-to-selecion", async function(req, res) {
  try {
    const trackURI = req.body.trackURI;
    const providedSecret = req.body.secret;
    if (providedSecret !== SECRET) res.status(401).send("Unauthorized. Make another guess. I dare you.");
    await spotifyAppUser.addSongToPlaylist(trackURI);
    res.status(200).send("Added");
  } catch (error) {
    console.log("Error while adding song to seleçion", error);
    res.status(500).send();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
