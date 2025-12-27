const appRoot = document.getElementById("app");

const BIRTHDAY_TIMESTAMP = 1791406800;

const pluralRules = new Intl.PluralRules("ru");

const timeForms = {
  год: ["год", "года", "лет"],
  месяц: ["месяц", "месяца", "месяцев"],
  неделя: ["неделя", "недели", "недель"],
  день: ["день", "дня", "дней"],
  час: ["час", "часа", "часов"],
  минута: ["минута", "минуты", "минут"],
};

const state = {
  user: null,
  token: null,
  loading: true,
  apiUrl: "",
};

let currentCleanup = null;

const navLinks = [
  { path: "/", label: "Главная", requiresAuth: false },
  { path: "/services", label: "Услуги", requiresAuth: false },
  { path: "/projects", label: "Проекты", requiresAuth: true },
  { path: "/chat", label: "Чат", requiresAuth: true },
  { path: "/contact", label: "Контакты", requiresAuth: false },
];

const languageMap = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  cs: "csharp",
  php: "php",
  rb: "ruby",
  go: "go",
  rs: "rust",
  swift: "swift",
  kt: "kotlin",
  html: "html",
  css: "css",
  scss: "scss",
  json: "json",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  txt: "text",
};

const safeStorage = () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
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
  const likes = storage.getItem("pageLikes");
  return likes ? Number.parseInt(likes, 10) || 0 : 0;
};

const hasLikedLocally = () => {
  const storage = safeStorage();
  if (!storage) {
    return false;
  }
  return storage.getItem("hasLiked") === "true";
};

const setLocalLikes = (count) => {
  const storage = safeStorage();
  if (!storage) {
    return;
  }
  const likesValue = Number.isFinite(count) ? count : 0;
  storage.setItem("pageLikes", likesValue.toString());
  storage.setItem("hasLiked", "true");
};

const getApiUrl = () => {
  const meta = document.querySelector('meta[name="backend-url"]');
  if (meta?.content) {
    return meta.content;
  }
  return window.BACKEND_URL || "http://localhost:8001";
};

const setStoredToken = (token) => {
  const storage = safeStorage();
  if (!storage) {
    return;
  }
  if (token) {
    storage.setItem("token", token);
  } else {
    storage.removeItem("token");
  }
};

const getStoredToken = () => {
  const storage = safeStorage();
  if (!storage) {
    return null;
  }
  return storage.getItem("token");
};

const apiRequest = async (path, options = {}) => {
  const url = `${state.apiUrl}${path}`;
  const headers = new Headers(options.headers || {});
  const config = { ...options, headers };

  if (state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
  }

  if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { response, data };
};

const formatRelativeTime = (seconds) => {
  if (seconds <= 0) {
    return "сегодня! 🎉";
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
      const form = rule === "one" ? forms[0] : rule === "few" ? forms[1] : forms[2];
      return `через ${count} ${form}`;
    }
  }

  return "скоро!";
};

const applyLikeState = (hasLiked) => {
  const likeButton = document.getElementById("likeButton");
  if (!likeButton) {
    return;
  }

  const icon = likeButton.querySelector("i");
  if (hasLiked) {
    likeButton.classList.add("is-liked");
    if (icon) {
      icon.classList.remove("bi-heart");
      icon.classList.add("bi-heart-fill");
    }
  } else {
    likeButton.classList.remove("is-liked");
    if (icon) {
      icon.classList.remove("bi-heart-fill");
      icon.classList.add("bi-heart");
    }
  }
};

const updateBirthdayCountdown = () => {
  const now = Math.floor(Date.now() / 1000);
  const diff = BIRTHDAY_TIMESTAMP - now;
  const fullDate = new Date(BIRTHDAY_TIMESTAMP * 1000).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const relativeEl = document.getElementById("birthdayRelative");
  const fullEl = document.getElementById("birthdayFull");

  if (relativeEl) {
    relativeEl.textContent = formatRelativeTime(diff);
  }

  if (fullEl) {
    fullEl.textContent = fullDate ? ` (${fullDate})` : "";
  }
};

const updateStats = async () => {
  const viewsEl = document.getElementById("viewsCount");
  const likesEl = document.getElementById("likesCount");

  try {
    const response = await fetch("/stats.php");
    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }

    const data = await response.json();
    if (viewsEl) {
      viewsEl.textContent = Number(data.views) || 0;
    }

    const serverLikes = Number(data.likes);
    const likesValue = Number.isFinite(serverLikes) ? serverLikes : getLocalLikes();
    if (likesEl) {
      likesEl.textContent = likesValue;
    }
    applyLikeState(Boolean(data.hasLiked) || hasLikedLocally());
  } catch (error) {
    if (viewsEl) {
      viewsEl.textContent = "0";
    }
    const fallbackLikes = getLocalLikes();
    if (likesEl) {
      likesEl.textContent = fallbackLikes;
    }
    applyLikeState(hasLikedLocally());
  }
};

const handleLike = async () => {
  const likesEl = document.getElementById("likesCount");

  if (hasLikedLocally()) {
    window.alert("Вы уже поставили лайк! ❤️");
    applyLikeState(true);
    return;
  }

  try {
    const response = await fetch("/stats.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Like request failed");
    }

    const newLikes = Number(result.likes);
    const likesValue = Number.isFinite(newLikes)
      ? newLikes
      : (Number(likesEl?.textContent) || 0) + 1;

    if (likesEl) {
      likesEl.textContent = likesValue;
    }
    setLocalLikes(likesValue);
    applyLikeState(true);
    window.alert("Спасибо за лайк! ❤️");
  } catch (error) {
    const fallbackLikes = (Number(likesEl?.textContent) || 0) + 1;
    if (likesEl) {
      likesEl.textContent = fallbackLikes;
    }
    setLocalLikes(fallbackLikes);
    applyLikeState(true);
    window.alert("Спасибо за лайк! ❤️");
  }
};

