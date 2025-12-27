// API Client - замена Axios
const API_URL = window.APP_CONFIG?.API_URL || 'http://localhost:8001';

class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                const error = typeof data === 'object' ? data : { detail: data };
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('Не удалось подключиться к серверу');
            }
            throw error;
        }
    }

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // For file uploads (multipart/form-data)
    async upload(endpoint, formData) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        // Don't set Content-Type for FormData - browser will set it with boundary

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || `HTTP ${response.status}`);
        }

        return data;
    }
}

export const api = new ApiClient(API_URL);
export { API_URL };
