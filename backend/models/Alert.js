const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Port Scan', 'Brute Force', 'ARP Spoofing', 'Test Alert']
  },
  sourceIp: {
    type: String,
    required: true
  },
  detail: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'resolved'],
    default: 'new'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

alertSchema.index({ timestamp: -1 });
alertSchema.index({ sourceIp: 1 });
alertSchema.index({ type: 1 });

module.exports = mongoose.model('Alert', alertSchema);
