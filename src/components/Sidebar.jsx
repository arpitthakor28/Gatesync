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
  Download,
  X
} from 'lucide-react';

export const Sidebar = () => {
  const { userRole, activeTab, setActiveTab, resetToDefaultSeed, data, currentUser, sidebarOpen, setSidebarOpen } = useApp();

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

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="sidebar-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(12, 30, 51, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 99
          }}
        />
      )}

      <aside className={`app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} style={{
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
          padding: '24px 20px',
          borderBottom: '1px solid var(--m3-outline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 18px rgba(14, 165, 233, 0.45)'
            }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                GateSync <span style={{ color: 'var(--m3-primary)', fontSize: '0.85rem' }}>PWA</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Residential Society Suite
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen && setSidebarOpen(false)}
            className="mobile-sidebar-close"
            style={{
              display: 'none', // Handled via responsive CSS
              minHeight: '44px',
              minWidth: '44px',
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="pulse-dot"></div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {userRole === 'admin' ? 'Admin Portal' : userRole === 'staff' ? 'Guard Post' : `Flat ${currentUser?.flat || 'A-101'}`}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700 }}>
              Live
            </span>
          </div>
        </div>

        {/* Navigation Item List */}
        <nav style={{ flex: 1, padding: '12px 14px', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      width: '100%',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: isActive ? 'var(--m3-primary)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.88rem',
                      transition: 'all 0.15s ease',
                      touchAction: 'manipulation'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon size={19} style={{ color: isActive ? '#ffffff' : 'var(--color-primary)' }} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span style={{
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(14, 165, 233, 0.15)',
                        color: isActive ? '#ffffff' : 'var(--m3-primary)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
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

        {/* Security & Seed Reset Button */}
        <div style={{
          padding: '16px 20px max(16px, env(safe-area-inset-bottom)) 20px',
          borderTop: '1px solid var(--m3-outline)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <Lock size={12} style={{ color: 'var(--m3-tertiary)' }} /> JWT Multi-Tenant Shield Active
          </div>
          <button
            onClick={resetToDefaultSeed}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', minHeight: '44px', gap: '8px', fontSize: '0.8rem', borderRadius: '16px' }}
          >
            <RefreshCw size={14} /> Reset Local Seed Data
          </button>
        </div>
      </aside>
    </>
  );
};
