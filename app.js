require("dotenv").config();
const express = require("express");
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
const cronJob = require("./utils/cron");
const { encrypt } = require("./utils/crypto");
const crypto = require("crypto");

let port = process.env.SERVER_PORT;
let webServer = process.env.WEB_SERVER;

const app = express();
const http = require("http").createServer(app);
const webApp = express();

webApp.listen(80);
webApp.use(express.static(__dirname + "/public/web"));
webApp.use('/dashboard', express.static(__dirname + "/public/web"));
webApp.use('/login', express.static(__dirname + "/public/web"));

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
	backendToken: String,
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
		async function (token, tokenSecret, profile, callback) {
			await User.findOne(
				{ username: profile.username },
				async (err, result) => {
					if (err) {
						console.log(err);
					}
					let encryptedToken = encrypt(token);
					let encryptedSecret = encrypt(tokenSecret);
					let backendToken = crypto.randomBytes(10).toString("hex");
					if (result) {
						await User.updateOne(
							{ username: profile.username },
							{
								token: encryptedToken,
								tokenSecret: encryptedSecret,
								backendToken: backendToken,
							},
							(err) => {
								if (err) {
									console.log(err);
								} else {
								}
							}
						);
					} else {
						let user = new User({
							userid: profile.id,
							username: profile.username,
							token: encryptedToken,
							tokenSecret: encryptedSecret,
							backendToken: backendToken,
						});
						await user.save();
					}
				}
			);
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
app.use("/api/upload", upload);
app.use("/api/images", images);

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
	res.redirect(`${webServer}/login`);
});

app.get("/twitter", passport.authenticate("twitter"));

app.get(
	"/callback",
	passport.authenticate("twitter", {
		failureRedirect: `${webServer}/login`,
	}),
	async (req, res) => {
		await User.findOne({ username: req.user.username }, (err, result) => {
			if (result) {
				res.redirect(
					`${webServer}/dashboard?username=${req.user.username}&token=${result.backendToken}`
				);
			}
		});
	}
);

// hasta arreglar encrypt/decrypt
cronJob.start();

module.exports = app;
