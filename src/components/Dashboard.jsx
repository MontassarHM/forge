import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BookOpen, CheckCircle, Clock, Plus, Zap, Flame, Target, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCourseProgress, getCourseCompletion, deleteCourse } from '../services/statsService';

function Dashboard() {
  const navigate = useNavigate();
  const { stats, courses, refreshCourses, refreshStats } = useApp();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const accuracy = stats.totalQuestions > 0 
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
    : 0;

  const handleDelete = (courseId, courseName) => {
    setDeleteConfirm({ id: courseId, name: courseName });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteCourse(deleteConfirm.id);
      refreshCourses();
      refreshStats();
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => setDeleteConfirm(null);

  const statCards = [
    { label: 'Cours créés', value: stats.totalCourses, icon: <BookOpen size={24} />, color: '#FFB800' },
    { label: 'Cours terminés', value: stats.completedCourses, icon: <CheckCircle size={24} />, color: '#3fb950' },
    { label: 'Heures', value: `${Math.round(stats.totalLearningTime / 60 * 10) / 10}h`, icon: <Clock size={24} />, color: '#a371f7' },
    { label: 'Précision', value: `${accuracy}%`, icon: <Target size={24} />, color: '#58a6ff' },
  ];

  const weeklyData = stats.weeklyProgress.length > 0 
    ? stats.weeklyProgress.map(w => ({
        name: new Date(w.date).toLocaleDateString('fr', { day: '2-digit', month: 'short' }),
        score: w.score,
      }))
    : [{ name: 'Aujourd\'hui', score: 0 }];

  const categoryData = [
    { name: 'QCM', value: stats.questionTypes.functional },
    { name: 'Code', value: stats.questionTypes.technical },
  ].filter(c => c.value > 0);

  const COLORS = ['#3fb950', '#FFB800'];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>⚡ Dashboard</h1>
          <p className="subtitle">Continuez votre apprentissage et gagnez de l'XP</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/upload')}>
          <Plus size={18} /> Nouveau cours
        </button>
      </div>

      {/* XP Banner */}
      <div className="xp-banner">
        <div className="xp-stat">
          <p className="xp-label">Niveau actuel</p>
          <h3 className="xp-value level">
            <Zap size={20} /> Level {Math.floor(stats.totalQuestions / 10) + 1}
          </h3>
        </div>
        <div className="xp-stat">
          <p className="xp-label">XP Total</p>
          <h3 className="xp-value">{stats.totalQuestions * 10} XP</h3>
        </div>
        <div className="xp-stat">
          <p className="xp-label">Streak</p>
          <h3 className="xp-value streak">
            <Flame size={20} /> {stats.streakDays || 0} jours
          </h3>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>📈 Progression</h3>
          {weeklyData.length > 1 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <XAxis dataKey="name" stroke="#8b949e" />
                <YAxis stroke="#8b949e" />
                <Tooltip contentStyle={{ background: '#21262d', border: '1px solid #30363d', borderRadius: '6px' }} />
                <Line type="monotone" dataKey="score" stroke="#FFB800" strokeWidth={3} dot={{ fill: '#FFB800', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">📊 Pas encore de données</div>
          )}
        </div>

        <div className="chart-card">
          <h3>🎯 Types de questions</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#21262d', border: '1px solid #30363d', borderRadius: '6px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">🎯 Répondez aux questions</div>
          )}
        </div>
      </div>

      {/* Recent Courses with Delete */}
      <div className="recent-courses">
        <div className="section-header">
          <h3>📚 Mes cours</h3>
        </div>
        {courses.length === 0 ? (
          <div className="empty-courses">
            <p>🎓 Aucun cours créé pour le moment</p>
            <button className="btn-primary" onClick={() => navigate('/upload')}>
              <Plus size={18} /> Créer mon premier cours
            </button>
          </div>
        ) : (
          <div className="courses-list">
            {courses.map(course => {
              const progress = getCourseProgress(course.id);
              const completion = getCourseCompletion(course, progress);
              return (
                <div key={course.id} className="course-item">
                  <div className="course-icon" onClick={() => navigate(`/course/${course.id}`)}>📘</div>
                  <div className="course-info" onClick={() => navigate(`/course/${course.id}`)}>
                    <h4>{course.title}</h4>
                    <p>{course.chapters?.length || 0} chapitres • {course.difficulty}</p>
                  </div>
                  <div className="course-progress" onClick={() => navigate(`/course/${course.id}`)}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${completion}%` }} />
                    </div>
                    <span>{completion}%</span>
                  </div>
                  <button className="btn-secondary" onClick={() => navigate(`/course/${course.id}`)}>
                    {completion === 100 ? '🏆 Revoir' : '▶ Continuer'}
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(course.id, course.title); }}
                    title="Supprimer ce cours"
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <AlertTriangle size={48} />
            </div>
            <h3>Supprimer ce cours ?</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer <strong>"{deleteConfirm.name}"</strong> ?
              <br />
              Cette action est <strong>irréversible</strong> et toute la progression sera perdue.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelDelete}>
                Annuler
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;