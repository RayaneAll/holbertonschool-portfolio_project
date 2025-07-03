// Ce fichier définit le modèle InvoiceItem pour la base de données
module.exports = (sequelize, DataTypes) => {
  // Définition des champs du modèle ligne de facture
  const InvoiceItem = sequelize.define('InvoiceItem', {
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    productPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  });

  return InvoiceItem;
};
