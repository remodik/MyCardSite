// Home Page
import { formatRelativeTime, safeStorage } from '../utils.js';

const BIRTHDAY_TIMESTAMP = 1791406800;

let viewsCount = 0;
let likesCount = 0;
let hasLiked = false;
let countdownInterval = null;

// LocalStorage helpers
function getLocalLikes() {
    const storage = safeStorage();
    if (!storage) return 0;
    const likes = storage.getItem('pageLikes');
    return likes ? parseInt(likes, 10) || 0 : 0;
}

function hasLikedLocally() {
    const storage = safeStorage();
    if (!storage) return false;
    return storage.getItem('hasLiked') === 'true';
}

function setLocalLikes(count) {
    const storage = safeStorage();
    if (!storage) return;
    storage.setItem('pageLikes', String(count));
    storage.setItem('hasLiked', 'true');
}

// Update birthday countdown
function updateBirthdayCountdown() {
    const now = Math.floor(Date.now() / 1000);
    const diff = BIRTHDAY_TIMESTAMP - now;
    const fullDate = new Date(BIRTHDAY_TIMESTAMP * 1000).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const relativeTime = formatRelativeTime(diff);
    const el = document.getElementById('birthday-countdown');
    if (el) {
        el.textContent = `${relativeTime} (${fullDate})`;
    }
}

// Fetch stats
async function fetchStats() {
    try {
        const response = await fetch('/stats.php');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        viewsCount = Number(data.views) || 0;
        likesCount = Number.isFinite(Number(data.likes)) ? Number(data.likes) : getLocalLikes();
        hasLiked = Boolean(data.hasLiked) || hasLikedLocally();
    } catch (error) {
        viewsCount = 0;
        likesCount = getLocalLikes();
        hasLiked = hasLikedLocally();
    }
    updateStatsUI();
}

// Update stats UI
function updateStatsUI() {
    const viewsEl = document.getElementById('views-count');
    const likesEl = document.getElementById('likes-count');
    const likeBtn = document.getElementById('like-button');
    const likeIcon = document.getElementById('like-icon');

    if (viewsEl) viewsEl.textContent = viewsCount;
    if (likesEl) likesEl.textContent = likesCount;
    if (likeBtn && hasLiked) {
        likeBtn.classList.add('text-[#e74c8c]');
    }
    if (likeIcon) {
        likeIcon.className = hasLiked ? 'bi bi-heart-fill' : 'bi bi-heart';
    }
}

// Handle like
async function handleLike() {
    if (hasLikedLocally()) {
        alert('Вы уже поставили лайк! ❤️');
        hasLiked = true;
        updateStatsUI();
        return;
    }

    try {
        const response = await fetch('/stats.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'like' }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error('Like request failed');
        }

        const newLikes = Number(result.likes);
        likesCount = Number.isFinite(newLikes) ? newLikes : likesCount + 1;
    } catch (error) {
        likesCount = likesCount + 1;
    }

    setLocalLikes(likesCount);
    hasLiked = true;
    updateStatsUI();
    alert('Спасибо за лайк! ❤️');
}

