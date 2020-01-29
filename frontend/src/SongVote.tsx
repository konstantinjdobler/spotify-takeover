import React from "react";
import { List, Button, Result, Rate, Icon, message } from "antd";

type SongVoteProps = { apiUrl: string; user: SpotifyApi.UserObjectPublic };
type SongVoteState = {
  songs: SpotifyApi.PlaylistTrackObject[];
  loading: boolean;
  ratings: { [trackURI: string]: number };
  voted: boolean;
};

export default class SongVote extends React.Component<SongVoteProps, SongVoteState> {
  state: SongVoteState = {
    songs: [],
    loading: true,
    ratings: {},
    voted: false,
  };

  async getTodaysSongs(): Promise<SpotifyApi.PlaylistTrackObject[]> {
    const response = await fetch(`${this.props.apiUrl}/songs-of-the-day`);
    const jsonResponse = await response.json();
    return jsonResponse.d;
  }

  saveVote = async () => {
    const votesToSend: any[] = [];
    for (const trackURI of Object.keys(this.state.ratings)) {
      const value = this.state.ratings[trackURI];
      if (value > 0) {
        votesToSend.push({ trackURI, value });
      }
    }
    const bodyContent: any = { votes: votesToSend };
    const voteRequestResponse = await fetch(`${this.props.apiUrl}/vote`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyContent),
    });
    const responseBody: any = await voteRequestResponse.json();
    if (responseBody.ok) this.setState({ voted: true });
  };

  getTotalVotesCast(excludeTrackURI?: string) {
    let totalRating = 0;
    for (const key of Object.keys(this.state.ratings)) {
      if (key === excludeTrackURI) continue;
      totalRating += this.state.ratings[key];
    }
    return totalRating;
  }

  onVote = (newValue: number, trackURI: string, addedBy: string) => {
    if (this.props.user.id === addedBy) message.info("You cannot vote for your own song!");
    else if (this.getTotalVotesCast(trackURI) + newValue > 5) {
      message.info("You can only distribute up to 5 points");
      this.state.ratings[trackURI] = 5 - this.getTotalVotesCast(trackURI);
    } else this.state.ratings[trackURI] = newValue;
    this.forceUpdate();
  };

  async componentDidMount() {
    const todaysSongs = await this.getTodaysSongs();
    this.setState({ songs: todaysSongs, loading: false });

    console.log("Setting songs", this.state.songs);
  }

  getVoterForSong(trackURI: string, addedBy: string) {
    return (
      <Rate
        key={trackURI}
        character={<Icon type="heart" />}
        allowHalf
        style={{ color: "red" }}
        onChange={newValue => this.onVote(newValue, trackURI, addedBy)}
        value={this.state.ratings[trackURI] || 0}
      />
    );
  }

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

  loadingIndicator() {
    return <Icon type="loading" style={{ fontSize: "100px" }} />;
  }

  render() {
    if (this.state.voted) return this.votedPage();
    if (this.state.loading)
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
          {this.loadingIndicator()}
        </div>
      );
    else
      return (
        <div>

          {this.state.songs.length > 0 ? (
            <Button onClick={this.saveVote}>Save my choice</Button>
          ) : (
              "Nobody seems to have added a song today. Be the first one and win a secret prize!"
            )}
        </div>
      );
  }
}
