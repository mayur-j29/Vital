const express = require('express');
const db = require('../models/db');
const protect = require('../middleware/protect');

const router = express.Router();

router.use(protect);

// GOALS
router.get('/goals', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
      args: [req.user.id]
    });
    res.json({ goals: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/goals', async (req, res) => {
  const { title, category, description, deadline } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  try {
    const result = await db.execute({
      sql: 'INSERT INTO goals (user_id, title, category, deadline, description) VALUES (?, ?, ?, ?, ?)',
      args: [req.user.id, title, category || null, deadline || null, description || null]
    });
    const goal = await db.execute({
      sql: 'SELECT * FROM goals WHERE id = ?',
      args: [Number(result.lastInsertRowid)]
    });
    res.status(201).json({ goal: goal.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/goals/:id', async (req, res) => {
  const { id } = req.params;
  const { is_completed } = req.body;
  try {
    const result = await db.execute({
      sql: 'UPDATE goals SET is_completed = ? WHERE id = ? AND user_id = ?',
      args: [is_completed, id, req.user.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Goal not found' });
    const goal = await db.execute({ sql: 'SELECT * FROM goals WHERE id = ?', args: [id] });
    res.json({ goal: goal.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/goals/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: 'DELETE FROM goals WHERE id = ? AND user_id = ?',
      args: [id, req.user.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Goal not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGS
router.get('/logs', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'date query param is required (YYYY-MM-DD)' });
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM daily_logs WHERE user_id = ? AND log_date = ? ORDER BY created_at DESC',
      args: [req.user.id, date]
    });
    res.json({ logs: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logs', async (req, res) => {
  const { log_date, category, label, value, note } = req.body;
  if (!log_date || !category || !label) {
    return res.status(400).json({ message: 'log_date, category, and label are required' });
  }
  try {
    const result = await db.execute({
      sql: 'INSERT INTO daily_logs (user_id, log_date, category, label, value, note) VALUES (?, ?, ?, ?, ?, ?)',
      args: [req.user.id, log_date, category, label, value != null ? value : null, note || null]
    });
    const log = await db.execute({
      sql: 'SELECT * FROM daily_logs WHERE id = ?',
      args: [Number(result.lastInsertRowid)]
    });
    res.status(201).json({ log: log.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/logs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: 'DELETE FROM daily_logs WHERE id = ? AND user_id = ?',
      args: [id, req.user.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Log not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// EXPENSES
router.get('/expenses', async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'month query param is required (YYYY-MM)' });
  try {
    const result = await db.execute({
      sql: "SELECT * FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ? ORDER BY date DESC, created_at DESC",
      args: [req.user.id, month]
    });
    const total = result.rows.reduce((sum, e) => sum + (e.amount || 0), 0);
    res.json({ expenses: result.rows, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/expenses', async (req, res) => {
  const { amount, category, label, date } = req.body;
  if (amount == null || !date) return res.status(400).json({ message: 'amount and date are required' });
  try {
    const result = await db.execute({
      sql: 'INSERT INTO expenses (user_id, amount, category, label, date) VALUES (?, ?, ?, ?, ?)',
      args: [req.user.id, amount, category || null, label || null, date]
    });
    const expense = await db.execute({
      sql: 'SELECT * FROM expenses WHERE id = ?',
      args: [Number(result.lastInsertRowid)]
    });
    res.status(201).json({ expense: expense.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: 'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      args: [id, req.user.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Expense not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ACHIEVEMENTS
router.get('/achievements', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC',
      args: [req.user.id]
    });
    res.json({ achievements: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/achievements', async (req, res) => {
  const { title, description, icon } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  try {
    const result = await db.execute({
      sql: 'INSERT INTO achievements (user_id, title, description, icon) VALUES (?, ?, ?, ?)',
      args: [req.user.id, title, description || null, icon || null]
    });
    const achievement = await db.execute({
      sql: 'SELECT * FROM achievements WHERE id = ?',
      args: [Number(result.lastInsertRowid)]
    });
    res.status(201).json({ achievement: achievement.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PRIZES
router.get('/prizes', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM prizes WHERE user_id = ? ORDER BY created_at DESC',
      args: [req.user.id]
    });
    res.json({ prizes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/prizes', async (req, res) => {
  const { title, description, points_required } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  try {
    const result = await db.execute({
      sql: 'INSERT INTO prizes (user_id, title, description, points_required) VALUES (?, ?, ?, ?)',
      args: [req.user.id, title, description || null, points_required != null ? points_required : 0]
    });
    const prize = await db.execute({
      sql: 'SELECT * FROM prizes WHERE id = ?',
      args: [Number(result.lastInsertRowid)]
    });
    res.status(201).json({ prize: prize.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/prizes/:id', async (req, res) => {
  const { id } = req.params;
  const { is_claimed } = req.body;
  try {
    const result = await db.execute({
      sql: 'UPDATE prizes SET is_claimed = ? WHERE id = ? AND user_id = ?',
      args: [is_claimed, id, req.user.id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: 'Prize not found' });
    const prize = await db.execute({ sql: 'SELECT * FROM prizes WHERE id = ?', args: [id] });
    res.json({ prize: prize.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;