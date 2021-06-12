"use strict";
module.exports = (sequelize, DataTypes) => {
  const MM_Order = sequelize.define(
    "MM_Order",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: DataTypes.STRING,
      accountId: DataTypes.INTEGER,
      companyId: DataTypes.INTEGER,
      goodsId: DataTypes.INTEGER,
      categoryId: DataTypes.INTEGER,
      goodsCategoryId: DataTypes.INTEGER,
      workId: DataTypes.INTEGER,
      reviewId: DataTypes.INTEGER,
      reservationName: DataTypes.STRING,
      reservationPhone: DataTypes.STRING,
      goodsOption: DataTypes.STRING,
      optionPrice: DataTypes.INTEGER,
      goodsPrice: DataTypes.INTEGER,
      sale: DataTypes.INTEGER,
      totalPrice: DataTypes.INTEGER,
      accountCancel: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MM_Order",
      paranoid: true,
    }
  );
  MM_Order.associate = function (models) {
    // associations can be defined here
    MM_Order.hasOne(models.MMC_Review, {
      sourceKey: "reviewId",
      foreignKey: "id",
    });
  };
  return MM_Order;
};
