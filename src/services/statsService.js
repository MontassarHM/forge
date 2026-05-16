const STATS_KEY = "onboarding_stats";
const COURSES_KEY = "onboarding_courses";
const PROGRESS_KEY = "onboarding_progress";

/**
 * Récupère les statistiques globales
 */
export const getStats = () => {
  const stats = localStorage.getItem(STATS_KEY);
  return stats
    ? JSON.parse(stats)
    : {
        totalCourses: 0,
        completedCourses: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        totalLearningTime: 0, // minutes
        weeklyProgress: [],
        questionTypes: { functional: 0, technical: 0 },
        lastActivity: null,
        streakDays: 0,
      };
};

/**
 * Sauvegarde les stats
 */
export const saveStats = (stats) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

/**
 * Enregistre une nouvelle activité
 */
export const recordActivity = (type, data = {}) => {
  const stats = getStats();
  const today = new Date().toISOString().split("T")[0];

  switch (type) {
    case "course_created":
      stats.totalCourses++;
      break;

    case "course_completed":
      stats.completedCourses++;
      break;

    case "question_answered":
      stats.totalQuestions++;
      if (data.correct) stats.correctAnswers++;
      if (data.questionType === "functional") stats.questionTypes.functional++;
      if (data.questionType === "technical") stats.questionTypes.technical++;
      break;

    case "time_spent":
      let minutesToAdd = 0;

      if (data.minutes != null) {
        minutesToAdd = Number(data.minutes);
      } else if (data.ms != null) {
        // Convert milliseconds to minutes
        minutesToAdd = Number(data.ms) / 1000 / 60;
      }

      if (isNaN(minutesToAdd) || minutesToAdd < 0 || minutesToAdd > 1440) {
        // Sanity check: don’t allow negative or absurdly huge minutes (more than 1 day)
        console.warn("recordActivity: Invalid minutes:", minutesToAdd);
        minutesToAdd = 0;
      }

      stats.totalLearningTime += minutesToAdd;
      break;
  }

  // Update weekly progress
  const weekProgress = stats.weeklyProgress.find((w) => w.date === today);
  const score = Math.round(
    (stats.correctAnswers / Math.max(stats.totalQuestions, 1)) * 100,
  );

  if (weekProgress) {
    weekProgress.score = score;
    weekProgress.questions = stats.totalQuestions;
  } else {
    stats.weeklyProgress.push({
      date: today,
      score,
      questions: stats.totalQuestions,
    });
    if (stats.weeklyProgress.length > 7) stats.weeklyProgress.shift();
  }

  stats.lastActivity = new Date().toISOString();

  saveStats(stats);
  return stats;
};

/**
 * Sauvegarder un cours
 */
export const saveCourse = (course) => {
  const courses = getCourses();
  const existing = courses.findIndex((c) => c.id === course.id);
  if (existing >= 0) {
    courses[existing] = course;
  } else {
    courses.push({ ...course, createdAt: new Date().toISOString() });
  }
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  return course;
};

export const getCourses = () => {
  const courses = localStorage.getItem(COURSES_KEY);
  return courses ? JSON.parse(courses) : [];
};

export const getCourseById = (id) => {
  return getCourses().find((c) => c.id === id);
};

/**
 * Sauvegarder la progression d'un cours
 */
export const saveProgress = (courseId, progress) => {
  const allProgress = getAllProgress();
  allProgress[courseId] = { ...allProgress[courseId], ...progress };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
};

export const getAllProgress = () => {
  const progress = localStorage.getItem(PROGRESS_KEY);
  return progress ? JSON.parse(progress) : {};
};

export const getCourseProgress = (courseId) => {
  return (
    getAllProgress()[courseId] || {
      completedChapters: [],
      answeredQuestions: {},
      currentChapter: 0,
      startedAt: null,
      completedAt: null,
    }
  );
};

/**
 * Calcule le pourcentage de complétion d'un cours
 */
export const getCourseCompletion = (course, progress) => {
  if (!course || !course.chapters) return 0;
  return Math.round(
    (progress.completedChapters.length / course.chapters.length) * 100,
  );
};

/**
 * Supprime un cours et sa progression
 */
export const deleteCourse = (courseId) => {
  // Supprimer le cours
  const courses = getCourses().filter((c) => c.id !== courseId);
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));

  // Supprimer la progression associée
  const allProgress = getAllProgress();
  delete allProgress[courseId];
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));

  // Mettre à jour les stats
  const stats = getStats();
  stats.totalCourses = Math.max(0, stats.totalCourses - 1);

  // Si le cours était terminé, décrémenter aussi
  const progress = getCourseProgress(courseId);
  if (progress.completedAt) {
    stats.completedCourses = Math.max(0, stats.completedCourses - 1);
  }

  saveStats(stats);
  return courses;
};

/**
 * Supprime tous les cours (reset complet)
 */
export const deleteAllCourses = () => {
  localStorage.removeItem(COURSES_KEY);
  localStorage.removeItem(PROGRESS_KEY);

  const stats = getStats();
  stats.totalCourses = 0;
  stats.completedCourses = 0;
  saveStats(stats);

  return [];
};

/**
 * Met à jour un chapitre spécifique d'un cours
 */
export const updateChapter = (courseId, chapterIndex, chapterData) => {
  const courses = getCourses();
  const courseIdx = courses.findIndex((c) => c.id === courseId);

  if (courseIdx >= 0) {
    courses[courseIdx].chapters[chapterIndex] = chapterData;
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
    return courses[courseIdx];
  }
  return null;
};

/**
 * Met à jour un cours entier
 */
export const updateCourse = (courseId, updates) => {
  const courses = getCourses();
  const courseIdx = courses.findIndex((c) => c.id === courseId);

  if (courseIdx >= 0) {
    courses[courseIdx] = { ...courses[courseIdx], ...updates };
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
    return courses[courseIdx];
  }
  return null;
};
