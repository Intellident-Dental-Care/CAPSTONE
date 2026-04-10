export default function SummaryCard({ title, subtitle, value, variant }) {
  return (
    <div className={`summary-card ${variant}`}>
      <div className="summary-header">
        <div>
          <span>{title}</span>
          <small>{subtitle}</small>
        </div>
      </div>

      <div className="summary-value">{value}</div>
    </div>
  );
}