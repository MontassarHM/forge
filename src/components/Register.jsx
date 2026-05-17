import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    // Vérification de la force du mot de passe
    const getPasswordStrength = () => {
        const pwd = formData.password;
        if (!pwd) return { level: 0, label: '', color: '' };
        if (pwd.length < 6) return { level: 1, label: 'Trop court', color: '#f87171' };
        if (pwd.length < 8) return { level: 2, label: 'Faible', color: '#fbbf24' };
        if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
            return { level: 4, label: 'Excellent', color: '#4ade80' };
        }
        return { level: 3, label: 'Moyen', color: '#60a5fa' };
    };

    const passwordStrength = getPasswordStrength();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit faire au moins 6 caractères');
            return;
        }

        setLoading(true);

        try {
            await register(formData.email, formData.name, formData.password);
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
                        <h2 className="auth-side-title">Join Us</h2>
                        <p className="auth-side-text">
                            Create your free account and turn your documents into a learning journey.
                        </p>

                        <div className="auth-features">
                            <div className="auth-feature">
                                <div className="auth-feature-icon">📚</div>
                                <div>
                                    <h4>Unlimited Courses</h4>
                                    <p>Create as many courses as you want</p>
                                </div>
                            </div>
                            <div className="auth-feature">
                                <div className="auth-feature-icon">🤖</div>
                                <div>
                                    <h4>Powerful AI</h4>
                                    <p>High-quality automatic generation</p>
                                </div>
                            </div>
                            <div className="auth-feature">
                                <div className="auth-feature-icon">🚀</div>
                                <div>
                                    <h4>100% Free</h4>
                                    <p>No credit card required</p>
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
                                Create an Account
                            </h1>
                            <p className="auth-form-subtitle">
                                Start learning in under a minute
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
                                <label className="auth-label">Full Name</label>
                                <div className="auth-input-wrapper">
                                    <User size={18} className="auth-input-icon" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="auth-input"
                                        required
                                        minLength={2}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

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
                                        minLength={6}
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

                                {/* Password strength indicator */}
                                {formData.password && (
                                    <div className="password-strength">
                                        <div className="password-strength-bars">
                                            {[1, 2, 3, 4].map(level => (
                                                <div
                                                    key={level}
                                                    className="password-strength-bar"
                                                    style={{
                                                        background: level <= passwordStrength.level
                                                            ? passwordStrength.color
                                                            : 'var(--bg-tertiary)'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span
                                            className="password-strength-label"
                                            style={{ color: passwordStrength.color }}
                                        >
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="auth-input-group">
                                <label className="auth-label">Confirm Password</label>
                                <div className="auth-input-wrapper">
                                    <Lock size={18} className="auth-input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="auth-input"
                                        required
                                        disabled={loading}
                                    />
                                    {formData.confirmPassword && (
                                        <div className="auth-input-validation">
                                            {formData.password === formData.confirmPassword ? (
                                                <CheckCircle size={18} style={{ color: 'var(--green)' }} />
                                            ) : (
                                                <AlertCircle size={18} style={{ color: 'var(--red)' }} />
                                            )}
                                        </div>
                                    )}
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
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={18} />
                                        Create My Account
                                    </>
                                )}
                            </button>

                            <p className="auth-terms">
                                By creating an account, you agree to our Terms of Service
                            </p>
                        </form>

                        <div className="auth-divider">
                            <span>or</span>
                        </div>

                        <div className="auth-footer">
                            <p>
                                Already have an account?{' '}
                                <Link to="/login" className="auth-link">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
