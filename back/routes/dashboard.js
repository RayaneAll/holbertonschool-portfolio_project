const express = require('express');
const router = express.Router();
const { Client, Product, Invoice } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');
const { Op, fn, col, literal } = require('sequelize');
const { addMonths, format } = require('date-fns');

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

// Route pour le CA par mois (12 derniers mois)
router.get('/stats/monthly', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Group by year-month
    const results = await Invoice.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('date'), '%Y-%m'), 'month'],
        [fn('sum', col('total')), 'total']
      ],
      where: {
        date: { [Op.gte]: start }
      },
      group: [literal('month')],
      order: [[literal('month'), 'ASC']]
    });

    const monthlyData = [];
    for (let i = 0; i < 12; i++) {
      const d = addMonths(start, i);
      const monthStr = format(d, 'yyyy-MM');
      const found = results.find(r => r.get('month') === monthStr);
      monthlyData.push({
        month: monthStr,
        total: found ? parseFloat(found.get('total')) : 0
      });
    }
    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du chargement du CA mensuel' });
  }
});

module.exports = router;
