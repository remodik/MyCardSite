import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function PasswordReset() {
  const [step, setStep] = useState(1); // 1: request, 2: enter code
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasEmail, setHasEmail] = useState(true);

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

      if (response.data.has_email) {
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset');
    } finally {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-github-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset your password
          </h2>
        </div>

        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            {message && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
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
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-github-border placeholder-gray-500 dark:placeholder-github-textSecondary text-gray-900 dark:text-white bg-white dark:bg-github-hover rounded-md focus:outline-none focus:ring-github-blue focus:border-github-blue sm:text-sm"
                placeholder="Username or Email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-github-blue hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-github-blue disabled:opacity-50"
              >
                {loading ? 'Requesting...' : 'Request Reset'}
              </button>
            </div>

            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-github-blue hover:text-blue-500">
                Back to Sign in
              </Link>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            {message && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="resetCode" className="sr-only">
                  Reset Code
                </label>
                <input
                  id="resetCode"
                  name="resetCode"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-github-border placeholder-gray-500 dark:placeholder-github-textSecondary text-gray-900 dark:text-white bg-white dark:bg-github-hover rounded-md focus:outline-none focus:ring-github-blue focus:border-github-blue sm:text-sm"
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
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-github-border placeholder-gray-500 dark:placeholder-github-textSecondary text-gray-900 dark:text-white bg-white dark:bg-github-hover rounded-md focus:outline-none focus:ring-github-blue focus:border-github-blue sm:text-sm"
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
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-github-border placeholder-gray-500 dark:placeholder-github-textSecondary text-gray-900 dark:text-white bg-white dark:bg-github-hover rounded-md focus:outline-none focus:ring-github-blue focus:border-github-blue sm:text-sm"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-github-blue hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-github-blue disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
