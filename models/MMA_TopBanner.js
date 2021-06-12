"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMA_TopBanner = sequelize.define(
    "MMA_TopBanner",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      accountId: DataTypes.INTEGER,
      title: DataTypes.STRING,
      bannerImgUrl: DataTypes.INTEGER,
      mainImgUrl: DataTypes.STRING,
      contents: DataTypes.STRING,
      startAt: DataTypes.DATE,
      endAt: DataTypes.DATE,
      status: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MMA_TopBanner",
      paranoid: true,
    }
  );
  MMA_TopBanner.associate = function (models) {
    // associations can be defined here
    MMA_TopBanner.hasMany(models.MMA_TopBannerImg, {
      as: "topBannerDetailImg",
      foreignKey: "topBannerId",
    });
  };
  return MMA_TopBanner;
};
