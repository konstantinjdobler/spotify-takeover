export type InitialRequestResponse = OKInitialRequestResponse | AuthRequiredInitialRequestResponse;
export type OKInitialRequestResponse = {
  ok: true;
  playback?: SpotifyApi.CurrentlyPlayingObject;
  linkedSpotifyUser?: PublicUser;
  user: PublicUser;
  masterPermissionLink?: string;
  slavePermissionLink?: string;
  userIsLiveListening: boolean;
  activeWishedSongInfo?: { user: PublicUser };
  wishSongsLeft?: number;
  currentlyLiveListening: string[];
};
export type UserCapabilities = {
  linkSpotify: boolean;
  wishSongs: number;
  liveListen: boolean;
};
export type PublicUser = {
  name: string;
  spotify: SpotifyApi.UserObjectPrivate;
  capabilities: UserCapabilities;
};

export const UNLIMITED_SONGS_NUMBER = 100_000;

export type AuthRequiredInitialRequestResponse = { authRequired?: string };

export function authRequired(response: InitialRequestResponse): response is AuthRequiredInitialRequestResponse {
  return !!(response as AuthRequiredInitialRequestResponse).authRequired;
}

export function isOK(response: InitialRequestResponse): response is OKInitialRequestResponse {
  return !!(response as OKInitialRequestResponse).ok;
}

export const actions = {
  permissionGranted: "permission-granted",
  signupError: "signup-error",
  loginSuccessful: "login-successful",
  signupSuccessful: "signup-successful",
  startSignup: "start-signup",
  createSignupLink: "create-signup-link",
};

export const routes = {
  skipInjectedSong: "/api/skip-song-injection",
  injectSong: "/api/inject-song",
  search: "/api/search",
  stopLiveListen: "/api/stop-live-listen",
  liveListen: "/api/live-listen",
  unlinkSpotifyAccount: "/api/unlink-spotify-account",
  linkSpotifyAccount: "/api/change-roadtrip-device",
  afterSpotifyAuth: "/api/after-spotify-auth",
  takeover: "/api/takeover",
  stopTakeover: "/api/stop-takeover",
  initial: "/api/initial",
  createSignupLink: "/api/create-signup-link",
};
