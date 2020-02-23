import React from "react";
import { Card, CardContent, Typography } from "@material-ui/core";

export default function SignupErrorCard() {
  return (
    <Card style={{ maxWidth: "600px", margin: "auto", borderColor: "red" }}>
      <CardContent>
        <Typography variant="h3">Oh no... something went wrong!</Typography>
        <Typography variant="body1" color="textSecondary">
          Perhaps you did not get a signup link from Konstantin Dobler?
        </Typography>
      </CardContent>
    </Card>
  );
}
