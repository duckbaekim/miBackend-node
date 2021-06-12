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

//메인화면
let mainList = async (req, res) => {
  try {
    console.log("------------ 메인화면 ------------");

    var categoryId = req.param("categoryId");

    var returnData = new Object();
    //returnData['data'] = new Array();
    var premiumCompanyList;
    var companyList;

    const todayEventLimit = 3;
    //카테고리
    returnData.category = await mainCategory(res);
    //console.log(returnData.category);

    if (!categoryId) {
      //초기 메인 화면
      //topBanner
      returnData.topBanner = await topBanner(res);
      //today event
      returnData.today = await _companyTodayList(res, todayEventLimit);
      returnData.event = await _companyEvnetList(res, todayEventLimit);

      //tv
      returnData.tv = await mimoTV(res);

      //story
      returnData.story = await mimoStory(res, returnData.category);

      //전송
      res.send({ success: true, resultCode: "00", data: returnData });
    } else {
      //카테고리 선택 화면
      //리뷰
      //returnData.review = await mimoReview(res, categoryId);
      //미모픽(프리미엄을 먼저 보여준다.)
      //returnData.companyPremiumList = await companyPremiumListFun(res, categoryId, "y", 0);
      //프리미엄 아닌 일반
      //returnData.companyList = await companyPremiumListFun(res, categoryId, "n", offset);
      //전송
      //res.send({ success: true, resultCode: '00', data: returnData });
    }
  } catch (err) {
    console.log(err);
  }
};

//메인화면
let mainQueenList = async (req, res) => {
  console.log("------------ 메인화면 companyList ------------");

  try {
    let categoryId = req.param("categoryId");

    //var offsetId = req.param('offsetId');
    let returnData = new Object();

    returnData.review = await mimoReview(res, categoryId);

    res.send({
      categoryId: categoryId,
      success: true,
      resultCode: "00",
      data: returnData.review,
    });
  } catch (err) {
    console.log(err);
  }
};

//메인화면
let mainPremiumList = async (req, res) => {
  console.log("------------ 메인화면 mainPremiumList ------------");

  try {
    let categoryId = req.param("categoryId");
    //var offsetId = req.param('offsetId');

    let returnData = new Object();
    let limit = 6;

    //프리미엄 아닌 일반
    returnData.companyList = await companyPremiumListFun(
      res,
      categoryId,
      "y",
      null,
      limit
    );

    res.send({ success: true, resultCode: "00", data: returnData.companyList });
  } catch (err) {
    console.log(err);
  }
};

//메인화면
let mainCompanyList = async (req, res) => {
  console.log("------------ 메인화면 mainCompanyList ------------");

  try {
    var categoryId = req.param("categoryId");
    var offsetId = req.param("offsetId");

    var returnData = new Object();

    var limit = 10;

    //프리미엄 아닌 일반
    returnData.companyList2 = await companyPremiumListFun(
      res,
      categoryId,
      "n",
      offsetId,
      limit
    );

    res.send({
      success: true,
      resultCode: "00",
      data: returnData.companyList2,
      offsetId: offsetId,
      limit: limit,
    });
  } catch (err) {
    console.log(err);
  }
};

//메인 카테고리
let mainCategory = async (res) => {
  console.log("------------ 메인화면 mainCategory ------------");
  try {
    var returnData;
    //카테고리
    await models.MMC_Category.findAll({})
      .then((dataList) => {
        returnData = dataList;
      })
      .catch((err) => {
        console.log("mainCategory : 메인화면 오류. 관리자에게 문의하세요.");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "메인화면 오류. 관리자에게 문의하세요.",
        });
      });

    return returnData;
  } catch (err) {
    console.log(err);
  }
};
//topBanner
let topBanner = async (res) => {
  console.log("------------ 메인화면 topBanner ------------");
  try {
    const resData = await models.MMA_TopBanner.findAll({
      attributes: ["id", "bannerImgUrl", "mainImgUrl"],
      where: {
        startAt: {
          [Op.lte]: new Date(),
        },
        endAt: {
          [Op.gte]: new Date(),
        },
      },
    });
    return resData;
  } catch (err) {
    console.log(err);
    console.log("메인화면 topBanner : error");
    res.send({
      success: false,
      resultCode: "01",
      message: "메인화면 오류. 관리자에게 문의하세요.",
    });
  }
};
//
const bannerDetail = async (req, res) => {
  console.log("------------ 메인화면 topBanner 상세------------");
  const bannerId = req.param("bannerId");

  if (!bannerId) {
    res.send({
      success: false,
      resultCode: "02",
      message: "bannerId가 없습니다",
    });
  }

  try {
    const resData = await models.MMA_TopBanner.findAll({
      attributes: ["id", "bannerImgUrl", "mainImgUrl", "title"],
      where: {
        startAt: {
          [Op.lte]: new Date(),
        },
        endAt: {
          [Op.gte]: new Date(),
        },
      },
      include: [
        {
          model: models.MMA_TopBannerImg,
          as: "topBannerDetailImg",
          attributes: ["id", "imgUrl"],
          where: {
            type: "main",
          },
        },
      ],
    });
    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료",
      banner: resData[0],
    });
  } catch (err) {
    console.log(" topBanner Detail: error");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "배너 상세 화면 오류. 관리자에게 문의하세요.",
    });
  }
};

