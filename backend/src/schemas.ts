
export interface User {
  refreshToken: string;
  votingToken: string;
  user: SpotifyApi.UserObjectPublic;
}

export type InitialRequestResponse = {
  authRequired?: string;
  user?: SpotifyApi.UserObjectPublic;
};

export type VoteRequestResponse = { error?: string; ok?: string };
export type TakeoverEvent = {
  userID: string;
  timestamp: string;
  orderedSongs: PlaybackEvent[]
}
type TrackURI = string
type PlaybackEvent = {
  song: TrackURI
  duration: number
}