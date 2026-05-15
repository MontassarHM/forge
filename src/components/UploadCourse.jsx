

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader, Zap, Sparkles, Clock, Target } from 'lucide-react';
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
  const [dragActive, setDragActive] = useState(false);
  const [specification, setSpecification] = useState('');

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles([...files, ...newFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles([...files, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📕',
      docx: '📘',
      doc: '📘',
      txt: '📄',
      md: '📝'
    };
    return icons[ext] || '📎';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return alert('Téléchargez au moins un document');

    setLoading(true);
    try {
      setProgress('Lecture des documents');
      setProgressDetail('Extraction du contenu en cours...');
      const content = await parseMultipleFiles(files);

      if (content.length < 100) {
        throw new Error('Le contenu extrait est trop court.');
      }

      setProgress('Analyse par l\'IA');
      setProgressDetail(`Document de ${Math.round(content.length / 1000)}k caractères en cours d'analyse...`);

      const courseData = await generateCourseFromAI({
        content,
        duration,
        difficulty,
      });

      setProgress('Finalisation');
      setProgressDetail('Préparation de votre parcours d\'apprentissage');

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
      console.error('Erreur complète:', error);
      const errorMessage = error?.message || 'Erreur inconnue';
      alert(`Erreur:\n\n${errorMessage}`);
    } finally {
      setLoading(false);
      setProgress('');
      setProgressDetail('');
    }
  };

  return (
    <div className="upload-page-v2">
      {/* Hero header */}
      <div className="upload-hero">
        <div className="upload-hero-icon">
          <Sparkles size={36} />
        </div>
        <h1 className="upload-hero-title">
          Créer un nouveau <span className="text-accent">cours</span>
        </h1>
        <p className="upload-hero-subtitle">
          Transformez vos documents en parcours d'apprentissage interactif avec l'IA
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form-v2">
        {/* Step 1: Upload */}
        <div className="upload-step">
          <div className="step-header">
            <div className="step-number">01</div>
            <div>
              <h3>Importer vos documents</h3>
              <p>PDF, DOCX, TXT ou Markdown</p>
            </div>
          </div>

          <div
            className={`upload-zone-v2 ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              id="file-input"
              accept=".pdf,.txt,.docx,.md"
              hidden
            />
            <label htmlFor="file-input" className="upload-label-v2">
              <div className="upload-icon-circle">
                <Upload size={32} />
              </div>
              <p className="upload-title">Glissez vos fichiers ici</p>
              <p className="upload-subtitle">ou <span className="text-accent">cliquez pour parcourir</span></p>
              <div className="file-types">
                <span className="file-type-badge">PDF</span>
                <span className="file-type-badge">DOCX</span>
                <span className="file-type-badge">TXT</span>
                <span className="file-type-badge">MD</span>
              </div>
            </label>
          </div>

          {files.length > 0 && (
            <div className="files-grid">
              {files.map((file, idx) => (
                <div key={idx} className="file-card">
                  <div className="file-card-icon">{getFileIcon(file.name)}</div>
                  <div className="file-card-info">
                    <p className="file-card-name">{file.name}</p>
                    <p className="file-card-size">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="file-card-remove"
                    title="Retirer"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Configuration */}
        <div className="upload-step">
          <div className="step-header">
            <div className="step-number">02</div>
            <div>
              <h3>Configurer votre cours</h3>
              <p>Personnalisez l'expérience d'apprentissage</p>
            </div>
          </div>

          <div className="config-grid">
            {/* Duration */}
            <div className="config-card">
              <div className="config-card-header">
                <Clock size={18} />
                <span>Durée totale</span>
              </div>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                min="10"
                max="480"
                className="config-input"
              />
              <p className="config-hint">{duration} minutes</p>
            </div>

            {/* Difficulty */}
            <div className="config-card">
              <div className="config-card-header">
                <Target size={18} />
                <span>Difficulté</span>
              </div>
              <div className="difficulty-options">
                <button
                  type="button"
                  className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  <span className="diff-dots">●○○</span>
                  Débutant
                </button>
                <button
                  type="button"
                  className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  <span className="diff-dots">●●○</span>
                  Intermédiaire
                </button>
                <button
                  type="button"
                  className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  <span className="diff-dots">●●●</span>
                  Avancé
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>📝 Spécifications supplémentaires (optionnel)</label>
            <textarea className="textarea-input"
              placeholder="Ex: Concentrez-vous sur les cas pratiques, exemples de code, ou détails spécifiques"
              value={specification}
              onChange={e => setSpecification(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-card">
            <div className="loading-icon">
              <Loader className="spin" size={32} />
            </div>
            <div className="loading-content">
              <h4>{progress}</h4>
              <p>{progressDetail}</p>
              <div className="loading-progress-bar">
                <div className="loading-progress-fill"></div>
              </div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          className="submit-btn"
          disabled={loading || files.length === 0}
        >
          {loading ? (
            <>
              <Loader className="spin" size={20} />
              Génération en cours...
            </>
          ) : (
            <>
              <Zap size={20} />
              Générer le cours
            </>
          )}
        </button>

        {/* Info box */}
        <div className="info-box">
          <div className="info-box-header">
            <Sparkles size={16} />
            <span>Comment ça marche ?</span>
          </div>
          <ul className="info-box-list">
            <li>L'IA analyse votre document en profondeur</li>
            <li>Un plan de cours structuré est créé automatiquement</li>
            <li>Chaque chapitre est généré avec du contenu détaillé</li>
            <li>Des questions interactives sont créées pour tester vos connaissances</li>
          </ul>
        </div>
      </form>
    </div>
  );
}

export default UploadCourse;