function severityCount(bySeverity, key) {
  const found = bySeverity.find((s) => s._id === key);
  return found ? found.count : 0;
}

function StatBar({ stats }) {
  const cards = [
    { label: 'Total alerts', value: stats.total, color: 'var(--text-primary)' },
    { label: 'Last 24h', value: stats.last24h, color: 'var(--text-primary)' },
    { label: 'Critical', value: severityCount(stats.bySeverity, 'critical'), color: 'var(--signal-critical)' },
    { label: 'High', value: severityCount(stats.bySeverity, 'high'), color: 'var(--signal-high)' },
    { label: 'Medium', value: severityCount(stats.bySeverity, 'medium'), color: 'var(--signal-medium)' }
  ];

  return (
    <div className="stat-bar">
      {cards.map((c) => (
        <div className="stat-card" key={c.label}>
          <p className="stat-label">{c.label}</p>
          <p className="stat-value" style={{ color: c.color }}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

export default StatBar;
