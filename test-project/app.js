const bodyParser = require("body-parser");
const express = require("express");
const port = process.env.PORT || 8045;
const open = require("open");

const chromium = require("chromium");
const { execFile } = require("child_process");
const app = express();
const path = require("path");
const staticFolderPath = path.join(__dirname, "client");

app.use(bodyParser.json({ type: "application/json" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(staticFolderPath));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Credentials", false);
  res.header("Access-Control-Max-Age", "86400");
  res.header("X-HTTP-Method-Override, Content-Type, Accept");
  next();
});

function runChrome(url) {
  execFile(chromium.path, [url, "--auto-open-devtools-for-tabs"], err => {
    console.log("Google Chrome closed");
    runChrome(url);
  });
}

app.listen(port, function() {
  const url = `http://localhost:${port}/`;
  console.log(`App: ${url}`);
  runChrome(url);
});
