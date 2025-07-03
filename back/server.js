// Ce fichier démarre le serveur Express principal
const app = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3001;

const db = require('./models');

// db.sequelize.sync({ alter: true })
//   .then(() => {
//     console.log('Database synced');
//     app.listen(PORT, () => {
//       console.log(`Server running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error('Error syncing database:', err);
//   });

// Lancement du serveur sur le port défini
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
