import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Input,
} from "@material-ui/core";
import { API_URL } from "../utils";
import { routes, UNLIMITED_SONGS_NUMBER } from "../sharedTypes";
export default class CreateSignupLink extends React.Component<
  {},
  { name: string; linkSpotify: boolean; liveListen: boolean; wishSongs: number }
> {
  state = {
    name: "",
    linkSpotify: false,
    liveListen: false,
    wishSongs: 0,
  };
  render() {
    return (
      <Card style={{ maxWidth: "600px", margin: "auto" }}>
        <CardContent>
          <TextField
            size="medium"
            label="Name"
            value={this.state.name}
            onChange={e => this.setState({ name: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                onChange={(e, newValue) =>
                  this.setState({
                    linkSpotify: newValue,
                    liveListen: newValue,
                    wishSongs: newValue ? UNLIMITED_SONGS_NUMBER : 0,
                  })
                }
              />
            }
            label="Roadtrip Participant"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={this.state.linkSpotify}
                onChange={(e, newValue) => this.setState({ linkSpotify: newValue })}
              />
            }
            label="Link Spotify"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={this.state.liveListen}
                onChange={(e, newValue) => this.setState({ liveListen: newValue })}
              />
            }
            label="Live Listen"
          />
          <FormControlLabel
            control={
              <Input
                value={this.state.wishSongs}
                onChange={e => this.setState({ wishSongs: parseInt(e.target.value) || 0 })}
              />
            }
            label="Wish Songs Number"
          />
        </CardContent>
        <CardActions>
          <Button
            href={`${API_URL}${routes.createSignupLink}?name=${this.state.name}&liveListen=${this.state.liveListen}&linkSpotify=${this.state.linkSpotify}&wishSongs=${this.state.wishSongs}`}
          >
            Create Link
          </Button>
        </CardActions>
      </Card>
    );
  }
}
