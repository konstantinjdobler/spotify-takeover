
export interface User {
  refreshToken: string;
  votingToken: string;
  user: SpotifyApi.UserObjectPublic;
}

export type InitialRequestResponse = {
  authRequired?: string;
  user?: SpotifyApi.UserObjectPublic;
};

export type TakeoverEvent = {
  userID: string;
  timestamp: string;
  orderedSongs: PlaybackEvent[]
}
export type TrackURI = string
export type PlaybackEvent = {
  song: TrackURI
  duration: number
}