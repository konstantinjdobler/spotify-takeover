export interface User {
  refreshToken: string;
  authenticityToken: string;
  spotify: SpotifyApi.UserObjectPublic;
  slaveRefreshToken?: string;
  name: string;
}

export interface Temp {
  tempCode: string;
  name: string;
  used: boolean;
}

export type InitialRequestResponse = {
  authRequired?: string;
  user?: SpotifyApi.UserObjectPublic;
};

export type TakeoverEvent = {
  spotifyUserID: string;
  timestamp: string;
  orderedSongs: PlaybackEvent[];
};
export type TrackURI = string;
export type PlaybackEvent = {
  song: TrackURI;
  duration: number;
};
