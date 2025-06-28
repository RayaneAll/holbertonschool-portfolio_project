const bcrypt = require('bcrypt');
const db = require('../models');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation simple
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Vérifie si l'utilisateur existe déjà
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

    // Chercher l'utilisateur
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

// Config Nodemailer (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Endpoint pour demander un reset de mot de passe
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis' });
  const user = await db.User.findOne({ where: { email } });
  // Toujours répondre OK pour ne pas révéler si l'email existe
  if (!user) return res.status(200).json({ message: 'Si un compte existe, un email a été envoyé.' });

  // Génère un token sécurisé
  const token = uuidv4();
  const expiration = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await db.PasswordResetToken.create({ token, expiration, UserId: user.id });

  // Lien de reset (à adapter selon ton frontend)
  const resetLink = `http://localhost:5173/reset-password?token=${token}`;

  // Envoi de l'email
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `<p>Bonjour,<br>Vous avez demandé à réinitialiser votre mot de passe.<br>
      Cliquez sur ce lien pour choisir un nouveau mot de passe :<br>
      <a href="${resetLink}">${resetLink}</a><br><br>
      Ce lien expirera dans 1 heure.<br><br>
      Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`
  });

  return res.status(200).json({ message: 'Si un compte existe, un email a été envoyé.' });
};

// Endpoint pour réinitialiser le mot de passe
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
  const resetToken = await db.PasswordResetToken.findOne({ where: { token }, include: db.User });
  if (!resetToken || resetToken.expiration < new Date()) {
    return res.status(400).json({ message: 'Token invalide ou expiré' });
  }
  const user = resetToken.User;
  if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });
  // Hash du nouveau mot de passe
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  await user.update({ password_hash: hashedPassword });
  // Invalide le token
  await resetToken.destroy();
  return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
};

module.exports = { register, login, forgotPassword, resetPassword };
