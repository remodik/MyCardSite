// Admin Panel Page
import { api } from '../api.js';
import { formatDate, formatDateTime, escapeHtml } from '../utils.js';

let users = [];
let resetRequests = [];
let activeTab = 'users';

// Fetch data based on active tab
async function fetchData() {
    try {
        if (activeTab === 'users') {
            users = await api.get('/api/admin/users');
        } else if (activeTab === 'reset-requests') {
            resetRequests = await api.get('/api/admin/reset-requests');
        }
        renderContent();
    } catch (err) {
        showError(err.message || 'Не удалось загрузить данные');
    }
}

// Show error
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${escapeHtml(message)}`;
        errorContainer.classList.remove('hidden');
    }
}

// Handle reset password
async function handleResetPassword(userId) {
    if (!confirm('Вы уверены, что хотите сбросить пароль на qwerty123?')) return;

    try {
        await api.post(`/api/admin/reset-password/${userId}`);
        alert('Пароль сброшен на qwerty123');
        await fetchData();
    } catch (err) {
        showError(err.message || 'Не удалось сбросить пароль');
    }
}

// Handle toggle role
async function handleToggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Изменить роль на ${newRole}?`)) return;

    try {
        await api.put(`/api/admin/users/${userId}/role?role=${newRole}`);
        await fetchData();
    } catch (err) {
        showError(err.message || 'Не удалось изменить роль');
    }
}

// Render content based on active tab
function renderContent() {
    const container = document.getElementById('tab-content');
    if (!container) return;

    if (activeTab === 'users') {
        container.innerHTML = renderUsersTable();
    } else if (activeTab === 'reset-requests') {
        container.innerHTML = renderResetRequests();
    }

    attachEventListeners();
}

// Render users table
function renderUsersTable() {
    if (users.length === 0) {
        return '<div class="text-center py-12 text-slate-300">Нет пользователей</div>';
    }

    return `
        <div class="surface-section rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-[#40444b]">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">Пользователь</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">Email</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">Роль</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">Дата регистрации</th>
                            <th class="px-6 py-4 text-right text-xs font-bold text-[#7289DA] uppercase tracking-wider">Действия</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/10">
                        ${users.map(user => `
                            <tr class="hover:bg-[#40444b]/50 transition-colors">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center gap-2">
                                        <i class="fas fa-user-circle text-[#7289DA] text-xl"></i>
                                        <span class="text-sm font-semibold text-white">${escapeHtml(user.username)}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-[#b9bbbe]">
                                    ${user.email ? escapeHtml(user.email) : '-'}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-3 py-1 inline-flex text-xs font-bold rounded-full ${
                                        user.role === 'admin'
                                            ? 'bg-[#5865F2] text-white'
                                            : 'bg-[#40444b] text-[#7289DA] border border-[#7289DA]'
                                    }">
                                        ${user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-[#b9bbbe]">
                                    ${formatDate(user.created_at)}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button class="toggle-role-btn text-[#7289DA] hover:text-[#5865F2] font-semibold" data-id="${user.id}" data-role="${user.role}">
                                        <i class="fas fa-exchange-alt mr-1"></i>
                                        Сменить роль
                                    </button>
                                    <button class="reset-password-btn text-[#d23369] hover:text-[#e04377] font-semibold" data-id="${user.id}">
                                        <i class="fas fa-key mr-1"></i>
                                        Сбросить пароль
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Render reset requests
function renderResetRequests() {
    if (resetRequests.length === 0) {
        return `
            <div class="surface-section p-12 text-center">
                <i class="fas fa-check-circle text-5xl text-[#43b581] mb-4"></i>
                <p class="text-[#b9bbbe] text-lg">Нет ожидающих запросов на сброс пароля</p>
            </div>
        `;
    }

    return `
        <div class="space-y-4">
            ${resetRequests.map(request => `
                <div class="surface-section p-6 flex justify-between items-center hover:border-[#7289DA] border border-transparent transition-all">
                    <div class="flex items-center gap-4">
                        <i class="fas fa-user-lock text-3xl text-[#7289DA]"></i>
                        <div>
                            <p class="font-bold text-white text-lg">${escapeHtml(request.username)}</p>
                            <p class="text-sm text-[#b9bbbe]">
                                <i class="fas fa-clock mr-1"></i>
                                Запрос от: ${formatDateTime(request.requested_at)}
                            </p>
                        </div>
                    </div>
                    <button class="reset-password-btn primary-button" data-id="${request.user_id}">
                        <i class="fas fa-key mr-2"></i>
                        Сбросить пароль
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Attach event listeners
function attachEventListeners() {
    // Toggle role buttons
    document.querySelectorAll('.toggle-role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleToggleRole(btn.dataset.id, btn.dataset.role);
        });
    });

    // Reset password buttons
    document.querySelectorAll('.reset-password-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleResetPassword(btn.dataset.id);
        });
    });
}

