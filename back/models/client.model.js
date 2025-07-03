// Ce fichier définit le modèle Client pour la base de données
module.exports = (sequelize, DataTypes) => {
  // Définition des champs du modèle client
  const Client = sequelize.define('Client', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
    },
  });

  return Client;
};
