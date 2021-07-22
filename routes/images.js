require("dotenv").config();

const grid = require("gridfs-stream");
const express = require("express");
const mongoose = require("mongoose");

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
	backendToken: String,
});

const User = con.model("User", UserSchema, "users");

con.once("open", () => {
	gfs = grid(con.db, mongoose.mongo);
	gfs.collection("uploads");
});

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded());

function verifyUser(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");

	User.findOne({ username: req.query.username }, (err, result) => {
		if (result) {
			if (result.backendToken == req.query.token) {
				next();
			} else {
				res.status(400).send("Token incorrecto");
			}
		} else {
			res.status(400).send("Token incorrecto");
		}
	});
}

router.get("/", verifyUser, (req, res) => {
	let isUploaded = req.query.uploaded == "true";
	let data = new Array();
	gfs.files
		.find({
			"metadata.username": req.query.username,
		})
		.sort({ _id: 1 })
		.toArray((err, files) => {
			let newFiles = new Array();
			if (files || files.length > 0) {
				files.forEach((file, index, array) => {
					if (file.metadata.inTwitter == isUploaded) {
						newFiles.push(file);
					}
				});
				if (newFiles.length > 0) {
					newFiles.forEach((file, index, array) => {
						let image;
						const readStream = gfs.createReadStream(file.filename, {
							encoding: "base64",
						});
						const chunks = [];
						readStream.on("data", function (chunk) {
							chunks.push(chunk);
						});
						readStream.on("end", function () {
							image = Buffer.concat(chunks).toString("base64");
							data.push({
								b64content: image,
								fileType: file.contentType,
							});
							if (data.length === array.length) {
								res.status(200).json({
									data,
								});
							}
						});
					});
				} else {
					res.status(400).json({
						error: "No hay imágenes para mostrar",
					});
				}
			} else {
				res.status(400).json({
					error: "No hay imágenes para mostrar",
				});
			}
		});
});

module.exports = router;
