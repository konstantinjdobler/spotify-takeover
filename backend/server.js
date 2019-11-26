import SpotifyAPI from "./SpotifyAPI.js";

const express = require("express");
require("dotenv").config();

const app = express();
const SECRET = process.env.SECRET;
const spotifyAPI = new SpotifyAPI(
  process.env.REFRESH_TOKEN,
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI,
  process.env.DAILY_SONGS_PLAYLIST_ID,
  process.env.SELECION_PLAYLIST_ID,
);

app.use(express.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

app.get("/songs-of-the-day", async function(req, res) {
  const dailySongs = await spotifyAPI.getDailySongs();
  res.status(200).json({ d: dailySongs });
});

app.post("/vote", async function(req, res) {
  console.log(req.body);
});

app.post("/add-song-to-selecion", async function(req, res) {
  const trackURI = req.body.trackURI;
  const providedSecret = req.body.secret;
  if (providedSecret !== SECRET) res.status(401).send("Unauthorized. Make another guess. I dare you.");
  await spotifyAPI.addSongToPlaylist(trackURI);
  res.status(200).send("Added");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

async function test() {
  const dailySongs = await spotifyAPI.getDailySongs();
  console.log(dailySongs);
}
