import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  Cross,
  GraduationCap,
  ShoppingCart,
  ShieldAlert,
  Train
} from 'lucide-react';

export const NeighborhoodView = () => {
  const { data } = useApp();
  const [selectedCat, setSelectedCat] = useState('All');

  const categories = ['All', 'Medical', 'Education', 'Shopping', 'Transport', 'Safety', 'Recreation'];

  const filteredPlaces = data.neighborhood.filter(p => {
    if (selectedCat === 'All') return true;
    return p.category === selectedCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <MapPin style={{ color: 'var(--danger)' }} /> Neighborhood Essential Utilities & Directory
          </h2>
          <p className="section-subtitle">
            Nearby hospitals, schools, supermarkets, transit stations & police emergency desks
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="glass-card" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '14px 24px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`btn btn-sm ${selectedCat === cat ? 'btn-primary' : 'btn-secondary'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Neighborhood Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredPlaces.map(place => (
          <div key={place.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className={`badge ${
                  place.category === 'Medical' || place.category === 'Safety' ? 'badge-danger' :
                  place.category === 'Transport' ? 'badge-info' : 'badge-success'
                }`}>
                  {place.category}
                </span>
                <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Navigation size={12} /> {place.distance} away
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
                {place.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} /> {place.address}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} style={{ color: 'var(--warning)' }} /> {place.timing}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} style={{ color: 'var(--success)' }} /> {place.phone}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', pt: '12px', borderTop: '1px solid var(--border-color)' }}>
              <a href={`tel:${place.phone}`} className="btn btn-secondary btn-sm" style={{ width: '100%', textDecoration: 'none' }}>
                <Phone size={14} /> Call Location Hotline
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
