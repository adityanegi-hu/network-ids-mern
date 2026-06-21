import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import StatBar from './components/StatBar';
import AlertStream from './components/AlertStream';
import FilterRail from './components/FilterRail';
import './App.css';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, byType: [], bySeverity: [], last24h: 0 });
  const [connected, setConnected] = useState(false);
  const [filters, setFilters] = useState({ type: '', severity: '' });

  const fetchAlerts = useCallback(async () => {
    const params = {};
    if (filters.type) params.type = filters.type;
    if (filters.severity) params.severity = filters.severity;
    const res = await axios.get(`${API_BASE}/alerts`, { params });
    setAlerts(res.data);
  }, [filters]);

  const fetchStats = useCallback(async () => {
    const res = await axios.get(`${API_BASE}/alerts/stats`);
    setStats(res.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAlerts();
    fetchStats();
  }, [fetchAlerts, fetchStats]);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('new_alert', (alert) => {
      setAlerts((prev) => {
        const matchesType = !filters.type || alert.type === filters.type;
        const matchesSeverity = !filters.severity || alert.severity === filters.severity;
        if (!matchesType || !matchesSeverity) return prev;
        return [alert, ...prev].slice(0, 100);
      });
      fetchStats();
    });

    socket.on('alert_updated', (updated) => {
      setAlerts((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
    });

    socket.on('alert_deleted', (id) => {
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      fetchStats();
    });

    return () => socket.disconnect();
  }, [filters, fetchStats]);

  const updateStatus = async (id, status) => {
    await axios.patch(`${API_BASE}/alerts/${id}`, { status });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i className="ti ti-shield-check"></i>
          </span>
          <div>
            <h1>Sentinel</h1>
            <p className="brand-sub">Network intrusion detection console</p>
          </div>
        </div>
        <div className={`conn-status ${connected ? 'is-live' : 'is-down'}`}>
          <span className="conn-dot" aria-hidden="true"></span>
          {connected ? 'Live feed connected' : 'Disconnected'}
        </div>
      </header>

      <StatBar stats={stats} />

      <main className="main-grid">
        <FilterRail filters={filters} setFilters={setFilters} stats={stats} />
        <AlertStream alerts={alerts} onUpdateStatus={updateStatus} />
      </main>
    </div>
  );
}

export default App;
