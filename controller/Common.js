var models = require("../models");
var crypto = require('crypto');
var aes256 = require('aes256');
var base64 = require('base-64');
const utf8 = require('utf8');
const nodemailer = require('nodemailer');
const { Encryptor } = require('strong-cryptor');

exports.decrypt = (data, req) => {
	const app_key = req.app.get('app_key');

	var json = base64.decode(data, 'utf8');

	const dataParse = JSON.parse(json);
	
	//console.log(dataParse.iv);

	//var iv = dataParse.iv;
	var iv = new Buffer(dataParse.iv, 'base64');
	//console.log(iv);
	//var value = dataParse.value;
	var value = new Buffer(dataParse.value, 'base64');
	//console.log(value);
	//var mac = dataParse.mac;
	var mac = new Buffer(dataParse.mac, 'base64');
	//console.log(mac);
	//var key = new Buffer("+laKQpvEb0IAAfPFcEzBp0NCgvCJVIJlZbM4VM0W6t8=", 'base64');
	var key = new Buffer(app_key, 'base64');

	var dec = crypto.createDecipheriv('aes-256-cbc', key, iv);
	var dec_data = dec.update(value, 'base64', 'utf8') + dec.final('utf8');
	//console.log("------ aes-256-cbc start ------");
	//console.log(dec_data);
	//console.log("------ aes-256-cbc finish ------");
	var arr = dec_data.split(":");
	var returnText = arr[2].replace(/"/gim, "");
	returnText = returnText.replace(/;/gim, "");

	return returnText;

}

exports.encrypt = (data, req) => {
	const app_key = req.app.get('app_key');
	//console.log(app_key);
	/*
	var cipher = crypto.createCipher('aes-256-cbc', app_key);
	var crypted = cipher.update(data, 'utf8', 'base64');
	crypted += cipher.final('base64');
	*/
	//iv 램던 바이트 32 생성
	let IV_LENGTH = 32;
	let iv = crypto.randomBytes(IV_LENGTH);
	var ivstring = iv.toString('base64').slice(0, 16); //iv 값 string
	
	let ENCRYPTION_KEY = crypto.createHash('sha256').update(String(app_key)).digest('base64').substr(0, 32);
	let text = data;
	

	
	
	let key = new Buffer.from(ENCRYPTION_KEY);
	let plain = new Buffer.from(text);
	let cipher = crypto.createCipheriv('aes-256-cbc', key, ivstring);
	let encrypted = cipher.update(plain);
	//encrypted = Buffer.concat([encrypted, cipher.final()]);
	encrypted = cipher.update(String(plain), 'utf8', 'base64') + cipher.final('base64');
	return encrypted;
	//return iv.toString('base64') + ':' + encrypted.toString('base64');

	
}


exports.enCrypto = (data, req) => {
	const passKey = req.app.get('app_key');

	const cipher = crypto.createCipher('aes-256-cbc', passKey);
	let result = cipher.update(data, 'utf8', 'base64'); // 'HbMtmFdroLU0arLpMflQ'
	result += cipher.final('base64'); // 'HbMtmFdroLU0arLpMflQYtt8xEf4lrPn5tX5k+a8Nzw='

	return result;
}

exports.deCrypto = (data, req) => {
	const passKey = req.app.get('app_key');

	const decipher = crypto.createDecipher('aes-256-cbc', passKey);
	let result = decipher.update(data, 'base64', 'utf8'); // 암호화할문 (base64, utf8이 위의 cipher과 반대 순서입니다.)
	result += decipher.final('utf8'); // 암호화할문장 (여기도 base64대신 utf8)

	return result;
}

exports.sendMailProc = (email, message, req) => {
	var adminEmail = req.app.get('emailId');
	var adminPassword = req.app.get('emailPassword');
	console.log(email);

	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: adminEmail,		// gmail 계정 아이디를 입력
			pass: adminPassword		// gmail 계정의 비밀번호를 입력
		}
	});

	let mailOptions = {
		from: adminEmail,		// 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
		to: email,                     // 수신 메일 주소
		subject: message, // 제목
		text: message					// 내용
	};

	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log("email-send error");
			console.log(error);
			//var resultData = { success: false, code: '', message: '인증번호 처리중 문제가 발생하였습니다. 관리자에게 문의하세요.'};
			//res.json(resultData);
			return false;
		}
		else {
			console.log(email +" email send success");
			return true;
		}
	});
}


exports.viewCount = (companyId, goodsId, type , req) => {
	models.MM_Count.create({
		companyId: companyId,
		goodsId: goodsId,
		type: type,
	}).then(resulta => {
		console.log("viewCount["+companyId+","+goodsId+","+type+"] : viewCount 저장 성공.");
	}).catch(err => {
		console.log("viewCount["+companyId+","+goodsId+","+type+"] : viewCount 저장 실패.");
		console.log(err);
	});
}


function getHash(string){
    var hmac = crypto.createHmac('sha256', key);
    hmac.update(string); 
    return hmac.digest('binary'); 
};


