const express = require('./express');
const httpServer = require("http").createServer(express);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://127.0.0.1:5500",
  },
});

io.on('connection', async (socket) => {
  console.log(`a user connected ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`user disconnected ${socket.id}`);
  });
  const sockets = await io.fetchSockets();
  const numPlayers = sockets.length;
  io.emit('numPlayers', numPlayers);

  socket.on('new_challenge', () => {
    console.log('new challenge');
  });
});

const port = process.env.PORT || 3000;
httpServer.listen(port);