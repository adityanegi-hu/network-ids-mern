const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// GET /api/alerts - list alerts, newest first, with optional filters
router.get('/', async (req, res) => {
  try {
    const { type, severity, status, limit = 100 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const alerts = await Alert.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/stats - summary counts for dashboard cards
router.get('/stats', async (req, res) => {
  try {
    const total = await Alert.countDocuments();
    const byType = await Alert.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const bySeverity = await Alert.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    const last24h = await Alert.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({ total, byType, bySeverity, last24h });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts - create a new alert (called by the Python sniffer)
router.post('/', async (req, res) => {
  try {
    const { type, sourceIp, detail, severity } = req.body;
    const alert = new Alert({ type, sourceIp, detail, severity });
    await alert.save();

    // broadcast to all connected dashboard clients in real time
    req.app.get('io').emit('new_alert', alert);

    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id - update alert status (acknowledge/resolve)
router.patch('/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    req.app.get('io').emit('alert_updated', alert);
    res.json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    req.app.get('io').emit('alert_deleted', req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
