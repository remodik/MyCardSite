import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
    { path: '/', label: 'Главная', requiresAuth: false },
    { path: '/projects', label: 'Проекты', requiresAuth: true },
    { path: '/chat', label: 'Чат', requiresAuth: true },
];

export default function Navbar({ darkMode, setDarkMode }) {
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navBackground = darkMode
        ? 'border-white/10 bg-slate-950/80 text-white'
        : 'border-slate-200 bg-white/80 text-slate-900 shadow-sm';
    const brandClasses = darkMode ? 'text-white' : 'text-slate-900';
    const toggleClasses = darkMode
        ? 'bg-white/10 text-white/90 hover:bg-white/20'
        : 'bg-slate-900/10 text-slate-800 hover:bg-slate-900/20';
    const idleLink = darkMode
        ? 'text-slate-200/80 hover:text-white hover:bg-white/10'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80';
    const activeLink = darkMode
        ? 'bg-white/90 text-slate-900 shadow'
        : 'bg-slate-900 text-white shadow';

    const renderLink = (link) => {
        const disabled = link.requiresAuth && !user;
        const baseClasses = 'px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200';
        const activeClasses = activeLink;
        const idleClasses = idleLink;
        const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

        return (
            <Link
                key={link.path}
                to={disabled ? '/login' : link.path}
                className={`${baseClasses} ${
                    disabled ? disabledClasses : isActive(link.path) ? activeClasses : idleClasses
            }`}
                aria-disabled={disabled}
                title={disabled ? 'Войдите, чтобы открыть раздел' : undefined}>
                {link.label}
            </Link>
        );
    };

  return (
    <nav className={`sticky top-0 z-40 border-b backdrop-blur ${navBackground}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className={`text-2xl font-extrabold tracking-tight ${brandClasses}`}>
                MyCardSite
              </Link>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full text-xl ${toggleClasses}`}
                aria-label="Toggle theme"
              >
                  {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {navLinks.map(renderLink)}
              {isAdmin &&
                renderLink({ path: '/admin', label: 'Админ панель', requiresAuth: true })}
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end">
            {user ? (
              <>
                <div className={`text-sm ${darkMode ? 'text-slate-200/90' : 'text-slate-600'}`}>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {user.username}
                  </span>
                  {isAdmin && (
                    <span className={`ml-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                      Администратор
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="w-full rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-rose-400 sm:w-auto"
                >
                  Выйти
                </button>
              </>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className={`rounded-full px-5 py-2 text-sm font-semibold shadow ${
                    darkMode
                      ? 'bg-white/90 text-slate-900 hover:bg-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Войти
                </Link>
                  <Link
                  to="/register"
                  className={`rounded-full px-5 py-2 text-sm font-semibold ${
                    darkMode
                      ? 'border border-white/40 text-white hover:bg-white/10'
                      : 'border border-slate-900/40 text-slate-900 hover:bg-slate-900/10'
                  }`}
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