const renderNav = (pathname) => {
  const renderLink = (link) => {
    const disabled = link.requiresAuth && !state.user;
    const baseClasses =
      "px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200";
    const activeClasses =
      "bg-gradient-to-r from-[#5a7fb8] to-[#4a6fa5] text-white shadow-lg";
    const idleClasses = "text-slate-200/90 hover:text-white hover:bg-white/10";
    const disabledClasses = "opacity-50 cursor-not-allowed pointer-events-none";
    const isActive = pathname === link.path;
    const classes = `${baseClasses} ${
      disabled ? disabledClasses : isActive ? activeClasses : idleClasses
    }`;

    return `
      <a
        data-link
        href="${disabled ? "/login" : link.path}"
        class="${classes}"
        aria-disabled="${disabled ? "true" : "false"}"
        title="${disabled ? "Войдите, чтобы открыть раздел" : ""}"
      >
        ${link.label}
      </a>
    `;
  };

  const adminLink =
    state.user?.role === "admin"
      ? renderLink({ path: "/admin", label: "Админ панель", requiresAuth: true })
      : "";

  const authBlock = state.user
    ? `
        <div class="text-sm text-slate-200/90">
          <span class="font-semibold text-white">${state.user.username}</span>
          ${
            state.user.role === "admin"
              ? '<span class="ml-2 text-[#6b8fc9]">Администратор</span>'
              : ""
          }
        </div>
        <button
          data-action="logout"
          class="rounded-full bg-gradient-to-r from-[#e74c8c] to-[#d63a7a] px-5 py-2 text-sm font-semibold text-white shadow-lg hover:from-[#f06ba4] hover:to-[#e74c8c] transition-all"
        >
          Выйти
        </button>
      `
    : `
        <a
          data-link
          href="/login"
          class="rounded-full bg-white/95 px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white"
        >
          Войти
        </a>
        <a
          data-link
          href="/register"
          class="rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Регистрация
        </a>
      `;

  return `
    <nav class="sticky top-0 z-40 backdrop-blur-md">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mt-6 mb-4 rounded-2xl border border-white/10 bg-gradient-to-r from-[#1e2838]/95 to-[#1a2332]/95 px-6 py-4 shadow-2xl backdrop-blur-lg">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div class="flex flex-col gap-3">
              <div class="flex flex-wrap gap-2">
                ${navLinks.map(renderLink).join("")}
                ${adminLink}
              </div>
            </div>
            <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end">
              ${authBlock}
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;
};

const renderHome = () => `
  <div class="profile-page">
    <div class="profile-card">
      <div class="profile-banner" style="background-image: url('/blue_mybanner.gif');"></div>

      <div class="profile-header">
        <div class="avatar-ring">
          <span class="avatar-decoration" aria-hidden="true"></span>
          <img src="/blue_avatar.png" alt="Аватар remod3" class="profile-avatar" />
        </div>
        <div class="profile-name">remod3</div>
        <div class="profile-subtitle-stack">
          <span class="profile-subtitle">チェリー | せんちゃ</span>
          <span class="profile-subtitle">ベテルギウスロマネ・コンティ</span>
        </div>
      </div>

      <div class="profile-content">
        <section class="section-block">
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
            День рождения
            <span class="accent-text" id="birthdayRelative"></span>
            <span class="accent-text" id="birthdayFull"></span>
          </p>
        </section>

        <section class="section-block">
          <div class="section-title">
            <i class="bi bi-star-fill accent-blue" aria-hidden="true"></i>
            <span>Увлечения</span>
          </div>
          <div class="chip-set">
            <span class="chip">Python</span>
            <span class="chip">Discord API</span>
            <span class="chip">Py-cord/disnake</span>
            <span class="chip">HTML/CSS</span>
            <span class="chip">Просмотр аниме</span>
          </div>
        </section>

        <section class="section-block">
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
        </section>

        <section class="section-block social-section">
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
            <a
              href="https://open.spotify.com/user/31hx3sueaixdsbody6s6lligjm6a"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Spotify"
            >
              <i class="bi bi-spotify" aria-hidden="true"></i>
            </a>
          </div>

          <div class="stats-row">
            <div class="stats-item">
              <i class="bi bi-eye-fill" aria-hidden="true"></i>
              <span id="viewsCount">0</span>
            </div>
            <button type="button" class="stat-button" id="likeButton">
              <i class="bi bi-heart" aria-hidden="true"></i>
              <span id="likesCount">0</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
`;

const renderLogin = () => `
  <div class="page-shell">
    <div class="w-full max-w-md">
      <div class="surface-card p-8 space-y-6 animate-fade-in">
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-bold text-white">Вход</h2>
          <p class="text-slate-300 text-sm">Продолжайте в едином стиле главной страницы</p>
        </div>
        <form class="space-y-5" id="loginForm">
          <div id="loginError" class="hidden surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>
          <div class="space-y-3">
            <div>
              <label for="loginUsername" class="sr-only">Username</label>
              <input id="loginUsername" name="username" type="text" required class="input-field" placeholder="Username" />
            </div>
            <div>
              <label for="loginPassword" class="sr-only">Password</label>
              <input id="loginPassword" name="password" type="password" required class="input-field" placeholder="Password" />
            </div>
          </div>

          <div class="flex items-center justify-between text-sm">
            <a data-link href="/reset-password" class="text-[#6b8fc9] hover:text-[#8aa5d6] transition-colors">
              Forgot your password?
            </a>
          </div>

          <button type="submit" class="primary-button w-full text-center" id="loginSubmit">
            Sign in
          </button>

          <div class="text-center text-sm text-slate-300">
            Don't have an account?
            <a data-link href="/register" class="text-[#6b8fc9] hover:text-[#8aa5d6] transition-colors font-semibold">
              Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

const renderRegister = () => `
  <div class="page-shell">
    <div class="w-full max-w-md">
      <div class="surface-card p-8 space-y-6 animate-fade-in">
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-bold text-white">Регистрация</h2>
          <p class="text-slate-300 text-sm">Один аккуратный стиль на всех страницах</p>
        </div>
        <form class="space-y-5" id="registerForm">
          <div id="registerError" class="hidden surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>
          <div class="space-y-3">
            <div>
              <label for="registerUsername" class="sr-only">Username</label>
              <input id="registerUsername" name="username" type="text" required class="input-field" placeholder="Username" />
            </div>
            <div>
              <label for="registerEmail" class="sr-only">Email (optional)</label>
              <input id="registerEmail" name="email" type="email" class="input-field" placeholder="Email (optional, for password reset)" />
            </div>
            <div>
              <label for="registerPassword" class="sr-only">Password</label>
              <input id="registerPassword" name="password" type="password" required class="input-field" placeholder="Password" />
            </div>
            <div>
              <label for="registerConfirmPassword" class="sr-only">Confirm Password</label>
              <input id="registerConfirmPassword" name="confirmPassword" type="password" required class="input-field" placeholder="Confirm Password" />
            </div>
          </div>

          <button type="submit" class="primary-button w-full text-center" id="registerSubmit">
            Sign up
          </button>

          <div class="text-center text-sm text-slate-300">
            Already have an account?
            <a data-link href="/login" class="text-[#7289DA] hover:text-[#9bb0ff] font-semibold">
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

const renderPasswordReset = () => `
  <div class="page-shell">
    <div class="w-full max-w-md">
      <div class="surface-card p-8 space-y-6 animate-fade-in">
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-bold text-white">Reset your password</h2>
          <p class="text-slate-300 text-sm">Всё оформлено в одном ключе</p>
        </div>

        <form class="space-y-5" id="resetRequestForm">
          <div id="resetRequestError" class="hidden surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>
          <div id="resetRequestMessage" class="hidden surface-section p-3 text-sm text-green-200 border border-green-400/30 bg-green-500/10 rounded-xl space-y-1"></div>
          <div id="resetRequestNote" class="hidden surface-section p-3 text-sm text-blue-200 border border-blue-400/30 bg-blue-500/10 rounded-xl"></div>
          <div>
            <label for="resetUsernameOrEmail" class="sr-only">Username or Email</label>
            <input id="resetUsernameOrEmail" name="usernameOrEmail" type="text" required class="input-field" placeholder="Username or Email" />
          </div>

          <button type="submit" class="primary-button w-full text-center" id="resetRequestSubmit">
            Request Reset
          </button>

          <div class="text-center text-sm">
            <a data-link href="/login" class="text-[#7289DA] hover:text-[#9bb0ff] font-semibold">
              Back to Sign in
            </a>
          </div>
        </form>

        <form class="space-y-5 hidden" id="resetPasswordForm">
          <div id="resetPasswordError" class="hidden surface-section p-3 text-sm text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>
          <div id="resetPasswordMessage" class="hidden surface-section p-3 text-sm text-green-200 border border-green-400/30 bg-green-500/10 rounded-xl"></div>
          <div class="space-y-3">
            <div>
              <label for="resetCode" class="sr-only">Reset Code</label>
              <input id="resetCode" name="resetCode" type="text" required class="input-field" placeholder="Enter reset code from email" />
            </div>
            <div>
              <label for="resetNewPassword" class="sr-only">New Password</label>
              <input id="resetNewPassword" name="newPassword" type="password" required class="input-field" placeholder="New Password" />
            </div>
            <div>
              <label for="resetConfirmPassword" class="sr-only">Confirm Password</label>
              <input id="resetConfirmPassword" name="confirmPassword" type="password" required class="input-field" placeholder="Confirm Password" />
            </div>
          </div>

          <button type="submit" class="primary-button w-full text-center" id="resetPasswordSubmit">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  </div>
`;

const renderProjects = () => `
  <div class="page-shell">
    <div class="w-full max-w-6xl space-y-6">
      <div class="surface-card p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-300">Рабочие вещи</p>
          <h1 class="text-3xl font-bold text-white">Projects</h1>
        </div>
        ${
          state.user?.role === "admin"
            ? '<button class="primary-button" id="openProjectModal">Create Project</button>'
            : ""
        }
      </div>

      <div id="projectsError" class="hidden surface-section p-4 text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>

      <div id="projectsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"></div>

      <div id="projectsEmpty" class="hidden surface-section p-6 text-center text-slate-300">No projects yet.</div>
    </div>
  </div>

  <div id="projectModal" class="modal-overlay hidden">
    <div class="surface-card p-6 max-w-md w-full space-y-4">
      <h2 class="text-2xl font-bold text-white">Create New Project</h2>
      <form id="projectCreateForm" class="space-y-4">
        <div class="space-y-2">
          <label class="block text-sm text-slate-200">Project Name</label>
          <input type="text" required class="input-field" name="name" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm text-slate-200">Description</label>
          <textarea rows="3" class="input-field" name="description"></textarea>
        </div>
        <div class="flex justify-end gap-3">
          <button type="button" class="muted-button px-4" id="closeProjectModal">Cancel</button>
          <button type="submit" class="primary-button px-4">Create</button>
        </div>
      </form>
    </div>
  </div>
`;

const renderProjectDetail = () => `
  <div class="page-shell">
    <div class="w-full max-w-7xl space-y-6 animate-fade-in">
      <div class="surface-card p-8">
        <a data-link href="/projects" class="muted-button mb-6 inline-flex items-center">
          <i class="fas fa-arrow-left mr-2"></i>
          Назад к проектам
        </a>

        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-[#7289DA] font-semibold mb-2">Детали проекта</p>
            <h1 class="text-4xl font-bold text-white mb-3" id="projectTitle"></h1>
            <p class="text-[#b9bbbe] leading-relaxed" id="projectDescription"></p>
          </div>
          ${
            state.user?.role === "admin"
              ? `
              <div class="flex gap-3">
                <button id="openCreateFileModal" class="primary-button">
                  <i class="fas fa-file-plus mr-2"></i>
                  Создать файл
                </button>
                <button id="openUploadFileModal" class="muted-button">
                  <i class="fas fa-upload mr-2"></i>
                  Загрузить файл
                </button>
              </div>
            `
              : ""
          }
        </div>

        <div id="projectError" class="hidden mb-6 surface-section p-4 text-red-200 border-2 border-red-400/40 bg-red-500/20 rounded-xl"></div>

        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-12 md:col-span-3">
            <div class="surface-section p-5 rounded-xl">
              <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i class="fas fa-folder-open text-[#7289DA]"></i>
                Файлы
              </h3>
              <div id="projectFiles"></div>
            </div>
          </div>

          <div class="col-span-12 md:col-span-9">
            <div class="surface-section p-6 rounded-xl" id="projectContent"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="createFileModal" class="modal-overlay hidden">
    <div class="surface-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
      <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <i class="fas fa-file-plus text-[#7289DA]"></i>
        Создать новый файл
      </h2>
      <form id="createFileForm" class="space-y-5">
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-[#b9bbbe]">Имя файла</label>
          <input type="text" required placeholder="example.js" class="input-field" name="name" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-[#b9bbbe]">Тип файла</label>
          <input type="text" required placeholder="js, py, md, txt и т.д." class="input-field" name="file_type" value="txt" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-[#b9bbbe]">Содержимое</label>
          <textarea rows="12" class="input-field font-mono text-sm" placeholder="// Ваш код здесь..." name="content"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="muted-button" id="closeCreateFileModal">Отмена</button>
          <button type="submit" class="primary-button">
            <i class="fas fa-check mr-2"></i>
            Создать
          </button>
        </div>
      </form>
    </div>
  </div>

  <div id="uploadFileModal" class="modal-overlay hidden">
    <div class="surface-card p-8 max-w-md w-full animate-fade-in">
      <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <i class="fas fa-upload text-[#7289DA]"></i>
        Загрузить файл
      </h2>
      <form id="uploadFileForm" class="space-y-5">
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-[#b9bbbe]">Выберите файл</label>
          <input type="file" required class="input-field" name="file" />
          <p id="uploadFileName" class="text-xs text-[#7289DA] mt-2 hidden"></p>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="muted-button" id="closeUploadFileModal">Отмена</button>
          <button type="submit" class="primary-button">
            <i class="fas fa-upload mr-2"></i>
            Загрузить
          </button>
        </div>
      </form>
    </div>
  </div>
`;

const renderChat = () => `
  <div class="page-shell">
    <div class="w-full max-w-5xl animate-fade-in">
      <div class="surface-card p-8">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-[#7289DA] font-semibold mb-2">Коммуникация</p>
            <h1 class="text-4xl font-bold text-white">Командный чат</h1>
            <p class="text-[#b9bbbe] mt-2">Общайтесь с командой в реальном времени</p>
          </div>
          <div class="flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-[#40444b]">
            <span id="chatStatusDot" class="h-3 w-3 rounded-full bg-rose-500"></span>
            <span id="chatStatusText" class="text-sm text-white font-semibold">Нет подключения</span>
          </div>
        </div>

        <div class="surface-section p-5 h-[500px] flex flex-col">
          <div class="flex-1 overflow-y-auto space-y-4 mb-5" id="chatMessages">
            <div class="flex h-full items-center justify-center text-center" id="chatEmptyState">
              <div>
                <i class="fas fa-comments text-5xl text-[#7289DA] mb-3"></i>
                <p class="text-[#b9bbbe]">Пока нет сообщений — начните разговор!</p>
              </div>
            </div>
          </div>

          <form class="flex gap-3" id="chatForm">
            <input type="text" id="chatInput" placeholder="Подключение к чату..." disabled class="input-field flex-1" />
            <button type="submit" class="primary-button px-6" id="chatSend" disabled>
              <i class="fas fa-paper-plane mr-2"></i>
              Отправить
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
`;

const renderAdminPanel = () => `
  <div class="page-shell">
    <div class="w-full max-w-7xl space-y-6 animate-fade-in">
      <div class="surface-card p-8">
        <div class="mb-6">
          <p class="text-xs uppercase tracking-[0.2em] text-[#7289DA] font-semibold mb-2">Управление</p>
          <h1 class="text-4xl font-bold text-white">Админ панель</h1>
          <p class="text-[#b9bbbe] mt-2">Управление пользователями и запросами</p>
        </div>

        <div id="adminError" class="hidden mb-4 surface-section p-4 text-red-200 border-2 border-red-400/40 bg-red-500/20 rounded-xl"></div>

        <div class="flex gap-3 mb-6 border-b border-white/10 pb-4">
          <button id="adminTabUsers" class="px-5 py-2 rounded-lg font-semibold transition-all bg-[#5865F2] text-white shadow-lg">
            <i class="fas fa-users mr-2"></i>
            Пользователи
          </button>
          <button id="adminTabResets" class="px-5 py-2 rounded-lg font-semibold transition-all text-[#b9bbbe] hover:bg-[#40444b]">
            <i class="fas fa-key mr-2"></i>
            Запросы сброса
            <span id="adminResetBadge" class="hidden ml-2 px-2 py-0.5 text-xs bg-[#d23369] text-white rounded-full"></span>
          </button>
        </div>

        <div id="adminContent"></div>
      </div>
    </div>
  </div>
`;

const renderServices = () => `
  <div class="page-shell">
    <div class="w-full max-w-6xl space-y-6">
      <div class="surface-card p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-300">Профессиональные услуги</p>
          <h1 class="text-3xl font-bold text-white">Мои услуги</h1>
        </div>
        ${
          state.user?.role === "admin"
            ? '<button id="openServiceModal" class="primary-button">Добавить услугу</button>'
            : ""
        }
      </div>

      <div id="servicesError" class="hidden surface-section p-4 text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl"></div>
      <div id="servicesList" class="space-y-4"></div>
      <div id="servicesEmpty" class="hidden surface-section p-6 text-center text-slate-300">Услуги пока не добавлены.</div>
    </div>
  </div>

  <div id="serviceModal" class="modal-overlay hidden">
    <div class="surface-card p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
      <h2 class="text-2xl font-bold text-white" id="serviceModalTitle">Создать новую услугу</h2>
      <form id="serviceForm" class="space-y-4">
        <div class="space-y-2">
          <label class="block text-sm text-slate-200">Название услуги</label>
          <input type="text" required class="input-field" name="name" />
        </div>

        <div class="space-y-2">
          <label class="block text-sm text-slate-200">Описание</label>
          <textarea rows="4" required class="input-field" name="description"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-sm text-slate-200">Стоимость</label>
            <input type="text" required class="input-field" name="price" placeholder="например: 5000 руб." />
          </div>

          <div class="space-y-2">
            <label class="block text-sm text-slate-200">Время выполнения</label>
            <input type="text" required class="input-field" name="estimated_time" placeholder="например: 3-5 дней" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-sm text-slate-200">Методы оплаты</label>
          <input type="text" required class="input-field" name="payment_methods" placeholder="например: Карта, PayPal, Криптовалюта" />
        </div>

        <div class="space-y-2">
          <label class="block text-sm text-slate-200">Технологии/Фреймворки (через запятую)</label>
          <input type="text" required class="input-field" name="frameworks" placeholder="например: React, FastAPI, PostgreSQL" />
        </div>

        <div class="flex justify-end gap-3">
          <button type="button" class="muted-button px-4" id="closeServiceModal">Отмена</button>
          <button type="submit" class="primary-button px-4" id="serviceSubmit">Создать</button>
        </div>
      </form>
    </div>
  </div>
`;

const renderContact = () => `
  <div class="page-shell">
    <div class="w-full max-w-3xl space-y-6">
      <div class="surface-card p-8 animate-fade-in">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-white mb-3">Свяжитесь со мной</h1>
          <p class="text-slate-300">
            Есть вопросы или хотите обсудить проект? Заполните форму ниже, и я свяжусь с вами в ближайшее время.
          </p>
        </div>

        <div id="contactSuccess" class="hidden surface-section p-4 text-green-200 border border-green-400/40 bg-green-500/10 rounded-xl mb-6"></div>
        <div id="contactError" class="hidden surface-section p-4 text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl mb-6"></div>

        <form id="contactForm" class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="space-y-2">
              <label for="contactName" class="block text-sm font-medium text-slate-200">
                Ваше имя <span class="text-red-400">*</span>
              </label>
              <input id="contactName" type="text" required class="input-field" placeholder="Иван Иванов" name="name" />
            </div>

            <div class="space-y-2">
              <label for="contactEmail" class="block text-sm font-medium text-slate-200">
                Email <span class="text-red-400">*</span>
              </label>
              <input id="contactEmail" type="email" required class="input-field" placeholder="ivan@example.com" name="email" />
            </div>
          </div>

          <div class="space-y-2">
            <label for="contactPhone" class="block text-sm font-medium text-slate-200">
              Телефон <span class="text-slate-400 text-xs">(необязательно)</span>
            </label>
            <input id="contactPhone" type="tel" class="input-field" placeholder="+7 (900) 123-45-67" name="phone" />
          </div>

          <div class="space-y-2">
            <label for="contactSubject" class="block text-sm font-medium text-slate-200">
              Тема <span class="text-red-400">*</span>
            </label>
            <input id="contactSubject" type="text" required class="input-field" placeholder="Разработка веб-приложения" name="subject" />
          </div>

          <div class="space-y-2">
            <label for="contactMessage" class="block text-sm font-medium text-slate-200">
              Сообщение <span class="text-red-400">*</span>
            </label>
            <textarea id="contactMessage" rows="6" required class="input-field" placeholder="Расскажите о вашем проекте или задайте вопрос..." name="message"></textarea>
          </div>

          <button type="submit" class="primary-button w-full text-center" id="contactSubmit">
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

const renderLoading = () => `
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-xl">Loading...</div>
  </div>
`;

const renderNotFound = () => `
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-xl">Страница не найдена</div>
  </div>
`;

const navigate = (path) => {
  if (window.location.pathname === path) {
    renderApp();
    return;
  }
  window.history.pushState({}, "", path);
  renderApp();
};

const renderLayout = (content) => `${renderNav(window.location.pathname)}${content}`;

const showElement = (element, show) => {
  if (!element) return;
  element.classList.toggle("hidden", !show);
};

const setupHome = () => {
  updateBirthdayCountdown();
  const interval = setInterval(updateBirthdayCountdown, 60000);
  updateStats();
  const likeButton = document.getElementById("likeButton");
  if (likeButton) {
    likeButton.addEventListener("click", handleLike);
  }
  currentCleanup = () => clearInterval(interval);
};

const setupLogin = () => {
  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");
  const submitButton = document.getElementById("loginSubmit");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showElement(errorBox, false);
    submitButton.disabled = true;
    submitButton.textContent = "Signing in...";

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
      const { response, data } = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { username, password },
      });

      if (!response.ok) {
        throw new Error(data?.detail || "Login failed");
      }

      state.token = data.access_token;
      state.user = data.user;
      setStoredToken(state.token);
      navigate("/projects");
    } catch (error) {
      errorBox.textContent = error.message || "Login failed";
      showElement(errorBox, true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Sign in";
    }
  });
};

const setupRegister = () => {
  const form = document.getElementById("registerForm");
  const errorBox = document.getElementById("registerError");
  const submitButton = document.getElementById("registerSubmit");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showElement(errorBox, false);

    const username = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;

    if (password !== confirmPassword) {
      errorBox.textContent = "Passwords do not match";
      showElement(errorBox, true);
      return;
    }

    if (password.length < 6) {
      errorBox.textContent = "Password must be at least 6 characters";
      showElement(errorBox, true);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";

    try {
      const { response, data } = await apiRequest("/api/auth/register", {
        method: "POST",
        body: { username, email: email || null, password },
      });

      if (!response.ok) {
        throw new Error(data?.detail || "Registration failed");
      }

      state.token = data.access_token;
      state.user = data.user;
      setStoredToken(state.token);
      navigate("/projects");
    } catch (error) {
      errorBox.textContent = error.message || "Registration failed";
      showElement(errorBox, true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Sign up";
    }
  });
};

const setupPasswordReset = () => {
  const requestForm = document.getElementById("resetRequestForm");
  const resetForm = document.getElementById("resetPasswordForm");
  const requestError = document.getElementById("resetRequestError");
  const requestMessage = document.getElementById("resetRequestMessage");
  const requestNote = document.getElementById("resetRequestNote");
  const requestSubmit = document.getElementById("resetRequestSubmit");
  const resetError = document.getElementById("resetPasswordError");
  const resetMessage = document.getElementById("resetPasswordMessage");
  const resetSubmit = document.getElementById("resetPasswordSubmit");

  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showElement(requestError, false);
    showElement(requestMessage, false);
    showElement(requestNote, false);
    requestSubmit.disabled = true;
    requestSubmit.textContent = "Requesting...";

    const usernameOrEmail = document.getElementById("resetUsernameOrEmail").value.trim();

    try {
      const { response, data } = await apiRequest("/api/auth/password-reset-request", {
        method: "POST",
        body: { username_or_email: usernameOrEmail },
      });

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to request password reset");
      }

      requestMessage.innerHTML = `<p>${data.message}</p>`;
      if (data.has_email && data.email_sent === false) {
        requestMessage.innerHTML += `
          <p class="text-xs text-green-100/80">
            Email delivery failed. Please verify SMTP settings on the server or contact an administrator.
          </p>
        `;
      }
      showElement(requestMessage, true);

      if (!data.has_email) {
        requestNote.innerHTML = `
          <p>Ваш запрос отправлен администратору. Он рассмотрит обращение и обновит пароль вручную.</p>
        `;
        showElement(requestNote, true);
      } else {
        showElement(requestForm, false);
        showElement(resetForm, true);
      }
    } catch (error) {
      requestError.textContent = error.message || "Failed to request password reset";
      showElement(requestError, true);
    } finally {
      requestSubmit.disabled = false;
      requestSubmit.textContent = "Request Reset";
    }
  });

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showElement(resetError, false);
    showElement(resetMessage, false);
    resetSubmit.disabled = true;
    resetSubmit.textContent = "Resetting...";

    const usernameOrEmail = document.getElementById("resetUsernameOrEmail").value.trim();
    const resetCode = document.getElementById("resetCode").value.trim();
    const newPassword = document.getElementById("resetNewPassword").value;
    const confirmPassword = document.getElementById("resetConfirmPassword").value;

    if (newPassword !== confirmPassword) {
      resetError.textContent = "Passwords do not match";
      showElement(resetError, true);
      resetSubmit.disabled = false;
      resetSubmit.textContent = "Reset Password";
      return;
    }

    if (newPassword.length < 6) {
      resetError.textContent = "Password must be at least 6 characters";
      showElement(resetError, true);
      resetSubmit.disabled = false;
      resetSubmit.textContent = "Reset Password";
      return;
    }

    try {
      const { response, data } = await apiRequest("/api/auth/password-reset", {
        method: "POST",
        body: {
          username_or_email: usernameOrEmail,
          reset_code: resetCode,
          new_password: newPassword,
        },
      });

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to reset password");
      }

      resetMessage.textContent = "Password reset successful! You can now log in.";
      showElement(resetMessage, true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      resetError.textContent = error.message || "Failed to reset password";
      showElement(resetError, true);
    } finally {
      resetSubmit.disabled = false;
      resetSubmit.textContent = "Reset Password";
    }
  });
};

