"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMC_StyleImg = sequelize.define(
    "MMC_StyleImg",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      companyId: DataTypes.INTEGER,
      designerId: DataTypes.INTEGER,
      goodsId: DataTypes.INTEGER,
      title: DataTypes.STRING,
      context: DataTypes.STRING,
      imgUrl: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MMC_StyleImg",
      paranoid: true,
    }
  );
  MMC_StyleImg.associate = function (models) {
    // associations can be defined here
  };
  return MMC_StyleImg;
};
