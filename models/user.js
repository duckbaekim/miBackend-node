module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "incar_user",
    {
      id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.STRING(100)
      },
      user_pw: {
        type: DataTypes.STRING(100)
      },
      level: {
        type: DataTypes.STRING(100)
      },
      name: {
        type: DataTypes.STRING(100)
      }
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
      freezeTableName: true
    }
  );
};