const setupProjects = () => {
  const grid = document.getElementById("projectsGrid");
  const empty = document.getElementById("projectsEmpty");
  const errorBox = document.getElementById("projectsError");
  const modal = document.getElementById("projectModal");
  const openModal = document.getElementById("openProjectModal");
  const closeModal = document.getElementById("closeProjectModal");
  const form = document.getElementById("projectCreateForm");

  const renderProjectsList = (projects, isAdmin) => {
    grid.innerHTML = projects
      .map(
        (project) => `
          <div class="surface-section p-5 flex flex-col gap-3">
            <a data-link href="/projects/${project.id}" class="text-xl font-semibold text-[#7289DA] hover:text-[#9bb0ff]">
              ${project.name}
            </a>
            <p class="text-slate-200/90 text-sm min-h-[48px]">${project.description}</p>
            <div class="flex justify-between items-center text-xs text-slate-400">
              <span>${new Date(project.created_at).toLocaleDateString()}</span>
              ${
                isAdmin
                  ? `<button data-project-delete="${project.id}" class="text-red-300 hover:text-red-100 font-semibold">Delete</button>`
                  : ""
              }
            </div>
          </div>
        `
      )
      .join("");
  };

  const fetchProjects = async () => {
    showElement(errorBox, false);
    try {
      const { response, data } = await apiRequest("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      renderProjectsList(data, state.user?.role === "admin");
      showElement(empty, data.length === 0);
    } catch (error) {
      errorBox.textContent = error.message || "Failed to fetch projects";
      showElement(errorBox, true);
    }
  };

  if (openModal) {
    openModal.addEventListener("click", () => showElement(modal, true));
  }

  if (closeModal) {
    closeModal.addEventListener("click", () => showElement(modal, false));
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = {
        name: formData.get("name"),
        description: formData.get("description"),
      };
      try {
        const { response, data } = await apiRequest("/api/projects", {
          method: "POST",
          body: payload,
        });
        if (!response.ok) {
          throw new Error(data?.detail || "Failed to create project");
        }
        form.reset();
        showElement(modal, false);
        await fetchProjects();
      } catch (error) {
        errorBox.textContent = error.message || "Failed to create project";
        showElement(errorBox, true);
      }
    });
  }

  grid.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-project-delete]");
    if (!deleteButton) return;
    const projectId = deleteButton.dataset.projectDelete;
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const { response, data } = await apiRequest(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to delete project");
      }
      await fetchProjects();
    } catch (error) {
      errorBox.textContent = error.message || "Failed to delete project";
      showElement(errorBox, true);
    }
  });

  fetchProjects();
};

