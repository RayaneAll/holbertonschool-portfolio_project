'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Clients', 'email', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
    });
    await queryInterface.changeColumn('Clients', 'phone', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Clients', 'email', {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    });
    await queryInterface.changeColumn('Clients', 'phone', {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true,
    });
  }
};
