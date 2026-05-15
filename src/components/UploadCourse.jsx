import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, Loader } from 'lucide-react';
import { generateCourseFromAI } from '../services/aiService';
import { parseMultipleFiles } from '../services/fileParser';
import { saveCourse, recordActivity } from '../services/statsService';
import { useApp } from '../context/AppContext';

function UploadCourse() {
  const navigate = useNavigate();
  const { refreshCourses, refreshStats } = useApp();
  const [files, setFiles] = useState([]);
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressDetail, setProgressDetail] = useState('');
  const [specification, setSpecification] = useState('');

  const handleFileChange = (e) => {
    setFiles([...files, ...Array.from(e.target.files)]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return alert('Téléchargez au moins un document');

    setLoading(true);
    try {
      // 1. Parse files
      setProgress('📄 Lecture des documents...');
      setProgressDetail('Extraction du texte des fichiers');
      const content = await parseMultipleFiles(files);
      
      if (content.length < 100) {
        throw new Error('Le contenu extrait est trop court.');
      }

      console.log(`📊 Contenu total: ${content.length} caractères`);

      // 2. Generate plan + first chapter
      setProgress('🤖 Analyse du document par l\'IA...');
      setProgressDetail(`Document de ${Math.round(content.length / 1000)}k caractères. Cela peut prendre 1-2 minutes.`);
      
      const courseData = await generateCourseFromAI({
        content,
        duration,
        difficulty,
        specification,
      });

      // 3. Save course
      setProgress('💾 Sauvegarde du cours...');
      setProgressDetail('Préparation pour l\'apprentissage');
      
      const course = {
        ...courseData,
        id: `course_${Date.now()}`,
        difficulty,
        duration,
        sourceFiles: files.map(f => f.name)
      };
      saveCourse(course);
      recordActivity('course_created');

      refreshCourses();
      refreshStats();
      navigate(`/course/${course.id}`);
    } catch (error) {
      alert(`Erreur: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
      setProgress('');
      setProgressDetail('');
    }
  };

  return (
    <div className="upload-page">
      <h1>📤 Créer un nouveau cours</h1>
      <p className="subtitle">L'IA analysera vos documents et générera un cours structuré</p>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="upload-zone">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            id="file-input"
            accept=".pdf,.txt,.docx,.md"
            hidden
          />
          <label htmlFor="file-input" className="upload-label">
            <Upload size={48} />
            <p>Cliquez ou glissez vos documents ici</p>
            <span>PDF, DOCX, TXT, MD - Pas de limite de taille</span>
          </label>
        </div>

        {files.length > 0 && (
          <div className="files-list">
            <h4>📎 Fichiers ({files.length})</h4>
            {files.map((file, idx) => (
              <div key={idx} className="file-item">
                <FileText size={16} />
                <span>{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                <button type="button" onClick={() => removeFile(idx)} className="remove-btn">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label>⏱️ Durée (minutes)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="10" max="480" />
          </div>
          <div className="form-group">
            <label>🎯 Difficulté</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="easy">🟢 Facile</option>
              <option value="medium">🟡 Moyen</option>
              <option value="hard">🔴 Difficile</option>
            </select>
          </div>
        {/* 🔹 Champ Spécification optionnel */}
<div className="form-group">
  <label>📝 Spécifications supplémentaires (optionnel)</label>
  <textarea
    placeholder="Ex: Concentrez-vous sur les cas pratiques, exemples de code, ou détails spécifiques"
    value={specification}
    onChange={e => setSpecification(e.target.value)}
    rows={3}
    />
</div>
        </div>

        {loading && (
          <div className="loading-state">
            <Loader className="spin" size={20} />
            <div>
              <div style={{ fontWeight: 600 }}>{progress}</div>
              {progressDetail && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {progressDetail}
                </div>
              )}
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary btn-large" disabled={loading || files.length === 0}>
          {loading ? '⏳ Génération en cours...' : '🚀 Générer le cours avec l\'IA'}
        </button>

        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: 'var(--bg-tertiary)', 
          borderRadius: 6, 
          fontSize: '0.85rem',
          color: 'var(--text-secondary)' 
        }}>
          💡 <strong>Comment ça marche :</strong>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>📄 Vos documents sont découpés en sections</li>
            <li>🧠 L'IA analyse l'ensemble du contenu</li>
            <li>📋 Un plan de cours structuré est créé</li>
            <li>📖 Le contenu de chaque chapitre est généré au moment où vous l'ouvrez</li>
            <li>⚡ Plus rapide et plus précis qu'une génération en bloc</li>
          </ul>
        </div>
      </form>
    </div>
  );
}

export default UploadCourse;