const setupProjectDetail = (projectId) => {
  const titleEl = document.getElementById("projectTitle");
  const descriptionEl = document.getElementById("projectDescription");
  const errorBox = document.getElementById("projectError");
  const filesEl = document.getElementById("projectFiles");
  const contentEl = document.getElementById("projectContent");
  const createModal = document.getElementById("createFileModal");
  const uploadModal = document.getElementById("uploadFileModal");
  const openCreate = document.getElementById("openCreateFileModal");
  const openUpload = document.getElementById("openUploadFileModal");
  const closeCreate = document.getElementById("closeCreateFileModal");
  const closeUpload = document.getElementById("closeUploadFileModal");
  const createForm = document.getElementById("createFileForm");
  const uploadForm = document.getElementById("uploadFileForm");
  const uploadFileName = document.getElementById("uploadFileName");

  let project = null;
  let selectedFile = null;
  let editMode = false;

  const renderFiles = () => {
    if (!project?.files?.length) {
      filesEl.innerHTML = `
        <p class="text-sm text-[#b9bbbe] text-center py-4">
          <i class="fas fa-folder-open text-2xl mb-2 block text-[#7289DA]"></i>
          Нет файлов
        </p>
      `;
      return;
    }

    filesEl.innerHTML = project.files
      .map((file) => {
        const isActive = selectedFile?.id === file.id;
        return `
          <div
            class="p-3 rounded-lg cursor-pointer transition-all border ${
              isActive
                ? "bg-[#5865F2] border-[#7289DA] text-white"
                : "border-transparent hover:bg-[#40444b] hover:border-[#7289DA]/50 text-[#b9bbbe]"
            }"
            data-file-id="${file.id}"
          >
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium truncate flex items-center gap-2">
                <i class="fas fa-file text-xs"></i>
                ${file.name}
              </span>
              ${
                state.user?.role === "admin"
                  ? `<button data-file-delete="${file.id}" class="text-[#d23369] hover:text-[#e04377] text-sm">
                      <i class="fas fa-trash"></i>
                    </button>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");
  };

  const renderFileContent = () => {
    if (!selectedFile) {
      contentEl.innerHTML = `
        <div class="text-center py-20">
          <i class="fas fa-mouse-pointer text-5xl text-[#7289DA] mb-4"></i>
          <p class="text-[#b9bbbe]">Выберите файл для просмотра</p>
        </div>
      `;
      return;
    }

    const isBinary = selectedFile.is_binary;
    const header = `
      <div class="flex justify-between items-center mb-5 pb-4 border-b border-white/10">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <i class="fas fa-file-code text-[#7289DA]"></i>
          ${selectedFile.name}
        </h3>
        ${
          state.user?.role === "admin" && !isBinary
            ? `
              <div class="flex gap-2" id="fileActions">
                ${
                  editMode
                    ? `
                      <button id="saveFile" class="primary-button">
                        <i class="fas fa-save mr-2"></i>
                        Сохранить
                      </button>
                      <button id="cancelEdit" class="muted-button">
                        Отмена
                      </button>
                    `
                    : `
                      <button id="editFile" class="muted-button">
                        <i class="fas fa-edit mr-2"></i>
                        Редактировать
                      </button>
                    `
                }
              </div>
            `
            : ""
        }
      </div>
    `;

    const bodyWrapper = document.createElement("div");
    bodyWrapper.className = "overflow-auto max-h-[600px] rounded-lg";

    if (isBinary) {
      const fileType = selectedFile.file_type.toLowerCase();
      if (["png", "jpg", "jpeg", "gif", "webp", "ico"].includes(fileType)) {
        bodyWrapper.innerHTML = `<img src="data:image/${fileType};base64,${selectedFile.content}" alt="${selectedFile.name}" class="max-w-full h-auto" />`;
      } else if (["mp4", "avi", "mov", "webm"].includes(fileType)) {
        bodyWrapper.innerHTML = `
          <video controls class="max-w-full h-auto">
            <source src="data:video/${fileType};base64,${selectedFile.content}" type="video/${fileType}" />
            Your browser does not support the video tag.
          </video>
        `;
      } else {
        bodyWrapper.innerHTML = `<p class="text-[#b9bbbe]">Binary file - cannot display</p>`;
      }
    } else if (editMode) {
      bodyWrapper.innerHTML = `
        <textarea id="fileEditor" class="w-full h-96 p-4 font-mono text-sm bg-[#1f2230] border border-white/10 rounded-lg text-white"></textarea>
      `;
    } else if (selectedFile.file_type === "md") {
      bodyWrapper.innerHTML = `<div class="prose max-w-none text-[#b9bbbe]" id="markdownPreview"></div>`;
    } else {
      const language = languageMap[selectedFile.file_type] || "text";
      bodyWrapper.innerHTML = `
        <pre><code class="language-${language}" id="codeBlock"></code></pre>
      `;
    }

    contentEl.innerHTML = header;
    contentEl.appendChild(bodyWrapper);

    if (!isBinary && editMode) {
      const editor = document.getElementById("fileEditor");
      editor.value = selectedFile.content || "";
    } else if (!isBinary && selectedFile.file_type === "md") {
      const preview = document.getElementById("markdownPreview");
      preview.innerHTML = marked.parse(selectedFile.content || "");
      if (window.renderMathInElement) {
        renderMathInElement(preview, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
        });
      }
    } else if (!isBinary) {
      const codeBlock = document.getElementById("codeBlock");
      codeBlock.textContent = selectedFile.content || "";
      hljs.highlightElement(codeBlock);
    }

    const editButton = document.getElementById("editFile");
    const saveButton = document.getElementById("saveFile");
    const cancelButton = document.getElementById("cancelEdit");

    if (editButton) {
      editButton.addEventListener("click", () => {
        editMode = true;
        renderFileContent();
      });
    }

    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        editMode = false;
        renderFileContent();
      });
    }

    if (saveButton) {
      saveButton.addEventListener("click", async () => {
        const editor = document.getElementById("fileEditor");
        try {
          const { response, data } = await apiRequest(`/api/files/${selectedFile.id}`, {
            method: "PUT",
            body: { content: editor.value },
          });
          if (!response.ok) {
            throw new Error(data?.detail || "Failed to save file");
          }
          editMode = false;
          await fetchProject();
        } catch (error) {
          errorBox.textContent = error.message || "Failed to save file";
          showElement(errorBox, true);
        }
      });
    }
  };

  const fetchProject = async () => {
    showElement(errorBox, false);
    try {
      const { response, data } = await apiRequest(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      project = data;
      titleEl.textContent = project.name;
      descriptionEl.textContent = project.description;
      if (project.files?.length) {
        selectedFile = project.files.find((file) => file.id === selectedFile?.id) || project.files[0];
      } else {
        selectedFile = null;
      }
      renderFiles();
      renderFileContent();
    } catch (error) {
      errorBox.textContent = error.message || "Failed to fetch project";
      showElement(errorBox, true);
    }
  };

  filesEl.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-file-delete]");
    if (deleteButton) {
      event.stopPropagation();
      const fileId = deleteButton.dataset.fileDelete;
      if (!window.confirm("Are you sure you want to delete this file?")) return;
      try {
        const { response, data } = await apiRequest(`/api/files/${fileId}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error(data?.detail || "Failed to delete file");
        }
        await fetchProject();
      } catch (error) {
        errorBox.textContent = error.message || "Failed to delete file";
        showElement(errorBox, true);
      }
      return;
    }

    const fileItem = event.target.closest("[data-file-id]");
    if (fileItem) {
      const fileId = fileItem.dataset.fileId;
      selectedFile = project.files.find((file) => String(file.id) === String(fileId));
      editMode = false;
      renderFiles();
      renderFileContent();
    }
  });

  if (openCreate) {
    openCreate.addEventListener("click", () => showElement(createModal, true));
  }
  if (closeCreate) {
    closeCreate.addEventListener("click", () => showElement(createModal, false));
  }
  if (openUpload) {
    openUpload.addEventListener("click", () => showElement(uploadModal, true));
  }
  if (closeUpload) {
    closeUpload.addEventListener("click", () => showElement(uploadModal, false));
  }

  if (createForm) {
    createForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(createForm);
      const payload = {
        project_id: projectId,
        name: formData.get("name"),
        content: formData.get("content"),
        file_type: formData.get("file_type") || "txt",
      };
      try {
        const { response, data } = await apiRequest("/api/files", {
          method: "POST",
          body: payload,
        });
        if (!response.ok) {
          throw new Error(data?.detail || "Failed to create file");
        }
        createForm.reset();
        showElement(createModal, false);
        await fetchProject();
      } catch (error) {
        errorBox.textContent = error.message || "Failed to create file";
        showElement(errorBox, true);
      }
    });
  }

  if (uploadForm) {
    const fileInput = uploadForm.querySelector('input[type="file"]');
    fileInput.addEventListener("change", () => {
      if (fileInput.files?.[0]) {
        uploadFileName.textContent = `Выбран: ${fileInput.files[0].name}`;
        showElement(uploadFileName, true);
      } else {
        showElement(uploadFileName, false);
      }
    });

    uploadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const file = fileInput.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("file", file);

      try {
        const { response, data } = await apiRequest("/api/files/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error(data?.detail || "Failed to upload file");
        }
        uploadForm.reset();
        showElement(uploadModal, false);
        showElement(uploadFileName, false);
        await fetchProject();
      } catch (error) {
        errorBox.textContent = error.message || "Failed to upload file";
        showElement(errorBox, true);
      }
    });
  }

  fetchProject();
};

const setupChat = () => {
  const messagesEl = document.getElementById("chatMessages");
  const emptyState = document.getElementById("chatEmptyState");
  const input = document.getElementById("chatInput");
  const form = document.getElementById("chatForm");
  const sendButton = document.getElementById("chatSend");
  const statusDot = document.getElementById("chatStatusDot");
  const statusText = document.getElementById("chatStatusText");

  let ws = null;
  let connected = false;

  const setStatus = (isConnected) => {
    connected = isConnected;
    statusDot.className = `h-3 w-3 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`;
    statusText.textContent = isConnected ? "Онлайн" : "Нет подключения";
    input.disabled = !isConnected;
    input.placeholder = isConnected ? "Введите сообщение…" : "Подключение к чату...";
    sendButton.disabled = !isConnected || !input.value.trim();
  };

  const appendMessage = (msg) => {
    if (msg.system) {
      messagesEl.insertAdjacentHTML(
        "beforeend",
        `
          <div class="text-center py-2">
            <span class="text-xs uppercase tracking-widest text-[#7289DA] bg-[#40444b] px-3 py-1 rounded-full">
              ${msg.message}
            </span>
          </div>
        `
      );
      return;
    }

    const isOwn = msg.user_id === state.user?.id;
    messagesEl.insertAdjacentHTML(
      "beforeend",
      `
        <div class="flex ${isOwn ? "justify-end" : "justify-start"}">
          <div class="max-w-md rounded-2xl px-5 py-3 shadow-lg ${
            isOwn
              ? "bg-gradient-to-br from-[#5865F2] to-[#7289DA] text-white"
              : "bg-[#40444b] text-white border border-white/10"
          }">
            <div class="flex items-center gap-2 text-xs font-semibold mb-1 opacity-80">
              <i class="fas fa-user-circle"></i>
              <span>${msg.username}${isOwn ? " (Вы)" : ""}</span>
              ${
                msg.timestamp
                  ? `<span class="opacity-60">${new Date(msg.timestamp).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</span>`
                  : ""
              }
            </div>
            <p class="text-sm leading-relaxed">${msg.message}</p>
          </div>
        </div>
      `
    );
  };

  const scrollToBottom = () => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const connectWebsocket = () => {
    if (!state.token) return;

    let websocketBase;
    try {
      const parsedUrl = new URL(state.apiUrl);
      const wsProtocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";
      const cleanedPath = parsedUrl.pathname.replace(/\/$/, "");
      websocketBase = `${wsProtocol}//${parsedUrl.host}${cleanedPath}`;
    } catch (error) {
      websocketBase = state.apiUrl.replace("http://", "ws://").replace("https://", "wss://");
    }

    ws = new WebSocket(`${websocketBase}/api/ws/chat?token=${state.token}`);

    ws.onopen = () => {
      setStatus(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "history") {
        messagesEl.innerHTML = "";
        if (data.messages?.length) {
          data.messages.forEach(appendMessage);
          showElement(emptyState, false);
        } else {
          showElement(emptyState, true);
        }
        scrollToBottom();
      } else if (data.type === "message") {
        showElement(emptyState, false);
        appendMessage(data.data);
        scrollToBottom();
      }
    };

    ws.onerror = () => {
      setStatus(false);
    };

    ws.onclose = () => {
      setStatus(false);
    };
  };

  input.addEventListener("input", () => {
    sendButton.disabled = !connected || !input.value.trim();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!input.value.trim() || !ws || !connected) return;
    ws.send(JSON.stringify({ message: input.value }));
    input.value = "";
    sendButton.disabled = true;
  });

  connectWebsocket();
  currentCleanup = () => {
    if (ws) {
      ws.close();
    }
  };
};

