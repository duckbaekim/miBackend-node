var models = require("../../models");
const jwt = require("jsonwebtoken");
var moment = require("moment");
//const YOUR_SECRET_KEY = process.env.SECRET_KEY;
//require('dotenv').config({path: '../../.env'});
const verifyToken = async (req, res, next) => {
  try {
    const secret = req.app.get("jwt-secret");
    var clientToken = "";

    if (req.headers.authorization) {
      clientToken = req.headers.authorization.replace("Bearer ", "");
      clientToken = clientToken.replace("bearer ", "");
    } else {
      return res.status(401).json({
        success: false,
        resultCode: "01",
        message: "토큰 값이 없습니다.",
      });
    }

    //const clientToken = req.headers.authorization;
    const decoded = jwt.verify(clientToken, secret, {
      ignoreExpiration: false, //handled by OAuth2 server implementation
    });
    if (decoded) {
      //const tokenUserData = await models.MMC_Account.findOne({
      //	where: { 'email': decoded.email }
      //});

      /*
     ---  fcmKey 업데이트 로직  ---
     1. select 에서 해당 계정 fcmKey 확인
     2. request header 와 db fcmKey 비교 
     3. 같으면 패스 같지 않으면 업데이트 
    */
      //
      // ---- fcmKey update Start ----
      //
      // 1. fcmkey 데이터베이스 체크
      const accountResult = await models.MM_Account.findAll({
        attributes: ["id", "email", "fcmKey"],
        where: {
          email: decoded.email,
        },
        raw: true,
      });
      // 1. email 일치하는 계정 찾기
      if (accountResult.length > 0) {
        // 2. request header 와 db fcmKey 비교
        //3. 같으면 패스 같지 않으면 업데이트
        if (accountResult[0].fcmKey !== req.headers.fcmkey) {
          console.log("---token check FcmKey update ---");

          const updateResult = await models.MM_Account.update(
            {
              fcmKey: req.headers.fcmkey,
            },
            {
              where: { email: decoded.email },
            },
            { raw: true }
          );
        } else {
          console.log("---token check FcmKey pass ---");
        }
      }

      //
      // ---- fcmKey update End ----
      //

      var query = " SELECT ";
      query += "	a.* ";
      query += " FROM MM_Account a ";
      //query += "	LEFT JOIN MMC_AccountCompany b ON a.id = b.accountId ";
      query += " where a.email = '" + decoded.email + "'";

      await models.sequelize
        .query(query, {})
        .then((dataList) => {
          if (dataList.length == 0) {
            console.log(
              "verifyToken[" + accountId + "] : 검색 된 업체 정보가 없습니다."
            );
            //res.send({ success: false, resultCode: '02', message: '검색 된 업체 정보가 없습니다.' });
          } else {
            res.app.set("tokenId", dataList[0][0].id);
            res.app.set("tokenEmail", decoded.email);
            res.app.set("tokenContact", dataList[0][0].contact);
            res.app.set("tokenName", dataList[0][0].name);
            //res.app.set('tokenCompanyId', dataList[0][0].companyId);
          }
        })
        .catch((err) => {
          console.log("verifyToken[" + accountId + "] : error");
          console.log(err);
          //res.send({ success: false, resultCode: '03', message: '업체 검색중 문제가 발생하였습니다. 관리자에게 문의하세요.' });
        });

      next();
    } else {
      res.status(401).json({
        success: false,
        resultCode: "03",
        message: "키값이 만료 되었습니다.",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(401).json({
      success: false,
      resultCode: "02",
      message: "에러.",
      error: err,
    });
  }
};
exports.verifyToken = verifyToken;
