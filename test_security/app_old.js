const U2F = require("u2f");
const Express = require("express");
const BodyParser = require("body-parser");
const Cors = require("cors");
const HTTPS = require("https");
const FS = require("fs");

const APP_ID = "https://dev2.maple.mdugre.info:3443";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
app.use(Cors());

var user;

app.get("/register", (request, response, next) => {
  var session = U2F.request(APP_ID);
  app.set("session", JSON.stringify(session));
  response.send(session);
});
app.post("/register", (request, response, next) => {
  var registration = U2F.checkRegistration(JSON.parse(app.get("session")), request.body.registerResponse);
  if(!registration.successful) {
      return response.status(500).send({ message: "error" });
  }
  user = registration;
  response.send(registration);
});
app.get("/login", (request, response, next) => {
  var session = U2F.request(APP_ID, user.keyHandle);
  app.set("session", JSON.stringify(session));
  response.send(session);
});
app.post("/login", (request, response, next) => {
  var success = U2F.checkSignature(JSON.parse(app.get("session")), request.body.loginResponse, user.publicKey);
  response.send(success);
});

HTTPS.createServer({
    key: FS.readFileSync("../dev/nginx/conf.d/dev2.maple.mdugre.info.key.pem"),
    cert: FS.readFileSync("../dev/nginx/conf.d/dev2.maple.mdugre.info.cert.pem")
}, app).listen(3443, () => {
    console.log("Listening at :3443...");
});
