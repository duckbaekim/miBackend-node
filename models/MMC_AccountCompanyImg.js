'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMC_AccountCompanyImg = sequelize.define('MMC_AccountCompanyImg', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	companyId :	DataTypes.INTEGER,
	type :		DataTypes.STRING,
    imgUrl :	DataTypes.STRING,
	createdAt :	DataTypes.DATE,
	updatedAt :	DataTypes.DATE,
	deletedAt :	DataTypes.DATE
  }, {
	underscored: false,
    freezeTableName: true,
	tableName: "MMC_AccountCompanyImg",
	paranoid: true	
  });
  MMC_AccountCompanyImg.associate = function(models) {
    // associations can be defined here
  };
  return MMC_AccountCompanyImg;
};
