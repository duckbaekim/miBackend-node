'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMC_Category = sequelize.define('MMC_Category', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	name :		DataTypes.STRING,
    seq :		DataTypes.INTEGER
  }, {
	underscored: false,
    freezeTableName: true,
	tableName: "MMC_Category"
  });
  MMC_Category.associate = function(models) {
    // associations can be defined here
  };
  return MMC_Category;
};
