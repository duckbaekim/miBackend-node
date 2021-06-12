'use strict';
module.exports = (sequelize, DataTypes) => {
  const MM_OrderVbankCancel = sequelize.define('MM_OrderVbankCancel', {
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
	tableName: "MM_OrderVbankCancel",
	paranoid: true
  });
  MM_OrderVbankCancel.associate = function(models) {
    // associations can be defined here
  };
  return MM_OrderVbankCancel;
};
