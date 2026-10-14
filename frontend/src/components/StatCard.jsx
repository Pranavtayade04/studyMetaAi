export default function StatCard({ icon, label, value, change, color }) {
  return (
    <article className="stat-card">
      <div className="stat-icon" style={{ color, background: `${color}18` }}>
        {icon}
      </div>
      <div>
        <span>{label}</span>
        <h3>{value}</h3>
        {change && <small className="positive">↑ {change} this week</small>}
      </div>
    </article>
  );
}
