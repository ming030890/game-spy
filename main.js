const express = require('./express');
const challenges = require('./challenges');
const httpServer = require("http").createServer(express);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://127.0.0.1:5500",
  },
});

async function emitNumUsers() {
  const sockets = await io.fetchSockets();
  const numPlayers = sockets.length;
  io.emit('numPlayers', numPlayers);
}

function onNewChallenge(socket) {
  socket.on('new_challenge', async () => {
    const sockets = await io.fetchSockets();
    const numPlayers = sockets.length;
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    const spyChallengeId = Math.floor(Math.random() * 2);
    const spy = Math.floor(Math.random() * numPlayers);
    console.log('sockets.entries(): ' + sockets.length);
    for (const [index, socket] of sockets.entries()) {
      if (index == spy) {
        socket.emit('challenge', challenge[spyChallengeId]);
      } else {
        socket.emit('challenge', challenge[1 - spyChallengeId]);
      }
    }
  });
}

io.on('connection', async (socket) => {
  console.log(`a user connected ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`user disconnected ${socket.id}`);
  });
  await emitNumUsers();
  onNewChallenge(socket);
});

const port = process.env.PORT || 3000;
httpServer.listen(port);