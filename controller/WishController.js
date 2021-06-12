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

//찜 목록 가져오기
const getWish = async (req, res) => {
  console.log("-----  찜 목록 가져오기 ----");
  const { type, categoryId } = req.query;
  const accountId = req.app.get("tokenId");

  if (!type) {
    res.send({
      success: false,
      resultCode: "03",
      message: "type 없음.",
    });
    return false;
  }

  if (!categoryId) {
    res.send({
      success: false,
      resultCode: "03",
      message: "categoryId 없음.",
    });
    return false;
  }

  if (!accountId) {
    res.send({
      success: false,
      resultCode: "03",
      message: "accountId 없음.",
    });
    return false;
  }
  try {
    const resData = await models.MMC_Wish.findAll({
      where: {
        type: type,
        categoryId: categoryId,
        userId: accountId,
      },
      raw: true,
    });
    //
    if (resData.length === 0) {
      res.send({
        success: false,
        resultCode: "00",
        message: "찜 목록 없음",
        list: resData,
      });
      return false;
    }
    //
    const returnData = await _returnWishList(res, type, resData);
    // console.log("returnData", returnData);
    res.send({
      success: true,
      resultCode: "00",
      message: "찜 목록 검색 완료",
      list: returnData,
    });
  } catch (err) {
    console.log("-----  찜 목록 가져오기 : error ----- ");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
// 찜 목록 중 타입(매장,디자이너,메뉴)별 리턴 데이터 다르게
const _returnWishList = async (res, type, resData) => {
  console.log("-----찜 목록 리스트 타입별 리턴 데이터 -----");
  // console.log("returnWishLise case 1:", type, resData);
  // type 1: 매장, 2: 디자이너, 3:상품
  switch (Number(type)) {
    case 1:
      // console.log("case 1");
      try {
        let wishList = [];

        for (let i = 0; i < resData.length; i++) {
          // console.log("찜 목록 루프 시작");

          const fintCompany = await models.MMC_AccountCompany.findAll({
            attributes: ["id", "category", "name", "subwayDistance"],
            where: {
              id: resData[i].targetId,
            },
            raw: true,
          });
          let returnData = fintCompany[0];
          returnData.wishInfo = resData[i];
          // console.log("returnData 루프 중간 1", returnData);
          returnData.imgData = await models.MMC_AccountCompanyImg.findAll({
            attributes: ["id", "imgUrl"],
            where: {
              companyId: resData[i].targetId,
              type: "com",
            },
            order: [["id", "desc"]],
            raw: true,
          });
          // console.log("returnData 루프 중간 2", returnData);
          returnData.count = {
            review: await companyController._companyReviewAvg(
              res,
              resData[i].targetId
            ),
            wish: await companyController._companyWishCount(
              res,
              resData[i].targetId
            ),
          };
          // console.log("returnData 루프 중간 3", returnData);
          returnData.minGoods = await companyController._companyMinGoods(
            res,
            resData[i].targetId
          );
          // console.log("returnData 루프 중간 push", returnData);
          wishList.push(returnData);
        }

        return wishList;
      } catch (err) {
        console.log(
          "-----찜 목록 리스트 타입별 리턴 데이터 에러 case : 1 -----"
        );
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "등록 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      }
      break;
    case 2:
      try {
        let wishList = [];

        for (let i = 0; i < resData.length; i++) {
          // console.log("찜 목록 루프 시작");

          const findWorker = await models.MMC_Workers.findAll({
            where: {
              id: resData[i].targetId,
            },
            raw: true,
          });
          let returnData = findWorker[0];
          returnData.wishInfo = resData[i];
          // console.log("returnData 루프 중간 1", returnData);
          returnData.review = await companyController._designerAvgPoint(
            res,
            resData[i].targetId
          );
          // console.log("returnData 루프 중간 2", returnData);
          returnData.wish = await companyController._designerWishCount(
            res,
            resData[i].targetId
          );

          // console.log("returnData 루프 중간 push", returnData);
          wishList.push(returnData);
        }

        return wishList;
      } catch (err) {
        console.log(
          "-----찜 목록 리스트 타입별 리턴 데이터 에러 case : 2 -----"
        );
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "등록 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      }
      break;
    case 3:
      try {
        let wishList = [];

        for (let i = 0; i < resData.length; i++) {
          // console.log("찜 목록 루프 시작");

          const findGoods = await models.MMC_Goods.findAll({
            attributes: [
              "id",
              "name",
              "price",
              "sale",
              "useTime",
              [
                sequelize.literal(
                  "(SELECT name FROM MMC_AccountCompany where id = MMC_Goods.companyId)"
                ),
                "companyName",
              ],
            ],
            where: {
              id: resData[i].targetId,
            },
            raw: true,
          });
          let returnData = findGoods[0];
          returnData.wishInfo = resData[i];

          const goodsImg = await models.MMC_GoodsImg.findAll({
            attributes: ["imgUrl", "id", "companyId", "goodsId"],
            where: {
              goodsId: resData[i].targetId,
            },
            order: [["seq", "asc"]],
            raw: true,
          });
          returnData.goodsImg = goodsImg;
          // console.log("returnData 루프 중간 push", returnData);
          wishList.push(returnData);
        }

        return wishList;
      } catch (err) {
        console.log(
          "-----찜 목록 리스트 타입별 리턴 데이터 에러 case : 3 -----"
        );
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "등록 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      }
      break;
  }
};

//찜 체크
const checkWish = async (req, res) => {
  console.log("-----  찜 체크 ----");
  const { type, targetId } = req.query;

  if (!type) {
    res.send({
      success: false,
      resultCode: "03",
      message: "type 없음.",
    });
    return false;
  }

  if (!targetId) {
    res.send({
      success: false,
      resultCode: "03",
      message: "targetId 없음.",
    });
    return false;
  }

  try {
    const accountId = req.app.get("tokenId");

    const resData = await models.MMC_Wish.findAll({
      where: {
        type: type,
        userId: accountId,
        targetId: targetId,
      },
      raw: true,
    });
    if (resData.length > 0) {
      res.send({
        success: true,
        resultCode: "00",
        message: "찜 체크 검색완료",
        list: resData[0],
      });
    } else {
      res.send({
        success: false,
        resultCode: "00",
        message: "찜 체크 검색완료",
        list: resData,
      });
    }
  } catch (err) {
    console.log("-----  찜 목록 가져오기 : error ----- ");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
//찜하기
const setWish = async (req, res) => {
  console.log("-----  찜하기 ----");
  const { type, targetId } = req.body;

  if (!type) {
    res.send({
      success: false,
      resultCode: "02",
      message: "type 없음.",
    });
    return false;
  }

  if (!targetId) {
    res.send({
      success: false,
      resultCode: "03",
      message: "targetId 없음.",
    });
    return false;
  }
  try {
    const accountId = req.app.get("tokenId");

    const checkWish = await models.MMC_Wish.findAll({
      where: {
        type: type,
        targetId: targetId,
        userId: accountId,
      },
      raw: true,
    });
    // 찜목록 확인
    if (checkWish.length > 0) {
      res.send({
        success: false,
        resultCode: "02",
        message: "이미 찜한 목록입니다.",
        list: checkWish,
      });
    } else {
      const categoryId = await _findCategoryId(res, type, targetId);
      const resData = await models.MMC_Wish.create({
        userId: accountId,
        targetId: targetId,
        categoryId: categoryId,
        type: type,
      });

      res.send({
        success: true,
        resultCode: "00",
        message: "찜 하기 등록 완료",
        list: resData,
      });
    }
  } catch (err) {
    console.log("-----  찜 하기 : error ----- ");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "등록 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
// fint
const _findCategoryId = async (res, type, targetId) => {
  console.log("-----  찜 목록 카테고리 Id 찾기 ----");
  // type 1: 매장, 2: 디자이너, 3:상품
  switch (type) {
    case 1:
      try {
        const resData = await models.MMC_AccountCompany.findAll({
          attributes: ["id", "category"],
          where: {
            id: targetId,
          },
          raw: true,
        });

        return resData[0].category;
      } catch (err) {
        console.log("-----  찜 목록 카테고리 Id 찾기 에러 case: 1 ----");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "등록 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      }
      break;
    case 2:
      try {
        const resData = await models.MMC_Workers.findAll({
          attributes: ["id", "companyId"],
          where: {
            id: targetId,
          },
          raw: true,
        });

        const resData2 = await models.MMC_AccountCompany.findAll({
          attributes: ["id", "category"],
          where: {
            id: resData[0].companyId,
          },
          raw: true,
        });
        return resData2[0].category;
      } catch (err) {
        console.log("-----  찜 목록 카테고리 Id 찾기 에러 case: 2 ----");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "등록 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      }
      break;
    case 3:
      try {
        const resData = await models.MMC_Goods.findAll({
          attributes: ["id", "categoryId"],
          where: {
            id: targetId,
          },
          raw: true,
        });
        return resData[0].categoryId;
      } catch (err) {
        console.log("-----  찜 목록 카테고리 Id 찾기 에러 case: 3 ----");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "등록 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      }
      break;
  }
};

//찜 삭제
const deleteWish = async (req, res) => {
  console.log("-----  찜 삭제 ----");
  // console.log("req.body", req.body);
  const { wishId } = req.query;
  const accountId = req.app.get("tokenId");
  if (!wishId) {
    res.send({
      success: false,
      resultCode: "02",
      message: "wishId 없음.",
    });
    return false;
  }
  if (!accountId) {
    res.send({
      success: false,
      resultCode: "05",
      message: "accountId 없음.",
    });
    return false;
  }
  try {
    const resData = await models.MMC_Wish.destroy({
      where: {
        userId: accountId,
        id: wishId,
      },
    });
    if (resData === 1) {
      res.send({
        success: true,
        resultCode: "00",
        message: "찜 삭제 완료",
        list: resData,
      });
    } else if (resData === 0) {
      res.send({
        success: false,
        resultCode: "01",
        message: "삭제 목록이 없습니다.",
        list: resData,
      });
    } else {
      res.send({
        success: false,
        resultCode: "03",
        message: "삭제 목록을 찾을 수 없습니다.",
        list: resData,
      });
    }
  } catch (err) {
    console.log("----- 찜 삭제 : error ----");
    console.log(err);
    res.send({
      success: false,
      resultCode: "04",
      message: "삭제 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};

module.exports = {
  getWish,
  setWish,
  deleteWish,
  checkWish,
};
