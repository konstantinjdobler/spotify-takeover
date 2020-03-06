import React, { SyntheticEvent } from "react";
import {
  Card,
  Typography,
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
import { API_URL, delay } from "../utils";
import { routes, PublicUser } from "../sharedTypes";
import { LoadingIconButton } from "./LoadingCapableButton";
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

  searchClick = async () => {
    if (!this.state.song && !this.state.artist) return;
    this.setState({ loading: true });
    await this.searchRequest(this.state.song, this.state.artist);
    this.setState({ loading: false });
  };

  catchEnter = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Enter") {
      this.searchClick();
      ev.preventDefault();
    }
  };
  handleArtistChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ artist: ev.target.value });
  };
  handleSongChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ song: ev.target.value });
  };
  searchRequest = async (song: string, artist?: string) => {
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
    setTimeout(this.props.requestServerStateUpdate, 2000);
    return this.props.requestServerStateUpdate();
  };

  trackListItem = (track: SpotifyApi.TrackObjectFull) => (
    <Box key={track.uri}>
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
    </Box>
  );

  SelectionDialog = () => (
    <Dialog open={!!this.state.searchResults} onClose={() => this.setState({ searchResults: undefined })}>
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
              by song name, artist or both. Select one of the search results - it will start playing immediately!
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
              by song name, artist or both. Select one of the search results - it will start playing immediately!
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
            song name, artist or both. Select one of the search results - it will start playing immediately!
          </Typography>
          <Box display="flex" alignItems="center">
            <TextField
              value={this.state.song}
              onKeyDown={this.catchEnter}
              onChange={this.handleSongChange}
              label="Song"
            />

            <TextField
              value={this.state.artist}
              onKeyDown={this.catchEnter}
              onChange={this.handleArtistChange}
              label="Artist"
              style={{ marginLeft: "5px", width: "30%" }}
            />
            <LoadingIconButton
              color="primary"
              loading={this.state.loading}
              style={{ marginLeft: "5px", marginTop: "15px", padding: "5px" }}
              onClick={this.searchClick}
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
