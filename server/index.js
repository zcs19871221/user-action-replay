const http = require("http");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");

const logDir = path.join(__dirname, "../log");

const getFiles = () => {
  return fs
    .readdirSync(logDir)
    .filter((name) => name.includes(".json"))
    .map((name) => ({
      key: path.basename(name).replace(".json"),
      content: fs.readFileSync(path.join(logDir, name), "utf-8"),
    }));
};

const delFile = (target) => {
  fs.readdirSync(logDir)
    .filter((name) => (target ? name.includes(target) : true))
    .forEach((name) => {
      fs.unlinkSync(path.join(logDir, name));
    });
};

http
  .createServer((req, res) => {
    try {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      if (req.url.includes("/api/record")) {
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
      } else if (req.url.includes("/api/delete")) {
        const name = req.url.split("?name=")[1];
        delFile(name);
      }
      res.end("");
    } catch (error) {
      console.error(error);
    }
  })
  .listen(9981);
