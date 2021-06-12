"use strict";
module.exports = (sequelize, DataTypes) => {
  const MM_Account_Token = sequelize.define(
    "MM_Account_Token",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: DataTypes.STRING,
      access_token: DataTypes.STRING,
      refresh_token: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MM_Account_Token",
    }
  );
  MM_Account_Token.associate = function (models) {
    // associations can be defined here
  };
  return MM_Account_Token;
};
