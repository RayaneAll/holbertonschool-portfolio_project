// Ce fichier gère les opérations CRUD et la génération de PDF pour les factures
const db = require('../models');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

// Récupère toutes les factures avec pagination
const getAllInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const total = await db.Invoice.count();
    const rows = await db.Invoice.findAll({
      offset,
      limit,
      order: [['id', 'DESC']],
      include: [
        { model: db.Client },
        { model: db.InvoiceItem },
      ],
    });
    res.json({
      results: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching invoices' });
  }
};

// Récupère une facture par son ID
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

// Met à jour le stock d'un produit de façon sécurisée
async function safeStockUpdate(product, method, field, value, transaction, maxAttempts = 3) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      if (method === 'increment') {
        await product.increment(field, { by: value, transaction });
      } else if (method === 'decrement') {
        await product.decrement(field, { by: value, transaction });
      }
      return;
    } catch (err) {
      if (err.original && err.original.code === 'ER_LOCK_WAIT_TIMEOUT') {
        attempts++;
        await new Promise(res => setTimeout(res, 100));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Impossible de mettre à jour le stock après plusieurs tentatives');
}

// Création d'une nouvelle facture
const createInvoice = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { clientId, date, status, items } = req.body;
    const today = new Date();
    const invoiceDate = new Date(date);
    today.setHours(0,0,0,0);
    invoiceDate.setHours(0,0,0,0);
    if (invoiceDate > today) {
      return res.status(400).json({ error: "La date de facture ne peut pas être dans le futur." });
    }
    const client = await db.Client.findByPk(clientId);
    if (!client) throw new Error(`Client ${clientId} not found`);
    const securedItems = [];
    for (const item of items) {
      const product = await db.Product.findByPk(item.productId, { transaction: t });
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuffisant pour le produit '${product.name}'. Stock disponible : ${product.stock}, demandé : ${item.quantity}` });
      }
      securedItems.push({
        ...item,
        price: product.price,
        productName: product.name,
        productDescription: product.description,
        productPrice: product.price,
        productInstance: product,
      });
    }
    const total = securedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const invoice = await db.Invoice.create(
      {
        ClientId: clientId,
        date,
        total,
        status,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
      },
      { transaction: t }
    );
    for (const item of securedItems) {
      await db.InvoiceItem.create(
        {
          InvoiceId: invoice.id,
          ProductId: item.productId,
          quantity: item.quantity,
          price: item.price,
          productName: item.productName,
          productDescription: item.productDescription,
          productPrice: item.productPrice,
        },
        { transaction: t }
      );
      await safeStockUpdate(item.productInstance, 'decrement', 'stock', item.quantity, t);
    }
    await t.commit();
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

// Suppression d'une facture
const deleteInvoice = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const invoice = await db.Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    await db.InvoiceItem.destroy({
      where: { invoiceId: req.params.id },
      transaction: t,
    });
    await invoice.destroy({ transaction: t });
    await t.commit();
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error deleting invoice', details: err.message });
  }
};

// Mise à jour d'une facture existante
const updateInvoice = async (req, res) => {
  const { id } = req.params;
  const { clientId, date, items } = req.body;
  const t = await db.sequelize.transaction();
  try {
    const today = new Date();
    const invoiceDate = new Date(date);
    today.setHours(0,0,0,0);
    invoiceDate.setHours(0,0,0,0);
    if (invoiceDate > today) {
      return res.status(400).json({ error: "La date de facture ne peut pas être dans le futur." });
    }
    const invoice = await db.Invoice.findByPk(id, { transaction: t });
    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    const client = await db.Client.findByPk(clientId);
    if (!client) throw new Error(`Client ${clientId} not found`);
    const oldItems = await db.InvoiceItem.findAll({ where: { InvoiceId: id }, transaction: t });
    for (const oldItem of oldItems) {
      if (oldItem.ProductId) {
        const product = await db.Product.findByPk(oldItem.ProductId, { transaction: t });
        if (product) {
          await safeStockUpdate(product, 'increment', 'stock', oldItem.quantity, t);
        }
      }
    }
    const securedItems = [];
    for (const item of items) {
      const product = await db.Product.findByPk(item.productId, { transaction: t });
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuffisant pour le produit '${product.name}'. Stock disponible : ${product.stock}, demandé : ${item.quantity}` });
      }
      securedItems.push({
        ...item,
        price: product.price,
        productName: product.name,
        productDescription: product.description,
        productPrice: product.price,
        productInstance: product,
      });
    }
    const total = securedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await invoice.update({
      ClientId: clientId,
      date,
      total,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
    }, { transaction: t });
    await db.InvoiceItem.destroy({ where: { InvoiceId: id }, transaction: t });
    for (const item of securedItems) {
      await db.InvoiceItem.create({
        InvoiceId: invoice.id,
        ProductId: item.productId,
        quantity: item.quantity,
        price: item.price,
        productName: item.productName,
        productDescription: item.productDescription,
        productPrice: item.productPrice,
      }, { transaction: t });
      await safeStockUpdate(item.productInstance, 'decrement', 'stock', item.quantity, t);
    }
    await t.commit();
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
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la facture" });
  }
};

