"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMC_InquiryImg = sequelize.define(
    "MMC_InquiryImg",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      inquiryId: DataTypes.INTEGER,
      imgUrl: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MMC_InquiryImg",
      paranoid: true,
    }
  );
  MMC_InquiryImg.associate = function (models) {
    // associations can be defined here
  };
  return MMC_InquiryImg;
};
