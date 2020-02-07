import React from "react";
import { Card, Typography, CardActions, Button, CardContent } from "@material-ui/core";
import { API_URL } from "./utils";

export default function SetDeviceCard(props: { slavePermissionLink?: string }) {
  async function changeDevice() {
    const response = await fetch(`${API_URL}/api/change-roadtrip-device`, {
      method: "GET",
      credentials: "include",
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse);
  }
  return (
    <Card>
      <CardContent>
        <Typography variant="h3">Link my Spotify account</Typography>
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
          <Button variant="contained" href={props.slavePermissionLink}>
            Grant permissions
          </Button>
        ) : (
          <Button variant="contained" onClick={changeDevice}>
            Link my Spotify account
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
