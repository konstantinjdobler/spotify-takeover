import SpotifyAppUserClient, { SpotifyUserAuth } from "../wrappers/SpotifyAPI";
import { scheduleCron } from "./cronjob";
import DailySongVoteServer from "./DailySongVoteServer";
require("dotenv").config();

const developmentMode = process.env.NODE_ENV !== "production";

const SECRET = process.env.SECRET!;
const developRedirectUri = "https://mousiki123.localtunnel.me/after-spotify-auth";
const spotifyAuthCallback = developmentMode ? developRedirectUri : process.env.REDIRECT_URI!;
const frontendUrl = developmentMode ? "http://localhost:3000" : process.env.FRONTEND_URL!;
const spotifyUserWhitelist = process.env.SPOTIFY_USER_WHITELIST!.split(",");

const spotifyAppUserClient = new SpotifyAppUserClient(
  process.env.APP_USER_REFRESH_TOKEN!,
  process.env.CLIENT_ID!,
  process.env.CLIENT_SECRET!,
  spotifyAuthCallback,
  process.env.DAILY_SONGS_PLAYLIST_ID!,
  process.env.SELECION_PLAYLIST_ID!,
);
SpotifyUserAuth.init(process.env.CLIENT_ID!, process.env.CLIENT_SECRET!, spotifyAuthCallback);

const dailySongVoteServer = new DailySongVoteServer(
  spotifyAppUserClient,
  spotifyUserWhitelist,
  spotifyAuthCallback,
  frontendUrl,
  developmentMode,
);

dailySongVoteServer.start(parseInt(process.env.PORT!));
scheduleCron();
