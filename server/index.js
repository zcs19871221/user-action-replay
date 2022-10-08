const http = require("http");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");

const logDir = path.join(__dirname, "../log");

const getFiles = () => {
  return fs
    .readdirSync(logDir)
    .filter((name) => name.includes(".json"))
    .map((name) => fs.readFileSync(path.join(logDir, name), "utf-8"));
};

http
  .createServer((req, res) => {
    try {
      if (req.url.includes("/api/record")) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        if (req.method === "GET") {
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(JSON.stringify(getFiles()));
          return;
        }
        if (req.method === "POST") {
          const target = fs.createWriteStream(
            path.join(logDir, String(Date.now()) + ".json")
          );
          pipeline(req, target, (err) => {
            if (err) {
              console.error(err);
            }
            res.end("");
          });
          return;
        }
      }
      res.end("");
    } catch (error) {
      console.error(error);
    }
  })
  .listen(9981);
