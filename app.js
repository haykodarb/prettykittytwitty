require('dotenv').config();
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const session = require("express-session");
const BetterMemoryStore = require("session-memory-store")(session);
const grid = require("gridfs-stream");
const mongoose = require("mongoose");
const upload = require("./routes/upload");
const images = require("./routes/images");
const cronJobs = require("./routes/cron");

let port = process.env.SERVER_PORT;

//Server config
http.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});

let con = mongoose.createConnection(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let gfs;

const UserSchema = mongoose.Schema({
  userid: String,
  username: String,
  token: String,
  tokenSecret: String,
});

const User = con.model("User", UserSchema, "users");

con.once("open", () => {
  gfs = grid(con.db, mongoose.mongo);
  gfs.collection("uploads");
});

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK_URL,
    },
    function (token, tokenSecret, profile, callback) {
      User.findOne({ username: profile.username }, (err, result) => {
        if (err) {
          console.log(err);
        }
        if (result) {
          User.updateOne(
            { username: profile.username },
            { token: token, tokenSecret: tokenSecret },
            (err) => {
              if (err) {
                console.log(err);
              }
            }
          );
          console.log("Usuario actualizado");
        } else {
          let user = new User({
            userid: profile.id,
            username: profile.username,
            token: token,
            tokenSecret: tokenSecret,
          });
          user.save();
        }
      });
      return callback(null, profile);
    }
  )
);

passport.serializeUser(function (user, callback) {
  callback(null, user);
});
passport.deserializeUser(function (object, callback) {
  callback(null, object);
});

// view engine setup
app.set("views", path.join("./public/views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));

let store = new BetterMemoryStore({ expires: 60 * 60 * 1000, debug: true });

app.use(
  session({
    name: "session",
    secret: process.env.SESSION_SECRET,
    store: store,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/upload", upload);
app.use("/images", images);

app.get("/", (req, res) => {
  if (typeof req.user === "object") {
    res.render("index", {
      username: req.user.username,
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

/** Add twitter login and return methoods */
app.get("/twitter", passport.authenticate("twitter"));

app.get(
  "/callback",
  passport.authenticate("twitter", {
    failureRedirect: "/home",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

cronJobs.uploadJob.start();

module.exports = app;
