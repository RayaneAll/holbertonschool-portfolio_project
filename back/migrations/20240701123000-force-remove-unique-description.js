'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Supprime toutes les contraintes uniques connues sur description
    await queryInterface.removeConstraint('Products', 'products_description_key').catch(() => {});
    await queryInterface.removeConstraint('Products', 'unique_product_description').catch(() => {});
    // Force le champ à ne plus être unique
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