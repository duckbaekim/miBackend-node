'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMC_Workers = sequelize.define('MMC_Workers', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	companyId :		DataTypes.INTEGER,
	position :		DataTypes.STRING,
	name :			DataTypes.STRING,
	context :		DataTypes.STRING,
	imgUrl :		DataTypes.STRING,
	holiday:		DataTypes.STRING,
	createdAt :		DataTypes.DATE,
	updatedAt :		DataTypes.DATE,
	deletedAt :		DataTypes.DATE
  },
  {
	underscored: false,
    freezeTableName: true,
	tableName: "MMC_Workers",
	paranoid: true
  });
  MMC_Workers.associate = function(models) {
    // associations can be defined here
  };
  return MMC_Workers;
};
