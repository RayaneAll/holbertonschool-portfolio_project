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
