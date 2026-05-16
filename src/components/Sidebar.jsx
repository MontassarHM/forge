import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Upload, BookOpen, Zap, Trophy, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { deleteCourse } from '../services/statsService';

function Sidebar() {
  const navigate = useNavigate();
  const { courses, stats, refreshCourses, refreshStats } = useApp();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDelete = (e, courseId, courseName) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ id: courseId, name: courseName });
  };

  const confirmDelete = () => {
    deleteCourse(deleteConfirm.id);
    refreshCourses();
    refreshStats();
    setDeleteConfirm(null);
    navigate('/');
  };

  return (
    <>
      <aside className="sidebar">
        <div className="logo">
          <h2>⚡ FORGE</h2>
          <p>LEARN BY DOING</p>
        </div>

        <nav>
          <NavLink to="/" className="nav-link" end>
            <Home size={18} /> Dashboard
          </NavLink>

          <NavLink to="/upload" className="nav-link">
            <Upload size={18} /> New Course
          </NavLink>

          <div className="nav-section">
            <p className="nav-title">📚 My Courses ({courses.length})</p>

            {courses.length === 0 ? (
              <p className="nav-empty">No courses created</p>
            ) : (
              <div className="courses-scroll">
                {courses.map(course => (
                  <div key={course.id} className="nav-course-wrapper">
                    <NavLink to={`/course/${course.id}`} className="nav-link nav-course">
                      <BookOpen size={14} />
                      <span className="course-name">{course.title}</span>

                      <button
                        className="nav-delete-btn"
                        onClick={(e) => handleDelete(e, course.id, course.title)}
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </NavLink>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="nav-section">
            <p className="nav-title">🏆 Stats</p>

            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="xp-badge">
                <Zap size={12} /> {stats.totalQuestions * 10} XP
              </span>

              {stats.streakDays > 0 && (
                <span className="streak-badge">
                  🔥 {stats.streakDays} days
                </span>
              )}
            </div>
          </div>
        </nav>
      </aside>

      {/* Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <AlertTriangle size={48} />
            </div>

            <h3>Delete this course?</h3>

            <p>
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
              <br />This action is <strong>irreversible</strong>.
            </p>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>

              <button className="btn-danger" onClick={confirmDelete}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;