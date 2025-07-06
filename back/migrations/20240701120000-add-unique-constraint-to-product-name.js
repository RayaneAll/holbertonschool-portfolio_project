'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('Products', {
      fields: ['name'],
      type: 'unique',
      name: 'unique_product_name'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Products', 'unique_product_name');
  }
}; 