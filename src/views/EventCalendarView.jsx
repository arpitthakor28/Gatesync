import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Plus,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';

export const EventCalendarView = () => {
  const { data, userRole, rsvpEvent, addEvent } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '05:00 PM',
    location: 'GateSync Society Clubhouse',
    category: 'Cultural',
    description: ''
  });

  const eventImages = {
    1: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    2: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
    3: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
    4: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.description) return;
    addEvent(newEvent);
    setNewEvent({ title: '', date: new Date().toISOString().split('T')[0], time: '05:00 PM', location: 'GateSync Society Clubhouse', category: 'Cultural', description: '' });
    setShowAddModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Calendar style={{ color: 'var(--color-success)' }} /> GateSync Event Hub & Calendar
          </h2>
          <p className="section-subtitle">
            Upcoming festival galas, AGM assemblies, health checkup camps & cleanliness drives
          </p>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={18} /> Schedule New Event
          </button>
        )}
      </div>

      {/* Events Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {data.events.map(ev => (
          <div key={ev.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
            
            {/* Event Cover Image */}
            <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
              <img
                src={eventImages[ev.id] || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80'}
                alt={ev.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                <span className="badge badge-success">{ev.category}</span>
              </div>
              <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                <span className="badge badge-primary">{ev.date}</span>
              </div>
            </div>

            {/* Event Content */}
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
                  {ev.title}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} style={{ color: 'var(--color-warning)' }} /> {ev.time}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} style={{ color: 'var(--color-danger)' }} /> {ev.location}
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                  {ev.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: '14px', borderTop: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  <Users size={16} /> {ev.rsvp_count} Attending
                </div>
                <button
                  onClick={() => rsvpEvent(ev.id)}
                  disabled={ev.rsvped}
                  className={`btn btn-sm ${ev.rsvped ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {ev.rsvped ? '✓ RSVP Confirmed' : 'Confirm RSVP'}
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* MODAL: Create New Event */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} style={{ color: 'var(--color-primary)' }} /> Schedule GateSync Event
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Festival Gala / AGM Meeting"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 06:00 PM"
                    value={newEvent.time}
                    onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Event Location</label>
                <input
                  type="text"
                  placeholder="e.g. Society Central Lawn"
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Event Description</label>
                <textarea
                  rows="3"
                  placeholder="Details for residents..."
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="form-textarea"
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary">
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
