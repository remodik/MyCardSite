// Auth Manager - замена AuthContext
import { api, API_URL } from './api.js';

class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.loading = true;
        this.listeners = new Set();
    }

    // Subscribe to auth state changes
    subscribe(callback) {
        this.listeners.add(callback);
        // Immediately call with current state
        callback(this.getState());
        return () => this.listeners.delete(callback);
    }

    // Notify all listeners of state change
    notify() {
        const state = this.getState();
        this.listeners.forEach(cb => cb(state));
    }

    // Get current auth state
    getState() {
        return {
            user: this.user,
            token: this.token,
            loading: this.loading,
            isAdmin: this.user?.role === 'admin',
            isAuthenticated: !!this.user,
            API_URL
        };
    }

    // Initialize auth from localStorage
    async init() {
        try {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                this.token = storedToken;
                api.setToken(storedToken);
                await this.fetchUser();
            }
        } catch (error) {
            console.error('Auth init error:', error);
            this.logout();
        } finally {
            this.loading = false;
            this.notify();
        }
    }

    // Fetch current user from API
    async fetchUser() {
        try {
            this.user = await api.get('/api/auth/me');
        } catch (error) {
            console.error('Error fetching user:', error);
            this.logout();
        }
    }

    // Login
    async login(username, password) {
        try {
            const response = await api.post('/api/auth/login', { username, password });
            this.token = response.access_token;
            this.user = response.user;
            localStorage.setItem('token', this.token);
            api.setToken(this.token);
            this.notify();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Login failed'
            };
        }
    }

    // Register
    async register(username, email, password) {
        try {
            const response = await api.post('/api/auth/register', {
                username,
                email: email || null,
                password
            });
            this.token = response.access_token;
            this.user = response.user;
            localStorage.setItem('token', this.token);
            api.setToken(this.token);
            this.notify();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Registration failed'
            };
        }
    }

    // Logout
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        api.setToken(null);
        this.notify();
    }

    // Check if user is authenticated
    get isAuthenticated() {
        return !!this.user;
    }

    // Check if user is admin
    get isAdmin() {
        return this.user?.role === 'admin';
    }
}

// Singleton instance
export const auth = new AuthManager();
