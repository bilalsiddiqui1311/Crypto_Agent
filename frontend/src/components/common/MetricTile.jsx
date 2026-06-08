export function MetricTile({ icon: Icon, label, value, detail }) {
  return (
    <article className="metric-tile">
      <Icon size={18} />
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
