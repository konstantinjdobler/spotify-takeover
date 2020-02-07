export type InitialRequestResponse = OKInitialRequestResponse | AuthRequiredInitialRequestResponse;
export type OKInitialRequestResponse = {
  ok: true;
  playback?: SpotifyApi.CurrentlyPlayingObject;
  user: { name: string; spotify: SpotifyApi.UserObjectPublic };
  activeTakeoverUser?: { name: string; id: string };
  masterPermissionLink?: string;
  slavePermissionLink?: string;
};

export type AuthRequiredInitialRequestResponse = { authRequired?: string };

export function authRequired(response: InitialRequestResponse): response is AuthRequiredInitialRequestResponse {
  return !!(response as AuthRequiredInitialRequestResponse).authRequired;
}

export function isOK(response: InitialRequestResponse): response is OKInitialRequestResponse {
  return !!(response as OKInitialRequestResponse).ok;
}
