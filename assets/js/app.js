// Main Application Module
import { auth } from './auth.js';
import { router } from './router.js';
import { renderNavbar, updateNavbar } from './components/navbar.js';

// Import all pages
import * as homePage from './pages/home.js';
import * as loginPage from './pages/login.js';
import * as registerPage from './pages/register.js';
import * as passwordResetPage from './pages/password-reset.js';
import * as projectsPage from './pages/projects.js';
import * as projectDetailPage from './pages/project-detail.js';
import * as servicesPage from './pages/services.js';
import * as contactPage from './pages/contact.js';
import * as chatPage from './pages/chat.js';
import * as adminPanelPage from './pages/admin-panel.js';

// Current page module reference
let currentPage = null;

// Route guards
function authGuard() {
    const state = auth.getState();
    if (!state.isAuthenticated) {
        router.navigate('/login');
        return false;
    }
    return true;
}

function guestGuard() {
    const state = auth.getState();
    if (state.isAuthenticated) {
        router.navigate('/');
        return false;
    }
    return true;
}

function adminGuard() {
    const state = auth.getState();
    if (!state.isAuthenticated) {
        router.navigate('/login');
        return false;
    }
    if (!state.isAdmin) {
        router.navigate('/');
        return false;
    }
    return true;
}

// Render a page
function renderPage(pageModule, params = {}) {
    // Unmount current page
    if (currentPage && currentPage.unmount) {
        currentPage.unmount();
    }

    // Get app container
    const app = document.getElementById('app');
    if (!app) return;

    // Render new page
    app.innerHTML = pageModule.render(params);

    // Mount new page
    if (pageModule.mount) {
        pageModule.mount(params);
    }

    // Store current page reference
    currentPage = pageModule;

    // Scroll to top
    window.scrollTo(0, 0);
}

// Setup routes
function setupRoutes() {
    // Public routes
    router.addRoute('/', () => renderPage(homePage));
    router.addRoute('/services', () => renderPage(servicesPage));
    router.addRoute('/contact', () => renderPage(contactPage));

    // Guest-only routes (redirect if authenticated)
    router.addRoute('/login', () => {
        if (guestGuard()) renderPage(loginPage);
    });
    router.addRoute('/register', () => {
        if (guestGuard()) renderPage(registerPage);
    });
    router.addRoute('/reset-password', () => renderPage(passwordResetPage));

    // Protected routes (require authentication)
    router.addRoute('/projects', () => {
        if (authGuard()) renderPage(projectsPage);
    });
    router.addRoute('/projects/:id', (params) => {
        if (authGuard()) renderPage(projectDetailPage, params);
    });
    router.addRoute('/chat', () => {
        if (authGuard()) renderPage(chatPage);
    });

    // Admin routes
    router.addRoute('/admin', () => {
        if (adminGuard()) renderPage(adminPanelPage);
    });

    // 404 handler
    router.setNotFound(() => {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="page-shell">
                    <div class="surface-card p-12 text-center">
                        <i class="fas fa-exclamation-triangle text-6xl text-[#7289DA] mb-4"></i>
                        <h1 class="text-4xl font-bold text-white mb-4">404</h1>
                        <p class="text-[#b9bbbe] mb-6">Страница не найдена</p>
                        <a href="/" data-link class="primary-button inline-block">
                            <i class="fas fa-home mr-2"></i>
                            На главную
                        </a>
                    </div>
                </div>
            `;
        }
    });
}

// Initialize application
async function init() {
    // Initialize auth (loads from localStorage)
    await auth.init();

    // Render navbar
    const navbarContainer = document.getElementById('navbar');
    if (navbarContainer) {
        navbarContainer.innerHTML = renderNavbar();
    }

    // Subscribe to auth changes to update navbar
    auth.subscribe(() => {
        updateNavbar();
    });

    // Setup routes
    setupRoutes();

    // Handle initial route
    router.init();

    // Handle link clicks for SPA navigation
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-link]');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
                router.navigate(href);
            }
        }
    });

    console.log('App initialized');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
