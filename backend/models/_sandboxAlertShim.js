// ============================================================
// SANDBOX-ONLY FILE — NOT PART OF THE REAL PROJECT
// ============================================================
// This environment has no network access to download a MongoDB
// binary (fastdl.mongodb.org is blocked), so this file fakes
// just enough of Mongoose's API to run the live demo here.
//
// On your own machine / any real server with MongoDB installed,
// you do NOT need this file — server.js connects to real Mongo
// directly via mongoose.connect(). Delete this file in that case.
// ============================================================

const { EventEmitter } = require('events');

let alerts = [];
let idCounter = 1;

function genId() {
  return String(idCounter++).padStart(24, '0');
}

class FakeAlert extends EventEmitter {
  constructor(data) {
    super();
    this._id = genId();
    this.type = data.type;
    this.sourceIp = data.sourceIp;
    this.detail = data.detail;
    this.severity = data.severity || 'medium';
    this.status = data.status || 'new';
    this.timestamp = data.timestamp || new Date();
  }
  async save() {
    alerts.push(this);
    return this;
  }
  toJSON() {
    return {
      _id: this._id,
      type: this.type,
      sourceIp: this.sourceIp,
      detail: this.detail,
      severity: this.severity,
      status: this.status,
      timestamp: this.timestamp
    };
  }
}

function matchQuery(alert, query) {
  return Object.entries(query).every(([k, v]) => {
    if (k === 'timestamp' && v.$gte) return alert.timestamp >= v.$gte;
    return alert[k] === v;
  });
}

const AlertModel = {
  find(query = {}) {
    let results = alerts.filter(a => matchQuery(a, query));
    const chain = {
      sort(sortObj) {
        const key = Object.keys(sortObj)[0];
        const dir = sortObj[key];
        results = results.slice().sort((a, b) =>
          dir === -1 ? b[key] - a[key] : a[key] - b[key]
        );
        return chain;
      },
      limit(n) {
        results = results.slice(0, n);
        return chain;
      },
      then(resolve) {
        resolve(results.map(a => a.toJSON()));
      }
    };
    return chain;
  },
  async countDocuments(query = {}) {
    return alerts.filter(a => matchQuery(a, query)).length;
  },
  async aggregate(pipeline) {
    const groupStage = pipeline.find(s => s.$group);
    const field = groupStage.$group._id.replace('$', '');
    const counts = {};
    alerts.forEach(a => {
      counts[a[field]] = (counts[a[field]] || 0) + 1;
    });
    return Object.entries(counts).map(([_id, count]) => ({ _id, count }));
  },
  async findByIdAndUpdate(id, update, options) {
    const alert = alerts.find(a => a._id === id);
    if (!alert) return null;
    Object.assign(alert, update);
    return alert.toJSON();
  },
  async findByIdAndDelete(id) {
    alerts = alerts.filter(a => a._id !== id);
  }
};

function Alert(data) {
  return new FakeAlert(data);
}
Object.assign(Alert, AlertModel);

module.exports = Alert;
