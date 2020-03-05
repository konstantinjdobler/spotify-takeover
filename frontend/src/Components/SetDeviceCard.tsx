import React from "react";
import { Card, Typography, CardActions, Button, CardContent } from "@material-ui/core";
import { API_URL } from "../utils";
import { routes, PublicUser } from "../sharedTypes";

export default function SetDeviceCard(props: {
  slavePermissionLink?: string;
  currentLinkedUser?: PublicUser;
  currentUserIsLinked: boolean;
  permission: boolean;
  requestServerStateUpdate: () => void;
}) {
  async function linkMyAccount() {
    const response = await fetch(`${API_URL}${routes.linkSpotifyAccount}`, {
      method: "GET",
      credentials: "include",
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse);
    props.requestServerStateUpdate();
  }
  async function unlinkMyAccount() {
    const response = await fetch(`${API_URL}${routes.unlinkSpotifyAccount}`, {
      method: "GET",
      credentials: "include",
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse);
    props.requestServerStateUpdate();
  }

  function CurrLinked() {
    if (props.currentUserIsLinked)
      return <Typography variant="body1">Your Spotify account is currently linked!</Typography>;
    return props.currentLinkedUser ? (
      <Typography variant="body1">{props.currentLinkedUser.name + " has currently linked their account."}</Typography>
    ) : (
      <Typography variant="body1">No account is currently linked.</Typography>
    );
  }
  if (!props.permission) {
    return (
      <Card elevation={0}>
        <CardContent>
          <CurrLinked />
        </CardContent>
      </Card>
    );
  }
  if (props.currentUserIsLinked)
    return (
      <Card elevation={0}>
        <CardContent>
          <CurrLinked />
          <Typography variant="body1" color="textSecondary">
            By having linked your Spotify account, people are able to live listen to the music you are playing. People
            are also able to change the currently playing music through the "Play Song" feature.
          </Typography>
        </CardContent>
        <CardActions>
          <Button variant="outlined" color="primary" onClick={unlinkMyAccount}>
            Unlink my Spotify account
          </Button>
        </CardActions>
      </Card>
    );
  return (
    <Card elevation={0}>
      <CardContent>
        <CurrLinked />
        <Typography variant="body1" color="textSecondary">
          By linking your Spotify account, people will be able to live listen to the music you are playing. People will
          also be able to change the currently playing music through the "Takeover" feature. Your account will replace
          any currently linked accounts. There can only be one!
        </Typography>
        {props.slavePermissionLink && (
          <Typography variant="body1" color="textPrimary">
            You need to grant us more permissions to do that.
          </Typography>
        )}
      </CardContent>
      <CardActions>
        {props.slavePermissionLink ? (
          <Button variant="outlined" color="primary" href={props.slavePermissionLink}>
            Grant permissions
          </Button>
        ) : (
          <Button variant="outlined" color="primary" onClick={linkMyAccount}>
            Link my Spotify account
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
