const express = require("express");
const multer = require("multer");
const grid = require("gridfs-stream");
const crypto = require("crypto");
const mongoose = require("mongoose");
const request = require("request");
const path = require("path");
const streamifier = require("streamifier");
const { read } = require("fs");
const cookieParser = require('cookie-parser');

let gfs;
let con = mongoose.createConnection(process.env.mongoURI, {
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
router.use(express.json());
router.use(cookieParser());

let tempUpload = multer({ storage: multer.memoryStorage() });

router.get("/", (req, res) => {
  res.redirect("https://prettykittytwitty.herokuapp.com/");
});

router.post(
  "/",
  tempUpload.single("myImage"),
  verifyImage,
  verifyCat,
  upload,
  (req, res) => {
    //Primero revisa si el usuario ya creó fotos y cambia esa propiedad.
    gfs.files
      .find({ "metadata.username": req.user.username })
      .toArray((err, result) => {
        if (err) {
          console.log(err);
        }
        if (result.length === 1) {
          User.updateOne(
            { username: req.user.username },
            { firstPic: true },
            (err) => {
              if (err) {
                console.log(err);
              }
            }
          );
        }
        res.cookie("message", "uwu gracias por subir un lindo gatito (✿ ♡‿♡)");
        res.cookie("error", false);
        res.redirect("../");
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
    if (req.file.size > 2097152) {
      res.cookie(
        "message",
        "._. eeemmmm parece que tu gatito es demasiado gordo jiji, por favor subí uno que pese menos de 2mb :-)"
      );
      res.cookie("error", true);
      res.redirect("../");
    } else {
      next();
    }
  } else {
    res.cookie(
      "message",
      "OwO tuvimos un problemita >.< tu gatito tiene que venir en formato jpg, jpeg o png, perdon (；ω；) "
    );
    res.cookie("error", true);
    res.redirect("../");
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
            res.cookie(
              "message",
              "La página se llama Pretty Kitty Twitty, no Pretty Lo Que Se Te Cante El Culo Twitty. Por favor subí fotos de gatitos o andate."
            );
            res.cookie("error", true);
            res.redirect("../");
          } else {
            next();
          }
        } else {
          res.cookie(
            "message",
            "aaAaAA perdónnnNN, hubo un error al revisar la imagen, revisá que sea un archivo válido."
          );
          res.cookie("error", true);
          res.redirect("../");
        }
      }
    )
    .auth(process.env.apiKey, process.env.apiSecret, true);
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
