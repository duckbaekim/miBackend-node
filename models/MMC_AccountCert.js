'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMC_AccountCert = sequelize.define('MMC_AccountCert', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	email :		DataTypes.STRING,
    code :		DataTypes.STRING,
	enabled :	DataTypes.STRING,
	limitTime : DataTypes.DATE,
    createdAt :	DataTypes.DATE,
	updatedAt :	DataTypes.DATE,
	deletedAt :	DataTypes.DATE
  }, {
	underscored: false,
    freezeTableName: true,
	tableName: "MMC_AccountCert",
	paranoid: true		
  });
  MMC_AccountCert.associate = function(models) {
    // associations can be defined here
  };
  return MMC_AccountCert;
};
