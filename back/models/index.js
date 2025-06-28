const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Imports des modèles
const User = require('./user.model')(sequelize, DataTypes);
const Client = require('./client.model')(sequelize, DataTypes);
const Product = require('./product.model')(sequelize, DataTypes);
const Invoice = require('./invoice.model')(sequelize, DataTypes);
const InvoiceItem = require('./invoiceItem.model')(sequelize, DataTypes);
const PasswordResetToken = require('./passwordResetToken.model')(sequelize, DataTypes);

// Relations
Client.hasMany(Invoice);
Invoice.belongsTo(Client);

Invoice.hasMany(InvoiceItem);
InvoiceItem.belongsTo(Invoice);

Product.hasMany(InvoiceItem);
InvoiceItem.belongsTo(Product);

User.hasMany(PasswordResetToken);
PasswordResetToken.belongsTo(User);

const db = {
  sequelize,
  Sequelize: sequelize,
  User,
  Client,
  Product,
  Invoice,
  InvoiceItem,
  PasswordResetToken,
};

module.exports = db;
