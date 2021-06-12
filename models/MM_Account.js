"use strict";
module.exports = (sequelize, DataTypes) => {
  const MM_Account = sequelize.define(
    "MM_Account",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      accountType: DataTypes.STRING,
      socialUID: DataTypes.STRING,
      name: DataTypes.STRING,
      contact: DataTypes.STRING,
      fcmKey: DataTypes.STRING,
      black_yn: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MM_Account",
      paranoid: true,
    }
  );
  MM_Account.associate = function (models) {
    // associations can be defined here
  };
  return MM_Account;
};
