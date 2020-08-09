const grid = require("gridfs-stream");
const express = require("express");
const mongoose = require("mongoose");
const mongoURI =
  "mongodb+srv://prettykittytwitty:cGJAs1QJkNfpChL8@prettykittytwitty.cxgd7.gcp.mongodb.net/prettykittytwitty?retryWrites=true&w=majority";

let gfs;
let con = mongoose.createConnection(process.env.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

con.once("open", () => {
  gfs = grid(con.db, mongoose.mongo);
  gfs.collection("uploads");
});

const router = express.Router();
router.use(express.json());

router.post("/nosubidas", (req, res) => {
  let data = new Array();
  gfs.files
    .find({
      "metadata.username": req.body.username,
    })
    .toArray((err, files) => {
      let newFiles = new Array();
      if (files || files.length > 0) {
        files.forEach((file, index, array) => {
          if (file.metadata.inTwitter === false) {
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
                res.json({
                  data,
                });
              }
            });
          });
        } else {
          res.status(400).send("No hay imagenes");
        }
      } else {
        res.status(400).send("No hay imagenes");
      }
    });
});

router.post("/subidas", (req, res) => {
  let data = new Array();
  gfs.files
    .find({
      "metadata.username": req.body.username,
    })
    .toArray((err, files) => {
      let newFiles = new Array();
      if (files || files.length > 0) {
        files.forEach((file, index, array) => {
          if (file.metadata.inTwitter === true) {
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
                res.json({
                  data,
                });
              }
            });
          });
        } else {
          res.status(204).json({
            error: "No hay imágenes para mostrar",
          });
        }
      } else {
        res.status(204).json({
          error: "No hay imágenes para mostrar",
        });
      }
    });
});

module.exports = router;
