var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
const cors = require("cors")();
const passport = require("passport");
const passportConfig = require("./config/passport");

var indexRouter = require("./routes/index");
//var usersRouter = require("./routes/users");

var app = express();

// 토큰을 위한 시크릿 키 config
const config = require("./config");

const { sequelize } = require("./models/index.js");

const driver = () => {
  sequelize
    .authenticate()
    .then(() => {
      console.log("초기화 완료.");
    })
    .catch((err) => {
      console.error("초기화 실패");
      console.error(err);
    });
};
driver();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.set("etag", false);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(passport.initialize());
passportConfig();

app.use("/", indexRouter);
//app.use("/users", usersRouter);

// jwt 시크릿 토큰 세팅
app.set("jwt-secret", config.secret);
app.set("app_key", config.app_key);
app.set("emailId", config.emailId);
app.set("emailPassword", config.emailPassword);
//aws s3 key
app.set("AWS_ACCESS_KEY", config.AWS_ACCESS_KEY);
app.set("AWS_SECRET_ACCESS_KEY", config.AWS_SECRET_ACCESS_KEY);
app.set("AWS_REGION", config.AWS_REGION);
app.set("AWS_BUCKER", config.AWS_BUCKER);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
