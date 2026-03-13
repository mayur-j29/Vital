const path = require('path');
const express = require('express');
const cors = require('cors');
const { passport } = require('./auth');
const { initDB } = require('./models/db');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api', dataRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Vitál server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});

module.exports = app;