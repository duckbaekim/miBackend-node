"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMC_GoodsImg = sequelize.define(
    "MMC_GoodsImg",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      companyId: DataTypes.INTEGER,
      goodsId: DataTypes.INTEGER,
      seq: DataTypes.INTEGER,
      type: DataTypes.STRING,
      imgUrl: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MMC_GoodsImg",
      paranoid: true,
    }
  );
  MMC_GoodsImg.associate = function (models) {
    // associations can be defined here
  };
  return MMC_GoodsImg;
};