// Génération PDF d'une facture
const downloadInvoicePDF = async (req, res) => {
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

    // Template HTML moderne (tu pourras l'améliorer à volonté)
    const html = `
      <html>
      <head>
        <meta charset='utf-8'>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f7f9fb; }
          .container { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 32px; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1976d2; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 2rem; font-weight: bold; color: #1976d2; letter-spacing: 2px; }
          .title { font-size: 1.5rem; color: #333; }
          .info { margin-bottom: 24px; }
          .info strong { color: #1976d2; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th, td { padding: 10px 8px; border-bottom: 1px solid #e0e0e0; text-align: left; }
          th { background: #1976d2; color: #fff; font-weight: 600; }
          .total { font-size: 1.2rem; font-weight: bold; color: #1976d2; text-align: right; }
          .footer { font-size: 0.9rem; color: #888; text-align: center; margin-top: 32px; }
        </style>
      </head>
      <body>
        <div class='container'>
          <div class='header'>
            <div class='logo'>ERP System</div>
            <div class='title'>Facture n°${invoice.id}</div>
          </div>
          <div class='info'>
            <div><strong>Date :</strong> ${new Date(invoice.date).toLocaleDateString()}</div>
            <div><strong>Client :</strong> ${invoice.clientName || invoice.Client?.name || ''}</div>
            <div><strong>Email :</strong> ${invoice.clientEmail || invoice.Client?.email || ''}</div>
            <div><strong>Téléphone :</strong> ${invoice.clientPhone || invoice.Client?.phone || ''}</div>
            <div><strong>Statut :</strong> ${invoice.status === 'pending' ? 'En attente' : (invoice.status || 'N/A')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.InvoiceItems.map(item => `
                <tr>
                  <td>${item.productName || item.Product?.name || ''}</td>
                  <td>${item.productDescription || item.Product?.description || ''}</td>
                  <td>${item.quantity}</td>
                  <td>${item.productPrice !== undefined ? item.productPrice : item.price} €</td>
                  <td>${(item.quantity * (item.productPrice !== undefined ? item.productPrice : item.price)).toFixed(2)} €</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class='total'>Total : ${invoice.total.toFixed(2)} €</div>
          <div class='footer'>Document généré par ERP System • ${new Date().toLocaleDateString()}</div>
        </div>
      </body>
      </html>
    `;

    // Génération du PDF avec puppeteer
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture_${invoice.id}.pdf"`
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Erreur génération PDF :', err);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
};

// Envoi de la facture par email au client
const sendInvoiceEmail = async (req, res) => {
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
    if (!invoice) return res.status(404).json({ error: 'Facture non trouvée' });
    const clientEmail = invoice.clientEmail || invoice.Client?.email;
    if (!clientEmail) return res.status(400).json({ error: 'Le client n\'a pas d\'email.' });

    // Génération du PDF (on réutilise le template de downloadInvoicePDF)
    const html = `
      <html>
      <head>
        <meta charset='utf-8'>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f7f9fb; }
          .container { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 32px; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1976d2; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 2rem; font-weight: bold; color: #1976d2; letter-spacing: 2px; }
          .title { font-size: 1.5rem; color: #333; }
          .info { margin-bottom: 24px; }
          .info strong { color: #1976d2; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th, td { padding: 10px 8px; border-bottom: 1px solid #e0e0e0; text-align: left; }
          th { background: #1976d2; color: #fff; font-weight: 600; }
          .total { font-size: 1.2rem; font-weight: bold; color: #1976d2; text-align: right; }
          .footer { font-size: 0.9rem; color: #888; text-align: center; margin-top: 32px; }
        </style>
      </head>
      <body>
        <div class='container'>
          <div class='header'>
            <div class='logo'>ERP System</div>
            <div class='title'>Facture n°${invoice.id}</div>
          </div>
          <div class='info'>
            <div><strong>Date :</strong> ${new Date(invoice.date).toLocaleDateString()}</div>
            <div><strong>Client :</strong> ${invoice.clientName || invoice.Client?.name || ''}</div>
            <div><strong>Email :</strong> ${invoice.clientEmail || invoice.Client?.email || ''}</div>
            <div><strong>Téléphone :</strong> ${invoice.clientPhone || invoice.Client?.phone || ''}</div>
            <div><strong>Statut :</strong> ${invoice.status === 'pending' ? 'En attente' : (invoice.status || 'N/A')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.InvoiceItems.map(item => `
                <tr>
                  <td>${item.productName || item.Product?.name || ''}</td>
                  <td>${item.productDescription || item.Product?.description || ''}</td>
                  <td>${item.quantity}</td>
                  <td>${item.productPrice !== undefined ? item.productPrice : item.price} €</td>
                  <td>${(item.quantity * (item.productPrice !== undefined ? item.productPrice : item.price)).toFixed(2)} €</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class='total'>Total : ${invoice.total.toFixed(2)} €</div>
          <div class='footer'>Document généré par ERP System • ${new Date().toLocaleDateString()}</div>
        </div>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Config Nodemailer (Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Envoi de l'email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: clientEmail,
      subject: `Votre facture n°${invoice.id}`,
      html: `<p>Bonjour,<br>Veuillez trouver ci-joint votre facture n°${invoice.id}.<br><br>Cordialement,<br>L'équipe ERP System</p>`,
      attachments: [
        {
          filename: `facture_${invoice.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    res.status(200).json({ message: 'Facture envoyée au client avec succès.' });
  } catch (err) {
    console.error('Erreur envoi facture email :', err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la facture.' });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
  updateInvoice,
  downloadInvoicePDF,
  sendInvoiceEmail,
};
