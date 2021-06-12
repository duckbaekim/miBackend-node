"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMC_ReviewImg = sequelize.define(
    "MMC_ReviewImg",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reviewId: DataTypes.INTEGER,
      imgUrl: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MMC_ReviewImg",
      paranoid: true,
    }
  );
  MMC_ReviewImg.associate = function (models) {
    // associations can be defined here
    MMC_ReviewImg.belongsTo(models.MMC_Review);
  };
  return MMC_ReviewImg;
};
