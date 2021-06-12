"use strict";
module.exports = (sequelize, DataTypes) => {
  const MMA_GoodsCategory = sequelize.define(
    "MMA_GoodsCategory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      categoryId: DataTypes.INTEGER,
      seq: DataTypes.INTEGER,
      goodsCategoryName: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      underscored: false,
      freezeTableName: true,
      tableName: "MMA_GoodsCategory",
      paranoid: true,
    }
  );
  MMA_GoodsCategory.associate = function (models) {
    // associations can be defined here
    MMA_GoodsCategory.belongsTo(models.MMC_Review, {
      foreignKey: "goodsCategoryId",
    });
  };
  return MMA_GoodsCategory;
};
