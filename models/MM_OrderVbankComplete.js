'use strict';
module.exports = (sequelize, DataTypes) => {
  const MM_OrderVbankComplete = sequelize.define('MM_OrderVbankComplete', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	orderId:		DataTypes.STRING,
	complete_yn:	DataTypes.STRING,
	createdAt :		DataTypes.DATE,
	updatedAt :		DataTypes.DATE,
	deletedAt :		DataTypes.DATE
  }, {
	underscored: false,
    freezeTableName: true,
	tableName: "MM_OrderVbankComplete",
	paranoid: true
  });
  MM_OrderVbankComplete.associate = function(models) {
    // associations can be defined here
  };
  return MM_OrderVbankComplete;
};
