const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const User = require('./user.model')(sequelize, DataTypes);

const db = {
  sequelize,
  Sequelize: sequelize,
  User,
};

module.exports = db;
