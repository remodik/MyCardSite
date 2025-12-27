// Utilities

// Russian plural rules
const pluralRules = new Intl.PluralRules('ru');

const timeForms = {
    год: ['год', 'года', 'лет'],
    месяц: ['месяц', 'месяца', 'месяцев'],
    неделя: ['неделя', 'недели', 'недель'],
    день: ['день', 'дня', 'дней'],
    час: ['час', 'часа', 'часов'],
    минута: ['минута', 'минуты', 'минут'],
};

// Format relative time in Russian
export function formatRelativeTime(seconds) {
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
}

// Format date in Russian locale
export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ru-RU');
}

// Format date with time
export function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('ru-RU');
}

// Format time only
export function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Safe localStorage access
export function safeStorage() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage;
        }
    } catch (error) {
        return null;
    }
    return null;
}

// Escape HTML to prevent XSS
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Language map for syntax highlighting
export const languageMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    txt: 'text',
    md: 'markdown'
};

// Get language for Prism from file extension
export function getLanguage(fileType) {
    return languageMap[fileType?.toLowerCase()] || 'text';
}

// Render Markdown with Prism highlighting
export function renderMarkdown(content) {
    if (typeof marked === 'undefined') {
        console.warn('marked.js not loaded');
        return escapeHtml(content);
    }

    // Configure marked
    marked.setOptions({
        gfm: true,
        breaks: true,
        highlight: function(code, lang) {
            if (typeof Prism !== 'undefined' && lang && Prism.languages[lang]) {
                try {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                } catch (e) {
                    console.error('Prism highlight error:', e);
                }
            }
            return escapeHtml(code);
        }
    });

    return marked.parse(content);
}

// Check if file is binary
export function isBinaryFile(fileType) {
    const binaryTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'mp4', 'avi', 'mov', 'webm'];
    return binaryTypes.includes(fileType?.toLowerCase());
}

// Check if file is image
export function isImageFile(fileType) {
    const imageTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'];
    return imageTypes.includes(fileType?.toLowerCase());
}

// Check if file is video
export function isVideoFile(fileType) {
    const videoTypes = ['mp4', 'avi', 'mov', 'webm'];
    return videoTypes.includes(fileType?.toLowerCase());
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
