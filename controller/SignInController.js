const models = require("../models");
const common = require("./Common");
const sha256 = require("sha256");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const request = require("request");
const validator = require("validator");
const s3 = require("../routes/s3");
const sequelize = require("sequelize");
const { PinpointEmail } = require("aws-sdk");
const Op = sequelize.Op;

class Signin {
  //
  // public  = function()
  // private = #function()
  // protected = get function()
  //           = set function()
  constructor() {
    this._secret = "";
  }
  //로그인
  signIn = async (req, res) => {
    this._secret = req.app.get("jwt-secret");
    console.log("sign in start");
    try {
      //
      const validate = await this.#reqValidate(req, res);
      console.log("sign in after validate");
      //
      if (!validate) {
        throw {
          success: false,
          resultCode: "01",
          message: "로그인에 문제가 발생했습니다. 관리자에게 문의하세요.",
        };
      }

      // const checkEmail = await this.#checkId(req, res);

      // if (!checkEmail) {
      //   return false;
      // }
      console.log("sign in after type login");
      const accountType = req.body.accountType;

      let rtnId;
      let rtnEmail;
      let rtnName;
      let rtnAdminYN;
      let rtnAccessToken;
      let rtnRefreshToken;
      let rtnAccountType;

      const { id, email, name, admin_yn, access_token, refresh_token } =
        accountType === "EMAIL"
          ? await this.#emailLogin(req, res)
          : accountType === "APPLE"
          ? await this.#appleLogin(req, res)
          : await this.#socialLogin(req, res);
      rtnId = id;
      rtnEmail = email;
      rtnName = name;
      rtnAdminYN = admin_yn;
      rtnAccessToken = access_token;
      rtnRefreshToken = refresh_token;
      rtnAccountType = accountType;
      console.log("sign in before res.json");
      res.send({
        success: true,
        message: "로그인 성공.",
        id: rtnId,
        name: rtnName,
        email: rtnEmail,
        // contact: common.deCrypto(dataList[0].contact, req),
        admin_yn: rtnAdminYN,
        accountType: rtnAccountType,
        access_token: rtnAccessToken,
        refresh_token: rtnRefreshToken,
      });
    } catch (err) {
      console.log("SignIn Class mainsignIn Error");
      console.warn(err);
      if (err.resultCode) {
        res.send(err);
      }
    }
  };

