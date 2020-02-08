export type InitialRequestResponse = OKInitialRequestResponse | AuthRequiredInitialRequestResponse;
export type OKInitialRequestResponse = {
  ok: true;
  playback?: SpotifyApi.CurrentlyPlayingObject;
  user: PublicUser;
  activeTakeoverUser?: PublicUser;
  masterPermissionLink?: string;
  slavePermissionLink?: string;
};

export type PublicUser = { name: string; spotify: SpotifyApi.UserObjectPublic; isRoadtripParticipant: boolean };

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
  changeRoadtripDevice: "/api/change-roadtrip-device",
  afterSpotifyAuth: "/api/after-spotify-auth",
  takeover: "/api/takeover",
  stopTakeover: "/api/stop-takeover",
  initial: "/api/initial",
  createSignupLink: "/api/create-signup-link",
};
