import React from "react";
import { Card, Typography, CardActions, Button, CardContent, Box, TextField } from "@material-ui/core";
import { API_URL } from "../utils";
import { routes, PublicUser } from "../sharedTypes";

export default class SearchCard extends React.Component<
  {
    currentlyPlayingMusic: boolean;
    activeWishSongUser?: PublicUser;
    wishSongsLeft: number;
    permission: boolean;
    requestServerStateUpdate: () => void;
  },
  { song: string; artist: string }
> {
  state = {
    song: "",
    artist: "",
  };
  search = async (song: string, artist?: string) => {
    let query = `?song=${song}` + (artist ? `&artist=${artist}` : "");
    const response = await fetch(`${API_URL}${routes.search}${query}`, {
      method: "GET",
      credentials: "include",
    });

    const jsonResponse = (await response.json()) as { tracks: SpotifyApi.TrackObjectFull[] };
    console.log(jsonResponse);
    await fetch(`${API_URL}${routes.injectSong}?songID=${jsonResponse.tracks[0].id}`, {
      method: "GET",
      credentials: "include",
    });
    this.props.requestServerStateUpdate();
  };
  render() {
    if (!this.props.permission)
      return (
        <Card elevation={0}>
          <CardContent>
            <Typography variant="body1" color="textPrimary">
              Unfortunately you cannot use this feature.
            </Typography>
          </CardContent>
        </Card>
      );
    if (this.props.wishSongsLeft <= 0)
      return (
        <Card elevation={0}>
          <CardContent>
            <Typography variant="body1" color="textPrimary">
              You used all your songs! I hope you had fun!
            </Typography>
          </CardContent>
        </Card>
      );
    if (!this.props.currentlyPlayingMusic)
      return (
        <Card elevation={0}>
          <CardContent>
            <Typography variant="body1" color="textSecondary">
              You can play a song on our linked spotify account - please play something nice. This will immediately play
              the first matched song - specify the artist if the song has a common name.
            </Typography>
            <Typography variant="body1" color="textPrimary">
              {`Unfortunately we are not listening to music right now. Please try again later.`}
            </Typography>
          </CardContent>
        </Card>
      );
    if (this.props.activeWishSongUser)
      return (
        <Card elevation={0}>
          <CardContent>
            <Typography variant="body1" color="textSecondary">
              You can play a song on our linked spotify account - please play something nice. This will immediately play
              the first matched song - specify the artist if the song has a common name.
            </Typography>
            <Typography variant="body1" color="textPrimary">
              {`The currently playing song was requested by ${this.props.activeWishSongUser.name} using this feature. Please wait until it has finished playing.`}
            </Typography>
          </CardContent>
        </Card>
      );

    return (
      <Card elevation={0}>
        <CardContent>
          <Typography variant="body1" color="textSecondary">
            {`You can play a song on our account ${this.props.wishSongsLeft} more times... Choose wisely. `}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            You can play a song on our linked spotify account - please play something nice. This will immediately play
            the first matched song - specify the artist if the song has a common name.
          </Typography>
          <Box>
            <TextField
              value={this.state.song}
              onChange={ev => this.setState({ song: ev.target.value })}
              label="Song"
              required
            />

            <TextField
              value={this.state.artist}
              onChange={ev => this.setState({ artist: ev.target.value })}
              label="Artist"
              required={false}
              style={{ marginLeft: "5px" }}
            />
          </Box>
        </CardContent>
        <CardActions>
          <Button
            variant="outlined"
            color="primary"
            style={{ marginLeft: "5px" }}
            onClick={() => this.search(this.state.song, this.state.artist)}
          >
            Play this song!
          </Button>
        </CardActions>
      </Card>
    );
  }
}
