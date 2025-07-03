// Ce fichier définit le modèle Invoice pour la base de données
module.exports = (sequelize, DataTypes) => {
  // Définition des champs du modèle facture
  const Invoice = sequelize.define('Invoice', {
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    clientPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return Invoice;
};
