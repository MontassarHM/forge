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
import { generateChapterContent } from '../services/aiService';
import { useApp } from '../context/AppContext';

function CourseViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshStats, refreshCourses } = useApp();

  // ✅ TOUS les hooks au début, AVANT toute condition de retour
  const [course, setCourse] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [progress, setProgress] = useState({ completedChapters: [], answeredQuestions: {}, currentChapter: 0 });
  const [startTime] = useState(Date.now());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [generatingChapter, setGeneratingChapter] = useState(false);

  // Chargement du cours
  useEffect(() => {
    const c = getCourseById(id);
    if (!c) {
      alert('Cours introuvable');
      navigate('/');
      return;
    }
    setCourse(c);
    const p = getCourseProgress(id);
    setProgress(p);
    setCurrentChapter(p.currentChapter || 0);
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

  // Tracking du temps
  useEffect(() => {
    return () => {
      const minutes = Math.round((Date.now() - startTime) / 60000);
      if (minutes > 0) {
        recordActivity('time_spent', { minutes });
        refreshStats();
      }
    };
  }, [startTime, refreshStats]);

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
    setCurrentChapter(idx);
    setShowQuestions(false);
    const newProgress = { ...progress, currentChapter: idx };
    setProgress(newProgress);
    saveProgress(id, newProgress);
  };

  const handleQuestionAnswered = (questionId, correct, questionType) => {
    const key = `ch${currentChapter}_${questionId}`;
    const newAnswered = {
      ...progress.answeredQuestions,
      [key]: { correct, answeredAt: new Date().toISOString() }
    };
    const newProgress = { ...progress, answeredQuestions: newAnswered };
    setProgress(newProgress);
    saveProgress(id, newProgress);
    recordActivity('question_answered', { correct, questionType });
    refreshStats();
  };

  const handleCompleteChapter = () => {
    if (!progress.completedChapters.includes(currentChapter)) {
      const newCompleted = [...progress.completedChapters, currentChapter];
      const newProgress = { ...progress, completedChapters: newCompleted };

      if (newCompleted.length === course.chapters.length) {
        newProgress.completedAt = new Date().toISOString();
        recordActivity('course_completed');
      }

      setProgress(newProgress);
      saveProgress(id, newProgress);
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
              <span className="chapter-badge">CHAPITRE {currentChapter + 1}/{course.chapters.length}</span>
              <h2>{chapter.title}</h2>
              {isChapterCompleted && (
                <span className="completed-badge">
                  <CheckCircle size={16} /> Terminé
                </span>
              )}
              {!isChapterGenerated && !generatingChapter && (
                <span className="completed-badge" style={{
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  borderColor: 'var(--accent)'
                }}>
                  <Sparkles size={16} /> Pas encore généré
                </span>
              )}
            </div>
            <button
              className="btn-delete-large"
              onClick={() => setDeleteConfirm(true)}
              title="Supprimer ce cours"
            >
              <Trash2 size={16} /> Supprimer
            </button>
          </div>
        </div>

        {generatingChapter ? (
          <div className="generating-chapter">
            <Loader className="spin" size={48} />
            <h3>🤖 Génération du chapitre en cours...</h3>
            <p>L'IA est en train d'analyser le document et de créer le contenu détaillé.</p>
            <p className="generating-detail">⏱️ Cela prend généralement 20-40 secondes</p>
          </div>
        ) : !isChapterGenerated ? (
          <div className="generating-chapter">
            <Sparkles size={48} style={{ color: 'var(--accent)' }} />
            <h3>📖 Chapitre prêt à être généré</h3>
            <p>{chapter.summary}</p>
            <button className="btn-primary btn-large" onClick={generateCurrentChapter}>
              <Sparkles size={18} /> Générer le contenu
            </button>
          </div>
        ) : !showQuestions ? (
          <>
            {chapter.summary && (
              <div className="chapter-summary">
                <p>📌 <strong>Résumé:</strong> {chapter.summary}</p>
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
                <h4>💡 Exemples</h4>
                <ul>
                  {chapter.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                </ul>
              </div>
            )}

            {chapter.keyPoints && chapter.keyPoints.length > 0 && (
              <div className="key-points">
                <h4>🔑 Points clés à retenir</h4>
                <ul>{chapter.keyPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            )}

            <button className="btn-primary btn-large" onClick={() => setShowQuestions(true)}>
              <Brain size={18} /> Vérifier mes connaissances ({chapter.questions?.length || 0} questions)
            </button>
          </>
        ) : (
          <div className="questions-section">
            <h3>🧠 Check Knowledge - {chapter.title}</h3>
            <p className="questions-intro">Répondez aux questions pour valider vos connaissances</p>

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
                ← Retour au cours
              </button>
              {!isChapterCompleted && (
                <button className="btn-success" onClick={handleCompleteChapter}>
                  <CheckCircle size={18} /> Terminer ce chapitre
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
            <ChevronLeft /> Précédent
          </button>
          <span className="page-indicator">
            {currentChapter + 1} / {course.chapters.length}
          </span>
          <button
            onClick={() => handleSelectChapter(currentChapter + 1)}
            disabled={currentChapter === course.chapters.length - 1}
          >
            Suivant <ChevronRight />
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <AlertTriangle size={48} />
            </div>
            <h3>Supprimer ce cours ?</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer <strong>"{course.title}"</strong> ?
              <br />Toute la progression sera perdue.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(false)}>
                Annuler
              </button>
              <button className="btn-danger" onClick={handleDeleteCourse}>
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseViewer;