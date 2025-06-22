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
    const { clientId, date, status, items } = req.body;

    // Recréer les items avec le prix sécurisé de la DB
    const securedItems = [];
    for (const item of items) {
      const product = await db.Product.findByPk(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      securedItems.push({
        ...item,
        price: product.price, // Utilise le prix de la DB
      });
    }

    // Calcul total avec les prix sécurisés
    const total = securedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const invoice = await db.Invoice.create(
      { ClientId: clientId, date, total, status },
      { transaction: t }
    );

    for (const item of securedItems) {
      await db.InvoiceItem.create(
        {
          InvoiceId: invoice.id,
          ProductId: item.productId,
          quantity: item.quantity,
          price: item.price, // Sauvegarde le prix sécurisé
        },
        { transaction: t }
      );
    }

    await t.commit();

    // Recharge la facture complète avec les associations
    const createdInvoice = await db.Invoice.findByPk(invoice.id, {
      include: [
        { model: db.Client },
        {
          model: db.InvoiceItem,
          include: [db.Product],
        },
      ],
    });

    res.status(201).json(createdInvoice);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error creating invoice', details: err.message });
  }
};

const deleteInvoice = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const invoice = await db.Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Supprime d'abord les lignes de facture (InvoiceItems)
    await db.InvoiceItem.destroy({
      where: { invoiceId: req.params.id },
      transaction: t,
    });

    // Ensuite, supprime la facture elle-même
    await invoice.destroy({ transaction: t });

    await t.commit();
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error deleting invoice', details: err.message });
  }
};

const updateInvoice = async (req, res) => {
  const { id } = req.params;
  const { clientId, date, items } = req.body;
  const t = await db.sequelize.transaction();

  try {
    const invoice = await db.Invoice.findByPk(id, { transaction: t });
    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ message: 'Facture non trouvée' });
    }

    // Recréer les items avec le prix sécurisé de la DB
    const securedItems = [];
    for (const item of items) {
      const product = await db.Product.findByPk(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      securedItems.push({
        ...item,
        price: product.price, // Utilise le prix de la DB
      });
    }

    // Calculer le nouveau total avec les prix sécurisés
    const total = securedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Mettre à jour la facture
    await invoice.update({ ClientId: clientId, date, total }, { transaction: t });

    // Supprimer les anciens items
    await db.InvoiceItem.destroy({ where: { InvoiceId: id }, transaction: t });

    // Ajouter les nouveaux items (sécurisés)
    const invoiceItems = securedItems.map(item => ({
      InvoiceId: invoice.id,
      ProductId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));
    await db.InvoiceItem.bulkCreate(invoiceItems, { transaction: t });

    await t.commit();

    // Récupérer et renvoyer la facture mise à jour avec les associations
    const updatedInvoice = await db.Invoice.findByPk(id, {
      include: [
        {
          model: db.Client,
        },
        {
          model: db.InvoiceItem,
          include: [db.Product],
        },
      ],
    });

    res.status(200).json(updatedInvoice);

  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la facture" });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
  updateInvoice,
};
