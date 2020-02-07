import React from "react";
import { CircularProgress, Grid, Snackbar } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import CreateSignupLink from "./CreateSignupLink";
import CurrentRoadtripDevice from "./CurrentRoadtripDevice";
import { removeActionFromUrl, isProd, API_URL } from "./utils";
import AuthenticationLink from "./AuthenticationPage";
import SetDeviceCard from "./SetDeviceCard";
import Takeovercard from "./TakeoverCard";
import { InitialRequestResponse, authRequired, isOK } from "./sharedTypes";

console.log("Starting in production mode ( true | false )", isProd);
type AppState = {
  loading: boolean;
  authenticationLink?: string;
  masterPermissionLink?: string;
  slavePermissionLink?: string;
  user?: { name: string; spotify: SpotifyApi.UserObjectPublic };
  activeTakeoverUser?: { name: string; id: string };
  secretState?: boolean;
  toast?: JSX.Element;
  playbackInfo?: SpotifyApi.CurrentlyPlayingObject;
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

  completeSignupAction(urlParams: URLSearchParams) {
    const tempCode = urlParams.get("tempCode");
    if (!tempCode) {
      console.error("No tempCode token found!");
      return;
    }
    return `?tempCode=${tempCode}`;
  }

  permissionGrantedAction = (urlParams: URLSearchParams) => {
    const alert = (
      <Alert severity="success" onClose={this.closeToast}>
        Permission granted!
      </Alert>
    );
    this.setState({ toast: alert });
  };

  actionMapper: { [actionString: string]: (urlParams: URLSearchParams) => void | string } = {
    "signup-successful": this.signupSuccessfulAction,
    "login-successful": this.signupSuccessfulAction,
    "complete-signup": this.completeSignupAction,
    "permission-granted": this.permissionGrantedAction,
    "signup-error": useless => {},
  };

  async componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");
    let initialRequestModifier = "";
    if (action === "create-signup-link") {
      this.setState({ loading: false, secretState: true });
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
    const response = await fetch(`${API_URL}/api/initial${requestModifer}`, {
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
      });
    }
  }

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
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <CurrentRoadtripDevice playbackInfo={this.state.playbackInfo} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Takeovercard
            masterPermissionLink={this.state.masterPermissionLink}
            activeTakeoverUser={this.state.activeTakeoverUser}
            currentUserId={this.state.user?.spotify.id}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <SetDeviceCard slavePermissionLink={this.state.slavePermissionLink} />
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
