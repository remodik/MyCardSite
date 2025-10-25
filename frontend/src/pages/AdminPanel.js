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
      setError(err.response?.data?.detail || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('Are you sure you want to reset this user\'s password to qwerty123?')) {
      return;
    }

    try {
      await axios.post(`${API_URL}/api/admin/reset-password/${userId}`);
      alert('Password reset to qwerty123');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change user role to ${newRole}?`)) {
      return;
    }

    try {
      await axios.put(
        `${API_URL}/api/admin/users/${userId}/role`,
        null,
        { params: { role: newRole } }
      );
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update role');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-github-border mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-github-blue text-github-blue'
                : 'border-transparent text-github-textSecondary hover:text-github-text'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('reset-requests')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reset-requests'
                ? 'border-github-blue text-github-blue'
                : 'border-transparent text-github-textSecondary hover:text-github-text'
            }`}
          >
            Password Reset Requests
            {resetRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {resetRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-xl">Loading...</p>
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-github-border">
                <thead className="bg-github-hover">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-github-textSecondary uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-github-textSecondary uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-github-textSecondary uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-github-textSecondary uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-github-textSecondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-github-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-github-hover">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-github-textSecondary">
                        {user.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-github-textSecondary">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleRole(user.id, user.role)}
                          className="text-github-blue hover:text-blue-500"
                        >
                          Toggle Role
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="text-yellow-600 hover:text-yellow-500"
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reset Requests Tab */}
          {activeTab === 'reset-requests' && (
            <div className="space-y-4">
              {resetRequests.length > 0 ? (
                resetRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-github-border dark:bg-github-hover rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{request.username}</p>
                      <p className="text-sm text-github-textSecondary">
                        Requested: {new Date(request.requested_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleResetPassword(request.user_id)}
                      className="px-4 py-2 bg-github-blue text-white rounded-md hover:bg-blue-600"
                    >
                      Reset Password
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-github-textSecondary">No pending reset requests</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
