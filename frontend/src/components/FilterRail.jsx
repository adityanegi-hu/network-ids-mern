const TYPES = ['Port Scan', 'Brute Force', 'ARP Spoofing'];
const SEVERITIES = [
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' }
];

function FilterRail({ filters, setFilters }) {
  const toggle = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: prev[field] === value ? '' : value
    }));
  };

  return (
    <aside className="filter-rail">
      <div className="filter-group">
        <p className="filter-heading">Alert type</p>
        {TYPES.map((t) => (
          <button
            key={t}
            className={`filter-chip ${filters.type === t ? 'is-active' : ''}`}
            onClick={() => toggle('type', t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="filter-group">
        <p className="filter-heading">Severity</p>
        {SEVERITIES.map((s) => (
          <button
            key={s.key}
            className={`filter-chip sev-${s.key} ${filters.severity === s.key ? 'is-active' : ''}`}
            onClick={() => toggle('severity', s.key)}
          >
            <span className="sev-dot" aria-hidden="true"></span>
            {s.label}
          </button>
        ))}
      </div>

      {(filters.type || filters.severity) && (
        <button
          className="filter-clear"
          onClick={() => setFilters({ type: '', severity: '' })}
        >
          <i className="ti ti-x" aria-hidden="true"></i> Clear filters
        </button>
      )}
    </aside>
  );
}

export default FilterRail;
