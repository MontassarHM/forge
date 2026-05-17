import React, { useState } from 'react';
import confetti from 'canvas-confetti';

function QCMQuestion({ question, onAnswered }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const launchConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });

      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 250);
  };

  const handleSubmit = () => {
    if (selected === null) return;

    setSubmitted(true);

    const correct = selected === question.correctAnswer;

    if (correct) {
      launchConfetti();
    }

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
            className={`option 
              ${selected === idx ? 'selected' : ''} 
              ${submitted && idx === question.correctAnswer ? 'correct' : ''} 
              ${submitted && selected === idx && !isCorrect ? 'wrong' : ''}
            `}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              checked={selected === idx}
              onChange={() => !submitted && setSelected(idx)}
              disabled={submitted}
            />

            <span>{option}</span>

            {submitted && idx === question.correctAnswer && (
              <span className="badge-correct">✓</span>
            )}

            {submitted && selected === idx && !isCorrect && (
              <span className="badge-wrong">✗</span>
            )}
          </label>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="btn-primary"
          disabled={selected === null}
        >
          Submit
        </button>
      ) : (
        <div className={`feedback ${isCorrect ? 'success' : 'error'}`}>
          <strong>
            {isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
          </strong>

          <p>{question.explanation}</p>

          {!isCorrect && (
            <p>
              <strong>Correct answer:</strong>{' '}
              {question.options[question.correctAnswer]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default QCMQuestion;