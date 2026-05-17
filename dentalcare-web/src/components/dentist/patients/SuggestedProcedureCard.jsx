export default function SuggestedProcedureCard({ treatment, price }) {
  const displayPrice = price && price !== "-" ? price : "Price varies";

  return (
    <div className="suggested-procedure-card">
      <p className="suggested-label">Suggested Treatment / Procedure</p>
      <h4>{treatment || "No suggested treatment yet"}</h4>
      <p className="suggested-price">
        Price: {displayPrice}
      </p>
    </div>
  );
}