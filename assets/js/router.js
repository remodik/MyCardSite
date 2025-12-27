// SPA Router - замена React Router
import { auth } from './auth.js';

class Router {
    constructor() {
        this.routes = [];
        this.currentRoute = null;
        this.currentParams = {};
        this.beforeNavigate = null;

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.navigate(location.pathname, false);
        });

        // Handle link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-link]');
            if (link) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });
    }

    // Add a route
    addRoute(path, handler, options = {}) {
        // Convert path params like :id to regex groups
        const pattern = path.replace(/:([^/]+)/g, '(?<$1>[^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        this.routes.push({ path, regex, handler, options });
    }

    // Set a guard function to run before navigation
    setGuard(guardFn) {
        this.beforeNavigate = guardFn;
    }

    // Navigate to a path
    async navigate(path, pushState = true) {
        // Find matching route
        let matchedRoute = null;
        let params = {};

        for (const route of this.routes) {
            const match = path.match(route.regex);
            if (match) {
                matchedRoute = route;
                params = match.groups || {};
                break;
            }
        }

        // Run guard if set
        if (this.beforeNavigate) {
            const result = await this.beforeNavigate(path, matchedRoute?.options);
            if (result !== true) {
                if (typeof result === 'string') {
                    return this.navigate(result, true);
                }
                return;
            }
        }

        // Update browser history
        if (pushState && path !== location.pathname) {
            history.pushState({}, '', path);
        }

        this.currentRoute = matchedRoute;
        this.currentParams = params;

        // Render the route
        if (matchedRoute) {
            await matchedRoute.handler(params);
        } else {
            // 404 - redirect to home
            this.navigate('/');
        }
    }

    // Get current path
    get currentPath() {
        return location.pathname;
    }
}

// Singleton instance
export const router = new Router();
