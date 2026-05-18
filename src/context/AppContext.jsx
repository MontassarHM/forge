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
  workspaces: [],
  currentCourse: null,
  refreshStats: () => { },
  refreshCourses: () => { },
  addWorkspace: () => { },
  deleteWorkspace: () => { },
  setCurrentCourse: () => { }
};

const AppContext = createContext(defaultValue);

export const AppProvider = ({ children }) => {
  const [stats, setStats] = useState(() => getStats());
  const [courses, setCourses] = useState(() => getCourses());
  const [workspaces, setWorkspaces] = useState(() => {
    return JSON.parse(localStorage.getItem('workspaces')) || [];
  });

  const [currentCourse, setCurrentCourse] = useState(null);

  const refreshStats = () => {
    setStats(getStats());
  };

  const refreshCourses = () => {
    setCourses(getCourses());
  };

  const addWorkspace = (workspaceData) => {

    if (!workspaceData.name.trim()) return;

    const newWorkspace = {
      id: `workspace_${Date.now()}`,

      name: workspaceData.name,

      description:
        workspaceData.description || '',

      createdAt:
        new Date().toISOString()
    };

    const updatedWorkspaces = [
      ...workspaces,
      newWorkspace
    ];

    setWorkspaces(updatedWorkspaces);

    localStorage.setItem(
      'workspaces',
      JSON.stringify(updatedWorkspaces)
    );
  };

  const deleteWorkspace = (workspaceId) => {

    // remove workspace
    const updatedWorkspaces =
      workspaces.filter(
        ws => ws.id !== workspaceId
      );

    setWorkspaces(updatedWorkspaces);

    localStorage.setItem(
      'workspaces',
      JSON.stringify(updatedWorkspaces)
    );

    // OPTIONAL (recommended):
    // remove workspaceId from courses
    const updatedCourses =
      courses.map(course =>
        course.workspaceId === workspaceId
          ? { ...course, workspaceId: null }
          : course
      );

    setCourses(updatedCourses);

    localStorage.setItem(
      'courses',
      JSON.stringify(updatedCourses)
    );
  };

  useEffect(() => {
    refreshStats();
    refreshCourses();
  }, []);

  const value = {
    stats,
    courses,
    workspaces,
    currentCourse,
    refreshStats,
    refreshCourses,
    addWorkspace,
    deleteWorkspace,
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