import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sun,
  Moon,
  Bell,
  Search,
  User,
  Shield,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Clock,
  Command
} from 'lucide-react';

export const Header = () => {
  const { userRole, switchRole, currentUser, theme, toggleTheme, notifications } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header style={{
      height: '76px',
      backgroundColor: 'var(--bg-dark-sidebar)',
      borderBottom: '1px solid var(--border-glass)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      backdropFilter: 'blur(16px)'
    }}>
      {/* Search Command Bar & Live Clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{
          position: 'relative',
          width: '320px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search residents, bills, gate visitors..."
            className="form-input"
            style={{
              paddingLeft: '40px',
              paddingRight: '64px',
              width: '100%',
              fontSize: '0.85rem',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-dark-input)'
            }}
          />
          <div style={{
            position: 'absolute',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            color: 'var(--text-dim)',
            fontWeight: 700
          }}>
            <Command size={10} /> K
          </div>
        </div>

        {/* Live Date / Time Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-glass)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          fontWeight: 600
        }}>
          <Clock size={14} style={{ color: 'var(--color-primary)' }} />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <span style={{ color: 'var(--border-glass)' }}>|</span>
          <span>{currentTime.toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      {/* Right Controls & Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* Role Switcher Pill Bar */}
        <div style={{
          display: 'inline-flex',
          padding: '4px',
          borderRadius: '24px',
          background: 'var(--bg-dark-input)',
          border: '1px solid var(--border-glass)'
        }}>
          <button
            onClick={() => switchRole('admin')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 800,
              background: userRole === 'admin' ? 'var(--grad-primary)' : 'transparent',
              color: userRole === 'admin' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: userRole === 'admin' ? '0 2px 10px rgba(99, 102, 241, 0.3)' : 'none'
            }}
          >
            Admin
          </button>
          <button
            onClick={() => switchRole('member')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 800,
              background: userRole === 'member' ? 'var(--grad-success)' : 'transparent',
              color: userRole === 'member' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: userRole === 'member' ? '0 2px 10px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            Resident
          </button>
          <button
            onClick={() => switchRole('staff')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 800,
              background: userRole === 'staff' ? 'var(--grad-warning)' : 'transparent',
              color: userRole === 'staff' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: userRole === 'staff' ? '0 2px 10px rgba(245, 158, 11, 0.3)' : 'none'
            }}
          >
            Guard
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            background: 'var(--bg-dark-input)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#6366f1' }} />}
        </button>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'var(--bg-dark-input)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-danger)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px var(--color-danger)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '54px',
              width: '340px',
              backgroundColor: 'var(--bg-dark-modal)',
              border: '1px solid var(--border-glass)',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              padding: '18px',
              zIndex: 120
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Activity Stream</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 700 }}>Mark all read</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-dark-input)',
                    fontSize: '0.82rem',
                    borderLeft: `3px solid ${n.read ? 'var(--text-dim)' : 'var(--color-primary)'}`
                  }}>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{n.text}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border-glass)' }}></div>

        {/* Profile Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt="Avatar"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `2px solid ${userRole === 'admin' ? 'var(--color-primary)' : userRole === 'staff' ? 'var(--color-warning)' : 'var(--color-success)'}`
              }}
            />
            <div className="pulse-dot" style={{ position: 'absolute', bottom: '0', right: '0', border: '2px solid var(--bg-dark-sidebar)' }}></div>
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, lineHeight: 1.2 }}>
              {currentUser?.username || 'Ashwin'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {userRole === 'admin' ? 'Administrator' : userRole === 'staff' ? 'Security Guard' : `Resident (${currentUser?.flat || 'A-101'})`}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
