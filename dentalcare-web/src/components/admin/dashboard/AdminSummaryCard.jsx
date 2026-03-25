export default function AdminSummaryCard({ title, subtitle, value, variant }) {
  return (
    <div className={`admin-summary-card ${variant}`}>
      <div className="admin-summary-header">
        <div>
          <span>{title}</span>
          <small>{subtitle}</small>
        </div>
      </div>

      <div className="admin-summary-value">{value}</div>
    </div>
  );
}