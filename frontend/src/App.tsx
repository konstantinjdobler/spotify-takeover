import React from "react";
import SongVote from "./SongVote";
import { InitialRequestResponse } from "./schemas";
import { Icon, Result, Button } from "antd";

const isProd = process.env.REACT_APP_IS_PRODUCTION === "true";
const API_URL = isProd ? process.env.REACT_APP_API_URL! : process.env.REACT_APP_API_URL_DEV!;
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
    const votingToken = urlParams.get("votingToken");
    if (votingToken) {
      console.log(votingToken);
      const domain = isProd ? "konstantin-dobler.de" : "localhost";
      document.cookie = `votingToken=${votingToken};path=/;expires=Tue, 19 Jan 2038 03:14:07 UTC;domain=${domain}`;
      window.localStorage.setItem("votingToken", votingToken);
      var uri = window.location.toString();
      if (uri.indexOf("?") > 0) {
        var clean_uri = uri.substring(0, uri.indexOf("?"));
        window.history.replaceState({}, document.title, clean_uri);
      }
    }
    const response = await fetch(`${API_URL}/initial`, {
      method: "GET",
      credentials: "include",
      redirect: "follow",
    });

    const jsonResponse: InitialRequestResponse = await response.json();
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

  render() {
    if (this.state.loading) return this.loadingIndicator();
    if (this.state.authenticationLink) return this.authenticationLink();
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <h1>Pick your favorite songs of today!</h1>
        <h3>You can distribute 5 points. Choose wisely...</h3>
        <SongVote user={this.state.user!} apiUrl={API_URL} />
      </div>
    );
  }
}

export default App;
