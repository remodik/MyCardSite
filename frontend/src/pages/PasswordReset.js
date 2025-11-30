import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function PasswordReset() {
  const [step, setStep] = useState(1);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasEmail, setHasEmail] = useState(true);
  const [emailSent, setEmailSent] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/password-reset-request`, {
        username_or_email: usernameOrEmail,
      });

      setMessage(response.data.message);
      setHasEmail(response.data.has_email);
      setEmailSent(
        Object.prototype.hasOwnProperty.call(response.data, 'email_sent')
          ? response.data.email_sent
          : null
      );

      if (response.data.has_email) {
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset');
    } finally {
        setEmailSent(null);
        setHasEmail(true);
        setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/password-reset`, {
        username_or_email: usernameOrEmail,
        reset_code: resetCode,
        new_password: newPassword,
      });

      setMessage('Password reset successful! You can now log in.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="w-full max-w-md">
        <div className="surface-card p-8 space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Reset your password</h2>
            <p className="text-slate-300 text-sm">Всё оформлено в одном ключе</p>
          </div>

          {step === 1 ? (
            <form className="space-y-5" onSubmit={handleRequestReset}>
              {error && (
                <div className="surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl">
                  {error}
                </div>
              )}
              {message && (
                <div className="surface-section p-3 text-sm text-green-200 border border-green-400/30 bg-green-500/10 rounded-xl space-y-1">
                  <p>{message}</p>
                  {hasEmail && emailSent === false && (
                    <p className="text-xs text-green-100/80">
                      Email delivery failed. Please verify SMTP settings on the server or contact an administrator.
                    </p>
                  )}
                </div>
              )}
              {!hasEmail && message && (
                <div className="surface-section p-3 text-sm text-blue-200 border border-blue-400/30 bg-blue-500/10 rounded-xl">
                  <p>
                    Your request was sent to an administrator. They will review and update your password manually.
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="usernameOrEmail" className="sr-only">
                  Username or Email
                </label>
                <input
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Username or Email"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                />
              </div>

              <button type="submit" disabled={loading} className="primary-button w-full text-center">
                {loading ? 'Requesting...' : 'Request Reset'}
              </button>

              <div className="text-center text-sm">
                <Link to="/login" className="text-[#7289DA] hover:text-[#9bb0ff] font-semibold">
                  Back to Sign in
                </Link>
              </div>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              {error && (
                <div className="surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl">
                  {error}
                </div>
              )}
              {message && (
                <div className="surface-section p-3 text-sm text-green-200 border border-green-400/30 bg-green-500/10 rounded-xl">
                  {message}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label htmlFor="resetCode" className="sr-only">
                    Reset Code
                  </label>
                  <input
                    id="resetCode"
                    name="resetCode"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Enter reset code from email"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="sr-only">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    className="input-field"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="input-field"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="primary-button w-full text-center">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
