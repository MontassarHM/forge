import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(formData.email, formData.password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="auth-page">
            <div className="auth-bg-pattern"></div>

            <div className="auth-container">
                {/* Left side - Decorative */}
                <div className="auth-side">
                    <div className="auth-side-content">
                        <div className="auth-logo">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="auth-side-title">Welcome Back</h2>
                        <p className="auth-side-text">
                            Continue your interactive learning journey and unlock new skills.
                        </p>

                        <div className="auth-features">
                            <div className="auth-feature">
                                <div className="auth-feature-icon">⚡</div>
                                <div>
                                    <h4>Fast Learning</h4>
                                    <p>AI personalized for you</p>
                                </div>
                            </div>
                            <div className="auth-feature">
                                <div className="auth-feature-icon">🎯</div>
                                <div>
                                    <h4>Custom Courses</h4>
                                    <p>Adapted to your level</p>
                                </div>
                            </div>
                            <div className="auth-feature">
                                <div className="auth-feature-icon">🏆</div>
                                <div>
                                    <h4>Progress Tracking</h4>
                                    <p>Visualize your progress</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side - Form */}
                <div className="auth-form-side">
                    <div className="auth-form-container">
                        <div className="auth-form-header">
                            <h1 className="auth-form-title">
                                Login
                            </h1>
                            <p className="auth-form-subtitle">
                                Access your learning space
                            </p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="auth-input-group">
                                <label className="auth-label">Email</label>
                                <div className="auth-input-wrapper">
                                    <Mail size={18} className="auth-input-icon" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="auth-input"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label className="auth-label">Password</label>
                                <div className="auth-input-wrapper">
                                    <Lock size={18} className="auth-input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="auth-input"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="auth-toggle-password"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="auth-submit-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="auth-spinner"></div>
                                        Logging in...
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        Sign In
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="auth-divider">
                            <span>or</span>
                        </div>

                        <div className="auth-footer">
                            <p>
                                Don't have an account yet?{' '}
                                <Link to="/register" className="auth-link">
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Login;
