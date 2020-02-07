import React from "react";
import {
  Button,
  CircularProgress,
  Typography,
  CardContent,
  CardActions,
  Paper,
  Card,
  CardHeader,
  Grid,
  Snackbar,
  Container,
} from "@material-ui/core";
import { Smartphone } from "@material-ui/icons";

export default class CurrentRoadtripDevice extends React.Component<
  { playbackInfo?: SpotifyApi.CurrentlyPlayingObject; slavePermissionLink?: string },
  {}
> {
  render() {
    return (
      <Card>
        <CardHeader title="Currently Playing" titleTypographyProps={{ variant: "h3" }} />
        <CardContent>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Smartphone style={{ fontSize: "8rem" }} />
            </Grid>
            <Grid item xs={6} container>
              <Grid item xs={12}>
                <Typography variant="body1" color="textSecondary" display="inline">
                  {"Device: "}
                </Typography>

                <Typography variant="body1" display="inline">
                  {this.props.playbackInfo?.device?.name}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body1" color="textSecondary" display="inline">
                  {"Track: "}
                </Typography>
                <Typography variant="body1" display="inline">
                  {this.props.playbackInfo?.item?.name}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body1" color="textSecondary" display="inline">
                  {"Artist: "}
                </Typography>
                <Typography variant="body1" display="inline">
                  {this.props.playbackInfo?.item?.artists.map(artist => artist.name).join(", ")}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body1" color="textSecondary" display="inline">
                  {"Status: "}
                </Typography>
                <Typography variant="body1" display="inline">
                  {this.props.playbackInfo?.is_playing ? "playing" : "paused"}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }
}
