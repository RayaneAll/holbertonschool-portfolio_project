module.exports = (sequelize, DataTypes) => {
  const PasswordResetToken = sequelize.define('PasswordResetToken', {
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiration: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  PasswordResetToken.associate = (models) => {
    PasswordResetToken.belongsTo(models.User);
  };

  return PasswordResetToken;
}; 