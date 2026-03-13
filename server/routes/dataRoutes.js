const express = require('express');
const db = require('../models/db');
const protect = require('../middleware/protect');

const router = express.Router();

router.use(protect);

// GOALS
router.get('/goals', (req, res) => {
  const stmt = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC');
  const goals = stmt.all(req.user.id);
  res.json({ goals });
});

router.post('/goals', (req, res) => {
  const { title, category, description, deadline } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  const stmt = db.prepare(`
    INSERT INTO goals (user_id, title, category, deadline, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(req.user.id, title, category || null, deadline || null, description || null);
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ goal });
});

router.patch('/goals/:id', (req, res) => {
  const { id } = req.params;
  const { is_completed } = req.body;
  const stmt = db.prepare(`
    UPDATE goals SET is_completed = COALESCE(@is_completed, is_completed)
    WHERE id = @id AND user_id = @user_id
  `);
  const info = stmt.run({ id, user_id: req.user.id, is_completed });
  if (info.changes === 0) {
    return res.status(404).json({ message: 'Goal not found' });
  }
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  res.json({ goal });
});

router.delete('/goals/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?');
  const info = stmt.run(id, req.user.id);
  if (info.changes === 0) {
    return res.status(404).json({ message: 'Goal not found' });
  }
  res.status(204).end();
});

// LOGS
router.get('/logs', (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: 'date query param is required (YYYY-MM-DD)' });
  }
  const stmt = db.prepare(
    'SELECT * FROM daily_logs WHERE user_id = ? AND log_date = ? ORDER BY created_at DESC'
  );
  const logs = stmt.all(req.user.id, date);
  res.json({ logs });
});

router.post('/logs', (req, res) => {
  const { log_date, category, label, value, note } = req.body;
  if (!log_date || !category || !label) {
    return res.status(400).json({ message: 'log_date, category, and label are required' });
  }
  const stmt = db.prepare(`
    INSERT INTO daily_logs (user_id, log_date, category, label, value, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    req.user.id,
    log_date,
    category,
    label,
    value != null ? value : null,
    note || null
  );
  const log = db.prepare('SELECT * FROM daily_logs WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ log });
});

router.delete('/logs/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM daily_logs WHERE id = ? AND user_id = ?');
  const info = stmt.run(id, req.user.id);
  if (info.changes === 0) {
    return res.status(404).json({ message: 'Log not found' });
  }
  res.status(204).end();
});

// EXPENSES
router.get('/expenses', (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ message: 'month query param is required (YYYY-MM)' });
  }
  const stmt = db.prepare(`
    SELECT * FROM expenses
    WHERE user_id = ? AND strftime('%Y-%m', date) = ?
    ORDER BY date DESC, created_at DESC
  `);
  const expenses = stmt.all(req.user.id, month);
  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  res.json({ expenses, total });
});

router.post('/expenses', (req, res) => {
  const { amount, category, label, date } = req.body;
  if (amount == null || !date) {
    return res.status(400).json({ message: 'amount and date are required' });
  }
  const stmt = db.prepare(`
    INSERT INTO expenses (user_id, amount, category, label, date)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(req.user.id, amount, category || null, label || null, date);
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ expense });
});

router.delete('/expenses/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?');
  const info = stmt.run(id, req.user.id);
  if (info.changes === 0) {
    return res.status(404).json({ message: 'Expense not found' });
  }
  res.status(204).end();
});

// ACHIEVEMENTS
router.get('/achievements', (req, res) => {
  const stmt = db.prepare('SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC');
  const achievements = stmt.all(req.user.id);
  res.json({ achievements });
});

router.post('/achievements', (req, res) => {
  const { title, description, icon } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  const stmt = db.prepare(`
    INSERT INTO achievements (user_id, title, description, icon)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(req.user.id, title, description || null, icon || null);
  const achievement = db.prepare('SELECT * FROM achievements WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ achievement });
});

// PRIZES
router.get('/prizes', (req, res) => {
  const stmt = db.prepare('SELECT * FROM prizes WHERE user_id = ? ORDER BY created_at DESC');
  const prizes = stmt.all(req.user.id);
  res.json({ prizes });
});

router.post('/prizes', (req, res) => {
  const { title, description, points_required } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  const stmt = db.prepare(`
    INSERT INTO prizes (user_id, title, description, points_required)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(
    req.user.id,
    title,
    description || null,
    points_required != null ? points_required : 0
  );
  const prize = db.prepare('SELECT * FROM prizes WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ prize });
});

router.patch('/prizes/:id', (req, res) => {
  const { id } = req.params;
  const { is_claimed } = req.body;
  const stmt = db.prepare(`
    UPDATE prizes SET is_claimed = COALESCE(@is_claimed, is_claimed)
    WHERE id = @id AND user_id = @user_id
  `);
  const info = stmt.run({ id, user_id: req.user.id, is_claimed });
  if (info.changes === 0) {
    return res.status(404).json({ message: 'Prize not found' });
  }
  const prize = db.prepare('SELECT * FROM prizes WHERE id = ?').get(id);
  res.json({ prize });
});

module.exports = router;

