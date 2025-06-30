const db = require('../models');

const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Product.findAndCountAll({ offset, limit, order: [['id', 'ASC']] });
    res.json({
      results: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      limit
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching products' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const product = await db.Product.create({ name, description, price, stock });
    res.status(201).json(product);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: "Un produit avec cette description existe déjà." });
    }
    res.status(500).json({ error: 'Error creating product' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await db.Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await db.Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { name, description, price, stock } = req.body;
    await product.update({ name, description, price, stock });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Error updating product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await db.Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting product' });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
