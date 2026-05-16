import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Brain, CheckCircle, Trash2, AlertTriangle, Loader, Sparkles } from 'lucide-react';
import ChapterSidebar from './ChapterSidebar';
import QCMQuestion from './QCMQuestion';
import CodeEditor from './CodeEditor';
import ShortAnswerQuestion from './ShortAnswerQuestion';
import {
  getCourseById,
  getCourseProgress,
  saveProgress,
  recordActivity,
  deleteCourse,
  updateChapter
} from '../services/statsService';
import { generateChapterContent, generateAIResponse } from '../services/aiService';
import { useApp } from '../context/AppContext';

function CourseViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshStats, refreshCourses } = useApp();
  const [chatOpen, setChatOpen] = useState(false);

  // ✅ TOUS les hooks au début, AVANT toute condition de retour
  const [course, setCourse] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [progress, setProgress] = useState({ completedChapters: [], answeredQuestions: {}, currentChapter: 0 });
  const [startTime] = useState(Date.now());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [generatingChapter, setGeneratingChapter] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    setChatMessages(prev => [...prev, { from: "user", text: chatInput }]);

    try {
      const responseText = await generateAIResponse(chatInput, course);

      let aiText = "";

      if (typeof responseText === "string") {
        try {
          const data = JSON.parse(responseText);
          // Transformer l'objet en string lisible
          aiText = Object.values(data)
            .map(v => {
              if (Array.isArray(v)) return v.join("\n- ");
              return v;
            })
            .join("\n");
        } catch {
          // si ce n’est pas JSON, utiliser le texte brut
          aiText = responseText;
        }
      } else if (typeof responseText === "object") {
        // platifier l'objet en string
        aiText = Object.values(responseText)
          .map(v => (Array.isArray(v) ? v.join("\n- ") : v))
          .join("\n");
      } else {
        aiText = String(responseText);
      }

      setChatMessages(prev => [...prev, { from: "ai", text: aiText }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { from: "ai", text: "Erreur lors de la génération" }]);
    }

    setChatInput("");
  };

  // Chargement du cours
  useEffect(() => {
    const c = getCourseById(id);
    if (!c) {
      alert("Cours introuvable");
      navigate("/");
      return;
    }

    const savedProgress = getCourseProgress(id);
    setCourse(c);
    setProgress(savedProgress);

    // Ensure currentChapter is valid
    setCurrentChapter(
      savedProgress.currentChapter != null ? savedProgress.currentChapter : 0
    );
  }, [id, navigate]);

  // Auto-génération du chapitre actuel
  useEffect(() => {
    if (!course) return;

    const chapter = course.chapters[currentChapter];
    if (chapter && !chapter.isGenerated && !generatingChapter) {
      generateCurrentChapter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter, course?.id]);

  // Préchargement du chapitre suivant
  useEffect(() => {
    if (!course) return;

    const chapter = course.chapters[currentChapter];
    if (chapter?.isGenerated && !generatingChapter) {
      const timer = setTimeout(() => {
        preloadNextChapter();
      }, 2000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter, course?.chapters?.[currentChapter]?.isGenerated]);

  useEffect(() => {
    const interval = setInterval(() => {
      const savedProgress = getCourseProgress(id);
      const now = Date.now();
      const start = savedProgress.startedAt || now;
      const minutes = (now - start) / 1000 / 60;

      saveProgress(id, { ...savedProgress, startedAt: savedProgress.startedAt || now });
      recordActivity("time_spent", { minutes });
      refreshStats();
    }, 15000); // every 15s

    return () => clearInterval(interval);
  }, [id, refreshStats]);

  // ===== Fonctions =====

  const generateCurrentChapter = async () => {
    if (!course) return;

    const chapter = course.chapters[currentChapter];
    if (chapter.isGenerated) return;

    setGeneratingChapter(true);
    try {
      console.log('🤖 Génération du chapitre', currentChapter + 1);
      const generatedChapter = await generateChapterContent(course, currentChapter);

      const updatedCourse = { ...course };
      updatedCourse.chapters[currentChapter] = generatedChapter;
      setCourse(updatedCourse);

      updateChapter(course.id, currentChapter, generatedChapter);
    } catch (error) {
      console.error('Erreur génération:', error);
      alert(`Erreur lors de la génération: ${error.message}`);
    } finally {
      setGeneratingChapter(false);
    }
  };

  const preloadNextChapter = async () => {
    if (!course) return;

    const nextIdx = currentChapter + 1;
    if (nextIdx < course.chapters.length && !course.chapters[nextIdx].isGenerated) {
      try {
        console.log('🔄 Préchargement du chapitre', nextIdx + 1);
        const nextChapter = await generateChapterContent(course, nextIdx);
        const updatedCourse = { ...course };
        updatedCourse.chapters[nextIdx] = nextChapter;
        setCourse(updatedCourse);
        updateChapter(course.id, nextIdx, nextChapter);
      } catch (error) {
        console.error('Erreur préchargement:', error);
      }
    }
  };

  const handleSelectChapter = (idx) => {
    if (!course) return;

    const savedProgress = getCourseProgress(id); // get latest from storage
    const updatedProgress = {
      ...savedProgress,
      currentChapter: idx,
    };

    saveProgress(id, updatedProgress); // persist immediately
    setProgress(updatedProgress);
    setCurrentChapter(idx);
    setShowQuestions(false);
  };

  const handleQuestionAnswered = (questionId, correct, questionType) => {
    const savedProgress = getCourseProgress(id); // merge latest
    const key = `ch${currentChapter}_${questionId}`;
    const answeredQuestions = {
      ...savedProgress.answeredQuestions,
      [key]: { correct, answeredAt: new Date().toISOString(), questionType },
    };

    const updatedProgress = {
      ...savedProgress,
      answeredQuestions,
      currentChapter,
    };

    setProgress(updatedProgress);
    saveProgress(id, updatedProgress); // persist immediately
    recordActivity("question_answered", { correct, questionType });
    refreshStats();
  };

  const handleCompleteChapter = () => {
    const savedProgress = getCourseProgress(id);

    if (!savedProgress.completedChapters.includes(currentChapter)) {
      const newCompleted = [...savedProgress.completedChapters, currentChapter];

      const updatedProgress = {
        ...savedProgress,
        completedChapters: newCompleted,
        currentChapter,
        completedAt:
          newCompleted.length === course.chapters.length
            ? new Date().toISOString()
            : savedProgress.completedAt,
      };

      setProgress(updatedProgress);
      saveProgress(id, updatedProgress);

      if (newCompleted.length === course.chapters.length) {
        recordActivity("course_completed");
      }

      refreshStats();

      if (currentChapter < course.chapters.length - 1) {
        setTimeout(() => handleSelectChapter(currentChapter + 1), 1500);
      }
    }
  };

  const handleDeleteCourse = () => {
    deleteCourse(id);
    refreshCourses();
    refreshStats();
    navigate('/');
  };

  // ✅ Le return conditionnel vient APRÈS tous les hooks
  if (!course) return <div className="loading">Chargement...</div>;

  const chapter = course.chapters[currentChapter];
  const isChapterGenerated = chapter?.isGenerated;
  const isChapterCompleted = progress.completedChapters.includes(currentChapter);

  return (
    <div className="course-viewer">
      <ChapterSidebar
        course={course}
        currentChapter={currentChapter}
        completedChapters={progress.completedChapters}
        onSelectChapter={handleSelectChapter}
        progress={progress}
      />

      <div className="chapter-content">
        <div className="chapter-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <span className="chapter-badge">CHAPTER {currentChapter + 1}/{course.chapters.length}</span>
              <h2>{chapter.title}</h2>
              {isChapterCompleted && (
                <span className="completed-badge">
                  <CheckCircle size={16} /> Completed
                </span>
              )}
              {!isChapterGenerated && !generatingChapter && (
                <span className="completed-badge" style={{
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  borderColor: 'var(--accent)'
                }}>
                  <Sparkles size={16} /> Not yet generated
                </span>
              )}
            </div>
            <button
              className="btn-delete-large"
              onClick={() => setDeleteConfirm(true)}
              title="Delete this course"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {generatingChapter ? (
          <div className="generating-chapter">
            <Loader className="spin" size={48} />
            <h3>🤖 Generating chapter...</h3>
            <p>The AI is analyzing the document and creating detailed content.</p>
            <p className="generating-detail">⏱️ This usually takes 20-40 seconds</p>
          </div>
        ) : !isChapterGenerated ? (
          <div className="generating-chapter">
            <Sparkles size={48} style={{ color: 'var(--accent)' }} />
            <h3>📖 Chapter ready to be generated</h3>
            <p>{chapter.summary}</p>
            <button className="btn-primary btn-large" onClick={generateCurrentChapter}>
              <Sparkles size={18} /> Generate content
            </button>
          </div>
        ) : !showQuestions ? (
          <>
            {chapter.summary && (
              <div className="chapter-summary">
                <p>📌 <strong>Summary:</strong> {chapter.summary}</p>
              </div>
            )}

            <div className="chapter-text">
              {(typeof chapter?.content === 'string'
                ? chapter.content
                : ''
              )
                .split('\n\n')
                .filter(p => p.trim() !== '')
                .map((p, idx) => {

                  if (p.startsWith('## ')) {
                    return (
                      <h3
                        key={idx}
                        className="chapter-subtitle"
                      >
                        {p.replace('## ', '')}
                      </h3>
                    );
                  }

                  if (p.startsWith('### ')) {
                    return (
                      <h4
                        key={idx}
                        className="chapter-subtitle-small"
                      >
                        {p.replace('### ', '')}
                      </h4>
                    );
                  }

                  return <p key={idx}>{p}</p>;
                })}
            </div>

            {chapter.examples && chapter.examples.length > 0 && (
              <div className="examples-section">
                <h4>💡 Examples</h4>
                <ul>
                  {chapter.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                </ul>
              </div>
            )}

            {chapter.keyPoints && chapter.keyPoints.length > 0 && (
              <div className="key-points">
                <h4>🔑 Key points to remember</h4>
                <ul>{chapter.keyPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            )}

            <button className="btn-primary btn-large" onClick={() => setShowQuestions(true)}>
              <Brain size={18} /> Test your knowledge ({chapter.questions?.length || 0} questions)
            </button>
          </>
        ) : (
          <div className="questions-section">
            <h3>🧠 Check Knowledge - {chapter.title}</h3>
            <p className="questions-intro">Answer the questions to validate your knowledge</p>

            {chapter.questions?.map((q, idx) => (

              <div key={q.id || idx} className="question-block">

                <div className="question-number">
                  Question {idx + 1}/{chapter.questions.length}
                </div>

                {/* MCQ */}
                {q.type === 'mcq' && (
                  <QCMQuestion
                    question={q}
                    onAnswered={(correct) =>
                      handleQuestionAnswered(
                        q.id || `q${idx}`,
                        correct,
                        'mcq'
                      )
                    }
                  />
                )}

                {/* TRUE FALSE */}
                {q.type === 'true_false' && (
                  <QCMQuestion
                    question={{
                      ...q,
                      options: ['True', 'False']
                    }}
                    onAnswered={(correct) =>
                      handleQuestionAnswered(
                        q.id || `q${idx}`,
                        correct,
                        'true_false'
                      )
                    }
                  />
                )}

                {/* CODING */}
                {q.type === 'coding' && (
                  <CodeEditor
                    question={q}
                    onAnswered={(correct) =>
                      handleQuestionAnswered(
                        q.id || `q${idx}`,
                        correct,
                        'coding'
                      )
                    }
                  />
                )}

                {/* SHORT ANSWER */}
                {q.type === 'short_answer' && (
                  <ShortAnswerQuestion
                    question={q}
                    onAnswered={(correct) =>
                      handleQuestionAnswered(
                        q.id || `q${idx}`,
                        correct,
                        'short_answer'
                      )
                    }
                  />
                )}

              </div>

            ))}

            <div className="chapter-actions">
              <button className="btn-secondary" onClick={() => setShowQuestions(false)}>
                ← Back to course
              </button>
              {!isChapterCompleted && (
                <button className="btn-success" onClick={handleCompleteChapter}>
                  <CheckCircle size={18} /> Complete chapter
                </button>
              )}
            </div>
          </div>
        )}

        <div className="navigation">
          <button
            onClick={() => handleSelectChapter(currentChapter - 1)}
            disabled={currentChapter === 0}
          >
            <ChevronLeft /> Previous
          </button>
          <span className="page-indicator">
            {currentChapter + 1} / {course.chapters.length}
          </span>
          <button
            onClick={() => handleSelectChapter(currentChapter + 1)}
            disabled={currentChapter === course.chapters.length - 1}
          >
            Next <ChevronRight />
          </button>
        </div>
        <div className="chat-widget">
          {/* FLOATING BUTTON */}
          <button
            className={`chat-fab ${chatOpen ? "open" : ""}`}
            onClick={() => setChatOpen(!chatOpen)}> 🤖
          </button>
          <div className={`chat-panel ${chatOpen ? "open" : ""}`}>
            <div className="chat-header">
              <span>Assistant</span>
              <button onClick={() => setChatOpen(false)}>✕</button>
            </div>
            <div className="chat-messages">
              {chatMessages.map((m, i) => (
                <div key={i} className={`chat-msg ${m.from}`}>
                  {typeof m.text === "string"
                    ? m.text
                    : JSON.stringify(m.text)
                  }
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask something..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      </div>
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <AlertTriangle size={48} />
            </div>
            <h3>Delete this course?</h3>
            <p>
              Are you sure you want to delete <strong>"{course.title}"</strong>?
              <br />All progress will be lost.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteCourse}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseViewer;