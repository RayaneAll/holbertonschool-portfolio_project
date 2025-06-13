const db = require('../models');

const getAllInvoices = async (req, res) => {
  try {
    const invoices = await db.Invoice.findAll({
      include: [
        { model: db.Client },
        {
          model: db.InvoiceItem,
          include: [db.Product],
        },
      ],
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching invoices' });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await db.Invoice.findByPk(req.params.id, {
      include: [
        { model: db.Client },
        {
          model: db.InvoiceItem,
          include: [db.Product],
        },
      ],
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching invoice' });
  }
};

const createInvoice = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { client_id, date, status, items } = req.body;

    // Calcul total
    let total = 0;
    for (const item of items) {
      const product = await db.Product.findByPk(item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      total += product.price * item.quantity;
    }

    const invoice = await db.Invoice.create(
      { clientId: client_id, date, total, status },
      { transaction: t }
    );

    for (const item of items) {
      await db.InvoiceItem.create(
        {
          invoiceId: invoice.id,
          productId: item.product_id,
          quantity: item.quantity,
        },
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({ message: 'Invoice created', invoiceId: invoice.id });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error creating invoice', details: err.message });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
};
