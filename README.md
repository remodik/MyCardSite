# Projects Management Application

Full-stack приложение для управления проектами и файлами с аутентификацией, чатом в реальном времени и админ панелью.

## Технологии

**Backend:**
- FastAPI (Python)
- MongoDB (База данных)
- WebSocket (Чат в реальном времени)
- SendGrid (Отправка email)
- JWT (Аутентификация)

**Frontend:**
- React 18
- React Router v6
- Tailwind CSS (GitHub-стиль дизайн)
- React Markdown (Рендеринг Markdown)
- React Syntax Highlighter (Подсветка синтаксиса кода)
- Axios (HTTP клиент)
- WebSocket (Чат клиент)

## Функционал

### Аутентификация
- ✅ Регистрация по username/email/password
- ✅ Вход по username/password
- ✅ Сброс пароля через email (SendGrid)
- ✅ Запрос на сброс пароля через админа (если email не привязан)

### Управление проектами
- ✅ Просмотр всех проектов (для всех пользователей)
- ✅ Создание/редактирование/удаление проектов (только админы)
- ✅ Создание файлов вручную или загрузка
- ✅ Редактирование файлов (только админы)
- ✅ Поддержка различных типов файлов:
  - Код (.js, .jsx, .ts, .tsx, .py, .java, .cpp, .go, .rs и др.)
  - Конфигурации (.json, .yaml, .xml, .gitignore и др.)
  - Markdown (.md) с полным рендерингом
  - Изображения (.png, .jpg, .gif, .webp)
  - Видео (.mp4, .avi, .mov, .webm)
- ✅ Подсветка синтаксиса для кода

### Чат
- ✅ WebSocket чат в реальном времени
- ✅ Доступен всем авторизованным пользователям
- ✅ История сообщений
- ✅ Уведомления о входе/выходе пользователей

### Админ панель
- ✅ Управление пользователями
- ✅ Изменение ролей (user/admin)
- ✅ Сброс паролей вручную до "qwerty123"
- ✅ Просмотр запросов на сброс паролей

### UI/UX
- ✅ Темная/светлая тема (GitHub-стиль)
- ✅ Адаптивный дизайн
- ✅ Интуитивная навигация

## Установка и запуск

### Предустановленные пользователи

**Администратор:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@example.com`

**Тестовый пользователь:**
- Username: `testuser`
- Password: `test123`
- Email: `testuser@example.com`

### Переменные окружения

**Backend (.env):**
```
MONGO_URL=mongodb://localhost:27017/projectsdb
SECRET_KEY=your-secret-key-change-this-in-production-12345678
SENDGRID_API_KEY=<ваш_sendgrid_api_key>
FROM_EMAIL=<ваш_email>
```

**Frontend (.env):**
```
REACT_APP_BACKEND_URL=<backend_url>
```

### Запуск через Supervisor

Все сервисы управляются через supervisor:

```bash
# Перезапуск всех сервисов
sudo supervisorctl restart all

# Перезапуск отдельных сервисов
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart mongodb

# Проверка статуса
sudo supervisorctl status
```

### Создание тестовых данных

```bash
# Создать админа
cd /app/backend && python create_admin.py

# Создать тестового пользователя
cd /app/backend && python create_test_user.py

# Создать демо проект с файлами
cd /app/backend && python create_demo_data.py
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Получить текущего пользователя
- `POST /api/auth/password-reset-request` - Запрос на сброс пароля
- `POST /api/auth/password-reset` - Сброс пароля по коду

### Проекты
- `GET /api/projects` - Список всех проектов
- `GET /api/projects/{id}` - Детали проекта с файлами
- `POST /api/projects` - Создать проект (admin)
- `PUT /api/projects/{id}` - Обновить проект (admin)
- `DELETE /api/projects/{id}` - Удалить проект (admin)

### Файлы
- `POST /api/files` - Создать файл вручную (admin)
- `POST /api/files/upload` - Загрузить файл (admin)
- `GET /api/files/{id}` - Получить файл
- `PUT /api/files/{id}` - Обновить файл (admin)
- `DELETE /api/files/{id}` - Удалить файл (admin)

### Админ панель
- `GET /api/admin/users` - Список всех пользователей (admin)
- `GET /api/admin/reset-requests` - Запросы на сброс паролей (admin)
- `POST /api/admin/reset-password/{user_id}` - Сбросить пароль пользователя (admin)
- `PUT /api/admin/users/{user_id}/role` - Изменить роль пользователя (admin)

### WebSocket
- `WS /api/ws/chat?token={jwt_token}` - WebSocket подключение к чату

## Структура проекта

```
/app/
├── backend/
│   ├── server.py                 # Основной backend код
│   ├── requirements.txt          # Python зависимости
│   ├── .env                      # Переменные окружения
│   ├── create_admin.py          # Скрипт создания админа
│   ├── create_test_user.py      # Скрипт создания тестового пользователя
│   └── create_demo_data.py      # Скрипт создания демо данных
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── index.js
    │   ├── App.js
    │   ├── App.css
    │   ├── index.css
    │   ├── context/
    │   │   └── AuthContext.js   # Контекст аутентификации
    │   ├── components/
    │   │   └── Navbar.js        # Навигационная панель
    │   └── pages/
    │       ├── Login.js         # Страница входа
    │       ├── Register.js      # Страница регистрации
    │       ├── PasswordReset.js # Страница сброса пароля
    │       ├── Projects.js      # Список проектов
    │       ├── ProjectDetail.js # Детали проекта
    │       ├── Chat.js          # Чат
    │       └── AdminPanel.js    # Админ панель
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── .env
```

## База данных MongoDB

**Коллекции:**
- `users` - Пользователи (id, username, email, password_hash, role, created_at)
- `projects` - Проекты (id, name, description, created_by, created_at)
- `files` - Файлы (id, project_id, name, content, file_type, is_binary, created_at, updated_at)
- `chat_messages` - Сообщения чата (id, user_id, username, message, timestamp)
- `password_resets` - Коды сброса паролей (id, user_id, code, expires_at, used)
- `admin_reset_requests` - Запросы на сброс паролей админом (id, user_id, username, status, requested_at)

## Разработка

### Backend
```bash
cd /app/backend
source ~/.venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd /app/frontend
yarn install
yarn start
```

## Логи

```bash
# Backend логи
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/backend.out.log

# Frontend логи
tail -f /var/log/supervisor/frontend.err.log
tail -f /var/log/supervisor/frontend.out.log

# MongoDB логи
tail -f /var/log/mongodb.err.log
```

## Возможные улучшения

- [ ] Приватные чаты между пользователями
- [ ] Комментарии к файлам
- [ ] Версионирование файлов
- [ ] Поиск по проектам и файлам
- [ ] Экспорт проектов
- [ ] Уведомления в реальном времени
- [ ] Права доступа к проектам
- [ ] Интеграция с Git

## Лицензия

MIT
