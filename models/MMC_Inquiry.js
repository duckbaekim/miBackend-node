'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMC_Inquiry = sequelize.define('MMC_Inquiry', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	companyId :		DataTypes.INTEGER,
	categoryId :	DataTypes.INTEGER,
	accountId :		DataTypes.INTEGER,
	title :			DataTypes.STRING,
	context :		DataTypes.STRING,
	response :		DataTypes.STRING,
	imgUrl :		DataTypes.STRING,
	createdAt :		DataTypes.DATE,
	updatedAt :		DataTypes.DATE,
	deletedAt :		DataTypes.DATE
  },
  {
	underscored: false,
    freezeTableName: true,
	tableName: "MMC_Inquiry",
	paranoid: true
  });
  MMC_Inquiry.associate = function(models) {
    // associations can be defined here
  };
  return MMC_Inquiry;
};
