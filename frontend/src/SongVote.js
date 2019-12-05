import React from "react";
import { List, Button, Result, Rate, Icon, Skeleton, message } from "antd";
import Song from "./Song";
const isProd = process.env.REACT_APP_IS_PRODUCTION === "true";
const API_URL = isProd ? process.env.REACT_APP_API_URL : process.env.REACT_APP_API_URL_DEV;
console.log("Starting in production mode (treu|false)", isProd);

export default class SongVote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      songs: [],
      loading: true,
      votes: {},
      showAuth: false,
      user: {},
    };
  }
  async getTodaysSongs() {
    const response = await fetch(`${API_URL}/songs-of-the-day`);
    const jsonResponse = await response.json();
    return jsonResponse.d;
  }

  async initial() {
    const urlParams = new URLSearchParams(window.location.search);
    const votingToken = urlParams.get("votingToken");
    if (votingToken) {
      console.log(votingToken);
      const domain = isProd ? "konstantin-dobler.de" : "localhost";
      document.cookie = `votingToken=${votingToken};path=/;domain=${domain}`;
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

    const jsonResponse = await response.json();
    console.log(jsonResponse);

    if (jsonResponse.authRequired) {
      this.setState({ showAuth: jsonResponse.authRequired });
    } else {
      this.setState({ showAuth: false, user: jsonResponse.user });
    }
  }
  async componentDidMount() {
    await this.initial();
    if (this.state.showAuth) return;
    const todaysSongs = await this.getTodaysSongs();
    this.setState({ songs: todaysSongs, loading: false });

    console.log("Setting songs", this.state.songs);
  }
  getVoterForSong(trackURI, addedBy) {
    const rate = (
      <Rate
        key={trackURI}
        character={<Icon type="heart" />}
        allowHalf
        style={{ color: "red" }}
        onChange={newValue => this.onVote(newValue, trackURI, addedBy)}
        value={this.state.votes[trackURI] || 0}
      />
    );
    return rate;
  }

  onVote = (newValue, trackURI, addedBy) => {
    if (this.state.user.id === addedBy) message.info("You cannot vote for your own song!");
    else if (this.getTotalVotesCast(trackURI) + newValue > 5) {
      message.info("You can only distribute up to 5 points");
      this.state.votes[trackURI] = 5 - this.getTotalVotesCast(trackURI);
    } else this.state.votes[trackURI] = newValue;
    this.forceUpdate();
  };

  getTotalVotesCast(excludeTrackURI = null) {
    let totalVotes = 0;
    for (const key of Object.keys(this.state.votes)) {
      if (key === excludeTrackURI) continue;
      totalVotes += this.state.votes[key];
    }
    return totalVotes;
  }

  getLoadingSkeleton() {
    return [1, 2, 3, 4, 5, 6, 7].map(key => <Skeleton key={key} title={false} loading paragraph={{ rows: 1 }} />);
  }

  saveVote = async () => {
    const votesToSend = [];
    for (const trackURI of Object.keys(this.state.votes)) {
      const vote = this.state.votes[trackURI];
      if (vote > 0) {
        votesToSend.push({ trackURI, vote });
      }
    }
    console.log(votesToSend);
    const result = await fetch(`${API_URL}/vote`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ votes: votesToSend }),
    });
    const body = await result.json();
    if (body.ok === "created") this.setState({ voted: true });
  };

  votedPage = () => (
    <Result
      status="success"
      title="You have successfully cast your vote!"
      subTitle="Congratulations, with a bit of luck and knowledge of advanced game theory, your song might make it into the seleçion."
      extra={[
        <Button onClick={() => this.setState({ voted: false })} type="primary">
          I changed my mind
        </Button>,
      ]}
    />
  );
  render() {
    if (this.state.voted) return this.votedPage();
    if (this.state.showAuth) {
      return <a href={this.state.showAuth}> Click here for Authentication </a>;
    }
    if (this.state.loading)
      return <div style={{ marginTop: "2%", marginBottom: "2%" }}>{this.getLoadingSkeleton()}</div>;
    else
      return (
        <div>
          <List style={{ margin: "2% 0px" }}>
            {this.state.songs.map(song => (
              <Song
                key={song.track.uri}
                name={song.track.name}
                artist={song.track.artists[0].name}
                addedBy={song.added_by.id}
                vote={this.getVoterForSong(song.track.uri, song.added_by.id)}
              />
            ))}
          </List>
          {this.state.songs.length > 0 ? (
            <Button onClick={this.saveVote}>Save my choice</Button>
          ) : (
            "Nobody seems to have added a song today. Be the first one and win a secret prize!"
          )}
        </div>
      );
  }
}
