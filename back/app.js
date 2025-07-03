// Ce fichier configure et lance l'application Express pour le backend
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');
const authenticateToken = require('./middlewares/authMiddleware');
const clientRoutes = require('./routes/client.routes');
const productRoutes = require('./routes/product.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const dashboardRoutes = require('./routes/dashboard');

// Création de l'application Express
const app = express();

// Ajout des middlewares de sécurité et de gestion des routes
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/clients', clientRoutes);
app.use('/products', productRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/dashboard', dashboardRoutes);

// Route de test pour vérifier que le backend fonctionne
app.get('/', (req, res) => {
  res.send('Backend ERP is running');
});

// Route protégée nécessitant une authentification
app.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'Route protégée accessible',
    user: req.user,
  });
});

// Export de l'application pour l'utiliser dans server.js
module.exports = app;
