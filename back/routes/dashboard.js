const express = require('express');
const router = express.Router();
const { Client, Product, Invoice } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const totalClients = await Client.count();
    const totalProducts = await Product.count();
    const totalInvoices = await Invoice.count();
    const totalRevenue = await Invoice.sum('total') || 0;

    res.json({
      totalClients,
      totalProducts,
      totalInvoices,
      totalRevenue,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du chargement des statistiques' });
  }
});

module.exports = router;
