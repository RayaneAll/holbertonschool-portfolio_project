// Ce fichier définit le modèle Product pour la base de données
module.exports = (sequelize, DataTypes) => {
  // Définition des champs du modèle produit
  const Product = sequelize.define('Product', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  return Product;
};
