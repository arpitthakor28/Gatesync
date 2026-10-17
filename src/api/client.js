import axios from 'axios';

// Detect environment: Use VITE_API_BASE, or default to Render backend in production / localhost in dev
export const API_BASE = import.meta.env.VITE_API_BASE || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : 'https://gatesync-backend.onrender.com');

// Create Axios client with credentials (sends and receives HttpOnly Secure SameSite cookies)
const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Short-lived access token is stored safely in-memory (never in localStorage to prevent XSS)
let accessToken = null;
let tokenChangeListeners = [];

export function setAccessToken(token) {
  accessToken = token;
  tokenChangeListeners.forEach(listener => listener(token));
}

export function getAccessToken() {
  return accessToken;
}

export function onTokenChange(listener) {
  tokenChangeListeners.push(listener);
  return () => {
    tokenChangeListeners = tokenChangeListeners.filter(l => l !== listener);
  };
}

// Request Interceptor: Attach in-memory JWT Access Token
client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Silent refresh queue on 401
let refreshingPromise = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry on login or refresh endpoint to avoid loops
    if (originalRequest?.url?.includes('/api/auth/login') || originalRequest?.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshingPromise) {
          refreshingPromise = client.post('/api/auth/refresh', {})
            .then((res) => {
              const newAccessToken = res.data.accessToken;
              setAccessToken(newAccessToken);
              return newAccessToken;
            })
            .catch((refreshErr) => {
              setAccessToken(null);
              window.dispatchEvent(new CustomEvent('gatesync:auth-expired'));
              throw refreshErr;
            })
            .finally(() => {
              refreshingPromise = null;
            });
        }

        const freshToken = await refreshingPromise;
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  login: async (loginId, password) => {
    const res = await client.post('/api/auth/login', { loginId, password });
    setAccessToken(res.data.accessToken);
    return res.data;
  },
  refresh: async () => {
    const res = await client.post('/api/auth/refresh', {});
    setAccessToken(res.data.accessToken);
    return res.data;
  },
  logout: async () => {
    try {
      await client.post('/api/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },
  getSessions: async () => {
    const res = await client.get('/api/auth/sessions');
    return res.data;
  },
  revokeSession: async (sessionId) => {
    const res = await client.delete(`/api/auth/sessions/${sessionId}`);
    return res.data;
  },
  resetPassword: async (newPassword) => {
    const res = await client.post('/api/auth/reset-password', { newPassword });
    return res.data;
  }
};

// Visitor Management Endpoints with Offline Queue fallback
export const visitorApi = {
  // Guard creates entry request (with offline queue support)
  createRequest: async (data) => {
    try {
      const res = await client.post('/api/guard/visitor-requests', data);
      return res.data;
    } catch (err) {
      if (!navigator.onLine || err.message === 'Network Error') {
        enqueueOfflineAction('CREATE_VISITOR', data);
        return {
          ...data,
          id: Date.now(),
          status: 'PENDING',
          isOfflineQueued: true,
          createdAt: new Date().toISOString()
        };
      }
      throw err;
    }
  },
  // Guard view active gate queue
  getGuardQueue: async () => {
    const res = await client.get('/api/guard/visitor-requests');
    return res.data;
  },
  // Guard visitor history
  getHistory: async () => {
    const res = await client.get('/api/guard/visitor-requests/history');
    return res.data;
  },
  // Guard checkout visitor
  checkout: async (requestId) => {
    const res = await client.post(`/api/guard/visitor-requests/${requestId}/checkout`);
    return res.data;
  },
  // Resident view pending requests for their verified flat
  getPendingForResident: async () => {
    const res = await client.get('/api/resident/visitor-requests/pending');
    return res.data;
  },
  // Resident decides on entry
  decide: async (requestId, approved, denialReason = null) => {
    const res = await client.post('/api/resident/visitor-requests/decision', {
      requestId,
      approved,
      denialReason
    });
    return res.data;
  }
};

// Notification Endpoints
export const notificationsApi = {
  ack: async (notificationId, status = 'DELIVERED') => {
    const res = await client.post(`/api/notifications/${notificationId}/ack`, { status });
    return res.data;
  },
  getPending: async () => {
    const res = await client.get('/api/notifications/pending');
    return res.data;
  },
  getFeed: async (type = null, page = 0, size = 20) => {
    const params = { page, size };
    if (type) params.type = type;
    const res = await client.get('/api/notifications', { params });
    return res.data;
  },
  registerFcmToken: async (fcmToken, deviceName = 'PWA Client') => {
    const res = await client.post('/api/notifications/fcm-token', { fcmToken, deviceName });
    return res.data;
  },
  unregisterFcmToken: async (fcmToken) => {
    const res = await client.delete('/api/notifications/fcm-token', { data: { fcmToken } });
    return res.data;
  },
  getPreferences: async () => {
    const res = await client.get('/api/notifications/preferences');
    return res.data;
  },
  updatePreferences: async (data) => {
    const res = await client.put('/api/notifications/preferences', data);
    return res.data;
  },
  getAdminDeliveryLog: async (status = null, page = 0, size = 50) => {
    const params = { page, size };
    if (status) params.status = status;
    const res = await client.get('/api/notifications/admin/delivery-log', { params });
    return res.data;
  }
};

// Pre-Approved Passes Endpoints
export const passApi = {
  createPass: async (data) => {
    const res = await client.post('/api/resident/passes', data);
    return res.data;
  },
  getMyPasses: async () => {
    const res = await client.get('/api/resident/passes');
    return res.data;
  },
  verifyPass: async (passCode) => {
    const res = await client.post('/api/guard/passes/verify', { passCode });
    return res.data;
  }
};

// Emergency SOS Panic Endpoints
export const sosApi = {
  trigger: async (reason = 'Emergency Assistance Requested') => {
    const res = await client.post('/api/sos/trigger', { reason });
    return res.data;
  },
  acknowledge: async (notificationId) => {
    const res = await client.post('/api/sos/acknowledge', { notificationId });
    return res.data;
  }
};

// Audit Trail Endpoints
export const auditApi = {
  getLogs: async (page = 0, size = 50) => {
    const res = await client.get('/api/admin/audit-logs', { params: { page, size } });
    return res.data;
  }
};

// Health Check Endpoint
export const systemApi = {
  health: async () => {
    const res = await client.get('/health');
    return res.data;
  }
};

// OFFLINE QUEUE MANAGER
const QUEUE_KEY = 'gatesync_offline_queue';

function enqueueOfflineAction(action, payload) {
  try {
    const current = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    current.push({ id: Date.now(), action, payload, queuedAt: new Date().toISOString() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(current));
    console.log('[Offline Queue] Enqueued item:', action);
  } catch (e) {
    console.error('Failed to enqueue offline item', e);
  }
}

export async function flushOfflineQueue() {
  const current = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (current.length === 0) return;

  console.log(`[Offline Queue] Flushing ${current.length} queued items...`);
  const remaining = [];

  for (const item of current) {
    try {
      if (item.action === 'CREATE_VISITOR') {
        await client.post('/api/guard/visitor-requests', item.payload);
      }
    } catch (e) {
      console.warn('[Offline Queue] Item failed to sync:', item, e);
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  if (remaining.length === 0) {
    console.log('[Offline Queue] All offline actions synced successfully!');
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Network] Back online! Syncing queued requests...');
    flushOfflineQueue();
  });
}

export default client;
