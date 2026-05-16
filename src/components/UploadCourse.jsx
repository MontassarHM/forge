

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
    if (files.length === 0) return alert('Please upload at least one document');

    setLoading(true);
    try {
      setProgress('Reading documents');
      setProgressDetail('Extracting content...');

      const content = await parseMultipleFiles(files);

      if (content.length < 100) {
        throw new Error('The extracted content is too short.');
      }

      setProgress('AI Analysis');
      setProgressDetail(`Analyzing document of ${Math.round(content.length / 1000)}k characters...`);

      const courseData = await generateCourseFromAI({
        content,
        duration,
        difficulty,
      });

      setProgress('Finalizing');
      setProgressDetail('Preparing your learning journey');

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
      console.error('Full error:', error);
      const errorMessage = error?.message || 'Unknown error';
      alert(`Error:\n\n${errorMessage}`);
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
          Create a new <span className="text-accent">course</span>
        </h1>
        <p className="upload-hero-subtitle">
          Turn your documents into interactive learning journeys using AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form-v2">
        {/* Step 1: Upload */}
        <div className="upload-step">
          <div className="step-header">
            <div className="step-number">01</div>
            <div>
              <h3>Upload Your Documents</h3>
              <p>PDF, DOCX, TXT, or Markdown</p>
            </div>
          </div>

          <div
            className={`upload-zone-v2 ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={!loading ? handleDrag : undefined}
            onDragLeave={!loading ? handleDrag : undefined}
            onDragOver={!loading ? handleDrag : undefined}
            onDrop={!loading ? handleDrop : undefined}
          >
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              id="file-input"
              accept=".pdf,.txt,.docx,.md"
              hidden
              disabled={loading}
            />
            <label htmlFor="file-input" className="upload-label-v2">
              <div className="upload-icon-circle">
                <Upload size={32} />
              </div>
              <p className="upload-title">Drag your files here</p>
              <p className="upload-subtitle">or <span className="text-accent">click to browse</span></p>
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
                    title="Remove"
                    disabled={loading}
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
              <h3>Configure Your Course</h3>
              <p>Customize the learning experience</p>
            </div>
          </div>

          <div className="config-grid">
            {/* Duration */}
            <div className="config-card">
              <div className="config-card-header">
                <Clock size={18} />
                <span>Total Duration</span>
              </div>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                min="10"
                max="480"
                className="config-input"
                disabled={loading}
              />
              <p className="config-hint">{duration} minutes</p>
            </div>

            {/* Difficulty */}
            <div className="config-card">
              <div className="config-card-header">
                <Target size={18} />
                <span>Difficulty</span>
              </div>
              <div className="difficulty-options">
                <button
                  type="button"
                  className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => !loading && setDifficulty('easy')}
                  disabled={loading}
                >
                  <span className="diff-dots">●○○</span>
                  Beginner
                </button>
                <button
                  type="button"
                  className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => !loading && setDifficulty('medium')}
                  disabled={loading}
                >
                  <span className="diff-dots">●●○</span>
                  Intermediate
                </button>
                <button
                  type="button"
                  className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => !loading && setDifficulty('hard')}
                  disabled={loading}
                >
                  <span className="diff-dots">●●●</span>
                  Advanced
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>📝 Additional Specifications (optional)</label>
            <textarea
              className="textarea-input"
              placeholder="E.g., Focus on practical cases, code examples, or specific details"
              value={specification}
              onChange={e => setSpecification(e.target.value)}
              rows={3}
              disabled={loading}
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
              Generating course...
            </>
          ) : (
            <>
              <Zap size={20} />
              Generate Course
            </>
          )}
        </button>

        {/* Info box */}
        <div className="info-box">
          <div className="info-box-header">
            <Sparkles size={16} />
            <span>How it works?</span>
          </div>
          <ul className="info-box-list">
            <li>The AI deeply analyzes your document</li>
            <li>A structured course outline is automatically created</li>
            <li>Each chapter is generated with detailed content</li>
            <li>Interactive questions are created to test your knowledge</li>
          </ul>
        </div>
      </form>
    </div>
  );
}

export default UploadCourse;