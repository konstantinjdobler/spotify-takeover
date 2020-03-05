import React from "react";
import { Card, Typography, CardActions, Button, CardContent } from "@material-ui/core";
import { API_URL } from "../utils";
import { routes, PublicUser } from "../sharedTypes";
import { LoadingButton } from "./LoadingCapableButton";

export default class SetDeviceCard extends React.Component<
  {
    slavePermissionLink?: string;
    currentLinkedUser?: PublicUser;
    currentUserIsLinked: boolean;
    permission: boolean;
    requestServerStateUpdate: () => void;
  },
  { loading: boolean }
> {
  state = { loading: false };
  async linkMyAccount() {
    const response = await fetch(`${API_URL}${routes.linkSpotifyAccount}`, {
      method: "GET",
      credentials: "include",
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse);
    await this.props.requestServerStateUpdate();
  }
  async unlinkMyAccount() {
    const response = await fetch(`${API_URL}${routes.unlinkSpotifyAccount}`, {
      method: "GET",
      credentials: "include",
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse);
    await this.props.requestServerStateUpdate();
  }

  CurrLinked = () => {
    if (this.props.currentUserIsLinked)
      return <Typography variant="body1">Your Spotify account is currently linked!</Typography>;
    return this.props.currentLinkedUser ? (
      <Typography variant="body1">
        {this.props.currentLinkedUser.name + " has currently linked their account."}
      </Typography>
    ) : (
      <Typography variant="body1">No account is currently linked.</Typography>
    );
  };
  render() {
    if (!this.props.permission) {
      return (
        <Card elevation={0}>
          <CardContent>
            <this.CurrLinked />
          </CardContent>
        </Card>
      );
    }
    if (this.props.currentUserIsLinked)
      return (
        <Card elevation={0}>
          <CardContent>
            <this.CurrLinked />
            <Typography variant="body1" color="textSecondary">
              By having linked your Spotify account, people are able to live listen to the music you are playing. People
              are also able to change the currently playing music through the "Play Song" feature.
            </Typography>
          </CardContent>
          <CardActions>
            <LoadingButton
              loading={this.state.loading}
              variant="outlined"
              color="primary"
              onClick={async () => {
                this.setState({ loading: true });
                await this.unlinkMyAccount();
                this.setState({ loading: false });
              }}
            >
              Unlink my Spotify account
            </LoadingButton>
          </CardActions>
        </Card>
      );
    return (
      <Card elevation={0}>
        <CardContent>
          <this.CurrLinked />
          <Typography variant="body1" color="textSecondary">
            By linking your Spotify account, people will be able to live listen to the music you are playing. People
            will also be able to change the currently playing music through the "Play Song" feature. Your account will
            replace any currently linked accounts. There can only be one!
          </Typography>
          {this.props.slavePermissionLink && (
            <Typography variant="body1" color="textPrimary">
              You need to grant us more permissions to do that.
            </Typography>
          )}
        </CardContent>
        <CardActions>
          {this.props.slavePermissionLink ? (
            <Button variant="outlined" color="primary" href={this.props.slavePermissionLink}>
              Grant permissions
            </Button>
          ) : (
            <LoadingButton
              loading={this.state.loading}
              variant="outlined"
              color="primary"
              onClick={async () => {
                this.setState({ loading: true });
                await this.linkMyAccount();
                this.setState({ loading: false });
              }}
            >
              Link my Spotify account
            </LoadingButton>
          )}
        </CardActions>
      </Card>
    );
  }
}
