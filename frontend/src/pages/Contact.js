import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Contact() {
  const { API_URL } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/contact`, formData);
      console.log('Contact form response:', response);
      if (response.data && response.data.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        setError('Неожиданный ответ от сервера');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      setError(err.response?.data?.detail || 'Не удалось отправить сообщение. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="w-full max-w-3xl space-y-6">
        <div className="surface-card p-8 animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">Свяжитесь со мной</h1>
            <p className="text-slate-300">
              Есть вопросы или хотите обсудить проект? Заполните форму ниже, и я свяжусь с вами в ближайшее время.
            </p>
          </div>

          {success && (
            <div className="surface-section p-4 text-green-200 border border-green-400/40 bg-green-500/10 rounded-xl mb-6">
              <i className="fas fa-check-circle mr-2"></i>
              Сообщение успешно отправлено! Я свяжусь с вами в ближайшее время.
            </div>
          )}

          {error && (
            <div className="surface-section p-4 text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl mb-6">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-200">
                  Ваше имя <span className="text-red-400">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Иван Иванов"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input-field"
                  placeholder="ivan@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-200">
                Телефон <span className="text-slate-400 text-xs">(необязательно)</span>
              </label>
              <input
                id="phone"
                type="tel"
                className="input-field"
                placeholder="+7 (900) 123-45-67"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="block text-sm font-medium text-slate-200">
                Тема <span className="text-red-400">*</span>
              </label>
              <input
                id="subject"
                type="text"
                required
                className="input-field"
                placeholder="Разработка веб-приложения"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-medium text-slate-200">
                Сообщение <span className="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                rows="6"
                required
                className="input-field"
                placeholder="Расскажите о вашем проекте или задайте вопрос..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} className="primary-button w-full text-center">
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Отправка...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Отправить сообщение
                </>
              )}
            </button>
          </form>
        </div>

        <div className="surface-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Другие способы связи</h2>
          <div className="space-y-3 text-slate-200">
            <div className="flex items-center gap-3">
              <i className="fas fa-envelope text-[#7289DA] w-5"></i>
              <a href="mailto:slenderzet@gmail.com" className="hover:text-white transition-colors">
                slenderzet@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              <i className="fab fa-telegram text-[#7289DA] w-5"></i>
              <a
                href="https://t.me/remod3"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                @remod3
              </a>
            </div>
            <div className="flex items-center gap-3">
              <i className="fab fa-vk text-[#7289DA] w-5"></i>
              <a
                href="https://vk.com/remod3"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                vk.com/remod3
              </a>
            </div>
            <div className="flex items-center gap-3">
              <i className="fab fa-discord text-[#7289DA] w-5"></i>
              <a
                href="https://discord.com/users/743864658951274528"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Discord профиль
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
