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
        } else if (data.type === 'user_joined') {
            setMessages((prev) => [
                ...prev, {
                id: Date.now(),
                    system: true,
                    message: `${data.username} joined the chat`,
                },
            ]);
        } else if (data.type === 'user_left') {
            setMessages((prev) => [
                ...prev, {
                id: Date.now(),
                    system: true,
                    message: `${data.username} left the chat`,
                },
            ]);
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
    };}, [token, API_URL]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !ws || !connected) return;

        ws.send(JSON.stringify({ message: inputMessage }));
        setInputMessage('');
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col h-[calc(100vh-220px)] rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Коммуникация</p>
                        <h1 className="text-3xl font-bold text-white">Командный чат</h1>
                    </div>
                    <div className="flex items-center space-x-3 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80">
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-500'}`}/>
                        <span>{connected ? 'Онлайн' : 'Нет подключения'}</span>
                    </div>
                </div>
            <div className="flex-1 overflow-y-auto rounded-2xl border border-white/5 bg-slate-900/70 p-4 shadow-inner space-y-4">
                {messages.length === 0 && (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Пока нет сообщений — начните разговор!
                    </div>
                )}
            {messages.map((msg, index) => (
                <div key={msg.id || `${msg.timestamp}-${index}`}>
                    {msg.system ? (
                        <div className="text-center text-xs uppercase tracking-widest text-white/60">
                            {msg.message}
                        </div>
                    ) : (
                        <div className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div
                        className={`max-w-md rounded-2xl px-4 py-3 shadow-lg ${
                            msg.user_id === user?.id
                                ? 'bg-gradient-to-br from-indigo-500 to-blue-500 text-white'
                                : 'bg-white/5 text-white border border-white/10 backdrop-blur'
                        }`}>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/80">
                        <span>
                            {msg.username}
                            {msg.user_id === user?.id && ' (Вы)'}
                        </span>
                        <span className="text-white/60">
                            {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                        <p className="mt-1 text-sm leading-relaxed text-white">{msg.message}</p>
                    </div>
                </div>
              )}
            </div>
          ))}
            <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={connected ? 'Введите сообщение…' : 'Подключение к чату...'}
                disabled={!connected}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white placeholder-white/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
                type="submit"
                disabled={!connected || !inputMessage.trim()}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                Отправить
            </button>
        </form>
            </div>
        </div>
  );
}
