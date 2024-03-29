import React from "react";
import {
  CircularProgress,
  Grid,
  Snackbar,
  Paper,
  Tab,
  Tabs,
  Toolbar,
  AppBar,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Box,
} from "@material-ui/core";
import { Alert, Color } from "@material-ui/lab";
import CreateSignupLink from "./Components/CreateSignupLink";
import CurrentRoadtripDevice from "./Components/CurrentlyPlayingCard";
import {
  removeActionFromUrl,
  isProd,
  API_URL,
  getVisibilityEvent,
  getPrefix,
  getVisibilityStateProperty,
} from "./utils";
import AuthenticationLink from "./Components/AuthenticationPage";
import SetDeviceCard from "./Components/SetDeviceCard";
import SearchCard from "./Components/SearchCard";
import { InitialRequestResponse, authRequired, isOK, actions, routes, PublicUser } from "./sharedTypes";
import SignupErrorCard from "./Components/SignupErrorcard";
import LiveListenCard from "./Components/LiveListenCard";
import { Link, Headset, PlayCircleFilled, HelpOutline } from "@material-ui/icons";

console.log("Starting in production mode ( true | false )", isProd);
type AppState = {
  loading: boolean;
  authenticationLink?: string;
  masterPermissionLink?: string;
  slavePermissionLink?: string;
  user?: PublicUser;
  secretState?: boolean;
  toast?: JSX.Element;
  signupError?: boolean;
  playbackInfo?: SpotifyApi.CurrentlyPlayingObject;
  linkedSpotifyUser?: PublicUser;
  userIsLiveListening?: boolean;
  selectedTab: number;
  wishSongsLeft?: number;
  activeWishedSongInfo?: { user: PublicUser };
  currentlyLiveListening: string[];
  openHelpDialog: boolean;
};
class App extends React.Component<{}, AppState> {
  lastServerStatePoll: number = Date.now();
  pollInterval: NodeJS.Timeout | null = null;
  songEndTimeout: NodeJS.Timeout | null = null;
  state: AppState = {
    loading: true,
    selectedTab: 0,
    openHelpDialog: false,
    currentlyLiveListening: [],
  };

  signupSuccessfulAction(urlParams: URLSearchParams) {
    const authenticityToken = urlParams.get("authenticityToken");
    if (!authenticityToken) {
      console.error("No authenticity token found!");
      return;
    }
    const domain = isProd ? "konstantin-dobler.de" : "localhost";
    document.cookie = `authenticityToken=${authenticityToken};path=/;expires=Tue, 19 Jan 2038 03:14:07 UTC;domain=${domain}`;
  }

  startSignupAction(urlParams: URLSearchParams) {
    const tempCode = urlParams.get("tempCode");
    if (!tempCode) {
      console.error("No tempCode token found!");
      return;
    }
    return `?tempCode=${tempCode}`;
  }

  showToast = (content: string, severity: Color) => {
    const alert = (
      <Alert severity={severity} onClose={this.closeToast}>
        {content}
      </Alert>
    );
    this.setState({ toast: alert });
  };

  permissionGrantedAction = (urlParams: URLSearchParams) => {
    this.showToast("Permission granted!", "success");
  };

  actionMapper: { [actionString: string]: (urlParams: URLSearchParams) => void | string } = {
    [actions.signupSuccessful]: this.signupSuccessfulAction,
    [actions.loginSuccessful]: this.signupSuccessfulAction,
    [actions.startSignup]: this.startSignupAction,
    [actions.permissionGranted]: this.permissionGrantedAction,
    [actions.signupError]: useless => {},
  };

  pollLowPriority = () => {
    if (Date.now() < this.lastServerStatePoll + 10_000) return;
    console.log("Polling debounced");
    return this.requestServerStateUpdate();
  };

