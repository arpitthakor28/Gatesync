import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wrench,
  Star,
  Phone,
  Clock,
  CheckCircle,
  IndianRupee,
  Search,
  X,
  Calendar
} from 'lucide-react';

export const HomeServicesView = () => {
  const { data, currentUser } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookingService, setBookingService] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const categories = ['All', 'Electrical Work', 'Plumbing', 'Carpentry & Woodwork', 'Appliance Repair', 'Pest Control', 'House Cleaning'];

  const filteredServices = data.home_services.filter(s => {
    if (selectedCategory === 'All') return true;
    return s.category === selectedCategory;
  });

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingService(null);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Wrench style={{ color: 'var(--primary)' }} /> Verified GateSync Home Services
          </h2>
          <p className="section-subtitle">
            Trusted on-demand plumbers, electricians, carpenters & cleaning specialists for residents
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="glass-card" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '14px 24px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredServices.map(service => (
          <div key={service.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-info">{service.category}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem' }}>
                  <Star size={14} fill="#f59e0b" /> {service.rating}
                </div>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
                {service.name}
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Contact Person: <strong>{service.person}</strong> ({service.experience})
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Cost:</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success)' }}>{service.rate}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a href={`tel:${service.phone}`} className="btn btn-secondary btn-sm" style={{ flex: 1, textDecoration: 'none' }}>
                <Phone size={14} /> Call Technician
              </a>
              <button onClick={() => setBookingService(service)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                Book Service
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Book Technician Service */}
      {bookingService && (
        <div className="modal-overlay" onClick={() => setBookingService(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={20} style={{ color: 'var(--primary)' }} /> Request Technician Visit
              </h3>
              <button className="modal-close" onClick={() => setBookingService(null)}><X size={20} /></button>
            </div>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <CheckCircle size={48} style={{ color: 'var(--success)', margin: '0 auto 16px auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Service Request Confirmed!</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {bookingService.person} will contact flat {currentUser?.flat || 'A-101'} shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selected Service:</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{bookingService.name} ({bookingService.category})</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 700, marginTop: '4px' }}>Rate: {bookingService.rate}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Resident Flat Unit</label>
                  <input
                    type="text"
                    value={currentUser?.flat || 'A-101'}
                    disabled
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Date & Time Slot</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    defaultValue={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Describe Issue / Work Required</label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Water leak under kitchen sink / Light switch replacement"
                    className="form-textarea"
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                  Confirm Booking Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
