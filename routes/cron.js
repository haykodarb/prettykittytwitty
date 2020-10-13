const Twit = require("twit");
let CronJob = require("cron").CronJob;
const grid = require("gridfs-stream");
const mongoose = require("mongoose");
const request = require("request");

const con = mongoose.createConnection(process.env.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

con.once("open", () => {
  gfs = grid(con.db, mongoose.mongo);
  gfs.collection("uploads");
});

const UserSchema = mongoose.Schema({
  userid: String,
  username: String,
  firstPic: Boolean,
  token: String,
  tokenSecret: String,
});

const User = con.model("User", UserSchema, "users");

let uploadJob = new CronJob("0 0 */3 * * *", () => {
  console.log("Cron job started");
  User.find((err, result) => {
    result.forEach((user) => {
      let T = new Twit({
        consumer_key: process.env.twitterKey,
        consumer_secret: process.env.twitterSecret,
        access_token: user.token,
        access_token_secret: user.tokenSecret,
        timeout_ms: 60 * 1000,
        strictSSL: true,
      });
      gfs.files
        .find({
          "metadata.username": user.username,
          "metadata.inTwitter": false,
        })
        .toArray((err, files) => {
          if (files.length > 0) {
            const readStream = gfs.createReadStream(files[0].filename, {
              encoding: "base64",
            });
            const chunks = [];
            readStream.on("data", function (chunk) {
              chunks.push(chunk);
            });
            // Send the buffer or you can put it into a var
            readStream.on("end", function () {
              let b64content = Buffer.concat(chunks).toString("base64");
              T.post("media/upload", { media_data: b64content }, function (
                err,
                data,
                response
              ) {
                var mediaIdStr = data.media_id_string;
                var altText = "Pretty cat picture.";
                var meta_params = {
                  media_id: mediaIdStr,
                  alt_text: { text: altText },
                };
                T.post("media/metadata/create", meta_params, function (
                  err,
                  data,
                  response
                ) {
                  if (!err) {
                    // now we can reference the media and post a tweet (media will attach to the tweet)
                    var params = {
                      status: "",
                      media_ids: [mediaIdStr],
                    };
                    T.post("statuses/update", params, function (
                      err,
                      data,
                      response
                    ) {
                      if (!err) {
                        gfs.files.updateOne(
                          { filename: files[0].filename },
                          { $set: { "metadata.inTwitter": true } },
                          (err) => {
                            if (err) {
                              console.log(err);
                            }
                          }
                        );
                      }
                    });
                  }
                });
              });
            });
          }
        });
    });
  });
});

let pingJob = new CronJob("0 */15 * * * *", () => {
  request.get(
    "https://prettykittytwitty.herokuapp.com/ping",
    {},
    (error, response, body) => {
      console.log(body);
      return;
    }
  );
});

module.exports.uploadJob = uploadJob;

module.exports.pingJob = pingJob;
