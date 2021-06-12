var models = require("../models");
var common = require("./Common");
var sha256 = require("sha256");
const jwt = require("jsonwebtoken");
var moment = require("moment");
var request = require("request");
const nodemailer = require("nodemailer");
var validator = require("validator");
const s3 = require("../routes/s3");

//const curl = new (require( 'curl-request' ))();

function setLog(req, string) {
  var os = req.headers.os;
  var device = req.headers.device;

  var now = moment().format("YYYY-MM-DD");
  //getBrand | getDeviceType | getDeviceName | getModel | getVersion | getBuildNumber
  console.log(now + " - " + string);
}

// 토큰 재발급
let retoken = async (req, res) => {
  try {
    console.log("------------ 토큰 재발급 ------------");
    var refresh_token = req.body.refresh_token;

    if (!refresh_token || refresh_token == "") {
      res.send({
        success: false,
        resultCode: "01",
        message: "토큰 값이 없습니다.",
      });
      return false;
    }

    // 리프레쉬 토큰 인증
    await models.MM_Account_Token.findAll({
      attributes: ["refresh_token"],
      where: {
        refresh_token: refresh_token,
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("retoken : 검색 결과 0개.");
          res.send({
            success: false,
            resultCode: "02",
            message: "유효 하지않은 토큰 값입니다.",
          });
        } else {
          console.log("retoken : 검색 결과 " + dataList.length + "개.");
          console.log("retoken : 토큰 decode 시작.");

          const secret = req.app.get("jwt-secret");
          const decoded = jwt.verify(refresh_token, secret, {
            ignoreExpiration: false, //handled by OAuth2 server implementation
          });

          const now = new Date().toLocaleString();
          var nowTimeStamp = Date.parse(now) / 1000;
          var user = {
            email: decoded.email,
            iss: "http://www.mimo20.com",
            iat: nowTimeStamp,
            nbf: nowTimeStamp,
            exp:
              Date.parse(
                new Date(moment().add("180", "days")).toLocaleString()
              ) / 1000,
          };
          const access_token = jwt.sign(user, secret);

          if (access_token) {
            models.MM_Account_Token.update(
              {
                access_token: access_token,
              },
              {
                where: { refresh_token: refresh_token },
              }
            )
              .then((updateResult) => {
                console.log("retoken[" + decoded.email + "] : 토큰 발급 완료.");
                res.send({
                  success: true,
                  resultCode: "00",
                  message: "토큰 발급.",
                  access_token: access_token,
                });
              })
              .catch((err) => {
                console.log(err);
                console.log(
                  "retoken[" +
                    decoded.email +
                    "] : 토큰 발급 중 문제가 발생하였습니다. 관리자에게 문의하세요."
                );
                res.send({
                  success: false,
                  resultCode: "03",
                  message:
                    "토큰 발급 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
                });
              });
          } else {
            res.send({
              success: false,
              resultCode: "03",
              message:
                "토큰 발급 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
            });
          }
        }
      })
      .catch((err) => {
        console.log("retoken 검색 에러.");
        console.log(err);
        res.send({
          success: false,
          resultCode: "03",
          message:
            "토큰 재발급 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });

    // 리프레쉬 토큰이 유효 한지 확인한다.
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  retoken: retoken,
};
