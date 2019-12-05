import React from "react";
import { List } from "antd";

const nameMap = {
  pantokrator3: "Konstantin",
  "pauludo.beneke": "Paul Udo",
  "11102348524": "Lasse",
  "1190715652": "Kris",
};
export default class Song extends React.Component {
  render() {
    const { artist, name, addedBy, vote, ...rest } = this.props;
    return (
      <List.Item actions={[vote]}>
        <span>{`${name} - ${artist} - ${nameMap[addedBy] || addedBy}`}</span>
      </List.Item>
    );
  }
}
