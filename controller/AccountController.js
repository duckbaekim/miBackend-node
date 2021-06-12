var models = require("../models");
var common = require("./Common");
var sha256 = require("sha256");
const jwt = require("jsonwebtoken");
var moment = require("moment");
var request = require("request");
var validator = require("validator");
const s3 = require("../routes/s3");
const sequelize = require("sequelize");
const Op = sequelize.Op;

//const curl = new (require( 'curl-request' ))();

function setLog(req, string) {
  var os = req.headers.os;
  var device = req.headers.device;

  var now = moment().format("YYYY-MM-DD");
  //getBrand | getDeviceType | getDeviceName | getModel | getVersion | getBuildNumber
  console.log(now + " - " + string);
}

// 중복 이메일 체크
let signUpCheckEmail = async (req, res) => {
  try {
    console.log("------------ 중복 이메일 체크 ------------");
    var email = req.body.email;

    if (!email || email == "") {
      console.log("signUpCheckEmail : email 값이 없습니다.");
      res.send({
        success: false,
        resultCode: "04",
        message: "email 값이 없습니다.",
      });
      return false;
    }

    //중복 체크
    await models.MM_Account.findAll({
      attributes: ["id", "accountType"],
      where: {
        email: email,
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          //이메일 유효성 검사 체크
          if (validator.isEmail(email)) {
            console.log(
              "signUpCheckEmail[" + email + "] : 사용 가능한 email 입니다."
            );
            res.send({
              success: true,
              resultCode: "00",
              message: "사용 가능한 email 입니다.",
            });
          } else {
            console.log(
              "signUpCheckEmail[" +
                email +
                "] : email 형식이 올바르지 않습니다."
            );
            res.send({
              success: false,
              resultCode: "01",
              message: "email 형식이 올바르지 않습니다.",
            });
          }
        } else {
          console.log(
            "signUpCheckEmail[" + email + "] : 사용 할수 없는 email 입니다."
          );
          res.send({
            success: false,
            resultCode: "02",
            message: `${_returnLoginText(
              dataList[0].accountType
            )}로 가입된 이메일입니다.`,
          });
          return false;
        }
      })
      .catch((err) => {
        console.log("signUpCheckEmail[" + email + "] : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "03",
          message: "중복 검사중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

// 회원 가입
let signUp = async (req, res) => {
  try {
    console.log("------------ 회원가입 ------------");
    const email = req.body.email;

    const name = req.body.name;
    const accountType = req.body.accountType;
    const fcmKey = req.headers.fcmKey;
    const socialUID = req.body.socialUID;
    const password = req.body.password;

    console.log("fcmKey", fcmKey);
    // var name = req.body.name;
    // var contact = req.body.contact;

    let passwordHash = "";
    // var contachHash = "";
    let checkEmail;

    if (!email || email == "") {
      console.log("signUp : email 값이 없습니다.");
      res.send({
        success: false,
        resultCode: "01",
        message: "email 값이 없습니다.",
      });
      return false;
    }

    if (!name || name == "") {
      console.log("signUp : name 값이 없습니다.");
      res.send({
        success: false,
        resultCode: "03",
        message: "이름 값이 없습니다.",
      });
      return false;
    }

    if (!accountType || accountType == "") {
      console.log("signUp : accountType 값이 없습니다.");
      res.send({
        success: false,
        resultCode: "03",
        message: "가입 유형이 없습니다.",
      });
      return false;
    }

    if (accountType === "EMAIL") {
      if (!password || password == "") {
        console.log("signUp : password 값이 없습니다.");
        res.send({
          success: false,
          resultCode: "02",
          message: "비밀번호 값이 없습니다.",
        });
        return false;
      }
      passwordHash = await common.enCrypto(password, req);
    } else {
      if (!socialUID || socialUID == "") {
        console.log("signUp : socialUID 값이 없습니다.");
        res.send({
          success: false,
          resultCode: "02",
          message: "소셜 로그인 아이디가 없습니다.",
        });
        return false;
      }
    }

    //비밀번호 암호화

    //전화번호 암호화
    // contachHash = await common.enCrypto(contact, req);

    //중복체크
    //중복 체크
    await models.MM_Account.findAll({
      attributes: ["id", "accountType"],
      where: {
        email: email,
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          //이메일 유효성 검사 체크
          if (validator.isEmail(email)) {
            // 저장
            console.log("signUp[" + email + "] : 회원가입 저장 시작.");
            models.MM_Account.create(
              {
                email: email,
                accountType: accountType,
                password: accountType === "EMAIL" ? passwordHash : null,
                socialUID: accountType === "EMAIL" ? null : socialUID,
                name: name,
                fcmKey: fcmKey === "null" || !fcmKey ? null : fcmKey,
                // contact: contachHash,
                // fcmKey: fcmKey,
              },
              {
                omitNull: false,
              }
            )
              .then((resulta) => {
                console.log("signUp[" + email + "] : 회원가입 저장 성공.");
                res.send({ success: true, message: "회원가입 저장 성공." });
              })
              .catch((err) => {
                console.log("signUp[" + email + "] : 회원가입 저장 실패");
                console.log(err);
                res.send({
                  success: false,
                  resultCode: "06",
                  message:
                    "처리중 문제가 발생하였습니다. 관리자에게 문의하세요.",
                });
              });
          } else {
            console.log(
              "signUp[" + email + "] : email 형식이 올바르지 않습니다."
            );
            res.send({
              success: false,
              resultCode: "08",
              message: "email 형식이 올바르지 않습니다.",
            });
            return false;
          }
        } else {
          console.log("signUp[" + email + "] : 사용 할수 없는 이메일 입니다.");
          res.send({
            success: false,
            resultCode: "09",
            message: `${_returnLoginText(
              dataList[0].accountType
            )}로 가입된 이메일입니다.`,
          });
          return false;
        }
      })
      .catch((err) => {
        console.log("signUp[" + email + "] : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "06",
          message: "처리중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
        return false;
      });
  } catch (err) {
    console.log(err);
  }
};

// // 로그인
// let signIn = async (req, res) => {
//   try {
//     console.log("------------ 로그인 ------------");
//     //설정한 시크릿값 가져오기
//     const secret = req.app.get("jwt-secret");
//     //전달받은 파라메터
//     const accountType = req.body.accoutType;
//     const email = req.body.email;
//     // const password = req.body.password;

//     if (!accountType || accountType == "") {
//       console.log("signIn : accountType 값이 없습니다.");
//       res.send({
//         success: false,
//         resultCode: "01",
//         message: "accountType 값이 없습니다.",
//       });
//       return false;
//     }
//     // console.log("fcmKey", fcmKey);
//     if (!email || email == "") {
//       console.log("signIn : email 값이 없습니다.");
//       res.send({
//         success: false,
//         resultCode: "01",
//         message: "email 값이 없습니다.",
//       });
//       return false;
//     }
//     // if (!password || password == "") {
//     //   console.log("signIn : password 값이 없습니다.");
//     //   res.send({
//     //     success: false,
//     //     resultCode: "02",
//     //     message: "비밀번호 값이 없습니다.",
//     //   });
//     //   return false;
//     // }

//     // let passwordHash = "";
//     // // var contachHash = "";

//     // //비밀번호 암호화
//     // passwordHash = common.enCrypto(password, req);

//     // //로그인 체크
//     // await models.MM_Account.findAll({
//     //   attributes: ["id", "name", "contact", "black_yn"],
//     //   where: {
//     //     email: email,
//     //     password: passwordHash,
//     //   },
//     // })
//     //   .then(async (dataList) => {
//     //     if (dataList.length == 0) {
//     //       console.log(
//     //         "signIn[" + email + "] : 아이디와 비밀번호를 확인해주세요."
//     //       );
//     //       res.send({
//     //         success: false,
//     //         resultCode: "04",
//     //         message: "아이디와 비밀번호를 확인해주세요.",
//     //       });
//     //     } else {
//     //       //MM_Account 에서 회원 검색 성공, 토큰 발행
//     //       console.log(
//     //         "signIn[" + email + "] : MM_Account 에서 회원 검색 성공."
//     //       );
//     //       console.log("signIn[" + email + "] : 회원 블랙여부.");
//     //       if (dataList[0].black_yn == "y") {
//     //         console.log("signIn[" + email + "] : 회원 블랙 회원.");
//     //         res.send({
//     //           success: false,
//     //           resultCode: "05",
//     //           message: "정지된 회원입니다. 관리자에게 문의하세요.",
//     //         });
//     //       } else {
//     //         console.log("signIn[" + email + "] : 토큰 생성 시작.");

//     //         const now = new Date().toLocaleString();
//     //         var nowTimeStamp = Date.parse(now) / 1000;
//     //         // console.log(nowTimeStamp);
//     //         var user = {
//     //           email: email,
//     //           iss: "http://www.mimo20.com",
//     //           iat: nowTimeStamp,
//     //           nbf: nowTimeStamp,
//     //           exp:
//     //             Date.parse(
//     //               new Date(moment().add("3", "hours")).toLocaleString()
//     //             ) / 1000,
//     //         };
//     //         const access_token = jwt.sign(user, secret);
//     //         if (!access_token) {
//     //           console.log(
//     //             "signIn[" + email + "] : access token 토큰 생성 실패."
//     //           );
//     //           res.send({
//     //             success: false,
//     //             resultCode: "06",
//     //             message:
//     //               "로그인 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
//     //           });
//     //         } else {
//     //           // fcmkey update
//     //           if (fcmKey !== null && fcmKey !== undefined && fcmKey !== "") {
//     //             console.log("fcmkey update");
//     //             await models.MM_Account.update(
//     //               {
//     //                 fcmKey: fcmKey,
//     //               },
//     //               {
//     //                 where: { email: email },
//     //               }
//     //             );
//     //           }

//     //           var user = {
//     //             email: email,
//     //             iss: "http://www.mimo20.com",
//     //             iat: nowTimeStamp,
//     //             nbf: nowTimeStamp,
//     //             exp:
//     //               Date.parse(
//     //                 new Date(moment().add("90", "days")).toLocaleString()
//     //               ) / 1000,
//     //           };
//     //           const refresh_token = jwt.sign(user, secret);

//     //           if (!refresh_token) {
//     //             console.log(
//     //               "signIn[" + email + "] : refresh token 토큰 생성 실패."
//     //             );
//     //             res.send({
//     //               success: false,
//     //               resultCode: "06",
//     //               message:
//     //                 "로그인 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
//     //             });
//     //           } else {
//     //             console.log(
//     //               "signIn[" +
//     //                 email +
//     //                 "] : token 중복을 막기위한 기존 토큰 삭제 시작."
//     //             );

//     //             models.MM_Account_Token.destroy({
//     //               where: { email: email },
//     //             })
//     //               .then((result) => {
//     //                 console.log(
//     //                   "signIn[" +
//     //                     email +
//     //                     "] : token 중복을 막기위한 기존 토큰 삭제 완료."
//     //                 );
//     //                 console.log("signIn[" + email + "] : 새 token 추가 시작.");
//     //                 //아니면 새로 refresh_token 추가
//     //                 models.MM_Account_Token.create({
//     //                   email: email,
//     //                   access_token: access_token,
//     //                   refresh_token: refresh_token,
//     //                 })
//     //                   .then((resulta) => {
//     //                     console.log(
//     //                       "signIn[" + email + "] : 새 token 추가 완료."
//     //                     );

//     //                     res.send({
//     //                       success: true,
//     //                       message: "로그인 성공.",
//     //                       id: dataList[0].id,
//     //                       name: dataList[0].name,
//     //                       // contact: common.deCrypto(dataList[0].contact, req),
//     //                       admin_yn: dataList[0].admin_yn,
//     //                       access_token: access_token,
//     //                       refresh_token: refresh_token,
//     //                     });
//     //                   })
//     //                   .catch((err) => {
//     //                     console.log(err);
//     //                     console.log(
//     //                       "signIn[" + email + "] : token DB 저장 실패."
//     //                     );
//     //                     res.send({
//     //                       success: false,
//     //                       resultCode: "06",
//     //                       message:
//     //                         "로그인 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
//     //                     });
//     //                   });
//     //               })
//     //               .catch((err) => {
//     //                 console.log("signIn[" + email + "] : token DB 삭제 실패.");
//     //                 console.log(err);
//     //                 res.send({
//     //                   success: false,
//     //                   resultCode: "06",
//     //                   message:
//     //                     "로그인 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
//     //                 });
//     //               });
//     //           }
//     //         }
//     //       }
//     //     }
//     //   })
//     //   .catch((err) => {
//     //     console.log(
//     //       "signIn[" +
//     //         email +
//     //         "] : 로그인 중 문제가 발생하였습니다. 관리자에게 문의하세요."
//     //     );
//     //     console.log(err);
//     //     res.send({
//     //       success: false,
//     //       resultCode: "06",
//     //       message: "로그인 중 문제가 발생하였습니다. 관리자에게 문의하세요.",
//     //     });
//     //   });
//   } catch (err) {
//     console.log(err);
//   }
// };

// 아이디 찾기
let findId = async (req, res) => {
  try {
    console.log("------------ 아이디 찾기 ------------");
    var name = req.body.name;
    var contact = req.body.contact;
    var contachHash = "";

    if (!name || name == "") {
      console.log("findId : name 값이 없습니다.");
      res.send({
        success: false,
        resultCode: "01",
        message: "이름 값이 없습니다.",
      });
      return false;
    }
    if (!contact || contact == "") {
      console.log("findId : contact 값이 없습니다.");
      res.send({
        success: false,
        resultCode: "02",
        message: "전화번호 값이 없습니다.",
      });
      return false;
    }

    //비밀번호 암호화
    contachHash = common.enCrypto(contact, req);

    console.log(
      "findId[" +
        name +
        "," +
        contact +
        "] : 이름과 전화번호로 회원 아이디 검색 시작."
    );
    //중복 체크
    await models.MM_Account.findAll({
      attributes: ["id", "email"],
      where: {
        name: name,
        contact: contachHash,
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("findId[" + name + "," + contact + "] : 검색 결과 0개.");
          res.send({
            success: false,
            resultCode: "03",
            message: "일치하는 회원이 없습니다.",
          });
        } else {
          console.log(
            "findId[" +
              name +
              "," +
              contact +
              "] : 검색 결과 " +
              dataList.length +
              "개."
          );
          var resultArray = new Array();
          var resultJson = new Object();
          for (var i = 0; i < dataList.length; i++) {
            var resultEmail = dataList[i].email;
            var pasEmail = "";
            for (var j = 0; j < resultEmail.length; j++) {
              if (j < 3) {
                pasEmail += resultEmail[j];
              } else if (j >= 3 && j < resultEmail.length - 3) {
                pasEmail += "*";
              } else {
                pasEmail += resultEmail[j];
              }
            }
            resultJson.email = pasEmail;
            resultJson.realEmail = dataList[i].email;
            resultArray.push(resultJson);
          }

          console.log(resultArray);
          res.send({
            success: true,
            resultCode: "00",
            message: "검색 성공",
            list: resultArray,
          });
        }
      })
      .catch((err) => {
        console.log(
          "findId[" + name + "," + contact + "] : 아이디 찾기 검색 에러."
        );
        console.log(err);
        res.send({
          success: false,
          resultCode: "04",
          message:
            "아이디 찾기중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

// 비밀번호 수정
let updatePassword = async (req, res) => {
  try {
    console.log("------------ 비밀번호 변경 ------------");
    const email = req.app.get("tokenEmail");
    const password = req.body.password;

    if (!email || email == "") {
      console.log("findPassword : email 값이 없습니다.");
      res.send({
        success: false,
        resultCode: "01",
        message: "email 값이 없습니다.",
      });
      return false;
    }

    if (!password || password == "") {
      console.log("findPassword : password 값이 없습니다.");
      res.send({
        success: false,
        resultCode: "02",
        message: "비밀번호 값이 없습니다.",
      });
      return false;
    }

    //비밀번호 암호와
    const passwordhHash = common.enCrypto(password, req);

    console.log("findPassword[" + email + "] : 비밀번호 변경 시작.");

    models.MM_Account.update(
      {
        password: passwordhHash,
      },
      {
        where: { email: email },
      }
    )
      .then((updateResult) => {
        res.send({
          success: true,
          resultCode: "00",
          message: "비밀번호 변경 완료.",
        });
      })
      .catch((err) => {
        console.log(err);
        console.log(
          "findPassword[" +
            email +
            "] : 처리중 문제가 발생하였습니다. 관리자에게 문의하세요."
        );
        res.send({
          success: false,
          resultCode: "03",
          message: "처리중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

//회원정보 수정(비밀번호체크)
let checkPassword = async (req, res) => {
  try {
    console.log("------------ 회원정보 수정(비밀번호체크) ------------");
    var eamil = req.app.get("tokenEmail");
    var password = req.body.password;

    if (!password) {
      console.log("checkPassword - password 값이 없습니다.");
      res.send({
        success: false,
        resultCode: "02",
        message: "password 값이 없습니다.",
      });
      return false;
    }

    //비밀번호 암호화
    var passwordHash = common.enCrypto(password, req);

    await models.MM_Account.findAll({
      attributes: ["id", "email"],
      where: {
        email: eamil,
        password: passwordHash,
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("checkPassword : 검색 결과 0개.");
          res.send({
            success: false,
            resultCode: "03",
            message: "일치하는 회원이 없습니다.",
          });
        } else {
          console.log("checkPassword : 검색 결과 1개.");
          res.send({
            success: true,
            resultCode: "00",
            message: "비밀번호 일치",
          });
        }
      })
      .catch((err) => {
        console.log(
          "checkPassword : 비밀번호 체크중 문제가 발생하였습니다. 관리자에게 문의하세요."
        );
        console.log(err);
        res.send({
          success: false,
          resultCode: "01",
          message:
            "비밀번호 체크중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

//일반회원 수정
let modifyMember = async (req, res) => {
  console.log("--------------- 일반회원 수정 ---------------");
  try {
    var eamil = req.app.get("tokenEmail");
    var name = req.body.name;
    var contact = req.body.contact;
    var contactHash;
    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;
    var updateObject = new Object();

    if (!name) {
      console.log("modifyMember[" + eamil + "] : 회원 이름 값이 없습니다.");
      res.send({
        success: false,
        resultCode: "02",
        message: "회원 이름 값이 없습니다.",
      });
      return false;
    }
    if (!oldPassword) {
      console.log(
        "modifyMember[" + eamil + "] : 회원 기존 비밀번호 값이 없습니다."
      );
      res.send({
        success: false,
        resultCode: "02",
        message: "회원 기존 비밀번호 값이 없습니다.",
      });
      return false;
    }
    if (!contact) {
      console.log("modifyMember[" + eamil + "] : 회원 전화번호 값이 없습니다.");
      res.send({
        success: false,
        resultCode: "03",
        message: "회원 전화번호 값이 없습니다.",
      });
      return false;
    }

    //기존 비밀번호 확인
    if (oldPassword) {
      //비밀번호 암호화
      var passwordHash = common.enCrypto(oldPassword, req);

      await models.MM_Account.findAll({
        attributes: ["id", "email"],
        where: {
          email: eamil,
          password: passwordHash,
        },
      })
        .then((dataList) => {
          if (dataList.length == 0) {
            console.log("checkPassword : 검색 결과 0개.");
            res.send({
              success: false,
              resultCode: "04",
              message: "비밀번호가 일치 하지 않습니다.",
            });
          } else {
            updateObject.name = name;
            updateObject.contact = common.enCrypto(contact, req);
            if (newPassword) {
              updateObject.password = common.enCrypto(newPassword, req);
            }

            models.MM_Account.update(updateObject, {
              where: { email: eamil },
            })
              .then((updateResult) => {
                console.log("modifyMember[" + eamil + "] : 회원 수정 완료.");
                res.send({
                  success: true,
                  resultCode: "00",
                  message: "회원 수정 완료.",
                });
              })
              .catch((err) => {
                console.log(err);
                console.log(
                  "modifyMember[" +
                    eamil +
                    "] : 처리중 문제가 발생하였습니다. 관리자에게 문의하세요."
                );
                res.send({
                  success: false,
                  resultCode: "01",
                  message:
                    "처리중 문제가 발생하였습니다. 관리자에게 문의하세요.",
                });
              });
          }
        })
        .catch((err) => {
          console.log(
            "checkPassword : 비밀번호 체크중 문제가 발생하였습니다. 관리자에게 문의하세요."
          );
          console.log(err);
          res.send({
            success: false,
            resultCode: "01",
            message:
              "비밀번호 체크중 문제가 발생하였습니다. 관리자에게 문의하세요.",
          });
        });
    }
  } catch (err) {
    console.log(err);
  }
};

//일반회원 검색
let getAccount = async (req, res) => {
  console.log("--------------- 일반회원 검색 ---------------");
  try {
    var email = req.app.get("tokenEmail");

    await models.MM_Account.findAll({
      attributes: ["id", "email", "name", "accountType"],
      where: {
        email: email,
      },
    })
      .then((dataList) => {
        if (dataList.length == 0) {
          console.log("getAccount[" + email + "] : 데이터가 없습니다.");
          res.send({
            success: false,
            resultCode: "01",
            message: "데이터가 없습니다.",
          });
          return false;
        } else {
          // dataList[0].contact = common.deCrypto(dataList[0].contact, req);

          console.log("getAccount[" + email + "] : 검색 성공.");
          res.send({ success: true, resultCode: "00", data: dataList[0] });
          return false;
        }
      })
      .catch((err) => {
        console.log("getAccount[" + email + "] : error");
        console.log(err);
        res.send({
          success: false,
          resultCode: "03",
          message: "처리중 문제가 발생하였습니다. 관리자에게 문의하세요.",
        });
      });
  } catch (err) {
    console.log(err);
  }
};

const _returnLoginText = (loginType) => {
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

module.exports = {
  signUp: signUp,
  // signIn: signIn,
  signUpCheckEmail: signUpCheckEmail,
  findId: findId,
  updatePassword: updatePassword,
  checkPassword: checkPassword,
  modifyMember: modifyMember,
  getAccount: getAccount,
};
