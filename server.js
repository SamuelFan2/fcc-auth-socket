"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const routes = require("./routes.js");
const auth = require("./auth.js");
const mongoose = require("mongoose");

const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);
const passportSocketIo = require("passport.socketio");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo")(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

app.set("view engine", "pug");
app.set("views", "./views/pug");

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
    key: "express.sid",
    store: store,
  })
);

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "express.sid",
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB連線成功");
  })
  .catch((e) => {
    console.log("MongoDB連線失敗", e);
  });

routes(app);
auth(app);

// myDB(async (client) => {
//   try {
//     const myDataBase = await client.db("database").collection("user");
//     routes(app, myDataBase);
//     auth(app, myDataBase);
//   } catch (e) {
//     app.route("/").get((req, res) => {
//       res.render("index", {
//         title: e,
//         message: "Unable to connect to database",
//       });
//     });
//   }
// });

io.on("connection", (socket) => {
  let currentUsers = 0;
  console.log("A user has connected");
  ++currentUsers;
  io.emit("user", {
    username: socket.request.user.username || socket.request.user.name,
    currentUsers,
    connected: true,
  });

  socket.on("disconnect", () => {
    console.log("A user has logout");
    currentUsers--;
    io.emit("user", {
      username: socket.request.user.username || socket.request.user.name,
      currentUsers,
      connected: false,
    });
  });

  socket.on("chat message", (message) => {
    io.emit("chat message", {
      username: socket.request.user.username || socket.request.user.name,
      message,
    });
  });
});

function onAuthorizeSuccess(data, accept) {
  console.log("successful connection to socket.io");

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);
  accept(null, false);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
