// Ce fichier définit les routes d'authentification pour l'API
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes pour l'inscription, la connexion et la gestion du mot de passe
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Export du routeur d'authentification
module.exports = router;