  async componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");
    let initialRequestModifier = "";
    if (action === actions.createSignupLink) {
      this.setState({ loading: false, secretState: true });
      return;
    }
    if (action === actions.signupError) {
      this.setState({ loading: false, signupError: true });
      return;
    }
    if (action) {
      initialRequestModifier = this.actionMapper[action](urlParams) || "";
      removeActionFromUrl();
    }
    await this.initial(initialRequestModifier);
    this.setState({ loading: false });
    const prefix = getPrefix();
    this.pollInterval = setInterval(this.pollLowPriority, 11_000);
    document.addEventListener(getVisibilityEvent(prefix), () => {
      if (((document as any)[getVisibilityStateProperty(prefix)] as VisibilityState) === "visible") {
        this.pollLowPriority();
        this.pollInterval = setInterval(this.pollLowPriority, 11_000);
      } else {
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
      }
    });
  }

  async initial(requestModifer: string) {
    const response = await fetch(API_URL + routes.initial + requestModifer, {
      method: "GET",
      credentials: "include",
      redirect: "follow",
    });

    const res: InitialRequestResponse = await response.json();
    console.log(res);

    if (authRequired(res)) {
      this.setState({ authenticationLink: res.authRequired });
    } else if (isOK(res)) {
      await this.setState({
        authenticationLink: undefined,
        user: res.user,
        masterPermissionLink: res.masterPermissionLink,
        slavePermissionLink: res.slavePermissionLink,
        playbackInfo: res.playback,
        linkedSpotifyUser: res.linkedSpotifyUser,
        userIsLiveListening: res.userIsLiveListening,
        wishSongsLeft: res.wishSongsLeft,
        activeWishedSongInfo: res.activeWishedSongInfo,
        currentlyLiveListening: res.currentlyLiveListening,
      });
    }
  }

  requestServerStateUpdate = () => {
    this.lastServerStatePoll = Date.now();
    return this.initial("").then(() => {
      if (this.songEndTimeout) {
        clearTimeout(this.songEndTimeout);
        this.songEndTimeout = null;
      }
      if (this.state.playbackInfo?.is_playing && this.state.playbackInfo.item) {
        this.songEndTimeout = setTimeout(
          this.requestServerStateUpdate,
          this.state.playbackInfo.item.duration_ms - this.state.playbackInfo.progress_ms! + 100,
        );
      }
    });
  };

  loadingIndicator() {
    return (
      <Grid container alignItems="center" justify="center" style={{ height: "100vh" }}>
        <Grid item>
          <CircularProgress size={100} />
        </Grid>
      </Grid>
    );
  }

  closeToast = () => {
    this.setState({ toast: undefined });
  };

  handleTabChange = (ev: any, newVal: number) => {
    this.pollLowPriority();
    this.setState({ selectedTab: newVal });
  };

  render() {
    if (this.state.loading) return this.loadingIndicator();
    if (this.state.authenticationLink) return <AuthenticationLink authenticationLink={this.state.authenticationLink} />;
    if (this.state.secretState) return <CreateSignupLink />;
    if (this.state.signupError) return <SignupErrorCard />;
    return (
      <div>
        <AppBar position="sticky">
          <Toolbar>
            <Typography variant="h6">Roadtrip Spotify Integration</Typography>
            <IconButton
              onClick={() => this.setState({ openHelpDialog: true })}
              edge="end"
              color="inherit"
              style={{ justifySelf: "flex-end" }}
            >
              <HelpOutline />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Grid justify="center" container style={{ padding: "5px", marginTop: "5px" }}>
          <Grid item xs={12}>
            <Box style={{ maxWidth: "900px", margin: "0 auto" }}>
              <CurrentRoadtripDevice
                currentUserIsLinked={
                  !!this.state.user?.spotify.id &&
                  this.state.user?.spotify.id === this.state.linkedSpotifyUser?.spotify.id
                }
                requestServerStateUpdate={this.requestServerStateUpdate}
                activeWishSongUser={this.state.activeWishedSongInfo?.user}
                playbackInfo={this.state.playbackInfo}
              />
            </Box>
          </Grid>
          <Grid justify="center" container item xs={12}>
            <Paper elevation={0} style={{ maxWidth: "900px", marginTop: "5px" }}>
              <Tabs
                value={this.state.selectedTab}
                onChange={this.handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                centered
              >
                <Tab icon={<Link />} label="Linked Spotify" />
                <Tab icon={<Headset />} label="Live Listen" />
                <Tab icon={<PlayCircleFilled />} label="Play Song" />
              </Tabs>
            </Paper>
          </Grid>
          {this.state.selectedTab === 2 && (
            <Grid justify="center" container item xs={12}>
              <Box style={{ maxWidth: "900px" }}>
                <SearchCard
                  activeWishSongUser={this.state.activeWishedSongInfo?.user}
                  wishSongsLeft={this.state.wishSongsLeft || 0}
                  permission={this.state.user?.capabilities.wishSongs !== 0}
                  requestServerStateUpdate={this.requestServerStateUpdate}
                  currentlyPlayingMusic={!!this.state.playbackInfo && this.state.playbackInfo.is_playing}
                ></SearchCard>
              </Box>
            </Grid>
          )}
          {this.state.selectedTab === 1 && (
            <Grid justify="center" container item xs={12}>
              <Box style={{ maxWidth: "900px" }}>
                <LiveListenCard
                  currentUserIslinked={
                    !!this.state.user?.spotify.id &&
                    this.state.user?.spotify.id === this.state.linkedSpotifyUser?.spotify.id
                  }
                  slavePermissionLink={this.state.slavePermissionLink}
                  requestServerStateUpdate={this.requestServerStateUpdate}
                  userIsLiveListening={!!this.state.userIsLiveListening}
                  currentlyLiveListening={this.state.currentlyLiveListening}
                  currentlyPlayingMusic={!!this.state.playbackInfo && this.state.playbackInfo.is_playing}
                  permission={!!this.state.user?.capabilities.liveListen}
                />
              </Box>
            </Grid>
          )}
          {this.state.selectedTab === 0 && (
            <Grid justify="center" container item xs={12}>
              <Box style={{ maxWidth: "900px" }}>
                <SetDeviceCard
                  slavePermissionLink={this.state.slavePermissionLink}
                  currentUserIsLinked={
                    !!this.state.linkedSpotifyUser &&
                    this.state.linkedSpotifyUser.spotify.id === this.state.user?.spotify.id
                  }
                  permission={!!this.state.user?.capabilities.linkSpotify}
                  currentLinkedUser={this.state.linkedSpotifyUser}
                  requestServerStateUpdate={this.requestServerStateUpdate}
                />
              </Box>
            </Grid>
          )}
          <Snackbar
            open={!!this.state.toast}
            autoHideDuration={3000}
            onClose={e => this.closeToast()}
            style={{ marginBottom: "5px" }}
          >
            {this.state.toast}
          </Snackbar>
          <Dialog open={this.state.openHelpDialog} onClose={() => this.setState({ openHelpDialog: false })}>
            <DialogTitle>What is this website?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {
                  "What do you do on a roadtrip? That's right, you listen to music. We're doing it the modern way via \
                Spotify and want to share that music with you."
                }
                <br />
                <br />

                {
                  "You can see what music we're listening to and sync that \
                music to your own Spotify account so that you're always listening to the same music as us."
                }
                <br />
                <br />
                {
                  "You can even \
                make us listen to your music - no matter where you are, you can make us listen to Wonderwall while we're driving down Highway Nr.1 in California. "
                }
              </DialogContentText>
            </DialogContent>
          </Dialog>
        </Grid>
      </div>
    );
  }
}

export default App;
