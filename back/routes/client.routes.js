const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authenticateToken = require('../middlewares/authMiddleware');

// CRUD sécurisé
router.get('/', authenticateToken, clientController.getAllClients);
router.post('/', authenticateToken, clientController.createClient);
router.get('/:id', authenticateToken, clientController.getClientById);
router.put('/:id', authenticateToken, clientController.updateClient);
router.delete('/:id', authenticateToken, clientController.deleteClient);
router.get('/:id/statement/pdf', authenticateToken, clientController.downloadClientStatementPDF);

module.exports = router;
