var express = require("express");
var router = express.Router();
const IndexController = require("../controller");
const AccountController = require("../controller/AccountController");
const TokenController = require("../controller/TokenController");
const CompanyController = require("../controller/CompanyController");
const GoodsController = require("../controller/GoodsController");
const OrderController = require("../controller/OrderController");
const NormalMemberController = require("../controller/NormalMemberController");
const CeoController = require("../controller/CeoController");
const MainController = require("../controller/MainController");
const WishController = require("../controller/WishController");
const ReviewController = require("../controller/ReviewController");
const SearchController = require("../controller/SearchController");
const SignInController = require("../controller/SignInController");

//토큰 확인 하기 위한 미들 웨어
const { verifyToken } = require("./middlewares/authorization");

//
const s3 = require("./s3");
//

//console.log(controller);

/* GET home page. */
router.get("/", IndexController.index);

//회원가입 start ----------------------
//중복 이메일 체크
router.post("/account/signUpCheckEmail", AccountController.signUpCheckEmail);
//회원가입
router.post("/account/signUp", AccountController.signUp);
//로그인
router.post("/account/signIn", SignInController.signIn);
//아아디 찾기
router.post("/account/findId", AccountController.findId);
//비밀번호 수정
router.post("/account/updatePassword", AccountController.updatePassword);
//회원정보 수정(비밀번호체크)
router.post(
  "/account/checkPassword",
  verifyToken,
  AccountController.checkPassword
);
//회원 수정
router.post(
  "/account/modifyMember",
  verifyToken,
  AccountController.modifyMember
);

router.get("/account/getAccount", verifyToken, AccountController.getAccount);

//회원가입 end ----------------------

//토큰 start ----------------------
//토큰 재발급
router.post("/retoken", TokenController.retoken);
//토큰 end ----------------------

//메인
//메인화면
router.get("/mainList", MainController.mainList);
router.get("/mainBannerDetail", MainController.bannerDetail);
router.get("/mainQueenList", MainController.mainQueenList);
router.get("/mainQueenDetail", MainController.mimoReviewDetail);
router.get("/mainPremiumList", MainController.mainPremiumList);
router.get("/mainCompanyList", MainController.mainCompanyList);

//일반회원 start
//일반회원 list
router.get(
  "/member/getMemberList",
  verifyToken,
  NormalMemberController.getMemberList
);
//일반회원 상세검색
router.get(
  "/member/getMemberDetail",
  verifyToken,
  NormalMemberController.getMemberDetail
);

//일반회원 탈퇴
router.post(
  "/member/deleteMember",
  verifyToken,
  NormalMemberController.deleteMember
);

//일반회원 end

//사장님 start
//사장님 리스트
router.get("/ceo/getCeoList", verifyToken, CeoController.getCeoList);
//사장님 상세
router.get("/ceo/getCeoDetail", verifyToken, CeoController.getCeoDetail);
//사장님 수정
router.post("/ceo/modifyCeo", verifyToken, CeoController.modifyCeo);
//사장님 탈퇴(삭제)
router.post("/ceo/deleteCeo", verifyToken, CeoController.deleteCeo);

//사장님 end

//업체 start ----------------------

//주변 업체
router.get("/company/surround", CompanyController.surround);
router.get("/company/companyInfoImg", CompanyController.companyInfoImg);
//업체 이미지
router.get("/company/companyInfoImg", CompanyController.companyInfoImg);

//업체 간략 정보 및 리뷰
router.get("/company/companyInfoStyle", CompanyController.companyInfoStyle);

//직원
router.get("/company/companyWorkers", CompanyController.companyWorkers);
//직원 상세 기본 정보
router.get(
  "/company/companyDesignerDetail",
  CompanyController.companyDesignerDetail
);
//직원 상세 스타일
router.get(
  "/company/companyDesignerStyle",
  CompanyController.companyDesignerStyle
);
//직원 상세 리뷰
router.get(
  "/company/companyDesignerReview",
  CompanyController.companyDesignerReview
);

