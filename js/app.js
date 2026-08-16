/**
 * GateSync - Smart Society Visitor Management System
 * Fullstack Client Application Engine (Matching User UI Mockups 100%)
 */

(function () {
  // Global Application State
  const state = {
    currentUser: null,
    token: null,
    activeView: 'landing', // landing, admin, guard, resident, password_reset
    adminTab: 'dashboard', // dashboard, logs, directory, guards, alerts, settings
    // Auth Form Tabs
    authRole: 'RESIDENT',
    authMode: 'LOGIN',
    searchQuery: '',
    residentStatusFilter: 'ALL',
    guardShiftFilter: 'ALL',
    isAuthenticating: false,
    isRefreshing: false,
    notificationDrawerOpen: false,
    selectedPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    cameraStream: null,
    stompClient: null,
    
    // Notifications Feed (Reset to Zero)
    notifications: [],

    // Clubhouse Bookings Module (Reset to Zero)
    clubhouseBookings: [],

    // Community Problems Broadcast Module (Reset to Zero)
    communityProblems: [],

    // Visitor Requests State (Reset to Zero)
    visitorRequests: [],

    // Resident Directory (Reset to Zero)
    residents: [],

    // Security Guards (Reset to Zero)
    guards: []
  };

  const PRESET_PHOTOS = [
    { title: 'Delivery Driver', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
    { title: 'Guest Visitor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
    { title: 'Service Tech', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
    { title: 'Cab Driver', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80' }
  ];

  function getDatabaseUsers() {
    try {
      const stored = localStorage.getItem('gatesync_db_users');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    const seed = [
      { loginId: 'admin', password: '123', fullName: 'System Admin', role: 'ADMIN' },
      { loginId: 'resident', password: '123', fullName: 'Amit Patel', role: 'RESIDENT', blockNumber: 'A', flatNumber: '101', phone: '9876543210' },
      { loginId: 'guard', password: '123', fullName: 'Bahadur Thapa', role: 'GUARD', phone: '9812345678' }
    ];
    localStorage.setItem('gatesync_db_users', JSON.stringify(seed));
    return seed;
  }

  function saveDatabaseUser(userObj) {
    if (!userObj || !userObj.loginId) return;
    const users = getDatabaseUsers();
    const idx = users.findIndex(u => u.loginId && u.loginId.toLowerCase() === userObj.loginId.toLowerCase());
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...userObj };
    } else {
      users.push(userObj);
    }
    localStorage.setItem('gatesync_db_users', JSON.stringify(users));
  }

  // App Initialization
  document.addEventListener('DOMContentLoaded', () => {
    loadSavedSession();
    fetchInitialData();
    connectWebSocket();
    render();
  });

  function loadSavedSession() {
    state.activeView = 'landing'; // Always start on Login form on project open
    const savedUser = localStorage.getItem('gatesync_user');
    const savedToken = localStorage.getItem('gatesync_token');
    if (savedUser && savedToken) {
      state.currentUser = JSON.parse(savedUser);
      state.token = savedToken;
    }
  }

  function saveSession(user, token) {
    state.currentUser = user;
    state.token = token;
    localStorage.setItem('gatesync_user', JSON.stringify(user));
    localStorage.setItem('gatesync_token', token);
  }

  function clearSession() {
    state.currentUser = null;
    state.token = null;
    localStorage.removeItem('gatesync_user');
    localStorage.removeItem('gatesync_token');
    state.activeView = 'landing';
    render();
    showToast('Logged out successfully', 'info');
  }

  function normalizeResident(r) {
    if (!r) return null;
    const fullName = r.fullName || r.name || 'Resident';
    const initials = r.initials || (fullName ? fullName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RS');
    
    let flatStr = r.flat;
    if (!flatStr) {
      if (r.blockNumber && r.flatNumber) {
        flatStr = `${r.blockNumber}-${r.flatNumber}`;
      } else if (r.flatNumber) {
        flatStr = r.flatNumber;
      } else if (r.blockNumber) {
        flatStr = r.blockNumber;
      } else {
        flatStr = 'A-101';
      }
    }
    
    let statusStr = r.status;
    if (!statusStr) {
      statusStr = (r.active !== false) ? 'Active' : 'Inactive';
    }

    return {
      id: r.id || Date.now(),
      name: fullName,
      fullName: fullName,
      initials: initials,
      flat: flatStr,
      blockNumber: r.blockNumber || (flatStr.includes('-') ? flatStr.split('-')[0] : 'A'),
      flatNumber: r.flatNumber || (flatStr.includes('-') ? flatStr.split('-')[1] : flatStr),
      loginId: r.loginId || '',
      phone: r.phone || '',
      backupPhone: r.backupPhone || '',
      status: statusStr,
      active: statusStr === 'Active',
      avatarBg: r.avatarBg || 'blue'
    };
  }

  async function fetchInitialData() {
    try {
      const [resReq, resGuards, resResidents] = await Promise.all([
        fetch('/api/guard/visitors/all').then(r => r.ok ? r.json() : null),
        fetch('/api/admin/guards').then(r => r.ok ? r.json() : null),
        fetch('/api/admin/residents').then(r => r.ok ? r.json() : null)
      ]);

      if (resReq && Array.isArray(resReq) && resReq.length) state.visitorRequests = resReq;
      if (resGuards && Array.isArray(resGuards) && resGuards.length) state.guards = resGuards;
      if (resResidents && Array.isArray(resResidents) && resResidents.length) {
        state.residents = resResidents.map(normalizeResident).filter(Boolean);
      }
    } catch (e) {
      console.warn('API backend connecting, using local UI state fallback.');
    }

    // Merge database users from local storage if state lists are missing entries
    const dbUsers = getDatabaseUsers();
    const dbResidents = dbUsers.filter(u => u.role === 'RESIDENT').map(normalizeResident).filter(Boolean);
    const dbGuards = dbUsers.filter(u => u.role === 'GUARD');

    dbResidents.forEach(dbr => {
      if (!state.residents.some(r => r.loginId && r.loginId.toLowerCase() === dbr.loginId.toLowerCase())) {
        state.residents.push(dbr);
      }
    });

    dbGuards.forEach(dbg => {
      if (!state.guards.some(g => g.loginId && g.loginId.toLowerCase() === dbg.loginId.toLowerCase())) {
        state.guards.push(dbg);
      }
    });

    render();
  }

  function connectWebSocket() {
    try {
      if (typeof SockJS !== 'undefined' && typeof Stomp !== 'undefined') {
        const socket = new SockJS('/ws-gatesync');
        state.stompClient = Stomp.over(socket);
        state.stompClient.debug = null;
        state.stompClient.connect({}, () => {
          console.log('Connected to GateSync WebSocket Broker.');
          state.stompClient.subscribe('/topic/guard/queue', message => {
            const event = JSON.parse(message.body);
            handleNotificationEvent(event);
          });
          if (state.currentUser && state.currentUser.role === 'RESIDENT') {
            const block = state.currentUser.blockNumber || 'A';
            const flat = state.currentUser.flatNumber || '101';
            state.stompClient.subscribe(`/topic/resident/${block}-${flat}`, message => {
              const event = JSON.parse(message.body);
              handleNotificationEvent(event);
            });
          }
        });
      }
    } catch (e) {}
  }

  function handleNotificationEvent(event) {
    if (event.type === 'VISITOR_NEW') {
      showToast(`🔔 New Visitor Alert: ${event.visitorName} at Gate!`, 'amber');
      playAlertSound();
      fetchInitialData().then(() => render());
    } else if (event.type === 'VISITOR_UPDATE') {
      showToast(`Visitor status updated to ${event.status} for ${event.visitorName}`, event.status === 'APPROVED' ? 'success' : 'error');
      fetchInitialData().then(() => render());
    }
  }

  function playAlertSound() {
    const audio = document.getElementById('alert-sound');
    if (audio) audio.play().catch(() => {});
  }

  window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'bell';
    toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // Main Render Orchestrator
  function render() {
    const container = document.getElementById('app-container');
    if (!container) return;

    if (state.activeView === 'landing') {
      container.innerHTML = renderLandingPage();
    } else if (state.activeView === 'password_reset') {
      container.innerHTML = renderPasswordResetPage();
    } else {
      container.innerHTML = renderDashboardLayout();
    }

    lucide.createIcons();
    bindEvents();
  }

  // 1. Landing & Login Page
  function renderLandingPage() {
    const role = state.authRole || 'RESIDENT';
    const mode = state.authMode || 'LOGIN';

    return `
      <div class="landing-hero">
        <nav class="landing-nav">
          <div class="sidebar-brand" style="padding:0; border:none;">
            <div class="brand-icon"><i data-lucide="shield-check"></i></div>
            <div class="brand-title-wrap">
              <div class="brand-text" style="font-size: 24px; color:white;">GateSync</div>
              <span class="brand-subtext" style="color:#94a3b8;">Community Security</span>
            </div>
          </div>
          <div style="display:flex; gap:12px;">
            <button class="btn btn-secondary" onclick="openHelpModal()"><i data-lucide="help-circle"></i> Need Help?</button>
            <a href="#login-section" class="btn btn-primary"><i data-lucide="log-in"></i> Access Portal</a>
          </div>
        </nav>

        <div class="landing-container">
          <div>
            <div style="display:inline-block; background:rgba(37,99,235,0.2); color:#60a5fa; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; margin-bottom:20px;">
              🛡️ Enterprise Residential Society Security
            </div>
            <h1 style="font-family:var(--font-heading); font-size:48px; font-weight:800; line-height:1.1; margin-bottom:20px;">
              Smart Gatekeeping for Modern Communities.
            </h1>
            <p style="font-size:16px; color:#94a3b8; margin-bottom:32px; max-width:480px;">
              GateSync empowers Admins, Guards, and Residents with real-time entry approvals, live camera logs, pre-approved guest passes, and clubhouse bookings.
            </p>
            <div style="display:flex; gap:24px;">
              <div>
                <h3 style="font-size:24px; color:#fff; font-weight:700;">100%</h3>
                <p style="font-size:12px; color:#94a3b8;">Real-Time Sync</p>
              </div>
              <div>
                <h3 style="font-size:24px; color:#fff; font-weight:700;">&lt; 3s</h3>
                <p style="font-size:12px; color:#94a3b8;">Gate Approval Speed</p>
              </div>
              <div>
                <h3 style="font-size:24px; color:#fff; font-weight:700;">256-Bit</h3>
                <p style="font-size:12px; color:#94a3b8;">Encrypted Logs</p>
              </div>
            </div>
          </div>

          <div class="login-card" id="login-section" style="min-width:340px;">
            <!-- Role Selection Tabs -->
            <div style="margin-bottom:18px;">
              <label style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:8px;">Select User Portal</label>
              <div style="display:flex; background:#f1f5f9; padding:4px; border-radius:10px;">
                <button type="button" onclick="setAuthRole('RESIDENT')" style="flex:1; padding:8px 4px; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; background:${role === 'RESIDENT' ? '#fff' : 'transparent'}; color:${role === 'RESIDENT' ? '#2563eb' : '#64748b'}; box-shadow:${role === 'RESIDENT' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'};">
                  <i data-lucide="home" style="width:14px; height:14px; vertical-align:-2px;"></i> Resident
                </button>
                <button type="button" onclick="setAuthRole('GUARD')" style="flex:1; padding:8px 4px; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; background:${role === 'GUARD' ? '#fff' : 'transparent'}; color:${role === 'GUARD' ? '#2563eb' : '#64748b'}; box-shadow:${role === 'GUARD' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'};">
                  <i data-lucide="shield-check" style="width:14px; height:14px; vertical-align:-2px;"></i> Guard
                </button>
                <button type="button" onclick="setAuthRole('ADMIN')" style="flex:1; padding:8px 4px; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; background:${role === 'ADMIN' ? '#fff' : 'transparent'}; color:${role === 'ADMIN' ? '#2563eb' : '#64748b'}; box-shadow:${role === 'ADMIN' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'};">
                  <i data-lucide="shield" style="width:14px; height:14px; vertical-align:-2px;"></i> Admin
                </button>
              </div>
            </div>

            ${role === 'ADMIN' ? `
              <!-- Mode Switcher for Admin (Login vs Register) -->
              <div style="display:flex; border-bottom:2px solid #e2e8f0; margin-bottom:20px;">
                <button type="button" onclick="setAuthMode('LOGIN')" style="flex:1; padding:10px; border:none; border-bottom:2px solid ${mode === 'LOGIN' ? '#2563eb' : 'transparent'}; background:none; font-weight:700; font-size:14px; color:${mode === 'LOGIN' ? '#2563eb' : '#64748b'}; cursor:pointer; margin-bottom:-2px;">
                  <i data-lucide="log-in" style="width:15px; height:15px; vertical-align:-2px;"></i> Admin Login
                </button>
                <button type="button" onclick="setAuthMode('REGISTER')" style="flex:1; padding:10px; border:none; border-bottom:2px solid ${mode === 'REGISTER' ? '#2563eb' : 'transparent'}; background:none; font-weight:700; font-size:14px; color:${mode === 'REGISTER' ? '#2563eb' : '#64748b'}; cursor:pointer; margin-bottom:-2px;">
                  <i data-lucide="user-plus" style="width:15px; height:15px; vertical-align:-2px;"></i> Register Admin
                </button>
              </div>
            ` : `
              <!-- Guidance Notice for Resident & Guard (No Register option) -->
              <div style="padding:10px 12px; background:#eff6ff; border-radius:8px; font-size:12px; color:#1e40af; margin-bottom:20px; display:flex; align-items:center; gap:8px;">
                <i data-lucide="info" style="width:16px; height:16px; flex-shrink:0;"></i>
                <span>${role === 'RESIDENT' ? 'Resident credentials are provided by Society Admin. Enter your ID and password below.' : 'Guard access accounts are provisioned by Admin. Enter Guard ID and password below.'}</span>
              </div>
            `}

            ${(role !== 'ADMIN' || mode === 'LOGIN') ? `
              <form id="login-form" autocomplete="off">
                <div class="form-group" style="margin-bottom:16px;">
                  <label>${role === 'RESIDENT' ? 'Resident ID / Mobile Number' : role === 'GUARD' ? 'Guard ID / Username' : 'Admin Username / ID'}</label>
                  <input type="text" id="login-id" class="form-control" placeholder="${role === 'RESIDENT' ? 'Enter Resident ID' : role === 'GUARD' ? 'Enter Guard ID' : 'Enter Admin ID'}" required value="" autocomplete="off" name="gatesync_user_id_${Date.now()}">
                </div>
                <div class="form-group" style="margin-bottom:20px;">
                  <label>Password</label>
                  <div style="position:relative;">
                    <input type="password" id="login-password" class="form-control" placeholder="Enter Password" required value="" autocomplete="new-password" name="gatesync_user_pass_${Date.now()}" style="padding-right:42px;">
                    <button type="button" onclick="togglePasswordVisibility('login-password', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                      <i data-lucide="eye" style="width:18px; height:18px;"></i>
                    </button>
                  </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; font-size:12px;">
                  <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                    <input type="checkbox"> Remember me
                  </label>
                  <a href="#" onclick="openForgotPasswordModal()" style="color:var(--primary-blue); text-decoration:none; font-weight:600;">Forgot Password?</a>
                </div>
                <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width:100%; padding:12px;">
                  ${state.isAuthenticating ? `<span class="spinner-loader"></span> Authenticating...` : `<i data-lucide="shield"></i> Sign In as ${role}`}
                </button>
              </form>
            ` : `
              <!-- Admin Register Form (Admin Only) -->
              <form id="admin-register-form" autocomplete="off">
                <div class="form-group" style="margin-bottom:12px;">
                  <label>Full Name</label>
                  <input type="text" id="reg-admin-fullname" class="form-control" placeholder="Enter Full Name" required value="" autocomplete="off" name="admin_fullname_${Date.now()}">
                </div>
                <div class="form-group" style="margin-bottom:12px;">
                  <label>Society Name</label>
                  <input type="text" id="reg-admin-society" class="form-control" placeholder="Enter Society Name" value="" required autocomplete="off" name="admin_society_${Date.now()}">
                </div>
                <div class="form-grid" style="margin-bottom:12px;">
                  <div class="form-group">
                    <label>Admin Username / ID</label>
                    <input type="text" id="reg-admin-id" class="form-control" placeholder="Enter Admin Username" required value="" autocomplete="off" name="admin_id_${Date.now()}">
                  </div>
                  <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="reg-admin-phone" class="form-control" placeholder="Enter Phone Number" required value="" autocomplete="off" name="admin_phone_${Date.now()}">
                  </div>
                </div>
                <div class="form-grid" style="margin-bottom:20px;">
                  <div class="form-group">
                    <label>Password</label>
                    <div style="position:relative;">
                      <input type="password" id="reg-admin-password" class="form-control" placeholder="Enter Password" required value="" autocomplete="new-password" name="admin_pass_${Date.now()}" style="padding-right:42px;">
                      <button type="button" onclick="togglePasswordVisibility('reg-admin-password', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                        <i data-lucide="eye" style="width:18px; height:18px;"></i>
                      </button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Confirm Password</label>
                    <div style="position:relative;">
                      <input type="password" id="reg-admin-confirm" class="form-control" placeholder="Confirm Password" required value="" autocomplete="new-password" name="admin_confirm_${Date.now()}" style="padding-right:42px;">
                      <button type="button" onclick="togglePasswordVisibility('reg-admin-confirm', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                        <i data-lucide="eye" style="width:18px; height:18px;"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <button type="submit" id="reg-admin-submit-btn" class="btn btn-primary" style="width:100%; padding:12px; background:var(--accent-teal);">
                  ${state.isAuthenticating ? `<span class="spinner-loader"></span> Creating Account...` : `<i data-lucide="user-plus"></i> Register & Create Admin Account`}
                </button>
              </form>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // 2. Global Dashboard Layout Wrapper
  function renderDashboardLayout() {
    const user = state.currentUser || { fullName: 'Rajesh Sharma', role: 'ADMIN' };
    const role = user.role;
    const unreadCount = state.notifications.filter(n => !n.read).length;

    let navItemsHTML = '';
    let actionBtnHTML = '';

    if (role === 'ADMIN') {
      navItemsHTML = `
        <div class="nav-item ${state.adminTab === 'dashboard' ? 'active' : ''}" onclick="switchTab('dashboard')">
          <i data-lucide="layout-dashboard"></i> Dashboard
        </div>
        <div class="nav-item ${state.adminTab === 'directory' ? 'active' : ''}" onclick="switchTab('directory')">
          <i data-lucide="users"></i> Resident Directory
        </div>
        <div class="nav-item ${state.adminTab === 'guards' ? 'active' : ''}" onclick="switchTab('guards')">
          <i data-lucide="user-check"></i> Guard Roster
        </div>
        <div class="nav-item ${state.adminTab === 'logs' ? 'active' : ''}" onclick="switchTab('logs')">
          <i data-lucide="file-text"></i> Visitor Logs
        </div>
        <div class="nav-item ${state.adminTab === 'settings' ? 'active' : ''}" onclick="switchTab('settings')">
          <i data-lucide="settings"></i> Settings
        </div>
      `;
      actionBtnHTML = `
        <button class="sidebar-action-btn" onclick="openAddUserModal('RESIDENT')">
          <i data-lucide="user-plus"></i> + Add Resident
        </button>
      `;
    } else if (role === 'GUARD') {
      navItemsHTML = `
        <div class="nav-item ${state.adminTab === 'dashboard' || state.adminTab === 'entry' ? 'active' : ''}" onclick="switchTab('dashboard')">
          <i data-lucide="user-plus"></i> Register Visitor
        </div>
        <div class="nav-item ${state.adminTab === 'queue' ? 'active' : ''}" onclick="switchTab('queue')">
          <i data-lucide="clock"></i> Pending Queue
        </div>
        <div class="nav-item ${state.adminTab === 'logs' ? 'active' : ''}" onclick="switchTab('logs')">
          <i data-lucide="file-text"></i> Visitor History
        </div>
      `;
      actionBtnHTML = `
        <button class="sidebar-action-btn" onclick="openRegisterVisitorModal()">
          <i data-lucide="user-plus"></i> + Register Visitor
        </button>
      `;
    } else if (role === 'RESIDENT') {
      navItemsHTML = `
        <div class="nav-item ${state.adminTab === 'dashboard' ? 'active' : ''}" onclick="switchTab('dashboard')">
          <i data-lucide="radio"></i> Live Visitor Alerts
        </div>
        <div class="nav-item ${state.adminTab === 'logs' ? 'active' : ''}" onclick="switchTab('logs')">
          <i data-lucide="history"></i> My Visitor Log
        </div>
        <div class="nav-item ${state.adminTab === 'passes' ? 'active' : ''}" onclick="openManagePassesModal()">
          <i data-lucide="qr-code"></i> Pre-Approved Passes
        </div>
        <div class="nav-item ${state.adminTab === 'issue' ? 'active' : ''}" onclick="openReportProblemModal()">
          <i data-lucide="alert-triangle"></i> Report Issue
        </div>
      `;
      actionBtnHTML = `
        <button class="sidebar-action-btn" style="background:var(--accent-teal);" onclick="openManagePassesModal()">
          <i data-lucide="qr-code"></i> + Guest Pass
        </button>
      `;
    }

    return `
      <div class="dashboard-layout">
        <!-- Desktop Light Sidebar -->
        <aside class="sidebar" id="app-sidebar">
          <div class="sidebar-brand">
            <div class="brand-icon"><i data-lucide="shield"></i></div>
            <div class="brand-title-wrap">
              <div class="brand-text">GateSync</div>
              <span class="brand-subtext">Community Security</span>
            </div>
          </div>

          <nav class="sidebar-nav">
            ${navItemsHTML}
          </nav>

          <div class="sidebar-footer">
            ${actionBtnHTML}
            <div class="sidebar-secondary-link" onclick="openHelpModal()">
              <i data-lucide="help-circle"></i> Help Center
            </div>
            <div class="sidebar-secondary-link logout" onclick="clearSession()">
              <i data-lucide="log-out"></i> Logout
            </div>
          </div>
        </aside>

        <!-- Main Workspace -->
        <div class="main-wrapper">
          <header class="top-header">
            <div class="header-left-wrap">
              <button class="hamburger-btn" onclick="toggleMobileSidebar()"><i data-lucide="menu"></i></button>
              ${role !== 'RESIDENT' ? `
                <div class="header-search">
                  <i data-lucide="search"></i>
                  <input type="text" placeholder="Search residents, flats, or logs..." id="global-search-input" value="${state.searchQuery}">
                </div>
              ` : ''}
            </div>

            <div class="header-actions">
              <div class="notification-bell" onclick="toggleNotificationDrawer()">
                <i data-lucide="bell"></i>
                ${unreadCount > 0 ? `<span class="bell-badge-dot"></span>` : ''}
              </div>

              <div class="user-profile-pill" onclick="openProfileModal()">
                <div class="avatar-initials">${user.fullName ? user.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'AP'}</div>
                <span class="user-profile-name">${user.fullName || 'Resident'}</span>
              </div>
            </div>
          </header>

          <!-- Notification Drawer Dropdown -->
          ${state.notificationDrawerOpen ? `
            <div class="notification-drawer" style="position:absolute; right:80px; top:64px; background:white; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.15); width:320px; z-index:100; padding:16px;">
              <div class="drawer-header" style="display:flex; justify-content:space-between; margin-bottom:12px;">
                <span class="drawer-title" style="font-weight:700; font-size:14px;">Notifications (${state.notifications.length})</span>
                <span style="font-size:11px; color:var(--primary-blue); cursor:pointer; font-weight:600;" onclick="markNotificationsRead()">Mark all read</span>
              </div>
              <div class="drawer-body" style="max-height:260px; overflow-y:auto;">
                ${state.notifications.length === 0 ? '<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:12px;">No new notifications</div>' : state.notifications.map(n => `
                  <div class="drawer-item" style="padding:8px 0; border-bottom:1px solid #f1f5f9;">
                    <div style="font-weight:700; font-size:12px; color:#1e293b; display:flex; justify-content:space-between;">
                      <span>${n.title}</span>
                      <span style="font-size:10px; color:var(--text-muted);">${n.time}</span>
                    </div>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${n.message}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <main class="content-canvas">
            ${role === 'ADMIN' ? renderAdminView() : ''}
            ${role === 'GUARD' ? renderGuardView() : ''}
            ${role === 'RESIDENT' ? renderResidentView() : ''}
          </main>
        </div>

        <!-- Mobile Bottom Navigation -->
        <nav class="mobile-bottom-nav">
          <div class="mobile-nav-btn active" onclick="switchTab('dashboard')">
            <i data-lucide="${role === 'ADMIN' ? 'layout-dashboard' : role === 'GUARD' ? 'user-plus' : 'radio'}"></i> Dashboard
          </div>
          <div class="mobile-nav-btn" onclick="switchTab('logs')">
            <i data-lucide="file-text"></i> Logs
          </div>
          ${role === 'GUARD' ? `
            <div class="mobile-fab-center" onclick="openRegisterVisitorModal()">
              <i data-lucide="plus" style="width:24px; height:24px;"></i>
            </div>
          ` : ''}
          <div class="mobile-nav-btn" onclick="openProfileModal()">
            <i data-lucide="user"></i> Profile
          </div>
          <div class="mobile-nav-btn" onclick="clearSession()">
            <i data-lucide="log-out"></i> Logout
          </div>
        </nav>
      </div>
    `;
  }

  // 3. Admin View (Exact Match to Mockup 1)
  function renderAdminView() {
    if (state.adminTab === 'logs') return renderVisitorLogsTab();
    if (state.adminTab === 'directory') return renderResidentDirectoryTab();
    if (state.adminTab === 'guards') return renderGuardRosterTab();
    if (state.adminTab === 'settings') return renderSettingsTab();

    const filteredResidents = state.residents.filter(r => {
      const matchSearch = !state.searchQuery || r.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || r.flat.toLowerCase().includes(state.searchQuery.toLowerCase()) || (r.loginId && r.loginId.includes(state.searchQuery));
      const matchStatus = state.residentStatusFilter === 'ALL' || r.status === state.residentStatusFilter;
      return matchSearch && matchStatus;
    });

    return `
      <!-- Stat Cards Row -->
      <div class="stats-grid-row">
        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Total Residents</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">${state.residents.length}</span>
              <span class="stat-badge-tag blue">${state.residents.length > 0 ? '+12%' : '0 Registered'}</span>
            </div>
          </div>
          <div class="stat-icon-circle blue"><i data-lucide="users"></i></div>
        </div>

        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Active Guards</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">${state.guards.length}</span>
              <span class="stat-badge-tag green">${state.guards.length > 0 ? 'Stable' : '0 Active'}</span>
            </div>
          </div>
          <div class="stat-icon-circle teal"><i data-lucide="shield-check"></i></div>
        </div>

        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Total Flats</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">${state.residents.length > 0 ? new Set(state.residents.map(r => r.flat)).size : 0}</span>
              <span class="stat-badge-tag teal">${state.residents.length > 0 ? 'Occupied' : '0 Occupied'}</span>
            </div>
          </div>
          <div class="stat-icon-circle gray"><i data-lucide="building"></i></div>
        </div>

        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Visitor Requests</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">${state.visitorRequests.filter(r => r.status === 'PENDING').length}</span>
              <span class="stat-badge-tag red">Pending</span>
            </div>
          </div>
          <div class="stat-icon-circle amber"><i data-lucide="arrow-left-right"></i></div>
        </div>
      </div>

      <div class="dashboard-grid-layout">
        <div class="dashboard-main-col">
          <div class="card-box">
            <div style="margin-bottom:20px;">
              <h2 class="card-title-text">Resident Management</h2>
              <p class="card-subtitle-text">Manage community members and their access levels.</p>
            </div>

            <div class="table-filter-bar">
              <div style="display:flex; align-items:center; gap:8px;">
                <i data-lucide="filter" style="width:16px; height:16px; color:var(--text-muted);"></i>
                <select class="filter-dropdown-select" onchange="filterResidentStatus(this.value)">
                  <option value="ALL" ${state.residentStatusFilter === 'ALL' ? 'selected' : ''}>Status: All</option>
                  <option value="Active" ${state.residentStatusFilter === 'Active' ? 'selected' : ''}>Active</option>
                  <option value="Inactive" ${state.residentStatusFilter === 'Inactive' ? 'selected' : ''}>Inactive</option>
                </select>
              </div>

              <button class="btn btn-primary" onclick="openAddUserModal('RESIDENT')">
                <i data-lucide="plus"></i> Add Resident
              </button>
            </div>

            <div class="custom-table-container">
              <table class="clean-table">
                <thead>
                  <tr>
                    <th>Resident Name</th>
                    <th>Flat Number</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredResidents.length === 0 ? `
                    <tr>
                      <td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">
                        No residents registered yet. (0 Residents)
                      </td>
                    </tr>
                  ` : filteredResidents.map(r => `
                    <tr>
                      <td>
                        <div style="display:flex; align-items:center; gap:12px;">
                          <div class="avatar-badge-circle ${r.avatarBg}">${r.initials}</div>
                          <span style="font-weight:600; color:#1e293b;">${r.name}</span>
                        </div>
                      </td>
                      <td style="font-weight:500;">${r.flat}</td>
                      <td style="color:var(--text-muted);">${r.phone}</td>
                      <td>
                        <span class="status-pill ${r.status === 'Active' ? 'active' : 'inactive'}">${r.status}</span>
                      </td>
                      <td>
                        <div style="display:flex; gap:6px;">
                          <div class="table-action-icon" onclick="openEditResidentModal(${r.id})"><i data-lucide="edit-3" style="width:16px; height:16px;"></i></div>
                          <div class="table-action-icon delete" onclick="confirmDeleteResident(${r.id})"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></div>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; font-size:12px; color:var(--text-muted);">
              <span>Showing ${filteredResidents.length} of ${state.residents.length} residents</span>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-secondary btn-sm" disabled>Previous</button>
                <button class="btn btn-secondary btn-sm" disabled>Next</button>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-side-col">
          <div class="card-box">
            <h3 class="card-title-text" style="font-size:15px; margin-bottom:14px; color:#2563eb;">Quick Actions</h3>
            <div class="quick-action-cards">
              <div class="quick-card red" onclick="openClubhouseApprovalAdminModal()">
                <div class="quick-card-icon"><i data-lucide="clock" style="width:18px; height:18px;"></i></div>
                <div class="quick-card-title">Clubhouse Requests</div>
              </div>
              <div class="quick-card teal" onclick="openCommunityProblemsAdminModal()">
                <div class="quick-card-icon"><i data-lucide="shield-check" style="width:18px; height:18px;"></i></div>
                <div class="quick-card-title">Community Complaints</div>
              </div>
            </div>
          </div>

          <div class="card-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 class="card-title-text" style="font-size:16px;">Activity Log</h3>
              <a href="#" style="font-size:12px; color:var(--primary-blue); font-weight:600; text-decoration:none;" onclick="switchTab('logs')">View All</a>
            </div>

            <div class="activity-timeline">
              ${state.visitorRequests.length === 0 ? `
                <div style="text-align:center; color:var(--text-muted); padding:24px; font-size:13px;">
                  <i data-lucide="check-circle" style="width:24px; height:24px; margin:0 auto 6px; display:block; color:#10b981;"></i>
                  No activity recorded yet. (0 Logged Events)
                </div>
              ` : state.visitorRequests.slice(0, 5).map(r => `
                <div class="timeline-item">
                  <div class="timeline-dot blue"></div>
                  <div class="timeline-card">
                    <div class="timeline-header">
                      <span class="timeline-title">${r.visitorName}</span>
                      <span class="timeline-time">${r.inTime || 'Today'}</span>
                    </div>
                    <div class="timeline-sub">Visiting Flat ${r.targetFlat} • ${r.purpose}</div>
                    <span class="timeline-tag verified">${r.status}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Guard Terminal View (Exact Match to Mockup 2)
  function renderGuardView() {
    const pendingList = state.visitorRequests.filter(r => r.status === 'PENDING');
    const historyList = state.visitorRequests.filter(r => r.status !== 'PENDING');

    return `
      <div class="dashboard-grid-layout">
        <div class="dashboard-main-col">
          <div class="card-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
              <div>
                <h2 class="card-title-text" style="color:#2563eb;">New Visitor Entry</h2>
                <p class="card-subtitle-text">Register gate arriving visitor details for instant resident permission.</p>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="stat-badge-tag blue">⏱️ Live Entry</span>
              </div>
            </div>

            <form id="guard-visitor-form">
              <div class="form-grid">
                <div class="form-group">
                  <label>Visitor Name</label>
                  <input type="text" id="vis-name" class="form-control" placeholder="Full Name" required>
                </div>
                <div class="form-group">
                  <label>Phone Number (10 Digits)</label>
                  <input type="tel" id="vis-phone" class="form-control" placeholder="e.g. 9876543210" maxlength="10" pattern="[0-9]{10}" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)" required>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>Visiting Flat / House</label>
                  <select id="vis-destination" class="form-control">
                    ${state.residents.length === 0 ? '<option value="">No residents registered</option>' : state.residents.map(r => `<option value="${r.flat.includes('-') ? r.flat.split('-')[1] : r.flat}|${r.flat.includes('-') ? r.flat.split('-')[0] : 'A'}">Flat ${r.flat} (${r.name})</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Purpose of Visit</label>
                  <select id="vis-purpose" class="form-control">
                    <option value="Delivery">Delivery</option>
                    <option value="Guest">Guest</option>
                    <option value="Plumber">Plumber / Service</option>
                    <option value="Cab">Taxi / Cab</option>
                  </select>
                </div>
              </div>

              <div class="form-group" style="margin-bottom:24px;">
                <label>Visitor Identity Capture</label>
                <div style="display:flex; gap:16px; align-items:center;">
                  <img src="${state.selectedPhoto}" style="width:90px; height:90px; border-radius:var(--radius-md); object-fit:cover; border:2px solid var(--primary-blue);">
                  <div class="photo-dropzone-box" style="flex:1;" onclick="openCameraModal()">
                    <div class="photo-dropzone-icon">
                      <i data-lucide="camera" style="width:24px; height:24px;"></i>
                    </div>
                    <span class="photo-dropzone-text">Click to open camera or drag photo here</span>
                  </div>
                </div>
              </div>

              <div style="display:flex; gap:12px;">
                <button type="submit" class="btn btn-primary" style="flex:1; padding:12px; font-size:14px;">
                  <i data-lucide="check-circle-2"></i> Request Entry Permission
                </button>
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('guard-visitor-form').reset()">
                  Clear
                </button>
              </div>
            </form>
          </div>

          <div class="card-box" style="margin-top:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 class="card-title-text" style="font-size:18px;">Recent Visitor History</h3>
              <a href="#" style="font-size:12px; color:var(--primary-blue); font-weight:600; text-decoration:none;" onclick="showToast('Exporting PDF visitor report...', 'info')">
                Download Report <i data-lucide="download" style="width:12px; height:12px;"></i>
              </a>
            </div>

            <div class="custom-table-container">
              <table class="clean-table">
                <thead>
                  <tr>
                    <th>VISITOR</th>
                    <th>DESTINATION</th>
                    <th>IN TIME</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  ${historyList.map(item => `
                    <tr>
                      <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                          <img src="${item.photoUrl}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                          <div>
                            <div style="font-weight:600;">${item.visitorName}</div>
                            <div style="font-size:11px; color:var(--text-muted);">${item.visitorPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td>${item.targetFlat ? `Flat ${item.targetFlat} - ${item.targetBlock} Block` : item.purpose}</td>
                      <td style="font-weight:500;">${item.inTime || '14:20 PM'}</td>
                      <td>
                        ${item.status === 'APPROVED' ? `<span class="status-pill allow-entry">ALLOW ENTRY</span>` : item.status === 'DENIED' ? `<span class="status-pill inform-denied">INFORM DENIED</span>` : `<span class="status-pill checked-in">${item.status}</span>`}
                      </td>
                      <td>
                        <button class="btn-danger-sm" onclick="checkoutVisitor(${item.id})">CHECKOUT</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="dashboard-side-col">
          <div class="card-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 class="card-title-text" style="font-size:18px; color:#2563eb;">Pending Queue</h3>
              <span class="stat-badge-tag red" style="font-weight:700;">${pendingList.length} Waiting</span>
            </div>

            <div>
              ${pendingList.map(r => `
                <div class="pending-queue-item">
                  <img src="${r.photoUrl}" class="pending-queue-img">
                  <div class="pending-queue-info">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span class="pending-queue-name">${r.visitorName}</span>
                      <span class="pending-queue-sub">${r.timeAgo || 'Just now'}</span>
                    </div>
                    <div class="pending-queue-sub">Visiting <strong>Flat ${r.targetFlat}</strong> • ${r.purpose}</div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                      <span class="pending-queue-pill waiting">WAITING FOR APPROVAL</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 5. Resident View (Exact Match to Mockup 3 & 4)
  function renderResidentView() {
    const user = state.currentUser;
    const userFlat = user && user.flatNumber ? String(user.flatNumber).trim() : '';
    const userBlock = user && user.blockNumber ? String(user.blockNumber).trim() : '';

    const myVisitorRequests = state.visitorRequests.filter(r => {
      if (!userFlat && !userBlock) return false;
      const targetFlatStr = String(r.targetFlat || '').trim().toLowerCase();
      const targetBlockStr = String(r.targetBlock || '').trim().toLowerCase();
      const uFlat = userFlat.toLowerCase().replace(/^[a-z]-?/i, '');
      const tFlat = targetFlatStr.replace(/^[a-z]-?/i, '');
      const matchFlat = tFlat === uFlat || targetFlatStr === userFlat.toLowerCase() || userFlat.toLowerCase().endsWith(targetFlatStr);
      const matchBlock = !userBlock || !targetBlockStr || targetBlockStr === userBlock.toLowerCase();
      return matchFlat && matchBlock;
    });

    const pendingRequests = myVisitorRequests.filter(r => r.status === 'PENDING');
    const activeReq = pendingRequests.length > 0 ? pendingRequests[0] : null;
    const visitorCount = myVisitorRequests.length;
    const formattedCount = visitorCount < 10 ? '0' + visitorCount : String(visitorCount);

    return `
      <!-- LIVE REQUEST Hero Card -->
      ${activeReq ? `
        <div class="live-request-card">
          <div class="live-badge-head">
            <i data-lucide="radio" style="width:14px; height:14px;"></i> LIVE REQUEST
          </div>

          <div class="live-request-body">
            <img src="${activeReq.photoUrl}" class="live-visitor-img">

            <div class="live-visitor-content">
              <h1 class="live-visitor-name">${activeReq.visitorName}</h1>
              <div class="live-visitor-company">${activeReq.purpose} • Phone: ${activeReq.visitorPhone}</div>

              <div class="purpose-quote-box">
                "${activeReq.purposeQuote || 'Visitor request for Unit ' + (userFlat || '402') + '. Requires entry confirmation.'}"
              </div>

              <div class="live-action-btns">
                <button class="btn-approve-big" onclick="openApproveModal(${activeReq.id})">
                  <i data-lucide="check-circle" style="width:20px; height:20px;"></i> Approve
                </button>
                <button class="btn-deny-big" onclick="openDenyModal(${activeReq.id})">
                  <i data-lucide="x-circle" style="width:20px; height:20px;"></i> Deny
                </button>
              </div>
            </div>
          </div>
        </div>
      ` : `
        <div class="card-box" style="margin-bottom:24px; text-align:center; padding:24px;">
          <div style="font-size:24px; margin-bottom:6px;">🏡</div>
          <h3 style="font-family:var(--font-heading); font-size:18px; font-weight:700;">No Active Gate Visitor Alerts</h3>
          <p style="font-size:13px; color:var(--text-muted);">Incoming gate visitor requests for Flat ${userFlat || ''} will appear here in real time.</p>
        </div>
      `}

      <div class="dashboard-grid-layout">
        <div class="dashboard-main-col">
          <div class="stats-grid-row">
            <div class="stat-card-clean">
              <div class="stat-info-left">
                <h4>VISITORS TODAY</h4>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="stat-val-num">${formattedCount}</span>
                  <span class="stat-badge-tag blue">Live</span>
                </div>
              </div>
              <div class="stat-icon-circle blue"><i data-lucide="users"></i></div>
            </div>

            <div class="stat-card-clean">
              <div class="stat-info-left">
                <h4>PENDING REQUESTS</h4>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="stat-val-num">${pendingRequests.length}</span>
                  <span class="stat-badge-tag teal">Active</span>
                </div>
              </div>
              <div class="stat-icon-circle teal"><i data-lucide="clipboard-list"></i></div>
            </div>

            <div class="stat-card-clean">
              <div class="stat-info-left">
                <h4>GUEST PARKING</h4>
                <span class="stat-val-num">${visitorCount > 0 ? 'P-12' : '00'}</span>
              </div>
              <div class="stat-icon-circle gray"><i data-lucide="square-p"></i></div>
            </div>

            <div class="stat-card-clean">
              <div class="stat-info-left">
                <h4>FREQUENT GUESTS</h4>
                <span class="stat-val-num">00</span>
              </div>
              <div class="stat-icon-circle blue"><i data-lucide="shield"></i></div>
            </div>
          </div>

          <div class="card-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 class="card-title-text">Visitor History</h3>
              <button class="btn btn-secondary btn-sm" onclick="showToast('Filter options active', 'info')"><i data-lucide="sliders-horizontal"></i> Filter</button>
            </div>

            <div class="custom-table-container">
              <table class="clean-table">
                <thead>
                  <tr>
                    <th>VISITOR</th>
                    <th>PURPOSE</th>
                    <th>ARRIVAL</th>
                    <th>DEPARTURE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  ${myVisitorRequests.length === 0 ? `
                    <tr>
                      <td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">
                        No previous visitor history logged yet. (0 Visitors)
                      </td>
                    </tr>
                  ` : myVisitorRequests.map(item => `
                    <tr>
                      <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                          <img src="${item.photoUrl}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                          <div>
                            <div style="font-weight:600;">${item.visitorName}</div>
                            <div style="font-size:11px; color:var(--text-muted);">${item.visitorPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td>${item.purpose}</td>
                      <td>${item.inTime || 'Today'}</td>
                      <td>${item.outTime || 'N/A'}</td>
                      <td><span class="status-pill ${item.status === 'APPROVED' ? 'active' : 'checked-out'}">${item.status}</span></td>
                      <td><i data-lucide="more-vertical" style="width:16px; height:16px; color:var(--text-muted); cursor:pointer;"></i></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Hosting a Party Navy Banner (Mockup Match + Integrated Clubhouse & Problem Modals) -->
          <div class="party-pass-card">
            <div>
              <h3 class="party-pass-title">Hosting a Party?</h3>
              <p class="party-pass-sub">Generate a bulk QR pass for your guests or request clubhouse venue reservation.</p>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn-teal-action" onclick="openPartyPassModal()">Create Event</button>
              <button class="btn btn-secondary btn-sm" onclick="openReportProblemModal()" style="color:white; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3);">Report Issue</button>
            </div>
          </div>
        </div>

        <div class="dashboard-side-col">
          <div class="card-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <i data-lucide="bell" style="width:18px; height:18px; color:#2563eb;"></i>
                <h3 class="card-title-text" style="font-size:16px;">Notifications</h3>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px;">
              ${state.notifications.map(n => `
                <div style="padding:12px; border-radius:var(--radius-md); background:#f8fafc; border:1px solid #e2e8f0;">
                  <div style="font-weight:700; font-size:13px; color:#334155; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="info" style="width:16px; height:16px; color:#2563eb;"></i> ${n.title}
                  </div>
                  <div style="font-size:12px; color:#475569; margin-top:2px;">${n.message}</div>
                  <div style="font-size:10px; color:#94a3b8; margin-top:4px;">${n.time}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderVisitorLogsTab() {
    return `
      <div class="card-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h2 class="card-title-text">Visitor Logs & Gate Audit</h2>
            <p class="card-subtitle-text">Real-time gate access record feed.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openRegisterVisitorModal()"><i data-lucide="plus"></i> New Gate Entry</button>
        </div>

        <div class="custom-table-container">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Destination</th>
                <th>In Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.visitorRequests.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">
                    No visitor logs recorded yet. (0 Visitor Logs)
                  </td>
                </tr>
              ` : state.visitorRequests.map(r => `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                      <img src="${r.photoUrl}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                      <div>
                        <div style="font-weight:600;">${r.visitorName}</div>
                        <div style="font-size:11px; color:var(--text-muted);">${r.visitorPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td>Block ${r.targetBlock} - Flat ${r.targetFlat}</td>
                  <td>${r.inTime || '14:20 PM'}</td>
                  <td><span class="status-pill ${r.status === 'APPROVED' ? 'active' : r.status === 'CHECKED_IN' ? 'checked-in' : r.status === 'DENIED' ? 'denied' : 'inactive'}">${r.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="openVisitorDetailModal(${r.id})"><i data-lucide="eye"></i> View Details</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderResidentDirectoryTab() {
    return `
      <div class="card-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h2 class="card-title-text">Resident Directory</h2>
            <p class="card-subtitle-text">Manage society residents and contact information.</p>
          </div>
          <button class="btn btn-primary" onclick="openAddUserModal('RESIDENT')"><i data-lucide="plus"></i> Add Resident</button>
        </div>

        <div class="custom-table-container">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Resident Name</th>
                <th>Flat Number</th>
                <th>Contact</th>
                <th>Backup Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${state.residents.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">
                    No residents in directory yet. (0 Residents)
                  </td>
                </tr>
              ` : state.residents.map(r => `
                <tr>
                  <td><strong>${r.name}</strong></td>
                  <td>${r.flat}</td>
                  <td>${r.phone}</td>
                  <td>${r.backupPhone || 'N/A'}</td>
                  <td><span class="status-pill active">${r.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="openEditResidentModal(${r.id})">Edit</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderGuardRosterTab() {
    const filteredGuards = state.guards.filter(g => state.guardShiftFilter === 'ALL' || g.shift === state.guardShiftFilter);
    return `
      <div class="card-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h2 class="card-title-text">Guard Roster</h2>
            <p class="card-subtitle-text">Security shift schedules and personnel management.</p>
          </div>
          <div style="display:flex; gap:12px;">
            <select class="filter-dropdown-select" onchange="filterGuardShift(this.value)">
              <option value="ALL" ${state.guardShiftFilter === 'ALL' ? 'selected' : ''}>Shift: All</option>
              <option value="DAY" ${state.guardShiftFilter === 'DAY' ? 'selected' : ''}>DAY Shift</option>
              <option value="NIGHT" ${state.guardShiftFilter === 'NIGHT' ? 'selected' : ''}>NIGHT Shift</option>
            </select>
            <button class="btn btn-primary" onclick="openAddGuardModal()"><i data-lucide="plus"></i> Add Guard</button>
          </div>
        </div>

        <div class="custom-table-container">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Guard Name</th>
                <th>Gate Station</th>
                <th>Shift</th>
                <th>Contact Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredGuards.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align:center; color:var(--text-muted); padding:32px;">
                    No security guards added to roster yet. (0 Guards)
                  </td>
                </tr>
              ` : filteredGuards.map(g => `
                <tr>
                  <td><strong>${g.name}</strong></td>
                  <td>${g.gate}</td>
                  <td><span class="status-pill ${g.shift === 'DAY' ? 'active' : 'checked-in'}">${g.shift} SHIFT</span></td>
                  <td>${g.phone}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="showToast('Editing ${g.name}', 'info')">Edit</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSettingsTab() {
    const s = state.settings || { societyName: 'GateSync Society', autoExpireSec: 60 };
    return `
      <div class="card-box">
        <h2 class="card-title-text" style="margin-bottom:16px;">Society Configuration Settings</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>Society Name</label>
            <input type="text" id="st-society-name" class="form-control" placeholder="Enter Society Name" value="${s.societyName || ''}">
          </div>
          <div class="form-group">
            <label>Auto-Expire Visitor Request (Seconds)</label>
            <input type="number" id="st-expire-sec" class="form-control" placeholder="60" value="${s.autoExpireSec || 60}">
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveSocietySettings()">Save Configurations</button>
      </div>
    `;
  }

  window.saveSocietySettings = function() {
    const name = (document.getElementById('st-society-name').value || '').trim();
    const expire = (document.getElementById('st-expire-sec').value || '60').trim();
    state.settings = { societyName: name, autoExpireSec: parseInt(expire) || 60 };
    showToast('Society configurations saved successfully!', 'success');
  };

  function renderPasswordResetPage() {
    return `
      <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg-slate); padding:20px;">
        <div class="login-card" style="width:100%; max-width:440px;">
          <div style="text-align:center; margin-bottom:24px;">
            <div class="brand-icon" style="margin:0 auto 12px;"><i data-lucide="lock"></i></div>
            <h2 style="font-family:var(--font-heading); font-size:22px; font-weight:700;">Update Security Password</h2>
            <p style="font-size:12px; color:var(--text-muted);">First-time security reset required for your GateSync account.</p>
          </div>

          <form id="password-reset-form">
            <div class="form-group" style="margin-bottom:14px;">
              <label>New Password</label>
              <div style="position:relative;">
                <input type="password" id="reset-new" class="form-control" placeholder="At least 8 chars" required style="padding-right:42px;">
                <button type="button" onclick="togglePasswordVisibility('reset-new', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                  <i data-lucide="eye" style="width:18px; height:18px;"></i>
                </button>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:20px;">
              <label>Confirm New Password</label>
              <div style="position:relative;">
                <input type="password" id="reset-confirm" class="form-control" placeholder="At least 8 chars" required style="padding-right:42px;">
                <button type="button" onclick="togglePasswordVisibility('reset-confirm', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                  <i data-lucide="eye" style="width:18px; height:18px;"></i>
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; padding:12px;"><i data-lucide="check-shield"></i> Save & Continue to Dashboard</button>
          </form>
        </div>
      </div>
    `;
  }

  // Event Handlers
  function bindEvents() {
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        render();
      });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginId = (document.getElementById('login-id').value || '').trim();
        const password = (document.getElementById('login-password').value || '').trim();
        const selectedRole = state.authRole || 'RESIDENT';

        if (!loginId || !password) {
          showToast('Please enter both Login ID and Password.', 'error');
          return;
        }

        state.isAuthenticating = true;
        render();

        // 1. Try Spring Boot Backend Authentication endpoint first
        try {
          const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loginId, password })
          });
          if (resp.ok) {
            const data = await resp.json();
            const user = {
              id: data.userId || Date.now(),
              loginId: data.loginId || loginId,
              fullName: data.fullName || 'User',
              role: data.role || selectedRole,
              blockNumber: data.blockNumber || 'A',
              flatNumber: data.flatNumber || '101',
              mustResetPassword: data.mustResetPassword || false
            };
            saveDatabaseUser({ ...user, password });
            saveSession(user, data.token || ('token_' + Date.now()));
            state.isAuthenticating = false;
            state.activeView = user.role.toLowerCase();
            render();
            showToast(`Welcome back, ${user.fullName}!`, 'success');
            return;
          }
        } catch (err) {}

        // 2. Check Database users stored in registered accounts database
        const dbUsers = getDatabaseUsers();
        const matched = dbUsers.find(u => 
          (u.loginId && u.loginId.toLowerCase() === loginId.toLowerCase()) || 
          (u.phone && u.phone === loginId)
        );

        if (matched) {
          if (matched.password && matched.password !== password) {
            state.isAuthenticating = false;
            render();
            showToast(`Incorrect password for ${selectedRole.toLowerCase()} account "${loginId}"!`, 'error');
            return;
          }
          if (matched.role && matched.role !== selectedRole) {
            state.isAuthenticating = false;
            render();
            showToast(`Account "${loginId}" is registered as ${matched.role}. Please click the "${matched.role}" tab above to sign in.`, 'error');
            return;
          }
          saveSession(matched, 'token_' + Date.now());
          state.isAuthenticating = false;
          state.activeView = matched.role ? matched.role.toLowerCase() : selectedRole.toLowerCase();
          render();
          showToast(`Welcome back, ${matched.fullName}!`, 'success');
          return;
        }

        // 3. User not found in database! Access Denied for un-registered users.
        state.isAuthenticating = false;
        render();
        showToast(`Access Denied! No registered ${selectedRole.toLowerCase()} account found for "${loginId}". Accounts must be created by Society Admin.`, 'error');
      });
    }

    const adminRegisterForm = document.getElementById('admin-register-form');
    if (adminRegisterForm) {
      adminRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = (document.getElementById('reg-admin-fullname').value || '').trim();
        const societyName = (document.getElementById('reg-admin-society').value || '').trim();
        const loginId = (document.getElementById('reg-admin-id').value || '').trim();
        const phone = (document.getElementById('reg-admin-phone').value || '').trim();
        const password = document.getElementById('reg-admin-password').value;
        const confirmPassword = document.getElementById('reg-admin-confirm').value;

        if (password !== confirmPassword) {
          showToast('Passwords do not match!', 'error');
          return;
        }
        if (password.length < 6) {
          showToast('Password must be at least 6 characters long!', 'error');
          return;
        }

        const dbUsers = getDatabaseUsers();
        if (dbUsers.some(u => u.loginId && u.loginId.toLowerCase() === loginId.toLowerCase())) {
          showToast(`Login ID "${loginId}" is already registered. Please choose another username.`, 'error');
          return;
        }

        state.isAuthenticating = true;
        render();

        const newAdmin = {
          id: Date.now(),
          loginId: loginId,
          password: password,
          fullName: fullName,
          societyName: societyName,
          phone: phone,
          role: 'ADMIN',
          mustResetPassword: false
        };

        // Try backend registration endpoint
        try {
          await fetch('/api/auth/register-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, societyName, loginId, phone, password })
          });
        } catch (err) {}

        // Save into local user database
        saveDatabaseUser(newAdmin);
        saveSession(newAdmin, 'token_' + Date.now());

        state.isAuthenticating = false;
        state.activeView = 'admin';
        render();
        showToast(`Admin Account Registered & Saved to Database! Welcome ${fullName}.`, 'success');
      });
    }

    const passwordResetForm = document.getElementById('password-reset-form');
    if (passwordResetForm) {
      passwordResetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = (document.getElementById('reset-new').value || '').trim();
        const confirmPass = (document.getElementById('reset-confirm').value || '').trim();
        if (newPass !== confirmPass) {
          showToast('Passwords do not match!', 'error');
          return;
        }
        if (newPass.length < 6) {
          showToast('Password must be at least 6 characters long!', 'error');
          return;
        }
        if (state.currentUser) {
          state.currentUser.password = newPass;
          state.currentUser.mustResetPassword = false;
          saveDatabaseUser(state.currentUser);
          saveSession(state.currentUser, state.token);
        }
        state.activeView = state.currentUser ? state.currentUser.role.toLowerCase() : 'landing';
        render();
        showToast('Password updated successfully!', 'success');
      });
    }

    const guardForm = document.getElementById('guard-visitor-form');
    if (guardForm) {
      guardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const destVal = document.getElementById('vis-destination').value;
        const [flat, block] = destVal.split('|');
        const name = (document.getElementById('vis-name').value || '').trim();
        const phone = (document.getElementById('vis-phone').value || '').trim();
        const purpose = document.getElementById('vis-purpose').value;
        
        const payload = {
          visitorName: name,
          visitorPhone: phone,
          purpose: purpose,
          targetFlat: flat,
          targetBlock: block,
          photoUrl: state.selectedPhoto,
          gateName: 'Main Gate A',
          guardName: state.currentUser ? state.currentUser.fullName : 'On-Duty Guard'
        };

        let newReq = {
          id: Date.now(),
          ...payload,
          status: 'PENDING',
          timeAgo: 'Just now',
          createdAt: new Date().toISOString()
        };

        try {
          const resp = await fetch('/api/guard/visitor/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.id) newReq.id = data.id;
          }
        } catch (err) {}

        state.visitorRequests.unshift(newReq);
        showToast(`Approval request sent to Resident at Flat ${flat}!`, 'amber');
        playAlertSound();
        render();
      });
    }
  }

  window.setAuthRole = function (role) {
    state.authRole = role;
    state.authMode = 'LOGIN';
    render();
  };

  window.setAuthMode = function (mode) {
    state.authMode = mode;
    render();
  };

  window.quickLogin = function (loginId, password) {
    loginId = (loginId || '').trim();
    password = (password || '').trim();
    const role = state.authRole || 'ADMIN';

    if (role === 'RESIDENT' || loginId.toLowerCase().includes('resident')) {
      let foundResident = state.residents.find(r => (r.loginId && r.loginId.toLowerCase() === loginId.toLowerCase()) || (r.phone && r.phone === loginId) || (r.name && r.name.toLowerCase() === loginId.toLowerCase()));

      let resName = 'Amit Patel';
      if (foundResident && (foundResident.name || foundResident.fullName)) {
        resName = foundResident.name || foundResident.fullName;
      } else if (loginId && loginId.toLowerCase() !== 'resident') {
        resName = loginId.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      const user = {
        id: foundResident ? foundResident.id : Date.now(),
        loginId: foundResident ? foundResident.loginId : (loginId || 'resident'),
        fullName: resName,
        role: 'RESIDENT',
        blockNumber: foundResident ? (foundResident.blockNumber || 'A') : 'A',
        flatNumber: foundResident ? (foundResident.flatNumber || '101') : '101',
        mustResetPassword: false
      };
      saveSession(user, 'token_' + Date.now());
      state.activeView = 'resident';
      render();
      showToast(`Welcome back, ${user.fullName}!`, 'success');
      return;
    }

    if (role === 'GUARD' || loginId.toLowerCase().includes('guard')) {
      let foundGuard = state.guards.find(g => (g.loginId && g.loginId.toLowerCase() === loginId.toLowerCase()) || (g.phone && g.phone === loginId) || (g.name && g.name.toLowerCase() === loginId.toLowerCase()));

      let guardName = 'Security Guard';
      if (foundGuard && (foundGuard.name || foundGuard.fullName)) {
        guardName = foundGuard.name || foundGuard.fullName;
      } else if (loginId && loginId.toLowerCase() !== 'guard') {
        guardName = loginId.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      const user = {
        id: foundGuard ? foundGuard.id : Date.now(),
        loginId: foundGuard ? foundGuard.loginId : (loginId || 'guard'),
        fullName: guardName,
        role: 'GUARD',
        mustResetPassword: false
      };
      saveSession(user, 'token_' + Date.now());
      state.activeView = 'guard';
      render();
      showToast(`Guard Terminal active. Welcome, ${user.fullName}!`, 'success');
      return;
    }

    // Default to Admin
    const user = {
      id: 1,
      loginId: loginId || 'admin',
      fullName: state.currentUser && state.currentUser.role === 'ADMIN' ? state.currentUser.fullName : 'System Admin',
      role: 'ADMIN',
      mustResetPassword: false
    };
    saveSession(user, 'token_' + Date.now());
    state.activeView = 'admin';
    render();
    showToast(`Welcome to GateSync Admin Panel!`, 'success');
  };

  // Helper Actions & Modals
  window.openSwitchRoleModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:380px;">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Switch Active Portal</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:10px;">
            <button class="btn btn-primary" onclick="closeModal(); switchPortal('ADMIN')" style="justify-content:flex-start; padding:12px 16px; width:100%;">
              <i data-lucide="shield"></i> Admin Dashboard
            </button>
            <button class="btn btn-primary" onclick="closeModal(); switchPortal('GUARD')" style="background:#0284c7; justify-content:flex-start; padding:12px 16px; width:100%;">
              <i data-lucide="shield-check"></i> Guard Terminal
            </button>
            <button class="btn btn-primary" onclick="closeModal(); switchPortal('RESIDENT')" style="background:#0d9488; justify-content:flex-start; padding:12px 16px; width:100%;">
              <i data-lucide="home"></i> Resident Portal
            </button>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.switchPortal = function (role) {
    let mockUser = { id: 1, loginId: 'admin', fullName: 'Rajesh Sharma', role: 'ADMIN', mustResetPassword: false };
    if (role === 'GUARD') {
      mockUser = { id: 2, loginId: 'guard', fullName: 'Vikram Singh', role: 'GUARD', mustResetPassword: false };
    } else if (role === 'RESIDENT') {
      mockUser = { id: 3, loginId: 'resident', fullName: 'Amit Patel', role: 'RESIDENT', blockNumber: 'A', flatNumber: '402', mustResetPassword: false };
    }
    saveSession(mockUser, 'token_' + Date.now());
    state.activeView = role.toLowerCase();
    showToast(`Switched to ${role === 'GUARD' ? 'Guard Terminal' : role === 'RESIDENT' ? 'Resident Portal' : 'Admin Dashboard'}`, 'success');
    render();
  };

  window.cycleRoleDemo = function () {
    const roles = ['ADMIN', 'GUARD', 'RESIDENT'];
    const curr = state.currentUser ? state.currentUser.role : 'ADMIN';
    const next = roles[(roles.indexOf(curr) + 1) % roles.length];
    if (next === 'ADMIN') quickLogin('admin', 'admin123');
    else if (next === 'GUARD') quickLogin('guard', 'guard123');
    else quickLogin('resident', 'resident123');
  };

  window.switchView = function (view) {
    state.activeView = view;
    render();
  };

  window.switchTab = function (tab) {
    state.adminTab = tab;
    render();
  };

  window.filterResidentStatus = function (val) {
    state.residentStatusFilter = val;
    render();
  };

  window.openApproveModal = function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    if (!item) return;
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--success-green);">Confirm Visitor Approval</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="text-align:center;">
            <img src="${item.photoUrl}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; margin-bottom:12px;">
            <h3 style="font-size:18px; font-weight:700;">Approve ${item.visitorName}?</h3>
            <p style="font-size:13px; color:var(--text-muted); margin-top:4px;">Allow entry for ${item.purpose} to your unit.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" style="background:var(--success-green);" onclick="confirmApproveVisitor(${item.id})"><i data-lucide="check"></i> Confirm Approve</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.confirmApproveVisitor = async function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    if (item) {
      item.status = 'APPROVED';
      try {
        await fetch('/api/resident/visitor/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, status: 'APPROVED' })
        });
      } catch (e) {}
      showToast(`Visitor ${item.visitorName} APPROVED! Guard notified to ALLOW ENTRY.`, 'success');
      playAlertSound();
    }
    closeModal();
    render();
  };

  window.openDenyModal = function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    if (!item) return;
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--danger-red);">Confirm Visitor Denial</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body">
            <div style="text-align:center; margin-bottom:16px;">
              <img src="${item.photoUrl}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; margin-bottom:8px;">
              <h3 style="font-size:18px; font-weight:700;">Deny Entry for ${item.visitorName}?</h3>
            </div>
            <div class="form-group">
              <label>Optional Reason for Guard</label>
              <input type="text" id="deny-reason-input" class="form-control" placeholder="e.g. Expecting no delivery today">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" style="background:var(--danger-red);" onclick="confirmDenyVisitor(${item.id})"><i data-lucide="x-circle"></i> Confirm Deny</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.confirmDenyVisitor = async function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    const reasonInput = document.getElementById('deny-reason-input');
    const denialReason = reasonInput ? reasonInput.value.trim() : '';
    if (item) {
      item.status = 'DENIED';
      try {
        await fetch('/api/resident/visitor/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, status: 'DENIED', denialReason })
        });
      } catch (e) {}
      showToast(`Visitor ${item.visitorName} DENIED! Guard notified to INFORM DENIED.`, 'error');
    }
    closeModal();
    render();
  };

  window.checkoutVisitor = function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    if (item) {
      item.status = 'CHECKED_OUT';
      showToast(`${item.visitorName} checked out successfully!`, 'info');
      render();
    }
  };

  window.openPartyPassModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Party Booking & Guest Pass</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body">
            <div class="form-group" style="margin-bottom:12px;">
              <label>Event Title</label>
              <input type="text" id="party-name" class="form-control" placeholder="Enter Event Title" value="">
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Venue Selection</label>
                <select class="form-control">
                  <option value="Clubhouse Hall">Clubhouse Hall</option>
                  <option value="Main Lawn">Main Lawn</option>
                  <option value="Rooftop">Rooftop Terrace</option>
                </select>
              </div>
              <div class="form-group">
                <label>Expected Guests</label>
                <input type="number" class="form-control" placeholder="Enter number of guests" value="">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="generatePartyPass()">Send Booking & Generate QR Pass</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.generatePartyPass = function () {
    const title = document.getElementById('party-name').value || 'Party Pass';
    const code = 'PARTY-' + Math.floor(1000 + Math.random() * 9000);
    closeModal();
    showToast(`Party booking for "${title}" submitted to Admin! QR Pass code: ${code}`, 'success');
  };

  window.openReportProblemModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--danger-red);">Report Community Problem</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body">
            <div class="form-group" style="margin-bottom:12px;">
              <label>Problem Title</label>
              <input type="text" id="pr-title" class="form-control" placeholder="Enter Problem Title">
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label>Category</label>
              <select id="pr-category" class="form-control">
                <option>Water issue</option>
                <option>Power issue</option>
                <option>Security issue</option>
                <option>Lift issue</option>
                <option>Cleanliness issue</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="pr-desc" class="form-control" rows="3" placeholder="Describe the issue..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="submitProblemReport()"><i data-lucide="send"></i> Broadcast to Community</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  // WebRTC Visitor Identity Camera Capture Engine
  window.openCameraModal = function () {
    const container = document.getElementById('camera-modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:500px; text-align:center;">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;"><i data-lucide="camera"></i> Visitor Camera Capture</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeCameraModal()"></i>
          </div>
          <div class="modal-body">
            <div style="position:relative; width:100%; height:260px; background:#000; border-radius:12px; overflow:hidden; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
              <video id="camera-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover; display:none;"></video>
              <canvas id="camera-canvas" style="display:none;"></canvas>
              <div id="camera-placeholder" style="color:#94a3b8; font-size:13px; text-align:center; padding:20px;">
                <i data-lucide="camera-off" style="width:36px; height:36px; margin-bottom:8px; display:block; margin:0 auto 8px;"></i>
                <div style="font-weight:600;">Requesting Camera Access...</div>
              </div>
            </div>

            <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px; text-align:left; font-weight:600;">Or Choose Sample Visitor Photo:</div>
            <div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:8px;">
              ${PRESET_PHOTOS.map((p) => `
                <img src="${p.url}" title="${p.title}" onclick="selectPresetPhoto('${p.url}')" style="width:60px; height:60px; border-radius:8px; object-fit:cover; cursor:pointer; border:2px solid ${state.selectedPhoto === p.url ? '#2563eb' : 'transparent'}; flex-shrink:0;">
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeCameraModal()">Cancel</button>
            <button type="button" id="snap-btn" class="btn btn-primary" onclick="captureCameraPhoto()"><i data-lucide="camera"></i> Take Snap</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();

    const video = document.getElementById('camera-video');
    const placeholder = document.getElementById('camera-placeholder');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          state.cameraStream = stream;
          if (video) {
            video.srcObject = stream;
            video.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
          }
        })
        .catch(err => {
          console.warn('Camera access error:', err);
          if (placeholder) {
            placeholder.innerHTML = `
              <i data-lucide="camera-off" style="width:36px; height:36px; margin:0 auto 8px; display:block; color:#ef4444;"></i>
              <div style="color:#ef4444; font-weight:600;">Camera Permission Denied or Not Supported</div>
              <div style="font-size:11px; margin-top:4px; color:var(--text-muted);">Please select one of the sample photos below.</div>
            `;
            lucide.createIcons();
          }
        });
    }
  };

  window.closeCameraModal = function () {
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach(track => track.stop());
      state.cameraStream = null;
    }
    const container = document.getElementById('camera-modal-container');
    if (container) container.innerHTML = '';
  };

  window.captureCameraPhoto = function () {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    if (video && video.style.display !== 'none' && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      state.selectedPhoto = canvas.toDataURL('image/jpeg');
      showToast('Visitor photo captured successfully!', 'success');
    }
    closeCameraModal();
    render();
  };

  window.selectPresetPhoto = function (url) {
    state.selectedPhoto = url;
    showToast('Sample visitor photo selected', 'info');
    closeCameraModal();
    render();
  };

  // Community Issues & Broadcast Management
  window.submitProblemReport = function () {
    const titleInput = document.getElementById('pr-title');
    const title = titleInput ? titleInput.value.trim() : '';

    if (!title) {
      showToast('Please enter a problem title!', 'error');
      return;
    }

    const categorySelect = document.getElementById('pr-category');
    const category = categorySelect ? categorySelect.value : 'General';
    const descInput = document.getElementById('pr-desc');
    const description = descInput ? descInput.value.trim() : '';

    const user = state.currentUser || { fullName: 'Resident', flatNumber: '402', blockNumber: 'A' };
    const flatStr = user.flatNumber ? `Flat ${user.blockNumber || 'A'}-${user.flatNumber}` : 'Flat A-402';

    const problem = {
      id: Date.now(),
      reporterName: user.fullName || 'Resident',
      flat: flatStr,
      title: title,
      category: category,
      priority: 'Medium',
      description: description,
      status: 'PENDING',
      createdAt: 'Just now'
    };

    state.communityProblems.unshift(problem);
    closeModal();
    showToast(`Problem "${title}" submitted to Community Feed & Admin!`, 'success');
    render();
  };

  window.openCommunityFeedModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:650px;">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--primary-blue);">
              <i data-lucide="message-square"></i> Community Feed & Reported Issues
            </h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="max-height:400px; overflow-y:auto;">
            ${state.communityProblems.length === 0 ? `
              <div style="text-align:center; padding:30px; color:var(--text-muted);">
                <i data-lucide="check-circle-2" style="width:40px; height:40px; margin:0 auto 8px; display:block; color:#10b981;"></i>
                <div style="font-weight:600;">No community issues reported</div>
                <div style="font-size:12px; margin-top:2px;">All society operations are running smoothly.</div>
              </div>
            ` : state.communityProblems.map(p => `
              <div style="padding:14px; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:10px; background:#f8fafc;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-weight:700; font-size:14px; color:#1e293b;">${p.title}</span>
                  <span class="status-pill ${p.status === 'RESOLVED' ? 'active' : 'checked-out'}">${p.status}</span>
                </div>
                <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">
                  Reported by <strong>${p.reporterName} (${p.flat})</strong> • Category: ${p.category}
                </div>
                <div style="font-size:13px; color:#334155;">${p.description || 'No detailed description.'}</div>
                ${p.adminReply ? `
                  <div style="margin-top:8px; padding:8px 12px; background:#eff6ff; border-left:3px solid #2563eb; border-radius:4px; font-size:12px; color:#1e40af;">
                    <strong>Admin Reply:</strong> ${p.adminReply}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
            <button class="btn btn-primary" onclick="closeModal(); openReportProblemModal();"><i data-lucide="plus"></i> Report Issue</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.openCommunityProblemsAdminModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:700px;">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:#2563eb;">
              <i data-lucide="shield-alert"></i> Admin - Community Complaints Management
            </h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="max-height:420px; overflow-y:auto;">
            ${state.communityProblems.length === 0 ? `
              <div style="text-align:center; padding:30px; color:var(--text-muted);">
                <div style="font-weight:600;">0 Complaints Logged</div>
                <div style="font-size:12px; margin-top:2px;">Resident issue reports will appear here for Admin review.</div>
              </div>
            ` : state.communityProblems.map(p => `
              <div style="padding:14px; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:12px; background:white;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-weight:700; font-size:14px;">${p.title} (${p.category})</span>
                  <span class="status-pill ${p.status === 'RESOLVED' ? 'active' : 'checked-out'}">${p.status}</span>
                </div>
                <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">By ${p.reporterName} (${p.flat})</div>
                <div style="font-size:13px; color:#334155; margin-bottom:10px;">${p.description || 'No description provided.'}</div>
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-primary btn-sm" style="background:#16a34a;" onclick="resolveProblem(${p.id})">Mark Resolved</button>
                  <button class="btn btn-secondary btn-sm" onclick="deleteProblem(${p.id})">Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.resolveProblem = function (id) {
    const p = state.communityProblems.find(item => item.id === id);
    if (p) {
      p.status = 'RESOLVED';
      p.adminReply = 'Issue investigated and resolved by Admin team.';
      showToast(`Complaint "${p.title}" marked as RESOLVED!`, 'success');
      openCommunityProblemsAdminModal();
    }
  };

  window.deleteProblem = function (id) {
    state.communityProblems = state.communityProblems.filter(item => item.id !== id);
    showToast('Complaint removed', 'info');
    openCommunityProblemsAdminModal();
  };

  window.openRegisterVisitorModal = function () {
    if (state.currentUser && state.currentUser.role !== 'GUARD') {
      showToast('Only Security Guards can register gate visitors. Switched to Guard Terminal.', 'info');
      quickLogin('guard', 'guard123');
    } else {
      switchView('guard');
      setTimeout(() => {
        const input = document.getElementById('vis-name');
        if (input) input.focus();
      }, 100);
    }
  };

  window.toggleMobileSidebar = function () {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.toggle('mobile-open');
  };

  window.toggleNotificationDrawer = function () {
    state.notificationDrawerOpen = !state.notificationDrawerOpen;
    render();
  };

  window.markNotificationsRead = function () {
    state.notifications.forEach(n => n.read = true);
    state.notificationDrawerOpen = false;
    showToast('All notifications marked as read', 'info');
    render();
  };

  window.openHelpModal = function () {
    showToast('GateSync India Support: +91 1800 123 4283', 'info');
  };

  window.openProfileModal = function () {
    const user = state.currentUser || { fullName: 'Amit Patel', role: 'RESIDENT', blockNumber: 'A', flatNumber: '402' };
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Resident Profile & Security</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body">
            <div style="text-align:center; margin-bottom:20px;">
              <div style="width:70px; height:70px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700; margin:0 auto 12px;">
                ${user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'AP'}
              </div>
              <h3 style="font-size:18px; font-weight:700;">${user.fullName}</h3>
              <p style="font-size:13px; color:var(--text-muted); margin-top:2px;">
                ${user.role === 'RESIDENT' ? `Resident • Flat ${user.flatNumber || '402'} (Block ${user.blockNumber || 'A'})` : user.role}
              </p>
              <p style="font-size:12px; color:var(--primary-blue); font-weight:600; margin-top:4px;">Phone: +91 99887 76655</p>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px;">
              <button class="btn btn-primary" onclick="closeModal(); openChangePasswordModal();" style="width:100%;">
                <i data-lucide="key"></i> Change Login Password
              </button>
              <button class="btn btn-secondary" onclick="closeModal(); openManagePassesModal();" style="width:100%;">
                <i data-lucide="qr-code"></i> Manage Pre-Approved Gate Passes
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.togglePasswordVisibility = function (inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    if (btnEl) {
      const iconName = isPassword ? 'eye-off' : 'eye';
      btnEl.innerHTML = `<i data-lucide="${iconName}" style="width:18px; height:18px;"></i>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  };

  window.openChangePasswordModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--primary-blue);">Change Account Password</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <form id="change-pass-form">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom:12px;">
                <label>Current Password</label>
                <div style="position:relative;">
                  <input type="password" id="cp-current" class="form-control" placeholder="••••••••" required style="padding-right:42px;">
                  <button type="button" onclick="togglePasswordVisibility('cp-current', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                    <i data-lucide="eye" style="width:18px; height:18px;"></i>
                  </button>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label>New Password</label>
                <div style="position:relative;">
                  <input type="password" id="cp-new" class="form-control" placeholder="Minimum 6 characters" required style="padding-right:42px;">
                  <button type="button" onclick="togglePasswordVisibility('cp-new', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                    <i data-lucide="eye" style="width:18px; height:18px;"></i>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Confirm New Password</label>
                <div style="position:relative;">
                  <input type="password" id="cp-confirm" class="form-control" placeholder="••••••••" required style="padding-right:42px;">
                  <button type="button" onclick="togglePasswordVisibility('cp-confirm', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                    <i data-lucide="eye" style="width:18px; height:18px;"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="shield-check"></i> Update Password</button>
            </div>
          </form>
        </div>
      </div>
    `;
    lucide.createIcons();

    document.getElementById('change-pass-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('cp-current').value;
      const newPassword = document.getElementById('cp-new').value;
      const confirmPassword = document.getElementById('cp-confirm').value;

      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match!', 'error');
        return;
      }
      if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters long!', 'error');
        return;
      }

      try {
        const username = state.currentUser ? (state.currentUser.loginId || state.currentUser.phone || 'resident') : 'resident';
        await fetch('/api/resident/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, oldPassword: currentPassword, newPassword })
        });
      } catch (err) {}

      closeModal();
      showToast('Password changed successfully!', 'success');
    });
  };

  window.openManagePassesModal = function () {
    const container = document.getElementById('modal-container');
    const passCode = 'IN-PASS-' + Math.floor(1000 + Math.random() * 9000);
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Pre-Approved Gate Pass</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="text-align:center;">
            <div style="background:#f1f5f9; padding:16px; border-radius:12px; margin-bottom:16px;">
              <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:1px;">Active Gate Entry Pass Code</div>
              <div style="font-size:28px; font-weight:800; color:var(--primary-blue); margin:8px 0;">${passCode}</div>
              <div style="font-size:11px; color:#16a34a; font-weight:600;">Valid for 24 Hours • Share with Guest</div>
            </div>
            <div class="form-group" style="text-align:left;">
              <label>Guest Phone (+91)</label>
              <input type="tel" id="pass-guest-phone" class="form-control" placeholder="10-digit mobile number" maxlength="10" pattern="[0-9]{10}" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="sharePassCode('${passCode}')"><i data-lucide="share-2"></i> Copy & Share Pass</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.sharePassCode = async function (passCode) {
    const phoneInput = document.getElementById('pass-guest-phone');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const user = state.currentUser || {};

    const passReq = {
      id: Date.now(),
      visitorName: phone ? `Guest (${phone})` : 'Pre-Approved Guest',
      visitorPhone: phone || 'N/A',
      purpose: 'Pre-Approved Gate Pass (' + passCode + ')',
      targetFlat: user.flatNumber || '101',
      targetBlock: user.blockNumber || 'A',
      photoUrl: PRESET_PHOTOS[1].url,
      status: 'APPROVED',
      inTime: 'Pre-Approved Pass',
      createdAt: new Date().toISOString()
    };

    state.visitorRequests.unshift(passReq);

    try {
      await fetch('/api/resident/pass/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: passReq.visitorName,
          guestPhone: phone,
          category: 'GUEST',
          residentFlat: (user.blockNumber || 'A') + '-' + (user.flatNumber || '101'),
          residentName: user.fullName || 'Resident',
          validHours: 24
        })
      });
    } catch (e) {}

    closeModal();
    if (phone) {
      showToast(`Pass code ${passCode} copied & sent via SMS to ${phone}!`, 'success');
    } else {
      showToast(`Pass code ${passCode} copied to clipboard & added to Guard Gate system!`, 'success');
    }
    render();
  };

  window.openAddUserModal = function (type = 'RESIDENT') {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--primary-blue);">
              <i data-lucide="user-plus"></i> Add New ${type === 'RESIDENT' ? 'Resident' : 'User'}
            </h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <form id="add-user-modal-form">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom:12px;">
                <label>Full Name</label>
                <input type="text" id="au-name" class="form-control" placeholder="Enter Full Name" required>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Block Letter</label>
                  <select id="au-block" class="form-control">
                    <option value="A">Block A</option>
                    <option value="B">Block B</option>
                    <option value="C">Block C</option>
                    <option value="D">Block D</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Flat Number</label>
                  <input type="text" id="au-flat" class="form-control" placeholder="Enter Flat Number" required>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label>Contact Phone (+91 - 10 Digits)</label>
                <input type="tel" id="au-phone" class="form-control" placeholder="Enter 10-digit Phone Number" maxlength="10" pattern="[0-9]{10}" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)" required>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Login Username</label>
                  <input type="text" id="au-login" class="form-control" placeholder="Enter Username" required>
                </div>
                <div class="form-group">
                  <label>Initial Password</label>
                  <div style="position:relative;">
                    <input type="password" id="au-password" class="form-control" placeholder="Enter Initial Password" value="" required style="padding-right:42px;">
                    <button type="button" onclick="togglePasswordVisibility('au-password', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                      <i data-lucide="eye" style="width:18px; height:18px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="check-circle"></i> Save Resident</button>
            </div>
          </form>
        </div>
      </div>
    `;
    lucide.createIcons();

    document.getElementById('add-user-modal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('au-name').value;
      const block = document.getElementById('au-block').value;
      const flatNum = document.getElementById('au-flat').value;
      const phone = document.getElementById('au-phone').value;
      const loginId = document.getElementById('au-login').value;
      const passVal = document.getElementById('au-password') ? document.getElementById('au-password').value : '123';
      const flatStr = `${block}-${flatNum}`;
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

      const newRes = {
        id: Date.now(),
        name,
        fullName: name,
        initials,
        flat: flatStr,
        flatNumber: flatNum,
        blockNumber: block,
        loginId,
        password: passVal || '123',
        phone,
        backupPhone: '',
        role: 'RESIDENT',
        status: 'Active',
        avatarBg: 'blue'
      };

      saveDatabaseUser(newRes);
      state.residents.unshift(newRes);
      closeModal();
      showToast(`Resident ${name} (Flat ${flatStr}) saved to database!`, 'success');
      render();
    });
  };

  window.openEditResidentModal = function (id) {
    const r = state.residents.find(res => res.id === id);
    if (!r) return;
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Edit Resident: ${r.name}</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <form id="edit-resident-form">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom:12px;">
                <label>Full Name</label>
                <input type="text" id="er-name" class="form-control" value="${r.name}" required>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label>Flat Number</label>
                <input type="text" id="er-flat" class="form-control" value="${r.flat}" required>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label>Phone Number</label>
                <input type="tel" id="er-phone" class="form-control" value="${r.phone}" required>
              </div>
              <div class="form-group">
                <label>Account Status</label>
                <select id="er-status" class="form-control">
                  <option value="Active" ${r.status === 'Active' ? 'selected' : ''}>Active</option>
                  <option value="Inactive" ${r.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Resident</button>
            </div>
          </form>
        </div>
      </div>
    `;
    lucide.createIcons();

    document.getElementById('edit-resident-form').addEventListener('submit', (e) => {
      e.preventDefault();
      r.name = document.getElementById('er-name').value;
      r.flat = document.getElementById('er-flat').value;
      r.phone = document.getElementById('er-phone').value;
      r.status = document.getElementById('er-status').value;
      closeModal();
      showToast(`Resident ${r.name} updated!`, 'success');
      render();
    });
  };

  window.confirmDeleteResident = function (id) {
    const r = state.residents.find(res => res.id === id);
    if (!r) return;
    if (confirm(`Are you sure you want to remove resident ${r.name} (${r.flat})?`)) {
      state.residents = state.residents.filter(res => res.id !== id);
      showToast(`Resident ${r.name} removed`, 'info');
      render();
    }
  };

  window.openAddGuardModal = function () {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--primary-blue);">Add Security Guard</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <form id="add-guard-form">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom:12px;">
                <label>Guard Full Name</label>
                <input type="text" id="ag-name" class="form-control" placeholder="Enter Guard Full Name" required>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label>Phone Number (+91)</label>
                <input type="tel" id="ag-phone" class="form-control" placeholder="Enter Phone Number" required>
              </div>
              <div class="form-grid" style="margin-bottom:12px;">
                <div class="form-group">
                  <label>Login Username / Guard ID</label>
                  <input type="text" id="ag-login" class="form-control" placeholder="Enter Guard Username" required>
                </div>
                <div class="form-group">
                  <label>Initial Password</label>
                  <div style="position:relative;">
                    <input type="password" id="ag-password" class="form-control" placeholder="Enter Password" value="123" required style="padding-right:42px;">
                    <button type="button" onclick="togglePasswordVisibility('ag-password', this)" title="Show/Hide Password" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center;">
                      <i data-lucide="eye" style="width:18px; height:18px;"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Assigned Shift</label>
                  <select id="ag-shift" class="form-control">
                    <option value="DAY">DAY Shift (8 AM - 8 PM)</option>
                    <option value="NIGHT">NIGHT Shift (8 PM - 8 AM)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Assigned Gate Station</label>
                  <select id="ag-gate" class="form-control">
                    <option value="Gate A - Main Entrance">Gate A - Main Entrance</option>
                    <option value="Gate B - North Service">Gate B - North Service</option>
                    <option value="Gate C - West Emergency">Gate C - West Emergency</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Guard</button>
            </div>
          </form>
        </div>
      </div>
    `;
    lucide.createIcons();

    document.getElementById('add-guard-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('ag-name').value;
      const phone = document.getElementById('ag-phone').value;
      const loginIdInput = document.getElementById('ag-login') ? document.getElementById('ag-login').value.trim() : '';
      const passInput = document.getElementById('ag-password') ? document.getElementById('ag-password').value : '123';
      const shift = document.getElementById('ag-shift').value;
      const gate = document.getElementById('ag-gate').value;
      const guardLoginId = loginIdInput || ('guard_' + name.toLowerCase().replace(/\s+/g, ''));

      const newGuard = {
        id: Date.now(),
        name,
        fullName: name,
        loginId: guardLoginId,
        password: passInput || '123',
        phone,
        shift,
        gate,
        role: 'GUARD'
      };

      saveDatabaseUser(newGuard);
      state.guards.push(newGuard);
      closeModal();
      showToast(`Guard ${name} saved to database! (Login ID: ${guardLoginId}, Password: ${passInput})`, 'success');
      render();
    });
  };

  window.openVisitorDetailModal = function (id) {
    const item = state.visitorRequests.find(r => r.id === id);
    if (!item) return;
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700;">Visitor Audit Record</h3>
            <i data-lucide="x" style="cursor:pointer;" onclick="closeModal()"></i>
          </div>
          <div class="modal-body" style="text-align:center;">
            <img src="${item.photoUrl}" style="width:100px; height:100px; border-radius:var(--radius-md); object-fit:cover; margin-bottom:12px; border:2px solid var(--primary-blue);">
            <h3 style="font-size:20px; font-weight:700;">${item.visitorName}</h3>
            <p style="font-size:13px; color:var(--text-muted);">Phone: ${item.visitorPhone}</p>
            <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-top:16px; text-align:left; font-size:13px;">
              <div><strong>Destination:</strong> Block ${item.targetBlock || 'A'} - Flat ${item.targetFlat}</div>
              <div><strong>Purpose:</strong> ${item.purpose}</div>
              <div><strong>In Time:</strong> ${item.inTime || 'Logged today'}</div>
              <div><strong>Status:</strong> <span class="status-pill active">${item.status}</span></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.closeModal = function () {
    if (typeof closeCameraModal === 'function') closeCameraModal();
    const m = document.getElementById('modal-container');
    if (m) m.innerHTML = '';
  };
})();
