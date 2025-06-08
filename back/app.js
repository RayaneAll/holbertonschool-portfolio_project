const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.send('🚀 Backend ERP is running');
});

module.exports = app;
