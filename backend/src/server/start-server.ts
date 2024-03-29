import { SpotifyClient, SpotifyApiCredentials } from "../wrappers/SpotifyAPI";
import SpotifyTakeoverServer from "./SpotifyTakeover";
require("dotenv").config();

const developmentMode = process.env.NODE_ENV !== "production";

const developRedirectUri = "http://mousiki1234567.serverless.social/api/after-spotify-auth";
const spotifyAuthCallback = developmentMode ? developRedirectUri : process.env.REDIRECT_URI!;
const frontendUrl = developmentMode ? "http://localhost:3000" : process.env.FRONTEND_URL!;

const spotifyCredentials: SpotifyApiCredentials = {
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  redirectUri: spotifyAuthCallback,
};
SpotifyClient.setCredentials(spotifyCredentials);
const spotifyAppUserClient = new SpotifyClient(process.env.APP_USER_REFRESH_TOKEN!);

const dailySongVoteServer = new SpotifyTakeoverServer(spotifyAppUserClient, frontendUrl, developmentMode);

dailySongVoteServer.start(parseInt(process.env.PORT!));
