'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Products', 'description', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Products', 'description', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  }
};
