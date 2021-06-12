var models = require("../models");
var common = require("./Common");
var sha256 = require("sha256");
const jwt = require("jsonwebtoken");
var moment = require("moment");
var request = require("request");
var validator = require("validator");
const s3 = require("../routes/s3");
const { sequelize } = require("../models");

//주문하기
const setOrder = async (req, res) => {
  console.log("------------ 주문하기 ------------");
  try {
    var accountId = req.app.get("tokenId");
    var reservationName = req.body.reservationName;
    var reservationPhone = req.body.reservationPhone;
    var companyId = req.body.companyId;
    var goodsId = req.body.goodsId;
    var workId = req.body.workId;
    var goodsOption = req.body.goodsOption;
    var optionPrice = req.body.optionPrice;
    var goodsPrice = req.body.goodsPrice;
    var sale = req.body.sale;
    var totalPrice = req.body.totalPrice;
    var reservationTime = req.body.reservationTime;

    var arrGoodsOption = new Array();
    var sendAddPriceOption;

    var data = new Object();

    var insertObject = new Object();

    //주문 아이디 만들기
    var max = 999999;
    var min = 100000;
    var ranNum = Math.floor(Math.random() * (max - min + 1)) + min;
    var orderId = moment().format("YYYYMMDDHHmmss") + ranNum;

    if (!accountId) {
      console.log("setOrder : accountId 가 없습니다.");
      res.send({
        success: false,
        resultCode: "02",
        message: "accountId 가 없습니다.",
      });
      return false;
    }
    if (!companyId) {
      console.log("setOrder : companyId 가 없습니다.");
      res.send({
        success: false,
        resultCode: "03",
        message: "companyId 가 없습니다.",
      });
      return false;
    }
    if (!goodsId) {
      console.log("setOrder : goodsId 가 없습니다.");
      res.send({
        success: false,
        resultCode: "04",
        message: "goodsId 가 없습니다.",
      });
      return false;
    }
    if (!goodsPrice) {
      console.log("setOrder : goodsPrice 가 없습니다.");
      res.send({
        success: false,
        resultCode: "05",
        message: "goodsPrice 가 없습니다.",
      });
      return false;
    }
    if (!totalPrice) {
      console.log("setOrder : totalPrice 가 없습니다.");
      res.send({
        success: false,
        resultCode: "06",
        message: "totalPrice 가 없습니다.",
      });
      return false;
    }
    if (!reservationTime) {
      console.log("setOrder : reservationTime 가 없습니다.");
      res.send({
        success: false,
        resultCode: "07",
        message: "reservationTime 가 없습니다.",
      });
      return false;
    }
    if (!reservationName) {
      console.log("setOrder : accountName 가 없습니다.");
      res.send({
        success: false,
        resultCode: "08",
        message: "reservationName 가 없습니다.",
      });
      return false;
    }
    if (!reservationPhone) {
      console.log("setOrder : accountPhone 가 없습니다.");
      res.send({
        success: false,
        resultCode: "09",
        message: "reservationPhone 가 없습니다.",
      });
      return false;
    }

    const dataResult = await models.MMC_Goods.findAll({
      attributes: ["id", "goodsCategoryId"],
      where: {
        id: goodsId,
      },
    });
    const findGoodsCategoryId = dataResult[0].goodsCategoryId;

    const dataResult2 = await models.MMA_GoodsCategory.findAll({
      attributes: ["id", "categoryId"],
      where: {
        id: findGoodsCategoryId,
      },
    });

    const findCategoryId = dataResult2[0].categoryId;
    insertObject.categoryId = findCategoryId;
    insertObject.goodsCategoryId = findGoodsCategoryId;
    insertObject.accountId = accountId;
    insertObject.orderId = orderId;
    insertObject.companyId = companyId;
    insertObject.goodsId = goodsId;
    insertObject.reservationName = reservationName;
    insertObject.reservationPhone = reservationPhone;
    if (workId) {
      insertObject.workId = workId;
    }
    if (goodsOption) {
      insertObject.optionPrice = optionPrice;

      if (Array.isArray(goodsOption)) {
        for (var i = 0; i < goodsOption.length; i++) {
          arrGoodsOption[i] = goodsOption[i];
        }
        sendAddPriceOption = "[" + arrGoodsOption.toString() + "]";
      } else {
        if (goodsOption) {
          arrGoodsOption[0] = goodsOption;
          sendAddPriceOption = "[" + arrGoodsOption.toString() + "]";
        } else {
          sendAddPriceOption = null;
        }
      }
      insertObject.goodsOption = sendAddPriceOption;
    }
    insertObject.goodsPrice = goodsPrice;
    if (sale) {
      insertObject.sale = sale;
    }
    insertObject.totalPrice = totalPrice;

    //옵션상품 검색
    data.goodsOptionName = await getGoodsOptionName(goodsOption);

    //주문 테이블 insert
    await models.MM_Order.create(insertObject)
      .then((result) => {
        //예약 테이블 insert
        models.MM_Reservation.create({
          accountId: accountId,
          orderId: orderId,
          reservationTime: reservationTime,
        })
          .then((result) => {
            console.log("setOrder :  등록 성공.");

            data.name = "예금주";
            data.bank = "신한은행";
            data.bankAccount = "111-222-333-444";
            data.expireTime = moment().add("3", "hours").toLocaleString();

            data.accountId = accountId;
            data.reservationName = reservationName;
            data.reservationPhone = reservationPhone;
            data.companyId = companyId;
            data.orderId = orderId;
            data.goodsId = goodsId;
            data.workId = workId;
            data.goodsOption = goodsOption;
            data.optionPrice = optionPrice;
            data.goodsPrice = goodsPrice;
            data.sale = sale;
            data.totalPrice = totalPrice;
            data.reservationTime = reservationTime;

            var query = " SELECT ";
            query += " a.*, ";
            query +=
              " (select b.name from MMC_AccountCompany b where a.companyId = b.id) as companyName, ";
            query +=
              " (select b.name from MMC_Goods b where a.goodsId = b.id) as goodsName, ";
            query +=
              " (select b.name from MMC_Workers b where a.workId = b.id) as workerName ";
            query += " FROM MM_Order a ";
            query += " where a.orderId = '" + orderId + "'";

            models.sequelize
              .query(query, {})
              .then((dataList) => {
                data.companyName = dataList[0][0].companyName;
                data.goodsName = dataList[0][0].goodsName;
                data.workerName = dataList[0][0].workerName;

                res.send({ success: true, resultCode: "00", list: data });
              })
              .catch((err) => {
                console.log("setOrder : 회사 찾기 검색 에러.");
                console.log(err);
                res.send({
                  success: false,
                  resultCode: "01",
                  message:
                    "등록중 문제가 발생하였습니다. 관리자에게 문의하세요.",
                });
              });
          })
          .catch((err) => {
            console.log("setOrder :  등록 실패.");
            console.log(err);
            res.send({
              success: false,
              resultCode: "01",
              message: "등록중 문제가 발생하였습니다. 관리자에게 문의하세요.",
            });
            return false;
          });
      })
      .catch((err) => {
        console.log("setOrder :  등록 실패.");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "등록중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
        return false;
      });
  } catch (err) {
    console.log("setOrder : error");
    console.log(err);
  }
};