//메인화면 _companyTodayList
let _companyTodayList = async (res, limit) => {
  console.log("------------ 메인화면 _companyTodayList ------------");
  try {
    var returnData;
    let premiumCompanyList = null;
    let companyPremiumList = null;
    //var limit = 10;
    var limitStart;

    var query = " SELECT ";
    query += " a.* ";
    query += " from ";
    query += " MMC_AccountCompany a ";
    //query += " LEFT JOIN MMC_AccountCompanyImg b ON a.id = b.companyId ";
    query += " where ";
    //query += " AND b.`type` = 'com' ";
    query += " a.today_YN = 'y' ";
    query += " AND a.deletedAt is null ";
    // query += " AND a.enabled = 'y' ";
    query += " ORDER BY a.id desc ";
    query += " limit " + limit;

    await models.sequelize
      .query(query, {})
      .then((dataList) => {
        if (dataList[0].length == 0) {
          console.log("_companyTodayList : 검색 된 정보가 없습니다.");
          //res.send({ success: false, resultCode: '01', message: '메인화면 오류. 관리자에게 문의하세요.' });
          premiumCompanyList = new Array();
          companyPremiumList = null;
        } else {
          premiumCompanyList = dataList[0];
        }
      })
      .catch((err) => {
        console.log("_companyTodayList : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "메인화면 오류. 관리자에게 문의하세요.",
        });
      });

    //프리미엄 데이터 파싱
    companyPremiumList = new Array();
    //console.log("------------------------");
    //console.log(premiumCompanyList);
    for (var i = 0; i < premiumCompanyList.length; i++) {
      let imgData = new Array();
      let company = new Object();

      company.id = premiumCompanyList[i].id;
      company.accountId = premiumCompanyList[i].accountId;
      company.category = premiumCompanyList[i].category;
      company.ceo_name = premiumCompanyList[i].ceo_name;
      company.name = premiumCompanyList[i].name;
      company.phone = premiumCompanyList[i].phone;
      company.old_address = premiumCompanyList[i].old_address;
      company.new_address = premiumCompanyList[i].new_address;
      company.remains_address = premiumCompanyList[i].remains_address;
      company.latitude = premiumCompanyList[i].latitude;
      company.longitude = premiumCompanyList[i].longitude;
      company.weekday_hour_start = premiumCompanyList[i].weekday_hour_start;
      company.weekday_hour_end = premiumCompanyList[i].weekday_hour_end;
      company.weekend_hour_start = premiumCompanyList[i].weekend_hour_start;
      company.weekend_hour_end = premiumCompanyList[i].weekend_hour_end;
      company.holiday = premiumCompanyList[i].holiday;
      company.context = premiumCompanyList[i].context;
      company.createdAt = premiumCompanyList[i].createdAt;
      company.businessTrip = premiumCompanyList[i].businessTrip;
      company.subwayDistance = premiumCompanyList[i].subwayDistance;

      //console.log(company.id);
      await models.MMC_AccountCompanyImg.findAll({
        attributes: ["id", "imgUrl"],
        where: {
          companyId: company.id,
          type: "com",
        },
        order: [["id", "desc"]],
      })
        .then(async (ImgDataList) => {
          company.imgData = ImgDataList;
          company.count = {
            review: await companyController._companyReviewAvg(res, company.id),
            wish: await companyController._companyWishCount(res, company.id),
          };
          company.minGoods = await companyController._companyMinGoods(
            res,
            company.id
          );

          companyPremiumList.push(company);
        })
        .catch((err) => {
          console.log("_companyTodayList img : error");
          console.log(err);
          res.send({
            success: false,
            resultCode: "02",
            message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
          });
          return false;
        });
    }

    returnData = companyPremiumList;

    return returnData;
  } catch (err) {
    console.log(err);
  }
};

