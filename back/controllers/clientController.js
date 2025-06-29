const db = require('../models');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

const getAllClients = async (req, res) => {
  try {
    const clients = await db.Client.findAll();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching clients' });
  }
};

const createClient = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const client = await db.Client.create({ name, email, phone });
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: 'Error creating client' });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await db.Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching client' });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await db.Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const { name, email, phone } = req.body;
    await client.update({ name, email, phone });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Error updating client' });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await db.Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    await client.destroy();
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting client' });
  }
};

// Génération PDF du relevé de compte client
const downloadClientStatementPDF = async (req, res) => {
  try {
    const client = await db.Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Récupère toutes les factures du client avec leurs items
    const invoices = await db.Invoice.findAll({
      where: { ClientId: client.id },
      order: [['date', 'ASC']],
      include: [{ model: db.InvoiceItem }],
    });

    const totalFactures = invoices.reduce((sum, inv) => sum + inv.total, 0);

    // Template HTML moderne avec détails de chaque facture
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
          .facture-block { margin-bottom: 32px; border-bottom: 1px solid #e0e0e0; padding-bottom: 16px; }
          .facture-title { font-size: 1.1rem; color: #1976d2; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class='container'>
          <div class='header'>
            <div class='logo'>ERP System</div>
            <div class='title'>Relevé de compte client</div>
          </div>
          <div class='info'>
            <div><strong>Client :</strong> ${client.name}</div>
            <div><strong>Email :</strong> ${client.email || ''}</div>
            <div><strong>Téléphone :</strong> ${client.phone || ''}</div>
          </div>
          ${invoices.length === 0 ? `<div style='color:#888;text-align:center;margin:32px 0;'>Aucune facture</div>` : invoices.map(inv => `
            <div class='facture-block'>
              <div class='facture-title'>Facture n°${inv.id} — ${new Date(inv.date).toLocaleDateString()} — ${inv.total.toFixed(2)} € — ${inv.status || 'N/A'}</div>
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
                  ${inv.InvoiceItems.map(item => `
                    <tr>
                      <td>${item.productName}</td>
                      <td>${item.productDescription || ''}</td>
                      <td>${item.quantity}</td>
                      <td>${item.productPrice !== undefined ? item.productPrice : item.price} €</td>
                      <td>${(item.quantity * (item.productPrice !== undefined ? item.productPrice : item.price)).toFixed(2)} €</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
          <div class='total'>Total facturé : ${totalFactures.toFixed(2)} €</div>
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
      'Content-Disposition': `attachment; filename="releve_client_${client.id}.pdf"`
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Erreur génération relevé PDF :', err);
    res.status(500).json({ error: 'Erreur lors de la génération du relevé PDF' });
  }
};

// Envoi du relevé de compte par email au client
const sendClientStatementEmail = async (req, res) => {
  try {
    const client = await db.Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client non trouvé' });
    
    if (!client.email) return res.status(400).json({ error: 'Le client n\'a pas d\'email.' });

    // Récupère toutes les factures du client avec leurs items
    const invoices = await db.Invoice.findAll({
      where: { ClientId: client.id },
      order: [['date', 'ASC']],
      include: [{ model: db.InvoiceItem }],
    });

    const totalFactures = invoices.reduce((sum, inv) => sum + inv.total, 0);

    // Template HTML moderne avec détails de chaque facture
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
          .facture-block { margin-bottom: 32px; border-bottom: 1px solid #e0e0e0; padding-bottom: 16px; }
          .facture-title { font-size: 1.1rem; color: #1976d2; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class='container'>
          <div class='header'>
            <div class='logo'>ERP System</div>
            <div class='title'>Relevé de compte client</div>
          </div>
          <div class='info'>
            <div><strong>Client :</strong> ${client.name}</div>
            <div><strong>Email :</strong> ${client.email || ''}</div>
            <div><strong>Téléphone :</strong> ${client.phone || ''}</div>
          </div>
          ${invoices.length === 0 ? `<div style='color:#888;text-align:center;margin:32px 0;'>Aucune facture</div>` : invoices.map(inv => `
            <div class='facture-block'>
              <div class='facture-title'>Facture n°${inv.id} — ${new Date(inv.date).toLocaleDateString()} — ${inv.total.toFixed(2)} € — ${inv.status || 'N/A'}</div>
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
                  ${inv.InvoiceItems.map(item => `
                    <tr>
                      <td>${item.productName}</td>
                      <td>${item.productDescription || ''}</td>
                      <td>${item.quantity}</td>
                      <td>${item.productPrice !== undefined ? item.productPrice : item.price} €</td>
                      <td>${(item.quantity * (item.productPrice !== undefined ? item.productPrice : item.price)).toFixed(2)} €</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
          <div class='total'>Total facturé : ${totalFactures.toFixed(2)} €</div>
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
      to: client.email,
      subject: `Votre relevé de compte - ${client.name}`,
      html: `<p>Bonjour ${client.name},<br><br>Veuillez trouver ci-joint votre relevé de compte complet.<br><br>Cordialement,<br>L'équipe ERP System</p>`,
      attachments: [
        {
          filename: `releve_compte_${client.name}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    res.status(200).json({ message: 'Relevé de compte envoyé au client avec succès.' });
  } catch (err) {
    console.error('Erreur envoi relevé email :', err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du relevé de compte.' });
  }
};

module.exports = {
  getAllClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
  downloadClientStatementPDF,
  sendClientStatementEmail,
};
