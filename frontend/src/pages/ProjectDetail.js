import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm';

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
      table({ children }) {
        return (
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-[#40444b] bg-[#2c2f33]">
              {children}
            </table>
          </div>
        );
      },
      thead({ children }) {
        return (
          <thead className="bg-[#36393f] border-b border-[#40444b]">
            {children}
          </thead>
        );
      },
      tbody({ children }) {
        return <tbody>{children}</tbody>;
      },
      tr({ children }) {
        return <tr className="border-b border-[#40444b]">{children}</tr>;
      },
      th({ children }) {
        return (
          <th className="px-4 py-3 text-left font-bold text-[#7289DA] border-r border-[#40444b] last:border-r-0">
            {children}
          </th>
        );
      },
      td({ children }) {
        return (
          <td className="px-4 py-3 text-[#b9bbbe] border-r border-[#40444b] last:border-r-0">
            {children}
          </td>
        );
      },
      h1({ children }) {
        return <h1 className="text-3xl font-bold text-white my-4 mt-6">{children}</h1>;
      },
      h2({ children }) {
        return <h2 className="text-2xl font-bold text-[#7289DA] my-3 mt-5">{children}</h2>;
      },
      h3({ children }) {
        return <h3 className="text-xl font-bold text-[#99aab5] my-2 mt-4">{children}</h3>;
      },
      h4({ children }) {
        return <h4 className="text-lg font-bold text-[#b9bbbe] my-2">{children}</h4>;
      },
      blockquote({ children }) {
        return (
          <blockquote className="border-l-4 border-[#7289DA] pl-4 my-4 text-[#99aab5] italic bg-[#36393f]/50 py-2 pr-4 rounded">
            {children}
          </blockquote>
        );
      },
      ul({ children }) {
        return <ul className="list-disc list-inside my-2 text-[#b9bbbe] space-y-1">{children}</ul>;
      },
      ol({ children }) {
        return <ol className="list-decimal list-inside my-2 text-[#b9bbbe] space-y-1">{children}</ol>;
      },
      li({ children }) {
        return <li className="ml-2">{children}</li>;
      },
      hr() {
        return <hr className="my-6 border-t border-[#40444b]" />;
      },
      strong({ children }) {
        return <strong className="font-bold text-white">{children}</strong>;
      },
      em({ children }) {
        return <em className="italic text-[#99aab5]">{children}</em>;
      },
      p({ children }) {
        return <p className="my-2 text-[#b9bbbe] leading-relaxed">{children}</p>;
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
        <div className="prose dark:prose-invert max-w-none text-[#b9bbbe]">
          <ReactMarkdown
            components={markdownComponents}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {file.content}
          </ReactMarkdown>
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
    <div className="page-shell">
      <div className="w-full max-w-7xl space-y-6 animate-fade-in">
        <div className="surface-card p-8">
          <button
            onClick={() => navigate('/projects')}
            className="muted-button mb-6"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Назад к проектам
          </button>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#7289DA] font-semibold mb-2">Детали проекта</p>
              <h1 className="text-4xl font-bold text-white mb-3">{project.name}</h1>
              <p className="text-[#b9bbbe] leading-relaxed">{project.description}</p>
            </div>
            {isAdmin && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateFileModal(true)}
                  className="primary-button"
                >
                  <i className="fas fa-file-plus mr-2"></i>
                  Создать файл
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="muted-button"
                >
                  <i className="fas fa-upload mr-2"></i>
                  Загрузить файл
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 surface-section p-4 text-red-200 border-2 border-red-400/40 bg-red-500/20 rounded-xl">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-3">
              <div className="surface-section p-5 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <i className="fas fa-folder-open text-[#7289DA]"></i>
                  Файлы
                </h3>
                {project.files?.length > 0 ? (
                  <div className="space-y-2">
                    {project.files.map((file) => (
                      <div
                        key={file.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all border ${
                          selectedFile?.id === file.id 
                            ? 'bg-[#5865F2] border-[#7289DA] text-white' 
                            : 'border-transparent hover:bg-[#40444b] hover:border-[#7289DA]/50 text-[#b9bbbe]'
                        }`}
                        onClick={() => setSelectedFile(file)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium truncate flex items-center gap-2">
                            <i className="fas fa-file text-xs"></i>
                            {file.name}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFile(file.id);
                              }}
                              className="text-[#d23369] hover:text-[#e04377] text-sm"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#b9bbbe] text-center py-4">
                    <i className="fas fa-folder-open text-2xl mb-2 block text-[#7289DA]"></i>
                    Нет файлов
                  </p>
                )}
              </div>
            </div>

            <div className="col-span-12 md:col-span-9">
              <div className="surface-section p-6 rounded-xl">
                {selectedFile ? (
                  <>
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/10">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <i className="fas fa-file-code text-[#7289DA]"></i>
                        {selectedFile.name}
                      </h3>
                      {isAdmin && !selectedFile.is_binary && (
                        <div className="flex gap-2">
                          {editMode ? (
                            <>
                              <button
                                onClick={handleSaveFile}
                                className="primary-button"
                              >
                                <i className="fas fa-save mr-2"></i>
                                Сохранить
                              </button>
                              <button
                                onClick={() => setEditMode(false)}
                                className="muted-button"
                              >
                                Отмена
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleEditFile}
                              className="muted-button"
                            >
                              <i className="fas fa-edit mr-2"></i>
                              Редактировать
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="overflow-auto max-h-[600px] rounded-lg">
                      {editMode ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-96 p-4 font-mono text-sm bg-[#1f2230] border border-white/10 rounded-lg text-white"
                        />
                      ) : (
                        renderFileContent(selectedFile)
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <i className="fas fa-mouse-pointer text-5xl text-[#7289DA] mb-4"></i>
                    <p className="text-[#b9bbbe]">Выберите файл для просмотра</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create File Modal */}
      {showCreateFileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="surface-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <i className="fas fa-file-plus text-[#7289DA]"></i>
              Создать новый файл
            </h2>
            <form onSubmit={handleCreateFile} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#b9bbbe]">Имя файла</label>
                <input
                  type="text"
                  required
                  placeholder="example.js"
                  className="input-field"
                  value={newFile.name}
                  onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#b9bbbe]">Тип файла</label>
                <input
                  type="text"
                  required
                  placeholder="js, py, md, txt и т.д."
                  className="input-field"
                  value={newFile.file_type}
                  onChange={(e) => setNewFile({ ...newFile, file_type: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#b9bbbe]">Содержимое</label>
                <textarea
                  rows="12"
                  className="input-field font-mono text-sm"
                  placeholder="// Ваш код здесь..."
                  value={newFile.content}
                  onChange={(e) => setNewFile({ ...newFile, content: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFileModal(false)}
                  className="muted-button"
                >
                  Отмена
                </button>
                <button type="submit" className="primary-button">
                  <i className="fas fa-check mr-2"></i>
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="surface-card p-8 max-w-md w-full animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <i className="fas fa-upload text-[#7289DA]"></i>
              Загрузить файл
            </h2>
            <form onSubmit={handleUploadFile} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#b9bbbe]">Выберите файл</label>
                <input
                  type="file"
                  required
                  className="input-field"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
                {uploadFile && (
                  <p className="text-xs text-[#7289DA] mt-2">
                    <i className="fas fa-check-circle mr-1"></i>
                    Выбран: {uploadFile.name}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="muted-button"
                >
                  Отмена
                </button>
                <button type="submit" className="primary-button">
                  <i className="fas fa-upload mr-2"></i>
                  Загрузить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
