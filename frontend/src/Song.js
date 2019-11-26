import React from "react";
import { List } from "antd";
export default class Song extends React.Component {
  render() {
    const { artist, name, addedBy, vote, ...rest } = this.props;
    return (
      <List.Item actions={[vote]}>
        <span>{`${name} - ${artist} - ${addedBy}`}</span>
      </List.Item>
    );
  }
}