// Render admin panel page
export function render() {
    return `
        <div class="page-shell">
            <div class="w-full max-w-7xl space-y-6 animate-fade-in">
                <div class="surface-card p-8">
                    <div class="mb-6">
                        <p class="text-xs uppercase tracking-[0.2em] text-[#7289DA] font-semibold mb-2">Управление</p>
                        <h1 class="text-4xl font-bold text-white">Админ панель</h1>
                        <p class="text-[#b9bbbe] mt-2">Управление пользователями и запросами</p>
                    </div>

                    <div id="error-container" class="hidden mb-4 surface-section p-4 text-red-200 border-2 border-red-400/40 bg-red-500/20 rounded-xl"></div>

                    <!-- Tabs -->
                    <div class="flex gap-3 mb-6 border-b border-white/10 pb-4">
                        <button id="tab-users" class="tab-btn px-5 py-2 rounded-lg font-semibold transition-all ${activeTab === 'users' ? 'bg-[#5865F2] text-white shadow-lg' : 'text-[#b9bbbe] hover:bg-[#40444b]'}">
                            <i class="fas fa-users mr-2"></i>
                            Пользователи
                        </button>
                        <button id="tab-reset-requests" class="tab-btn px-5 py-2 rounded-lg font-semibold transition-all relative ${activeTab === 'reset-requests' ? 'bg-[#5865F2] text-white shadow-lg' : 'text-[#b9bbbe] hover:bg-[#40444b]'}">
                            <i class="fas fa-key mr-2"></i>
                            Запросы сброса
                            <span id="reset-badge" class="hidden ml-2 px-2 py-0.5 text-xs bg-[#d23369] text-white rounded-full"></span>
                        </button>
                    </div>

                    <!-- Tab Content -->
                    <div id="tab-content">
                        <div class="text-center py-12">
                            <i class="fas fa-spinner fa-spin text-4xl text-[#7289DA] mb-3"></i>
                            <p class="text-xl text-white">Загрузка...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Mount admin panel page
export function mount() {
    // Attach tab click handlers
    document.getElementById('tab-users')?.addEventListener('click', () => {
        activeTab = 'users';
        updateTabStyles();
        fetchData();
    });

    document.getElementById('tab-reset-requests')?.addEventListener('click', () => {
        activeTab = 'reset-requests';
        updateTabStyles();
        fetchData();
    });

    // Initial fetch
    fetchData();

    // Also fetch reset requests for badge
    api.get('/api/admin/reset-requests').then(data => {
        resetRequests = data;
        updateResetBadge();
    }).catch(() => {});
}

// Update tab styles
function updateTabStyles() {
    const usersTab = document.getElementById('tab-users');
    const resetTab = document.getElementById('tab-reset-requests');

    if (usersTab) {
        usersTab.className = `tab-btn px-5 py-2 rounded-lg font-semibold transition-all ${activeTab === 'users' ? 'bg-[#5865F2] text-white shadow-lg' : 'text-[#b9bbbe] hover:bg-[#40444b]'}`;
    }
    if (resetTab) {
        resetTab.className = `tab-btn px-5 py-2 rounded-lg font-semibold transition-all relative ${activeTab === 'reset-requests' ? 'bg-[#5865F2] text-white shadow-lg' : 'text-[#b9bbbe] hover:bg-[#40444b]'}`;
    }
}

// Update reset requests badge
function updateResetBadge() {
    const badge = document.getElementById('reset-badge');
    if (badge) {
        if (resetRequests.length > 0) {
            badge.textContent = resetRequests.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// Unmount
export function unmount() {
    users = [];
    resetRequests = [];
    activeTab = 'users';
}
