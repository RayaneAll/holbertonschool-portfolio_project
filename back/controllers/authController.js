const bcrypt = require('bcrypt');
const db = require('../models');

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation simple
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Vérifie si l’utilisateur existe déjà
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash du mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Création en base
    const newUser = await db.User.create({
      email,
      password_hash: hashedPassword,
    });

    return res.status(201).json({ message: 'User created', userId: newUser.id });
  } catch (err) {
    console.error('Error in register:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { register };
