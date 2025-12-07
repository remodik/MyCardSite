import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { path: '/', label: 'Главная', requiresAuth: false },
  { path: '/services', label: 'Услуги', requiresAuth: false },
  { path: '/projects', label: 'Проекты', requiresAuth: true },
  { path: '/chat', label: 'Чат', requiresAuth: true },
  { path: '/contact', label: 'Контакты', requiresAuth: false },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const renderLink = (link) => {
    const disabled = link.requiresAuth && !user;
    const baseClasses =
      'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200';
    const activeClasses = 'bg-gradient-to-r from-[#5a7fb8] to-[#4a6fa5] text-white shadow-lg';
    const idleClasses = 'text-slate-200/90 hover:text-white hover:bg-white/10';
    const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

    return (
      <Link
        key={link.path}
        to={disabled ? '/login' : link.path}
        className={`${baseClasses} ${
          disabled ? disabledClasses : isActive(link.path) ? activeClasses : idleClasses
        }`}
        aria-disabled={disabled}
        title={disabled ? 'Войдите, чтобы открыть раздел' : undefined}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-6 mb-4 rounded-2xl border border-white/10 bg-gradient-to-r from-[#1e2838]/95 to-[#1a2332]/95 px-6 py-4 shadow-2xl backdrop-blur-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {navLinks.map(renderLink)}
                {isAdmin &&
                  renderLink({ path: '/admin', label: 'Админ панель', requiresAuth: true })}
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end">
              {user ? (
                <>
                  <div className="text-sm text-slate-200/90">
                    <span className="font-semibold text-white">{user.username}</span>
                    {isAdmin && <span className="ml-2 text-[#6b8fc9]">Администратор</span>}
                  </div>
                  <button
                    onClick={logout}
                    className="rounded-full bg-gradient-to-r from-[#e74c8c] to-[#d63a7a] px-5 py-2 text-sm font-semibold text-white shadow-lg hover:from-[#f06ba4] hover:to-[#e74c8c] transition-all"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/login"
                    className="rounded-full bg-white/95 px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white"
                  >
                    Войти
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
