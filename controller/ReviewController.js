var models = require("../models");
var common = require("./Common");
var sha256 = require("sha256");
const jwt = require("jsonwebtoken");
var moment = require("moment");
var request = require("request");
var validator = require("validator");
const s8 = require("../routes/s8");
const sequelize = require("sequelize");
const companyController = require("./CompanyController");
const Op = sequelize.Op;

//작성 가능한 리뷰
const getPossilbleReview = async (req, res) => {
  console.log("-----  작성 가능한 리뷰  ----");
  // console.log("req.body", req.body);
  const accountId = req.app.get("tokenId");
  if (!accountId) {
    res.send({
      success: false,
      resultCode: "02",
      message: "accountId 없음.",
    });
    return false;
  }
  try {
    const resData = await models.MM_Order.findAll({
      attributes: [
        "id",
        "reservationName",
        "reservationPhone",
        "goodsPrice",
        "optionPrice",
        "sale",
        "totalPrice",
        "accountCancel",
        [
          sequelize.literal(
            "(SELECT name FROM MMC_Goods WHERE MMC_Goods.id = MM_Order.goodsId )"
          ),
          "goodsName",
        ],
        [
          sequelize.literal(
            "(SELECT imgUrl FROM MMC_GoodsImg WHERE MMC_GoodsImg.goodsId = MM_Order.goodsId AND MMC_GoodsImg.deletedAt is null LIMIT 1)"
          ),
          "goodsImg",
        ],
        [
          sequelize.literal(
            "(SELECT name FROM MMC_AccountCompany WHERE MMC_AccountCompany.id = MM_Order.companyId )"
          ),
          "companyName",
        ],
        [
          sequelize.literal(
            "(SELECT reservationTime FROM MM_Reservation WHERE MM_Reservation.orderId = MM_Order.orderId )"
          ),
          "reservationTime",
        ],
        [
          sequelize.literal(
            "(SELECT reservationTime FROM MM_Reservation WHERE MM_Reservation.orderId = MM_Order.orderId )"
          ),
          "reservationTime",
        ],
      ],
      where: sequelize.literal(
        `(SELECT reservationTime FROM MM_Reservation WHERE MM_Reservation.orderId = MM_Order.orderId ) < now() AND DATE_ADD((SELECT reservationTime FROM MM_Reservation WHERE MM_Reservation.orderId = MM_Order.orderId ), INTERVAL 72 HOUR) > now() AND accountId=${accountId} AND reviewId IS NULL AND accountCancel = 'n'`
      ),
      order: [["id", "desc"]],
      raw: true,
    });

    res.send({
      success: true,
      resultCode: "00",
      message: "작성가능한 리뷰 검색완료",
      list: resData,
    });
  } catch (err) {
    console.log("----- 작성 가능한 리뷰  : error ----");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};
//작성 가능한 리뷰 상세
const getPossibleReviewDetail = async (req, res) => {
  console.log("-----  작성 가능한 리뷰 상세----");
  // console.log("req.body", req.body);
  // console.log(req.params);
  const { orderId } = req.params;
  const accountId = req.app.get("tokenId");
  if (!orderId) {
    res.send({
      success: false,
      resultCode: "02",
      message: "orderId 없음.",
    });
    return false;
  }
  if (!accountId) {
    res.send({
      success: false,
      resultCode: "02",
      message: "accountId 없음.",
    });
    return false;
  }
  try {
    const resData = await models.MM_Order.findAll({
      attributes: [
        "id",
        "reservationName",
        "reservationPhone",
        "goodsPrice",
        "optionPrice",
        "sale",
        "totalPrice",
        "accountCancel",
        [
          sequelize.literal(
            "(SELECT name FROM MMC_Goods WHERE MMC_Goods.id = MM_Order.goodsId )"
          ),
          "goodsName",
        ],
        [
          sequelize.literal(
            "(SELECT imgUrl FROM MMC_GoodsImg WHERE MMC_GoodsImg.goodsId = MM_Order.goodsId AND MMC_GoodsImg.deletedAt is null LIMIT 1)"
          ),
          "goodsImg",
        ],
        [
          sequelize.literal(
            "(SELECT name FROM MMC_AccountCompany WHERE MMC_AccountCompany.id = MM_Order.companyId )"
          ),
          "companyName",
        ],
        [
          sequelize.literal(
            "(SELECT reservationTime FROM MM_Reservation WHERE MM_Reservation.orderId = MM_Order.orderId )"
          ),
          "reservationTime",
        ],
        [
          sequelize.literal(
            "(SELECT reservationTime FROM MM_Reservation WHERE MM_Reservation.orderId = MM_Order.orderId )"
          ),
          "reservationTime",
        ],
      ],
      where: sequelize.literal(
        `(SELECT reservationTime FROM MM_Reservation WHERE MM_Reservation.orderId = MM_Order.orderId ) < now() AND accountId=${accountId} AND reviewId IS NULL AND id=${orderId}`
      ),
      order: [["id", "desc"]],
      raw: true,
    });
    if (resData.length > 0) {
      res.send({
        success: true,
        resultCode: "00",
        message: "작성가능한 리뷰 상세 검색완료",
        list: resData[0],
      });
    } else {
      res.send({
        success: false,
        resultCode: "00",
        message: "작성가능한 리뷰 상세가 없습니다.",
      });
    }
  } catch (err) {
    console.log("----- 작성 가능한 리뷰 상세  : error ----");
    console.log(err);
    res.send({
      success: false,
      resultCode: "01",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};

//작성 완료한 리뷰
const getCompleteReview = async (req, res) => {
  console.log("-----  작성 완료한 리뷰 ----");
  // console.log("req.body", req.body);
  const accountId = req.app.get("tokenId");
  if (!accountId) {
    res.send({
      success: false,
      resultCode: "05",
      message: "accountId 없음.",
    });
    return false;
  }
  try {
    const resData = await models.MM_Order.findAll({
      attributes: [
        "id",
        "reservationName",
        "reservationPhone",
        "goodsPrice",
        "optionPrice",
        "sale",
        "totalPrice",
        "accountCancel",
        [sequelize.col("MMC_Review.id"), "reviewId"],
        [sequelize.col("MMC_Review.createdAt"), "reviewCreatedAt"],
        [sequelize.col("MMC_Review.point"), "point"],
        [sequelize.col("MMC_Review.imgUrl"), "imgUrl"],
        [sequelize.col("MMC_Review.context"), "context"],
        [
          sequelize.literal(
            "(SELECT name FROM MMC_Workers WHERE MMC_Workers.id = MM_Order.workId )"
          ),
          "designerName",
        ],
        [
          sequelize.literal(
            "(SELECT name FROM MMC_Goods WHERE MMC_Goods.id = MM_Order.goodsId )"
          ),
          "goodsName",
        ],
        [
          sequelize.literal(
            "(SELECT imgUrl FROM MMC_ReviewImg WHERE MMC_ReviewImg.reviewId = MM_Order.reviewId AND MMC_ReviewImg.deletedAt is null LIMIT 1)"
          ),
          "goodsImg",
        ],
        [
          sequelize.literal(
            "(SELECT name FROM MMC_AccountCompany WHERE MMC_AccountCompany.id = MM_Order.companyId )"
          ),
          "companyName",
        ],
        [
          sequelize.literal(
            "(SELECT reservationTime FROM MM_Reservation WHERE MM_Reservation.orderId = MM_Order.orderId )"
          ),
          "reservationTime",
        ],
        [
          sequelize.literal(
            "(SELECT reservationTime FROM MM_Reservation WHERE MM_Reservation.orderId = MM_Order.orderId )"
          ),
          "reservationTime",
        ],
      ],
      where: sequelize.literal(
        `MM_Order.accountId=${accountId} AND MM_Order.reviewId IS NOT NULL AND MMC_Review.id IS NOT NULL`
      ),
      include: [
        {
          model: models.MMC_Review,
          require: false,
          attributes: [],
        },
      ],
      order: [["id", "desc"]],
      raw: true,
    });

    res.send({
      success: true,
      resultCode: "05",
      message: "작성 완료한 목록 검색 완료",
      list: resData,
    });
  } catch (err) {
    console.log("----- 작성 완료한 리뷰  : error ----");
    console.log(err);
    res.send({
      success: false,
      resultCode: "04",
      message: "문제가 발생하였습니다. 관리자에게 문의하세요.",
    });
  }
};

//리뷰 작성
const setReview = async (req, res) => {
  /**
   * 로직 정리
   * 1.multer에서 이미지 업로드 후 MM_Order 에서 id 정보 조회
   * 2.MMC_Review에 정보 insert
   * 3.MMC_ReviewImg에 Table file 경로 insert (MMC_Review에 id 필요)
   * 4.MM_Order에 reviewId 업데이트
   */
  const upImg = s8.array("imageData");
  upImg(req, res, async (err) => {
    if (err) {
      //이미지 등록 실패
      console.log("setInquiry : 리뷰 이미지 등록 실패");
      console.log(err);
      console.log(
        "setInquiry : 등록중 문제가 발생하였습니다. 관리자에게 문의하세요."
      );
      res.send({
        success: false,
        resultCode: "-1",
        message: "등록중 문제가 발생하였습니다. 관리자에게 문의하세요.",
      });
    } else {
      const orderId = req.body.orderId;
      const accountId = req.app.get("tokenId");
      const point = req.body.point;
      const context = req.body.context;
      const imageData = req.files;

      try {
        // 1.multer에서 이미지 업로드 후 MM_Order 에서 id 정보 조회
        // order 체크
        const resData = await models.MM_Order.findAll({
          where: {
            id: orderId,
            accountId: accountId,
          },
          raw: true,
        });
        // 없으면 에러
        if (resData.length === 0) {
          res.send({
            success: false,
            resultCode: "-3",
            message: "등록중 문제가 발생하였습니다. 관리자에게 문의하세요.",
          });
          return false;
        }
        //추가 데이터 정리
        const companyId = resData[0].companyId;
        const goodsId = resData[0].goodsId;
        const categoryId = resData[0].categoryId;
        const goodsCategoryId = resData[0].goodsCategoryId;
        const designerId = resData[0].workId;

        //2.MMC_Review에 정보 insert
        const reviewInsert = await models.MMC_Review.create(
          {
            accountId,
            companyId,
            goodsId,
            categoryId,
            goodsCategoryId,
            designerId,
            orderId,
            context,
            point,
            imgUrl:
              imageData.length > 0
                ? `https://mimo-s3.s3.ap-northeast-2.amazonaws.com/company/review/${imageData[0].key}`
                : null,
          },
          { raw: true }
        );

        //3.MMC_ReviewImg에 Table file 경로 insert (MMC_Review에 id 필요)
        // review Id
        const reviewId = reviewInsert.dataValues.id;

        imageData.forEach((el) => {
          models.MMC_ReviewImg.create({
            reviewId,
            imgUrl: `https://mimo-s3.s3.ap-northeast-2.amazonaws.com/company/review/${el.key}`,
          });
        });

        const updateResult = await models.MM_Order.update(
          {
            reviewId: reviewId,
          },
          {
            where: { id: orderId },
          }
        );

        res.send({
          success: true,
          resultCode: "00",
          message: "리뷰가 등록되었습니다.",
        });
      } catch (err) {
        res.send({
          success: false,
          resultCode: "-2",
          message: "등록중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      }
    }
  });
};

//리뷰 수정
const modifyReview = async (req, res) => {
  /**
   * 로직 정리
   * 1.multer에서 업로드 이미지 정보 확인
   * 2.추가된 이미지 있다면 MMC_ReviewImg에 Table file 에 insert
   * 3.기존 이미지가 삭제 요청되었다면 기존이미지 삭제
   * 4.MMC_Review에 수정 정보 업데이트
   */
  const upImg = s8.array("imageData");
  //1.multer에서 업로드 이미지 정보 확인
  upImg(req, res, async (err) => {
    if (err) {
      //이미지 등록 실패
      console.log("리뷰 수정 : 리뷰 이미지 등록 실패");
      console.log(err);
      console.log(
        "리뷰 수정 : 등록중 문제가 발생하였습니다. 관리자에게 문의하세요."
      );
      res.send({
        success: false,
        resultCode: "-1",
        message: "등록중 문제가 발생하였습니다. 관리자에게 문의하세요.",
      });
    } else {
      const reviewId = req.body.reviewId;
      // const accountId = req.app.get("tokenId");
      const point = req.body.point;
      const context = req.body.context;
      const oldImage = req.body.oldImage;

      const imageData = req.files;

      try {
        //2.추가된 이미지 있다면 MMC_ReviewImg에 Table file 에 insert
        imageData.forEach((el) => {
          models.MMC_ReviewImg.create({
            reviewId,
            imgUrl: `https://mimo-s3.s3.ap-northeast-2.amazonaws.com/company/review/${el.key}`,
          });
        });

        //3.기존 이미지가 삭제 요청되었다면 기존이미지 삭제
        const imgList = await models.MMC_ReviewImg.destroy({
          where: {
            reviewId: reviewId,

            id: { [Op.notIn]: oldImage !== undefined ? oldImage : [] },
          },
          raw: true,
        });
        //4.MMC_Review에 수정 정보 업데이트
        const updateResult = await models.MMC_Review.update(
          {
            point,
            context,
          },
          {
            where: { id: reviewId },
          }
        );
        if (updateResult === 1) {
          res.send({
            success: true,
            resultCode: "00",
            message: "리뷰가 수정되었습니다.",
          });
        } else {
          res.send({
            success: true,
            resultCode: "-01",
            message: "리뷰가 수정이 실패했습니다.",
          });
        }
      } catch (err) {
        //리뷰 수정 실패
        console.log("리뷰 수정 : 실패");
        console.log(err);
        res.send({
          success: false,
          resultCode: "-1",
          message: "등록중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      }
    }
  });
};

// 리뷰 수정 정보
const getModifyReviewDetail = async (req, res) => {
  const { reviewId } = req.params;

  const accountId = req.app.get("tokenId");
  //리뷰 검색
  const getReviewData = await models.MMC_Review.findAll({
    where: {
      id: reviewId,
      accountId: accountId,
    },
    raw: true,
  });
  // console.log("getReviewData : 리뷰 검색", getReviewData);
  //
  if (getReviewData.length === 0) {
    res.send({
      success: false,
      resultCode: "-1",
      message: "검색된 리뷰가 없습니다.",
    });
    return false;
  }
  //
  const getOrderData = await models.MM_Order.findAll({
    attributes: [
      ["id", "orderId"],
      "reservationName",
      "reservationPhone",
      "goodsPrice",
      "optionPrice",
      "sale",
      "totalPrice",
      "accountCancel",
      [
        sequelize.literal(
          "(SELECT name FROM MMC_Goods WHERE MMC_Goods.id = MM_Order.goodsId )"
        ),
        "goodsName",
      ],
      [
        sequelize.literal(
          "(SELECT imgUrl FROM MMC_GoodsImg WHERE MMC_GoodsImg.goodsId = MM_Order.goodsId AND MMC_GoodsImg.deletedAt is null LIMIT 1)"
        ),
        "goodsImg",
      ],
      [
        sequelize.literal(
          "(SELECT name FROM MMC_AccountCompany WHERE MMC_AccountCompany.id = MM_Order.companyId )"
        ),
        "companyName",
      ],
      [
        sequelize.literal(
          "(SELECT reservationTime FROM MM_Reservation WHERE MM_Reservation.orderId = MM_Order.orderId )"
        ),
        "reservationTime",
      ],
      [
        sequelize.literal(
          "(SELECT reservationTime FROM MM_Reservation WHERE MM_Reservation.orderId = MM_Order.orderId )"
        ),
        "reservationTime",
      ],
    ],
    where: {
      reviewId: reviewId,
    },
    raw: true,
  });

  if (getOrderData.length === 0) {
    res.send({
      success: false,
      resultCode: "-2",
      message: "검색된 리뷰에 대한 주문이 없습니다.",
    });
    return false;
  }

  res.send({
    success: true,
    resultCode: "00",
    message: "리뷰 검색 완료",
    info: { ...getReviewData[0], ...getOrderData[0] },
  });
};

const getImgList = async (req, res) => {
  const { reviewId } = req.query;

  if (!reviewId) {
    res.send({
      success: false,
      resultCode: "-2",
      message: "reviewId가 없습니다.",
    });
    return;
  }
  //
  const resData = await models.MMC_ReviewImg.findAll({
    attributes: ["id", "reviewId", "imgUrl"],
    where: {
      reviewId: reviewId,
    },
  });
  //
  if (resData.length === 0) {
    res.send({
      success: false,
      resultCode: "-3",
      message: "검색된 리뷰 이미지가 없습니다.",
    });
    return;
  }
  //
  res.send({
    success: true,
    resultCode: "00",
    message: "검색된 리뷰 이미지가 있습니다.",
    imgData: resData,
  });
};
module.exports = {
  getPossilbleReview,
  getPossibleReviewDetail,
  modifyReview,
  getModifyReviewDetail,
  getCompleteReview,
  setReview,
  getImgList,
};
