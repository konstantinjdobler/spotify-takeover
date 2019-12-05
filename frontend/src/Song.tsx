import React from "react";
import { List } from "antd";
type SongProps = {
  artist: string;
  name: string;
  addedBy: string;
  vote: JSX.Element;
};

const nameMap: { [key: string]: string } = {
  pantokrator3: "Konstantin",
  "pauludo.beneke": "Paul Udo",
  "11102348524": "Lasse",
  "1190715652": "Kris",
  jadasipe: "David",
  "hpm-hoberg": "Phillip",
};
export default class Song extends React.Component<SongProps> {
  render() {
    const { artist, name, addedBy, vote, ...rest } = this.props;
    return (
      <List.Item actions={[vote]}>
        <span>{`${name} - ${artist} - ${nameMap[addedBy] || addedBy}`}</span>
      </List.Item>
    );
  }
}
