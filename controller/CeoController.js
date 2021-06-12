var models = require("../models");
var common = require("./Common");
var sha256 = require('sha256');
const jwt = require('jsonwebtoken');
var moment = require("moment");
var request = require("request");
var validator = require('validator');
const s3 = require('../routes/s3');
const sequelize = require('sequelize');
const Op = sequelize.Op;

//const curl = new (require( 'curl-request' ))();

// 사장님 회원 리스트
let getCeoList = async (req, res) => {
	console.log("--------------- 사장님 회원 리스트 ---------------");
	try{
		var email = req.body.email;
		var name = req.body.name;
		var contact = req.body.contact;
		var category = req.body.category;
		var startAt = req.body.startAt;
		var endAt = req.body.endAt;
		var contactHash;

		//전화번호 암호화
		if(contact){
			contactHash = common.enCrypto(contact, req);
		}

		if(!startAt){
			startAt = moment().format('YYYY-MM-DD')+" 00:00:00";
		}
		if(!endAt){
			endAt = moment().format('YYYY-MM-DD')+" 23:59:59";
		}

		var query  = " ";
			query += " SELECT a.*, b.id AS companyId, b.name AS companyName, b.category, ";
			query += " (SELECT NAME FROM MMC_Category c WHERE b.category = c.id) AS categoryName ";
			query += " FROM MMC_Account a ";
			query += " LEFT JOIN MMC_AccountCompany b ON a.id = b.accountId ";
			query += " where a.id >= 0";
			if(category){
				query += " and b.category = '"+category+"'";
			}
			if(email){
				query += " and a.email like '%"+email+"%'";
			}
			if(name){
				query += " and a.name like '%"+name+"%'";
			}
			if(contact){
				query += " and a.contact = '"+contactHash+"'";
			}
			query += " and (a.createdAt >= '"+startAt+"' or a.createdAt <= '"+endAt+"') ";
			

		await models.sequelize.query(query, {
			//replacements: {
			//	contact_hash: hashPhone,
			//	id: certId
			//}
		}).then((dataList) => {
			//console.log(dataList);
			console.log("getCeoList : 검색 성공.");
			res.send({ success: true, resultCode: '00', message: '검색 성공', list: dataList[0] });
		}).catch((err) => {
			console.log("getCeoList["+name+","+contact+"] : 검색 에러.");
			console.log(err);
			res.send({ success: false, resultCode: '01', message: '검색중 문제가 발생하였습니다. 관리자에게 문의하세요.' });
		});
	
	}catch(err){
		console.log(err);
	}
}

//사장님 상세검색
let getCeoDetail = async (req, res) => {
	console.log("--------------- 사장님 상세검색 ---------------");
	try{
		var memberId = req.body.memberId;

		//전화번호 암호화
		if(!memberId){
			console.log("getCeoDetail["+memberId+"] : 회원 아이디 값이 없습니다.");
			res.send({ success: false, resultCode: '02', message: '회원 아이디 값이 없습니다.' });
			return false;
		}

		var query  = " ";
			query += " SELECT a.*, b.id AS companyId, b.name AS companyName, b.category, ";
			query += " (SELECT NAME FROM MMC_Category c WHERE b.category = c.id) AS categoryName ";
			query += " FROM MMC_Account a ";
			query += " LEFT JOIN MMC_AccountCompany b ON a.id = b.accountId ";
			query += " where a.id >= '"+memberId+"'";

		await models.sequelize.query(query, {
			//replacements: {
			//	contact_hash: hashPhone,
			//	id: certId
			//}
		}).then((dataList) => {
			//console.log(dataList);
			dataList[0][0].contact = common.deCrypto(dataList[0][0].contact, req);
			console.log("getCeoDetail["+memberId+"] : 검색 성공.");
			res.send({ success: true, resultCode: '00', message: '검색 성공', list: dataList[0][0] });
		}).catch((err) => {
			console.log("getCeoDetail["+memberId+"] : 검색 에러.");
			console.log(err);
			res.send({ success: false, resultCode: '01', message: '검색중 문제가 발생하였습니다. 관리자에게 문의하세요.' });
		});
	
	}catch(err){
		console.log(err);
	}
}

