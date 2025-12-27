const birthdayTimestamp = 1759870800;

function updateBirthdayCountdown() {
    const el = document.getElementById('birthday-countdown');
    if (!el) return;

    const now = Math.floor(Date.now() / 1000);
    const diff = birthdayTimestamp - now;

    const relativeTime = formatRelativeTime(diff);
    const fullDate = new Date(birthdayTimestamp * 1000).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    el.innerHTML = `
        <span style="color: #7289DA; font-weight: bold;">${relativeTime}</span>
        (${fullDate})
    `;
}

function formatRelativeTime(seconds) {
    if (seconds <= 0) return "сегодня! 🎉";

    const intervals = {
        год: 31536000,
        месяц: 2592000,
        неделю: 604800,
        день: 86400,
        час: 3600,
        минуту: 60
    };

    for (const [unit, secs] of Object.entries(intervals)) {
        const count = Math.floor(seconds / secs);
        if (count >= 1) {
            return `через ${count} ${unit}${count > 1 ? (unit === 'месяц' ? 'а' : (unit === 'год' ? 'а' : 'ов')) : ''}`;
        }
    }

    return "скоро!";
}

window.addEventListener("DOMContentLoaded", () => {
    updateBirthdayCountdown();
    setInterval(updateBirthdayCountdown, 60000);
    getUserIP();
});

async function getUserIP() {
    try {
        const response = await fetch('/getip.php');
        const data = await response.json();

        document.getElementById('viewsCount').textContent = data.unique_visits;

        return data.ip;
    } catch (error) {
        return null;
    }
}

document.querySelectorAll('.category-header').forEach(header => {
    header.addEventListener('click', (e) => {
        if (!e.target.closest('.category-action-btn')) {
            const list = header.nextElementSibling;
            list.style.display = list.style.display === 'none' ? 'block' : 'none';
            const icon = header.querySelector('.fa-chevron-down, .fa-chevron-right');
            if (icon) {
                if (list.style.display === 'none') {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                } else {
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                }
            }
        }
    });
});