import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialSeedData } from '../data/seedData';
import confetti from 'canvas-confetti';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Load initial data from localStorage or fallback to seedData
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('hms_society_data_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local storage hms data", e);
      }
    }
    return initialSeedData;
  });

  // Current active role & user
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('hms_active_role') || 'admin';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const role = localStorage.getItem('hms_active_role') || 'admin';
    if (role === 'admin') return initialSeedData.admin[0];
    if (role === 'member') return initialSeedData.members[0];
    if (role === 'staff') return initialSeedData.staff[0];
    return initialSeedData.admin[0];
  });

  // Modern Theme state - default to AI White & Sky Blue ('light')
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('hms_theme');
    if (!saved || saved === 'dark') {
      return 'light';
    }
    return saved;
  });

  // Notifications list
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Maintenance Bill for September generated', time: '10m ago', read: false },
    { id: 2, text: 'New visitor checked in at Gate 1', time: '35m ago', read: false },
    { id: 3, text: 'Water Supply Notice posted by Admin', time: '2h ago', read: true }
  ]);

  // Active view tab state
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) return tabParam;
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return 'dashboard';
  });

  // Save data updates to localStorage
  useEffect(() => {
    localStorage.setItem('hms_society_data_v2', JSON.stringify(data));
  }, [data]);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hms_theme', theme);
  }, [theme]);

  // Switch role helper
  const switchRole = (role) => {
    setUserRole(role);
    localStorage.setItem('hms_active_role', role);
    if (role === 'admin') setCurrentUser(data.admin[0] || initialSeedData.admin[0]);
    if (role === 'member') setCurrentUser(data.members[0] || initialSeedData.members[0]);
    if (role === 'staff') setCurrentUser(data.staff[0] || initialSeedData.staff[0]);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Reset to default seed
  const resetToDefaultSeed = () => {
    setData(initialSeedData);
    localStorage.removeItem('hms_society_data_v2');
    addNotification("Database reset to default original seed data successfully!");
  };

  const addNotification = (text) => {
    const newNotif = {
      id: Date.now(),
      text,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // MEMBER MANAGEMENT
  const addMember = (memberObj) => {
    const newId = data.members.length ? Math.max(...data.members.map(m => m.id)) + 1 : 1;
    const newMember = {
      id: newId,
      ...memberObj,
      created_at: new Date().toISOString().split('T')[0]
    };
    setData(prev => ({ ...prev, members: [newMember, ...prev.members] }));
    addNotification(`New member ${memberObj.username} added successfully!`);
  };

  const updateMember = (id, updatedFields) => {
    setData(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === id ? { ...m, ...updatedFields } : m)
    }));
    addNotification(`Member information updated.`);
  };

  const deleteMember = (id) => {
    setData(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id)
    }));
    addNotification(`Member removed from GateSync registry.`);
  };

  // STAFF MANAGEMENT
  const addStaff = (staffObj) => {
    const newId = data.staff.length ? Math.max(...data.staff.map(s => s.id)) + 1 : 1;
    const newStaffItem = {
      id: newId,
      ...staffObj,
      created_at: new Date().toISOString().split('T')[0]
    };
    setData(prev => ({ ...prev, staff: [newStaffItem, ...prev.staff] }));
    addNotification(`New staff member ${staffObj.username} registered.`);
  };

  const updateStaff = (id, updatedFields) => {
    setData(prev => ({
      ...prev,
      staff: prev.staff.map(s => s.id === id ? { ...s, ...updatedFields } : s)
    }));
    addNotification(`Staff member details updated.`);
  };

  const deleteStaff = (id) => {
    setData(prev => ({
      ...prev,
      staff: prev.staff.filter(s => s.id !== id)
    }));
    addNotification(`Staff member removed.`);
  };

  // BILLING MANAGEMENT
  const createBill = (billObj) => {
    const newId = data.billing.length ? Math.max(...data.billing.map(b => b.id)) + 1 : 1;
    const newInvoice = `INV-${new Date().getFullYear()}-${String(newId).padStart(3, '0')}`;
    const newBill = {
      id: newId,
      invoice: newInvoice,
      billing_date: new Date().toISOString().split('T')[0],
      due_date: billObj.due_date || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: 0,
      amount_payed: 0,
      amount_change: 0,
      payment_method: null,
      ...billObj
    };
    setData(prev => ({ ...prev, billing: [newBill, ...prev.billing] }));
    addNotification(`Bill ${newInvoice} generated for ${billObj.member_name}.`);
  };

  const payBill = (billId, payedAmount, paymentMethod = 'UPI Online') => {
    setData(prev => {
      const updatedBilling = prev.billing.map(b => {
        if (b.id === billId) {
          const change = payedAmount - b.total_amount;
          return {
            ...b,
            status: 1,
            amount_payed: payedAmount,
            amount_change: change > 0 ? change : 0,
            payment_method: paymentMethod
          };
        }
        return b;
      });
      return { ...prev, billing: updatedBilling };
    });

    // Trigger celebration confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    addNotification(`Maintenance payment successfully processed!`);
  };

  // ANNOUNCEMENTS MANAGEMENT
  const addAnnouncement = (annObj) => {
    const newId = data.announcements.length ? Math.max(...data.announcements.map(a => a.announcement_id)) + 1 : 101;
    const newAnn = {
      announcement_id: newId,
      announcement_status: 1,
      created_at: new Date().toISOString().split('T')[0],
      ...annObj
    };
    setData(prev => ({ ...prev, announcements: [newAnn, ...prev.announcements] }));
    addNotification(`Announcement "${annObj.announcement_subject}" posted.`);
  };

  const toggleAnnouncementStatus = (id) => {
    setData(prev => ({
      ...prev,
      announcements: prev.announcements.map(a => 
        a.announcement_id === id ? { ...a, announcement_status: a.announcement_status === 1 ? 0 : 1 } : a
      )
    }));
  };

  const deleteAnnouncement = (id) => {
    setData(prev => ({
      ...prev,
      announcements: prev.announcements.filter(a => a.announcement_id !== id)
    }));
  };

  // VISITOR REGISTRY MANAGEMENT
  const addVisitor = (visitorObj) => {
    const newId = data.registry.length ? Math.max(...data.registry.map(r => r.id)) + 1 : 1;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toISOString().split('T')[0];
    
    const newVisitor = {
      id: newId,
      status: 'Inside',
      in_time: `${dateString} ${timeString}`,
      out_time: '-',
      created_at: `${dateString} ${timeString}`,
      ...visitorObj
    };
    setData(prev => ({ ...prev, registry: [newVisitor, ...prev.registry] }));
    addNotification(`Visitor ${visitorObj.person_name} checked in at Flat ${visitorObj.flat}.`);
  };

  const checkoutVisitor = (id) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toISOString().split('T')[0];

    setData(prev => ({
      ...prev,
      registry: prev.registry.map(r => 
        r.id === id ? { ...r, status: 'Checked Out', out_time: `${dateString} ${timeString}` } : r
      )
    }));
    addNotification(`Visitor checked out successfully.`);
  };

  // EVENT RSVP
  const rsvpEvent = (eventId) => {
    setData(prev => ({
      ...prev,
      events: prev.events.map(e => e.id === eventId ? { ...e, rsvp_count: e.rsvp_count + 1, rsvped: true } : e)
    }));
    addNotification(`RSVP confirmed for event!`);
  };

  const addEvent = (eventObj) => {
    const newId = data.events.length ? Math.max(...data.events.map(e => e.id)) + 1 : 1;
    const newEv = {
      id: newId,
      rsvp_count: 0,
      ...eventObj
    };
    setData(prev => ({ ...prev, events: [newEv, ...prev.events] }));
    addNotification(`New GateSync event created.`);
  };

  return (
    <AppContext.Provider value={{
      data,
      userRole,
      currentUser,
      switchRole,
      theme,
      toggleTheme,
      activeTab,
      setActiveTab,
      notifications,
      resetToDefaultSeed,
      addMember,
      updateMember,
      deleteMember,
      addStaff,
      updateStaff,
      deleteStaff,
      createBill,
      payBill,
      addAnnouncement,
      toggleAnnouncementStatus,
      deleteAnnouncement,
      addVisitor,
      checkoutVisitor,
      rsvpEvent,
      addEvent
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
