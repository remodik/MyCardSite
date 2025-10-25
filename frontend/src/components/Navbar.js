import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ darkMode, setDarkMode }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-github-darker border-b border-gray-200 dark:border-github-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/projects" className="text-xl font-bold text-github-blue">
              Projects App
            </Link>
            <div className="flex space-x-4">
              <Link
                to="/projects"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/projects')
                    ? 'bg-github-hover text-white'
                    : 'text-github-textSecondary hover:text-github-text hover:bg-github-hover'
                }`}
              >
                Projects
              </Link>
              <Link
                to="/chat"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/chat')
                    ? 'bg-github-hover text-white'
                    : 'text-github-textSecondary hover:text-github-text hover:bg-github-hover'
                }`}
              >
                Chat
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/admin')
                      ? 'bg-github-hover text-white'
                      : 'text-github-textSecondary hover:text-github-text hover:bg-github-hover'
                  }`}
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-md text-github-textSecondary hover:text-github-text hover:bg-github-hover"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <span className="text-sm text-github-textSecondary">
              {user?.username}
              {isAdmin && <span className="ml-1 text-github-blue">(Admin)</span>}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