let getGoodsOptionName = async (goodsOption) => {
  console.log("------------ getGoodsOptionName ------------");
  try {
    var returnData;
    if (goodsOption) {
      returnData = new Array();
      if (Array.isArray(goodsOption)) {
        for (var i = 0; i < goodsOption.length; i++) {
          await models.MMC_GoodsAddOption.findAll({
            attributes: ["id", "name"],
            where: {
              id: goodsOption[i],
            },
          })
            .then((dataList) => {
              returnData.push(dataList[0].name);
            })
            .catch((err) => {});
        }
      } else {
        await models.MMC_GoodsAddOption.findAll({
          attributes: ["id", "name"],
          where: {
            id: goodsOption,
          },
        })
          .then((dataList) => {
            returnData.push(dataList[0].name);
          })
          .catch((err) => {});
      }

      return returnData;
    }
  } catch (err) {
    console.log("getGoodsOptionName : error");
    console.log(err);
  }
};

//예약하기 사용자 화면
let orderAccountView = async (req, res) => {
  try {
    console.log("------------ 예약하기 사용자 화면 ------------");
    //var companyId = req.body.companyId;
    //var companyId = req.param('companyId');
    var companyId;
    var weekday_hour_start;
    var weekday_hour_end;
    var weekend_hour_start;
    var weekend_hour_end;
    //var goodsId = req.body.goodsId;
    var goodsId = req.param("goodsId");

    //var goodsDetail = new Object();

    if (!goodsId || goodsId == "") {
      console.log("orderAccountView : goodsId 가 없습니다.");
      res.send({
        success: false,
        resultCode: "03",
        message: "goodsId 가 없습니다.",
      });
      return false;
    }

    //companyId 구하기
    var query = " SELECT ";
    query += " a.*, ";
    query += " b.weekday_hour_start, ";
    query += " b.weekday_hour_end, ";
    query += " b.weekend_hour_start, ";
    query += " b.weekend_hour_end ";
    query += " FROM MMC_Goods a ";
    query += " LEFT JOIN MMC_AccountCompany b ON a.companyId = b.id ";
    query += " where a.id = '" + goodsId + "'";

    await models.sequelize
      .query(query, {})
      .then((dataList) => {
        if (dataList[0].length == 0) {
          console.log("orderAccountView : 검색 된 업체 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "02",
            message: "검색 된 정보가 없습니다.",
          });
          return false;
        } else {
          console.log("orderAccountView : 검색된 업체정보가 있습니다.");
          companyId = dataList[0][0].companyId;
          weekday_hour_start = dataList[0][0].weekday_hour_start;
          weekday_hour_end = dataList[0][0].weekday_hour_end;
          weekend_hour_start = dataList[0][0].weekend_hour_start;
          weekend_hour_end = dataList[0][0].weekend_hour_end;
        }
      })
      .catch((err) => {
        console.log("orderAccountView : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });

    //직원 리스트
    var dayOfWeek = new Date().getDay();

    var query = " SELECT ";
    query +=
      " a.`*`, if(a.holiday LIKE '%" +
      dayOfWeek +
      "%', 'y', 'n') AS holiday_yn ";
    query += " FROM MMC_Workers a ";
    query += " where a.companyId = '" + companyId + "' and deletedAt IS NULL";

    await models.sequelize
      .query(query, {})
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("orderAccountView : 검색된 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "01",
            message: "검색된 정보가 없습니다.",
          });
          return false;
        } else {
          console.log("orderAccountView : 검색완료1.");
          res.send({
            success: true,
            resultCode: "00",
            weekday_hour_start: weekday_hour_start,
            weekday_hour_end: weekday_hour_end,
            weekend_hour_start: weekend_hour_start,
            weekend_hour_end: weekend_hour_end,
            list: dataList[0],
          });
        }
      })
      .catch((err) => {
        console.log("orderAccountView : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "02",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
        return false;
      });

    //현 시간에서 부터 30분 단위로 종료시간까지 구하기
    //주말인지 구하기
    //if(dayOfWeek == "0" || dayOfWeek == "6"){
    //주말
    //}else{
    //평일
    //}
  } catch (err) {
    console.log("setOrder : error");
    console.log(err);
  }
};

