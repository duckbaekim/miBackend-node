'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMA_TV = sequelize.define('MMA_TV', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	categoryId :	DataTypes.INTEGER,
	title :			DataTypes.STRING,
	locationUrl :	DataTypes.STRING,
	imgUrl :		DataTypes.STRING,
	createdAt :		DataTypes.DATE,
	updatedAt :		DataTypes.DATE,
	deletedAt :		DataTypes.DATE
  },
  {
	underscored: false,
    freezeTableName: true,
	tableName: "MMA_TV",
	paranoid: true
  });
  MMA_TV.associate = function(models) {
    // associations can be defined here
  };
  return MMA_TV;
};