//사장님 수정
let modifyCeo = async (req, res) => {
	console.log("--------------- 사장님 수정 ---------------");
	try{
		var memberId = req.body.memberId;
		var name = req.body.name;
		var contact = req.body.contact;
		var contactHash;
		var password = req.body.password;
		var enabled = req.body.enabled;
		var black_yn = req.body.black_yn;
		var updateObject = new Object();

		if(!memberId){
			console.log("modifyCeo["+memberId+"] : 회원 아이디 값이 없습니다.");
			res.send({ success: false, resultCode: '02', message: '회원 아이디 값이 없습니다.' });
			return false;
		}
		if(!name){
			console.log("modifyCeo["+memberId+"] : 회원 이름 값이 없습니다.");
			res.send({ success: false, resultCode: '03', message: '회원 이름 값이 없습니다.' });
			return false;
		}
		if(!contact){
			console.log("modifyCeo["+memberId+"] : 회원 전화번호 값이 없습니다.");
			res.send({ success: false, resultCode: '04', message: '회원 전화번호 값이 없습니다.' });
			return false;
		}
		if(!black_yn){
			console.log("modifyCeo["+memberId+"] : 회원 블랙여부 값이 없습니다.");
			res.send({ success: false, resultCode: '05', message: '회원 블랙여부 값이 없습니다.' });
			return false;
		}
		if(!enabled){
			console.log("modifyCeo["+memberId+"] : 회원 승인여부 값이 없습니다.");
			res.send({ success: false, resultCode: '06', message: '회원 승인여부 값이 없습니다.' });
			return false;
		}

		updateObject.name = name;
		updateObject.contact = common.enCrypto(contact, req);
		updateObject.black_yn = black_yn;
		updateObject.enabled = enabled;
		if(password){
			updateObject.password = common.enCrypto(password, req);
		}

		models.MMC_Account.update(
			updateObject,
			{
				where : { id: memberId }
			}
		).then(updateResult => {
			console.log("modifyCeo["+memberId+"] : 회원 수정 완료.");
			res.send({ success: true, resultCode: '00', message: "회원 수정 완료." });
		}).catch(err => {
			console.log(err);	
			console.log("modifyCeo["+memberId+"] : 처리중 문제가 발생하였습니다. 관리자에게 문의하세요.");
			res.send({ success: false, resultCode: '01', message: "처리중 문제가 발생하였습니다. 관리자에게 문의하세요." });
		});
	
	}catch(err){
		console.log(err);
	}
}


//일반탈퇴(삭제)
let deleteCeo = async (req, res) => {
	console.log("--------------- 사장님 탈퇴(삭제) ---------------");
	try{
		var memberId = req.body.memberId;

		//전화번호 암호화
		if(!memberId){
			console.log("deleteCeo["+memberId+"] : 회원 아이디 값이 없습니다.");
			res.send({ success: false, resultCode: '02', message: '회원 아이디 값이 없습니다.' });
			return false;
		}

		await models.MMC_Account.destroy(
			{
				where : { id: memberId }
			}
		).then(result => {
			console.log("deleteCeo["+memberId+"] : 사장님 탈퇴(삭제) 완료.");
			res.send({ success: true, resultCode: '00', message: '사장님 탈퇴(삭제) 완료.' });
		}).catch(err => {
			console.log("deleteCeo["+memberId+"] : 사장님 탈퇴(삭제) 중 문제가 발생하였습니다. 관리자에게 문의하세요.");
			console.log(err);
			res.send({ success: false, resultCode: '01', message: '사장님 탈퇴(삭제) 중 문제가 발생하였습니다. 관리자에게 문의하세요.' });
		});
	
	}catch(err){
		console.log(err);
	}
}


module.exports = {
	getCeoList: getCeoList,
	getCeoDetail: getCeoDetail,
	modifyCeo: modifyCeo,
	deleteCeo: deleteCeo
};
