// Register Page
import { auth } from '../auth.js';
import { router } from '../router.js';

// Render register page
export function render() {
    return `
        <div class="page-shell">
            <div class="w-full max-w-md">
                <div class="surface-card p-8 space-y-6 animate-fade-in">
                    <div class="text-center space-y-2">
                        <h2 class="text-2xl font-bold text-white">Регистрация</h2>
                        <p class="text-slate-300 text-sm">Один аккуратный стиль на всех страницах</p>
                    </div>
                    <form id="register-form" class="space-y-5">
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
                                <label for="email" class="sr-only">Email (optional)</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    class="input-field"
                                    placeholder="Email (optional, for password reset)"
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
                            <div>
                                <label for="confirmPassword" class="sr-only">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    class="input-field"
                                    placeholder="Confirm Password"
                                />
                            </div>
                        </div>

                        <button type="submit" id="submit-btn" class="primary-button w-full text-center">
                            Sign up
                        </button>

                        <div class="text-center text-sm text-slate-300">
                            Already have an account?
                            <a href="/login" data-link class="text-[#7289DA] hover:text-[#9bb0ff] font-semibold">
                                Sign in
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// Mount register page
export function mount() {
    const form = document.getElementById('register-form');
    const errorContainer = document.getElementById('error-container');
    const submitBtn = document.getElementById('submit-btn');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate
        errorContainer.classList.add('hidden');

        if (password !== confirmPassword) {
            errorContainer.textContent = 'Passwords do not match';
            errorContainer.classList.remove('hidden');
            return;
        }

        if (password.length < 6) {
            errorContainer.textContent = 'Password must be at least 6 characters';
            errorContainer.classList.remove('hidden');
            return;
        }

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        const result = await auth.register(username, email, password);

        if (result.success) {
            router.navigate('/projects');
        } else {
            errorContainer.textContent = result.error;
            errorContainer.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign up';
        }
    });
}

// Unmount
export function unmount() {}
