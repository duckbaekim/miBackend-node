'use strict';
module.exports = (sequelize, DataTypes) => {
  const MM_Count = sequelize.define('MM_Count', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	companyId :		DataTypes.INTEGER,
	goodsId :		DataTypes.INTEGER,
	type :			DataTypes.STRING,
	createdAt :		DataTypes.DATE,
	updatedAt :		DataTypes.DATE,
	deletedAt :		DataTypes.DATE
  },
  {
	underscored: false,
    freezeTableName: true,
	tableName: "MM_Count",
	paranoid: true
  });
  MM_Count.associate = function(models) {
    // associations can be defined here
  };
  return MM_Count;
};
