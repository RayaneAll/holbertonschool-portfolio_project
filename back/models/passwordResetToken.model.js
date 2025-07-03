// Ce fichier définit le modèle PasswordResetToken pour la base de données
module.exports = (sequelize, DataTypes) => {
  // Définition des champs du modèle token de réinitialisation
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

  // Association avec le modèle User
  PasswordResetToken.associate = (models) => {
    PasswordResetToken.belongsTo(models.User);
  };

  return PasswordResetToken;
}; 