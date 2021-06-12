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
const s3 = require("../routes/s3");
const s9 = require("../routes/s9");

//
const _surroundGroup = async (res, idArr) => {
  let returnArr = [];
  try {
    for (let i = 0; i < idArr.length; i++) {
      let resData = await models.MMC_AccountCompany.findAll({
        attributes: [
          "id",
          "category",
          "enabled",
          "ceo_name",
          "name",
          "phone",
          "sido",
          "sigungu",
          "bname",
          "ogname",
          "roadname",
          "latitude",
          "longitude",
          "remains_address",
          "new_address",
          "old_address",
          "premium_YN",
          "subwayDistance",
        ],
        where: {
          id: idArr[i],
        },
        raw: true,
      });
      resData[0].review = await _companyReviewAvg(res, resData[0].id);
      resData[0].wish = await _companyWishCount(res, resData[0].id);
      resData[0].minGoods = await _companyMinGoods(res, resData[0].id);
      resData[0].imgData = await models.MMC_AccountCompanyImg.findAll({
        attributes: ["id", "imgUrl"],
        where: {
          companyId: resData[0].id,
          type: "com",
        },
        order: [["id", "desc"]],
      });

      returnArr.push(resData[0]);
    }
    return returnArr;
  } catch (err) {
    console.log("--- surroundGroup Err ---");
    console.log(err);
  }
};
const surround = async (req, res) => {
  try {
    console.log("------------ 주변 업체 검색 ------------");
    const { latitude, longitude, categoryId, distance } = req.query;

    if (!latitude || !longitude) {
      res.send({
        success: false,
        resultCode: "03",
        message: "위치정보 없음.",
      });
      return false;
    }
    if (!categoryId) {
      res.send({
        success: false,
        resultCode: "04",
        message: "categoryId 없음.",
      });
      return false;
    }

    let resData = await models.MMC_AccountCompany.findAll({
      attributes: [
        "id",
        "category",
        "enabled",
        "ceo_name",
        [
          sequelize.literal(
            "IF(count(*)>1, concat(name,' 외',count(*) -1,' 개'),name)"
          ),
          "name",
        ],
        "phone",
        "sido",
        "sigungu",
        "bname",
        "ogname",
        "roadname",
        "latitude",
        "longitude",
        "remains_address",
        "new_address",
        "old_address",
        "premium_YN",
        "subwayDistance",
        [sequelize.literal("GROUP_CONCAT( id SEPARATOR  '-' )"), "groupId"],
      ],
      where: sequelize.literal(
        `(st_distance_sphere(POINT(${longitude},${latitude}), POINT(MMC_AccountCompany.longitude,MMC_AccountCompany.latitude))/1000) < ${
          distance ? distance : 0.5
        } AND category=${categoryId}`
      ),
      group: ["latitude", "longitude"],

      // order: [
      //   [
      //     "(st_distance_sphere(POINT(${longitude},${latitude}), POINT(MMC_AccountCompany.longitude,MMC_AccountCompany.latitude))/1000)",
      //     "ASC",
      //   ],
      // ],
      raw: true,
    });

    for (let i = 0; i < resData.length; i++) {
      if (resData[i].groupId.indexOf("-") > -1) {
        resData[i].review = await _companyReviewAvg(res, resData[i].id);
        resData[i].wish = await _companyWishCount(res, resData[i].id);
        resData[i].minGoods = await _companyMinGoods(res, resData[i].id);
        resData[i].imgData = await models.MMC_AccountCompanyImg.findAll({
          attributes: ["id", "imgUrl"],
          where: {
            companyId: resData[i].id,
            type: "com",
          },
          order: [["id", "desc"]],
        });

        const groupInfo = resData[i].groupId.split("-");
        // console.log("groupInfo", groupInfo);
        resData[i].group = await _surroundGroup(res, groupInfo);
      } else {
        resData[i].review = await _companyReviewAvg(res, resData[i].id);
        resData[i].wish = await _companyWishCount(res, resData[i].id);
        resData[i].minGoods = await _companyMinGoods(res, resData[i].id);
        resData[i].imgData = await models.MMC_AccountCompanyImg.findAll({
          attributes: ["id", "imgUrl"],
          where: {
            companyId: resData[i].id,
            type: "com",
          },
          order: [["id", "desc"]],
        });
      }
    }

    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료.",
      list: resData,
    });
  } catch (err) {
    console.log("------------ 주변 업체 검색 에러------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
//업체 최소 가격 상품 내부함수
let _companyMinGoods = async (res, companyId) => {
  try {
    console.log("------------ 업체 최소 가격 상품 ------------");

    // const companyId = req.param("companyId");

    if (!companyId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "companyId 없음.",
      });
      return false;
    }

    // 평균 쿼리
    const resData = await models.MMC_Goods.findAll({
      attributes: ["companyId", "name", "price"],
      where: {
        companyId: companyId,
      },
      order: [
        ["price", "ASC"],
        ["name", "desc"],
      ],
      limit: 1,
    });

    if (resData.length > 0) {
      return resData[0];
    } else {
      return {
        companyId: companyId,
        name: null,
        minPrice: null,
      };
    }
  } catch (err) {
    console.log("------------ 업체 최소 가격 상품 에러-------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
//업체 찜수 카운트 내부함수
let _companyWishCount = async (res, companyId) => {
  try {
    console.log("------------ 업체 찜수 카운트 ------------");

    // const companyId = req.param("companyId");

    if (!companyId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "companyId 없음.",
      });
      return false;
    }

    // 평균 쿼리
    const resData = await models.MMC_Wish.findAll({
      attributes: [
        ["targetId", "companyId"],
        [models.sequelize.fn("COUNT", models.sequelize.col("*")), "count"],
      ],
      group: "targetId",
      where: {
        type: 1,
        targetId: companyId,
      },
    });

    if (resData.length > 0) {
      return resData[0];
    } else {
      return {
        companyId: companyId,
        count: 0,
      };
    }
  } catch (err) {
    console.log("------------ 업체 찜수 카운트 에러-------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
//업체 리뷰평균 내부함수
let _companyReviewAvg = async (res, companyId) => {
  try {
    console.log("------------ 업체 리뷰 평점 평균 ------------");

    // const companyId = req.param("companyId");

    if (!companyId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "companyId 없음.",
      });
      return false;
    }
    //sequelize.fn('ROUND', sequelize.fn('SUM', sequelize.col('col')),2)
    // 평균 쿼리
    const resData = await models.MMC_Review.findAll({
      attributes: [
        "companyId",

        [
          models.sequelize.fn(
            "ROUND",
            models.sequelize.fn("AVG", models.sequelize.col("point")),
            1
          ),
          "avg",
        ],
        [models.sequelize.fn("COUNT", models.sequelize.col("point")), "count"],
      ],
      group: "companyId",
      where: {
        companyId: companyId,
      },
    });

    if (resData.length > 0) {
      console.log("avg", resData[0].avg);
      return resData[0];
    } else {
      return {
        companyId: companyId,
        avg: "0.0",
        count: 0,
      };
    }
  } catch (err) {
    console.log("------------ 업체 리뷰 평점 평균 에러------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};

// 업체정보 이미지 검색
let companyInfoImg = async (req, res) => {
  try {
    console.log("------------ 업체정보 이미지 검색 ------------");
    let companyId = req.param("companyId");

    if (!companyId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "companyId 없음.",
      });
      return false;
    }

    await models.MMC_AccountCompanyImg.findAll({
      //attributes: [ "id", "email"],asf
      where: {
        type: "com",
        companyId: companyId,
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("companyInfoImg : 검색 된 업체 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "02",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log("companyInfoImg : 검색된 업체정보가 있습니다.");
          res.send({
            success: true,
            resultCode: "00",
            message: "검색완료.",
            list: dataList,
          });
          //조회수 up
          common.viewCount(companyId, null, null, req);
        }
      })
      .catch((err) => {
        console.log("companyInfoImg : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

// 업체정보 리뷰 검색
let companyInfoStyle = async (req, res) => {
  try {
    console.log("------------ 업체정보 리뷰 검색 ------------");
    let companyId = req.param("companyId");
    let sendResult = new Object();

    if (!companyId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "companyId 없음.",
      });
      return false;
    }

    await models.MMC_AccountCompany.findAll({
      //attributes: [ "id", "email"],
      where: {
        id: companyId,
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("companyInfoReview : 검색 된 업체 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "02",
            message: "검색 된 정보가 없습니다.",
          });
          return false;
        } else {
          console.log("companyInfoReview : 검색된 업체정보가 있습니다.");
          sendResult.companyName = dataList[0].name;
        }
      })
      .catch((err) => {
        console.log("companyInfoReview : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
    sendResult.review = await _companyReviewAvg(res, companyId);
    sendResult.wish = await _companyWishCount(res, companyId);

    //이미지 리뷰
    await models.MMC_StyleImg.findAll({
      //attributes: [ "id", "email"],
      where: {
        companyId: companyId,
        imgUrl: {
          [Op.ne]: null,
        },
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("companyInfoReview : 검색 된 업체 정보가 없습니다.");
          //res.send({ success: false, resultCode: '02', message: '검색 된 정보가 없습니다.' });
          sendResult.style = new Array();
        } else {
          console.log("companyInfoReview : 검색된 업체정보가 있습니다.");
          sendResult.style = dataList;
        }
      })
      .catch((err) => {
        console.log("companyInfoReview : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });

    res.send({ success: true, resultCode: "00", data: sendResult });
  } catch (err) {
    console.log(err);
  }
};

//디자이너
let companyWorkers = async (req, res) => {
  try {
    console.log("------------ 업체정보 디자이너 검색 ------------");
    let companyId = req.param("companyId");
    if (!companyId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "companyId 없음.",
      });
      return false;
    }
    try {
      let workerData = await models.MMC_Workers.findAll({
        //attributes: [ "id", "email"],
        where: {
          companyId: companyId,
        },
        raw: true,
      });
      if (workerData.length == 0) {
        console.log("companyWorkers : 검색 된 직원 정보가 없습니다.");
        res.send({
          success: false,
          resultCode: "02",
          message: "검색 된 정보가 없습니다.",
        });
        return false;
      } else {
        console.log("workerData", workerData.length);
        for (let i = 0; i < workerData.length; i++) {
          workerData[i].review = await _designerAvgPoint(res, workerData[i].id);
          workerData[i].wish = await _designerWishCount(res, workerData[i].id);
        }
        res.send({
          success: true,
          resultCode: "00",
          message: "검색완료.",
          list: workerData,
        });
      }
    } catch (err) {
      console.log("companyWorkers : error");
      console.log(err);
      res.send({
        success: false,
        resultCode: "01",
        message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
      });
    }
  } catch (err) {
    console.log("companyWorkers : error");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
//직원 상세 기본 정보
const companyDesignerDetail = async (req, res) => {
  console.log("------------ 직원 상세 기본 정보 ------------");
  const { designerId } = req.query;

  if (!designerId) {
    res.send({
      success: false,
      resultCode: "03",
      message: "designerId 없음.",
    });
    return false;
  }

  try {
    const workerData = await models.MMC_Workers.findAll({
      attributes: [
        "name",
        "position",
        "holiday",
        "context",
        "imgUrl",
        [
          sequelize.literal(
            "(SELECT category FROM MMC_AccountCompany WHERE id = MMC_Workers.companyId)"
          ),
          "categoryId",
        ],
        [
          sequelize.literal(
            "(SELECT name FROM MMC_AccountCompany WHERE id = MMC_Workers.companyId)"
          ),
          "companyName",
        ],
      ],
      where: {
        id: designerId,
      },
      raw: true,
    });
    let workerDetail = workerData[0];
    workerDetail.review = await _designerAvgPoint(res, designerId);
    workerDetail.wish = await _designerWishCount(res, designerId);

    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료.",
      designer: workerDetail,
    });
  } catch (err) {
    console.log("------------ 직원 상세 기본 정보 ERROR------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};

// 직원 상세 스타일
const companyDesignerStyle = async (req, res) => {
  console.log("------------ 직원 상세 스타일 ------------");
  const { designerId } = req.query;

  if (!designerId) {
    res.send({
      success: false,
      resultCode: "03",
      message: "designerId 없음.",
    });
    return false;
  }

  try {
    const workerData = await models.MMC_StyleImg.findAll({
      //attributes: [ "id", "email"],
      where: {
        designerId: designerId,
      },
      raw: true,
    });
    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료.",
      list: workerData,
    });
  } catch (err) {
    console.log("------------ 직원 상세 스타일 ERROR------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};

// 직원 상세 리뷰
const companyDesignerReview = async (req, res) => {
  console.log("------------ 직원 상세 리뷰 ------------");
  const { designerId } = req.query;

  if (!designerId) {
    res.send({
      success: false,
      resultCode: "03",
      message: "designerId 없음.",
    });
    return false;
  }

  try {
    const workerData = await models.MMC_Review.findAll({
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
        [
          sequelize.literal(
            "(SELECT imgUrl FROM MMC_ReviewImg WHERE MMC_ReviewImg.reviewId = MMC_Review.id AND MMC_ReviewImg.deletedAt IS NULL LIMIT 1)"
          ),
          "imgUrl",
        ],
        "point",
        "createdAt",
      ],
      where: {
        designerId: designerId,
      },
      raw: true,
    });

    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료.",
      list: workerData,
    });
  } catch (err) {
    console.log("------------ 직원 상세 리뷰 ERROR------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};

//디자이너 평점 구하기
const _designerAvgPoint = async (res, designerId) => {
  try {
    console.log("------------ 디자이너 리뷰 평점 평균 ------------");

    // const companyId = req.param("companyId");

    if (!designerId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "designerId 없음.",
      });
      return false;
    }
    //sequelize.fn('ROUND', sequelize.fn('SUM', sequelize.col('col')),2)
    // 평균 쿼리
    const resData = await models.MMC_Review.findAll({
      attributes: [
        "designerId",
        [
          models.sequelize.fn(
            "ROUND",
            models.sequelize.fn("AVG", models.sequelize.col("point")),
            1
          ),
          "avg",
        ],
        [models.sequelize.fn("COUNT", models.sequelize.col("point")), "count"],
      ],
      group: "designerId",
      where: {
        designerId: designerId,
      },
    });

    if (resData.length > 0) {
      // console.log("_designerAvgPoint", resData[0]);
      return resData[0];
    } else {
      return {
        designerId: designerId,
        avg: "0.0",
        count: 0,
      };
    }
  } catch (err) {
    console.log("------------ 디자이너 리뷰 평점 평균 에러------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};

//디자이너 찜 카운트
const _designerWishCount = async (res, designerId) => {
  try {
    console.log("------------ 업체 찜수 카운트 ------------");

    // const companyId = req.param("companyId");

    if (!designerId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "designerId 없음.",
      });
      return false;
    }

    // 평균 쿼리
    const resData = await models.MMC_Wish.findAll({
      attributes: [
        ["targetId", "designerId"],
        [models.sequelize.fn("COUNT", models.sequelize.col("*")), "count"],
      ],
      group: "targetId",
      where: {
        type: 2,
        targetId: designerId,
      },
    });

    if (resData.length > 0) {
      return resData[0];
      // res.send({
      //   success: true,
      //   resultCode: "00",
      //   message: "검색완료.",
      //   point: resData[0],
      // });
    } else {
      return {
        designerId: designerId,
        count: 0,
      };
    }
  } catch (err) {
    console.log("------------ 업체 찜수 카운트 에러-------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
// 업체정보 검색
let companyInfo = async (req, res) => {
  try {
    console.log("------------ 업체정보 검색 ------------");
    let companyId = req.param("companyId");

    if (!companyId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "companyId 없음.",
      });
      return false;
    }

    await models.MMC_AccountCompany.findAll({
      //attributes: [ "id", "email"],
      where: {
        id: companyId,
      },
      raw: true,
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("companyInfo : 검색 된 업체 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "02",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log("companyInfo : 검색된 업체정보가 있습니다.");
          res.send({
            success: true,
            resultCode: "00",
            message: "검색완료.",
            list: dataList[0],
          });
        }
      })
      .catch((err) => {
        console.log("companyInfo : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};
// 업체 리뷰 전체 평점
const companyReviewTotalAvg = async (req, res) => {
  console.log("------------ 업체 리뷰 전체 평점 검색 ------------");
  //param 체크
  const companyId = req.param("companyId");
  //validation
  if (!companyId) {
    res.send({
      success: false,
      resultCode: "03",
      message: "companyId 없음.",
    });
    return false;
  }
  //
  try {
    let reviewAvg = {};

    const resData = await models.MMA_GoodsCategory.findAll({
      attributes: [
        "id",
        "categoryId",
        "goodsCategoryName",
        [
          sequelize.literal(
            `IFNULL((SELECT ROUND(AVG(MMC_Review.point),1) as avg FROM MMC_Review WHERE goodsCategoryId = MMA_GoodsCategory.id AND companyId=${companyId} GROUP BY companyId),ROUND(0.0,1))`
          ),
          "avg",
        ],
        [
          sequelize.literal(
            `IFNULL((SELECT COUNT(*) FROM MMC_Review WHERE goodsCategoryId = MMA_GoodsCategory.id AND companyId=${companyId} GROUP BY companyId),0)`
          ),
          "count",
        ],
      ],
      group: "id",
      where: {
        categoryId: sequelize.literal(
          `categoryId = (SELECT category FROM MMC_AccountCompany WHERE id=${companyId})`
        ),
      },
      raw: true,
    });
    // companyId 가 db 가 없을 경우
    reviewAvg.group = resData;
    reviewAvg.total = await _companyReviewAvg(res, companyId);

    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료.",
      list: reviewAvg,
    });
    // console.log(resData);
  } catch (err) {
    console.log("------------ 업체 리뷰 전체 평점 에러 ------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};

//포토리뷰(사진만 있는 리뷰만 별도)
const companyReviewPhoto = async (req, res) => {
  console.log("------------ 업체 포토 리뷰 ------------");
  //param 체크

  const { companyId } = req.query;
  //
  if (!companyId) {
    res.send({
      success: false,
      resultCode: "03",
      message: "companyId 없음.",
    });
    return false;
  }
  //
  try {
    const resData = await models.MMC_Review.findAll({
      attributes: [
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
        [
          sequelize.literal(
            "(SELECT imgUrl FROM MMC_ReviewImg WHERE MMC_ReviewImg.reviewId = MMC_Review.id AND MMC_ReviewImg.deletedAt IS NULL LIMIT 1)"
          ),
          "imgUrl",
        ],
        "point",
        "createdAt",
      ],
      where: sequelize.literal(
        `companyId=${companyId} AND ((SELECT count(*) FROM MMC_ReviewImg WHERE MMC_ReviewImg.reviewId=MMC_Review.id) > 0)`
      ),
      order: [["id", "DESC"]],
      raw: true,
    });
    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료.",
      list: resData,
    });
  } catch (err) {
    console.log("------------ 업체 포토 리뷰 에러 ------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
// 업체리뷰 검색
const companyReview = async (req, res) => {
  try {
    console.log("------------ 업체리뷰 검색 ------------");
    const { companyId, goodsCategoryId } = req.query;

    if (!companyId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "companyId 없음.",
      });
      return false;
    }

    if (!goodsCategoryId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "goodsCategoryId 없음.",
      });
      return false;
    }

    const resData = await models.MMC_Review.findAll({
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
        [
          sequelize.literal(
            "(SELECT imgUrl FROM MMC_ReviewImg WHERE MMC_ReviewImg.reviewId = MMC_Review.id AND MMC_ReviewImg.deletedAt IS NULL LIMIT 1)"
          ),
          "imgUrl",
        ],
        "point",
        "createdAt",
      ],
      where: {
        companyId: companyId,
        goodsCategoryId:
          Number(goodsCategoryId) !== 0
            ? goodsCategoryId
            : {
                [Op.ne]: null,
              },
      },
      order: [["id", "DESC"]],
      raw: true,
    });
    res.send({
      success: true,
      resultCode: "00",
      message: "검색완료.",
      list: resData,
    });
  } catch (err) {
    console.log("------------ 업체 리뷰 검색 에러------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};

//업체 리뷰 상세
let companyReviewDetail = async (req, res) => {
  try {
    console.log("------------ 업체리뷰 상세 검색 ------------");
    let reviewId = req.param("reviewId");

    if (!reviewId) {
      res.send({ success: false, resultCode: "03", message: "reviewId 없음." });
      return false;
    }

    let query = " SELECT ";
    query += " a.*, ";
    query +=
      " (SELECT name FROM MMC_Goods b WHERE a.goodsId = b.id) AS goodsName, ";
    query +=
      " (SELECT NAME FROM MMC_Workers b WHERE a.workId = b.id) AS workerName, ";
    query +=
      " (SELECT NAME FROM MM_Account b WHERE a.accountId = b.id) AS accountName ";
    query += " FROM ";
    query += " MMC_Review a ";
    query += " WHERE ";
    query += " a.id = '" + reviewId + "' ";

    await models.sequelize
      .query(query, {})
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("companyReview : 검색 된 업체 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "02",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log("companyReview : 검색된 업체정보가 있습니다.");
          res.send({ success: true, resultCode: "00", list: dataList[0][0] });
        }
      })
      .catch((err) => {
        console.log("companyReview : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

//미모 스토리 카운트
let _storyCount = async (res, storyId) => {
  try {
    console.log("------------ 미모테레비 카운트 인서트  ------------");
    await models.MM_Count.create({ goodsId: storyId, type: "story" });
  } catch (err) {
    console.log("------------ 미모테레비 카운트 인서트 에러 ------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "03",
      message: "storyId 없음.",
    });
  }
};
//미모스토리
let story = async (req, res) => {
  try {
    console.log("------------ 미모스토리 하나 검색 ------------");
    let storyId = req.param("storyId");
    if (!storyId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "storyId 없음.",
      });
      return false;
    }
    let query = "select ";
    query += " a.*, ";
    query +=
      " (select count(*) as cnt from MM_Count b where b.goodsId = a.id and type = 'story') as cnt ";
    query += " from MMA_Story a ";
    query += " where ";
    query += " a.id = '" + storyId + "'";
    query += " ORDER BY a.createdAt desc ";

    await models.sequelize
      .query(query, {
        //replacements: {
        //	contact_hash: hashPhone,
        //	id: certId
        //}
      })
      .then((dataList) => {
        if (dataList[0].length == 0) {
          console.log("story : 검색 된 story 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "02",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log("story : 검색된 story 정보가 있습니다.");
          _storyCount(res, storyId);
          returnData = dataList[0][0];
          returnData.cnt = returnData.cnt + 1;
          res.send({ success: true, resultCode: "00", list: returnData });
        }
      })
      .catch((err) => {
        console.log("story : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

//미모스토리
let storyList = async (req, res) => {
  try {
    console.log("------------ 미모스토리 검색 ------------");
    let categoryId = req.param("categoryId");
    if (!categoryId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "categoryId 없음.",
      });
      return false;
    }
    let query = "select ";
    query += " a.*, ";
    query +=
      " (select count(*) as cnt from MM_Count b where b.goodsId = a.id and type = 'story') as cnt ";
    query += " from MMA_Story a ";
    // query += " a.id >= 0 ";
    query += " where a.categoryId = '" + categoryId + "'";
    query += " ORDER BY a.createdAt desc ";

    await models.sequelize
      .query(query, {
        //replacements: {
        //	contact_hash: hashPhone,
        //	id: certId
        //}
      })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("storyList : 검색 된 story 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "02",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log("storyList : 검색된 story 정보가 있습니다.");
          res.send({ success: true, resultCode: "00", list: dataList[0] });
        }
      })
      .catch((err) => {
        console.log("storyList : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};
let _tvcount = async (res, tvId) => {
  try {
    console.log("------------ 미모테레비 카운트 인서트  ------------");
    await models.MM_Count.create({ goodsId: tvId, type: "tv" });
  } catch (err) {
    console.log("------------ 미모테레비 카운트 인서트 에러 ------------");
    console.log(err);
    res.send({
      success: false,
      resultCode: "03",
      message: "tvId 없음.",
    });
  }
};
//미모테레비 하나
let tv = async (req, res) => {
  try {
    console.log("------------ 미모테레비 하나 검색 ------------");

    let tvId = req.param("tvId");

    if (!tvId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "tvId 없음.",
      });
      return false;
    }

    let query = "select ";
    query += " a.*, ";
    query +=
      " (select count(*) as cnt from MM_Count b where b.goodsId = a.id and type = 'tv') as cnt ";
    query += " from MMA_TV a ";

    query += "WHERE a.id = '" + tvId + "' AND deletedAt IS NULL";

    query += " ORDER BY a.createdAt desc ";

    await models.sequelize
      .query(query, {
        //replacements: {
        //	contact_hash: hashPhone,
        //	id: certId
        //}
      })
      .then(async (dataList) => {
        console.log(dataList[0].length);
        if (dataList[0].length === 0) {
          console.log("tvList : 검색 된 tv 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "02",
            message: "검색 된 tv 정보가 없습니다.",
          });
        } else {
          console.log("tvList : 검색된 tv 정보가 있습니다.");

          returnData = dataList[0][0];
          returnData.cnt = returnData.cnt + 1;
          // console.log(returnData);
          _tvcount(res, tvId);

          await res.send({
            success: true,
            resultCode: "00",
            list: returnData,
          });
        }
      })
      .catch((err) => {
        console.log("tvList : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};
//미모테레비
let tvList = async (req, res) => {
  try {
    console.log("------------ 미모테레비 검색 ------------");

    let categoryId = req.param("categoryId");

    if (!categoryId) {
      res.send({
        success: false,
        resultCode: "03",
        message: "categoryId 없음.",
      });
      return false;
    }

    let query = "select ";
    query += " a.*, ";
    query +=
      " (select count(*) as cnt from MM_Count b where b.goodsId = a.id and type = 'tv') as cnt ";
    query += " from MMA_TV a ";
    if (categoryId) {
      query += "WHERE a.categoryId = '" + categoryId + "'";
    }
    query += " ORDER BY a.createdAt desc ";

    await models.sequelize
      .query(query, {
        //replacements: {
        //	contact_hash: hashPhone,
        //	id: certId
        //}
      })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("tvList : 검색 된 tv 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "02",
            message: "검색 된 tv 정보가 없습니다.",
          });
        } else {
          console.log("tvList : 검색된 tv 정보가 있습니다.");
          res.send({ success: true, resultCode: "00", list: dataList[0] });
        }
      })
      .catch((err) => {
        console.log("tvList : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

//공지사항리스트
let noticeList = async (req, res) => {
  try {
    console.log("------------ 공지사항리스트 ------------");

    //var companyId = req.app.get('tokenCompanyId');

    await models.MMC_Notice.findAll({
      //attributes: [ "id", "email", "enabled", "name", "contact", "black_yn", "admin_yn", "fcmKey"],
      where: {
        type: 1,
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("noticeList : 검색 된 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "01",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log("noticeList : 검색된 정보가 있습니다.");
          //추후에 여러 업체가 있을지 모르지만 일단 하나만 보내준다.
          res.send({
            success: true,
            resultCode: "00",
            message: "검색완료.",
            list: dataList,
          });
        }
      })
      .catch((err) => {
        console.log("noticeList : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "02",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

//공지사항 검색 단일
let getNotice = async (req, res) => {
  try {
    console.log("------------ 공지사항리스트 ------------");

    //var boardId = req.body.boardId;
    let boardId = req.param("boardId");

    await models.MMC_Notice.findAll({
      //attributes: [ "id", "email", "enabled", "name", "contact", "black_yn", "admin_yn", "fcmKey"],
      where: {
        id: boardId,
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("getNotice[" + boardId + "] : 검색 된 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "01",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log(
            "getNotice[" + boardId + "] : 검색된 업체정보가 있습니다."
          );
          //추후에 여러 업체가 있을지 모르지만 일단 하나만 보내준다.
          res.send({
            success: true,
            resultCode: "00",
            message: "검색완료.",
            list: dataList[0],
          });
        }
      })
      .catch((err) => {
        console.log("getNotice[" + boardId + "] : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "02",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

//자주하는질문리스트
let frequentlyList = async (req, res) => {
  try {
    console.log("------------ 자주하는질문리스트 ------------");

    //var companyId = req.app.get('tokenCompanyId');
    // console.log("frequentlyList req", req);
    let categoryId = req.query.categoryId;

    let query = " ";
    query += " SELECT a.*, ";
    query +=
      " (SELECT name FROM MMC_FrequentlyCategory b WHERE a.categoryId = b.id) AS categoryName ";
    query += " FROM MMC_Frequently a ";
    query += " where a.type = 1 ";
    if (categoryId && categoryId != "" && categoryId > 0) {
      query += "AND a.categoryId = '" + categoryId + "'";
    }

    //await models.MMC_Frequently.findAll({
    //attributes: [ "id", "email", "enabled", "name", "contact", "black_yn", "admin_yn", "fcmKey"],
    //	where: where
    //})
    await models.sequelize
      .query(query, {
        //replacements: {
        //	contact_hash: hashPhone,
        //	id: certId
        //}
      })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("frequentlyList : 검색 된 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "01",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log("frequentlyList : 검색된 자주하는 질문이 있습니다.");
          //추후에 여러 업체가 있을지 모르지만 일단 하나만 보내준다.
          res.send({
            success: true,
            resultCode: "00",
            message: "자주하는 질문 검색완료.",
            list: dataList[0],
          });
        }
      })
      .catch((err) => {
        console.log("frequentlyList : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "02",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

//자주하는질문 검색 단일
let getFrequently = async (req, res) => {
  try {
    console.log("------------ 자주하는질문 검색 단일 ------------");

    //var companyId = req.app.get('tokenCompanyId');
    //var boardId = req.body.boardId;
    let boardId = req.param("boardId");

    let query = " ";
    query += " SELECT a.*, ";
    query +=
      " (SELECT NAME FROM MMC_FrequentlyCategory b WHERE a.categoryId = b.id) AS categoryName ";
    query += " FROM MMC_Frequently a ";
    //query += " where a.companyId = '"+companyId+"'";
    query += " where a.id = '" + boardId + "'";

    //await models.MMC_Frequently.findAll({
    //attributes: [ "id", "email", "enabled", "name", "contact", "black_yn", "admin_yn", "fcmKey"],
    //	where: where
    //})
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
            "getFrequently[" + boardId + "] : 검색 된 정보가 없습니다."
          );
          res.send({
            success: false,
            resultCode: "01",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log(
            "getFrequently[" + boardId + "] : 검색된 업체정보가 있습니다."
          );
          //추후에 여러 업체가 있을지 모르지만 일단 하나만 보내준다.
          res.send({
            success: true,
            resultCode: "00",
            message: "검색완료.",
            list: dataList[0][0],
          });
        }
      })
      .catch((err) => {
        console.log("getFrequently[" + boardId + "] : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "02",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

//1:1 답변 리스트
const inquiryList = async (req, res) => {
  try {
    console.log("api inquiryList");
    const accountId = req.app.get("tokenId");

    const resData = await models.MMC_Inquiry.findAll({
      attributes: [
        "*",
        [
          sequelize.literal("if(MMC_Inquiry.response IS NULL, 'n', 'y')"),
          "response_yn",
        ],
        [
          sequelize.literal(
            "(select name from MMC_FrequentlyCategory c where MMC_Inquiry.categoryId = c.id)"
          ),
          "categoryName",
        ],
        [
          sequelize.literal(
            "(SELECT NAME FROM MM_Account c WHERE MMC_Inquiry.accountId = c.id)"
          ),
          "accountName",
        ],
        [
          sequelize.literal(
            "(SELECT email FROM MM_Account c WHERE MMC_Inquiry.accountId = c.id)"
          ),
          "accountEmail",
        ],
      ],
      where: {
        accountId: accountId,
      },
      raw: true,
    });

    if (resData.length === 0) {
      console.log("inquiryList : 검색 된 정보가 없습니다.");
      res.send({
        success: false,
        resultCode: "01",
        message: "검색 된 정보가 없습니다.",
      });

      return false;
    }

    if (resData[0].length === 0) {
      console.log("inquiryList : 검색 된 정보가 없습니다.");
      res.send({
        success: false,
        resultCode: "01",
        message: "검색 된 정보가 없습니다.",
      });
    } else {
      // console.log("inquiryList : 검색된 정보가 있습니다.");

      for (let i = 0; i < resData.length; i++) {
        const imgList = await models.MMC_InquiryImg.findAll({
          attributes: ["id", "inquiryId", "imgUrl"],
          where: {
            inquiryId: resData[i].id,
          },
          raw: true,
        });
        resData[i].imgData = imgList;
      }

      res.send({
        success: true,
        resultCode: "00",
        message: "검색완료.",
        list: resData,
      });
    }
  } catch (err) {
    console.log("inquiryList : error");
    console.log(err);
  }
};

//1:1문의 등록
let setInquiry = async (req, res) => {
  try {
    console.log("------------ 1:1문의 등록 ------------");

    let upImg = s9.array("files");
    console.log("공지사항 등록 이미지 업로드 시작");
    upImg(req, res, async (err) => {
      // 업로드 실행
      if (err) {
        //이미지 등록 실패
        console.log("setInquiry : 이미지 등록 실패");
        console.log(err);
        console.log(
          "setInquiry : 등록중 문제가 발생하였습니다. 관리자에게 문의하세요."
        );
        res.send({
          success: false,
          resultCode: "01",
          message: "등록중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      } else {
        //if(!req.files){
        //	console.log("setInquiry : 파일 데이터가 없습니다.");
        //	res.send({ success: false, resultCode: '01', message: '등록중 문제가 발생하였습니다. 관리자에게 문의하세요.' });
        //}else{
        //파라메터 받기
        //var companyId = req.body.companyId;
        const categoryId = req.body.categoryId;
        const accountId = req.app.get("tokenId");
        const title = req.body.title;
        const context = req.body.context;
        const files = req.files;

        if (!title || title == "") {
          console.log("setInquiry : 제목이 없습니다.");
          res.send({
            success: false,
            resultCode: "02",
            message: "제목이 없습니다.",
          });
          return false;
        }
        if (!context || context == "") {
          console.log("setInquiry : 내용이 없습니다.");
          res.send({
            success: false,
            resultCode: "03",
            message: "내용이 없습니다.",
          });
          return false;
        }
        if (!categoryId || categoryId == "") {
          console.log("setInquiry : 카테고리가 없습니다.");
          res.send({
            success: false,
            resultCode: "04",
            message: "카테고리가 없습니다.",
          });
          return false;
        }
        if (!accountId || accountId == "") {
          console.log("setInquiry : 회원 아이디가 없습니다.");
          res.send({
            success: false,
            resultCode: "05",
            message: "회원 아이디가 없습니다.",
          });
          return false;
        }
        try {
          const inquiryInsert = await models.MMC_Inquiry.create(
            {
              categoryId: categoryId,
              accountId: accountId,
              title: title,
              context: context,
            },
            { raw: true }
          );
          const inquiryId = inquiryInsert.dataValues.id;
          files.forEach((el) => {
            const imgInsert = models.MMC_InquiryImg.create({
              inquiryId,
              imgUrl: `https://mimo-s3.s3.ap-northeast-2.amazonaws.com/company/notice/${el.key}`,
            });
          });

          res.send({
            success: true,
            resultCode: "00",
            message: "리뷰가 등록 되었습니다",
          });
        } catch (err) {
          console.log("setInquiry에러 ");
          console.log(err);
          res.send({
            success: false,
            resultCode: "01",
            message: "관리자 문의",
          });
        }
      }
    });
  } catch (err) {
    console.log(err);
  }
};

//카테고리 검색 리스트
let subCategory = async (req, res) => {
  try {
    console.log("------------ 카테고리 검색 리스트 ------------");

    //var boardId = req.body.boardId;
    //var boardId = req.param('boardId');

    await models.MMC_FrequentlyCategory.findAll({
      attributes: ["id", "name"],
      where: {
        deletedAt: { [Op.eq]: null },
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("subCategory : 검색 된 정보가 없습니다.");
          res.send({
            success: false,
            resultCode: "01",
            message: "검색 된 정보가 없습니다.",
          });
        } else {
          console.log("subCategory : 검색된 정보가 있습니다.");
          res.send({
            success: true,
            resultCode: "00",
            message: "검색완료.",
            list: dataList,
          });
        }
      })
      .catch((err) => {
        console.log("subCategory : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "02",
          message: "검색중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

//조회수 카운트
let addCount = async (req, res) => {
  try {
    let companyId = req.param("companyId");
    let goodsId = req.param("id");
    let type = req.param("type");

    if (!companyId) {
      companyId = null;
    }
    if (!goodsId) {
      goodsId = null;
    }
    if (!type) {
      type = null;
    }

    //회사아이디, 상품아이디, 타입
    common.viewCount(companyId, goodsId, type, req);

    res.send({ success: true, resultCode: "00" });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  surround,
  companyInfoImg,
  companyInfoStyle,
  companyWorkers,
  companyDesignerDetail,
  companyDesignerStyle,
  companyDesignerReview,
  companyReviewTotalAvg,
  companyReviewPhoto,
  _companyReviewAvg,
  _companyWishCount,
  _companyMinGoods,
  _designerAvgPoint,
  _designerWishCount,
  companyInfo,
  companyReview,
  companyReviewDetail,
  storyList,
  tvList,
  addCount,
  noticeList,
  //getNotice: getNotice,
  frequentlyList,
  //getFrequently: getFrequently,
  inquiryList,
  setInquiry,
  subCategory,
  story,
  tv,
};
