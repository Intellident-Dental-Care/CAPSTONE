export default function PatientCard({
  status,
  name,
  time,
  note,
  type,
  branch,
  onViewDetails,
}) {
  return (
    <div className={`patient-card ${type}`}>
      <div>
        <h4>{status}</h4>
        <h3>{name}</h3>
        <p>
          {time} • {note}
        </p>
        <p>Branch: {branch}</p>
      </div>

      <button
        type="button"
        className="details-btn"
        onClick={onViewDetails}
      >
        View Details
      </button>
    </div>
  );
}