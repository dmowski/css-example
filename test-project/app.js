const bodyParser = require("body-parser");
const express = require("express");
const port = process.env.PORT || 8045;
const open = require("open");

const app = express();

app.use(bodyParser.json({ type: "application/json" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("client"));
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

app.listen(port, function() {
  console.log(`Example app listening on port ${port}!`);
  open(`http://localhost:${port}/`);
});
