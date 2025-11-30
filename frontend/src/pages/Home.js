import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  return likes ? parseInt(likes, 10) || 0 : 0;
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
  const [activeTab, setActiveTab] = useState('projects');
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
    <div className="page-shell">
      <div className="w-full max-w-5xl space-y-8">
        {!user && (
          <div className="flex justify-end gap-3 animate-fade-in">
            <Link to="/login" className="primary-button">
              Вход
            </Link>
            <Link to="/register" className="muted-button">
              Регистрация
            </Link>
          </div>
        )}

        <div className="surface-card overflow-hidden animate-fade-in">
          <div className="h-48 relative overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: 'url(/blue_mybanner.gif)' }}
            />
          </div>

          <div className="relative -mt-16 text-center px-8 pb-6">
            <div className="inline-block relative mb-4">
              <img
                src="/blue_avatar.png"
                alt="Avatar"
                className="w-28 h-28 rounded-full object-cover shadow-xl bg-white border-4 border-white"
              />
            </div>

            <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">remod3</h1>

            <div className="flex flex-col gap-2 items-center">
              <span className="pill-tag bg-white text-[#7289DA] border-white">チェリー | せんちゃ</span>
              <span className="pill-tag bg-white text-[#7289DA] border-white">ベテルギウスロマネ・コンティ</span>
            </div>
          </div>

          <div className="px-8 pb-8 space-y-6">
            <div className="surface-section p-5">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <i className="fas fa-heart text-[#d23369]"></i>
                Обо мне
              </h2>
              <p className="text-slate-200/90 mb-2">
                Привет! Меня зовут Илья, мне 17 лет, и я обычный начинающий разработчик на Python, который любит аниме.
              </p>
              <p className="text-slate-200/90 mb-2">
                Моя цель — создать универсального Discord бота, который будет уметь всё! (Ну, или почти)
              </p>
              <p className="text-slate-200/90">
                День рождения{' '}
                <span className="text-[#7289DA] font-semibold">
                  {birthdayInfo.relativeTime}
                  {birthdayInfo.fullDate ? ` (${birthdayInfo.fullDate})` : ''}
                </span>
              </p>
            </div>

            <div className="surface-section p-5">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <i className="fas fa-star text-[#faa61a]"></i>
                Увлечения
              </h2>
              <div className="flex flex-wrap gap-2">
                {['Python', 'Discord API', 'Py-cord/disnake', 'HTML/CSS', 'Просмотр аниме'].map((skill) => (
                  <span key={skill} className="pill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="surface-section p-5">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <i className="fas fa-envelope text-[#43b581]"></i>
                Контакты
              </h2>
              <div className="space-y-2 text-slate-200/90">
                <div className="flex items-center gap-3">
                  <i className="fas fa-envelope text-[#d23369] w-5"></i>
                  <span>slenderzet@gmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-map-marker-alt text-[#d23369] w-5"></i>
                  <span>Токио, Япония (мечтаю там побывать)</span>
                </div>
              </div>
            </div>

            <div className="surface-section p-5 flex flex-col gap-4 items-center">
              <div className="flex flex-wrap justify-center gap-4 text-[#d23369] text-2xl">
                <a
                  href="https://vk.com/remod3"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="VK"
                  className="hover:text-[#e04377]"
                >
                  <i className="fab fa-vk"></i>
                </a>
                <a
                  href="https://t.me/remod3"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="hover:text-[#e04377]"
                >
                  <i className="fab fa-telegram"></i>
                </a>
                <a
                  href="https://discord.gg/nKkQdDgWfC"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord Server"
                  className="hover:text-[#e04377]"
                >
                  <i className="fab fa-discord"></i>
                </a>
                <a
                  href="https://discord.com/users/743864658951274528"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord Profile"
                  className="hover:text-[#e04377]"
                >
                  <i className="fab fa-discord"></i>
                </a>
                <a
                  href="https://open.spotify.com/user/31hx3sueaixdsbody6s6lligjm6a"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Spotify"
                  className="hover:text-[#e04377]"
                >
                  <i className="fab fa-spotify"></i>
                </a>
              </div>

              <div className="flex justify-center gap-8 text-[#7289DA]">
                <div className="flex items-center gap-2">
                  <i className="fas fa-eye"></i>
                  <span>{viewsCount}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLike}
                  className={`flex items-center gap-2 ${hasLiked ? 'text-[#e74c3c]' : 'hover:text-[#8899EA]'}`}
                >
                  <i className={`${hasLiked ? 'fas' : 'far'} fa-heart`}></i>
                  <span>{likesCount}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {user && (
          <div className="surface-card p-6 animate-fade-in">
            <div className="flex gap-3 mb-4 border-b border-white/10 pb-3">
              <button
                onClick={() => setActiveTab('projects')}
                className={`muted-button px-5 py-2 ${
                  activeTab === 'projects' ? 'border-[#7289DA] text-[#7289DA]' : ''
                }`}
              >
                <i className="fas fa-folder mr-2"></i>
                Проекты
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`muted-button px-5 py-2 ${
                  activeTab === 'chat' ? 'border-[#7289DA] text-[#7289DA]' : ''
                }`}
              >
                <i className="fas fa-comments mr-2"></i>
                Чат
              </button>
            </div>

            <div className="surface-section p-6 text-center">
              {activeTab === 'projects' && (
                <>
                  <h3 className="text-2xl font-semibold text-white mb-3">Мои проекты</h3>
                  <p className="text-slate-300 mb-5">Здесь будут отображаться все ваши проекты</p>
                  <Link to="/projects" className="primary-button inline-block">
                    Перейти к проектам
                  </Link>
                </>
              )}
              {activeTab === 'chat' && (
                <>
                  <h3 className="text-2xl font-semibold text-white mb-3">Чат</h3>
                  <p className="text-slate-300 mb-5">Общайтесь с другими пользователями в реальном времени</p>
                  <Link to="/chat" className="primary-button inline-block">
                    Открыть чат
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
