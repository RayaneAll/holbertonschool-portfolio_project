// Ce fichier définit les routes pour la gestion des clients
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authenticateToken = require('../middlewares/authMiddleware');

// Routes CRUD sécurisées pour les clients
router.get('/', authenticateToken, clientController.getAllClients);
router.post('/', authenticateToken, clientController.createClient);
router.get('/:id', authenticateToken, clientController.getClientById);
router.put('/:id', authenticateToken, clientController.updateClient);
router.delete('/:id', authenticateToken, clientController.deleteClient);
router.get('/:id/statement/pdf', authenticateToken, clientController.downloadClientStatementPDF);
router.post('/:id/statement/send-email', authenticateToken, clientController.sendClientStatementEmail);

// Export du routeur client
module.exports = router;
