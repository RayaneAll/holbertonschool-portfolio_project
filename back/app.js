const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');
const authenticateToken = require('./middlewares/authMiddleware');
const clientRoutes = require('./routes/client.routes');
const productRoutes = require('./routes/product.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/clients', clientRoutes);
app.use('/products', productRoutes);

// Route de test
app.get('/', (req, res) => {
  res.send('🚀 Backend ERP is running');
});

app.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'Route protégée accessible',
    user: req.user, // contient id, email, role
  });
});

module.exports = app;
