const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();

const alertRoutes = require('./routes/alerts');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.set('io', io);
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/network_ids'; //new mongoose connection string

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected:', MONGO_URI))
  .catch(err => console.error('MongoDB connection error:', err.message));

app.use('/api/alerts', alertRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongoConnected: mongoose.connection.readyState === 1
  });
});

io.on('connection', (socket) => {
  console.log('Dashboard client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Dashboard client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`IDS backend running on port ${PORT}`);
});
