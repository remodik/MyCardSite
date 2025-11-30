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
    <div className="min-h-screen bg-gradient-to-br from-[#1e2a4a] via-[#2c3e50] to-[#1e2a4a] flex flex-col items-center py-8 px-4">
      {!user && (
        <div className="w-full max-w-6xl mb-8 flex justify-end gap-4">
          <Link 
            to="/login"
            className="px-6 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors font-semibold shadow-lg"
          >
            Вход
          </Link>
          <Link 
            to="/register"
            className="px-6 py-2 bg-[#7289DA] hover:bg-[#677BC4] text-white rounded-lg transition-colors font-semibold shadow-lg"
          >
            Регистрация
          </Link>
        </div>
      )}

      <div className="w-full max-w-xl mb-8 bg-gradient-to-b from-[#5865F2] to-[#36393f] rounded-3xl shadow-2xl overflow-hidden border-2 border-[#7289DA] transform transition-all duration-300 hover:-translate-y-2 animate-fade-in">
        <div className="h-48 relative overflow-hidden">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: 'url(/blue_mybanner.gif)' }}
          />
        </div>

        <div className="relative -mt-20 text-center px-8 pb-6">
          <div className="inline-block relative mb-4">
            <img 
              src="/blue_avatar.png" 
              alt="Avatar" 
              className="w-32 h-32 rounded-full object-cover shadow-xl bg-white border-4 border-white transform transition-transform duration-300 hover:scale-110 hover:rotate-6"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
            remod3
          </h1>
          
          <div className="space-y-2">
            <span className="inline-block bg-white text-[#7289DA] px-4 py-1 rounded-full font-bold text-sm">
              チェリー | せんちゃ
            </span>
            <br />
            <span className="inline-block bg-white text-[#7289DA] px-4 py-1 rounded-full font-bold text-sm">
              ベテルギウスロマネ・コンティ
            </span>
          </div>
        </div>

        <div className="bg-[#2f3136] px-8 py-6 space-y-6">
          <div className="animate-fade-in-delay">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <i className="fas fa-heart text-[#d23369]"></i>
              Обо мне
            </h2>
            <p className="text-gray-300 leading-relaxed mb-2">
              Привет! Меня зовут Илья, мне 17 лет, и я обычный начинающий разработчик на Python, который любит аниме.
            </p>
            <p className="text-gray-300 leading-relaxed mb-2">
              Моя цель — создать универсального Discord бота, который будет уметь всё! (Ну, или почти)
            </p>
            <p className="text-gray-300 leading-relaxed">
              День рождения:{' '}
              <span className="text-[#7289DA] font-semibold">
                {birthdayInfo.relativeTime}
                {birthdayInfo.fullDate ? ` (${birthdayInfo.fullDate})` : ''}
              </span>
            </p>
          </div>

          <div className="animate-fade-in-delay-2">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <i className="fas fa-star text-[#faa61a]"></i>
              Увлечения
            </h2>
            <div className="flex flex-wrap gap-2">
              {['Python', 'Discord API', 'Py-cord/disnake', 'HTML/CSS', 'Просмотр аниме'].map(skill => (
                <span 
                  key={skill}
                  className="px-4 py-2 bg-[#5865F2] text-white rounded-lg text-sm font-medium hover:bg-[#4752C4] transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="animate-fade-in-delay-3">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <i className="fas fa-envelope text-[#43b581]"></i>
              Контакты
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-gray-300">
                <i className="fas fa-envelope text-[#d23369] w-5"></i>
                <span>slenderzet@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <i className="fas fa-map-marker-alt text-[#d23369] w-5"></i>
                <span>Токио, Япония (мечтаю там побывать)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <a 
              href="https://vk.com/remod3" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#d23369] hover:text-[#e04377] text-2xl transition-colors transform hover:scale-125"
              aria-label="VK"
            >
              <i className="fab fa-vk"></i>
            </a>
            <a 
              href="https://t.me/remod3" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#d23369] hover:text-[#e04377] text-2xl transition-colors transform hover:scale-125"
              aria-label="Telegram"
            >
              <i className="fab fa-telegram"></i>
            </a>
            <a 
              href="https://discord.gg/nKkQdDgWfC" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#d23369] hover:text-[#e04377] text-2xl transition-colors transform hover:scale-125"
              aria-label="Discord Server"
            >
              <i className="fab fa-discord"></i>
            </a>
            <a 
              href="https://discord.com/users/743864658951274528" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#d23369] hover:text-[#e04377] text-2xl transition-colors transform hover:scale-125"
              aria-label="Discord Profile"
            >
              <i className="fab fa-discord"></i>
            </a>
            <a 
              href="https://open.spotify.com/user/31hx3sueaixdsbody6s6lligjm6a" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#d23369] hover:text-[#e04377] text-2xl transition-colors transform hover:scale-125"
              aria-label="Spotify"
            >
              <i className="fab fa-spotify"></i>
            </a>
          </div>

          <div className="flex justify-center gap-8 pt-4 text-[#7289DA]">
            <div className="flex items-center gap-2">
              <i className="fas fa-eye"></i>
              <span>{viewsCount}</span>
            </div>
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-2 transition-colors ${
                hasLiked ? 'text-[#e74c3c]' : 'hover:text-[#8899EA]'
              }`}
            >
              <i className={`${hasLiked ? 'fas' : 'far'} fa-heart`}></i>
              <span>{likesCount}</span>
            </button>
          </div>
        </div>
        </div>

      {user && (
        <div className="w-full max-w-6xl">
          <div className="flex gap-4 mb-6 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'projects'
                  ? 'text-[#5865F2] border-b-2 border-[#5865F2]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <i className="fas fa-folder mr-2"></i>
              Проекты
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'text-[#5865F2] border-b-2 border-[#5865F2]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <i className="fas fa-comments mr-2"></i>
              Чат
            </button>
          </div>

          <div className="bg-[#2f3136] rounded-xl p-6 shadow-xl">
            {activeTab === 'projects' && (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Мои проекты</h3>
                <p className="text-gray-400 mb-6">Здесь будут отображаться все ваши проекты</p>
                <Link
                  to="/projects"
                  className="inline-block px-8 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors font-semibold shadow-lg"
                >
                  Перейти к проектам
                </Link>
              </div>
            )}
            {activeTab === 'chat' && (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Чат</h3>
                <p className="text-gray-400 mb-6">Общайтесь с другими пользователями в реальном времени</p>
                <Link
                  to="/chat"
                  className="inline-block px-8 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors font-semibold shadow-lg"
                >
                  Открыть чат
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
