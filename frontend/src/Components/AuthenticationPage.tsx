import React from "react";
import { Paper, Typography, CardContent, CardActions, Button } from "@material-ui/core";

export default function AuthenticationLink(props: { authenticationLink: string }) {
  return (
    <Paper style={{ maxWidth: "600px", margin: "auto" }}>
      <CardContent>
        <Typography variant="h5" color="textPrimary">
          Oh no, you are not logged in or signed up! If you did not already request a signup link from me, please do so before authenticating with Spotify!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Don't worry, it's really easy. Click on the button below and authenticate with Spotify - you're ready to go!
        </Typography>
      </CardContent>
      <CardActions>
        <Button style={{ color: "white", backgroundColor: "#1DB954" }} href={props.authenticationLink}>
          Authenticate with Spotify
        </Button>
      </CardActions>
    </Paper>
  );
}
