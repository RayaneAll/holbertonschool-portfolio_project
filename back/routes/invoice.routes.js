// Ce fichier définit les routes pour la gestion des factures
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authenticateToken = require('../middlewares/authMiddleware');

// Routes CRUD sécurisées pour les factures
router.get('/', authenticateToken, invoiceController.getAllInvoices);
router.get('/:id', authenticateToken, invoiceController.getInvoiceById);
router.post('/', authenticateToken, invoiceController.createInvoice);
router.delete('/:id', authenticateToken, invoiceController.deleteInvoice);
router.put('/:id', authenticateToken, invoiceController.updateInvoice);
router.get('/:id/pdf', authenticateToken, invoiceController.downloadInvoicePDF);
router.post('/:id/send-email', authenticateToken, invoiceController.sendInvoiceEmail);

// Export du routeur facture
module.exports = router;