let _companyEvnetList = async (res, limit) => {
  console.log("------------ 메인화면 companyPremiumList ------------");
  try {
    var returnData;
    let premiumCompanyList = null;
    let companyPremiumList = null;
    //var limit = 10;
    var limitStart;

    var query = " SELECT ";
    query += " a.* ";
    query += " from ";
    query += " MMC_AccountCompany a ";
    //query += " LEFT JOIN MMC_AccountCompanyImg b ON a.id = b.companyId ";
    query += " where ";
    //query += " AND b.`type` = 'com' ";
    query += " a.event_YN = 'y' ";
    query += " AND a.deletedAt is null ";
    // query += " AND a.enabled is 'y' ";
    query += " ORDER BY a.id desc ";
    query += " limit " + limit;

    await models.sequelize
      .query(query, {})
      .then((dataList) => {
        if (dataList[0].length == 0) {
          console.log("_companyEvnetList : 검색 된 정보가 없습니다.");
          //res.send({ success: false, resultCode: '01', message: '메인화면 오류. 관리자에게 문의하세요.' });
          premiumCompanyList = new Array();
          companyPremiumList = null;
        } else {
          premiumCompanyList = dataList[0];
        }
      })
      .catch((err) => {
        console.log("_companyEvnetList : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "메인화면 오류. 관리자에게 문의하세요.",
        });
      });

    //프리미엄 데이터 파싱
    companyPremiumList = new Array();
    //console.log("------------------------");
    //console.log(premiumCompanyList);
    for (var i = 0; i < premiumCompanyList.length; i++) {
      let imgData = new Array();
      let company = new Object();

      company.id = premiumCompanyList[i].id;
      company.accountId = premiumCompanyList[i].accountId;
      company.category = premiumCompanyList[i].category;
      company.ceo_name = premiumCompanyList[i].ceo_name;
      company.name = premiumCompanyList[i].name;
      company.phone = premiumCompanyList[i].phone;
      company.old_address = premiumCompanyList[i].old_address;
      company.new_address = premiumCompanyList[i].new_address;
      company.remains_address = premiumCompanyList[i].remains_address;
      company.latitude = premiumCompanyList[i].latitude;
      company.longitude = premiumCompanyList[i].longitude;
      company.weekday_hour_start = premiumCompanyList[i].weekday_hour_start;
      company.weekday_hour_end = premiumCompanyList[i].weekday_hour_end;
      company.weekend_hour_start = premiumCompanyList[i].weekend_hour_start;
      company.weekend_hour_end = premiumCompanyList[i].weekend_hour_end;
      company.holiday = premiumCompanyList[i].holiday;
      company.context = premiumCompanyList[i].context;
      company.createdAt = premiumCompanyList[i].createdAt;
      company.businessTrip = premiumCompanyList[i].businessTrip;
      company.subwayDistance = premiumCompanyList[i].subwayDistance;

      //console.log(company.id);
      await models.MMC_AccountCompanyImg.findAll({
        attributes: ["id", "imgUrl"],
        where: {
          companyId: company.id,
          type: "com",
        },
        order: [["id", "desc"]],
      })
        .then(async (ImgDataList) => {
          company.imgData = ImgDataList;
          company.count = {
            review: await companyController._companyReviewAvg(res, company.id),
            wish: await companyController._companyWishCount(res, company.id),
          };
          company.minGoods = await companyController._companyMinGoods(
            res,
            company.id
          );

          companyPremiumList.push(company);
        })
        .catch((err) => {
          console.log("_companyEvnetList img : error");
          console.log(err);
          res.send({
            success: false,
            resultCode: "02",
            message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
          });
          return false;
        });
    }

    returnData = companyPremiumList;

    return returnData;
  } catch (err) {
    console.log(err);
  }
};

//mimoTV
let mimoTV = async (res) => {
  console.log("------------ 메인화면 mainTV ------------");
  try {
    var returnData;

    var query = " SELECT ";
    query += " a.*, ";
    query +=
      " (SELECT count(*) FROM MM_Count b WHERE a.id = b.goodsId and b.`type` = 'tv') AS cnt ";
    query += " from ";
    query += " MMA_TV a ";
    query += " WHERE deletedAt IS NULL";
    query += " ORDER BY a.createdAt desc ";
    query += " limit 2 ";

    await models.sequelize
      .query(query, {})
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("mainTV : 검색 된 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "01",
            message: "메인화면 오류. 관리자에게 문의하세요.",
          });
        } else {
          returnData = dataList[0];
        }
      })
      .catch((err) => {
        console.log("mainTV : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "메인화면 오류. 관리자에게 문의하세요.",
        });
      });

    return returnData;
  } catch (err) {
    console.log(err);
  }
};

