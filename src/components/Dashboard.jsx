import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BookOpen, CheckCircle, Clock, Plus, Zap, Flame, Target, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCourseProgress, getCourseCompletion, deleteCourse } from '../services/statsService';

// Custom hook for live HH:mm:ss timer
const useLiveLearningTime = (initialMinutes) => {
  const [secondsElapsed, setSecondsElapsed] = useState(Math.floor(initialMinutes * 60));

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(secondsElapsed / 3600);
  const minutes = Math.floor((secondsElapsed % 3600) / 60);
  const seconds = secondsElapsed % 60;

  // Format "HH:mm:ss" with leading zeros
  const pad = (n) => n.toString().padStart(2, '0');
  return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
};

function Dashboard() {
  const navigate = useNavigate();
  const { stats, courses, refreshCourses, refreshStats } = useApp();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const accuracy = stats.totalQuestions > 0
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
    : 0;

  const liveLearningTime = useLiveLearningTime(stats.totalLearningTime);

  const handleDelete = (courseId, courseName) => setDeleteConfirm({ id: courseId, name: courseName });
  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteCourse(deleteConfirm.id);
      refreshCourses();
      refreshStats();
      setDeleteConfirm(null);
    }
  };
  const cancelDelete = () => setDeleteConfirm(null);

  // Animate stat cards
  const statCards = [
    { label: 'Courses created', value: stats.totalCourses, icon: <BookOpen size={24} />, color: '#FFD700' },
    { label: 'Completed courses', value: stats.completedCourses, icon: <CheckCircle size={24} />, color: '#00FF7F' },
    // { label: 'Total time', value: liveLearningTime, icon: <Clock size={24} />, color: '#8A2BE2' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: <Target size={24} />, color: '#1E90FF' },
  ];

  const weeklyData = stats.weeklyProgress.length > 0
    ? stats.weeklyProgress.map(w => ({
      name: new Date(w.date).toLocaleDateString('fr', { day: '2-digit', month: 'short' }),
      score: w.score,
    }))
    : [{ name: 'Aujourd\'hui', score: 0 }];

  const level = Math.floor(stats.totalQuestions / 10) + 1;
  const currentXP = stats.totalQuestions * 10;
  const currentLevelXP = (level - 1) * 100;
  const nextLevelXP = level * 100;
  const xpInLevel = currentXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const xpPercent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header animated fadeInDown">
        <div>
          <h1>⚡Dashboard</h1>
          <p className="subtitle">Learn, progress, and earn XP!</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/upload')}>
          <Plus size={18} /> New Course
        </button>
      </div>

      {/* XP Banner */}
      <div className="xp-banner animated fadeInUp">
        <div className="xp-stat">
          <p className="xp-label">Current Level</p>
          <div className="xp-bar-container">
            <div className="xp-bar" style={{ width: `${(stats.totalQuestions % 10) * 10}%` }} />
          </div>
          <div className="xp-level-card">
            <div className="xp-level-header">
              <h3 className="xp-value level">
                <Zap size={20} /> Level {level}
              </h3>
              <span className="xp-next">
                {xpInLevel}/{xpNeeded} XP
              </span>
            </div>

            <div className="fun-progress-container">
              <div
                className="fun-progress-bar"
                style={{ '--xp-percent': `${xpPercent}%` }}
              >
                <div className="fun-progress-shine"></div>
                <div className="fun-progress-particles"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="xp-stat">
          <p className="xp-label">Total XP</p>
          <h3 className="xp-value">{stats.totalQuestions * 10} XP</h3>
        </div>
        <div className="xp-stat">
          <p className="xp-label">Streak</p>
          <div className="streak-bar-container">
            <div className="streak-bar" style={{ width: `${Math.min(stats.streakDays * 10, 100)}%` }} />
          </div>
          <h3 className="xp-value streak">
            <Flame size={20} /> {stats.streakDays || 0} days
          </h3>
        </div>
      </div>

      {/* Animated Stat Cards */}
      <div className="stats-grid">
        {statCards.map((stat, idx) => (
          <div key={idx} className="stat-card animated fadeIn" style={{ animationDelay: `${idx * 0.2}s` }}>
            <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
            <div>
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="chart-card animated fadeInUp">
        <h3>📈 Weekly Progress</h3>
        {weeklyData.length > 1 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip contentStyle={{ background: '#222', border: '1px solid #444', borderRadius: '6px' }} />
              <Line type="monotone" dataKey="score" stroke="#FFD700" strokeWidth={3} dot={{ fill: '#FFD700', r: 5 }} animationDuration={1000} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="empty-chart">📊 No data yet</div>}
      </div>

      {/* Courses List */}
      <div className="recent-courses">
        <div className="section-header animated fadeIn">
          <h3>📚 My Courses</h3>
        </div>
        {courses.length === 0 ? (
          <div className="empty-courses animated fadeIn">
            <p>🎓 No courses created yet</p>
            <button className="btn-primary" onClick={() => navigate('/upload')}>
              <Plus size={18} /> Create my first course
            </button>
          </div>
        ) : (
          <div className="courses-list">
            {courses.map(course => {
              const progress = getCourseProgress(course.id); // always fetch latest
              const completion = getCourseCompletion(course, progress); // recalc dynamically

              return (
                <div key={course.id} className="course-item">
                  <div className="course-icon" onClick={() => navigate(`/course/${course.id}`)}>📘</div>
                  <div className="course-info" onClick={() => navigate(`/course/${course.id}`)}>
                    <h4>{course.title}</h4>
                    <p>{course.chapters?.length || 0} chapters • {course.difficulty}</p>
                  </div>
                  <div className="course-progress" onClick={() => navigate(`/course/${course.id}`)}>
                    <div className="progress-bar">
                      <div className="progress-bar-bg">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${completion}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="progress-label">{completion}%</span>
                  </div>
                  <button className="btn-secondary" onClick={() => navigate(`/course/${course.id}`)}>
                    {completion === 100 ? '🏆 Review' : '▶ Continue'}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(course.id, course.title); }}
                    title="Delete this course"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal animated shake" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <AlertTriangle size={48} />
            </div>
            <h3>Delete this course?</h3>
            <p>
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
              <br />This action is <strong>irreversible</strong> and all progress will be lost.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelDelete}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;