import React from "react";
import SongVote from "./SongVote";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div style={{ padding: "5%" }}>
        <h1>Pick your favorite songs of today!</h1>
        <h3>You can distribute 5 points. Choose wisely...</h3>
        <SongVote />
      </div>
    );
  }
}

export default App;
