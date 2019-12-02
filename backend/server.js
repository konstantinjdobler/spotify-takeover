import SpotifyAppUserClient, { SpotifyUserAuth } from "./SpotifyAPI.js";
import Persistence from "./Persistence";
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

require("dotenv").config();

const app = express();
const SECRET = process.env.SECRET;
const isDevelop = process.env.NODE_ENV !== "production";
const developRedirectUri = "https://mousiki.localtunnel.me/after-spotify-auth";

const spotifyAuthCallback = isDevelop ? developRedirectUri : process.env.REDIRECT_URI;
const frontendUrl = isDevelop ? "http://localhost:3000" : process.env.FRONTEND_URL;

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
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
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
  : undefined;
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
  console.log(req.body);
  const votingToken = req.cookies.votingToken;
  if (!Persistence.votingTokens[votingToken]) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }

  const totalVotes = req.body.votes.reduce((count, curr) => (count += curr.vote), 0);
  if (totalVotes > 5) {
    res.status(400).send("Nice try Mot$!#fu#@er");
    return;
  }
  const today = new Date().toDateString();
  const voterID = Persistence.votingTokens[votingToken].user.id;
  if (!Persistence.votes[today]) Persistence.votes[today] = {};
  Persistence.votes[today][voterID] = req.body.votes;
  console.log("Current vote status", Persistence.votes[today]);
});

app.get("/after-spotify-auth", async function(req, res) {
  const code = req.query.code;
  console.log("Retrieved authorization code from spotify: ", code);
  const refreshToken = (await getRefreshToken(code)).refresh_token;
  console.log("Retrieved refresh token from spotify: ", refreshToken);
  const userInfo = await SpotifyUserAuth.getUserInfo(refreshToken);
  console.log(userInfo);
  const existingToken = Persistence.userHasStaleToken(userInfo.id);
  let issuedToken;
  if (existingToken) {
    //res.cookie("votingToken", existingToken, { overwrite: true });
    console.log("Sending old votingToken with response", existingToken);
    issuedToken = existingToken;
  } else {
    console.log(Persistence.votingTokens);
    const votingToken = makeID(10);
    Persistence.votingTokens[votingToken] = { user: userInfo, refreshToken };
    issuedToken = votingToken;
    console.log("Sending new votingToken with response", votingToken);
  }
  res.redirect(frontendUrl + "?votingToken=" + issuedToken);
});

app.get("/initial", async function(req, res) {
  console.log(Persistence.votingTokens);
  const cookieVotingToken = req.cookies.votingToken;
  if (cookieVotingToken && Persistence.votingTokens[cookieVotingToken]) {
    console.log("User authenticated", cookieVotingToken);
    res.status(200).json({ ok: "ok" });
  } else if (cookieVotingToken && !Persistence.votingTokens[cookieVotingToken]) {
    console.log("auth token invalid", cookieVotingToken);
    //res.status(401).json({ error: "Boi boi boi, you made a mistake. dont ever try to edit these cookies again" });
    const spotifyAuthUrl = SpotifyUserAuth.getAuthorizeURL();
    console.log("Spotify Auth url: ", spotifyAuthUrl);
    res.status(200).json({ authRequired: spotifyAuthUrl });
  } else {
    const spotifyAuthUrl = SpotifyUserAuth.getAuthorizeURL();
    console.log("Spotify Auth url: ", spotifyAuthUrl);

    res.status(200).json({ authRequired: spotifyAuthUrl });
    console.log("Initiating user authentication");
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
