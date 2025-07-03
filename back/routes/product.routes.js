// Ce fichier définit les routes pour la gestion des produits
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authenticateToken = require('../middlewares/authMiddleware');

// Routes CRUD sécurisées pour les produits
router.get('/', authenticateToken, productController.getAllProducts);
router.post('/', authenticateToken, productController.createProduct);
router.get('/:id', authenticateToken, productController.getProductById);
router.put('/:id', authenticateToken, productController.updateProduct);
router.delete('/:id', authenticateToken, productController.deleteProduct);

// Export du routeur produit
module.exports = router;
