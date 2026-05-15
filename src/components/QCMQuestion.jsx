import React, { useState } from 'react';

function QCMQuestion({ question, onAnswered }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const correct = selected === question.correctAnswer;
    onAnswered?.(correct);
  };

  const isCorrect = selected === question.correctAnswer;

  return (
    <div className="qcm-question">
      <h4>❓ {question.question}</h4>
      <div className="options">
        {question.options.map((option, idx) => (
          <label
            key={idx}
            className={`option ${selected === idx ? 'selected' : ''} ${
              submitted && idx === question.correctAnswer ? 'correct' : ''
            } ${submitted && selected === idx && !isCorrect ? 'wrong' : ''}`}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              checked={selected === idx}
              onChange={() => !submitted && setSelected(idx)}
              disabled={submitted}
            />
            <span>{option}</span>
            {submitted && idx === question.correctAnswer && <span className="badge-correct">✓</span>}
            {submitted && selected === idx && !isCorrect && <span className="badge-wrong">✗</span>}
          </label>
        ))}
      </div>

      {!submitted ? (
        <button onClick={handleSubmit} className="btn-primary" disabled={selected === null}>
          Soumettre
        </button>
      ) : (
        <div className={`feedback ${isCorrect ? 'success' : 'error'}`}>
          <strong>{isCorrect ? '✅ Correct !' : '❌ Incorrect'}</strong>
          <p>{question.explanation}</p>
          {!isCorrect && (
            <p><strong>Bonne réponse:</strong> {question.options[question.correctAnswer]}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default QCMQuestion;