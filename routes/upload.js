require("dotenv").config();
const express = require("express");
const multer = require("multer");
const grid = require("gridfs-stream");
const crypto = require("crypto");
const mongoose = require("mongoose");
const request = require("request");
const path = require("path");
const streamifier = require("streamifier");
const cookieParser = require("cookie-parser");
const cors = require("cors");

let gfs;
let con = mongoose.createConnection(process.env.MONGO_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

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

const router = express.Router();
router.use(cors());
router.use(express.json());
router.use(cookieParser());

let tempUpload = multer({ storage: multer.memoryStorage() });

router.post(
	"/",
	tempUpload.single("myImage"),
	verifyImage,
	verifyCat,
	upload,
	(req, res) => {
		//Primero revisa si el usuario ya creó fotos y cambia esa propiedad.
		res.json({
			message: "uwu thanks for uploading a pretty kitty :-)",
			isError: false,
		});
	}
);

function verifyImage(req, res, next) {
	let fileType = req.file.mimetype;
	if (
		fileType === "image/jpg" ||
		fileType === "image/jpeg" ||
		fileType === "image/png"
	) {
		if (req.file.size > 2097152 * 4) {
			res.json({
				message:
					"._. ummmmm it seems your kitty might be a bit too fat :P, please upload one that is under 8mb",
				isError: true,
			});
		} else {
			next();
		}
	} else {
		res.json({
			message:
				"OwO we had a small issue >.< your kitty most come in jpg, jpeg o png formats, sowwy (；ω；)",
			isError: true,
		});
	}
}

function verifyCat(req, res, next) {
	let formData = {
		image: req.file.buffer,
		limit: 10,
	};
	request
		.post(
			{ url: "https://api.imagga.com/v2/tags", formData: formData },
			function (error, response, body) {
				if (typeof JSON.parse(body).result != "undefined") {
					let tags = JSON.parse(body).result.tags;
					let isCat = false;
					tags.forEach((result) => {
						if (
							result.confidence > 60 &&
							(result.tag.en === "kitten" ||
								result.tag.en === "cat" ||
								result.tag.en === "kitty")
						) {
							isCat = true;
						}
					});
					if (!isCat) {
						res.json({
							message:
								"The page is called Pretty Kitty Twitty, not Pretty Whatever The Fuck You Want Twitty, please upload cat pictures or leave.",
							isError: true,
						});
					} else {
						next();
					}
				} else {
					res.json({
						message:
							"aaAaAA sowwyYYY, there was an issue when reviewing your picture, please check that it's a valid image file.",
						isError: true,
					});
				}
			}
		)
		.auth(process.env.API_KEY, process.env.API_SECRET, true);
}

function upload(req, res, next) {
	crypto.randomBytes(8, (err, buf) => {
		if (err) {
			console.log(err);
		}
		let newName = buf.toString("hex") + path.extname(req.file.originalname);
		let upStream = gfs.createWriteStream({
			filename: newName,
			root: "uploads",
			content_type: req.file.mimetype,
			metadata: {
				username: req.user.username,
				inTwitter: false,
				originalName: req.file.originalname,
			},
		});
		let buffer = req.file.buffer;
		streamifier.createReadStream(buffer).pipe(upStream);
		upStream.once("close", () => {
			next();
		});
	});
}

module.exports = router;
