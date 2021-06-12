'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMA_Account = sequelize.define('MMA_Account', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	email :			DataTypes.STRING,
    password :		DataTypes.STRING,
	enabled :		DataTypes.STRING,
	name :			DataTypes.STRING,
	contact :		DataTypes.STRING,
	fcmKey :		DataTypes.STRING,
	black_yn :		DataTypes.STRING,
	admin_yn :		DataTypes.STRING,
    createdAt :		DataTypes.DATE,
	updatedAt :		DataTypes.DATE,
	deletedAt :		DataTypes.DATE
  }, {
	underscored: false,
    freezeTableName: true,
	tableName: "MMA_Account",
	paranoid: true
  });
  MMA_Account.associate = function(models) {
    // associations can be defined here
  };
  return MMA_Account;
};
