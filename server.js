"use strict";
const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")));

const botname = "Chatchord bot";

io.on("connection", (socket) => {
  // join room
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // single client
    socket.emit("message", formatMessage(botname, "Welcome!"));

    // all clients except the connecting client in specific room

    console.log(user);

    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botname, `${user.username} has joined the chat`)
      );

    // send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
    // all clients except the connecting client
    // socket.broadcast.emit(
    //   "message",
    //   formatMessage(botname, "A user has joined the chat")
    // );
  });

  // all clients
  //   io.emit();

  // listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      // send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
      // bot chat
      io.to(user.room).emit(
        "message",
        formatMessage(botname, user.username + " has left the chat.")
      );
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
