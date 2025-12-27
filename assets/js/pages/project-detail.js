// Project Detail Page
import { api } from '../api.js';
import { auth } from '../auth.js';
import { router } from '../router.js';
import { getLanguage, renderMarkdown, isImageFile, isVideoFile, escapeHtml } from '../utils.js';
import { showModal, hideModal } from '../components/modal.js';

let project = null;
let selectedFile = null;
let editMode = false;
let editContent = '';

// Fetch project
async function fetchProject(id) {
    try {
        project = await api.get(`/api/projects/${id}`);
        if (project.files?.length > 0) {
            selectedFile = project.files[0];
        }
        renderPage();
    } catch (err) {
        showError('Failed to fetch project');
    }
}

// Render the page content
function renderPage() {
    const container = document.getElementById('project-content');
    const state = auth.getState();

    if (!project) {
        container.innerHTML = '<div class="text-center py-12 text-xl text-slate-300">Project not found</div>';
        return;
    }

    container.innerHTML = `
        <button id="back-btn" class="muted-button mb-6">
            <i class="fas fa-arrow-left mr-2"></i>
            Назад к проектам
        </button>

        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
            <div>
                <p class="text-xs uppercase tracking-[0.2em] text-[#7289DA] font-semibold mb-2">Детали проекта</p>
                <h1 class="text-4xl font-bold text-white mb-3">${escapeHtml(project.name)}</h1>
                <p class="text-[#b9bbbe] leading-relaxed">${escapeHtml(project.description || '')}</p>
            </div>
            ${state.isAdmin ? `
                <div class="flex gap-3">
                    <button id="create-file-btn" class="primary-button">
                        <i class="fas fa-file-plus mr-2"></i>
                        Создать файл
                    </button>
                    <button id="upload-file-btn" class="muted-button">
                        <i class="fas fa-upload mr-2"></i>
                        Загрузить файл
                    </button>
                </div>
            ` : ''}
        </div>

        <div id="error-message" class="hidden mb-6 surface-section p-4 text-red-200 border-2 border-red-400/40 bg-red-500/20 rounded-xl">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span id="error-text"></span>
        </div>

        <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12 md:col-span-3">
                <div class="surface-section p-5 rounded-xl">
                    <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <i class="fas fa-folder-open text-[#7289DA]"></i>
                        Файлы
                    </h3>
                    ${renderFilesList()}
                </div>
            </div>

            <div class="col-span-12 md:col-span-9">
                <div class="surface-section p-6 rounded-xl">
                    ${renderFilePreview()}
                </div>
            </div>
        </div>
    `;

    attachEventListeners();
}