  //Request Validation
  #reqValidate = (req, res) => {
    try {
      const accountType = req.body.accountType;
      const email = req.body.email;

      if (!accountType || accountType == "") {
        console.log("signIn : accountType 값이 없습니다.");
        throw {
          success: false,
          resultCode: "01",
          message: "accountType 값이 없습니다.",
        };
      }
      // console.log("fcmKey", fcmKey);

      if (accountType === "EMAIL") {
        const email = req.body.email;
        if (!email || email == "") {
          console.log("signIn : email 값이 없습니다.");
          throw {
            success: false,
            resultCode: "01",
            message: "email 값이 없습니다.",
          };
        }
        const password = req.body.password;
        if (!password || password == "") {
          console.log("signIn : password 값이 없습니다.");
          throw {
            success: false,
            resultCode: "01",
            message: "password 값이 없습니다.",
          };
        }
      } else {
        const socialUID = req.body.socialUID;
        if (!socialUID || socialUID == "") {
          console.log("signIn : socialUID 값이 없습니다.");
          throw {
            success: false,
            resultCode: "01",
            message: "socialUID 값이 없습니다.",
          };
        }
      }

      return true;
    } catch (err) {
      console.log("SignIn Class #reqValidate Error");
      console.warn(err);
    }
  };

  //이메일 로그인
  #emailLogin = async (req, res) => {
    try {
      const passwordHash = await common.enCrypto(req.body.password, req);

      const loginCheck = await models.MM_Account.findAll({
        attributes: ["id", "name", "contact", "black_yn", "email"],
        where: {
          email: req.body.email,
          password: passwordHash,
        },
      });
      if (loginCheck.length === 0) {
        throw {
          success: false,
          resultCode: "02",
          message: "아이디 또는 비밀번호를 확인해 주세요.",
        };
      }

      const now = new Date().toLocaleString();
      const nowTimeStamp = Date.parse(now) / 1000;
      const access_token = this.#accessToken(
        res,
        loginCheck[0].email,
        nowTimeStamp
      );
      const refresh_token = this.#refreshToken(
        res,
        loginCheck[0].email,
        nowTimeStamp
      );

      if (access_token && refresh_token) {
        this.#updateToken(loginCheck[0].email, access_token, refresh_token);
      }

      this.#fcmKeyUpdate(req, res, loginCheck[0].email);

      return {
        id: loginCheck[0].id,
        name: loginCheck[0].name,
        admin_yn: loginCheck[0].admin_yn,
        email: loginCheck[0].email,
        access_token,
        refresh_token,
      };
    } catch (err) {
      console.log("#emailLogin Error");
      console.warn(err);
      res.json(err);
    }
  };

  //소셜 로그인
  #socialLogin = async (req, res) => {
    try {
      const accountTypeCheck = await models.MM_Account.findAll({
        attributes: [
          "id",
          "name",
          "contact",
          "black_yn",
          "email",
          "accountType",
        ],
        where: {
          email: req.body.email,
        },
      });

      if (accountTypeCheck.length === 0) {
        throw {
          success: false,
          resultCode: "-01",
          message: "회원정보가 없습니다 가입으로 이동합니다",
        };
      }

      if (accountTypeCheck[0].accountType !== req.body.accountType) {
        throw {
          success: false,
          resultCode: "-02",
          message: `${this.#returnLoginText(
            accountTypeCheck[0].accountType
          )} 로그인으로 가입된 계정입니다.`,
        };
      }

      const loginCheck = await models.MM_Account.findAll({
        attributes: ["id", "name", "contact", "black_yn", "email"],
        where: {
          email: req.body.email,
          accountType: req.body.accountType,
          socialUID: req.body.socialUID,
        },
      });

      if (loginCheck.length === 0) {
        throw {
          success: false,
          resultCode: "-03",
          message: "소셜로그인 정보가 정확하지 않습니다.",
        };
      }

      const now = new Date().toLocaleString();
      const nowTimeStamp = Date.parse(now) / 1000;
      const access_token = this.#accessToken(
        res,
        loginCheck[0].email,
        nowTimeStamp
      );
      const refresh_token = this.#refreshToken(
        res,
        loginCheck[0].email,
        nowTimeStamp
      );

      if (access_token && refresh_token) {
        this.#updateToken(loginCheck[0].email, access_token, refresh_token);
      }

      this.#fcmKeyUpdate(req, res, loginCheck[0].email);

      return {
        id: loginCheck[0].id,
        name: loginCheck[0].name,
        admin_yn: loginCheck[0].admin_yn,
        email: loginCheck[0].email,
        access_token,
        refresh_token,
      };
    } catch (err) {
      console.log(" #socialLogin Error");
      console.warn(err);
      res.json(err);
    }
  };

  //소셜 로그인
  #appleLogin = async (req, res) => {
    try {
      const accountTypeCheck = await models.MM_Account.findAll({
        attributes: [
          "id",
          "name",
          "contact",
          "black_yn",
          "email",
          "accountType",
        ],
        where: {
          socialUID: req.body.socialUID,
        },
      });

      if (accountTypeCheck.length === 0) {
        throw {
          success: false,
          resultCode: "-01",
          message: "회원정보가 없습니다 가입으로 이동합니다",
        };
      }

      if (accountTypeCheck[0].accountType !== req.body.accountType) {
        throw {
          success: false,
          resultCode: "-02",
          message: `${this.#returnLoginText(
            accountTypeCheck[0].accountType
          )} 로그인으로 가입된 계정입니다.`,
        };
      }

      const loginCheck = await models.MM_Account.findAll({
        attributes: ["id", "name", "contact", "black_yn", "email"],
        where: {
          accountType: req.body.accountType,
          socialUID: req.body.socialUID,
        },
      });

      if (loginCheck.length === 0) {
        throw {
          success: false,
          resultCode: "-03",
          message: "소셜로그인 정보가 정확하지 않습니다.",
        };
      }

      const now = new Date().toLocaleString();
      const nowTimeStamp = Date.parse(now) / 1000;
      const access_token = this.#accessToken(
        res,
        loginCheck[0].email,
        nowTimeStamp
      );
      const refresh_token = this.#refreshToken(
        res,
        loginCheck[0].email,
        nowTimeStamp
      );

      if (access_token && refresh_token) {
        this.#updateToken(loginCheck[0].email, access_token, refresh_token);
      }

      this.#fcmKeyUpdate(req, res, loginCheck[0].email);

      return {
        id: loginCheck[0].id,
        name: loginCheck[0].name,
        admin_yn: loginCheck[0].admin_yn,
        email: loginCheck[0].email,
        access_token,
        refresh_token,
      };
    } catch (err) {
      console.log(" #socialLogin Error");
      console.warn(err);
      res.json(err);
    }
  };

  #accessToken = (res, email, nowTimeStamp) => {
    try {
      const user = {
        email: email,
        iss: "http://www.mimo20.com",
        iat: nowTimeStamp,
        nbf: nowTimeStamp,
        exp:
          Date.parse(new Date(moment().add("90", "days")).toLocaleString()) /
          1000,
      };

      if (this._secret !== "" && this._secret !== null) {
        return jwt.sign(user, this._secret);
      } else {
        throw {
          success: false,
          resultCode: "-02",
          message: "로그인에 실패했습니다. 관리자에게 문의해주세요.",
        };
      }
    } catch (err) {
      console.log("#accessToken");
      console.log(err);
      res.json(err);
    }
  };

  #refreshToken = (res, email, nowTimeStamp) => {
    try {
      const user = {
        email: email,
        iss: "http://www.mimo20.com",
        iat: nowTimeStamp,
        nbf: nowTimeStamp,
        exp:
          Date.parse(new Date(moment().add("180", "days")).toLocaleString()) /
          1000,
      };
      if (this._secret !== "" && this._secret !== null) {
        return jwt.sign(user, this._secret);
      } else {
        throw {
          success: false,
          resultCode: "-02",
          message: "로그인에 실패했습니다. 관리자에게 문의해주세요.",
        };
      }
    } catch (err) {
      console.log("refreshToken Error");
      console.warn(err);
      res.json(err);
    }
  };

  #updateToken = async (email, access_token, refresh_token) => {
    try {
      await models.MM_Account_Token.destroy({
        where: { email: email },
      });
      console.log("update token", email, access_token, refresh_token);
      await models.MM_Account_Token.create({
        email: email,
        access_token: access_token,
        refresh_token: refresh_token,
      });
    } catch (err) {
      console.log("updateToken Error");
      console.warn(err);
      res.json(err);
    }
  };

  #fcmKeyUpdate = async (req, res, email) => {
    const fcmKey = req.headers.fcmkey; //fcm key 디바이스에서 전달 받아야함.

    try {
      await models.MM_Account.update(
        {
          fcmKey: fcmKey === "null" || !fcmKey ? null : fcmKey,
        },
        {
          where: { email: email },
          omitNull: false,
        }
      );
    } catch (err) {
      console.log("fcmKeyUpdate Error");
      console.warn(err);
      res.json(err);
    }
  };

  #returnLoginText = (loginType) => {
    switch (loginType) {
      case "EMAIL":
        return "이메일";

      case "KAKAO":
        return "카카오";

      case "NAVER":
        return "네이버";

      case "GOOGLE":
        return "구글";

      case "APPLE":
        return "애플";

      default:
        return "이메일";
    }
  };
}

module.exports = new Signin();
