import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  Bell,
  UserCheck,
  Users,
  UserCog,
  Wrench,
  Calendar,
  MapPin,
  RefreshCw,
  Building2,
  Lock,
  Sparkles,
  Download
} from 'lucide-react';

export const Sidebar = () => {
  const { userRole, activeTab, setActiveTab, resetToDefaultSeed, data, currentUser } = useApp();

  const myFlat = currentUser?.flat || 'A-101';

  const myPendingBills = data.billing.filter(
    b => b.status === 0 && (b.member_id === currentUser?.id || b.flat === myFlat)
  ).length;

  const myActiveVisitors = data.registry.filter(
    r => r.status === 'Inside' && r.flat === myFlat
  ).length;

  const allPendingBills = data.billing.filter(b => b.status === 0).length;
  const allActiveVisitors = data.registry.filter(r => r.status === 'Inside').length;

  const navItems = [
    { 
      id: 'dashboard', 
      label: userRole === 'admin' ? 'Dashboard' : userRole === 'staff' ? 'Gate Security Desk' : 'Resident Portal', 
      icon: LayoutDashboard, 
      roles: ['admin', 'member', 'staff'] 
    },
    { 
      id: 'billing', 
      label: userRole === 'admin' ? 'Maintenance Billing' : 'My Bills & Payments', 
      icon: Receipt, 
      roles: ['admin', 'member'], 
      badge: userRole === 'admin' ? allPendingBills : myPendingBills 
    },
    { 
      id: 'announcements', 
      label: 'Notice Board', 
      icon: Bell, 
      roles: ['admin', 'member', 'staff'], 
      badge: data.announcements.filter(a => a.announcement_status === 1).length 
    },
    { 
      id: 'registry', 
      label: userRole === 'member' ? 'My Gate Visitors' : 'Visitor Gate Registry', 
      icon: UserCheck, 
      roles: ['admin', 'member', 'staff'], 
      badge: userRole === 'member' ? myActiveVisitors : allActiveVisitors 
    },
    { 
      id: 'members', 
      label: userRole === 'admin' ? 'Manage Members' : 'Resident Directory', 
      icon: Users, 
      roles: ['admin', 'member', 'staff'] 
    },
    { 
      id: 'staff', 
      label: 'Staff Administration', 
      icon: UserCog, 
      roles: ['admin'] 
    },
    { 
      id: 'services', 
      label: 'Book Home Services', 
      icon: Wrench, 
      roles: ['admin', 'member'] 
    },
    { 
      id: 'events', 
      label: 'Event Calendar', 
      icon: Calendar, 
      roles: ['admin', 'member'] 
    },
    { 
      id: 'neighborhood', 
      label: 'Neighborhood Guide', 
      icon: MapPin, 
      roles: ['admin', 'member', 'staff'] 
    },
    { 
      id: 'downloads', 
      label: 'GateSync Downloads', 
      icon: Download, 
      roles: ['admin', 'member', 'staff'] 
    },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside style={{
      width: '290px',
      backgroundColor: 'var(--m3-sys-color-surface)',
      borderRight: '1px solid var(--m3-outline)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
      zIndex: 100
    }}>
      {/* Brand & Logo Header */}
      <div style={{
        padding: '28px 24px',
        borderBottom: '1px solid var(--m3-outline)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--m3-primary) 0%, #651fff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(124, 77, 255, 0.4)'
        }}>
          <Building2 size={26} />
        </div>
        <div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            GateSync <span style={{ color: 'var(--m3-primary)', fontSize: '0.85rem' }}>Suite</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Gate & Society System
          </div>
        </div>
      </div>

      {/* Role State Banner */}
      <div style={{ padding: '16px 20px 8px 20px' }}>
        <div style={{
          padding: '10px 14px',
          borderRadius: '16px',
          background: 'var(--m3-sys-color-surface-container-low)',
          border: '1px solid var(--m3-outline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Portal
          </span>
          <span className={`badge ${userRole === 'admin' ? 'badge-primary' : userRole === 'staff' ? 'badge-warning' : 'badge-success'}`}>
            {userRole === 'admin' ? 'Admin Authority' : userRole === 'staff' ? 'Gate Security' : `Resident (${myFlat})`}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px 10px 10px' }}>
          Navigation Desk
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '28px',
                    backgroundColor: isActive ? 'var(--m3-primary-container)' : 'transparent',
                    border: isActive ? '1px solid rgba(124, 77, 255, 0.4)' : '1px solid transparent',
                    color: isActive ? '#ffffff' : 'var(--text-primary)',
                    fontWeight: isActive ? 800 : 500,
                    fontSize: '0.9rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--m3-sys-color-surface-container-high)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Icon size={20} style={{ color: isActive ? 'var(--m3-primary)' : 'var(--text-secondary)' }} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span style={{
                      backgroundColor: isActive ? 'var(--m3-primary)' : 'var(--m3-sys-color-surface-container-highest)',
                      color: isActive ? '#ffffff' : 'var(--m3-primary)',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Data Privacy Status & Reset Button */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--m3-outline)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
          <Lock size={12} style={{ color: 'var(--m3-tertiary)' }} /> Material 3 Security Active
        </div>
        <button
          onClick={resetToDefaultSeed}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', gap: '8px', fontSize: '0.8rem', borderRadius: '16px' }}
        >
          <RefreshCw size={14} /> Reset SQL Seed Data
        </button>
      </div>
    </aside>
  );
};
