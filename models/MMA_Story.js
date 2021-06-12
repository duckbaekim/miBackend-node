'use strict';
module.exports = (sequelize, DataTypes) => {
  const MMA_Story = sequelize.define('MMA_Story', {
    id : {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	categoryId :	DataTypes.INTEGER,
	title :			DataTypes.STRING,
	context :		DataTypes.STRING,
	locationUrl :	DataTypes.STRING,
	imgUrl :		DataTypes.STRING,
	createdAt :		DataTypes.DATE,
	updatedAt :		DataTypes.DATE,
	deletedAt :		DataTypes.DATE
  },
  {
	underscored: false,
    freezeTableName: true,
	tableName: "MMA_Story",
	paranoid: true
  });
  MMA_Story.associate = function(models) {
    // associations can be defined here
  };
  return MMA_Story;
};