// Render files list
function renderFilesList() {
    const state = auth.getState();

    if (!project.files?.length) {
        return `
            <p class="text-sm text-[#b9bbbe] text-center py-4">
                <i class="fas fa-folder-open text-2xl mb-2 block text-[#7289DA]"></i>
                Нет файлов
            </p>
        `;
    }

    return `
        <div class="space-y-2">
            ${project.files.map(file => `
                <div class="file-item ${selectedFile?.id === file.id ? 'active' : ''}" data-file-id="${file.id}">
                    <span class="text-sm font-medium truncate flex items-center gap-2">
                        <i class="fas fa-file text-xs"></i>
                        ${escapeHtml(file.name)}
                    </span>
                    ${state.isAdmin ? `
                        <button class="delete-file-btn delete-btn" data-file-id="${file.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

// Render file preview
function renderFilePreview() {
    const state = auth.getState();

    if (!selectedFile) {
        return `
            <div class="text-center py-20">
                <i class="fas fa-mouse-pointer text-5xl text-[#7289DA] mb-4"></i>
                <p class="text-[#b9bbbe]">Выберите файл для просмотра</p>
            </div>
        `;
    }

    const headerHtml = `
        <div class="flex justify-between items-center mb-5 pb-4 border-b border-white/10">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <i class="fas fa-file-code text-[#7289DA]"></i>
                ${escapeHtml(selectedFile.name)}
            </h3>
            ${state.isAdmin && !selectedFile.is_binary ? `
                <div class="flex gap-2">
                    ${editMode ? `
                        <button id="save-file-btn" class="primary-button">
                            <i class="fas fa-save mr-2"></i>
                            Сохранить
                        </button>
                        <button id="cancel-edit-btn" class="muted-button">
                            Отмена
                        </button>
                    ` : `
                        <button id="edit-file-btn" class="muted-button">
                            <i class="fas fa-edit mr-2"></i>
                            Редактировать
                        </button>
                    `}
                </div>
            ` : ''}
        </div>
    `;

    let contentHtml;

    if (editMode) {
        contentHtml = `
            <textarea id="edit-textarea" class="w-full h-96 p-4 font-mono text-sm bg-[#1f2230] border border-white/10 rounded-lg text-white">${escapeHtml(editContent)}</textarea>
        `;
    } else {
        contentHtml = `<div class="overflow-auto max-h-[600px] rounded-lg">${renderFileContent(selectedFile)}</div>`;
    }

    return headerHtml + contentHtml;
}

// Render file content based on type
function renderFileContent(file) {
    if (!file) return '';

    if (file.is_binary) {
        const fileType = file.file_type.toLowerCase();

        if (isImageFile(fileType)) {
            return `<img src="data:image/${fileType};base64,${file.content}" alt="${escapeHtml(file.name)}" class="max-w-full h-auto" />`;
        }

        if (isVideoFile(fileType)) {
            return `
                <video controls class="max-w-full h-auto">
                    <source src="data:video/${fileType};base64,${file.content}" type="video/${fileType}" />
                    Your browser does not support the video tag.
                </video>
            `;
        }

        return '<p class="text-github-textSecondary">Binary file - cannot display</p>';
    }

    // Markdown
    if (file.file_type === 'md') {
        const html = renderMarkdown(file.content);
        // Re-highlight after render
        setTimeout(() => {
            if (typeof Prism !== 'undefined') {
                Prism.highlightAll();
            }
        }, 0);
        return `<div class="prose dark:prose-invert max-w-none text-[#b9bbbe]">${html}</div>`;
    }

    // Code with syntax highlighting
    const language = getLanguage(file.file_type);
    let highlightedCode = escapeHtml(file.content);

    if (typeof Prism !== 'undefined' && Prism.languages[language]) {
        try {
            highlightedCode = Prism.highlight(file.content, Prism.languages[language], language);
        } catch (e) {
            console.error('Prism highlight error:', e);
        }
    }

    return `<pre class="language-${language} line-numbers"><code class="language-${language}">${highlightedCode}</code></pre>`;
}

// Attach event listeners
function attachEventListeners() {
    // Back button
    document.getElementById('back-btn')?.addEventListener('click', () => router.navigate('/projects'));

    // File selection
    document.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.delete-file-btn')) return;
            const fileId = item.dataset.fileId;
            selectedFile = project.files.find(f => f.id === fileId);
            editMode = false;
            renderPage();
        });
    });

    // Delete file
    document.querySelectorAll('.delete-file-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this file?')) {
                await handleDeleteFile(btn.dataset.fileId);
            }
        });
    });

    // Create file button
    document.getElementById('create-file-btn')?.addEventListener('click', showCreateFileModal);

    // Upload file button
    document.getElementById('upload-file-btn')?.addEventListener('click', showUploadFileModal);

    // Edit file button
    document.getElementById('edit-file-btn')?.addEventListener('click', () => {
        editMode = true;
        editContent = selectedFile.content;
        renderPage();
    });

    // Save file button
    document.getElementById('save-file-btn')?.addEventListener('click', handleSaveFile);

    // Cancel edit button
    document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
        editMode = false;
        renderPage();
    });

    // Re-highlight code
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
}

// Show error
function showError(message) {
    const errorEl = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    if (errorEl && errorText) {
        errorText.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

// Handle delete file
async function handleDeleteFile(fileId) {
    try {
        await api.delete(`/api/files/${fileId}`);
        if (selectedFile?.id === fileId) {
            selectedFile = null;
        }
        await fetchProject(project.id);
    } catch (err) {
        showError(err.message || 'Failed to delete file');
    }
}

// Handle save file
async function handleSaveFile() {
    const newContent = document.getElementById('edit-textarea')?.value;
    if (newContent === undefined) return;

    try {
        await api.put(`/api/files/${selectedFile.id}`, { content: newContent });
        editMode = false;
        await fetchProject(project.id);
    } catch (err) {
        showError(err.message || 'Failed to save file');
    }
}

// Show create file modal
function showCreateFileModal() {
    const content = `
        <form id="create-file-form" class="space-y-5">
            <div id="modal-error" class="hidden surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-[#b9bbbe]">Имя файла</label>
                <input type="text" id="file-name" required placeholder="example.js" class="input-field" />
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-[#b9bbbe]">Тип файла</label>
                <input type="text" id="file-type" required placeholder="js, py, md, txt и т.д." class="input-field" />
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-[#b9bbbe]">Содержимое</label>
                <textarea rows="12" id="file-content" class="input-field font-mono text-sm" placeholder="// Ваш код здесь..."></textarea>
            </div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" id="cancel-btn" class="muted-button">Отмена</button>
                <button type="submit" class="primary-button">
                    <i class="fas fa-check mr-2"></i>
                    Создать
                </button>
            </div>
        </form>
    `;

    showModal(content, { title: 'Создать новый файл', icon: 'fas fa-file-plus', size: '2xl' });

    document.getElementById('cancel-btn')?.addEventListener('click', hideModal);
    document.getElementById('create-file-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileData = {
            project_id: project.id,
            name: document.getElementById('file-name').value,
            file_type: document.getElementById('file-type').value,
            content: document.getElementById('file-content').value,
        };

        try {
            await api.post('/api/files', fileData);
            hideModal();
            await fetchProject(project.id);
        } catch (err) {
            const errorEl = document.getElementById('modal-error');
            if (errorEl) {
                errorEl.textContent = err.message || 'Failed to create file';
                errorEl.classList.remove('hidden');
            }
        }
    });
}

// Show upload file modal
function showUploadFileModal() {
    const content = `
        <form id="upload-file-form" class="space-y-5">
            <div id="modal-error" class="hidden surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-[#b9bbbe]">Выберите файл</label>
                <input type="file" id="file-input" required class="input-field" />
                <p id="file-info" class="hidden text-xs text-[#7289DA] mt-2">
                    <i class="fas fa-check-circle mr-1"></i>
                    <span id="file-info-text"></span>
                </p>
            </div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" id="cancel-btn" class="muted-button">Отмена</button>
                <button type="submit" class="primary-button">
                    <i class="fas fa-upload mr-2"></i>
                    Загрузить
                </button>
            </div>
        </form>
    `;

    showModal(content, { title: 'Загрузить файл', icon: 'fas fa-upload' });

    const fileInput = document.getElementById('file-input');
    fileInput?.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const fileInfo = document.getElementById('file-info');
            const fileInfoText = document.getElementById('file-info-text');
            if (fileInfo && fileInfoText) {
                fileInfoText.textContent = `Выбран: ${file.name}`;
                fileInfo.classList.remove('hidden');
            }
        }
    });

    document.getElementById('cancel-btn')?.addEventListener('click', hideModal);
    document.getElementById('upload-file-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput?.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('project_id', project.id);
        formData.append('file', file);

        try {
            await api.upload('/api/files/upload', formData);
            hideModal();
            await fetchProject(project.id);
        } catch (err) {
            const errorEl = document.getElementById('modal-error');
            if (errorEl) {
                errorEl.textContent = err.message || 'Failed to upload file';
                errorEl.classList.remove('hidden');
            }
        }
    });
}

// Render project detail page (initial shell)
export function render(params) {
    return `
        <div class="page-shell">
            <div class="w-full max-w-7xl space-y-6 animate-fade-in">
                <div id="project-content" class="surface-card p-8">
                    <div class="text-center py-12 text-xl text-slate-300">Loading...</div>
                </div>
            </div>
        </div>
    `;
}

// Mount project detail page
export function mount(params) {
    const { id } = params;
    fetchProject(id);
}

// Unmount
export function unmount() {
    project = null;
    selectedFile = null;
    editMode = false;
    editContent = '';
}
