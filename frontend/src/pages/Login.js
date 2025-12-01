import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="page-shell">
      <div className="w-full max-w-md">
        <div className="surface-card p-8 space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Вход</h2>
            <p className="text-slate-300 text-sm">Продолжайте в едином стиле главной страницы</p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link to="/reset-password" className="text-[#6b8fc9] hover:text-[#8aa5d6] transition-colors">
                Forgot your password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="primary-button w-full text-center">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="text-center text-sm text-slate-300">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#7289DA] hover:text-[#9bb0ff] font-semibold">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
