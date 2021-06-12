"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMC_AccountCompany = sequelize.define(
    "MMC_AccountCompany",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      accountId: DataTypes.INTEGER,
      category: DataTypes.STRING,
      enabled: DataTypes.STRING,
      ceo_name: DataTypes.STRING,
      name: DataTypes.STRING,
      phone: DataTypes.STRING,
      sido: DataTypes.STRING,
      sigungu: DataTypes.STRING,
      bname: DataTypes.STRING,
      ogname: DataTypes.STRING,
      createdAt: DataTypes.STRING,
      roadname: DataTypes.STRING,
      remains_address: DataTypes.STRING,
      old_address: DataTypes.STRING,
      new_address: DataTypes.STRING,
      latitude: DataTypes.STRING,
      longitude: DataTypes.STRING,
      premium_YN: DataTypes.STRING,
      weekday_hour_start: DataTypes.STRING,
      weekday_hour_end: DataTypes.STRING,
      weekend_hour_start: DataTypes.STRING,
      weekend_hour_end: DataTypes.STRING,
      holiday: DataTypes.JSON,
      context: DataTypes.STRING,
      video_url: DataTypes.STRING,
      notification: DataTypes.STRING,
      tradeInformation: DataTypes.STRING,
      businessId: DataTypes.STRING,
      businessTrip: DataTypes.STRING,
      tag: DataTypes.STRING,
      event_YN: DataTypes.STRING,
      today_YN: DataTypes.STRING,
      subwayDistance: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MMC_AccountCompany",
      paranoid: true,
    }
  );
  MMC_AccountCompany.associate = function (models) {
    // associations can be defined here
  };
  return MMC_AccountCompany;
};
