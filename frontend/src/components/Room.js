import React, { Component } from "react";
import { Button, Typography, Grid } from "@material-ui/core";
import { Link } from "react-router-dom";
import CreateRoom from "./CreateRoom";
import MusicPlayer from "./MusicPlayer";

export class Room extends Component {
  constructor(props) {
    super(props);

    this.state = {
      votesToSkip: 2,
      guestCanPause: false,
      isHost: false,
      showSettings: false,
      spotifyAuthenticated: false,
      song: {},
    };

    this.roomCode = this.props.match.params.roomCode;
    this.leaveButtonPressed = this.leaveButtonPressed.bind(this);
    this.updateShowSettings = this.updateShowSettings.bind(this);
    this.renderSettingsButton = this.renderSettingsButton.bind(this);
    this.renderSettings = this.renderSettings.bind(this);
    this.getRoomDetails = this.getRoomDetails.bind(this);
    this.authenticateSpotify = this.authenticateSpotify.bind(this);
    this.getCurrentSong = this.getCurrentSong.bind(this);

    this.getRoomDetails();
    this.getCurrentSong();
  }

  // get current playing song very 1 sec
  componentDidMount() {
    this.interval = setInterval(this.getCurrentSong, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  // if the user is host, we need to authenticate with spotify
  authenticateSpotify() {
    fetch("/spotify/is_authenticated")
      .then((response) => response.json())
      .then((data) => {
        this.setState({
          spotifyAuthenticated: data.status,
        });
        // If the host is not authenticated, we need to authenticate
        if (!data.status) {
          fetch("/spotify/get-auth-url")
            .then((response) => response.json())
            .then((data) => {
              // Go to the spotify authentication page
              window.location.replace(data.url);
            });
        }
      });
  }

  // Get the host's currenly playing song
  getCurrentSong() {
    fetch("/spotify/current-song")
      .then((res) => {
        console.log(res);
        if (!res.ok || res.status === 204) {
          return {};
        }
        return res.json();
      })
      .then((data) => {
        // console.log(data);
        this.setState({
          song: data,
        });
      });
  }

  getRoomDetails() {
    fetch("/api/get-room?code=" + this.roomCode)
      .then((res) => {
        // If room code invalid or not exist, we clear roomCode of parent and redirect to parent
        if (!res.ok) {
          this.props.leaveRoomCallback();
          this.props.history.push("/");
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        this.setState({
          votesToSkip: data["votes_to_skip"],
          guestCanPause: data["guest_can_pause"],
          isHost: data["is_host"],
        });

        // If the user is host, authenticate with spotify
        if (this.state.isHost) {
          this.authenticateSpotify();
        }
      });
  }

  leaveButtonPressed() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/api/leave-room", requestOptions)
      .then((res) => {
        // leave-room api always return success, so redirect to home anyway
        this.props.leaveRoomCallback();
        this.props.history.push("/");
      })
      .catch((err) => console.log(err));
  }

  updateShowSettings(value) {
    this.setState({
      showSettings: value,
    });
  }

  renderSettingsButton() {
    return (
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => this.updateShowSettings(true)}
        >
          Settings
        </Button>
      </Grid>
    );
  }

  renderSettings() {
    return (
      <Grid container align="center" spacing={1}>
        <Grid item xs={12}>
          <CreateRoom
            update={true}
            votesToSkip={this.state.votesToSkip}
            guestCanPause={this.state.guestCanPause}
            roomCode={this.roomCode}
            updateCallback={this.getRoomDetails}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => this.updateShowSettings(false)}
          >
            Close
          </Button>
        </Grid>
      </Grid>
    );
  }

  render() {
    if (this.state.showSettings) {
      return this.renderSettings();
    }
    return (
      <Grid container spacing={1} align="center">
        <Grid item xs={12}>
          <Typography variant="h6" component="h6">
            Code: {this.roomCode}
          </Typography>
        </Grid>
        {JSON.stringify(this.state.song) === "{}" ? (
          <Grid item xs={12}>
            <Typography variant="h6" component="h6">
              This room don't have a currently playing song...
            </Typography>
          </Grid>
        ) : (
          <Grid item container xs={12} direction="row" justifyContent="center">
            <MusicPlayer {...this.state.song} />
          </Grid>
        )}

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="secondary"
            onClick={this.leaveButtonPressed}
          >
            Leave
          </Button>
        </Grid>

        {this.state.isHost ? this.renderSettingsButton() : null}
      </Grid>
    );
  }
}

export default Room;

/*
 <h3>{this.roomCode}</h3>
        <p>{this.state.votesToSkip}</p>
        <p>{this.state.guestCanPause ? "true" : "false"}</p>
        <p>{this.state.isHost ? "true" : "false"}</p>
*/
