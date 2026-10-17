import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { DeviceSessionsModal } from './DeviceSessionsModal';
import { NotificationCenterModal } from './NotificationCenterModal';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import {
  Sun,
  Moon,
  Bell,
  Search,
  Clock,
  Command,
  Smartphone,
  LogOut,
  Shield,
  Menu,
  CheckCircle2,
  Settings
} from 'lucide-react';

export const Header = () => {
  const { userRole, switchRole, currentUser, theme, toggleTheme, setSidebarOpen } = useApp();
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  return (
    <header style={{
      height: '76px',
      backgroundColor: 'var(--bg-dark-sidebar)',
      borderBottom: '1px solid var(--border-glass)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left))',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)'
    }}>
      {/* Mobile Menu & Search Command Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen && setSidebarOpen(prev => !prev)}
          className="mobile-sidebar-toggle btn btn-secondary btn-sm"
          style={{
            minHeight: '44px',
            minWidth: '44px',
            padding: 0,
            display: 'none', // Shown on <= 768px via CSS
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px'
          }}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-search-container" style={{
          position: 'relative',
          width: '280px',
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
              minHeight: '44px',
              fontSize: '0.85rem',
              borderRadius: '22px',
              backgroundColor: 'var(--bg-dark-input)'
            }}
          />
          <div style={{
            position: 'absolute',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'rgba(14, 165, 233, 0.1)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            color: 'var(--color-primary)',
            fontWeight: 700
          }}>
            <Command size={10} /> K
          </div>
        </div>

        {/* Live Date / Time Badge */}
        <div className="header-clock-badge" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minHeight: '44px',
          padding: '0 14px',
          borderRadius: '22px',
          background: 'rgba(224, 242, 254, 0.55)',
          border: '1px solid var(--border-glass)',
          fontSize: '0.8rem',
          color: 'var(--text-main)',
          fontWeight: 600
        }}>
          <Clock size={14} style={{ color: 'var(--color-primary)' }} />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span style={{ color: 'var(--border-glass)' }}>|</span>
          <span>{currentTime.toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      {/* Right Controls & Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        
        {/* Role Switcher Pill Bar (Calls real login to exercise JWTs) */}
        <div className="header-role-switcher" style={{
          display: 'inline-flex',
          padding: '4px',
          borderRadius: '24px',
          background: 'var(--bg-dark-input)',
          border: '1px solid var(--border-glass)'
        }}>
          <button
            onClick={() => switchRole('admin')}
            style={{
              minHeight: '36px',
              padding: '0 14px',
              borderRadius: '18px',
              fontSize: '0.8rem',
              fontWeight: 800,
              background: userRole === 'admin' ? 'var(--grad-primary)' : 'transparent',
              color: userRole === 'admin' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: userRole === 'admin' ? '0 2px 10px rgba(14, 165, 233, 0.35)' : 'none',
              touchAction: 'manipulation'
            }}
          >
            Admin
          </button>
          <button
            onClick={() => switchRole('member')}
            style={{
              minHeight: '36px',
              padding: '0 14px',
              borderRadius: '18px',
              fontSize: '0.8rem',
              fontWeight: 800,
              background: userRole === 'member' ? 'var(--grad-success)' : 'transparent',
              color: userRole === 'member' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: userRole === 'member' ? '0 2px 10px rgba(16, 185, 129, 0.35)' : 'none',
              touchAction: 'manipulation'
            }}
          >
            Resident
          </button>
          <button
            onClick={() => switchRole('staff')}
            style={{
              minHeight: '36px',
              padding: '0 14px',
              borderRadius: '18px',
              fontSize: '0.8rem',
              fontWeight: 800,
              background: userRole === 'staff' ? 'var(--grad-warning)' : 'transparent',
              color: userRole === 'staff' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: userRole === 'staff' ? '0 2px 10px rgba(245, 158, 11, 0.35)' : 'none',
              touchAction: 'manipulation'
            }}
          >
            Guard
          </button>
        </div>

        {/* Device Sessions Button */}
        <button
          onClick={() => setShowSessionsModal(true)}
          style={{
            minHeight: '44px',
            minWidth: '44px',
            borderRadius: '14px',
            background: 'var(--bg-dark-input)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
          title="Active Devices & Sessions"
          aria-label="Active Devices"
        >
          <Smartphone size={18} style={{ color: 'var(--color-primary)' }} />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            minHeight: '44px',
            minWidth: '44px',
            borderRadius: '14px',
            background: 'var(--bg-dark-input)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#0284c7' }} />}
        </button>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotificationsModal(true)}
            style={{
              minHeight: '44px',
              minWidth: '44px',
              borderRadius: '14px',
              background: 'var(--bg-dark-input)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-danger, #ef4444)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px var(--color-danger, #ef4444)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Preferences / Settings Button */}
        <button
          onClick={() => setShowPreferencesModal(true)}
          style={{
            minHeight: '44px',
            minWidth: '44px',
            borderRadius: '14px',
            background: 'var(--bg-dark-input)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
          title="Notification Settings & Quiet Hours"
          aria-label="Notification Settings"
        >
          <Settings size={18} style={{ color: 'var(--color-primary, #0284c7)' }} />
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border-glass)' }}></div>

        {/* Profile Card & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          <div className="header-profile-text">
            <div style={{ fontSize: '0.88rem', fontWeight: 800, lineHeight: 1.2 }}>
              {currentUser?.username || 'User'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {userRole === 'admin' ? 'Administrator' : userRole === 'staff' ? 'Security Guard' : `Resident (${currentUser?.flat || 'A-101'})`}
            </div>
          </div>
          {isAuthenticated && (
            <button
              onClick={logout}
              style={{
                minHeight: '44px',
                minWidth: '44px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px'
              }}
              title="Log Out"
              aria-label="Log Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

      </div>

      {/* Device Sessions Modal */}
      <DeviceSessionsModal
        isOpen={showSessionsModal}
        onClose={() => setShowSessionsModal(false)}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
      />
    </header>
  );
};
