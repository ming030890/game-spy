const express = require('./express');
const challenges = require('./challenges');
const httpServer = require("http").createServer(express);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://127.0.0.1:5500",
  },
});

let alivePlayers = [];
let spyUserName;
let gameover = true;

async function emitNumUsers() {
  const sockets = await io.fetchSockets();
  const numPlayers = sockets.length;
  io.emit('numPlayers', numPlayers);
}

function onNewChallenge(socket) {
  socket.on('new_challenge', async () => {
    alivePlayers = [];
    gameover = false;
    const sockets = await io.fetchSockets();
    const numPlayers = sockets.length;
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    const spyChallengeId = Math.floor(Math.random() * 2);
    const spy = Math.floor(Math.random() * numPlayers);
    for (const [index, socket] of sockets.entries()) {
      alivePlayers.push(socket.username);
    }
    for (const [index, socket] of sockets.entries()) {
      const response = {};
      response['players'] = alivePlayers;
      if (index == spy) { 
        response['challenge'] = challenge[spyChallengeId];
        spyUserName = socket.username;
      } else {
        response['challenge'] = challenge[1 - spyChallengeId];
      }
      socket.emit('challenge', response);
    }
  });
}

function onVote(socket) {
  socket.on('vote', async (username) => {
    if (gameover) {
      return;
    }
    const index = alivePlayers.indexOf(username);
    if (index < 0) {
      return;
    }
    alivePlayers.splice(index, 1);
    io.emit('next_round', alivePlayers);
    if (username === spyUserName) {
      const response = {};
      response['winner'] = 'citizens';
      response['spy'] = spyUserName;
      io.emit('win', response);
      gameover = true;
      return;
    }
    if (alivePlayers.length <= 2) {
      const response = {};
      response['winner'] = 'spy';
      response['spy'] = spyUserName;
      io.emit('win', response);
      gameover = true;
      return;
    }
  });
}

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

io.on('connection', async (socket) => {
  console.log(`a user connected ${socket.username}`);
  socket.on('disconnect', async () => {
    console.log(`user disconnected ${socket.username}`);
    await emitNumUsers();
    const index = alivePlayers.indexOf(socket.username);
    alivePlayers.splice(index, 1);
    io.emit('next_round', alivePlayers);
  });
  await emitNumUsers();
  onNewChallenge(socket);
  onVote(socket);
});

const port = process.env.PORT || 3000;
httpServer.listen(port);