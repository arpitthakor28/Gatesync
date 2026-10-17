import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Package,
  Megaphone,
  Clock,
  Filter
} from 'lucide-react';

export const NotificationCenterModal = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const { setActiveTab } = useApp();
  const [filterType, setFilterType] = useState('ALL');

  if (!isOpen) return null;

  const filtered = notifications.filter(n => {
    if (filterType === 'ALL') return true;
    if (filterType === 'VISITOR') return n.type === 'VISITOR_REQUEST' || n.type === 'VISITOR_APPROVED' || n.type === 'VISITOR_REJECTED';
    if (filterType === 'SOS') return n.type === 'SOS_ALERT';
    if (filterType === 'DELIVERY') return n.type === 'DELIVERY_AT_GATE' || n.type === 'PREAPPROVED_ARRIVED';
    if (filterType === 'NOTICE') return n.type === 'ADMIN_NOTICE';
    return true;
  });

  const getIconForType = (type) => {
    switch (type) {
      case 'SOS_ALERT':
        return <AlertTriangle size={18} style={{ color: 'var(--color-danger, #ef4444)' }} />;
      case 'DELIVERY_AT_GATE':
      case 'PREAPPROVED_ARRIVED':
        return <Package size={18} style={{ color: 'var(--color-warning, #f59e0b)' }} />;
      case 'ADMIN_NOTICE':
        return <Megaphone size={18} style={{ color: 'var(--color-primary, #0284c7)' }} />;
      default:
        return <UserCheck size={18} style={{ color: 'var(--color-success, #10b981)' }} />;
    }
  };

  const handleNotificationClick = (notif) => {
    if (notif.type?.includes('VISITOR') || notif.type?.includes('DELIVERY') || notif.type?.includes('PREAPPROVED')) {
      setActiveTab('registry');
      onClose();
    } else if (notif.type === 'ADMIN_NOTICE') {
      setActiveTab('announcements');
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(12, 30, 51, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      padding: '16px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '85vh',
        backgroundColor: 'var(--bg-dark-modal, #ffffff)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(14, 165, 233, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-glass, rgba(0,0,0,0.06))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(14, 165, 233, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary, #0284c7)'
            }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #0c1e33)' }}>
                Activity Stream & Notifications
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                Real-time security gates, visitors, deliveries, and society alerts
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn btn-sm"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-primary, #0284c7)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ minHeight: '40px', minWidth: '40px', borderRadius: '50%', padding: 0 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-glass, rgba(0,0,0,0.06))',
          overflowX: 'auto'
        }}>
          {['ALL', 'VISITOR', 'SOS', 'DELIVERY', 'NOTICE'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              style={{
                minHeight: '34px',
                padding: '0 12px',
                borderRadius: '17px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: filterType === tab ? 'var(--color-primary, #0284c7)' : 'var(--bg-dark-input, rgba(0,0,0,0.04))',
                color: filterType === tab ? '#ffffff' : 'var(--text-muted, #64748b)',
                touchAction: 'manipulation'
              }}
            >
              {tab === 'ALL' ? 'All' : tab === 'VISITOR' ? 'Visitors' : tab === 'SOS' ? 'SOS' : tab === 'DELIVERY' ? 'Deliveries' : 'Notices'}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted, #64748b)' }}>
              <Bell size={36} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
              <p style={{ margin: 0, fontWeight: 700 }}>No notifications found in this category.</p>
              <span style={{ fontSize: '0.78rem' }}>You're all caught up with your GateSync activity!</span>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg-dark-input, rgba(240, 249, 255, 0.6))',
                  border: '1px solid var(--border-glass, rgba(0,0,0,0.06))',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                }}>
                  {getIconForType(item.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main, #0c1e33)' }}>
                      {item.title}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', lineHeight: 1.35 }}>
                    {item.body}
                  </div>

                  {item.status && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      <span className={`badge ${item.status === 'ACTED' ? 'badge-success' : item.status === 'DELIVERED' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                        {item.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
