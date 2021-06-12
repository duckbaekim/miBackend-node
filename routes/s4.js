const multer = require("multer");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
const path = require("path");
aws.config.loadFromPath(path.join(__dirname, "../config/aws_config.json"));
//aws.config.loadFromPath('/srv/services/api/mimo_new_backend/config/aws_config.json');
const s3 = new aws.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "mimo-s3/company/companyImg",
    //bucket: 'caroom-storage/__dev/mimo',
    acl: "public-read",
    key: function (req, file, cb) {
      //console.log("---------- s3 req ------------");
      //console.log(req);
      console.log("---------- s3 file ------------");
      console.log(file);
      cb(null, Date.now() + "." + file.originalname.split(".").pop());
    },
  }),
});

module.exports = upload;
