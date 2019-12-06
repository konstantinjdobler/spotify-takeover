export interface PartialVote {
  vote: number;
  trackURI: string;
}

export interface Vote {
  votingDate: string;
  user: string;
  votes: PartialVote[];
}
export interface User {
  refreshToken: string;
  votingToken: string;
  user: SpotifyApi.UserObjectPublic;
}
