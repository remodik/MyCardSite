// Services Page
import { api } from '../api.js';
import { auth } from '../auth.js';
import { showModal, hideModal } from '../components/modal.js';

let services = [];
let expandedId = null;

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Parse frameworks from comma-separated string
function parseFrameworks(frameworks) {
    try {
        return (frameworks || '').split(',').map(f => f.trim()).filter(Boolean);
    } catch {
        return [];
    }
}

// Fetch services
async function fetchServices() {
    try {
        const state = auth.getState();
        services = await api.get('/api/services');
        renderServicesList();
    } catch (err) {
        showError('Не удалось загрузить услуги');
    }
}

// Render services list
function renderServicesList() {
    const container = document.getElementById('services-list');
    const state = auth.getState();

    if (services.length === 0) {
        container.innerHTML = `
            <div class="surface-section p-6 text-center text-slate-300">
                Услуги пока не добавлены.
            </div>
        `;
        return;
    }

    container.innerHTML = services.map(service => {
        const isExpanded = expandedId === service.id;
        const frameworks = parseFrameworks(service.frameworks);

        return `
            <div class="surface-card overflow-hidden transition-all duration-300">
                <button class="service-header w-full p-6 text-left hover:bg-white/5 transition-colors" data-id="${service.id}">
                    <div class="flex justify-between items-start gap-4">
                        <div class="flex-1">
                            <h3 class="text-xl font-semibold text-white mb-2">${escapeHtml(service.name)}</h3>
                            <p class="text-slate-300 text-sm line-clamp-2">${escapeHtml(service.description)}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-[#7289DA] font-bold text-lg">${escapeHtml(service.price)}</span>
                            <i class="fas fa-chevron-down text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}"></i>
                        </div>
                    </div>
                </button>

                <div class="service-content ${isExpanded ? '' : 'hidden'} px-6 pb-6 space-y-4 animate-fade-in">
                    <div class="border-t border-white/10 pt-4 space-y-3">
                        <div>
                            <h4 class="text-sm font-semibold text-slate-400 mb-1">Описание</h4>
                            <p class="text-slate-200 whitespace-pre-wrap">${escapeHtml(service.description)}</p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 class="text-sm font-semibold text-slate-400 mb-1">
                                    <i class="fas fa-dollar-sign mr-2"></i>Стоимость
                                </h4>
                                <p class="text-white font-semibold">${escapeHtml(service.price)}</p>
                            </div>
                            <div>
                                <h4 class="text-sm font-semibold text-slate-400 mb-1">
                                    <i class="fas fa-clock mr-2"></i>Время выполнения
                                </h4>
                                <p class="text-white">${escapeHtml(service.estimated_time)}</p>
                            </div>
                        </div>

                        <div>
                            <h4 class="text-sm font-semibold text-slate-400 mb-1">
                                <i class="fas fa-credit-card mr-2"></i>Методы оплаты
                            </h4>
                            <p class="text-slate-200">${escapeHtml(service.payment_methods)}</p>
                        </div>

                        ${frameworks.length > 0 ? `
                            <div>
                                <h4 class="text-sm font-semibold text-slate-400 mb-2">
                                    <i class="fas fa-code mr-2"></i>Технологии
                                </h4>
                                <div class="flex flex-wrap gap-2">
                                    ${frameworks.map(fw => `<span class="pill-tag">${escapeHtml(fw)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${state.isAdmin ? `
                            <div class="flex gap-3 pt-3 border-t border-white/10">
                                <button class="edit-service-btn muted-button px-4" data-id="${service.id}">
                                    Редактировать
                                </button>
                                <button class="delete-service-btn text-red-300 hover:text-red-100 font-semibold px-4" data-id="${service.id}">
                                    Удалить
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    attachEventListeners();
}

// Attach event listeners
function attachEventListeners() {
    // Accordion headers
    document.querySelectorAll('.service-header').forEach(header => {
        header.addEventListener('click', () => {
            const id = header.dataset.id;
            expandedId = expandedId === id ? null : id;
            renderServicesList();
        });
    });

    // Edit buttons
    document.querySelectorAll('.edit-service-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const service = services.find(s => s.id === btn.dataset.id);
            if (service) showServiceModal(service);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-service-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Вы уверены, что хотите удалить эту услугу?')) {
                await handleDeleteService(btn.dataset.id);
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

// Handle delete service
async function handleDeleteService(serviceId) {
    try {
        await api.delete(`/api/services/${serviceId}`);
        await fetchServices();
    } catch (err) {
        showError(err.message || 'Не удалось удалить услугу');
    }
}

// Show service modal (create/edit)
function showServiceModal(service = null) {
    const isEdit = !!service;

    const content = `
        <form id="service-form" class="space-y-4">
            <div id="modal-error" class="hidden surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>

            <div class="space-y-2">
                <label class="block text-sm text-slate-200">Название услуги</label>
                <input type="text" id="service-name" required class="input-field" value="${escapeHtml(service?.name || '')}" />
            </div>

            <div class="space-y-2">
                <label class="block text-sm text-slate-200">Описание</label>
                <textarea rows="4" id="service-description" required class="input-field">${escapeHtml(service?.description || '')}</textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label class="block text-sm text-slate-200">Стоимость</label>
                    <input type="text" id="service-price" required class="input-field" placeholder="например: 5000 руб." value="${escapeHtml(service?.price || '')}" />
                </div>
                <div class="space-y-2">
                    <label class="block text-sm text-slate-200">Время выполнения</label>
                    <input type="text" id="service-time" required class="input-field" placeholder="например: 3-5 дней" value="${escapeHtml(service?.estimated_time || '')}" />
                </div>
            </div>

            <div class="space-y-2">
                <label class="block text-sm text-slate-200">Методы оплаты</label>
                <input type="text" id="service-payment" required class="input-field" placeholder="например: Карта, PayPal, Криптовалюта" value="${escapeHtml(service?.payment_methods || '')}" />
            </div>

            <div class="space-y-2">
                <label class="block text-sm text-slate-200">Технологии/Фреймворки (через запятую)</label>
                <input type="text" id="service-frameworks" required class="input-field" placeholder="например: React, FastAPI, PostgreSQL" value="${escapeHtml(service?.frameworks || '')}" />
            </div>

            <div class="flex justify-end gap-3">
                <button type="button" id="cancel-btn" class="muted-button px-4">Отмена</button>
                <button type="submit" class="primary-button px-4">${isEdit ? 'Сохранить' : 'Создать'}</button>
            </div>
        </form>
    `;

    showModal(content, {
        title: isEdit ? 'Редактировать услугу' : 'Создать новую услугу',
        icon: 'fas fa-briefcase',
        size: '2xl'
    });

    document.getElementById('cancel-btn')?.addEventListener('click', hideModal);
    document.getElementById('service-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('service-name').value,
            description: document.getElementById('service-description').value,
            price: document.getElementById('service-price').value,
            estimated_time: document.getElementById('service-time').value,
            payment_methods: document.getElementById('service-payment').value,
            frameworks: document.getElementById('service-frameworks').value,
        };

        try {
            if (isEdit) {
                await api.put(`/api/services/${service.id}`, formData);
            } else {
                await api.post('/api/services', formData);
            }
            hideModal();
            await fetchServices();
        } catch (err) {
            const errorEl = document.getElementById('modal-error');
            if (errorEl) {
                errorEl.textContent = err.message || 'Не удалось сохранить услугу';
                errorEl.classList.remove('hidden');
            }
        }
    });
}

// Render services page
export function render() {
    const state = auth.getState();

    return `
        <div class="page-shell">
            <div class="w-full max-w-6xl space-y-6">
                <div class="surface-card p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-slate-300">Профессиональные услуги</p>
                        <h1 class="text-3xl font-bold text-white">Мои услуги</h1>
                    </div>
                    ${state.isAdmin ? `
                        <button id="create-service-btn" class="primary-button">
                            Добавить услугу
                        </button>
                    ` : ''}
                </div>

                <div id="error-container" class="hidden surface-section p-4 text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>

                <div id="services-list" class="space-y-4">
                    <div class="text-center py-12 text-xl text-slate-300">Загрузка...</div>
                </div>
            </div>
        </div>
    `;
}

// Mount services page
export function mount() {
    fetchServices();

    document.getElementById('create-service-btn')?.addEventListener('click', () => showServiceModal());
}

// Unmount
export function unmount() {
    services = [];
    expandedId = null;
}
