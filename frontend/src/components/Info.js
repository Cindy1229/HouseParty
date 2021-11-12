import React, { useState, useEffect } from "react";
import { Grid, Button, Typography, IconButton } from "@material-ui/core";
import { NavigateBefore, NavigateNext } from "@material-ui/icons";
import { Link } from "react-router-dom";

const pages = {
  JOIN: "pages.join",
  CREATE: "pages.create",
};

function Info() {
  const [page, setPage] = useState(pages.JOIN);

  const joinInfo = () => {
    return "Enter an unique room code to join it. Then you can play/pause and skip the song of the room.";
  };

  const createInfo = () => {
    return "Create a room with a music player, configure the settings to allow users to play/pause and skip songs.";
  };
  return (
    <Grid container spacing={1}>
      <Grid item xs={12} align="center">
        <Typography component="h4" variant="h4">
          What is this app?
        </Typography>
      </Grid>
      <Grid item xs={12} align="center">
        <Typography component="body" variant="body1">
          {page === pages.JOIN ? joinInfo() : createInfo()}
        </Typography>
      </Grid>
      <Grid item xs={12} align="center">
        <IconButton
          style={{ color: "white" }}
          onClick={() => {
            page === pages.JOIN ? setPage(pages.CREATE) : setPage(pages.JOIN);
          }}
        >
          {page === pages.JOIN ? <NavigateNext /> : <NavigateBefore />}
        </IconButton>
      </Grid>
      <Grid item xs={12} align="center">
        <Button color="secondary" variant="contained" to="/" component={Link}>
          Back to Home
        </Button>
      </Grid>
    </Grid>
  );
}

export default Info;
