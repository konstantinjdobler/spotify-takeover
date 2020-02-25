import React from "react";
import { CircularProgress, Grid, Snackbar, DialogProps, Dialog } from "@material-ui/core";
import { Alert, AlertProps, Color } from "@material-ui/lab";
import CreateSignupLink from "./Components/CreateSignupLink";
import CurrentRoadtripDevice from "./Components/CurrentRoadtripDevice";
import { removeActionFromUrl, isProd, API_URL } from "./utils";
import AuthenticationLink from "./Components/AuthenticationPage";
import SetDeviceCard from "./Components/SetDeviceCard";
import Takeovercard from "./Components/TakeoverCard";
import { InitialRequestResponse, authRequired, isOK, actions, routes, PublicUser } from "./sharedTypes";
import SignupErrorCard from "./Components/SignupErrorcard";
import LiveListenCard from "./Components/LiveListenCard";

console.log("Starting in production mode ( true | false )", isProd);
type AppState = {
  loading: boolean;
  authenticationLink?: string;
  masterPermissionLink?: string;
  slavePermissionLink?: string;
  user?: PublicUser;
  activeTakeoverUser?: PublicUser;
  secretState?: boolean;
  toast?: JSX.Element;
  signupError?: boolean;
  playbackInfo?: SpotifyApi.CurrentlyPlayingObject;
  linkedSpotifyUser?: PublicUser;
  userIsLiveListening?: boolean;
};
class App extends React.Component<{}, AppState> {
  state: AppState = {
    loading: true,
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
      this.setState({
        authenticationLink: undefined,
        user: res.user,
        masterPermissionLink: res.masterPermissionLink,
        slavePermissionLink: res.slavePermissionLink,
        playbackInfo: res.playback,
        activeTakeoverUser: res.activeTakeoverUser,
        linkedSpotifyUser: res.linkedSpotifyUser,
        userIsLiveListening: res.userIsLiveListening,
      });
    }
  }

  requestServerStateUpdate = () => {
    this.initial("");
  };

  loadingIndicator() {
    return (
      <Grid container justify="center">
        <Grid item>
          <CircularProgress size={100} />
        </Grid>
      </Grid>
    );
  }

  closeToast = () => {
    this.setState({ toast: undefined });
  };

  render() {
    if (this.state.loading) return this.loadingIndicator();
    if (this.state.authenticationLink) return <AuthenticationLink authenticationLink={this.state.authenticationLink} />;
    if (this.state.secretState) return <CreateSignupLink />;
    if (this.state.signupError) return <SignupErrorCard />;
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <CurrentRoadtripDevice
            playbackInfo={this.state.playbackInfo}
            linkedSpotifyUser={this.state.linkedSpotifyUser}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Takeovercard
            masterPermissionLink={this.state.masterPermissionLink}
            activeTakeoverUser={this.state.activeTakeoverUser}
            currentUserSpotifyId={this.state.user?.spotify.id}
            requestServerStateUpdate={this.requestServerStateUpdate}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <LiveListenCard
            slavePermissionLink={this.state.slavePermissionLink}
            requestServerStateUpdate={this.requestServerStateUpdate}
            userIsLiveListening={!!this.state.userIsLiveListening}
            currentlyPlayingMusic={!!this.state.playbackInfo}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <SetDeviceCard
            slavePermissionLink={this.state.slavePermissionLink}
            currentUserIsLinked={
              !!this.state.linkedSpotifyUser && this.state.linkedSpotifyUser.spotify.id === this.state.user?.spotify.id
            }
            requestServerStateUpdate={this.requestServerStateUpdate}
          />
        </Grid>
        <Snackbar
          open={!!this.state.toast}
          autoHideDuration={3000}
          onClose={e => this.closeToast()}
          style={{ marginBottom: "5px" }}
        >
          {this.state.toast}
        </Snackbar>
      </Grid>
    );
  }
}

export default App;
