// Login Page
import { auth } from '../auth.js';
import { router } from '../router.js';

// Render login page
export function render() {
    return `
        <div class="page-shell">
            <div class="w-full max-w-md">
                <div class="surface-card p-8 space-y-6 animate-fade-in">
                    <div class="text-center space-y-2">
                        <h2 class="text-2xl font-bold text-white">Вход</h2>
                        <p class="text-slate-300 text-sm">Продолжайте в едином стиле главной страницы</p>
                    </div>
                    <form id="login-form" class="space-y-5">
                        <div id="error-container" class="hidden surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>
                        <div class="space-y-3">
                            <div>
                                <label for="username" class="sr-only">Username</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    class="input-field"
                                    placeholder="Username"
                                />
                            </div>
                            <div>
                                <label for="password" class="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    class="input-field"
                                    placeholder="Password"
                                />
                            </div>
                        </div>

                        <div class="flex items-center justify-between text-sm">
                            <a href="/reset-password" data-link class="text-[#6b8fc9] hover:text-[#8aa5d6] transition-colors">
                                Forgot your password?
                            </a>
                        </div>

                        <button type="submit" id="submit-btn" class="primary-button w-full text-center">
                            Sign in
                        </button>

                        <div class="text-center text-sm text-slate-300">
                            Don't have an account?
                            <a href="/register" data-link class="text-[#6b8fc9] hover:text-[#8aa5d6] transition-colors font-semibold">
                                Sign up
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// Mount login page
export function mount() {
    const form = document.getElementById('login-form');
    const errorContainer = document.getElementById('error-container');
    const submitBtn = document.getElementById('submit-btn');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
        errorContainer.classList.add('hidden');

        const result = await auth.login(username, password);

        if (result.success) {
            router.navigate('/projects');
        } else {
            errorContainer.textContent = result.error;
            errorContainer.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign in';
        }
    });
}

// Unmount
export function unmount() {}
