// ============================================================
// SANDBOX-ONLY FILE — for running the live demo in this environment
// ============================================================
// Identical to server.js except it uses the in-memory Alert shim
// instead of connecting to a real MongoDB instance (no network
// access to download mongod here). Your real deployment should
// use server.js + models/Alert.js with an actual MongoDB connection.
// ============================================================

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const Alert = require('./models/_sandboxAlertShim');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.set('io', io);
app.use(cors());
app.use(express.json());

app.get('/api/alerts', async (req, res) => {
  try {
    const { type, severity, status, limit = 100 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const alerts = await Alert.find(query).sort({ timestamp: -1 }).limit(parseInt(limit));
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/alerts/stats', async (req, res) => {
  try {
    const total = await Alert.countDocuments();
    const byType = await Alert.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
    const bySeverity = await Alert.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]);
    const last24h = await Alert.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    res.json({ total, byType, bySeverity, last24h });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts', async (req, res) => {
  try {
    const { type, sourceIp, detail, severity } = req.body;
    const alert = new Alert({ type, sourceIp, detail, severity });
    await alert.save();
    req.app.get('io').emit('new_alert', alert.toJSON());
    res.status(201).json(alert.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/alerts/:id', async (req, res) => {
  try {
    const updated = await Alert.findByIdAndUpdate(req.params.id, { status: req.body.status });
    if (!updated) return res.status(404).json({ error: 'Alert not found' });
    req.app.get('io').emit('alert_updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/alerts/:id', async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    req.app.get('io').emit('alert_deleted', req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'sandbox-in-memory' });
});

io.on('connection', (socket) => {
  console.log('Dashboard client connected:', socket.id);
  socket.on('disconnect', () => console.log('Dashboard client disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`IDS backend (sandbox mode) running on port ${PORT}`);
});
