const express = require("express");
const scraper = require("./src/scraper");
const app = express();

//Home page
// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/index.html");
// });

//API route
app.get("/api/search", (req, res) => {
  scraper
    .search(req.query.q, req.query.key, req.query.pageToken, req.query.language)
    .then((x) => res.json(x))
    .catch((e) => res.send(e));
});

app.get("/api/channel/videos", (req, res) => {
  scraper
    .getChannel(req.query.id, req.query.language)
    .then((x) => res.json(x))
    .catch((e) => res.send(e));
});

app.listen(process.env.PORT || 8080, function () {
  console.log("Listening on port 8080");
});

module.exports = app;
