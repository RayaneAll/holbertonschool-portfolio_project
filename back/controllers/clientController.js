const db = require('../models');

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

module.exports = {
  getAllClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
};
