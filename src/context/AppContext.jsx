import React, { createContext, useState, useContext, useEffect } from 'react';
import { getStats, getCourses } from '../services/statsService';

// Valeur par défaut pour éviter undefined
const defaultValue = {
  stats: {
    totalCourses: 0,
    completedCourses: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    totalLearningTime: 0,
    weeklyProgress: [],
    questionTypes: { functional: 0, technical: 0 },
    lastActivity: null,
    streakDays: 0
  },
  courses: [],
  currentCourse: null,
  refreshStats: () => {},
  refreshCourses: () => {},
  setCurrentCourse: () => {}
};

const AppContext = createContext(defaultValue);

export const AppProvider = ({ children }) => {
  const [stats, setStats] = useState(() => getStats());
  const [courses, setCourses] = useState(() => getCourses());
  const [currentCourse, setCurrentCourse] = useState(null);

  const refreshStats = () => setStats(getStats());
  const refreshCourses = () => setCourses(getCourses());

  // Refresh au montage
  useEffect(() => {
    refreshStats();
    refreshCourses();
  }, []);

  const value = {
    stats,
    courses,
    currentCourse,
    refreshStats,
    refreshCourses,
    setCurrentCourse
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    console.warn('useApp must be used within AppProvider');
    return defaultValue;
  }
  return context;
};