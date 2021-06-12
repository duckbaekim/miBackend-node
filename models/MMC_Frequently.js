"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMC_Frequently = sequelize.define(
    "MMC_Frequently",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: DataTypes.STRING,
      categoryId: DataTypes.INTEGER,
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
      tableName: "MMC_Frequently",
      paranoid: true,
    }
  );
  MMC_Frequently.associate = function (models) {
    // associations can be defined here
  };
  return MMC_Frequently;
};
