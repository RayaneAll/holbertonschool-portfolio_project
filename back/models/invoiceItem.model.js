module.exports = (sequelize, DataTypes) => {
  const InvoiceItem = sequelize.define('InvoiceItem', {
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return InvoiceItem;
};
