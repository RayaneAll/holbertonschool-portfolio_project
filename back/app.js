const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');
const authenticateToken = require('./middlewares/authMiddleware');
const clientRoutes = require('./routes/client.routes');
const productRoutes = require('./routes/product.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/clients', clientRoutes);
app.use('/products', productRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/dashboard', dashboardRoutes);

// Route de test
app.get('/', (req, res) => {
  res.send('Backend ERP is running');
});

app.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'Route protégée accessible',
    user: req.user,
  });
});

module.exports = app;
