"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMC_Wish = sequelize.define(
    "MMC_Wish",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: DataTypes.INTEGER,
      targetId: DataTypes.INTEGER,
      categoryId: DataTypes.INTEGER,
      type: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MMC_Wish",
      paranoid: true,
    }
  );
  MMC_Wish.associate = function (models) {
    // associations can be defined here
  };
  return MMC_Wish;
};