//주문리스트
let orderList = async (req, res) => {
  try {
    console.log("------------ 주문리스트 ------------");
    //var companyId = req.body.companyId;
    //var accountId = req.body.accountId;
    //var goodsId = req.body.goodsId;
    //var companyId = req.param('companyId');
    //var accountId = req.param('accountId');
    //var accountName = req.param('accountName');
    //var goodsId = req.param('goodsId');
    let accountId = req.app.get("tokenId");
    let categoryId = req.param("categoryId");
    let data = new Object();

    if (!categoryId) {
      console.log("orderList : categoryId 가 없습니다.");
      res.send({
        success: false,
        resultCode: "-06",
        message: "categoryId 가 없습니다.",
      });
      return false;
    }
    //예약중
    var query = " SELECT ";
    query += " a.*, ";
    query +=
      " (SELECT b.reservationTime FROM MM_Reservation b WHERE b.orderId = a.orderId) AS reservationTime, ";
    query +=
      " (SELECT email FROM MM_Account b WHERE b.id = a.accountId) AS email, ";
    query +=
      " (SELECT NAME FROM MM_Account b WHERE b.id = a.accountId) AS accountName, ";
    query +=
      " (SELECT NAME FROM MMC_AccountCompany b WHERE b.id = a.companyId) AS companyName, ";
    query +=
      " (SELECT imgUrl FROM MMC_AccountCompanyImg b WHERE b.companyId = a.companyId and type = 'com' limit 1) AS companyImgUrl, ";
    query +=
      " (SELECT category FROM MMC_AccountCompany b WHERE b.id = a.companyId) AS categoryId, ";
    query +=
      " (SELECT b.name FROM MMC_Category b LEFT JOIN MMC_AccountCompany c ON b.id = c.category WHERE c.id = a.companyId) as categoryName, ";
    query +=
      " (SELECT NAME FROM MMC_Goods b WHERE b.id = a.goodsId) AS goodsName, ";
    query +=
      " (SELECT price FROM MMC_Goods b WHERE b.id = a.goodsId) AS goodsPrice, ";
    query +=
      " (SELECT name FROM MMC_Workers b WHERE b.id = a.workId) AS workName, ";
    query +=
      " (SELECT position FROM MMC_Workers b WHERE b.id = a.workId) AS workPosition, ";
    //query += " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), 'wait', 'timeout') AS expireTimeout, ";
    //query += " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), '결제대기', '시간만료') AS expireTimeout_msg, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankComplete b WHERE a.orderId = b.orderId) = 'y', 'y', ";
    query +=
      " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), if(a.accountCancel = 'y', 'accountCancel', 'wait'), 'timeout')) AS complete_yn, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankComplete b WHERE a.orderId = b.orderId) = 'y', '결제완료', ";
    query +=
      " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), if(a.accountCancel = 'y', '사용자취소', '결제대기'), '시간만료')) AS complete_yn_msg, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'y', 'y', ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'n', 'n', null) ) AS cancel_yn, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'y', '취소완료', ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'n', '취소요청', null) ) AS cancel_yn_msg ";
    query += " FROM ";
    query += " MM_Order a ";
    query += " where deletedAt IS NULL ";
    query += " and a.accountId = '" + accountId + "'";
    query += " and a.categoryId = '" + categoryId + "'";
    //query += " and (SELECT complete_yn FROM MM_OrderVbankComplete b WHERE a.orderId = b.orderId) is null ";
    // query += " and ADDTIME(a.createdAt, '03:00:00') > NOW() ";
    query +=
      " and (SELECT b.reservationTime FROM MM_Reservation b WHERE b.orderId = a.orderId) > NOW() ";
    query +=
      " and (SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) is null ";
    query += " and accountCancel = 'n' ";
    query += "order by reservationTime asc";

    await models.sequelize
      .query(query, {
        //replacements: {
        //	contact_hash: hashPhone,
        //	id: certId
        //}
      })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log(
            "orderList[" + accountId + "] : 검색 된 정보가 없습니다."
          );
          res.send({
            success: false,
            resultCode: "01",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log("orderList[" + accountId + "] : 검색된 정보가 있습니다.");
          data.reservation_ing = dataList[0];
          //res.send({ success: true, resultCode: '00', message: '검색완료.', list: dataList[0] });
        }
      })
      .catch((err) => {
        console.log("orderList[" + accountId + "] : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "02",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });

    //옵션 이름 구하기
    for (var i = 0; i < data.reservation_ing.length; i++) {
      data.reservation_ing[i].goodsOptionName = await getGoodsOptionName(
        data.reservation_ing[i].goodsOption
      );
    }

    //완료
    var query = " SELECT ";
    query += " a.*, ";
    query +=
      " (SELECT b.reservationTime FROM MM_Reservation b WHERE b.orderId = a.orderId) AS reservationTime, ";
    query +=
      " (SELECT email FROM MM_Account b WHERE b.id = a.accountId) AS email, ";
    query +=
      " (SELECT NAME FROM MM_Account b WHERE b.id = a.accountId) AS accountName, ";
    query +=
      " (SELECT NAME FROM MMC_AccountCompany b WHERE b.id = a.companyId) AS companyName, ";
    query +=
      " (SELECT imgUrl FROM MMC_AccountCompanyImg b WHERE b.companyId = a.companyId and type = 'com' limit 1) AS companyImgUrl, ";
    query +=
      " (SELECT category FROM MMC_AccountCompany b WHERE b.id = a.companyId) AS categoryId, ";
    query +=
      " (SELECT b.name FROM MMC_Category b LEFT JOIN MMC_AccountCompany c ON b.id = c.category WHERE c.id = a.companyId) as categoryName, ";
    query +=
      " (SELECT NAME FROM MMC_Goods b WHERE b.id = a.goodsId) AS goodsName, ";
    query +=
      " (SELECT price FROM MMC_Goods b WHERE b.id = a.goodsId) AS goodsPrice, ";
    query +=
      " (SELECT name FROM MMC_Workers b WHERE b.id = a.workId) AS workName, ";
    query +=
      " (SELECT position FROM MMC_Workers b WHERE b.id = a.workId) AS workPosition, ";
    //query += " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), 'wait', 'timeout') AS expireTimeout, ";
    //query += " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), '결제대기', '시간만료') AS expireTimeout_msg, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankComplete b WHERE a.orderId = b.orderId) = 'y', 'y', ";
    query +=
      " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), if(a.accountCancel = 'y', 'accountCancel', 'wait'), 'timeout')) AS complete_yn, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankComplete b WHERE a.orderId = b.orderId) = 'y', '결제완료', ";
    query +=
      " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), if(a.accountCancel = 'y', '사용자취소', '결제대기'), '시간만료')) AS complete_yn_msg, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'y', 'y', ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'n', 'n', null) ) AS cancel_yn, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'y', '취소완료', ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'n', '취소요청', null) ) AS cancel_yn_msg ";
    query += " FROM ";
    query += " MM_Order a ";
    query += " where deletedAt IS NULL  ";
    query += " and a.accountId = '" + accountId + "'";
    query += " and a.categoryId = '" + categoryId + "'";
    //query += " and (SELECT complete_yn FROM MM_OrderVbankComplete b WHERE a.orderId = b.orderId) != 'n' ";
    //query += " and if(ADDTIME(a.createdAt, '03:00:00') > NOW(), 'wait', 'timeout') != 'wait' ";
    // query += " and ADDTIME(a.createdAt, '03:00:00') > NOW() ";
    query +=
      " and (SELECT b.reservationTime FROM MM_Reservation b WHERE b.orderId = a.orderId) < NOW() ";
    query +=
      " and (SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) is null  ";
    query += " and accountCancel = 'n' ";
    query += "order by reservationTime desc";

    await models.sequelize
      .query(query, {
        //replacements: {
        //	contact_hash: hashPhone,
        //	id: certId
        //}
      })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log(
            "orderList[" + accountId + "] : 검색 된 정보가 없습니다."
          );
          res.send({
            success: false,
            resultCode: "01",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log("orderList[" + accountId + "] : 검색된 정보가 있습니다.");
          data.reservation_end = dataList[0];
        }
      })
      .catch((err) => {
        console.log("orderList[" + accountId + "] : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "02",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });

    //옵션 이름 구하기
    for (var i = 0; i < data.reservation_end.length; i++) {
      data.reservation_end[i].goodsOptionName = await getGoodsOptionName(
        data.reservation_end[i].goodsOption
      );
    }

    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료.",
      list: data,
    });
  } catch (err) {
    console.log("orderList : error");
    console.log(err);
  }
};

//주문상세화면
let getOrder = async (req, res) => {
  try {
    console.log("------------ 주문상세화면 ------------");

    var orderId = req.param("orderId");

    var data = new Object();
    var returnData;

    if (!orderId) {
      console.log("getOrder[" + orderId + "] : orderId 없습니다.");
      res.send({
        success: false,
        resultCode: "03",
        message: "orderId 없습니다.",
      });
      return false;
    }

    var query = " SELECT ";
    query += " a.*, ";
    query +=
      " (SELECT b.reservationTime FROM MM_Reservation b WHERE b.orderId = a.orderId) AS reservationTime, ";
    query +=
      " (SELECT email FROM MM_Account b WHERE b.id = a.accountId) AS email, ";
    query +=
      " (SELECT NAME FROM MM_Account b WHERE b.id = a.accountId) AS accountName, ";
    query +=
      " (SELECT NAME FROM MMC_AccountCompany b WHERE b.id = a.companyId) AS companyName, ";
    query +=
      " (SELECT imgUrl FROM MMC_AccountCompanyImg b WHERE b.companyId = a.companyId and type = 'com' limit 1) AS companyImgUrl, ";
    query +=
      " (SELECT b.name FROM MMC_Category b LEFT JOIN MMC_AccountCompany c ON b.id = c.category WHERE c.id = a.companyId) as categoryName, ";
    query +=
      " (SELECT category FROM MMC_AccountCompany b WHERE b.id = a.companyId) AS categoryId, ";
    query +=
      " (SELECT NAME FROM MMC_Goods b WHERE b.id = a.goodsId) AS goodsName, ";
    query +=
      " (SELECT price FROM MMC_Goods b WHERE b.id = a.goodsId) AS goodsPrice, ";
    query +=
      " (SELECT name FROM MMC_Workers b WHERE b.id = a.workId) AS workName, ";
    query +=
      " (SELECT position FROM MMC_Workers b WHERE b.id = a.workId) AS workPosition, ";
    //query += " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), 'wait', 'timeout') AS expireTimeout, ";
    //query += " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), '결제대기', '시간만료') AS expireTimeout_msg, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankComplete b WHERE a.orderId = b.orderId) = 'y', 'y', ";
    query +=
      " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), if(a.accountCancel = 'y', 'accountCancel', 'wait'), 'timeout')) AS complete_yn, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankComplete b WHERE a.orderId = b.orderId) = 'y', '결제완료', ";
    query +=
      " if(ADDTIME(a.createdAt, '03:00:00') > NOW(), if(a.accountCancel = 'y', '사용자취소', '결제대기'), '시간만료')) AS complete_yn_msg, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'y', 'y', ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'n', 'n', null) ) AS cancel_yn, ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'y', '취소완료', ";
    query +=
      " if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE a.orderId = b.orderId) = 'n', '취소요청', null) ) AS cancel_yn_msg ";
    query += " FROM ";
    query += " MM_Order a ";
    query += " where a.id = '" + orderId + "'";

    await models.sequelize
      .query(query, {
        //replacements: {
        //	contact_hash: hashPhone,
        //	id: certId
        //}
      })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("getOrder[" + orderId + "] : 검색 된 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "01",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          if (dataList[0][0].complete_yn == "wait") {
            console.log(
              "getOrder[" + orderId + "] : 검색된 정보가 있습니다(결제대기)."
            );

            data.name = "예금주";
            data.bank = "신한은행";
            data.bankAccount = "111-222-333-444";
            data.expireTime = moment(dataList[0][0].createdAt)
              .add("3", "hours")
              .format("YYYY-MM-DD HH:mm:00")
              .toLocaleString();
            //res.send({ success: true, resultCode: '00', message: '검색완료.', order: data, list: dataList[0][0] });
          } else {
            data = null;
            console.log("getOrder[" + orderId + "] : 검색된 정보가 있습니다.");
            //res.send({ success: true, resultCode: '00', message: '검색완료.', order: null, list: dataList[0][0] });
          }

          returnData = dataList[0][0];
        }
      })
      .catch((err) => {
        console.log("getOrder[" + orderId + "] : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "02",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });

    //옵션 이름 구하기
    if (returnData.goodsOption) {
      returnData.goodsOptionName = await getGoodsOptionName(
        returnData.goodsOption
      );
    } else {
      returnData.goodsOptionName = new Array();
    }

    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료.",
      order: data,
      list: returnData,
    });
  } catch (err) {
    console.log("getOrder : error");
    console.log(err);
  }
};

