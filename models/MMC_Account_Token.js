'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMC_Account_Token = sequelize.define('MMC_Account_Token', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	email :				DataTypes.STRING,
    access_token :		DataTypes.STRING,
    refresh_token :		DataTypes.STRING,
	created_at :		DataTypes.DATE,
	updated_at :		DataTypes.DATE
  }, {
	underscored: false,
    freezeTableName: true,
	tableName: "MMC_Account_Token"		
  });
  MMC_Account_Token.associate = function(models) {
    // associations can be defined here
  };
  return MMC_Account_Token;
};
