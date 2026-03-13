const express = require('express');
const bcrypt = require('bcrypt');
const { passport, generateToken } = require('../auth');
const db = require('../models/db');
const protect = require('../middleware/protect');

const router = express.Router();

const createUserStmt = db.prepare(`
  INSERT INTO users (name, email, password_hash)
  VALUES (@name, @email, @password_hash)
`);

const findUserByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?');

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const existing = findUserByEmailStmt.get(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const password_hash = bcrypt.hashSync(password, 12);
    const info = createUserStmt.run({ name, email, password_hash });
    const user = { id: info.lastInsertRowid, name, email };

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

