var models = require("../models");
var common = require("./Common");
var sha256 = require("sha256");
const jwt = require("jsonwebtoken");
var moment = require("moment");
var request = require("request");
var validator = require("validator");
const s3 = require("../routes/s3");
const sequelize = require("sequelize");
const companyController = require("./CompanyController");
const Op = sequelize.Op;

//검색 목록 가져오기
const search = async (req, res) => {
  console.log("-----  검색 목록 가져오기 ----");
  const { word } = req.query;

  if (!word) {
    res.send({
      success: false,
      resultCode: "03",
      message: "검색어  없음.",
    });
    return false;
  }

  try {
    let companyList = await models.MMC_AccountCompany.findAll({
      where: sequelize.literal(
        "MATCH(name,new_address,subwayDistance)  AGAINST (:word IN BOOLEAN MODE)"
      ),
      replacements: {
        word: word,
      },
      raw: true,
    });
    // 0개면 걍 끝냄
    if (companyList.length === 0) {
      res.send({
        success: false,
        resultCode: "01",
        message: "검색 목록 없음",
        list: companyList,
      });
      return false;
    }

    //
    for (i in companyList) {
      companyList[i].imgData = await models.MMC_AccountCompanyImg.findAll({
        attributes: ["id", "imgUrl"],
        where: {
          companyId: companyList[i].id,
          type: "com",
        },
        order: [["seq", "asc"]],
      });

      companyList[i].count = {
        review: await companyController._companyReviewAvg(
          res,
          companyList[i].id
        ),
        wish: await companyController._companyWishCount(res, companyList[i].id),
      };
      companyList[i].minGoods = await companyController._companyMinGoods(
        res,
        companyList[i].id
      );
    }

    res.send({
      success: true,
      resultCode: "00",
      message: "검색 목록 결과",
      list: companyList,
    });
    //
  } catch (err) {
    console.log("-----  검색 목록 가져오기 : error ----- ");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};

module.exports = {
  search,
};
