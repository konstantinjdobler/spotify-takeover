import React from "react";
import {
  Card,
  Typography,
  CardActions,
  Button,
  CardContent,
  Dialog,
  DialogTitle,
  Slider,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@material-ui/core";
import { API_URL } from "../utils";
import { routes, PublicUser } from "../sharedTypes";

export default class LiveListenCard extends React.Component<
  {
    slavePermissionLink?: string;
    userIsLiveListening: boolean;
    currentlyPlayingMusic: boolean;
    requestServerStateUpdate: () => void;
  },
  { dialogOpen: boolean; dialogSliderValue: number }
> {
  state = {
    dialogOpen: false,
    dialogSliderValue: 15,
  };
  startLiveListen = async () => {
    await fetch(`${API_URL}${routes.liveListen}?duration=${this.state.dialogSliderValue * 60 * 1000}`, {
      method: "GET",
      credentials: "include",
    });
    this.setState({ dialogSliderValue: 0 });
    this.props.requestServerStateUpdate();
  };

  stopLiveListen = async () => {
    console.log("jojojo");
    await fetch(`${API_URL}${routes.stopLiveListen}`, {
      method: "GET",
      credentials: "include",
    });
    this.props.requestServerStateUpdate();
  };

  GrantPermissionsButton = (
    <Button variant="contained" href={this.props.slavePermissionLink}>
      Grant permissions
    </Button>
  );
  StartLiveListenButton = (
    <Button variant="contained" onClick={() => this.setState({ dialogOpen: true })}>
      Start listening!
    </Button>
  );

  StopLiveListenButton = (
    <Button variant="contained" onClick={this.stopLiveListen}>
      Stop live listening!
    </Button>
  );

  marks = [
    { value: 15, label: "15m" },
    { value: 60, label: "1h" },
    { value: 120, label: "2h" },
    { value: 180, label: "3h" },
    { value: 240, label: "4h" },
    { value: 300, label: "5h" },
    { value: 360, label: "6h" },
  ];
  StopLiveListenDialog = () => (
    <Dialog open={this.state.dialogOpen} onClose={this.handleDialogClose}>
      <DialogTitle>Choose Live Listen Duration</DialogTitle>

      <DialogContent>
        <DialogContentText>
          You can always manually stop the Live Listen mode. You might have to open Spotify and start playing any song
          to make your device visible for the Live Listen mode.
        </DialogContentText>
        <Slider
          marks={this.marks}
          valueLabelDisplay="auto"
          valueLabelFormat={value => {
            const minutes = value % 60;
            const hours = Math.floor(value / 60);
            const hoursString = hours > 0 ? `${hours}h` : "";
            const minutesString = minutes > 0 ? minutes : "";
            return hoursString + minutesString;
          }}
          value={this.state.dialogSliderValue}
          onChange={(e, value) => this.setState({ dialogSliderValue: value as number })}
          defaultValue={60}
          min={15}
          max={360}
          step={15}
        ></Slider>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => {
            this.startLiveListen();
            this.setState({ dialogOpen: false });
          }}
        >
          Start listening!
        </Button>
      </DialogActions>
    </Dialog>
  );

  CannotLiveListenButton = (
    <Button variant="contained" disabled>
      No music currently playing
    </Button>
  );
  handleDialogClose = () => {
    this.setState({ dialogOpen: false });
  };

  AppropriateButton = () =>
    this.props.slavePermissionLink
      ? this.GrantPermissionsButton
      : this.props.userIsLiveListening
      ? this.StopLiveListenButton
      : this.props.currentlyPlayingMusic
      ? this.StartLiveListenButton
      : this.CannotLiveListenButton;

  render() {
    return (
      <Card>
        <CardContent>
          <Typography variant="h3">Start listening to the roadtrip music!</Typography>
          <Typography variant="body1" color="textSecondary">
            This will mirror every song played by us in our car to your spotify. Have fun!
          </Typography>
          {this.props.slavePermissionLink && (
            <Typography variant="body1" color="textPrimary">
              You need to grant us more permissions to do that.
            </Typography>
          )}
          {!this.props.currentlyPlayingMusic && (
            <Typography variant="body1" color="textPrimary">
              We are currently not playing any music... Try again later.
            </Typography>
          )}
        </CardContent>
        <CardActions>
          <this.AppropriateButton />
        </CardActions>
        <this.StopLiveListenDialog />
      </Card>
    );
  }
}
