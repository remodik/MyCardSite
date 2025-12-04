import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Services() {
  const { API_URL, isAdmin, token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    estimated_time: '',
    payment_methods: '',
    frameworks: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/services`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setServices(response.data);
    } catch (err) {
      setError('Не удалось загрузить услуги');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await axios.put(`${API_URL}/api/services/${editingService.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/services`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowCreateModal(false);
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        estimated_time: '',
        payment_methods: '',
        frameworks: '',
      });
      await fetchServices();
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось сохранить услугу');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      estimated_time: service.estimated_time,
      payment_methods: service.payment_methods,
      frameworks: service.frameworks,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту услугу?')) return;
    try {
      await axios.delete(`${API_URL}/api/services/${serviceId}`);
      await fetchServices();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete service');
    }
  };

  const parseFrameworks = (frameworks) => {
    try {
      return frameworks.split(',').map((f) => f.trim()).filter(Boolean);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="w-full max-w-6xl space-y-6">
        <div className="surface-card p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Профессиональные услуги</p>
            <h1 className="text-3xl font-bold text-white">Мои услуги</h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingService(null);
                setFormData({
                  name: '',
                  description: '',
                  price: '',
                  estimated_time: '',
                  payment_methods: '',
                  frameworks: '',
                });
                setShowCreateModal(true);
              }}
              className="primary-button"
            >
              Добавить услугу
            </button>
          )}
        </div>

        {error && (
          <div className="surface-section p-4 text-red-200 border border-red-400/40 bg-red-500/10 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {services.map((service) => {
            const isExpanded = expandedId === service.id;
            const frameworks = parseFrameworks(service.frameworks);

            return (
              <div key={service.id} className="surface-card overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : service.id)}
                  className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{service.name}</h3>
                      <p className="text-slate-300 text-sm line-clamp-2">{service.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#7289DA] font-bold text-lg">{service.price}</span>
                      <i
                        className={`fas fa-chevron-down text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      ></i>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 space-y-4 animate-fade-in">
                    <div className="border-t border-white/10 pt-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-400 mb-1">Описание</h4>
                        <p className="text-slate-200 whitespace-pre-wrap">{service.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-400 mb-1">
                            <i className="fas fa-dollar-sign mr-2"></i>Стоимость
                          </h4>
                          <p className="text-white font-semibold">{service.price}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-slate-400 mb-1">
                            <i className="fas fa-clock mr-2"></i>Время выполнения
                          </h4>
                          <p className="text-white">{service.estimated_time}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-400 mb-1">
                          <i className="fas fa-credit-card mr-2"></i>Методы оплаты
                        </h4>
                        <p className="text-slate-200">{service.payment_methods}</p>
                      </div>

                      {frameworks.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-400 mb-2">
                            <i className="fas fa-code mr-2"></i>Технологии
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {frameworks.map((framework, idx) => (
                              <span key={idx} className="pill-tag">
                                {framework}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="flex gap-3 pt-3 border-t border-white/10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(service);
                            }}
                            className="muted-button px-4"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(service.id);
                            }}
                            className="text-red-300 hover:text-red-100 font-semibold px-4"
                          >
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {services.length === 0 && (
          <div className="surface-section p-6 text-center text-slate-300">
            Услуги пока не добавлены.
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="surface-card p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white">
                {editingService ? 'Редактировать услугу' : 'Создать новую услугу'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm text-slate-200">Название услуги</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-slate-200">Описание</label>
                  <textarea
                    rows="4"
                    required
                    className="input-field"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm text-slate-200">Стоимость</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="например: 5000 руб."
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm text-slate-200">Время выполнения</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="например: 3-5 дней"
                      value={formData.estimated_time}
                      onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-slate-200">Методы оплаты</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="например: Карта, PayPal, Криптовалюта"
                    value={formData.payment_methods}
                    onChange={(e) => setFormData({ ...formData, payment_methods: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-slate-200">
                    Технологии/Фреймворки (через запятую)
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="например: React, FastAPI, PostgreSQL"
                    value={formData.frameworks}
                    onChange={(e) => setFormData({ ...formData, frameworks: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingService(null);
                    }}
                    className="muted-button px-4"
                  >
                    Отмена
                  </button>
                  <button type="submit" className="primary-button px-4">
                    {editingService ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
