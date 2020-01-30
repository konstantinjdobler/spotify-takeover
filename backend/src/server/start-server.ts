import SpotifyClient, { ApplicationSpotifyClient, SpotifyApiCredentials } from "../wrappers/SpotifyAPI";
import SpotifyTakeoverServer from "./DailySongVoteServer";
require("dotenv").config();

const developmentMode = process.env.NODE_ENV !== "production";

const developRedirectUri = "https://mousiki1234.tunnel.datahub.at/api/after-spotify-auth";
const spotifyAuthCallback = developmentMode ? developRedirectUri : process.env.REDIRECT_URI!;
const frontendUrl = developmentMode ? "http://localhost:3000" : process.env.FRONTEND_URL!;

const spotifyCredentials: SpotifyApiCredentials = {
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  redirectUri: spotifyAuthCallback,
};
SpotifyClient.setCredentials(spotifyCredentials);
const spotifyAppUserClient = new ApplicationSpotifyClient(process.env.APP_USER_REFRESH_TOKEN!);

console.log(process.env.APP_USER_REFRESH_TOKEN!);

const dailySongVoteServer = new SpotifyTakeoverServer(
  spotifyAppUserClient,
  spotifyAuthCallback,
  frontendUrl,
  developmentMode,
);

dailySongVoteServer.start(parseInt(process.env.PORT!));
