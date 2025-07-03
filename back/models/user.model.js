// Ce fichier définit le modèle User pour la base de données
module.exports = (sequelize, DataTypes) => {
  // Définition des champs du modèle utilisateur
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user',
    },
  });

  return User;
};
