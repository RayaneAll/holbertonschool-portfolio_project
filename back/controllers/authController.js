const bcrypt = require('bcrypt');
const db = require('../models');
const jwt = require('jsonwebtoken');

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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier que les champs sont remplis
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Chercher l’utilisateur
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Comparer les mots de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { register, login };
