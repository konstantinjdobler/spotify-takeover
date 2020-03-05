import React from "react";
import { Typography, CardContent, Card, Grid, CardMedia } from "@material-ui/core";

import { PublicUser } from "../sharedTypes";

export default class CurrentRoadtripDevice extends React.Component<
  {
    activeWishSongUser?: PublicUser;
    playbackInfo?: SpotifyApi.CurrentlyPlayingObject;
    slavePermissionLink?: string;
  },
  {}
> {
  render() {
    return (
      <Card elevation={1}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12}>
              <Typography component="h5" variant="h5">
                {this.props.playbackInfo?.item?.name || "No music is currently playing"}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                {this.props.playbackInfo?.item?.artists.map(artist => artist.name).join(", ")}
              </Typography>
              {this.props.activeWishSongUser && (
                <Typography variant="subtitle1" color="textPrimary">
                  {`This song was requested by ${this.props.activeWishSongUser.name}`}
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
        <CardMedia
          style={{ height: 0, width: "100%", paddingTop: "56.25%" }}
          image={this.props.playbackInfo?.item?.album.images[0].url || require("./unknown_song.jpg")}
        />
      </Card>
    );
  }
}
