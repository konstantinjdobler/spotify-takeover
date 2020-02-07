import React from "react";
import { Card, CardContent, CardActions, TextField, FormControlLabel, Checkbox, Button } from "@material-ui/core";
import { API_URL } from "./utils";
export default class CreateSignupLink extends React.Component<{}, { name: string; firstClassCitizen: boolean }> {
  state = {
    name: "",
    firstClassCitizen: false,
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
                checked={this.state.firstClassCitizen}
                onChange={(e, newValue) => this.setState({ firstClassCitizen: newValue })}
              />
            }
            label="First Class Citizen"
          />
        </CardContent>
        <CardActions>
          <Button href={`${API_URL}/api/create-signup-link?name=${this.state.name}`}>Create Link</Button>
        </CardActions>
      </Card>
    );
  }
}
