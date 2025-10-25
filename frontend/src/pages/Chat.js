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

    // Create WebSocket connection
    const wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    const websocket = new WebSocket(`${wsUrl}/api/ws/chat?token=${token}`);

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
          ...prev,
          {
            id: Date.now(),
            system: true,
            message: `${data.username} joined the chat`,
          },
        ]);
      } else if (data.type === 'user_left') {
        setMessages((prev) => [
          ...prev,
          {
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
    };
  }, [token, API_URL]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !ws || !connected) return;

    ws.send(JSON.stringify({ message: inputMessage }));
    setInputMessage('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Chat</h1>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-sm text-github-textSecondary">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto border border-github-border dark:bg-github-hover rounded-lg p-4 mb-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.system ? (
                <div className="text-center text-sm text-github-textSecondary italic">
                  {msg.message}
                </div>
              ) : (
                <div
                  className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
                      msg.user_id === user?.id
                        ? 'bg-github-blue text-white'
                        : 'bg-github-dark border border-github-border'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-semibold">
                        {msg.username}
                        {msg.user_id === user?.id && ' (You)'}
                      </span>
                      <span className="text-xs opacity-75">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={connected ? 'Type a message...' : 'Connecting...'}
            disabled={!connected}
            className="flex-1 px-4 py-2 border border-github-border bg-github-hover rounded-md focus:outline-none focus:ring-github-blue focus:border-github-blue disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!connected || !inputMessage.trim()}
            className="px-6 py-2 bg-github-blue text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
