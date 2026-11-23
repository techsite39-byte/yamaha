import React, { useState } from 'react';
import './YamahaAdminLogin.css';
import { loginAdmin, requestForgotPassword, submitResetPassword } from './adminApi.js';

export function YamahaAdminLogin({ onLoginSuccess }) {
  // Modes: 'login' | 'forgot' | 'reset'
  const [mode, setMode] = useState('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [emailDispatched, setEmailDispatched] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await loginAdmin({
        email: email.trim(),
        password,
        rememberMe,
      });

      if (res?.success) {
        if (onLoginSuccess) {
          onLoginSuccess({
            authenticated: true,
            isAdmin: true,
            user: res.user || { name: 'Sanjay', email: email.trim(), role: 'Super Admin' },
          });
        }
      } else {
        setErrorMessage(res?.message || 'Invalid administrator credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const res = await requestForgotPassword({ email: forgotEmail.trim() });
      setEmailDispatched(Boolean(res.emailSent));
      setForgotSuccess(res.message || 'Verification code generated.');
      if (res.code) {
        setResetCode(res.code);
      } else {
        setResetCode('');
      }
      setMode('reset');
    } catch (err) {
      setForgotError(err.message || 'Could not find an admin account with that email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (newPassword !== confirmPassword) {
      setForgotError('New passwords do not match. Please re-enter.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await submitResetPassword({
        email: forgotEmail.trim(),
        code: resetCode.trim(),
        newPassword,
      });

      setForgotSuccess(res.message || 'Password successfully updated! You can now log in.');
      setPassword(newPassword);
      setEmail(forgotEmail.trim());
      setTimeout(() => {
        setMode('login');
        setErrorMessage('');
      }, 1500);
    } catch (err) {
      setForgotError(err.message || 'Password reset failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="admin-login-screen">
      {/* Ambient background glows */}
      <div className="admin-login-glow admin-login-glow--top" aria-hidden="true" />
      <div className="admin-login-glow admin-login-glow--bottom" aria-hidden="true" />

      <main className="admin-login-container">
        {/* Dealership Branding Header */}
        <header className="admin-login-brand">
          <div className="admin-login-logo-box">
            <img src="/imgs/favicon.png" alt="Vathilai Motors Logo" className="admin-login-logo" />
          </div>
          <div className="admin-login-brand-titles">
            <span className="admin-login-brand-eyebrow">AUTHORISED YAMAHA DEALER · BATLAGUNDU</span>
            <h1 className="admin-login-brand-name">VATHILAI MOTORS</h1>
            <span className="admin-login-brand-system">DEALERSHIP MANAGEMENT PORTAL</span>
          </div>
        </header>

        {/* Main Card */}
        <div className="admin-login-card">
          {mode === 'login' && (
            <>
              <div className="admin-login-header">
                <h2>Administrator Sign In</h2>
                <p>Enter your verified credentials to access sales, bookings, catalog, and operations.</p>
              </div>

              {errorMessage && (
                <div className="admin-login-alert admin-login-alert--error" role="alert">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="admin-login-alert admin-login-alert--success" role="status">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{forgotSuccess}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="admin-login-form" noValidate>
                {/* Email Field */}
                <div className="admin-login-field">
                  <label htmlFor="admin-email" className="admin-login-sr-only">Administrator Email</label>
                  <div className="admin-login-input-wrap">
                    <span className="admin-login-input-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      id="admin-email"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="admin-login-field">
                  <label htmlFor="admin-password" className="admin-login-sr-only">Password</label>
                  <div className="admin-login-input-wrap">
                    <span className="admin-login-input-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="admin-login-toggle-eye"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox & Forgot Password */}
                <div className="admin-login-options">
                  <label className="admin-login-remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                    <span>Remember this device (30 days)</span>
                  </label>
                  <button
                    type="button"
                    className="admin-login-forgot-btn"
                    onClick={() => {
                      setForgotEmail(email.trim() || '');
                      setForgotError('');
                      setForgotSuccess('');
                      setMode('forgot');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="admin-login-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="admin-login-spinner" aria-hidden="true" />
                      <span>Verifying Credentials…</span>
                    </>
                  ) : (
                    <>
                      <span>SIGN IN TO DASHBOARD</span>
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <div className="admin-login-header">
                <h2>Reset Admin Password</h2>
                <p>Enter your administrator email to receive a secure 6-digit verification code.</p>
              </div>

              {forgotError && (
                <div className="admin-login-alert admin-login-alert--error" role="alert">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{forgotError}</span>
                </div>
              )}

              <form onSubmit={handleRequestCode} className="admin-login-form">
                <div className="admin-login-field">
                  <label htmlFor="forgot-email">Registered Email Address</label>
                  <div className="admin-login-input-wrap">
                    <span className="admin-login-input-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Registered email address"
                      disabled={forgotLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="admin-login-submit-btn"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <>
                      <span className="admin-login-spinner" aria-hidden="true" />
                      <span>Generating Code…</span>
                    </>
                  ) : (
                    <span>SEND VERIFICATION CODE →</span>
                  )}
                </button>

                <button
                  type="button"
                  className="admin-login-back-btn"
                  onClick={() => {
                    setMode('login');
                    setForgotError('');
                  }}
                >
                  ← Back to Sign In
                </button>
              </form>
            </>
          )}

          {mode === 'reset' && (
            <>
              <div className="admin-login-header">
                <h2>Enter Code &amp; New Password</h2>
                <p>
                  {emailDispatched ? (
                    <>A 6-digit verification code was dispatched to <strong>{forgotEmail}</strong>. Please check your inbox and spam folder.</>
                  ) : (
                    <>Enter the 6-digit verification code generated for <strong>{forgotEmail}</strong>.</>
                  )}
                </p>
              </div>

              {forgotSuccess && (
                <div className="admin-login-alert admin-login-alert--success" role="status">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotError && (
                <div className="admin-login-alert admin-login-alert--error" role="alert">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{forgotError}</span>
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="admin-login-form">
                <div className="admin-login-field">
                  <label htmlFor="reset-code">6-Digit Verification Code</label>
                  <div className="admin-login-input-wrap">
                    <span className="admin-login-input-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <input
                      id="reset-code"
                      type="text"
                      maxLength={6}
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 849201"
                      disabled={forgotLoading}
                      style={{ letterSpacing: '0.25em', fontWeight: 700, fontSize: '18px' }}
                    />
                  </div>
                </div>

                <div className="admin-login-field">
                  <label htmlFor="new-password">New Secure Password</label>
                  <div className="admin-login-input-wrap">
                    <span className="admin-login-input-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      disabled={forgotLoading}
                    />
                    <button
                      type="button"
                      className="admin-login-toggle-eye"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label="Toggle password visibility"
                      tabIndex={-1}
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="admin-login-field">
                  <label htmlFor="confirm-password">Confirm New Password</label>
                  <div className="admin-login-input-wrap">
                    <span className="admin-login-input-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      disabled={forgotLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="admin-login-submit-btn"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <>
                      <span className="admin-login-spinner" aria-hidden="true" />
                      <span>Updating Password…</span>
                    </>
                  ) : (
                    <span>CONFIRM &amp; UPDATE PASSWORD</span>
                  )}
                </button>

                <button
                  type="button"
                  className="admin-login-back-btn"
                  onClick={() => {
                    setMode('login');
                    setForgotError('');
                  }}
                >
                  ← Back to Sign In
                </button>

                {emailDispatched && (
                  <p style={{ margin: '14px 0 0 0', fontSize: '11.5px', color: '#94a3b8', textAlign: 'center' }}>
                    Didn’t receive the code? Check spam or{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotSuccess('');
                        setForgotError('');
                      }}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
                    >
                      request another code
                    </button>
                  </p>
                )}
              </form>
            </>
          )}
        </div>

        {/* Footer Navigation Back to Customer Showroom */}
        <footer className="admin-login-footer">
          <a href="/" className="admin-login-return-link">
            ← Return to Public Yamaha Showroom
          </a>
          <span className="admin-login-copyright">
            Vathilai Motors — Dealership Address: Parimalam Theatre Complex, Batlagundu, Tamil Nadu – 624202 · Call: 081444 45566
          </span>
        </footer>
      </main>
    </div>
  );
}
export default YamahaAdminLogin;
