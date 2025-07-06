'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Products', 'products_description_key').catch(() => {});
    await queryInterface.removeConstraint('Products', 'unique_product_description').catch(() => {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('Products', {
      fields: ['description'],
      type: 'unique',
      name: 'unique_product_description'
    });
  }
}; 