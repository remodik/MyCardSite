import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { API_URL, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFile, setNewFile] = useState({ name: '', content: '', file_type: 'txt' });
  const [uploadFile, setUploadFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');

  const fetchProject = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects/${id}`);
      setProject(response.data);
      if (response.data.files?.length > 0) {
        setSelectedFile(response.data.files[0]);
      }
    } catch (err) {
      setError('Failed to fetch project');
    } finally {
      setLoading(false);
    }
  }, [API_URL, id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const markdownComponents = useMemo(
    () => ({
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            showLineNumbers
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
        a({ href, children, ...props }) {
        const isExternal = href?.startsWith('http');
        return (
          <a
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            {...props}
          >
            {children}
          </a>
        );
      },
    }),
    []
  );

  const handleCreateFile = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/files`, {
        ...newFile,
        project_id: id,
      });
      setShowCreateFileModal(false);
      setNewFile({ name: '', content: '', file_type: 'txt' });
      await fetchProject();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create file');
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('project_id', id);
    formData.append('file', uploadFile);

    try {
      await axios.post(`${API_URL}/api/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setShowUploadModal(false);
      setUploadFile(null);
      await fetchProject();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await axios.delete(`${API_URL}/api/files/${fileId}`);
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
      await fetchProject();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete file');
    }
  };

  const handleEditFile = () => {
    setEditMode(true);
    setEditContent(selectedFile.content);
  };

  const handleSaveFile = async () => {
    try {
      await axios.put(`${API_URL}/api/files/${selectedFile.id}`, {
        content: editContent,
      });
      setEditMode(false);
      await fetchProject();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save file');
    }
  };

  const renderFileContent = (file) => {
    if (!file) return null;

    if (file.is_binary) {
      const fileType = file.file_type.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'].includes(fileType)) {
        return (
          <img
            src={`data:image/${fileType};base64,${file.content}`}
            alt={file.name}
            className="max-w-full h-auto"
          />
        );
      } else if (['mp4', 'avi', 'mov', 'webm'].includes(fileType)) {
        return (
          <video controls className="max-w-full h-auto">
            <source src={`data:video/${fileType};base64,${file.content}`} type={`video/${fileType}`} />
            Your browser does not support the video tag.
          </video>
        );
      } else {
        return <p className="text-github-textSecondary">Binary file - cannot display</p>;
      }
    }

    if (file.file_type === 'md') {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown components={markdownComponents}>{file.content}</ReactMarkdown>
        </div>
      );
    }

    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      swift: 'swift',
      kt: 'kotlin',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      sql: 'sql',
      sh: 'bash',
      bash: 'bash',
      txt: 'text',
    };

    const language = languageMap[file.file_type] || 'text';

    return (
      <SyntaxHighlighter style={vscDarkPlus} language={language} showLineNumbers>
        {file.content}
      </SyntaxHighlighter>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Project not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button onClick={() => navigate('/projects')} className="text-github-blue hover:underline mb-4">
          ← Back to Projects
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-github-textSecondary mt-2">{project.description}</p>
          </div>
          {isAdmin && (
            <div className="space-x-2">
              <button
                onClick={() => setShowCreateFileModal(true)}
                className="px-4 py-2 bg-github-blue text-white rounded-md hover:bg-blue-600"
              >
                Create File
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Upload File
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* File List */}
        <div className="col-span-3 border border-github-border dark:bg-github-hover rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Files</h3>
          {project.files?.length > 0 ? (
            <div className="space-y-2">
              {project.files.map((file) => (
                <div
                  key={file.id}
                  className={`p-2 rounded cursor-pointer hover:bg-github-dark ${
                    selectedFile?.id === file.id ? 'bg-github-dark' : ''
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm truncate">{file.name}</span>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-github-textSecondary">No files yet</p>
          )}
        </div>

        {/* File Content */}
        <div className="col-span-9 border border-github-border dark:bg-github-hover rounded-lg p-6">
          {selectedFile ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{selectedFile.name}</h3>
                {isAdmin && !selectedFile.is_binary && (
                  <div className="space-x-2">
                    {editMode ? (
                      <>
                        <button
                          onClick={handleSaveFile}
                          className="px-3 py-1 bg-github-blue text-white rounded text-sm hover:bg-blue-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditMode(false)}
                          className="px-3 py-1 border border-github-border rounded text-sm hover:bg-github-dark"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEditFile}
                        className="px-3 py-1 border border-github-border rounded text-sm hover:bg-github-dark"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="overflow-auto max-h-[70vh]">
                {editMode ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-96 p-4 font-mono text-sm bg-github-darker border border-github-border rounded"
                  />
                ) : (
                  renderFileContent(selectedFile)
                )}
              </div>
            </>
          ) : (
            <p className="text-github-textSecondary">Select a file to view</p>
          )}
        </div>
      </div>

      {/* Create File Modal */}
      {showCreateFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-github-darker border border-github-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New File</h2>
            <form onSubmit={handleCreateFile}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">File Name</label>
                  <input
                    type="text"
                    required
                    placeholder="example.js"
                    className="w-full px-3 py-2 border border-github-border bg-github-hover rounded-md focus:outline-none focus:ring-github-blue focus:border-github-blue"
                    value={newFile.name}
                    onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">File Type</label>
                  <input
                    type="text"
                    required
                    placeholder="js, py, md, txt, etc."
                    className="w-full px-3 py-2 border border-github-border bg-github-hover rounded-md focus:outline-none focus:ring-github-blue focus:border-github-blue"
                    value={newFile.file_type}
                    onChange={(e) => setNewFile({ ...newFile, file_type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    rows="10"
                    className="w-full px-3 py-2 font-mono text-sm border border-github-border bg-github-hover rounded-md focus:outline-none focus:ring-github-blue focus:border-github-blue"
                    value={newFile.content}
                    onChange={(e) => setNewFile({ ...newFile, content: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateFileModal(false)}
                  className="px-4 py-2 border border-github-border rounded-md hover:bg-github-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-github-blue text-white rounded-md hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-github-darker border border-github-border rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Upload File</h2>
            <form onSubmit={handleUploadFile}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select File</label>
                  <input
                    type="file"
                    required
                    className="w-full px-3 py-2 border border-github-border bg-github-hover rounded-md"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-github-border rounded-md hover:bg-github-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-github-blue text-white rounded-md hover:bg-blue-600"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
