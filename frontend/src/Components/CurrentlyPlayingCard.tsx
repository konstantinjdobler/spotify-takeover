import React from "react";
import { Typography, CardContent, Card, Grid, CardMedia, IconButton } from "@material-ui/core";

import { PublicUser, routes } from "../sharedTypes";
import { PlayArrow, SkipNext } from "@material-ui/icons";
import { API_URL, delay } from "../utils";
import { LoadingIconButton } from "./LoadingCapableButton";
export default class CurrentRoadtripDevice extends React.Component<
  {
    currentUserIsLinked: boolean;
    activeWishSongUser?: PublicUser;
    playbackInfo?: SpotifyApi.CurrentlyPlayingObject;
    slavePermissionLink?: string;
    requestServerStateUpdate: () => Promise<void>;
  },
  { loadingSkip: boolean }
> {
  state = { loadingSkip: false };
  skipInjectSong = async () => {
    await fetch(API_URL + routes.skipInjectedSong, { credentials: "include" });
    await delay(500);
    setTimeout(this.props.requestServerStateUpdate, 2000);
    return this.props.requestServerStateUpdate();
  };
  render() {
    const canSkipActiveInjectedSong = this.props.activeWishSongUser && this.props.currentUserIsLinked;
    return (
      <Card elevation={1}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={canSkipActiveInjectedSong ? 10 : 12}>
              <Typography variant="h5" display="inline">
                {this.props.playbackInfo?.item?.name || "We're not playing any music right now"}
              </Typography>
              {this.props.activeWishSongUser && (
                <Typography variant="subtitle1" display="inline" color="textSecondary">
                  {` - requested by ${this.props.activeWishSongUser.name}`}
                </Typography>
              )}
              {this.props.playbackInfo?.item && !this.props.playbackInfo?.is_playing && (
                <Typography variant="subtitle1" display="inline" color="textSecondary">
                  {" (Currently paused)"}
                </Typography>
              )}
              {!this.props.playbackInfo?.item?.name && (
                <Typography variant="subtitle1" color="textSecondary">
                  Don't worry, we'll make it through this time together
                </Typography>
              )}
              <Typography variant="subtitle1" color="textSecondary">
                {this.props.playbackInfo?.item?.artists.map(artist => artist.name).join(", ")}
              </Typography>
            </Grid>
            {canSkipActiveInjectedSong && (
              <Grid item xs={2}>
                <LoadingIconButton
                  loading={this.state.loadingSkip}
                  onClick={async () => {
                    this.setState({ loadingSkip: true });
                    await this.skipInjectSong();
                    this.setState({ loadingSkip: false });
                  }}
                >
                  <SkipNext fontSize="large" />
                </LoadingIconButton>
              </Grid>
            )}
          </Grid>
        </CardContent>
        <CardMedia
          style={{ height: 0, width: "100%", paddingTop: "56.25%" }}
          image={this.props.playbackInfo?.item?.album.images[0].url || require("./alcohol-song.jpg")}
        />
      </Card>
    );
  }
}
