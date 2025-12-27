// Contact Page
import { api } from '../api.js';

// Render contact page
export function render() {
    return `
        <div class="page-shell">
            <div class="w-full max-w-3xl space-y-6">
                <div class="surface-card p-8 animate-fade-in">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold text-white mb-3">Свяжитесь со мной</h1>
                        <p class="text-slate-300">
                            Есть вопросы или хотите обсудить проект? Заполните форму ниже, и я свяжусь с вами в ближайшее время.
                        </p>
                    </div>

                    <div id="success-message" class="hidden surface-section p-4 text-green-200 border border-green-400/40 bg-green-500/10 rounded-xl mb-6">
                        <i class="fas fa-check-circle mr-2"></i>
                        Сообщение успешно отправлено! Я свяжусь с вами в ближайшее время.
                    </div>

                    <div id="error-message" class="hidden surface-section p-4 text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl mb-6">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        <span id="error-text"></span>
                    </div>

                    <form id="contact-form" class="space-y-5">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div class="space-y-2">
                                <label for="name" class="block text-sm font-medium text-slate-200">
                                    Ваше имя <span class="text-red-400">*</span>
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    class="input-field"
                                    placeholder="Иван Иванов"
                                />
                            </div>

                            <div class="space-y-2">
                                <label for="email" class="block text-sm font-medium text-slate-200">
                                    Email <span class="text-red-400">*</span>
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    class="input-field"
                                    placeholder="ivan@example.com"
                                />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label for="phone" class="block text-sm font-medium text-slate-200">
                                Телефон <span class="text-slate-400 text-xs">(необязательно)</span>
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                class="input-field"
                                placeholder="+7 (900) 123-45-67"
                            />
                        </div>

                        <div class="space-y-2">
                            <label for="subject" class="block text-sm font-medium text-slate-200">
                                Тема <span class="text-red-400">*</span>
                            </label>
                            <input
                                id="subject"
                                type="text"
                                required
                                class="input-field"
                                placeholder="Разработка веб-приложения"
                            />
                        </div>

                        <div class="space-y-2">
                            <label for="message" class="block text-sm font-medium text-slate-200">
                                Сообщение <span class="text-red-400">*</span>
                            </label>
                            <textarea
                                id="message"
                                rows="6"
                                required
                                class="input-field"
                                placeholder="Расскажите о вашем проекте или задайте вопрос..."
                            ></textarea>
                        </div>

                        <button type="submit" id="submit-btn" class="primary-button w-full text-center">
                            <i class="fas fa-paper-plane mr-2"></i>
                            Отправить сообщение
                        </button>
                    </form>
                </div>

                <div class="surface-card p-6">
                    <h2 class="text-xl font-semibold text-white mb-4">Другие способы связи</h2>
                    <div class="space-y-3 text-slate-200">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-envelope text-[#7289DA] w-5"></i>
                            <a href="mailto:slenderzet@gmail.com" class="hover:text-white transition-colors">
                                slenderzet@gmail.com
                            </a>
                        </div>
                        <div class="flex items-center gap-3">
                            <i class="fab fa-telegram text-[#7289DA] w-5"></i>
                            <a href="https://t.me/remod3" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">
                                @remod3
                            </a>
                        </div>
                        <div class="flex items-center gap-3">
                            <i class="fab fa-vk text-[#7289DA] w-5"></i>
                            <a href="https://vk.com/remod3" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">
                                vk.com/remod3
                            </a>
                        </div>
                        <div class="flex items-center gap-3">
                            <i class="fab fa-discord text-[#7289DA] w-5"></i>
                            <a href="https://discord.com/users/743864658951274528" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">
                                Discord профиль
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Mount contact page
export function mount() {
    const form = document.getElementById('contact-form');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const submitBtn = document.getElementById('submit-btn');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
        };

        successMessage.classList.add('hidden');
        errorMessage.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Отправка...';

        try {
            const response = await api.post('/api/contact', formData);

            if (response && response.success) {
                successMessage.classList.remove('hidden');
                form.reset();
            } else {
                throw new Error('Неожиданный ответ от сервера');
            }
        } catch (err) {
            errorText.textContent = err.message || 'Не удалось отправить сообщение. Попробуйте позже.';
            errorMessage.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Отправить сообщение';
        }
    });
}

// Unmount
export function unmount() {}
