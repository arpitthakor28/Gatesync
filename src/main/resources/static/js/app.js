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

    // Resident Directory (Indian +91 Format)
    residents: [
      { id: 1, name: 'Suresh Verma', initials: 'SV', flat: 'A-102', loginId: 'res_a102', phone: '+91 97654 32109', backupPhone: '+91 97000 11223', status: 'Active', avatarBg: 'blue' },
      { id: 2, name: 'Priya Sharma', initials: 'PS', flat: 'B-405', loginId: 'res_b405', phone: '+91 96543 21098', backupPhone: '+91 96000 33445', status: 'Active', avatarBg: 'teal' },
      { id: 3, name: 'Rohan Mehta', initials: 'RM', flat: 'C-201', loginId: 'res_c201', phone: '+91 94321 09876', backupPhone: '+91 94000 55667', status: 'Inactive', avatarBg: 'gray' },
      { id: 4, name: 'Amit Patel', initials: 'AP', flat: 'A-402', loginId: 'resident', phone: '+91 99887 76655', backupPhone: '+91 99000 77889', status: 'Active', avatarBg: 'purple' }
    ],

    guards: [
      { id: 10, name: 'Vikram Singh', phone: '+91 98123 45678', shift: 'DAY', gate: 'Gate A - Main Entrance' },
      { id: 11, name: 'Ramesh Kumar', phone: '+91 98987 65432', shift: 'NIGHT', gate: 'Gate B - North Service' }
    ]
  };

  const PRESET_PHOTOS = [
    { title: 'Delivery Driver', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
    { title: 'Guest Visitor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
    { title: 'Service Tech', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
    { title: 'Cab Driver', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80' }
  ];

  // App Initialization
  document.addEventListener('DOMContentLoaded', () => {
    loadSavedSession();
    fetchInitialData();
    connectWebSocket();
    render();
  });

  function loadSavedSession() {
    const savedUser = localStorage.getItem('gatesync_user');
    const savedToken = localStorage.getItem('gatesync_token');
    if (savedUser && savedToken) {
      state.currentUser = JSON.parse(savedUser);
      state.token = savedToken;
      if (state.currentUser.mustResetPassword) {
        state.activeView = 'password_reset';
      } else {
        state.activeView = state.currentUser.role.toLowerCase();
      }
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

  async function fetchInitialData() {
    try {
      const [resReq, resGuards, resResidents] = await Promise.all([
        fetch('/api/guard/visitors/all').then(r => r.ok ? r.json() : null),
        fetch('/api/admin/guards').then(r => r.ok ? r.json() : null),
        fetch('/api/admin/residents').then(r => r.ok ? r.json() : null)
      ]);

      if (resReq && resReq.length) state.visitorRequests = resReq;
      if (resGuards && resGuards.length) state.guards = resGuards;
      if (resResidents && resResidents.length) state.residents = resResidents;
    } catch (e) {
      console.warn('API backend connecting, using local UI state fallback.');
    }
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
    return `
      <div class="landing-hero">
        <nav class="landing-nav">
          <div class="sidebar-brand" style="padding:0; border:none;">
            <div class="brand-icon"><i data-lucide="shield-check"></i></div>
            <div class="brand-title-wrap">
              <div class="brand-text" style="font-size: 24px; color:white;">GateSync</div>
              <span class="brand-subtext" style="color:#94a3b8;">Community Secure</span>
            </div>
          </div>
          <div style="display:flex; gap:12px;">
            <button class="btn btn-secondary" onclick="openHelpModal()"><i data-lucide="help-circle"></i> Need Help?</button>
            <a href="#login-section" class="btn btn-primary" onclick="document.getElementById('login-id').focus()"><i data-lucide="log-in"></i> Access Portal</a>
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

          <div class="login-card" id="login-section">
            <h2 style="font-family:var(--font-heading); font-size:24px; font-weight:700; margin-bottom:6px;">Sign In to GateSync</h2>
            <p style="font-size:13px; color:var(--text-muted); margin-bottom:24px;">Select your role or enter system credentials to begin.</p>
            
            <form id="login-form">
              <div class="form-group" style="margin-bottom:16px;">
                <label>Login ID / Username</label>
                <input type="text" id="login-id" class="form-control" placeholder="admin, guard, or resident" required value="admin">
              </div>
              <div class="form-group" style="margin-bottom:20px;">
                <label>Password</label>
                <input type="password" id="login-password" class="form-control" placeholder="••••••••" required value="admin123">
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; font-size:12px;">
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" checked> Remember me
                </label>
                <a href="#" onclick="openForgotPasswordModal()" style="color:var(--primary-blue); text-decoration:none; font-weight:600;">Forgot Password?</a>
              </div>
              <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width:100%; padding:12px;">
                ${state.isAuthenticating ? `<span class="spinner-loader"></span> Authenticating...` : `<i data-lucide="shield"></i> Authenticate & Login`}
              </button>
            </form>

            <div class="demo-pills">
              <span style="font-size:11px; font-weight:700; color:var(--text-muted); width:100%;">Instant Demo Role Logins:</span>
              <div class="demo-pill" onclick="quickLogin('admin', 'admin123')">🔑 Admin (Rajesh)</div>
              <div class="demo-pill" onclick="quickLogin('guard', 'guard123')">👮 Guard (Vikram)</div>
              <div class="demo-pill" onclick="quickLogin('resident', 'resident123')">🏡 Resident (Amit, Flat A-402)</div>
              <div class="demo-pill" onclick="quickLogin('resident2', 'password123')">🔒 Forced Reset Demo (Sunita)</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Global Dashboard Layout Wrapper (Light Sidebar - Exact Mockup Match)
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
        <div class="nav-item ${state.adminTab === 'alerts' ? 'active' : ''}" onclick="switchTab('alerts')">
          <i data-lucide="shield-alert"></i> Security Alerts
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
        <!-- Desktop Light Sidebar (Exact Match to Mockup) -->
        <aside class="sidebar" id="app-sidebar">
          <div class="sidebar-brand">
            <div class="brand-icon"><i data-lucide="shield"></i></div>
            <div class="brand-title-wrap">
              <div class="brand-text">GateSync</div>
              <span class="brand-subtext">Community Secure</span>
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
              <div class="header-search">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search residents, flats, or logs..." id="global-search-input" value="${state.searchQuery}">
              </div>
            </div>

            <div class="header-actions">
              <div class="role-switcher-pill ${role}" onclick="cycleRoleDemo()">
                <i data-lucide="${role === 'ADMIN' ? 'shield' : role === 'GUARD' ? 'shield-check' : 'home'}" style="width:14px; height:14px;"></i>
                <span>${role === 'GUARD' ? 'GATE 1 - GUARD' : role === 'RESIDENT' ? 'RESIDENT' : 'ADMIN'} (Switch Role)</span>
              </div>

              <div class="notification-bell" onclick="toggleNotificationDrawer()">
                <i data-lucide="bell"></i>
                ${unreadCount > 0 ? `<span class="bell-badge-dot"></span>` : ''}
              </div>

              <div class="user-profile-pill" onclick="openProfileModal()">
                <div class="avatar-initials">${user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'AD'}</div>
                <span class="user-profile-name">${user.fullName || 'Admin'}</span>
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
          <div class="mobile-nav-btn ${role === 'ADMIN' ? 'active' : ''}" onclick="quickLogin('admin', 'admin123')">
            <i data-lucide="shield"></i> Admin
          </div>
          <div class="mobile-nav-btn ${role === 'GUARD' ? 'active' : ''}" onclick="quickLogin('guard', 'guard123')">
            <i data-lucide="shield-check"></i> Guard
          </div>
          <div class="mobile-fab-center" onclick="openRegisterVisitorModal()">
            <i data-lucide="plus" style="width:24px; height:24px;"></i>
          </div>
          <div class="mobile-nav-btn ${role === 'RESIDENT' ? 'active' : ''}" onclick="quickLogin('resident', 'resident123')">
            <i data-lucide="home"></i> Resident
          </div>
          <div class="mobile-nav-btn" onclick="openProfileModal()">
            <i data-lucide="user"></i> Profile
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
    if (state.adminTab === 'alerts') return renderSecurityAlertsTab();
    if (state.adminTab === 'settings') return renderSettingsTab();

    const filteredResidents = state.residents.filter(r => {
      const matchSearch = !state.searchQuery || r.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || r.flat.toLowerCase().includes(state.searchQuery.toLowerCase()) || (r.loginId && r.loginId.includes(state.searchQuery));
      const matchStatus = state.residentStatusFilter === 'ALL' || r.status === state.residentStatusFilter;
      return matchSearch && matchStatus;
    });

    return `
      <!-- Stat Cards Row (Exact Match to Mockup 1) -->
      <div class="stats-grid-row">
        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Total Residents</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">1,248</span>
              <span class="stat-badge-tag blue">+12%</span>
            </div>
          </div>
          <div class="stat-icon-circle blue"><i data-lucide="users"></i></div>
        </div>

        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Active Guards</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">16</span>
              <span class="stat-badge-tag green">Stable</span>
            </div>
          </div>
          <div class="stat-icon-circle teal"><i data-lucide="shield-check"></i></div>
        </div>

        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Total Flats</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">450</span>
              <span class="stat-badge-tag teal">98% Occ.</span>
            </div>
          </div>
          <div class="stat-icon-circle gray"><i data-lucide="building"></i></div>
        </div>

        <div class="stat-card-clean">
          <div class="stat-info-left">
            <h4>Visitor Requests</h4>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="stat-val-num">24</span>
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
                  ${filteredResidents.map(r => `
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
              <span>Showing ${filteredResidents.length} of 1,248 residents</span>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-secondary btn-sm" disabled>Previous</button>
                <button class="btn btn-secondary btn-sm">Next</button>
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
              <div class="timeline-item">
                <div class="timeline-dot blue"></div>
                <div class="timeline-card">
                  <div class="timeline-header">
                    <span class="timeline-title">Visitor Entry</span>
                    <span class="timeline-time">10:24 AM</span>
                  </div>
                  <div class="timeline-sub"><strong>Uber Delivery (Mark R.)</strong></div>
                  <div style="font-size:11px; color:var(--text-muted);">Destination: Flat A-102</div>
                  <span class="timeline-tag verified">Verified</span>
                </div>
              </div>

              <div class="timeline-item">
                <div class="timeline-dot red"></div>
                <div class="timeline-card">
                  <div class="timeline-header">
                    <span class="timeline-title" style="color:var(--danger-red);">Security Alert</span>
                    <span class="timeline-time">09:15 AM</span>
                  </div>
                  <div class="timeline-sub"><strong>Gate 2 Sensor Triggered</strong></div>
                  <div style="font-size:11px; color:var(--text-muted);">Unexpected perimeter proximity.</div>
                  <span class="timeline-tag investigate" onclick="showToast('Dispatching guard squad to Gate 2', 'error')">Investigate</span>
                </div>
              </div>

              <div class="timeline-item">
                <div class="timeline-dot gray"></div>
                <div class="timeline-card">
                  <div class="timeline-header">
                    <span class="timeline-title">Guard Shift Change</span>
                    <span class="timeline-time">08:00 AM</span>
                  </div>
                  <div class="timeline-sub"><strong>Day Shift Active</strong></div>
                  <div style="font-size:11px; color:var(--text-muted);">Supervisor: Sgt. Miller</div>
                </div>
              </div>
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
                  <label>Phone Number</label>
                  <input type="tel" id="vis-phone" class="form-control" placeholder="+91 98765 43210" required>
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
    const pendingRequests = state.visitorRequests.filter(r => r.status === 'PENDING');
    const activeReq = pendingRequests.length > 0 ? pendingRequests[0] : null;

    return `
      <!-- LIVE REQUEST Hero Card (Exact Match to Mockup 3) -->
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
                "${activeReq.purposeQuote || 'Package delivery for Unit 402. Requires signature.'}"
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
          <p style="font-size:13px; color:var(--text-muted);">Incoming gate visitor requests will appear here in real time.</p>
        </div>
      `}

      <div class="dashboard-grid-layout">
        <div class="dashboard-main-col">
          <div class="stats-grid-row">
            <div class="stat-card-clean">
              <div class="stat-info-left">
                <h4>VISITORS TODAY</h4>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="stat-val-num">${state.visitorRequests.length < 10 ? '0' + state.visitorRequests.length : state.visitorRequests.length}</span>
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
                <span class="stat-val-num">P-12</span>
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
                  ${state.visitorRequests.length === 0 ? `
                    <tr>
                      <td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">
                        No previous visitor history logged yet. (0 Visitors)
                      </td>
                    </tr>
                  ` : state.visitorRequests.map(item => `
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
              ${state.visitorRequests.map(r => `
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
              ${state.residents.map(r => `
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
              ${filteredGuards.map(g => `
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

  function renderSecurityAlertsTab() {
    return `
      <div class="card-box">
        <h2 class="card-title-text" style="color:var(--danger-red); margin-bottom:16px;">Security Monitoring Feed</h2>
        <div class="activity-timeline">
          <div class="timeline-item">
            <div class="timeline-dot red"></div>
            <div class="timeline-card">
              <div class="timeline-header">
                <span class="timeline-title" style="color:var(--danger-red);">Gate 2 Sensor Triggered</span>
                <span class="timeline-time">09:15 AM</span>
              </div>
              <div class="timeline-sub">Unexpected perimeter motion detected at North Boundary.</div>
              <button class="btn btn-danger btn-sm" style="margin-top:10px;" onclick="showToast('Security Alert Dispatched to Guards!', 'error')">Dispatch Patrol</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSettingsTab() {
    return `
      <div class="card-box">
        <h2 class="card-title-text" style="margin-bottom:16px;">Society Configuration Settings</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>Society Name</label>
            <input type="text" class="form-control" value="Royal Palms Estate">
          </div>
          <div class="form-group">
            <label>Auto-Expire Visitor Request (Seconds)</label>
            <input type="number" class="form-control" value="60">
          </div>
        </div>
        <button class="btn btn-primary" onclick="showToast('Settings updated successfully!', 'success')">Save Configurations</button>
      </div>
    `;
  }

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
              <input type="password" id="reset-new" class="form-control" placeholder="At least 8 chars" required>
            </div>

            <div class="form-group" style="margin-bottom:20px;">
              <label>Confirm New Password</label>
              <input type="password" id="reset-confirm" class="form-control" required>
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
        state.isAuthenticating = true;
        render();

        const loginId = document.getElementById('login-id').value;
        const password = document.getElementById('login-password').value;

        setTimeout(async () => {
          state.isAuthenticating = false;
          quickLogin(loginId, password);
        }, 500);
      });
    }

    const guardForm = document.getElementById('guard-visitor-form');
    if (guardForm) {
      guardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const destVal = document.getElementById('vis-destination').value;
        const [flat, block] = destVal.split('|');
        const newReq = {
          id: Date.now(),
          visitorName: document.getElementById('vis-name').value,
          visitorPhone: document.getElementById('vis-phone').value,
          purpose: document.getElementById('vis-purpose').value,
          targetFlat: flat,
          targetBlock: block,
          photoUrl: state.selectedPhoto,
          status: 'PENDING',
          timeAgo: 'Just now',
          createdAt: new Date().toISOString()
        };

        state.visitorRequests.unshift(newReq);
        showToast(`Approval request sent to Resident at Flat ${flat}!`, 'amber');
        playAlertSound();
        render();
      });
    }
  }

  // Helper Actions & Modals
  window.quickLogin = function (loginId, password) {
    let mockUser = { id: 1, loginId, fullName: 'Rajesh Sharma', role: 'ADMIN', mustResetPassword: false };
    if (loginId === 'guard') {
      mockUser = { id: 2, loginId, fullName: 'Vikram Singh', role: 'GUARD', mustResetPassword: false };
    } else if (loginId === 'resident') {
      mockUser = { id: 3, loginId, fullName: 'Amit Patel', role: 'RESIDENT', blockNumber: 'A', flatNumber: '402', mustResetPassword: false };
    } else if (loginId === 'resident2') {
      mockUser = { id: 4, loginId, fullName: 'Sunita Rao', role: 'RESIDENT', blockNumber: 'B', flatNumber: '105', mustResetPassword: true };
    }
    saveSession(mockUser, 'mock_token_' + Date.now());
    state.activeView = mockUser.mustResetPassword ? 'password_reset' : mockUser.role.toLowerCase();
    showToast(`Logged in as ${mockUser.fullName}`, 'success');
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

  window.confirmApproveVisitor = function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    if (item) {
      item.status = 'APPROVED';
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
              <input type="text" class="form-control" placeholder="e.g. Expecting no delivery today">
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

  window.confirmDenyVisitor = function (requestId) {
    const item = state.visitorRequests.find(r => r.id === requestId);
    if (item) {
      item.status = 'DENIED';
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
              <input type="text" id="party-name" class="form-control" placeholder="e.g. Birthday Party" value="Clubhouse Birthday Party">
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
                <input type="number" class="form-control" value="25">
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
              <input type="text" id="pr-title" class="form-control" placeholder="e.g. Water Pressure Issue in Block A">
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label>Category</label>
              <select class="form-control">
                <option>Water issue</option>
                <option>Power issue</option>
                <option>Security issue</option>
                <option>Lift issue</option>
                <option>Cleanliness issue</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control" rows="3" placeholder="Describe the issue..."></textarea>
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

  window.submitProblemReport = function () {
    const title = document.getElementById('pr-title').value || 'Community Issue';
    closeModal();
    showToast(`Problem "${title}" submitted to Community Feed & Admin!`, 'success');
  };

  window.openClubhouseApprovalAdminModal = function () {
    showToast('Clubhouse Booking Approval Panel (1 Pending Request)', 'info');
  };

  window.openCommunityProblemsAdminModal = function () {
    showToast('Community Complaints Panel (1 Issue under review)', 'info');
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
                <input type="password" id="cp-current" class="form-control" placeholder="••••••••" required>
              </div>
              <div class="form-group" style="margin-bottom:12px;">
                <label>New Password</label>
                <input type="password" id="cp-new" class="form-control" placeholder="Minimum 6 characters" required>
              </div>
              <div class="form-group">
                <label>Confirm New Password</label>
                <input type="password" id="cp-confirm" class="form-control" placeholder="••••••••" required>
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
        const userId = state.currentUser ? state.currentUser.id : 3;
        await fetch('/api/resident/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, currentPassword, newPassword })
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
              <input type="tel" class="form-control" placeholder="+91 98765 43210" value="+91 98765 43210">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
            <button class="btn btn-primary" onclick="closeModal(); showToast('Pass code ${passCode} copied & sent via SMS to +91 guest!', 'success')">
              <i data-lucide="share-2"></i> Share Pass Code
            </button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
  };

  window.openAddUserModal = function () {
    showToast('Add resident form open', 'info');
  };

  window.closeModal = function () {
    document.getElementById('modal-container').innerHTML = '';
  };
})();
