const express = require("express");
const app = express();
const ejs = require("ejs");
const chalk = require("chalk");
const http = require("http").createServer(app);
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const session = require("express-session");
const BetterMemoryStore = require("session-memory-store")(session);
const grid = require("gridfs-stream");
const mongoose = require("mongoose");
const upload = require("./routes/upload");
const images = require("./routes/images");
const uploadJob = require("./routes/cron").uploadJob;
const pingJob = require("./routes/cron").pingJob;

let port = process.env.PORT || 3000;

//Server config
http.listen(port, () => {
  console.log(chalk.green(`Listening on port: ${port}`));
});

let con = mongoose.createConnection(process.env.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let gfs;

const UserSchema = mongoose.Schema({
  userid: String,
  username: String,
  token: String,
  tokenSecret: String,
  firstPic: Boolean,
});

const User = con.model("User", UserSchema, "users");

con.once("open", () => {
  gfs = grid(con.db, mongoose.mongo);
  gfs.collection("uploads");
});

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.twitterKey,
      consumerSecret: process.env.twitterSecret,
      callbackURL: process.env.callbackURL,
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
            firstPic: false,
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));

var store = new BetterMemoryStore({ expires: 60 * 60 * 1000, debug: true });
app.use(
  session({
    name: "session",
    secret: process.env.sesSecret,
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
    let message = req.cookies.message;
    let error = req.cookies.error;
    res.render("index", {
      username: req.user.username,
      message: message,
      error: error,
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

app.get("/ping", (req, res) => {
  res.send("Sending ping to keep Heroku from idling");
});

uploadJob.start();
pingJob.start();

module.exports = app;
