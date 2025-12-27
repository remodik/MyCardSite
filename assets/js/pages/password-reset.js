// Password Reset Page
import { api, API_URL } from '../api.js';
import { router } from '../router.js';

let currentStep = 1;
let usernameOrEmail = '';

// Render password reset page
export function render() {
    return `
        <div class="page-shell">
            <div class="w-full max-w-md">
                <div class="surface-card p-8 space-y-6 animate-fade-in">
                    <div class="text-center space-y-2">
                        <h2 class="text-2xl font-bold text-white">Reset your password</h2>
                        <p class="text-slate-300 text-sm">Всё оформлено в одном ключе</p>
                    </div>

                    <!-- Step 1: Request reset -->
                    <div id="step-1">
                        <form id="request-form" class="space-y-5">
                            <div id="error-1" class="hidden surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>
                            <div id="message-1" class="hidden surface-section p-3 text-sm text-green-200 border border-green-400/30 bg-green-500/10 rounded-xl"></div>
                            <div id="no-email-message" class="hidden surface-section p-3 text-sm text-blue-200 border border-blue-400/30 bg-blue-500/10 rounded-xl">
                                <p>Your request was sent to an administrator. They will review and update your password manually.</p>
                            </div>
                            <div>
                                <label for="usernameOrEmail" class="sr-only">Username or Email</label>
                                <input
                                    id="usernameOrEmail"
                                    name="usernameOrEmail"
                                    type="text"
                                    required
                                    class="input-field"
                                    placeholder="Username or Email"
                                />
                            </div>

                            <button type="submit" id="submit-1" class="primary-button w-full text-center">
                                Request Reset
                            </button>

                            <div class="text-center text-sm">
                                <a href="/login" data-link class="text-[#7289DA] hover:text-[#9bb0ff] font-semibold">
                                    Back to Sign in
                                </a>
                            </div>
                        </form>
                    </div>

                    <!-- Step 2: Enter code and new password -->
                    <div id="step-2" class="hidden">
                        <form id="reset-form" class="space-y-5">
                            <div id="error-2" class="hidden surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>
                            <div id="message-2" class="hidden surface-section p-3 text-sm text-green-200 border border-green-400/30 bg-green-500/10 rounded-xl"></div>
                            <div class="space-y-3">
                                <div>
                                    <label for="resetCode" class="sr-only">Reset Code</label>
                                    <input
                                        id="resetCode"
                                        name="resetCode"
                                        type="text"
                                        required
                                        class="input-field"
                                        placeholder="Enter reset code from email"
                                    />
                                </div>
                                <div>
                                    <label for="newPassword" class="sr-only">New Password</label>
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        required
                                        class="input-field"
                                        placeholder="New Password"
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

                            <button type="submit" id="submit-2" class="primary-button w-full text-center">
                                Reset Password
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Mount password reset page
export function mount() {
    currentStep = 1;
    usernameOrEmail = '';

    const requestForm = document.getElementById('request-form');
    const resetForm = document.getElementById('reset-form');

    // Step 1: Request reset
    requestForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const error1 = document.getElementById('error-1');
        const message1 = document.getElementById('message-1');
        const noEmailMessage = document.getElementById('no-email-message');
        const submit1 = document.getElementById('submit-1');

        usernameOrEmail = document.getElementById('usernameOrEmail').value;

        error1.classList.add('hidden');
        message1.classList.add('hidden');
        noEmailMessage.classList.add('hidden');
        submit1.disabled = true;
        submit1.textContent = 'Requesting...';

        try {
            const response = await fetch(`${API_URL}/api/auth/password-reset-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username_or_email: usernameOrEmail })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to request password reset');
            }

            message1.textContent = data.message;
            message1.classList.remove('hidden');

            if (data.has_email) {
                // Show step 2
                setTimeout(() => {
                    document.getElementById('step-1').classList.add('hidden');
                    document.getElementById('step-2').classList.remove('hidden');
                    currentStep = 2;
                }, 1500);
            } else {
                // No email - admin will handle
                noEmailMessage.classList.remove('hidden');
            }
        } catch (err) {
            error1.textContent = err.message;
            error1.classList.remove('hidden');
        } finally {
            submit1.disabled = false;
            submit1.textContent = 'Request Reset';
        }
    });

    // Step 2: Reset password
    resetForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const error2 = document.getElementById('error-2');
        const message2 = document.getElementById('message-2');
        const submit2 = document.getElementById('submit-2');

        const resetCode = document.getElementById('resetCode').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        error2.classList.add('hidden');
        message2.classList.add('hidden');

        if (newPassword !== confirmPassword) {
            error2.textContent = 'Passwords do not match';
            error2.classList.remove('hidden');
            return;
        }

        if (newPassword.length < 6) {
            error2.textContent = 'Password must be at least 6 characters';
            error2.classList.remove('hidden');
            return;
        }

        submit2.disabled = true;
        submit2.textContent = 'Resetting...';

        try {
            const response = await fetch(`${API_URL}/api/auth/password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username_or_email: usernameOrEmail,
                    reset_code: resetCode,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to reset password');
            }

            message2.textContent = 'Password reset successful! You can now log in.';
            message2.classList.remove('hidden');

            setTimeout(() => {
                router.navigate('/login');
            }, 2000);
        } catch (err) {
            error2.textContent = err.message;
            error2.classList.remove('hidden');
            submit2.disabled = false;
            submit2.textContent = 'Reset Password';
        }
    });
}

// Unmount
export function unmount() {
    currentStep = 1;
    usernameOrEmail = '';
}
