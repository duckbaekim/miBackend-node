"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMA_TopBannerImg = sequelize.define(
    "MMA_TopBannerImg",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      topBannerId: DataTypes.INTEGER,
      type: DataTypes.STRING,
      seq: DataTypes.INTEGER,
      imgUrl: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MMA_TopBannerImg",
      paranoid: true,
    }
  );
  MMA_TopBannerImg.associate = function (models) {
    // associations can be defined here
    MMA_TopBannerImg.belongsTo(models.MMA_TopBanner);
  };
  return MMA_TopBannerImg;
};
