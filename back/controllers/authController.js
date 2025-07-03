// Ce fichier gère l'authentification des utilisateurs et la gestion des mots de passe
const bcrypt = require('bcrypt');
const db = require('../models');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

// Inscription d'un nouvel utilisateur
const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
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

// Connexion d'un utilisateur existant
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
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

// Configuration de l'envoi d'email pour le reset de mot de passe
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Demande de réinitialisation de mot de passe
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis' });
  const user = await db.User.findOne({ where: { email } });
  if (!user) return res.status(200).json({ message: 'Si un compte existe, un email a été envoyé.' });
  const token = uuidv4();
  const expiration = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await db.PasswordResetToken.create({ token, expiration, UserId: user.id });
  const resetLink = `http://localhost:5173/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `<p>Bonjour,<br>Vous avez demandé à réinitialiser votre mot de passe.<br>
      Cliquez sur ce lien pour choisir un nouveau mot de passe
:<br>
      <a href="${resetLink}">${resetLink}</a><br><br>
      Ce lien expirera dans 1 heure.<br><br>
      Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`
  });
  return res.status(200).json({ message: 'Si un compte existe, un email a été envoyé.' });
};

// Réinitialisation du mot de passe via le token
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
  const resetToken = await db.PasswordResetToken.findOne({ where: { token }, include: db.User });
  if (!resetToken || resetToken.expiration < new Date()) {
    return res.status(400).json({ message: 'Token invalide ou expiré' });
  }
  const user = resetToken.User;
  if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  await user.update({ password_hash: hashedPassword });
  await resetToken.destroy();
  return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
};

// Export des fonctions d'authentification
module.exports = { register, login, forgotPassword, resetPassword };
