// Navbar Component
import { auth } from '../auth.js';
import { router } from '../router.js';

const navLinks = [
    { path: '/', label: 'Главная', requiresAuth: false },
    { path: '/services', label: 'Услуги', requiresAuth: false },
    { path: '/projects', label: 'Проекты', requiresAuth: true },
    { path: '/chat', label: 'Чат', requiresAuth: true },
    { path: '/contact', label: 'Контакты', requiresAuth: false },
];

export function renderNavbar() {
    const state = auth.getState();
    const currentPath = router.currentPath;

    const isActive = (path) => currentPath === path;

    const renderLink = (link) => {
        const disabled = link.requiresAuth && !state.user;
        const baseClasses = 'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200';
        const activeClasses = 'bg-gradient-to-r from-[#5a7fb8] to-[#4a6fa5] text-white shadow-lg';
        const idleClasses = 'text-slate-200/90 hover:text-white hover:bg-white/10';
        const disabledClasses = 'opacity-50 cursor-not-allowed';

        const href = disabled ? '/login' : link.path;
        const classes = `${baseClasses} ${disabled ? disabledClasses : isActive(link.path) ? activeClasses : idleClasses}`;
        const title = disabled ? 'Войдите, чтобы открыть раздел' : '';

        return `
            <a href="${href}" data-link class="${classes}" ${title ? `title="${title}"` : ''}>
                ${link.label}
            </a>
        `;
    };

    const linksHtml = navLinks.map(renderLink).join('');

    // Admin link
    const adminLinkHtml = state.isAdmin ? renderLink({ path: '/admin', label: 'Админ панель', requiresAuth: true }) : '';

    // User section
    let userSectionHtml;
    if (state.user) {
        userSectionHtml = `
            <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div class="text-sm text-slate-200/90">
                    <span class="font-semibold text-white">${state.user.username}</span>
                    ${state.isAdmin ? '<span class="ml-2 text-[#6b8fc9]">Администратор</span>' : ''}
                </div>
                <button id="logout-btn" class="rounded-full bg-gradient-to-r from-[#e74c8c] to-[#d63a7a] px-5 py-2 text-sm font-semibold text-white shadow-lg hover:from-[#f06ba4] hover:to-[#e74c8c] transition-all">
                    Выйти
                </button>
            </div>
        `;
    } else {
        userSectionHtml = `
            <div class="flex flex-wrap gap-3">
                <a href="/login" data-link class="rounded-full bg-white/95 px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white">
                    Войти
                </a>
                <a href="/register" data-link class="rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10">
                    Регистрация
                </a>
            </div>
        `;
    }

    return `
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mt-6 mb-4 rounded-2xl border border-white/10 bg-gradient-to-r from-[#1e2838]/95 to-[#1a2332]/95 px-6 py-4 shadow-2xl backdrop-blur-lg">
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div class="flex flex-col gap-3">
                        <div class="flex flex-wrap gap-2">
                            ${linksHtml}
                            ${adminLinkHtml}
                        </div>
                    </div>
                    ${userSectionHtml}
                </div>
            </div>
        </div>
    `;
}

export function mountNavbar() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.innerHTML = renderNavbar();

        // Attach logout handler
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                auth.logout();
                router.navigate('/');
            });
        }
    }
}

// Update navbar (re-render)
export function updateNavbar() {
    mountNavbar();
}

// Initialize navbar with auth subscription
export function initNavbar() {
    auth.subscribe(() => {
        mountNavbar();
    });
}
