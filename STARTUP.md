# Инструкция по запуску MyCardSite

## Требования

- Python 3.10+
- Node.js (для serve) или Python (для http.server)

## Запуск

### 1. Бэкенд

Откройте терминал и выполните:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn server:app --reload --port 8000
```

Бэкенд будет доступен на http://localhost:8000

### 2. Фронтенд

Откройте **второй** терминал в корне проекта и выполните один из вариантов:

**Вариант A — через serve (рекомендуется):**
```bash
npx serve . -p 3000
```

**Вариант B — через Python:**
```bash
python -m http.server 3000
```

**Вариант C — через Live Server в VS Code:**
- Установите расширение "Live Server"
- Откройте `index.html`
- Нажмите "Go Live"

### 3. Открыть приложение

Перейдите в браузере на http://localhost:3000

## Структура проекта

```
MyCardSite/
├── index.html          # Точка входа (SPA)
├── assets/
│   ├── css/app.css     # Стили
│   ├── images/         # Изображения
│   └── js/
│       ├── app.js      # Главный модуль
│       ├── api.js      # HTTP клиент
│       ├── auth.js     # Аутентификация
│       ├── router.js   # SPA роутер
│       ├── utils.js    # Утилиты
│       ├── components/ # Компоненты (navbar, modal)
│       └── pages/      # Страницы (10 шт.)
└── backend/            # FastAPI сервер
```

## Возможные проблемы

### CORS ошибки
Убедитесь, что бэкенд запущен на порту 8000 и в нём настроен CORS для localhost:3000.

### Модули не загружаются
Файлы должны открываться через HTTP-сервер, а не напрямую через `file://`. Используйте serve или http.server.

### Порт занят
Измените порт: `npx serve . -p 3001` или `python -m http.server 3001`
