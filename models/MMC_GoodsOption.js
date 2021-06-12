'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMC_GoodsOption = sequelize.define('MMC_GoodsOption', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	companyId :		DataTypes.INTEGER,
    goodsId :		DataTypes.INTEGER,
	name :			DataTypes.STRING,
	context :		DataTypes.STRING,
	seq :			DataTypes.INTEGER,
	createdAt :		DataTypes.DATE,
	updatedAt :		DataTypes.DATE,
	deletedAt :		DataTypes.DATE
  }, {
	underscored: false,
    freezeTableName: true,
	tableName: "MMC_GoodsOption",
	paranoid: true		
  });
  MMC_GoodsOption.associate = function(models) {
    // associations can be defined here
  };
  return MMC_GoodsOption;
};
