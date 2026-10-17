import React, { useState } from 'react';
import { visitorApi } from '../api/client';
import {
  Zap,
  X,
  Package,
  Bike,
  Car,
  ShoppingBag,
  CheckCircle2
} from 'lucide-react';

const DELIVERY_PROVIDERS = [
  { name: 'Swiggy Food', icon: '🍔', category: 'Food Delivery' },
  { name: 'Zomato Food', icon: '🍕', category: 'Food Delivery' },
  { name: 'Amazon Delivery', icon: '📦', category: 'Parcel Delivery' },
  { name: 'Blinkit Instant', icon: '⚡', category: 'Grocery Delivery' },
  { name: 'Uber / Ola Cab', icon: '🚕', category: 'Cab Pickup/Drop' },
  { name: 'Courier Service', icon: '📬', category: 'Courier Drop' }
];

export const GuardQuickDeliveryModal = ({ isOpen, onClose, flats = [], onQuickEntryDone }) => {
  const [selectedFlat, setSelectedFlat] = useState(flats[0]?.flat || 'A-101');
  const [selectedProvider, setSelectedProvider] = useState(DELIVERY_PROVIDERS[0]);
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen) return null;

  const handleQuickSubmit = async (provider) => {
    setSubmitting(true);
    try {
      const res = await visitorApi.createRequest({
        visitorName: provider.name,
        visitorPhone: deliveryPhone || '9876543210',
        flatNumber: selectedFlat,
        purpose: provider.category,
        photoUrl: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=200&q=80',
        vehicleNumber: 'Two-Wheeler / Delivery'
      });
      setSuccessResult({ provider, flat: selectedFlat, id: res.id });
      if (onQuickEntryDone) onQuickEntryDone(res);
    } catch (err) {
      alert('Quick Entry Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(12, 30, 51, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: 'var(--bg-dark-modal, #ffffff)',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 25px 60px rgba(14, 165, 233, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-success, #10b981)'
            }}>
              <Zap size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main, #0c1e33)' }}>
                1-Tap Delivery & Cab Quick-Entry
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                Gate Desk Instant Fast-Track Check-In
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ minHeight: '38px', minWidth: '38px', borderRadius: '50%', padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {!successResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Flat Selector */}
            <div>
              <label className="form-label">Destination Flat Unit</label>
              <select
                value={selectedFlat}
                onChange={e => setSelectedFlat(e.target.value)}
                className="form-select"
                style={{ minHeight: '44px', fontWeight: 700 }}
              >
                {flats.map((m, idx) => (
                  <option key={idx} value={m.flat || m}>
                    {m.flat || m} — {m.username || 'Resident'}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Grid */}
            <div>
              <label className="form-label">Select 1-Tap Delivery / Service</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {DELIVERY_PROVIDERS.map((prov, idx) => (
                  <button
                    key={idx}
                    disabled={submitting}
                    onClick={() => handleQuickSubmit(prov)}
                    style={{
                      padding: '14px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-glass, rgba(0,0,0,0.08))',
                      backgroundColor: 'var(--bg-dark-input, rgba(240, 249, 255, 0.6))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.6rem' }}>{prov.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main, #0c1e33)' }}>
                        {prov.name}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                        {prov.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--color-success, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main, #0c1e33)' }}>
                {successResult.provider.name} Dispatched!
              </h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>
                Alert sent instantly to Flat <strong>{successResult.flat}</strong> via STOMP & Web Push.
              </p>
            </div>

            <button
              onClick={() => { setSuccessResult(null); onClose(); }}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '44px', borderRadius: '14px', marginTop: '8px' }}
            >
              Done & Return to Desk
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
