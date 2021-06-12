'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMS_NoticeImg = sequelize.define('MMS_NoticeImg', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	noticeId :		DataTypes.INTEGER,
	imgUrl :		DataTypes.STRING,
	createdAt :		DataTypes.DATE,
	updatedAt :		DataTypes.DATE,
	deletedAt :		DataTypes.DATE
  },
  {
	underscored: false,
    freezeTableName: true,
	tableName: "MMS_NoticeImg",
	paranoid: true
  });
  MMS_NoticeImg.associate = function(models) {
    // associations can be defined here
  };
  return MMS_NoticeImg;
};
