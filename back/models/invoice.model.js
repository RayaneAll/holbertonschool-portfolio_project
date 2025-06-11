module.exports = (sequelize, DataTypes) => {
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
  });

  return Invoice;
};
