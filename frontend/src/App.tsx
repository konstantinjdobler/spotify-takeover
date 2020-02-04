import React from "react";
import {
  Button,
  CircularProgress,
  Typography,
  CardContent,
  CardActions,
  Paper,
  TextField,
  Card,
  Input,
} from "@material-ui/core";

const isProd = process.env.REACT_APP_IS_PRODUCTION === "true";
const API_URL = isProd ? process.env.REACT_APP_API_URL! : "http://localhost:42069";
console.log("Starting in production mode ( true | false )", isProd);
type AppState = {
  loading: boolean;
  authenticationLink?: string;
  user?: SpotifyApi.UserObjectPublic;
  secretState?: boolean;
};
class App extends React.Component<{}, AppState> {
  state: AppState = {
    loading: true,
  };

  actionMapper: { [actionString: string]: (urlParams: URLSearchParams) => void | string } = {
    "signup-successful": this.signupSuccessfulAction,
    "login-successful": this.signupSuccessfulAction,
    "complete-signup": this.completeSignupAction,
  };

  signupSuccessfulAction(urlParams: URLSearchParams) {
    const authenticityToken = urlParams.get("authenticityToken");
    if (!authenticityToken) {
      console.error("No authenticity token found!");
      return;
    }
    const domain = isProd ? "konstantin-dobler.de" : "localhost";
    document.cookie = `authenticityToken=${authenticityToken};path=/;expires=Tue, 19 Jan 2038 03:14:07 UTC;domain=${domain}`;
    //window.localStorage.setItem("authenticityToken", authenticityToken);
    var uri = window.location.toString();
    if (uri.indexOf("?") > 0) {
      var clean_uri = uri.substring(0, uri.indexOf("?"));
      window.history.replaceState({}, document.title, clean_uri);
    }
  }

  completeSignupAction(urlParams: URLSearchParams) {
    const tempCode = urlParams.get("tempCode");
    if (!tempCode) {
      console.error("No tempCode token found!");
      return;
    }
    return `?tempCode=${tempCode}`;
  }

  async componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");
    let initialRequestModifier = "";
    if (action === "create-signup-link") {
      this.setState({ loading: false, secretState: true });
      return;
    }
    if (action) initialRequestModifier = this.actionMapper[action](urlParams) || "";
    await this.initial(initialRequestModifier);
    this.setState({ loading: false });
  }

  async initial(requestModifer: string) {
    const response = await fetch(`${API_URL}/api/initial${requestModifer}`, {
      method: "GET",
      credentials: "include",
      redirect: "follow",
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse);

    if (jsonResponse.authRequired) {
      this.setState({ authenticationLink: jsonResponse.authRequired });
    } else {
      this.setState({ authenticationLink: undefined, user: jsonResponse.user });
    }
  }

  loadingIndicator() {
    return (
      <div
        style={{
          marginTop: "2%",
          marginBottom: "2%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress size={100} />
      </div>
    );
  }

  authenticationLink() {
    return (
      <Paper style={{ maxWidth: "600px", margin: "auto" }}>
        <CardContent>
          <Typography variant="h5" color="textPrimary">
            Oh no, you are not logged in or signed up!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Don't worry, it's really easy. Click on the button below and authenticate with Spotify - you're ready to go!
          </Typography>
        </CardContent>
        <CardActions>
          <Button style={{ color: "white", backgroundColor: "#1DB954" }} href={this.state.authenticationLink}>
            Authenticate with Spotify
          </Button>
        </CardActions>
      </Paper>
    );
  }

  async startTakeover() {
    const response = await fetch(`${API_URL}/api/takeover`, {
      method: "GET",
      credentials: "include",
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse);
  }

  render() {
    if (this.state.loading) return this.loadingIndicator();
    if (this.state.authenticationLink) return this.authenticationLink();
    if (this.state.secretState) return <CreateSignupLink />;
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <h1>Takeover</h1>
        <Button variant="contained" onClick={this.startTakeover}>
          Take it over!
        </Button>
      </div>
    );
  }
}
class CreateSignupLink extends React.Component<{}, { name: string }> {
  state = {
    name: "",
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
        </CardContent>
        <CardActions>
          <Button href={`${API_URL}/api/create-signup-link?name=${this.state.name}`}>Create Link</Button>
        </CardActions>
      </Card>
    );
  }
}
export default App;
