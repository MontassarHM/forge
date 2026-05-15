import React, { useState } from 'react';

function ShortAnswerQuestion({ question, onAnswered }) {
  const [answer, setAnswer] = useState('');
  const [validated, setValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const handleSubmit = () => {
    const trimmed = answer.trim();

    // logique simple (tu peux remplacer par AI plus tard)
    const correct = trimmed.length > 0;

    setIsCorrect(correct);
    setValidated(true);

    onAnswered?.(correct);
  };

  return (
    <div className="short-answer-wrapper">

      {/* Question */}
      <h4 className="question-title">
        ❓ {question.question}
      </h4>

      {/* Input */}
      <textarea
        className="short-answer-input"
        placeholder="Write your answer here..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={validated}
      />

      {/* Submit button */}
      {!validated && (
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!answer.trim()}
          style={{ marginTop: '12px' }}
        >
          Submit Answer
        </button>
      )}

      {/* Feedback */}
      {validated && (
        <div
          className={`short-answer-feedback ${
            isCorrect ? 'success' : 'error'
          }`}
          style={{ marginTop: '15px' }}
        >
          {isCorrect ? (
            <p>✅ Answer submitted successfully</p>
          ) : (
            <p>❌ Invalid answer</p>
          )}

          {question.explanation && (
            <div style={{ marginTop: '10px' }}>
              <strong>Explanation:</strong>
              <p>{question.explanation}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default ShortAnswerQuestion;