//미모 메인 스토리
let mimoStory = async (res, category) => {
  console.log("------------ 메인화면 mimoStory ------------");
  try {
    var returnData;

    var stroyArr = new Array();
    var query = " SELECT ";
    query += " a.*, ";
    query +=
      " (SELECT count(*) FROM MM_Count b WHERE a.id = b.goodsId and b.`type` = 'story') AS cnt ";
    query += " from ";
    query += " MMA_Story a ";
    // query += " where a.categoryId = '"+category[i].id+"'";
    query += " WHERE deletedAt IS NULL ";
    query += " ORDER BY a.createdAt desc ";
    query += " limit 4 ";

    const dataList = await models.sequelize.query(query, {});

    if (dataList.length == 0) {
      console.log("mimoStory : 검색 된 정보가 없습니다.");
      res.send({
        success: false,
        resultCode: "01",
        message: "메인화면 오류. 관리자에게 문의하세요.",
      });
    } else {
      return dataList[0];
    }

    return returnData;
  } catch (err) {
    console.log(err);
  }
};

//미모 퀸 메인
const mimoReview = async (res, categoryId) => {
  console.log("------------ 메인화면 mimoReview ------------");
  try {
    const resData = await models.MMC_Review.findAll({
      attributes: [
        "id",
        "accountId",
        "companyId",
        "goodsId",
        "categoryId",
        "goodsCategoryId",
        "designerId",
        "context",
        "point",
        [sequelize.col("MMC_AccountCompany.category"), "categoryId"],
        [
          sequelize.literal(
            "(select imgUrl from MMC_ReviewImg where MMC_ReviewImg.reviewId = MMC_Review.id limit 1)"
          ),
          "imgUrl",
        ],
        [
          sequelize.literal(
            "(select name from MMC_Category where MMC_Category.id = MMC_AccountCompany.category)"
          ),
          "categoryName",
        ],
        [
          sequelize.literal(
            "(SELECT count(*) FROM MM_Count WHERE MMC_Review.id = MM_Count.goodsId and MM_Count.`type` = 'story')"
          ),
          "cnt",
        ],
      ],
      where: sequelize.literal(
        `MMC_AccountCompany.category = ${categoryId} AND queenYn = 'y'`
      ),
      include: [
        {
          model: models.MMC_AccountCompany,
          require: false,
          attributes: [],
        },
      ],
      order: [["id", "desc"]],
      raw: true,
    });

    // 이미지 있는것만
    const filterResData = resData.filter((el) => {
      return el.imgUrl !== null;
    });
    return filterResData;
  } catch (err) {
    console.log("------------ 메인화면 mimoReview ------------ : error");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "mimoReview 오류. 관리자에게 문의하세요.",
    });
  }
};
// 미모 퀸 상세
const mimoReviewDetail = async (req, res) => {
  try {
    console.log("------------ 메인화면 mimoReviewDetail ------------");
    const reviewId = req.param("reviewId");
    const resData = await models.MMC_Review.findAll({
      attributes: [
        "id",
        "accountId",
        [
          sequelize.literal(
            "(SELECT name from MM_Account WHERE MM_Account.id = MMC_Review.accountId)"
          ),
          "accountName",
        ],
        "companyId",
        [
          sequelize.literal(
            "(SELECT name from MMC_AccountCompany WHERE MMC_AccountCompany.id = MMC_Review.companyId)"
          ),
          "companyName",
        ],
        "goodsId",
        [
          sequelize.literal(
            "(SELECT name from MMC_Goods WHERE MMC_Goods.id = MMC_Review.goodsId)"
          ),
          "goodsName",
        ],
        "categoryId",
        "goodsCategoryId",
        [
          sequelize.literal(
            "(SELECT goodsCategoryName from MMA_GoodsCategory WHERE MMA_GoodsCategory.id = MMC_Review.goodsCategoryId)"
          ),
          "goodsCategoryName",
        ],
        "designerId",
        [
          sequelize.literal(
            "(SELECT name from MMC_Workers WHERE MMC_Workers.id = MMC_Review.designerId)"
          ),
          "designerName",
        ],
        "context",
        "point",
      ],
      where: {
        id: reviewId,
      },
      include: [
        {
          model: models.MMC_ReviewImg,
          as: "reviewImg",
          require: true,
          attributes: ["id", "imgUrl"],
        },
      ],
    });

    if (resData.length === 0) {
      res.send({
        success: false,
        resultCode: "01",
        message: "검색 결과가 없습니다",
      });
    } else {
      res.send({ success: true, resultCode: "00", data: resData[0] });
    }
  } catch (err) {
    console.log("------------ 메인화면 mimoReviewDetail ------------ : error");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "mimoReview 오류. 관리자에게 문의하세요.",
    });
  }
};

