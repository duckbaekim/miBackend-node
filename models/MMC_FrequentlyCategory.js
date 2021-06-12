'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMC_FrequentlyCategory = sequelize.define('MMC_FrequentlyCategory', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	name :			DataTypes.STRING,
	createdAt :		DataTypes.DATE,
	updatedAt :		DataTypes.DATE,
	deletedAt :		DataTypes.DATE
  },
  {
	underscored: false,
    freezeTableName: true,
	tableName: "MMC_FrequentlyCategory",
	paranoid: true
  });
  MMC_FrequentlyCategory.associate = function(models) {
    // associations can be defined here
  };
  return MMC_FrequentlyCategory;
};
