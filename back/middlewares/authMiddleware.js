// Ce fichier contient le middleware d'authentification JWT
const jwt = require('jsonwebtoken');

// Vérifie la présence et la validité du token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Format attendu : "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, userData) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Ajoute les données du token à la requête
    req.user = userData;
    next();
  });
};

// Export du middleware d'authentification
module.exports = authenticateToken;
