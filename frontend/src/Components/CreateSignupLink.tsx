import React from "react";
import { Card, CardContent, CardActions, TextField, FormControlLabel, Checkbox, Button } from "@material-ui/core";
import { API_URL } from "../utils";
import { routes } from "../sharedTypes";
export default class CreateSignupLink extends React.Component<{}, { name: string; isRoadtripParticipant: boolean }> {
  state = {
    name: "",
    isRoadtripParticipant: false,
  };
  render() {
    return (
      <Card style={{ maxWidth: "600px", margin: "auto" }}>
        <CardContent>
          <TextField
            size="medium"
            label="Name"
            value={this.state.name}
            onChange={e => this.setState({ name: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={this.state.isRoadtripParticipant}
                onChange={(e, newValue) => this.setState({ isRoadtripParticipant: newValue })}
              />
            }
            label="First Class Citizen"
          />
        </CardContent>
        <CardActions>
          <Button
            href={`${API_URL}${routes.createSignupLink}?name=${this.state.name}&isRoadtripParticipant=${this.state.isRoadtripParticipant}`}
          >
            Create Link
          </Button>
        </CardActions>
      </Card>
    );
  }
}
