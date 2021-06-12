'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMC_GoodsAddOption = sequelize.define('MMC_GoodsAddOption', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	companyId :		DataTypes.INTEGER,
	name :			DataTypes.STRING,
	context :		DataTypes.STRING,
	price :			DataTypes.INTEGER,
	seq :			DataTypes.INTEGER,
	createdAt :		DataTypes.DATE,
	updatedAt :		DataTypes.DATE,
	deletedAt :		DataTypes.DATE
  }, {
	underscored: false,
    freezeTableName: true,
	tableName: "MMC_GoodsAddOption",
	paranoid: true	
  });
  MMC_GoodsAddOption.associate = function(models) {
    // associations can be defined here
  };
  return MMC_GoodsAddOption;
};
