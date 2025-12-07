import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function AdminPanel() {
  const { API_URL } = useAuth();
  const [users, setUsers] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await axios.get(`${API_URL}/api/admin/users`);
        setUsers(response.data);
      } else if (activeTab === 'reset-requests') {
        const response = await axios.get(`${API_URL}/api/admin/reset-requests`);
        setResetRequests(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите сбросить пароль на qwerty123?')) {
      return;
    }

    try {
      await axios.post(`${API_URL}/api/admin/reset-password/${userId}`);
      alert('Пароль сброшен на qwerty123');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось сбросить пароль');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Изменить роль на ${newRole}?`)) {
      return;
    }

    try {
      await axios.put(
        `${API_URL}/api/admin/users/${userId}/role`,
        null,
        { params: { role: newRole } }
      );
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось изменить роль');
    }
  };

  return (
    <div className="page-shell">
      <div className="w-full max-w-7xl space-y-6 animate-fade-in">
        <div className="surface-card p-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7289DA] font-semibold mb-2">Управление</p>
            <h1 className="text-4xl font-bold text-white">Админ панель</h1>
            <p className="text-[#b9bbbe] mt-2">Управление пользователями и запросами</p>
          </div>

          {error && (
            <div className="mb-4 surface-section p-4 text-red-200 border-2 border-red-400/40 bg-red-500/20 rounded-xl">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-3 mb-6 border-b border-white/10 pb-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-[#5865F2] text-white shadow-lg'
                  : 'text-[#b9bbbe] hover:bg-[#40444b]'
              }`}
            >
              <i className="fas fa-users mr-2"></i>
              Пользователи
            </button>
            <button
              onClick={() => setActiveTab('reset-requests')}
              className={`px-5 py-2 rounded-lg font-semibold transition-all relative ${
                activeTab === 'reset-requests'
                  ? 'bg-[#5865F2] text-white shadow-lg'
                  : 'text-[#b9bbbe] hover:bg-[#40444b]'
              }`}
            >
              <i className="fas fa-key mr-2"></i>
              Запросы сброса
              {resetRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-[#d23369] text-white rounded-full">
                  {resetRequests.length}
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-4xl text-[#7289DA] mb-3"></i>
              <p className="text-xl text-white">Загрузка...</p>
            </div>
          ) : (
            <>
              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="surface-section rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-[#40444b]">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">
                            Пользователь
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">
                            Роль
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">
                            Дата регистрации
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-[#7289DA] uppercase tracking-wider">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-[#40444b]/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-user-circle text-[#7289DA] text-xl"></i>
                                <span className="text-sm font-semibold text-white">{user.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b9bbbe]">
                              {user.email || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${
                                  user.role === 'admin'
                                    ? 'bg-[#5865F2] text-white'
                                    : 'bg-[#40444b] text-[#7289DA] border border-[#7289DA]'
                                }`}
                              >
                                {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b9bbbe]">
                              {new Date(user.created_at).toLocaleDateString('ru-RU')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleToggleRole(user.id, user.role)}
                                className="text-[#7289DA] hover:text-[#5865F2] font-semibold"
                              >
                                <i className="fas fa-exchange-alt mr-1"></i>
                                Сменить роль
                              </button>
                              <button
                                onClick={() => handleResetPassword(user.id)}
                                className="text-[#d23369] hover:text-[#e04377] font-semibold"
                              >
                                <i className="fas fa-key mr-1"></i>
                                Сбросить пароль
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Reset Requests Tab */}
              {activeTab === 'reset-requests' && (
                <div className="space-y-4">
                  {resetRequests.length > 0 ? (
                    resetRequests.map((request) => (
                      <div
                        key={request.id}
                        className="surface-section p-6 flex justify-between items-center hover:border-[#7289DA] border border-transparent transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <i className="fas fa-user-lock text-3xl text-[#7289DA]"></i>
                          <div>
                            <p className="font-bold text-white text-lg">{request.username}</p>
                            <p className="text-sm text-[#b9bbbe]">
                              <i className="fas fa-clock mr-1"></i>
                              Запрос от: {new Date(request.requested_at).toLocaleString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleResetPassword(request.user_id)}
                          className="primary-button"
                        >
                          <i className="fas fa-key mr-2"></i>
                          Сбросить пароль
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="surface-section p-12 text-center">
                      <i className="fas fa-check-circle text-5xl text-[#43b581] mb-4"></i>
                      <p className="text-[#b9bbbe] text-lg">Нет ожидающих запросов на сброс пароля</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
