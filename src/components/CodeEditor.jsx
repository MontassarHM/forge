import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Check, Lightbulb, RotateCcw, Loader } from 'lucide-react';
import { evaluateCode, getHint } from '../services/aiService';

function CodeEditor({ question, onAnswered }) {
  const [code, setCode] = useState(question.starterCode || '// Votre code\n');
  const [output, setOutput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [run, setrun] = useState(false);
  const [hint, setHint] = useState('');
  const [hintLoading, setHintLoading] = useState(false);

  // const runCode = () => {
  //   try {
  //     const logs = [];
  //     const originalLog = console.log;
  //     console.log = (...args) => logs.push(args.map(a => 
  //       typeof a === 'object' ? JSON.stringify(a) : String(a)
  //     ).join(' '));

  //     // eslint-disable-next-line no-new-func
  //     const result = new Function(code)();

  //     console.log = originalLog;
  //     setOutput(logs.join('\n') + (result !== undefined ? `\n=> ${result}` : ''));
  //   } catch (error) {
  //     setOutput(`❌ Erreur: ${error.message}`);
  //   }
  // };

  const runCode = async () => {
    setrun(true);
    setFeedback(null);

    try {
      const result = await evaluateCode(code, question);

      // Affiche juste le feedback AI dans output
      setOutput(result.correctedCode || result.message);

      // ⚠️ NE PAS appeler onAnswered ici
      // setFeedback(result); // optionnel si tu veux voir feedback aussi
      setFeedback(result); // si tu veux voir le détail mais ne marque pas la question

    } catch (error) {
      setOutput(error.message || 'Erreur lors de l\'exécution');
      setFeedback({
        correct: false,
        score: 0,
        message: error.message || "Erreur",
        errors: [],
        suggestions: [],
        correctedCode: null
      });
    } finally {
      setrun(false);
    }
  };

  const submitCode = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const result = await evaluateCode(code, question);

      // Affiche feedback AI
      setOutput(result.correctedCode || result.message);

      // ⚡ Ici on marque la réponse comme soumise
      setFeedback(result);
      onAnswered?.(result.correct);

    } catch (error) {
      setOutput(error.message || 'Erreur lors de la soumission');
      setFeedback({
        correct: false,
        score: 0,
        message: error.message || "Erreur",
        errors: [],
        suggestions: [],
        correctedCode: null
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHint = async () => {
    setHintLoading(true);
    try {
      const h = await getHint(question, code);
      setHint(h);
    } finally {
      setHintLoading(false);
    }
  };

  const reset = () => {
    setCode(question.starterCode || '// Votre code\n');
    setOutput('');
    setFeedback(null);
    setHint('');
  };

  return (
    <div className="code-question">
      <h4>💻 {question.question}</h4>
      <div className="description">{question.description}</div>

      <div className="editor-container">
        <Editor
          height="300px"
          defaultLanguage={question.language || 'javascript'}
          value={code}
          onChange={(v) => setCode(v)}
          theme="vs-dark"
          options={{ fontSize: 14, minimap: { enabled: false } }}
        />
      </div>

      <div className="editor-actions">
        <button onClick={runCode} className="btn-secondary"><Play size={16} />
          {run ?? <Loader className="spin" size={16} />} Run</button>
        <button onClick={submitCode} className="btn-primary" disabled={loading}>
          {loading ? <Loader className="spin" size={16} /> : <Check size={16} />} Submit
        </button>
        <button onClick={fetchHint} className="btn-outline" disabled={hintLoading}>
          <Lightbulb size={16} /> {hintLoading ? '...' : 'Indice'}
        </button>
        <button onClick={reset} className="btn-outline"><RotateCcw size={16} /> Reset</button>
      </div>

      {output && (
        <div className="output-box">
          <strong>📺 Output:</strong>
          <pre>{output}</pre>
        </div>
      )}

      {hint && (
        <div className="hint-box">
          💡 <strong>Indice:</strong> {hint}
        </div>
      )}

      {feedback && (
        <div className={`feedback ${feedback.correct ? 'success' : 'error'}`}>

          <div className="feedback-header">
            <strong>
              {feedback.correct ? '✅ Excellent !' : '❌ Pas tout à fait...'}
            </strong>

            {typeof feedback.score === 'number' && (
              <span className="score">Score: {feedback.score}/100</span>
            )}
          </div>

          {/* MESSAGE SAFE */}
          <p>
            {typeof feedback.message === 'string'
              ? feedback.message
              : JSON.stringify(feedback.message || '')}
          </p>

          {/* ERRORS SAFE */}
          {Array.isArray(feedback.errors) && feedback.errors.length > 0 && (
            <div className="errors-list">
              <strong>⚠️ Erreurs:</strong>
              <ul>
                {feedback.errors.map((e, i) => (
                  <li key={i}>
                    {typeof e === 'string' ? e : JSON.stringify(e)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* SUGGESTIONS SAFE */}
          {Array.isArray(feedback.suggestions) && feedback.suggestions.length > 0 && (
            <div className="suggestions">
              <strong>💡 Suggestions:</strong>
              <ul>
                {feedback.suggestions.map((s, i) => (
                  <li key={i}>
                    {typeof s === 'string' ? s : JSON.stringify(s)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CORRECTION SAFE */}
          {feedback.correctedCode && typeof feedback.correctedCode === 'string' && (
            <details className="corrected-section">
              <summary>📝 Voir la correction</summary>
              <pre className="corrected-code">
                {feedback.correctedCode}
              </pre>
            </details>
          )}

        </div>
      )}
    </div>
  );
}

export default CodeEditor;