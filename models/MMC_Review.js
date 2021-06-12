"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMC_Review = sequelize.define(
    "MMC_Review",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      accountId: DataTypes.INTEGER,
      companyId: DataTypes.INTEGER,
      goodsId: DataTypes.INTEGER,
      categoryId: DataTypes.INTEGER,
      goodsCategoryId: DataTypes.INTEGER,
      designerId: DataTypes.INTEGER,
      context: DataTypes.STRING,
      imgUrl: DataTypes.STRING,
      point: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MMC_Review",
      paranoid: true,
    }
  );
  MMC_Review.associate = function (models) {
    // associations can be defined here
    MMC_Review.hasOne(models.MMC_AccountCompany, {
      sourceKey: "companyId",
      foreignKey: "id",
    });
    MMC_Review.hasMany(models.MMC_ReviewImg, {
      as: "reviewImg",
      foreignKey: "reviewId",
    });
  };
  return MMC_Review;
};
