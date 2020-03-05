import { PublicUser, UserCapabilities } from "./sharedTypes";

/**
 * IMPORTANT: Ensure the private property list up-to-date with the actual interface
 */
export function stripPrivateInfoFromUser(fullUser: FullUser) {
  const nulledPrivateProperties = {
    refreshToken: undefined,
    authenticityToken: undefined,
    slaveRefreshToken: undefined,
    masterRefreshToken: undefined,
    _id: undefined,
  };
  return { ...fullUser, ...nulledPrivateProperties };
}
export interface FullUser extends PublicUser {
  refreshToken: string;
  authenticityToken: string;
  slaveRefreshToken?: string;
  masterRefreshToken?: string;
}

export interface Temp {
  tempCode: string;
  name: string;
  used: boolean;
  capabilities: UserCapabilities;
}

export type SongInjectionEvent = {
  authenticityToken: string;
  timestamp: string;
  songURI: string;
};
export type TrackURI = string;

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