//업체정보
router.get("/company/companyInfo", CompanyController.companyInfo);

//업체 리뷰
router.get("/company/companyReview", CompanyController.companyReview);
//업체 리뷰 사진있는것만
router.get("/company/companyReviewPhoto", CompanyController.companyReviewPhoto);
//업체 리뷰 전체 평점
router.get(
  "/company/companyReviewTotalAvg",
  CompanyController.companyReviewTotalAvg
);
//업체 리뷰 상세
router.get(
  "/company/companyReviewDetail",
  CompanyController.companyReviewDetail
);

//미모스토리
router.get("/company/storyList", CompanyController.storyList);
//미모테레비
router.get("/company/tvList", CompanyController.tvList);
//미모스토리
router.get("/company/story", CompanyController.story);
//미모테레비
router.get("/company/tv", CompanyController.tv);

//공지사항 리스트
router.get("/company/noticeList", CompanyController.noticeList);
//자주하는질문 리스트
router.get("/company/frequentlyList", CompanyController.frequentlyList);
//1:1 문의 등록
router.post("/company/setInquiry", verifyToken, CompanyController.setInquiry);
//1:1 문의 리스트
router.get("/company/inquiryList", verifyToken, CompanyController.inquiryList);
//1:1 및 자주하는 질문 카테고리
router.get("/company/subCategory", CompanyController.subCategory);

//업체 end ----------------------

//상품 start ----------------------

//상품리스트
router.get("/goods/goodsList", GoodsController.goodsList);
//상품상세
router.get("/goods/goodsDetail", GoodsController.goodsDetail);
//상품상세
router.get("/goods/reviews", GoodsController.goodsReviews);

//상품 end ----------------------

//주문 start ----------------------
//주문하기
router.post("/order/setOrder", verifyToken, OrderController.setOrder);
//주문 리스트
router.get("/order/orderList", verifyToken, OrderController.orderList);
//주문 검색
router.get("/order/getOrder", verifyToken, OrderController.getOrder);
//주문 화면
router.get("/order/orderAccountView", OrderController.orderAccountView);
//고객 주문 취소
router.post("/order/cancelOrder", verifyToken, OrderController.cancelOrder);
//주문 취소검색
router.get(
  "/order/cancelOrderList",
  verifyToken,
  OrderController.cancelOrderList
);

//주문 end ----------------------

//찜 start ----------------------
//찜 체크
router.get("/wish/check", verifyToken, WishController.checkWish);
//내 찜 리스트
router.get("/wish", verifyToken, WishController.getWish);
//찜 등록
router.post("/wish", verifyToken, WishController.setWish);
//찜 삭제
router.delete("/wish", verifyToken, WishController.deleteWish);
//찜 end ----------------------

// -------- 리뷰 Start ---------

// 리뷰 작성 가능한 목록
router.get(
  "/review/possible",
  verifyToken,
  ReviewController.getPossilbleReview
);
// 리뷰 작성 가능한 목록 상세
router.get(
  "/review/possible/:orderId",
  verifyToken,
  ReviewController.getPossibleReviewDetail
);

// 리뷰 작성 하기
router.post("/review/possible", verifyToken, ReviewController.setReview);

// 리뷰 작성 완료한 목록
router.get("/review/complete", verifyToken, ReviewController.getCompleteReview);

// 리뷰 수정 상세 정보
router.get(
  "/review/complete/:reviewId",
  verifyToken,
  ReviewController.getModifyReviewDetail
);

// 리뷰 수정 하기
router.post("/review/complete", verifyToken, ReviewController.modifyReview);

// 리뷰 이미지 리스트 가져오기
router.get("/review/img", verifyToken, ReviewController.getImgList);

// -------- 리뷰 End ---------

//조회수 카운트
router.get("/company/addCount", CompanyController.addCount);
//조회수 카운트
// router.get("/test", MainController.todayBest);

//검색
router.get("/search", SearchController.search);

module.exports = router;
