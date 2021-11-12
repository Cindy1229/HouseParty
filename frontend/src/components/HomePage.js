import { Grid, Typography, Button, ButtonGroup } from "@material-ui/core";
import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";
import CreateRoom from "./CreateRoom";
import Info from "./Info";
import Room from "./Room";
import RoomJoin from "./RoomJoin";

export class HomePage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      roomCode: null,
    };

    this.clearRoomCode = this.clearRoomCode.bind(this);
  }

  componentDidMount() {
    fetch("/api/user-in-room")
      .then((res) => res.json())
      .then((data) => {
        this.setState({
          roomCode: data.code,
        });
        console.log(data);
      });
  }

  /*   
        Because we will redicrect back to Homepage from the Room page, we want make sure the roomCode state is reset
        After redirect, this.props.push do not re-render the page
  */
  clearRoomCode() {
    // Clear the room code state
    this.setState({
      roomCode: null,
    });
  }

  renderHomePage() {
    return (
      <Grid container spacing={4} align="center">
        <Grid item xs={12}>
          <Typography variant="h3" compact="h3">
            House Party
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <ButtonGroup disableElevation variant="contained" color="primary">
            <Button color="primary" to="/join" component={Link}>
              Join a Room
            </Button>
            <Button color="secondary" to="/create" component={Link}>
              Create a Room
            </Button>

            <Button color="default" to="/info" component={Link}>
              About
            </Button>
          </ButtonGroup>
        </Grid>
      </Grid>
    );
  }

  render() {
    return (
      <Router>
        <Switch>
          <Route
            exact
            path="/"
            render={() => {
              return this.state.roomCode ? (
                <Redirect to={`/room/${this.state.roomCode}`} />
              ) : (
                this.renderHomePage()
              );
            }}
          ></Route>
          <Route path="/join" component={RoomJoin}></Route>
          <Route path="/create" component={CreateRoom}></Route>
          <Route path="/info" component={Info}></Route>

          <Route
            path="/room/:roomCode"
            render={(props) => {
              return <Room {...props} leaveRoomCallback={this.clearRoomCode} />;
            }}
          ></Route>
        </Switch>
      </Router>
    );
  }
}

export default HomePage;
