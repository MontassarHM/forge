import React from 'react';
import { CheckCircle, BookOpen, Brain, Sparkles, Loader } from 'lucide-react';

function ChapterSidebar({ course, currentChapter, completedChapters, onSelectChapter, progress }) {
  const completionPct = Math.round((completedChapters.length / course.chapters.length) * 100);
  const generatedCount = course.chapters.filter(ch => ch.isGenerated).length;

  return (
    <aside className="chapter-sidebar">
      <div className="chapter-sidebar-header">
        <h3>📘 {course.title}</h3>
        <p className="course-desc">{course.description}</p>
        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <span>{completionPct}% complété</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
          ✨ {generatedCount}/{course.chapters.length} chapitres générés
        </div>
      </div>

      <div className="chapters-list">
        <p className="chapters-label">📚 CHAPITRES ({course.chapters.length})</p>
        {course.chapters.map((chapter, idx) => {
          const isCompleted = completedChapters.includes(idx);
          const isCurrent = currentChapter === idx;
          const isGenerated = chapter.isGenerated;
          const questionsAnswered = Object.keys(progress.answeredQuestions || {})
            .filter(k => k.startsWith(`ch${idx}_`)).length;

          return (
            <div
              key={idx}
              className={`chapter-item ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => onSelectChapter(idx)}
            >
              <div className="chapter-icon">
                {isCompleted ? <CheckCircle size={18} /> :
                  isCurrent ? <BookOpen size={18} /> :
                    !isGenerated ? <Sparkles size={14} /> :
                      <span>{idx + 1}</span>}
              </div>
              <div className="chapter-info">
                <h4>
                  {chapter.title}
                  {!isGenerated && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--accent)' }}>✨</span>}
                </h4>
                <div className="chapter-meta">
                  <span>⏱️ {chapter.duration || 15} min</span>
                  {isGenerated && chapter.questions && (
                    <span>📝 {chapter.questions.length} questions</span>
                  )}
                </div>
                {questionsAnswered > 0 && (
                  <div className="chapter-progress-mini">
                    <Brain size={12} />
                    <span>{questionsAnswered} répondues</span>
                  </div>
                )}
                {!isGenerated && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                    Cliquez pour générer
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default ChapterSidebar;