import React from "react";
import { List, Button, Rate, Icon } from "antd";
import Song from "./Song";

const API_URL = process.env.NODE_ENV === "development" ? "http://localhost:42069" : process.env.REACT_APP_API_URL;
console.log(API_URL);

export default class SongVote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      songs: [],
    };
  }
  votes = {};
  async getTodaysSongs() {
    const response = await fetch(`${API_URL}/songs-of-the-day`);
    const jsonResponse = await response.json();
    return jsonResponse.d;
  }
  async componentDidMount() {
    this.setState({ songs: await this.getTodaysSongs() });
    console.log("Setting songs", this.state.songs);
  }
  getVoterForSong(trackURI) {
    return (
      <Rate
        key={trackURI}
        character={<Icon type="heart" />}
        allowHalf
        style={{ color: "red" }}
        onChange={newValue => (this.votes[trackURI] = newValue)}
      />
    );
  }

  saveVote = () => {
    const votesToSend = [];
    for (const trackURI of Object.keys(this.votes)) {
      const vote = this.votes[trackURI];
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
    return (
      <div>
        <span>Pick your favorite songs of today!</span>
        <span>You can distribute 5 points. Choose wisely...</span>
        <List>
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
        <Button onClick={this.saveVote}>Save my choice</Button>
      </div>
    );
  }
}
