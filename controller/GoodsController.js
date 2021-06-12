var models = require("../models");
var common = require("./Common");
var sha256 = require("sha256");
const jwt = require("jsonwebtoken");
var moment = require("moment");
var request = require("request");
const nodemailer = require("nodemailer");
var validator = require("validator");
const sequelize = require("sequelize");
const Op = sequelize.Op;
const s5 = require("../routes/s5");

// 상품리스트
const goodsList = async (req, res) => {
  try {
    console.log("------------ 상품리스트 ------------");
    let companyId = req.param("companyId");
    let sendResult = new Object();
    let priceGoods = new Array();
    let priceGoodsCnt = 0;

    if (!companyId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "companyId 없음.",
      });
      return false;
    }

    let query = " SELECT ";
    query += " a.goodsCategoryId, ";
    query += " b.goodsCategoryName as title";
    query += " FROM ";
    query += " MMC_Goods a ";
    query += " LEFT JOIN MMA_GoodsCategory b ON a.goodsCategoryId = b.id ";
    query += " WHERE ";
    query += " a.companyId = '" + companyId + "' AND a.deletedAt IS NULL";
    query += " GROUP BY ";
    query += " a.goodsCategoryId ";
    query += " order by b.seq asc ";

    await models.sequelize
      .query(query, {})
      .then((dataList) => {
        if (dataList[0].length == 0) {
          console.log(
            "goodsList[" + companyId + "] : 검색 된 정보가 없습니다."
          );
          res.send({
            success: false,
            resultCode: "02",
            message: "검색 된 정보가 없습니다.",
          });
          return false;
        } else {
          console.log("goodsList[" + companyId + "] : 검색된 정보가 있습니다.");
          sendResult.goodsList = dataList[0];
        }
      })
      .catch((err) => {
        console.log("goodsList[" + companyId + "] : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });

    for (var i = 0; i < sendResult.goodsList.length; i++) {
      let query = " SELECT ";
      query += " a.id, ";
      query += " a.companyId, ";
      query += " a.goodsCategoryId, ";
      query += " a.name, ";
      query += " a.price, ";
      query += " a.sale, ";
      query += " a.useTime, ";
      query += " a.createdAt, ";
      query += " b.goodsCategoryName, ";
      query +=
        " (SELECT c.imgUrl FROM MMC_GoodsImg c WHERE a.id = c.goodsId AND c.deletedAt IS NULL ORDER BY id ASC LIMIT 1) AS imgUrl ";
      query += " FROM ";
      query += " MMC_Goods a ";
      query += " LEFT JOIN MMA_GoodsCategory b ON a.goodsCategoryId = b.id ";
      query += " WHERE ";
      query += " a.companyId = '" + companyId + "' ";
      query +=
        " and a.goodsCategoryId = '" +
        sendResult.goodsList[i].goodsCategoryId +
        "'";
      query += " and a.deletedAt is null";
      query += " order by a.id desc ";

      await models.sequelize
        .query(query, {})
        .then((dataList) => {
          if (dataList[0].length == 0) {
            console.log(
              "goodsList[" + companyId + "] : 검색 된 정보가 없습니다."
            );
            //res.send({ success: false, resultCode: '02', message: '검색 된 정보가 없습니다.' });
            //priceGoods[i] = new Array();
          } else {
            // priceGoods[priceGoodsCnt] = dataList[0];
            // priceGoodsCnt++;
            sendResult.goodsList[i].data = dataList[0];
          }
        })
        .catch((err) => {
          console.log("goodsList[" + companyId + "] : error");
          console.log(err);
          res.send({
            success: false,
            resultCode: "01",
            message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
          });
        });
    }

    // sendResult.goodsData = priceGoods;

    res.send({ success: true, resultCode: "00", data: sendResult });
  } catch (err) {
    console.log(err);
  }
};

// 상품상세
const goodsDetail = async (req, res) => {
  //var test = await aaa();
  //console.log(test[0]);
  //var now = moment().format('YYYY-MM-DD HH:ii:ss');
  //console.log(now);
  try {
    console.log("------------ 상품상세 ------------");
    let goodsId = req.param("goodsId");
    //var goodsId = req.body.goodsId;
    let goodsDetail = new Object();

    if (!goodsId || goodsId == "") {
      console.log("goodsDetail1 : goodsId가 없습니다.");
      res.send({
        success: false,
        resultCode: "03",
        message: "goodsId가 없습니다.",
      });
      return false;
    }

    let query = " SELECT ";
    query += " a.*, ";
    query +=
      " (SELECT NAME FROM MMC_AccountCompany b WHERE a.companyId = b.id) AS companyName, ";
    query +=
      " (SELECT b.notification FROM MMC_AccountCompany b WHERE a.companyId = b.id) AS notiInfor, ";
    query +=
      " (SELECT b.tradeInformation FROM MMC_AccountCompany b WHERE a.companyId = b.id) AS tradeInfor, ";
    query +=
      " (SELECT COUNT(*) FROM MMC_Workers b WHERE a.companyId = b.companyId AND deletedAt IS NULL) AS designerCount ";
    query += " FROM ";
    query += " MMC_Goods a ";
    query += " WHERE ";
    query += " a.id = '" + goodsId + "' and a.deletedAt is null";
    query += " order by a.id desc ";

    await models.sequelize
      .query(query, {})
      .then((dataList) => {
        if (dataList[0].length == 0) {
          console.log("goodsDetail1 : 검색된 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "01",
            message: "검색된 정보가 없습니다.",
          });
          return false;
        } else {
          console.log("goodsDetail : 검색완료1.");
          goodsDetail.list = dataList[0][0];
          // console.log("goodsDetail.list.option", goodsDetail.list.option);
          goodsDetail.list.option = JSON.parse(goodsDetail.list.option);
        }
      })
      .catch((err) => {
        console.log("goodsDetail : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "02",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
        return false;
      });

    //상품 이미지 검색
    await models.MMC_GoodsImg.findAll({
      attributes: ["id", "imgUrl"],
      where: {
        goodsId: goodsId,
      },
      order: [["id", "desc"]],
    })
      .then((dataList) => {
        // console.log(dataList);
        if (dataList.length == 0) {
          console.log("goodsDetail2 : 검색된 정보가 없습니다.");
          //res.send({ success: false, resultCode: '01', message: '검색된 정보가 없습니다.' });
          //return false;
          goodsDetail.ImgArr = new Array();
        } else {
          console.log("goodsDetail : 검색완료2.");
          goodsDetail.ImgArr = dataList;
        }
      })
      .catch((err) => {
        console.log("goodsDetail : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "02",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
        return false;
      });

    //추가 옵션
    if (goodsDetail.list.addPriceOption) {
      //console.log(goodsDetail.list.addPriceOption);
      //console.log(JSON.parse(goodsDetail.list.addPriceOption));
      //var jsonOption = JSON.parse(goodsDetail.list.addPriceOption);
      let jsonOption = goodsDetail.list.addPriceOption;
      let optionArr = new Array();
      for (let i = 0; i < jsonOption.length; i++) {
        console.log("상품 추가옵션 검색", jsonOption[i]);
        //상품 추가옵션 검색
        await models.MMC_GoodsAddOption.findAll({
          attributes: ["id", "name", "context", "price"],
          where: {
            id: jsonOption[i],
          },
        })
          .then((dataList) => {
            if (dataList.length == 0) {
              console.log("goodsDetail3 : 검색된 정보가 없습니다.");
              // res.send({
              //   success: false,
              //   resultCode: "01",
              //   message: "검색된 정보가 없습니다.",
              // });
              // return false;
            } else {
              console.log("goodsDetail : 검색완료3.");
              optionArr[i] = dataList[0];
            }
          })
          .catch((err) => {
            console.log("goodsDetail : error");
            console.log(err);
            res.send({
              success: false,
              resultCode: "02",
              message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
            });
            return false;
          });
      }

      goodsDetail.option = optionArr;
    } else {
      goodsDetail.option = new Array();
    }
    const wishCount = await models.MMC_Wish.findAll({
      attributes: [
        ["targetId", "goodsId"],
        [models.sequelize.fn("COUNT", models.sequelize.col("*")), "count"],
      ],
      group: "targetId",
      where: {
        type: 3,
        targetId: goodsId,
      },
    });

    if (wishCount.length > 0) {
      goodsDetail.list.wish = wishCount[0];
    } else {
      goodsDetail.list.wish = {
        goodsId: goodsId,
        count: 0,
      };
    }

    res.send({ success: true, resultCode: "00", data: goodsDetail });
  } catch (err) {
    console.log(err);
  }
};

// 상품 리뷰

const goodsReviews = async (req, res) => {
  console.log("--- 상품 리뷰 리스트 ---");
  // 파라미터 goodsId check
  const { goodsId } = req.query;

  if (!goodsId) {
    res.send({
      success: false,
      resultCode: "03",
      message: "goodsId가 없습니다.",
    });
    return false;
  }
  //
  try {
    const queryResult = await models.MMC_Review.findAll({
      attributes: [
        "goodsCategoryId",
        [
          sequelize.literal(
            "(SELECT name FROM MMC_Goods b WHERE MMC_Review.goodsId = b.id)"
          ),
          "goodsName",
        ],
        [
          sequelize.literal(
            "(SELECT NAME FROM MMC_Workers b WHERE MMC_Review.designerId = b.id)"
          ),
          "designerName",
        ],
        [
          sequelize.literal(
            "(SELECT NAME FROM MM_Account b WHERE MMC_Review.accountId = b.id)"
          ),
          "accountName",
        ],
        "context",
        "imgUrl",
        "point",
        "createdAt",
      ],
      where: {
        goodsId: goodsId,
      },
      order: [["id", "desc"]],
    });

    //

    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료.",
      list: queryResult,
    });
  } catch (err) {
    console.log("goodsReviews : error");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
module.exports = {
  goodsList: goodsList,
  goodsDetail: goodsDetail,
  goodsReviews,
  //goodsReview: goodsReview
};