//고객주문취소
let cancelOrder = async (req, res) => {
  try {
    console.log("------------ 고객주문취소 ------------");

    var orderId = req.body.orderId;

    if (!orderId || orderId == "") {
      console.log("cancelOrder[" + orderId + "] : orderId 없음.");
      res.send({ success: false, resultCode: "01", message: "orderId 없음." });
      return false;
    }

    models.MM_Order.update(
      {
        accountCancel: "y",
      },
      {
        where: { orderId: orderId },
      }
    )
      .then((updateResult) => {
        res.send({
          success: true,
          resultCode: "00",
          message: "사용자 취소 완료.",
        });
      })
      .catch((err) => {
        console.log(err);
        console.log(
          "cancelOrder[" +
            email +
            "] : 처리중 문제가 발생하였습니다. 관리자에게 문의하세요."
        );
        res.send({
          success: false,
          resultCode: "01",
          message: "처리중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log("cancelOrder : error");
    console.log(err);
  }
};

const cancelOrderList = async (req, res) => {
  try {
    console.log("------------ 주문 취소 리스트 ------------");

    const accountId = req.app.get("tokenId");
    const categoryId = req.param("categoryId");

    if (!categoryId) {
      console.log("orderList : categoryId 가 없습니다.");
      res.send({
        success: false,
        resultCode: "-06",
        message: "categoryId 가 없습니다.",
      });
      return false;
    }

    const cancleList = await models.MM_Order.findAll({
      attributes: [
        "MM_Order.*",
        [
          sequelize.literal(
            "(SELECT b.reservationTime FROM MM_Reservation b WHERE b.orderId = MM_Order.orderId)"
          ),
          "reservationTime",
        ],
        [
          sequelize.literal(
            "(SELECT email FROM MM_Account b WHERE b.id = MM_Order.accountId)"
          ),
          "email",
        ],
        [
          sequelize.literal(
            "(SELECT NAME FROM MM_Account b WHERE b.id = MM_Order.accountId)"
          ),
          "accountName",
        ],
        [
          sequelize.literal(
            "(SELECT NAME FROM MMC_AccountCompany b WHERE b.id = MM_Order.companyId)"
          ),
          "companyName",
        ],
        [
          sequelize.literal(
            "(SELECT imgUrl FROM MMC_AccountCompanyImg b WHERE b.companyId = MM_Order.companyId and type = 'com' limit 1)"
          ),
          "companyImgUrl",
        ],
        [
          sequelize.literal(
            "(SELECT b.name FROM MMC_Category b LEFT JOIN MMC_AccountCompany c ON b.id = c.category WHERE c.id = MM_Order.companyId)"
          ),
          "categoryName",
        ],
        [
          sequelize.literal(
            "(SELECT category FROM MMC_AccountCompany b WHERE b.id = MM_Order.companyId)"
          ),
          "categoryId",
        ],
        [
          sequelize.literal(
            "(SELECT NAME FROM MMC_Goods b WHERE b.id = MM_Order.goodsId)"
          ),
          "goodsName",
        ],
        [
          sequelize.literal(
            "(SELECT price FROM MMC_Goods b WHERE b.id = MM_Order.goodsId)"
          ),
          "goodsPrice",
        ],
        [
          sequelize.literal(
            " (SELECT name FROM MMC_Workers b WHERE b.id = MM_Order.workId)"
          ),
          "workName",
        ],
        [
          sequelize.literal(
            "(SELECT position FROM MMC_Workers b WHERE b.id = MM_Order.workId)"
          ),
          "workPosition",
        ],
        [
          sequelize.literal(
            "if((SELECT complete_yn FROM MM_OrderVbankComplete b WHERE MM_Order.orderId = b.orderId) = 'y', 'y', if(ADDTIME(MM_Order.createdAt, '03:00:00') > NOW(), if(MM_Order.accountCancel = 'y', 'accountCancel', 'wait'), 'timeout'))"
          ),
          "complete_yn",
        ],
        [
          sequelize.literal(
            "if((SELECT complete_yn FROM MM_OrderVbankComplete b WHERE MM_Order.orderId = b.orderId) = 'y', '결제완료', if(ADDTIME(MM_Order.createdAt, '03:00:00') > NOW(), if(MM_Order.accountCancel = 'y', '사용자취소', '결제대기'), '시간만료'))"
          ),
          "complete_yn_msg",
        ],
        [
          sequelize.literal(
            "if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE MM_Order.orderId = b.orderId) = 'y', 'y', if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE MM_Order.orderId = b.orderId) = 'n', 'n', null) ) "
          ),
          "cancel_yn",
        ],
        [
          sequelize.literal(
            "if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE MM_Order.orderId = b.orderId) = 'y', '취소완료',if((SELECT complete_yn FROM MM_OrderVbankCancel b WHERE MM_Order.orderId = b.orderId) = 'n', '취소요청', null) )  "
          ),
          "cancel_yn_msg",
        ],
      ],
      where: {
        categoryId,
        accountId,
        accountCancel: "y",
      },
      raw: true,
    });

    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료.",
      list: cancleList,
    });
  } catch (err) {
    console.log("------------ 주문 취소 리스트 에러 ------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "처리중 문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
module.exports = {
  setOrder,
  orderList,
  getOrder,
  orderAccountView,
  cancelOrder,
  cancelOrderList,
};
