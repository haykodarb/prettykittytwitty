require("dotenv").config();
const express = require("express");
const next = require("next");

const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const session = require("express-session");
const MongoStore = require("connect-mongo");
const grid = require("gridfs-stream");
const mongoose = require("mongoose");
const upload = require("./routes/upload");
const images = require("./routes/images");
const cronJob = require("./utils/cron");
const { encrypt } = require("./utils/crypto");
const crypto = require("crypto");

let port = process.env.SERVER_PORT;

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev: dev, dir: "./web" });
const handle = app.getRequestHandler();

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

app.prepare().then(() => {
	const server = express();

	server.use(express.json());
	server.use(express.urlencoded());
	server.use(cookieParser());

	const store = MongoStore.create({
		mongoUrl: process.env.MONGO_URL,
	});

	server.use(
		session({
			name: "session",
			secret: process.env.SESSION_SECRET,
			store: store,
			resave: true,
			cookie: { maxAge: 600000, secure: false, sameSite: "none" },
		})
	);

	server.use(passport.initialize());
	server.use(passport.session());
	server.use("/api/upload", upload);
	server.use("/api/images", images);

	server.get("/twitter", passport.authenticate("twitter"));

	server.get(
		"/callback",
		passport.authenticate("twitter", {
			failureRedirect: `/login`,
			successRedirect: "/",
		})
	);

	server.get("/", (req, res) => {
		if (req.user) {
			app.render(req, res, "/");
		} else {
			res.redirect("/login");
		}
	});

	server.get("/login", (req, res) => {
		if (!req.user) {
			app.render(req, res, "/login");
		} else {
			res.redirect("/");
		}
	});

	server.get("*", (req, res) => {
		return handle(req, res);
	});

	server.listen(process.env.SERVER_PORT, (err) => {
		if (err) throw err;
		console.log("Server ready");
	});
});

cronJob.start();

module.exports = app;