//미모 메인 companyList
let companyPremiumListFun = async (res, categoryId, flag, offsetId, limit) => {
  console.log("------------ 메인화면 companyPremiumList ------------");
  try {
    var returnData;
    let premiumCompanyList = null;
    let companyPremiumList = null;
    //var limit = 10;
    var limitStart;

    var query = " SELECT ";
    query += " a.* ";
    query += " from ";
    query += " MMC_AccountCompany a ";
    //query += " LEFT JOIN MMC_AccountCompanyImg b ON a.id = b.companyId ";
    query += " where ";
    query += " a.category = '" + categoryId + "' ";
    //query += " AND b.`type` = 'com' ";
    query += " AND a.premium_YN = '" + flag + "' ";
    query += " AND a.deletedAt IS NULL ";
    // query += " AND a.enabled = 'y' ";
    if (flag == "n") {
      if (offsetId) {
        query += " and a.id < " + offsetId;
      }
    }
    //query += " ORDER BY a.enabled desc, a.id desc ";
    query += " ORDER BY a.id desc ";
    if (flag == "y") {
      query += " limit " + limit;
    } else {
      //if(offset == 1){
      //	limitStart = 0;
      //}else{
      //	limitStart = limit * (offset - 1);
      //}
      //query += "limit "+limitStart+" , "+limit;
      query += " limit " + limit;
    }

    await models.sequelize
      .query(query, {})
      .then((dataList) => {
        if (dataList[0].length == 0) {
          console.log("companyPremiumList : 검색 된 정보가 없습니다.");
          //res.send({ success: false, resultCode: '01', message: '메인화면 오류. 관리자에게 문의하세요.' });
          premiumCompanyList = new Array();
          companyPremiumList = null;
        } else {
          premiumCompanyList = dataList[0];
        }
      })
      .catch((err) => {
        console.log("companyPremiumList : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "메인화면 오류. 관리자에게 문의하세요.",
        });
      });

    //프리미엄 데이터 파싱
    companyPremiumList = new Array();
    //console.log("------------------------");
    //console.log(premiumCompanyList);
    for (var i = 0; i < premiumCompanyList.length; i++) {
      let imgData = new Array();
      let company = new Object();

      company.id = premiumCompanyList[i].id;
      company.accountId = premiumCompanyList[i].accountId;
      company.category = premiumCompanyList[i].category;
      company.ceo_name = premiumCompanyList[i].ceo_name;
      company.name = premiumCompanyList[i].name;
      company.phone = premiumCompanyList[i].phone;
      company.old_address = premiumCompanyList[i].old_address;
      company.new_address = premiumCompanyList[i].new_address;
      company.remains_address = premiumCompanyList[i].remains_address;
      company.latitude = premiumCompanyList[i].latitude;
      company.longitude = premiumCompanyList[i].longitude;
      company.weekday_hour_start = premiumCompanyList[i].weekday_hour_start;
      company.weekday_hour_end = premiumCompanyList[i].weekday_hour_end;
      company.weekend_hour_start = premiumCompanyList[i].weekend_hour_start;
      company.weekend_hour_end = premiumCompanyList[i].weekend_hour_end;
      company.holiday = premiumCompanyList[i].holiday;
      company.context = premiumCompanyList[i].context;
      company.createdAt = premiumCompanyList[i].createdAt;
      company.businessTrip = premiumCompanyList[i].businessTrip;
      company.subwayDistance = premiumCompanyList[i].subwayDistance;

      //console.log(company.id);
      await models.MMC_AccountCompanyImg.findAll({
        attributes: ["id", "imgUrl"],
        where: {
          companyId: company.id,
          type: "com",
        },
        order: [["seq", "asc"]],
      })
        .then(async (ImgDataList) => {
          company.imgData = ImgDataList;
          company.count = {
            review: await companyController._companyReviewAvg(res, company.id),
            wish: await companyController._companyWishCount(res, company.id),
          };
          company.minGoods = await companyController._companyMinGoods(
            res,
            company.id
          );
          companyPremiumList.push(company);
        })
        .catch((err) => {
          console.log("mainList6 : error");
          console.log(err);
          res.send({
            success: false,
            resultCode: "02",
            message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
          });
          return false;
        });
    }

    returnData = companyPremiumList;

    return returnData;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  mainList: mainList,
  mainCompanyList: mainCompanyList,
  mainPremiumList: mainPremiumList,
  mainQueenList,
  mimoReviewDetail,
  bannerDetail,
};
