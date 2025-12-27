// Projects Page
import { api } from '../api.js';
import { auth } from '../auth.js';
import { formatDate } from '../utils.js';
import { showModal, hideModal } from '../components/modal.js';

let projects = [];

// Fetch projects
async function fetchProjects() {
    try {
        projects = await api.get('/api/projects');
        renderProjectsList();
    } catch (err) {
        showError('Failed to fetch projects');
    }
}

// Render projects list
function renderProjectsList() {
    const container = document.getElementById('projects-grid');
    const state = auth.getState();

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="col-span-full surface-section p-6 text-center text-slate-300">
                No projects yet.
            </div>
        `;
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="surface-section p-5 flex flex-col gap-3">
            <a href="/projects/${project.id}" data-link class="text-xl font-semibold text-[#7289DA] hover:text-[#9bb0ff]">
                ${escapeHtml(project.name)}
            </a>
            <p class="text-slate-200/90 text-sm min-h-[48px]">${escapeHtml(project.description || '')}</p>
            <div class="flex justify-between items-center text-xs text-slate-400">
                <span>${formatDate(project.created_at)}</span>
                ${state.isAdmin ? `
                    <button class="delete-project-btn text-red-300 hover:text-red-100 font-semibold" data-id="${project.id}">
                        Delete
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Attach delete handlers
    document.querySelectorAll('.delete-project-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const projectId = btn.dataset.id;
            if (confirm('Are you sure you want to delete this project?')) {
                await handleDeleteProject(projectId);
            }
        });
    });
}

// Show error
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
    }
}

// Handle delete project
async function handleDeleteProject(projectId) {
    try {
        await api.delete(`/api/projects/${projectId}`);
        await fetchProjects();
    } catch (err) {
        showError(err.message || 'Failed to delete project');
    }
}

// Handle create project
async function handleCreateProject(e) {
    e.preventDefault();

    const name = document.getElementById('project-name').value;
    const description = document.getElementById('project-description').value;

    try {
        await api.post('/api/projects', { name, description });
        hideModal();
        await fetchProjects();
    } catch (err) {
        const errorEl = document.getElementById('modal-error');
        if (errorEl) {
            errorEl.textContent = err.message || 'Failed to create project';
            errorEl.classList.remove('hidden');
        }
    }
}

// Show create modal
function showCreateModal() {
    const content = `
        <form id="create-project-form" class="space-y-4">
            <div id="modal-error" class="hidden surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>
            <div class="space-y-2">
                <label class="block text-sm text-slate-200">Project Name</label>
                <input type="text" id="project-name" required class="input-field" />
            </div>
            <div class="space-y-2">
                <label class="block text-sm text-slate-200">Description</label>
                <textarea rows="3" id="project-description" class="input-field"></textarea>
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" id="cancel-btn" class="muted-button px-4">Cancel</button>
                <button type="submit" class="primary-button px-4">Create</button>
            </div>
        </form>
    `;

    showModal(content, { title: 'Create New Project', icon: 'fas fa-folder-plus' });

    document.getElementById('cancel-btn')?.addEventListener('click', hideModal);
    document.getElementById('create-project-form')?.addEventListener('submit', handleCreateProject);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render projects page
export function render() {
    const state = auth.getState();

    return `
        <div class="page-shell">
            <div class="w-full max-w-6xl space-y-6">
                <div class="surface-card p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-slate-300">Рабочие вещи</p>
                        <h1 class="text-3xl font-bold text-white">Projects</h1>
                    </div>
                    ${state.isAdmin ? `
                        <button id="create-project-btn" class="primary-button">
                            Create Project
                        </button>
                    ` : ''}
                </div>

                <div id="error-container" class="hidden surface-section p-4 text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>

                <div id="projects-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div class="col-span-full text-center py-12 text-xl text-slate-300">Loading...</div>
                </div>
            </div>
        </div>
    `;
}

// Mount projects page
export function mount() {
    fetchProjects();

    document.getElementById('create-project-btn')?.addEventListener('click', showCreateModal);
}

// Unmount
export function unmount() {
    projects = [];
}
