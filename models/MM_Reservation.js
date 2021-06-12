'use strict';
module.exports = (sequelize, DataTypes) => {
  const MM_Reservation = sequelize.define('MM_Reservation', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	accountId :			DataTypes.INTEGER,
    orderId :			DataTypes.STRING,
	reservationTime :	DataTypes.DATE,
	createdAt :			DataTypes.DATE,
	updatedAt :			DataTypes.DATE,
	deletedAt :			DataTypes.DATE
  }, {
	underscored: false,
    freezeTableName: true,
	tableName: "MM_Reservation",
	paranoid: true
  });
  MM_Reservation.associate = function(models) {
    // associations can be defined here
  };
  return MM_Reservation;
};
