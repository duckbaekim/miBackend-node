"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMC_Goods = sequelize.define(
    "MMC_Goods",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      companyId: DataTypes.INTEGER,
      categoryId: DataTypes.INTEGER,
      goodsCategoryId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      price: DataTypes.INTEGER,
      sale: DataTypes.INTEGER,
      useTime: DataTypes.STRING,
      context: DataTypes.STRING,
      addPriceOption: DataTypes.STRING,
      option: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MMC_Goods",
      paranoid: true,
    }
  );
  MMC_Goods.associate = function (models) {
    // associations can be defined here
  };
  return MMC_Goods;
};
