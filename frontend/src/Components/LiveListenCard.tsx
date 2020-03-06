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
import { routes } from "../sharedTypes";
import { LoadingButton } from "./LoadingCapableButton";

export default class LiveListenCard extends React.Component<
  {
    slavePermissionLink?: string;
    userIsLiveListening: boolean;
    currentlyPlayingMusic: boolean;
    permission: boolean;
    currentUserIslinked: boolean;
    currentlyLiveListening: string[];
    requestServerStateUpdate: () => void;
  },
  { dialogOpen: boolean; dialogSliderValue: number; loading: boolean }
> {
  state = {
    loading: false,
    dialogOpen: false,
    dialogSliderValue: 15,
  };
  startLiveListen = async () => {
    await fetch(`${API_URL}${routes.liveListen}?duration=${this.state.dialogSliderValue * 60 * 1000}`, {
      method: "GET",
      credentials: "include",
    });
    this.setState({ dialogSliderValue: 15 });
    await this.props.requestServerStateUpdate();
  };

  stopLiveListen = async () => {
    console.log("jojojo");
    await fetch(`${API_URL}${routes.stopLiveListen}`, {
      method: "GET",
      credentials: "include",
    });
    await this.props.requestServerStateUpdate();
  };

  GrantPermissionsButton = () => (
    <Button variant="outlined" color="primary" href={this.props.slavePermissionLink}>
      Grant permissions
    </Button>
  );
  StartLiveListenButton = () => (
    <Button variant="outlined" color="primary" onClick={() => this.setState({ dialogOpen: true })}>
      Start listening!
    </Button>
  );

  StopLiveListenButton = () => (
    <LoadingButton
      loading={this.state.loading}
      variant="outlined"
      color="primary"
      onClick={async () => {
        this.setState({ loading: true });
        await this.stopLiveListen();
        this.setState({ loading: false });
      }}
    >
      Stop live listening!
    </LoadingButton>
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
        <LoadingButton
          variant="outlined"
          color="primary"
          loading={this.state.loading}
          onClick={async () => {
            this.setState({ loading: true });
            await this.startLiveListen();
            this.setState({ dialogOpen: false, loading: false });
          }}
        >
          Start listening!
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  CannotLiveListenButton = () => (
    <Button variant="outlined" disabled>
      No music currently playing
    </Button>
  );
  handleDialogClose = () => {
    this.setState({ dialogOpen: false });
  };

  CurrentlyLiveListening = () => {
    if (!this.props.currentlyLiveListening || this.props.currentlyLiveListening.length === 0) return <></>;
    return (
      <Typography variant="body1" color="textPrimary">
        {`Currently listening: ${this.props.currentlyLiveListening.join(", ")}`}
      </Typography>
    );
  };

  AppropriateButton = () =>
    this.props.slavePermissionLink
      ? this.GrantPermissionsButton()
      : this.props.userIsLiveListening
      ? this.StopLiveListenButton()
      : this.props.currentlyPlayingMusic
      ? this.StartLiveListenButton()
      : this.CannotLiveListenButton();

  render() {
    if (!this.props.permission) {
      return (
        <Card elevation={0}>
          <CardContent>
            <Typography variant="body1" color="textPrimary">
              Unfortunately you can't use this feature.
            </Typography>
            <this.CurrentlyLiveListening />
          </CardContent>
        </Card>
      );
    }
    if (this.props.currentUserIslinked) {
      return (
        <Card elevation={0}>
          <CardContent>
            <Typography variant="body1" color="textPrimary">
              You are currently linked - you don't need to use this feature..
            </Typography>
            <Typography variant="body1" color="textSecondary">
              This will magically play every song we are listening to on your spotify account! Don't worry you can
              always stop listening if you get sick of our music...
            </Typography>
            <this.CurrentlyLiveListening />
          </CardContent>
        </Card>
      );
    }
    if (this.props.currentlyLiveListening.length >= 4 && !this.props.userIsLiveListening) {
      return (
        <Card elevation={0}>
          <CardContent>
            <Typography variant="body1" color="textPrimary">
              There are too many people listening right now, we don't want the server to explode :( Try again later!
            </Typography>
            <Typography variant="body1" color="textSecondary">
              This will magically play every song we are listening to on your spotify account! Don't worry you can
              always stop listening if you get sick of our music...
            </Typography>
            <this.CurrentlyLiveListening />
          </CardContent>
        </Card>
      );
    }
    return (
      <Card elevation={0}>
        <CardContent>
          <Typography variant="body1" color="textSecondary">
            This will magically play every song we are listening to on your spotify account! Don't worry you can always
            stop listening if you get sick of our music...
          </Typography>
          <this.CurrentlyLiveListening />

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
