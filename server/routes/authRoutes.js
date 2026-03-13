const express = require('express');
const bcrypt = require('bcrypt');
const { passport, generateToken } = require('../auth');
const db = require('../models/db');
const protect = require('../middleware/protect');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const existing = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    if (existing.rows[0]) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      args: [name, email, password_hash]
    });

    const user = { id: Number(result.lastInsertRowid), name, email };
    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info?.message || 'Invalid credentials' });
    }
    const { id, name, email } = user;
    const token = generateToken(user);
    res.json({ token, user: { id, name, email } });
  })(req, res, next);
});

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;