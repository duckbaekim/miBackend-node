"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMC_Notice = sequelize.define(
    "MMC_Notice",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: DataTypes.STRING,
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
      tableName: "MMC_Notice",
      paranoid: true,
    }
  );
  MMC_Notice.associate = function (models) {
    // associations can be defined here
  };
  return MMC_Notice;
};
