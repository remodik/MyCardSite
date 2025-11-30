import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Projects() {
  const { API_URL, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects`);
      setProjects(response.data);
    } catch (err) {
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/projects`, newProject);
      setShowCreateModal(false);
      setNewProject({ name: '', description: '' });
      await fetchProjects();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await axios.delete(`${API_URL}/api/projects/${projectId}`);
      await fetchProjects();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="w-full max-w-6xl space-y-6">
        <div className="surface-card p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Рабочие вещи</p>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
          </div>
          {isAdmin && (
            <button onClick={() => setShowCreateModal(true)} className="primary-button">
              Create Project
            </button>
          )}
        </div>

        {error && (
          <div className="surface-section p-4 text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div key={project.id} className="surface-section p-5 flex flex-col gap-3">
              <Link to={`/projects/${project.id}`} className="text-xl font-semibold text-[#7289DA] hover:text-[#9bb0ff]">
                {project.name}
              </Link>
              <p className="text-slate-200/90 text-sm min-h-[48px]">{project.description}</p>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-300 hover:text-red-100 font-semibold"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="surface-section p-6 text-center text-slate-300">No projects yet.</div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="surface-card p-6 max-w-md w-full space-y-4">
              <h2 className="text-2xl font-bold text-white">Create New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm text-slate-200">Project Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-slate-200">Description</label>
                  <textarea
                    rows="3"
                    className="input-field"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="muted-button px-4"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button px-4">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