// Render home page
export function render() {
    const skills = ['Python', 'Discord API', 'Py-cord/disnake', 'HTML/CSS', 'Просмотр аниме'];

    return `
        <div class="profile-page">
            <div class="w-full max-w-5xl flex flex-col items-center gap-4">
                <div class="profile-card">
                    <div class="profile-banner" style="background-image: url(/assets/images/blue_mybanner.gif)"></div>

                    <div class="profile-header">
                        <div class="avatar-ring">
                            <span class="avatar-decoration" aria-hidden="true"></span>
                            <img src="/assets/images/blue_avatar.png" alt="Avatar" class="profile-avatar" />
                        </div>
                        <div class="profile-name">remod3</div>
                        <div class="profile-subtitle-stack">
                            <span class="profile-subtitle">チェリー | せんちゃ</span>
                            <span class="profile-subtitle">ベテルギウスロマネ・コンティ</span>
                        </div>
                    </div>

                    <div class="profile-content">
                        <div class="section-block">
                            <div class="section-title">
                                <i class="bi bi-heart-fill" aria-hidden="true"></i>
                                <span>Обо мне</span>
                            </div>
                            <p class="section-text">
                                Привет! Меня зовут Илья, мне 17 лет, и я обычный начинающий разработчик на Python, который любит аниме.
                            </p>
                            <p class="section-text">
                                Моя цель — создать универсального Discord бота, который будет уметь всё! (Ну, или почти)
                            </p>
                            <p class="section-text">
                                День рождения <span id="birthday-countdown" class="text-[#6b8fc9] font-semibold"></span>
                            </p>
                        </div>

                        <div class="section-block">
                            <div class="section-title">
                                <i class="bi bi-star-fill accent-blue" aria-hidden="true"></i>
                                <span>Увлечения</span>
                            </div>
                            <div class="chip-set">
                                ${skills.map(skill => `<span class="chip">${skill}</span>`).join('')}
                            </div>
                        </div>

                        <div class="section-block">
                            <div class="section-title">
                                <i class="bi bi-envelope-fill accent-blue" aria-hidden="true"></i>
                                <span>Контакты</span>
                            </div>
                            <div class="contact-row">
                                <div class="contact-item">
                                    <i class="bi bi-envelope-fill" aria-hidden="true"></i>
                                    <span>slenderzet@gmail.com</span>
                                </div>
                                <div class="contact-item">
                                    <i class="bi bi-geo-alt-fill" aria-hidden="true"></i>
                                    <span>Токио, Япония (мечтаю там побывать)</span>
                                </div>
                            </div>
                        </div>

                        <div class="section-block flex flex-col gap-4 items-center">
                            <div class="social-grid">
                                <a href="https://vk.com/remod3" target="_blank" rel="noopener noreferrer" aria-label="VK">
                                    <i class="bi bi-people-fill" aria-hidden="true"></i>
                                </a>
                                <a href="https://t.me/remod3" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                                    <i class="bi bi-telegram" aria-hidden="true"></i>
                                </a>
                                <a href="https://discord.gg/nKkQdDgWfC" target="_blank" rel="noopener noreferrer" aria-label="Discord Server">
                                    <i class="bi bi-discord" aria-hidden="true"></i>
                                </a>
                                <a href="https://discord.com/users/743864658951274528" target="_blank" rel="noopener noreferrer" aria-label="Discord Profile">
                                    <i class="bi bi-discord" aria-hidden="true"></i>
                                </a>
                                <a href="https://open.spotify.com/user/31hx3sueaixdsbody6s6lligjm6a" target="_blank" rel="noopener noreferrer" aria-label="Spotify">
                                    <i class="bi bi-spotify" aria-hidden="true"></i>
                                </a>
                            </div>

                            <div class="stats-row">
                                <div class="flex items-center gap-2">
                                    <i class="bi bi-eye-fill" aria-hidden="true"></i>
                                    <span id="views-count">0</span>
                                </div>
                                <button type="button" id="like-button" class="stat-button">
                                    <i id="like-icon" class="bi bi-heart" aria-hidden="true"></i>
                                    <span id="likes-count">0</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Mount home page (called after render)
export function mount() {
    // Initialize
    hasLiked = hasLikedLocally();
    likesCount = getLocalLikes();

    // Update countdown immediately and then every minute
    updateBirthdayCountdown();
    countdownInterval = setInterval(updateBirthdayCountdown, 60000);

    // Fetch stats
    fetchStats();

    // Attach like handler
    const likeBtn = document.getElementById('like-button');
    if (likeBtn) {
        likeBtn.addEventListener('click', handleLike);
    }
}

// Unmount home page (cleanup)
export function unmount() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}
