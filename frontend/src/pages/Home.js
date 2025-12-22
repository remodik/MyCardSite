import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const BIRTHDAY_TIMESTAMP = 1791406800;

const pluralRules = new Intl.PluralRules('ru');

const timeForms = {
  год: ['год', 'года', 'лет'],
  месяц: ['месяц', 'месяца', 'месяцев'],
  неделя: ['неделя', 'недели', 'недель'],
  день: ['день', 'дня', 'дней'],
  час: ['час', 'часа', 'часов'],
  минута: ['минута', 'минуты', 'минут'],
};

const formatRelativeTime = (seconds) => {
  if (seconds <= 0) {
    return 'сегодня! 🎉';
  }

  const intervals = {
    год: 31536000,
    месяц: 2592000,
    неделя: 604800,
    день: 86400,
    час: 3600,
    минута: 60,
  };

  for (const [unit, secs] of Object.entries(intervals)) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      const rule = pluralRules.select(count);
      const forms = timeForms[unit];
      const form = rule === 'one' ? forms[0] : rule === 'few' ? forms[1] : forms[2];
      return `через ${count} ${form}`;
    }
  }

  return 'скоро!';
};

const safeStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch (error) {
    return null;
  }
  return null;
};

const getLocalLikes = () => {
  const storage = safeStorage();
  if (!storage) {
    return 0;
  }

  const likes = storage.getItem('pageLikes');
  return likes ? Number.parseInt(likes, 10) || 0 : 0;
};

const hasLikedLocally = () => {
  const storage = safeStorage();
  if (!storage) {
    return false;
  }
  return storage.getItem('hasLiked') === 'true';
};

const setLocalLikes = (count) => {
  const storage = safeStorage();
  if (!storage) {
    return;
  }

  const likesValue = Number.isFinite(count) ? count : 0;
  storage.setItem('pageLikes', likesValue.toString());
  storage.setItem('hasLiked', 'true');
};

