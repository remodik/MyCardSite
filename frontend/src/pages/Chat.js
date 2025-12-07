import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user, token, API_URL } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!token) return;

    let websocketBase;
    try {
      const parsedUrl = new URL(API_URL);
      const wsProtocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      const cleanedPath = parsedUrl.pathname.replace(/\/$/, '');
      websocketBase = `${wsProtocol}//${parsedUrl.host}${cleanedPath}`;
    } catch (error) {
      websocketBase = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    }

    const websocket = new WebSocket(`${websocketBase}/api/ws/chat?token=${token}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);

      if (data.type === 'history') {
        setMessages(data.messages);
      } else if (data.type === 'message') {
        setMessages((prev) => [...prev, data.data]);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [token, API_URL]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !ws || !connected) return;

    ws.send(JSON.stringify({ message: inputMessage }));
    setInputMessage('');
  };

  return (
    <div className="page-shell">
      <div className="w-full max-w-5xl animate-fade-in">
        <div className="surface-card p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#7289DA] font-semibold mb-2">Коммуникация</p>
              <h1 className="text-4xl font-bold text-white">Командный чат</h1>
              <p className="text-[#b9bbbe] mt-2">Общайтесь с командой в реальном времени</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-[#40444b]">
              <span className={`h-3 w-3 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-sm text-white font-semibold">
                {connected ? 'Онлайн' : 'Нет подключения'}
              </span>
            </div>
          </div>

          <div className="surface-section p-5 h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-5">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <i className="fas fa-comments text-5xl text-[#7289DA] mb-3"></i>
                    <p className="text-[#b9bbbe]">Пока нет сообщений — начните разговор!</p>
                  </div>
                </div>
              )}
              {messages.map((msg, index) => (
                <div key={msg.id || `${msg.timestamp}-${index}`}>
                  {msg.system ? (
                    <div className="text-center py-2">
                      <span className="text-xs uppercase tracking-widest text-[#7289DA] bg-[#40444b] px-3 py-1 rounded-full">
                        {msg.message}
                      </span>
                    </div>
                  ) : (
                    <div className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-md rounded-2xl px-5 py-3 shadow-lg ${
                          msg.user_id === user?.id
                            ? 'bg-gradient-to-br from-[#5865F2] to-[#7289DA] text-white'
                            : 'bg-[#40444b] text-white border border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold mb-1 opacity-80">
                          <i className="fas fa-user-circle"></i>
                          <span>
                            {msg.username}
                            {msg.user_id === user?.id && ' (Вы)'}
                          </span>
                          {msg.timestamp && (
                            <span className="opacity-60">
                              {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={connected ? 'Введите сообщение…' : 'Подключение к чату...'}
                disabled={!connected}
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={!connected || !inputMessage.trim()}
                className="primary-button px-6"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Отправить
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
