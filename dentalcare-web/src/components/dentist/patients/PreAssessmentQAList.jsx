export default function PreAssessmentQAList({ questions = [] }) {
  return (
    <div className="qa-summary-box">
      <div className="qa-summary-line"></div>

      <div className="qa-summary-content">
        {questions.length === 0 ? (
          <p className="qa-empty-text">No pre-assessment answers available.</p>
        ) : (
          questions.map((item, index) => (
            <div className="qa-item" key={index}>
              <p className="qa-question">
                <strong>Question {index + 1}:</strong> {item.question}
              </p>
              <p className="qa-answer">
                <strong>Answer:</strong> {item.answer}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}