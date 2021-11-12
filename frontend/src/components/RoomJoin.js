import React, { Component } from "react";
import { TextField, Button, Grid, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";

export class RoomJoin extends Component {
  constructor(props) {
    super(props);

    this.state = {
      roomCode: "",
      error: "",
    };
    this.handleTextFieldChange = this.handleTextFieldChange.bind(this);
    this.roomButtonPressed = this.roomButtonPressed.bind(this);
  }

  handleTextFieldChange(e) {
    this.setState({
      roomCode: e.target.value,
    });
  }

  roomButtonPressed() {
    console.log("joining...", this.state.roomCode);
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: this.state.roomCode }),
    };
    fetch("/api/join-room", requestOptions)
      .then((response) => {
        if (response.ok) {
          this.props.history.push(`/room/${this.state.roomCode}`);
        } else {
          this.setState({
            error: "Room not found",
          });
        }
      })
      .catch((err) => console.log(err));
  }

  render() {
    return (
      <div className="center-wrapper">
        <Grid container spacing={2} align="center">
          <Grid item xs={12}>
            <Typography component="h4" variant="h4">
              Join a room
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              error={this.state.error}
              label="Code"
              placeholder="Enter a room code"
              value={this.state.roomCode}
              helperText={this.state.error}
              variant="outlined"
              onChange={this.handleTextFieldChange}
            />
          </Grid>

          <Grid item container xs={6} direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={this.roomButtonPressed}
            >
              Enter
            </Button>
          </Grid>

          <Grid
            item
            container
            xs={6}
            direction="row"
            justifyContent="flex-start"
          >
            <Button
              variant="contained"
              color="secondary"
              to="/"
              component={Link}
            >
              Back
            </Button>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default RoomJoin;
