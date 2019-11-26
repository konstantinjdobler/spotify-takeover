import React from "react";
import SongVote from "./SongVote";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div>
        <SongVote />
      </div>
    );
  }
}

export default App;
