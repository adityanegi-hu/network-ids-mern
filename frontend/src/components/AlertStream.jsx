const TYPE_ICONS = {
  'Port Scan': 'ti-radar-2',
  'Brute Force': 'ti-key',
  'ARP Spoofing': 'ti-affiliate'
};

function timeAgo(timestamp) {
  const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function AlertStream({ alerts, onUpdateStatus }) {
  if (alerts.length === 0) {
    return (
      <section className="alert-stream">
        <div className="empty-state">
          <i className="ti ti-shield-search" aria-hidden="true"></i>
          <p>No alerts yet</p>
          <p className="empty-sub">Run the sniffer or simulator to populate this feed.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="alert-stream">
      {alerts.map((alert) => (
        <article
          key={alert._id}
          className={`alert-row sev-${alert.severity} status-${alert.status}`}
        >
          <div className="alert-icon" aria-hidden="true">
            <i className={`ti ${TYPE_ICONS[alert.type] || 'ti-alert-triangle'}`}></i>
          </div>

          <div className="alert-body">
            <div className="alert-top">
              <span className="alert-type">{alert.type}</span>
              <span className="alert-sev-badge">{alert.severity}</span>
              <span className="alert-time">{timeAgo(alert.timestamp)}</span>
            </div>
            <p className="alert-detail">
              <span className="alert-ip">{alert.sourceIp}</span> — {alert.detail}
            </p>
          </div>

          <div className="alert-actions">
            {alert.status === 'new' && (
              <button onClick={() => onUpdateStatus(alert._id, 'acknowledged')}>
                Acknowledge
              </button>
            )}
            {alert.status !== 'resolved' && (
              <button onClick={() => onUpdateStatus(alert._id, 'resolved')}>
                Resolve
              </button>
            )}
            {alert.status === 'resolved' && (
              <span className="resolved-tag">
                <i className="ti ti-check" aria-hidden="true"></i> Resolved
              </span>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

export default AlertStream;
