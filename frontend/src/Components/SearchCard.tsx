import React from "react";
import {
  Card,
  Typography,
  CardActions,
  Button,
  CardContent,
  Box,
  TextField,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
} from "@material-ui/core";
import { API_URL } from "../utils";
import { routes, PublicUser } from "../sharedTypes";
import { LoadingButton, LoadingIconButton } from "./LoadingCapableButton";
import { Search } from "@material-ui/icons";

type SearchCardState = {
  song: string;
  artist: string;
  loading: boolean;
  searchResults?: SpotifyApi.TrackObjectFull[];
  selectedSearchResultURI?: string;
};
export default class SearchCard extends React.Component<
  {
    currentlyPlayingMusic: boolean;
    activeWishSongUser?: PublicUser;
    wishSongsLeft: number;
    permission: boolean;
    requestServerStateUpdate: () => void;
  },
  SearchCardState
> {
  state: SearchCardState = {
    loading: false,
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
    this.setState({ searchResults: jsonResponse.tracks });
    console.log(jsonResponse);
  };

  selectSong = async (songID: string) => {
    await fetch(`${API_URL}${routes.injectSong}?songID=${songID}`, {
      method: "GET",
      credentials: "include",
    });
    await this.props.requestServerStateUpdate();
  };

  trackListItem = (track: SpotifyApi.TrackObjectFull) => (
    <>
      <ListItem
        button
        dense
        disabled={this.state.loading}
        alignItems="flex-start"
        onClick={async () => {
          this.setState({ loading: true, selectedSearchResultURI: track.uri });
          await this.selectSong(track.id);
          this.setState({ loading: false, selectedSearchResultURI: undefined, searchResults: undefined });
        }}
      >
        <ListItemAvatar>
          <Avatar variant="square" src={track.album.images[2].url} />
        </ListItemAvatar>
        <ListItemText primary={track.name} secondary={track.artists.map(artist => artist.name).join(", ")} />
        <ListItemSecondaryAction>
          {this.state.selectedSearchResultURI === track.uri && <CircularProgress size={25} />}
        </ListItemSecondaryAction>
      </ListItem>
      <Divider variant="fullWidth" component="li" />
    </>
  );

  SelectionDialog = () => (
    <Dialog open={!!this.state.searchResults}>
      <DialogTitle>Choose one of the results</DialogTitle>
      <DialogContent>
        <List>
          <Divider variant="fullWidth" component="li" />
          {this.state.searchResults?.map(track => this.trackListItem(track))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="primary" onClick={() => this.setState({ searchResults: undefined })}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
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
              You can play any song on our linked Spotify account! We'll have to listen, so play something nice. Search
              by song name - specify the artist if the song has a common name.
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
              You can play any song on our linked Spotify account! We'll have to listen, so play something nice. Search
              by song name - specify the artist if the song has a common name.
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
          <Typography variant="body1" color="textPrimary">
            {`You can play a song on our account ${this.props.wishSongsLeft} more times... Choose wisely. `}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            You can play any song on our linked Spotify account! We'll have to listen, so play something nice. Search by
            song name - specify the artist if the song has a common name.
          </Typography>
          <Box display="flex" alignItems="center">
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
              style={{ marginLeft: "5px", width: "30%" }}
            />
            <LoadingIconButton
              color="primary"
              loading={this.state.loading}
              style={{ marginLeft: "5px", marginTop: "15px", padding: "5px" }}
              onClick={async () => {
                this.setState({ loading: true });
                await this.search(this.state.song, this.state.artist);
                this.setState({ loading: false });
              }}
            >
              <Search fontSize="large" />
            </LoadingIconButton>
          </Box>
        </CardContent>
        <this.SelectionDialog />
      </Card>
    );
  }
}
