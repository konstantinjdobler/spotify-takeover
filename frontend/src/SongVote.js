import React from "react";
import { List, Button, Rate, Icon, Skeleton, message } from "antd";
import Song from "./Song";

const API_URL = process.env.NODE_ENV === "development" ? "http://localhost:42069" : process.env.REACT_APP_API_URL;
console.log(API_URL);

export default class SongVote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      songs: [],
      loading: true,
      votes: {},
    };
  }
  async getTodaysSongs() {
    const response = await fetch(`${API_URL}/songs-of-the-day`);
    const jsonResponse = await response.json();
    return jsonResponse.d;
  }
  async componentDidMount() {
    const todaysSongs = await this.getTodaysSongs();
    this.setState({ songs: todaysSongs, loading: false });

    console.log("Setting songs", this.state.songs);
  }
  getVoterForSong(trackURI) {
    const rate = (
      <Rate
        key={trackURI}
        character={<Icon type="heart" />}
        allowHalf
        style={{ color: "red" }}
        onChange={newValue => this.onVote(newValue, trackURI)}
        value={this.state.votes[trackURI] || 0}
      />
    );
    return rate;
  }

  onVote = (newValue, trackURI) => {
    if (this.getTotalVotesCast() + newValue > 5) {
      message.info("You can only distribute up to 5 points");
      this.state.votes[trackURI] = 5 - this.getTotalVotesCast();
    } else this.state.votes[trackURI] = newValue;
    this.forceUpdate();
  };

  getTotalVotesCast() {
    let totalVotes = 0;
    for (const key of Object.keys(this.state.votes)) {
      totalVotes += this.state.votes[key];
    }
    return totalVotes;
  }

  getLoadingSkeleton() {
    return [1, 2, 3, 4, 5, 6, 7].map(key => <Skeleton key={key} title={false} loading paragraph={{ rows: 1 }} />);
  }

  saveVote = () => {
    const votesToSend = [];
    for (const trackURI of Object.keys(this.state.votes)) {
      const vote = this.state.votes[trackURI];
      if (vote > 0) {
        votesToSend.push({ trackURI, vote, user: "default" });
      }
    }
    console.log(votesToSend);
    fetch(`${API_URL}/vote`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(votesToSend),
    });
  };
  render() {
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
                vote={this.getVoterForSong(song.track.uri)}
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
