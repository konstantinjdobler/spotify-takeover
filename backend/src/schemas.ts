export interface User {
  refreshToken: string;
  authenticityToken: string;
  spotify: SpotifyApi.UserObjectPublic;
  slaveRefreshToken?: string;
  masterRefreshToken?: string;
  name: string;
  isRoadtripParticipant?: boolean;
}

export interface Temp {
  tempCode: string;
  name: string;
  used: boolean;
  isRoadtripParticipant: boolean;
}

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

export type SpotifyCallbackState =
  | {
      masterScope: true;
      slaveScope?: never;
      basicScope?: never;
      authenticityToken: string;
      tempCode?: never;
    }
  | {
      masterScope?: never;
      slaveScope: true;
      basicScope?: never;
      authenticityToken: string;
      tempCode?: never;
    }
  | {
      masterScope?: never;
      slaveScope?: never;
      basicScope: true;
      authenticityToken?: never;
      tempCode: string;
    };
