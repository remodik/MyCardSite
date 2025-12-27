// Chat Page with WebSocket
import { auth } from '../auth.js';
import { API_URL } from '../api.js';
import { formatTime, escapeHtml } from '../utils.js';

let ws = null;
let messages = [];
let connected = false;

// Scroll to bottom
function scrollToBottom() {
    const container = document.getElementById('messages-container');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

// Render a message
function renderMessage(msg) {
    const state = auth.getState();
    const isOwn = msg.user_id === state.user?.id;

    if (msg.system) {
        return `
            <div class="text-center py-2">
                <span class="text-xs uppercase tracking-widest text-[#7289DA] bg-[#40444b] px-3 py-1 rounded-full">
                    ${escapeHtml(msg.message)}
                </span>
            </div>
        `;
    }

    const timestamp = msg.timestamp ? formatTime(msg.timestamp) : '';

    return `
        <div class="flex ${isOwn ? 'justify-end' : 'justify-start'}">
            <div class="max-w-md rounded-2xl px-5 py-3 shadow-lg ${
                isOwn
                    ? 'bg-gradient-to-br from-[#5865F2] to-[#7289DA] text-white'
                    : 'bg-[#40444b] text-white border border-white/10'
            }">
                <div class="flex items-center gap-2 text-xs font-semibold mb-1 opacity-80">
                    <i class="fas fa-user-circle"></i>
                    <span>${escapeHtml(msg.username)}${isOwn ? ' (Вы)' : ''}</span>
                    ${timestamp ? `<span class="opacity-60">${timestamp}</span>` : ''}
                </div>
                <p class="text-sm leading-relaxed">${escapeHtml(msg.message)}</p>
            </div>
        </div>
    `;
}

// Update messages list
function updateMessages() {
    const container = document.getElementById('messages-container');
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="flex h-full items-center justify-center text-center">
                <div>
                    <i class="fas fa-comments text-5xl text-[#7289DA] mb-3"></i>
                    <p class="text-[#b9bbbe]">Пока нет сообщений — начните разговор!</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(renderMessage).join('');
    scrollToBottom();
}

// Update connection status
function updateConnectionStatus() {
    const statusDot = document.getElementById('connection-status-dot');
    const statusText = document.getElementById('connection-status-text');
    const sendBtn = document.getElementById('send-btn');
    const input = document.getElementById('message-input');

    if (statusDot) {
        statusDot.className = `h-3 w-3 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`;
    }
    if (statusText) {
        statusText.textContent = connected ? 'Онлайн' : 'Нет подключения';
    }
    if (sendBtn) {
        sendBtn.disabled = !connected;
    }
    if (input) {
        input.disabled = !connected;
        input.placeholder = connected ? 'Введите сообщение…' : 'Подключение к чату...';
    }
}

// Connect to WebSocket
function connectWebSocket() {
    const state = auth.getState();
    if (!state.token) return;

    let wsUrl;
    try {
        const parsedUrl = new URL(API_URL);
        const wsProtocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        const cleanedPath = parsedUrl.pathname.replace(/\/$/, '');
        wsUrl = `${wsProtocol}//${parsedUrl.host}${cleanedPath}`;
    } catch (error) {
        wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    }

    ws = new WebSocket(`${wsUrl}/api/ws/chat?token=${state.token}`);

    ws.onopen = () => {
        console.log('WebSocket connected');
        connected = true;
        updateConnectionStatus();
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            if (data.type === 'history') {
                messages = data.messages || [];
            } else if (data.type === 'message') {
                messages.push(data.data);
            }

            updateMessages();
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        connected = false;
        updateConnectionStatus();
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        connected = false;
        updateConnectionStatus();
    };
}

// Send a message
function sendMessage(message) {
    if (!message.trim() || !ws || !connected) return;

    ws.send(JSON.stringify({ message }));

    const input = document.getElementById('message-input');
    if (input) input.value = '';
}

// Render chat page
export function render() {
    return `
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
                            <span id="connection-status-dot" class="h-3 w-3 rounded-full bg-rose-500"></span>
                            <span id="connection-status-text" class="text-sm text-white font-semibold">Подключение...</span>
                        </div>
                    </div>

                    <div class="surface-section p-5 h-[500px] flex flex-col">
                        <div id="messages-container" class="flex-1 overflow-y-auto space-y-4 mb-5">
                            <!-- Messages will be rendered here -->
                        </div>

                        <form id="message-form" class="flex gap-3">
                            <input type="text" id="message-input" class="input-field flex-1" placeholder="Подключение к чату..." disabled />
                            <button type="submit" id="send-btn" class="primary-button px-6" disabled>
                                <i class="fas fa-paper-plane mr-2"></i>
                                Отправить
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Mount chat page
export function mount() {
    connectWebSocket();
    updateMessages();

    document.getElementById('message-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('message-input');
        if (input) {
            sendMessage(input.value);
        }
    });
}

// Unmount chat page
export function unmount() {
    if (ws) {
        ws.close();
        ws = null;
    }
    messages = [];
    connected = false;
}
