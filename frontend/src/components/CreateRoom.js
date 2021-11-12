import React, { Component } from "react";
import {
  Button,
  Typography,
  TextField,
  Grid,
  FormHelperText,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
  Collapse,
} from "@material-ui/core";

import { Alert } from "@material-ui/lab";
import { Link } from "react-router-dom";

export class CreateRoom extends Component {
  static defaultProps = {
    votesToSkip: 2,
    guestCanPause: true,
    update: false,
    roomCode: null,
    updateCallback: () => {},
    success: "",
    error: "",
  };

  constructor(props) {
    super(props);

    this.state = {
      guestCanPause: this.props.guestCanPause,
      votesToSkip: this.props.votesToSkip,
      success: this.props.success,
      error: this.props.error,
    };

    this.handleRoomButtonPressed = this.handleRoomButtonPressed.bind(this);
    this.handleVotesChange = this.handleVotesChange.bind(this);
    this.handleGuestCanPauseChange = this.handleGuestCanPauseChange.bind(this);
    this.renderUpdateButtons = this.renderUpdateButtons.bind(this);
    this.renderCreateButtons = this.renderCreateButtons.bind(this);
    this.handleUpdateButtonsPressed =
      this.handleUpdateButtonsPressed.bind(this);
  }

  handleVotesChange(e) {
    this.setState({
      votesToSkip: e.target.value,
    });
  }

  handleGuestCanPauseChange(e) {
    this.setState({
      guestCanPause: e.target.value === "true" ? true : false,
    });
  }

  handleRoomButtonPressed() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        votes_to_skip: this.state.votesToSkip,
        guest_can_pause: this.state.guestCanPause,
      }),
    };

    fetch("/api/create-room", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        this.props.history.push("/room/" + data.code);
      });
  }

  handleUpdateButtonsPressed() {
    const requestOptions = {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        votes_to_skip: this.state.votesToSkip,
        guest_can_pause: this.state.guestCanPause,
        code: this.props.roomCode,
      }),
    };

    fetch("/api/update-room", requestOptions).then((response) => {
      if (response.ok) {
        this.setState({
          success: "Room Updated Successfully!",
        });
      } else {
        this.setState({
          error: "Error Updating Room...",
        });
      }
      // Update the state of the parent Room component
      this.props.updateCallback();
    });
  }

  renderCreateButtons() {
    return (
      <Grid container spacing={1}>
        <Grid item xs={6} container direction="row" justifyContent="flex-end">
          <Button
            color="secondary"
            variant="contained"
            onClick={this.handleRoomButtonPressed}
          >
            Create
          </Button>
        </Grid>

        <Grid item xs={6} container direction="row" justifyContent="flex-start">
          <Button color="primary" variant="contained" to="/" component={Link}>
            Back
          </Button>
        </Grid>
      </Grid>
    );
  }

  renderUpdateButtons() {
    return (
      <Grid item xs={12}>
        <Button
          color="secondary"
          variant="contained"
          onClick={this.handleUpdateButtonsPressed}
        >
          Update
        </Button>
      </Grid>
    );
  }

  render() {
    const title = this.props.update ? "Update Room" : "Create Room";

    return (
      <div className="center-wrapper">
        <Grid container spacing={2}>
          <Grid item xs={12} container justifyContent="center">
            <Collapse in={this.state.error !== "" || this.state.success !== ""}>
              {this.state.success !== "" && (
                <Alert
                  severity="success"
                  onClose={() => this.setState({ success: "" })}
                >
                  {this.state.success}
                </Alert>
              )}

              {this.state.error !== "" && (
                <Alert
                  severity="error"
                  onClose={() => this.setState({ error: "" })}
                >
                  {this.state.error}
                </Alert>
              )}
            </Collapse>
          </Grid>
          <Grid item xs={12} align="center">
            <Typography component="h4" variant="h4" style={{}}>
              {title}
            </Typography>
          </Grid>

          <Grid item xs={12} align="center">
            <FormControl component="fieldset">
              <FormHelperText component="div">
                <div align="center">Guest Control of Playback state</div>
              </FormHelperText>
              <RadioGroup
                row
                defaultValue={this.props.guestCanPause.toString()}
                onChange={this.handleGuestCanPauseChange}
              >
                <FormControlLabel
                  value="true"
                  control={<Radio color="primary" />}
                  label="Play/Pause"
                  labelPlacement="bottom"
                />
                <FormControlLabel
                  value="false"
                  control={<Radio color="secondary" />}
                  label="No Control"
                  labelPlacement="bottom"
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12} align="center">
            <FormControl>
              <TextField
                required={true}
                type="number"
                onChange={this.handleVotesChange}
                defaultValue={this.state.votesToSkip}
                inputProps={{ min: 1, style: { textAlign: "center" } }}
              />
              <FormHelperText component="div">
                <div align="center">Votes to skip the song</div>
              </FormHelperText>
            </FormControl>
          </Grid>

          {this.props.update
            ? this.renderUpdateButtons()
            : this.renderCreateButtons()}
        </Grid>
      </div>
    );
  }
}

export default CreateRoom;
