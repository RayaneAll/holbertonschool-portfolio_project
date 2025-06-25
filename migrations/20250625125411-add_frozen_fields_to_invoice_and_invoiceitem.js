'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // Ajout des champs figés au modèle Invoice
    await queryInterface.addColumn("Invoices", "clientName", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("Invoices", "clientEmail", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Invoices", "clientPhone", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Ajout des champs figés au modèle InvoiceItem
    await queryInterface.addColumn("InvoiceItems", "productName", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("InvoiceItems", "productDescription", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("InvoiceItems", "productPrice", {
      type: Sequelize.FLOAT,
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // Suppression des champs ajoutés
    await queryInterface.removeColumn("Invoices", "clientName");
    await queryInterface.removeColumn("Invoices", "clientEmail");
    await queryInterface.removeColumn("Invoices", "clientPhone");
    await queryInterface.removeColumn("InvoiceItems", "productName");
    await queryInterface.removeColumn("InvoiceItems", "productDescription");
    await queryInterface.removeColumn("InvoiceItems", "productPrice");
  }
};
