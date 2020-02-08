import React from "react";
import { Card, Typography, CardActions, Button, CardContent } from "@material-ui/core";
import { API_URL } from "../utils";
import { routes, PublicUser } from "../sharedTypes";

export default function Takeovercard(props: {
  masterPermissionLink?: string;
  activeTakeoverUser?: PublicUser;
  currentUserSpotifyId?: string;
  requestServerStateUpdate: () => void;
}) {
  async function startTakeover() {
    const response = await fetch(`${API_URL}${routes.takeover}`, {
      method: "GET",
      credentials: "include",
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse);
    props.requestServerStateUpdate();
  }

  async function stopTakeover() {
    const response = await fetch(`${API_URL}${routes.stopTakeover}`, {
      method: "GET",
      credentials: "include",
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse);
    props.requestServerStateUpdate();
  }

  const GrantPermissionsButton = () => (
    <Button variant="contained" href={props.masterPermissionLink}>
      Grant permissions
    </Button>
  );
  const StartTakeoverButton = () => (
    <Button variant="contained" onClick={startTakeover}>
      Take it over!
    </Button>
  );

  const StopTakeoverButton = () => (
    <Button variant="contained" onClick={stopTakeover}>
      Stop Takeover!
    </Button>
  );

  const CannotStartTakeoverButton = () => (
    <Button variant="contained" disabled>
      There is another active takeover...
    </Button>
  );

  const takeoverIsByUser =
    !!props.currentUserSpotifyId && props.activeTakeoverUser?.spotify.id === props.currentUserSpotifyId;
  console.log(props);
  const AppropriateButton = props.masterPermissionLink
    ? GrantPermissionsButton
    : takeoverIsByUser
    ? StopTakeoverButton
    : props.activeTakeoverUser
    ? CannotStartTakeoverButton
    : StartTakeoverButton;

  return (
    <Card>
      <CardContent>
        <Typography variant="h3">Start a takeover!</Typography>
        <Typography variant="body1" color="textSecondary">
          You will be able to control the music played on the current roadtrip device for 10 minutes. You can only do
          this once a day.
        </Typography>
        {props.masterPermissionLink && (
          <Typography variant="body1" color="textPrimary">
            You need to grant us more permissions to do that.
          </Typography>
        )}
        {props.activeTakeoverUser && !takeoverIsByUser && (
          <Typography variant="body1" color="textPrimary">
            There is currently an active takeover. Wait until it is over to start one yourself.
          </Typography>
        )}
        {props.activeTakeoverUser && takeoverIsByUser && (
          <Typography variant="body1" color="textPrimary">
            You are currently doing a takeover.
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <AppropriateButton />
      </CardActions>
    </Card>
  );
}