const setupAdminPanel = () => {
  const content = document.getElementById("adminContent");
  const errorBox = document.getElementById("adminError");
  const tabUsers = document.getElementById("adminTabUsers");
  const tabResets = document.getElementById("adminTabResets");
  const badge = document.getElementById("adminResetBadge");

  let activeTab = "users";

  const setTab = (tab) => {
    activeTab = tab;
    tabUsers.className =
      tab === "users"
        ? "px-5 py-2 rounded-lg font-semibold transition-all bg-[#5865F2] text-white shadow-lg"
        : "px-5 py-2 rounded-lg font-semibold transition-all text-[#b9bbbe] hover:bg-[#40444b]";
    tabResets.className =
      tab === "reset-requests"
        ? "px-5 py-2 rounded-lg font-semibold transition-all bg-[#5865F2] text-white shadow-lg"
        : "px-5 py-2 rounded-lg font-semibold transition-all text-[#b9bbbe] hover:bg-[#40444b]";
    fetchData();
  };

  const renderUsers = (users) => `
    <div class="surface-section rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-[#40444b]">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">Пользователь</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">Email</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">Роль</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-[#7289DA] uppercase tracking-wider">Дата регистрации</th>
              <th class="px-6 py-4 text-right text-xs font-bold text-[#7289DA] uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10">
            ${users
              .map(
                (user) => `
                  <tr class="hover:bg-[#40444b]/50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <i class="fas fa-user-circle text-[#7289DA] text-xl"></i>
                        <span class="text-sm font-semibold text-white">${user.username}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-[#b9bbbe]">${user.email || "-"}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-3 py-1 inline-flex text-xs font-bold rounded-full ${
                        user.role === "admin"
                          ? "bg-[#5865F2] text-white"
                          : "bg-[#40444b] text-[#7289DA] border border-[#7289DA]"
                      }">
                        ${user.role === "admin" ? "Администратор" : "Пользователь"}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-[#b9bbbe]">
                      ${new Date(user.created_at).toLocaleDateString("ru-RU")}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button data-toggle-role="${user.id}" data-role="${user.role}" class="text-[#7289DA] hover:text-[#5865F2] font-semibold">
                        <i class="fas fa-exchange-alt mr-1"></i>
                        Сменить роль
                      </button>
                      <button data-reset-password="${user.id}" class="text-[#d23369] hover:text-[#e04377] font-semibold">
                        <i class="fas fa-key mr-1"></i>
                        Сбросить пароль
                      </button>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const renderResetRequests = (requests) => {
    if (!requests.length) {
      return `
        <div class="surface-section p-12 text-center">
          <i class="fas fa-check-circle text-5xl text-[#43b581] mb-4"></i>
          <p class="text-[#b9bbbe] text-lg">Нет ожидающих запросов на сброс пароля</p>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        ${requests
          .map(
            (request) => `
              <div class="surface-section p-6 flex justify-between items-center hover:border-[#7289DA] border border-transparent transition-all">
                <div class="flex items-center gap-4">
                  <i class="fas fa-user-lock text-3xl text-[#7289DA]"></i>
                  <div>
                    <p class="font-bold text-white text-lg">${request.username}</p>
                    <p class="text-sm text-[#b9bbbe]">
                      <i class="fas fa-clock mr-1"></i>
                      Запрос от: ${new Date(request.requested_at).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </div>
                <button data-reset-password="${request.user_id}" class="primary-button">
                  <i class="fas fa-key mr-2"></i>
                  Сбросить пароль
                </button>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  };

  const fetchData = async () => {
    showElement(errorBox, false);
    content.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-spinner fa-spin text-4xl text-[#7289DA] mb-3"></i>
        <p class="text-xl text-white">Загрузка...</p>
      </div>
    `;

    try {
      if (activeTab === "users") {
        const { response, data } = await apiRequest("/api/admin/users");
        if (!response.ok) {
          throw new Error(data?.detail || "Не удалось загрузить данные");
        }
        content.innerHTML = renderUsers(data);
      } else {
        const { response, data } = await apiRequest("/api/admin/reset-requests");
        if (!response.ok) {
          throw new Error(data?.detail || "Не удалось загрузить данные");
        }
        content.innerHTML = renderResetRequests(data);
        if (data.length) {
          badge.textContent = data.length;
          showElement(badge, true);
        } else {
          showElement(badge, false);
        }
      }
    } catch (error) {
      content.innerHTML = "";
      errorBox.textContent = error.message || "Не удалось загрузить данные";
      showElement(errorBox, true);
    }
  };

  content.addEventListener("click", async (event) => {
    const resetButton = event.target.closest("[data-reset-password]");
    const toggleButton = event.target.closest("[data-toggle-role]");

    if (resetButton) {
      const userId = resetButton.dataset.resetPassword;
      if (!window.confirm("Вы уверены, что хотите сбросить пароль на qwerty123?")) {
        return;
      }
      try {
        const { response, data } = await apiRequest(`/api/admin/reset-password/${userId}`, {
          method: "POST",
        });
        if (!response.ok) {
          throw new Error(data?.detail || "Не удалось сбросить пароль");
        }
        window.alert("Пароль сброшен на qwerty123");
        fetchData();
      } catch (error) {
        errorBox.textContent = error.message || "Не удалось сбросить пароль";
        showElement(errorBox, true);
      }
    }

    if (toggleButton) {
      const userId = toggleButton.dataset.toggleRole;
      const currentRole = toggleButton.dataset.role;
      const newRole = currentRole === "admin" ? "user" : "admin";
      if (!window.confirm(`Изменить роль на ${newRole}?`)) {
        return;
      }
      try {
        const { response, data } = await apiRequest(`/api/admin/users/${userId}/role?role=${newRole}`, {
          method: "PUT",
        });
        if (!response.ok) {
          throw new Error(data?.detail || "Не удалось изменить роль");
        }
        fetchData();
      } catch (error) {
        errorBox.textContent = error.message || "Не удалось изменить роль";
        showElement(errorBox, true);
      }
    }
  });

  tabUsers.addEventListener("click", () => setTab("users"));
  tabResets.addEventListener("click", () => setTab("reset-requests"));

  fetchData();
};

const setupServices = () => {
  const list = document.getElementById("servicesList");
  const empty = document.getElementById("servicesEmpty");
  const errorBox = document.getElementById("servicesError");
  const modal = document.getElementById("serviceModal");
  const openModal = document.getElementById("openServiceModal");
  const closeModal = document.getElementById("closeServiceModal");
  const form = document.getElementById("serviceForm");
  const modalTitle = document.getElementById("serviceModalTitle");
  const submitButton = document.getElementById("serviceSubmit");

  let services = [];
  let expandedId = null;
  let editingService = null;

  const parseFrameworks = (frameworks) => {
    try {
      return frameworks
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  };

  const renderServicesList = () => {
    list.innerHTML = services
      .map((service) => {
        const isExpanded = expandedId === service.id;
        const frameworks = parseFrameworks(service.frameworks || "");
        return `
          <div class="surface-card overflow-hidden transition-all duration-300">
            <button class="w-full p-6 text-left hover:bg-white/5 transition-colors" data-service-toggle="${service.id}">
              <div class="flex justify-between items-start gap-4">
                <div class="flex-1">
                  <h3 class="text-xl font-semibold text-white mb-2">${service.name}</h3>
                  <p class="text-slate-300 text-sm line-clamp-2">${service.description}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-[#7289DA] font-bold text-lg">${service.price}</span>
                  <i class="fas fa-chevron-down text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}"></i>
                </div>
              </div>
            </button>

            ${
              isExpanded
                ? `
                  <div class="px-6 pb-6 space-y-4 animate-fade-in">
                    <div class="border-t border-white/10 pt-4 space-y-3">
                      <div>
                        <h4 class="text-sm font-semibold text-slate-400 mb-1">Описание</h4>
                        <p class="text-slate-200 whitespace-pre-wrap">${service.description}</p>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 class="text-sm font-semibold text-slate-400 mb-1">
                            <i class="fas fa-dollar-sign mr-2"></i>Стоимость
                          </h4>
                          <p class="text-white font-semibold">${service.price}</p>
                        </div>

                        <div>
                          <h4 class="text-sm font-semibold text-slate-400 mb-1">
                            <i class="fas fa-clock mr-2"></i>Время выполнения
                          </h4>
                          <p class="text-white">${service.estimated_time}</p>
                        </div>
                      </div>

                      <div>
                        <h4 class="text-sm font-semibold text-slate-400 mb-1">
                          <i class="fas fa-credit-card mr-2"></i>Методы оплаты
                        </h4>
                        <p class="text-slate-200">${service.payment_methods}</p>
                      </div>

                      ${
                        frameworks.length
                          ? `
                            <div>
                              <h4 class="text-sm font-semibold text-slate-400 mb-2">
                                <i class="fas fa-code mr-2"></i>Технологии
                              </h4>
                              <div class="flex flex-wrap gap-2">
                                ${frameworks.map((framework) => `<span class="pill-tag">${framework}</span>`).join("")}
                              </div>
                            </div>
                          `
                          : ""
                      }

                      ${
                        state.user?.role === "admin"
                          ? `
                            <div class="flex gap-3 pt-3 border-t border-white/10">
                              <button class="muted-button px-4" data-service-edit="${service.id}">Редактировать</button>
                              <button class="text-red-300 hover:text-red-100 font-semibold px-4" data-service-delete="${service.id}">Удалить</button>
                            </div>
                          `
                          : ""
                      }
                    </div>
                  </div>
                `
                : ""
            }
          </div>
        `;
      })
      .join("");
  };

  const fetchServices = async () => {
    showElement(errorBox, false);
    try {
      const { response, data } = await apiRequest("/api/services");
      if (!response.ok) {
        throw new Error("Не удалось загрузить услуги");
      }
      services = data;
      renderServicesList();
      showElement(empty, services.length === 0);
    } catch (error) {
      errorBox.textContent = error.message || "Не удалось загрузить услуги";
      showElement(errorBox, true);
    }
  };

  list.addEventListener("click", async (event) => {
    const toggle = event.target.closest("[data-service-toggle]");
    const editButton = event.target.closest("[data-service-edit]");
    const deleteButton = event.target.closest("[data-service-delete]");

    if (toggle) {
      const serviceId = toggle.dataset.serviceToggle;
      expandedId = expandedId === serviceId ? null : serviceId;
      renderServicesList();
    }

    if (editButton) {
      const serviceId = editButton.dataset.serviceEdit;
      editingService = services.find((service) => String(service.id) === String(serviceId));
      if (!editingService) return;
      modalTitle.textContent = "Редактировать услугу";
      submitButton.textContent = "Сохранить";
      form.name.value = editingService.name;
      form.description.value = editingService.description;
      form.price.value = editingService.price;
      form.estimated_time.value = editingService.estimated_time;
      form.payment_methods.value = editingService.payment_methods;
      form.frameworks.value = editingService.frameworks;
      showElement(modal, true);
    }

    if (deleteButton) {
      const serviceId = deleteButton.dataset.serviceDelete;
      if (!window.confirm("Вы уверены, что хотите удалить эту услугу?")) return;
      try {
        const { response, data } = await apiRequest(`/api/services/${serviceId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error(data?.detail || "Не удалось удалить услугу");
        }
        await fetchServices();
      } catch (error) {
        errorBox.textContent = error.message || "Не удалось удалить услугу";
        showElement(errorBox, true);
      }
    }
  });

  if (openModal) {
    openModal.addEventListener("click", () => {
      editingService = null;
      modalTitle.textContent = "Создать новую услугу";
      submitButton.textContent = "Создать";
      form.reset();
      showElement(modal, true);
    });
  }

  if (closeModal) {
    closeModal.addEventListener("click", () => {
      showElement(modal, false);
      editingService = null;
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.value,
      description: form.description.value,
      price: form.price.value,
      estimated_time: form.estimated_time.value,
      payment_methods: form.payment_methods.value,
      frameworks: form.frameworks.value,
    };

    try {
      const { response, data } = editingService
        ? await apiRequest(`/api/services/${editingService.id}`, {
            method: "PUT",
            body: payload,
          })
        : await apiRequest("/api/services", {
            method: "POST",
            body: payload,
          });

      if (!response.ok) {
        throw new Error(data?.detail || "Не удалось сохранить услугу");
      }

      showElement(modal, false);
      editingService = null;
      form.reset();
      await fetchServices();
    } catch (error) {
      errorBox.textContent = error.message || "Не удалось сохранить услугу";
      showElement(errorBox, true);
    }
  });

  fetchServices();
};

const setupContact = () => {
  const form = document.getElementById("contactForm");
  const successBox = document.getElementById("contactSuccess");
  const errorBox = document.getElementById("contactError");
  const submitButton = document.getElementById("contactSubmit");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showElement(successBox, false);
    showElement(errorBox, false);
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Отправка...';

    const payload = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      subject: form.subject.value,
      message: form.message.value,
    };

    try {
      const { response, data } = await apiRequest("/api/contact", {
        method: "POST",
        body: payload,
      });
      if (!response.ok || !data?.success) {
        throw new Error(data?.detail || "Не удалось отправить сообщение. Попробуйте позже.");
      }
      successBox.innerHTML = `<i class="fas fa-check-circle mr-2"></i>Сообщение успешно отправлено! Я свяжусь с вами в ближайшее время.`;
      showElement(successBox, true);
      form.reset();
    } catch (error) {
      errorBox.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${error.message}`;
      showElement(errorBox, true);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Отправить сообщение';
    }
  });
};

const setupPage = (path, params = {}) => {
  switch (path) {
    case "/":
      setupHome();
      break;
    case "/login":
      setupLogin();
      break;
    case "/register":
      setupRegister();
      break;
    case "/reset-password":
      setupPasswordReset();
      break;
    case "/projects":
      setupProjects();
      break;
    case "/projects/:id":
      setupProjectDetail(params.id);
      break;
    case "/chat":
      setupChat();
      break;
    case "/admin":
      setupAdminPanel();
      break;
    case "/services":
      setupServices();
      break;
    case "/contact":
      setupContact();
      break;
    default:
      break;
  }
};

const resolveRoute = (pathname) => {
  if (pathname.startsWith("/projects/")) {
    const id = pathname.split("/").pop();
    return { path: "/projects/:id", params: { id } };
  }
  return { path: pathname, params: {} };
};

const renderPage = (route) => {
  switch (route.path) {
    case "/":
      return renderHome();
    case "/login":
      return renderLogin();
    case "/register":
      return renderRegister();
    case "/reset-password":
      return renderPasswordReset();
    case "/projects":
      return renderProjects();
    case "/projects/:id":
      return renderProjectDetail();
    case "/chat":
      return renderChat();
    case "/admin":
      return renderAdminPanel();
    case "/services":
      return renderServices();
    case "/contact":
      return renderContact();
    default:
      return renderNotFound();
  }
};

const renderApp = () => {
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  if (state.loading) {
    appRoot.innerHTML = renderLoading();
    return;
  }

  const route = resolveRoute(window.location.pathname);

  const requiresAuth = ["/projects", "/projects/:id", "/chat", "/admin"].includes(route.path);
  if (requiresAuth && !state.user) {
    navigate("/login");
    return;
  }

  if (route.path === "/admin" && state.user?.role !== "admin") {
    navigate("/projects");
    return;
  }

  if (["/login", "/register", "/reset-password"].includes(route.path) && state.user) {
    navigate("/projects");
    return;
  }

  const content = renderPage(route);
  appRoot.innerHTML = renderLayout(content);
  setupPage(route.path, route.params);
};

const initAuth = async () => {
  state.apiUrl = getApiUrl();
  state.token = getStoredToken();

  if (!state.token) {
    state.loading = false;
    renderApp();
    return;
  }

  try {
    const { response, data } = await apiRequest("/api/auth/me");
    if (!response.ok) {
      throw new Error("Unauthorized");
    }
    state.user = data;
  } catch (error) {
    state.user = null;
    state.token = null;
    setStoredToken(null);
  } finally {
    state.loading = false;
    renderApp();
  }
};

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-link]");
  if (link) {
    event.preventDefault();
    navigate(link.getAttribute("href"));
    return;
  }

  const logoutButton = event.target.closest("[data-action='logout']");
  if (logoutButton) {
    state.user = null;
    state.token = null;
    setStoredToken(null);
    navigate("/");
  }
});

window.addEventListener("popstate", renderApp);

marked.setOptions({
  breaks: true,
  gfm: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

initAuth();