function Home() {
  const { user } = useAuth();
  const [viewsCount, setViewsCount] = useState(0);
  const [likesCount, setLikesCount] = useState(() => getLocalLikes());
  const [hasLiked, setHasLiked] = useState(() => hasLikedLocally());
  const [birthdayInfo, setBirthdayInfo] = useState({
    relativeTime: '',
    fullDate: '',
  });

  const updateBirthdayCountdown = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    const diff = BIRTHDAY_TIMESTAMP - now;
    const fullDate = new Date(BIRTHDAY_TIMESTAMP * 1000).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    setBirthdayInfo({
      relativeTime: formatRelativeTime(diff),
      fullDate,
    });
  }, []);

  useEffect(() => {
    updateBirthdayCountdown();
    const intervalId = setInterval(updateBirthdayCountdown, 60000);
    return () => clearInterval(intervalId);
  }, [updateBirthdayCountdown]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/stats.php');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setViewsCount(Number(data.views) || 0);
        const serverLikes = Number(data.likes);
        setLikesCount(Number.isFinite(serverLikes) ? serverLikes : getLocalLikes());
        setHasLiked(Boolean(data.hasLiked) || hasLikedLocally());
      } catch (error) {
        setViewsCount(0);
        setLikesCount(getLocalLikes());
        setHasLiked(hasLikedLocally());
      }
    };

    fetchStats();
  }, []);

  const handleLike = async () => {
    if (hasLikedLocally()) {
      window.alert('Вы уже поставили лайк! ❤️');
      setHasLiked(true);
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
      const likesValue = Number.isFinite(newLikes) ? newLikes : likesCount + 1;
      setLikesCount(likesValue);
      setLocalLikes(likesValue);
      setHasLiked(true);
      window.alert('Спасибо за лайк! ❤️');
    } catch (error) {
      const fallbackLikes = likesCount + 1;
      setLikesCount(fallbackLikes);
      setLocalLikes(fallbackLikes);
      setHasLiked(true);
      window.alert('Спасибо за лайк! ❤️');
    }
  };

  return (
    <div className="profile-page">
      <div className="w-full max-w-5xl flex flex-col items-center gap-4">
        <div className="profile-card">
          <div
            className="profile-banner"
            style={{ backgroundImage: 'url(/blue_mybanner.gif)' }}
          ></div>

          <div className="profile-header">
            <div className="avatar-ring">
                <span className="avatar-decoration" aria-hidden="true"></span>
                <img src="/blue_avatar.png" alt="Avatar" className="profile-avatar" />
            </div>
            <div className="profile-name">remod3</div>
            <div className="profile-subtitle-stack">
              <span className="profile-subtitle">チェリー | せんちゃ</span>
              <span className="profile-subtitle">ベテルギウスロマネ・コンティ</span>
            </div>
          </div>

          <div className="profile-content">
            <div className="section-block">
              <div className="section-title">
                <i className="bi bi-heart-fill" aria-hidden="true"></i>
                <span>Обо мне</span>
              </div>
              <p className="section-text">
                Привет! Меня зовут Илья, мне 17 лет, и я обычный начинающий разработчик на Python, который любит аниме.
              </p>
              <p className="section-text">
                Моя цель — создать универсального Discord бота, который будет уметь всё! (Ну, или почти)
              </p>
              <p className="section-text">
                День рождения{' '}
                <span className="text-[#6b8fc9] font-semibold">
                  {birthdayInfo.relativeTime}
                  {birthdayInfo.fullDate ? ` (${birthdayInfo.fullDate})` : ''}
                </span>
              </p>
            </div>

            <div className="section-block">
              <div className="section-title">
                <i className="bi bi-star-fill accent-blue" aria-hidden="true"></i>
                <span>Увлечения</span>
              </div>
              <div className="chip-set">
                {['Python', 'Discord API', 'Py-cord/disnake', 'HTML/CSS', 'Просмотр аниме'].map((skill) => (
                  <span key={skill} className="chip">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="section-block">
              <div className="section-title">
                <i className="bi bi-envelope-fill accent-blue" aria-hidden="true"></i>
                <span>Контакты</span>
              </div>
              <div className="contact-row">
                <div className="contact-item">
                  <i className="bi bi-envelope-fill" aria-hidden="true"></i>
                  <span>slenderzet@gmail.com</span>
                </div>
                <div className="contact-item">
                  <i className="bi bi-geo-alt-fill" aria-hidden="true"></i>
                  <span>Токио, Япония (мечтаю там побывать)</span>
                </div>
              </div>
            </div>

            <div className="section-block flex flex-col gap-4 items-center">
              <div className="social-grid">
                <a href="https://vk.com/remod3" target="_blank" rel="noopener noreferrer" aria-label="VK">
                  <i className="bi bi-people-fill" aria-hidden="true"></i>
                </a>
                <a href="https://t.me/remod3" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                  <i className="bi bi-telegram" aria-hidden="true"></i>
                </a>
                <a href="https://discord.gg/nKkQdDgWfC" target="_blank" rel="noopener noreferrer" aria-label="Discord Server">
                  <i className="bi bi-discord" aria-hidden="true"></i>
                </a>
                <a href="https://discord.com/users/743864658951274528" target="_blank" rel="noopener noreferrer" aria-label="Discord Profile">
                  <i className="bi bi-discord" aria-hidden="true"></i>
                </a>
                <a
                  href="https://open.spotify.com/user/31hx3sueaixdsbody6s6lligjm6a"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Spotify"
                >
                  <i className="bi bi-spotify" aria-hidden="true"></i>
                </a>
              </div>

              <div className="stats-row">
                <div className="flex items-center gap-2">
                  <i className="bi bi-eye-fill" aria-hidden="true"></i>
                  <span>{viewsCount}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLike}
                  className={`stat-button ${hasLiked ? 'text-[#e74c8c]' : ''}`}
                >
                  <i className={`bi ${hasLiked ? 'bi-heart-fill' : 'bi-heart'}`} aria-hidden="true"></i>
                  <span>{likesCount}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;