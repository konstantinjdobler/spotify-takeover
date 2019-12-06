export interface SongRating {
  value: number;
  trackURI: string;
}

export interface Vote {
  votingDate: string;
  user: string;
  ratings: SongRating[];
}
export interface User {
  refreshToken: string;
  votingToken: string;
  user: SpotifyApi.UserObjectPublic;
}

export type InitialRequestResponse = {
  authRequired?: string;
  user?: SpotifyApi.UserObjectPublic;
};

export type VoteRequest = {
  votes: SongRating[];
};

export type VoteRequestResponse = { error?: string; ok?: string };
