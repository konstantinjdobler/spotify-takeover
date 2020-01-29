import React from "react";
import SongVote from "./SongVote";
import { Icon, Result, Button } from "antd";

const isProd = process.env.REACT_APP_IS_PRODUCTION === "true";
const API_URL = isProd ? process.env.REACT_APP_API_URL! : "http://localhost:42069";
console.log("Starting in production mode ( true | false )", isProd);
type AppState = {
  loading: boolean;
  authenticationLink?: string;
  user?: SpotifyApi.UserObjectPublic;
};
class App extends React.Component<{}, AppState> {
  state: AppState = {
    loading: true,
  };
  async initial() {
    const urlParams = new URLSearchParams(window.location.search);
    const authenticityToken = urlParams.get("authenticityToken");
    if (authenticityToken) {
      console.log(authenticityToken);
      const domain = isProd ? "konstantin-dobler.de" : "localhost";
      document.cookie = `authenticityToken=${authenticityToken};path=/;expires=Tue, 19 Jan 2038 03:14:07 UTC;domain=${domain}`;
      window.localStorage.setItem("authenticityToken", authenticityToken);
      var uri = window.location.toString();
      if (uri.indexOf("?") > 0) {
        var clean_uri = uri.substring(0, uri.indexOf("?"));
        window.history.replaceState({}, document.title, clean_uri);
      }
    }
    const response = await fetch(`${API_URL}/api/initial`, {
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
        <Icon type="loading" style={{ fontSize: "100px" }} />
      </div>
    );
  }

  authenticationLink() {
    return <a href={this.state.authenticationLink}>Click here for Authentication</a>;
  }
  async componentDidMount() {
    await this.initial();
    this.setState({ loading: false });
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
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <h1>Takeover</h1>
        <button onClick={this.startTakeover}>Take it over!</button>
      </div>
    );
  }
}

export default App;
