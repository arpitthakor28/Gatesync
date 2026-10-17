import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE, getAccessToken, authApi } from './client';

class GateSyncStompService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempt = 0;
    this.maxReconnectDelay = 30000;
    this.baseReconnectDelay = 1000;
    this.onReconnectCallbacks = [];
    this.activeUser = null;

    // Listen for tab returning to foreground
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.connected && this.activeUser) {
          console.log('[STOMP] Tab returned to foreground. Reconnecting...');
          this.reconnect();
        }
      });
    }
  }

  onReconnect(callback) {
    this.onReconnectCallbacks.push(callback);
    return () => {
      this.onReconnectCallbacks = this.onReconnectCallbacks.filter(cb => cb !== callback);
    };
  }

  async connect(user) {
    this.activeUser = user;
    if (this.client && this.connected) {
      return;
    }

    if (this.client) {
      try {
        this.client.deactivate();
      } catch (e) {
        // ignore
      }
    }

    // Ensure we have a valid token
    let token = getAccessToken();
    if (!token) {
      try {
        const refreshed = await authApi.refresh();
        token = refreshed.accessToken;
      } catch (e) {
        console.warn('[STOMP] No auth token available for WebSocket connect');
      }
    }

    const wsUrl = `${API_BASE}/ws`;

    this.client = new Client({
      // Fallback to SockJS for older browsers / proxy environments
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.debug('[STOMP Debug]', str);
        }
      },
      reconnectDelay: this.calculateReconnectDelay(),
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: async () => {
        // Refresh token if needed right before connecting
        let currentToken = getAccessToken();
        if (!currentToken) {
          try {
            const res = await authApi.refresh();
            currentToken = res.accessToken;
          } catch (err) {
            // ignore
          }
        }
        if (this.client && currentToken) {
          this.client.connectHeaders = {
            Authorization: `Bearer ${currentToken}`
          };
        }
      },
      onConnect: (frame) => {
        console.log('[STOMP] Connected successfully to GateSync broker');
        this.connected = true;
        this.reconnectAttempt = 0;

        // Re-establish all registered subscriptions
        this.subscriptions.forEach((subObj, key) => {
          this.doSubscribe(key, subObj.destination, subObj.callback);
        });

        // Trigger missed-event resync callbacks
        this.onReconnectCallbacks.forEach(cb => {
          try {
            cb();
          } catch (err) {
            console.error('[STOMP] Reconnect callback error:', err);
          }
        });
      },
      onStompError: (frame) => {
        console.error('[STOMP] Broker error:', frame.headers['message'], frame.body);
        this.connected = false;
        this.handleReconnect();
      },
      onWebSocketClose: () => {
        console.warn('[STOMP] WebSocket connection closed');
        this.connected = false;
        this.handleReconnect();
      }
    });

    this.client.activate();
  }

  handleReconnect() {
    this.reconnectAttempt++;
    const delay = this.calculateReconnectDelay();
    console.log(`[STOMP] Reconnecting in ${delay}ms (attempt #${this.reconnectAttempt})...`);
    if (this.client) {
      this.client.reconnectDelay = delay;
    }
  }

  calculateReconnectDelay() {
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempt),
      this.maxReconnectDelay
    );
    return Math.floor(delay);
  }

  reconnect() {
    if (this.client) {
      this.client.activate();
    } else if (this.activeUser) {
      this.connect(this.activeUser);
    }
  }

  disconnect() {
    this.connected = false;
    this.activeUser = null;
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (e) {
        // ignore
      }
      this.client = null;
    }
    this.subscriptions.clear();
  }

  subscribe(key, destination, callback) {
    this.subscriptions.set(key, { destination, callback, activeSub: null });
    if (this.connected && this.client) {
      this.doSubscribe(key, destination, callback);
    }
    return () => {
      this.unsubscribe(key);
    };
  }

  doSubscribe(key, destination, callback) {
    if (!this.client || !this.connected) return;
    try {
      const sub = this.client.subscribe(destination, (message) => {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch (e) {
          callback(message.body);
        }
      });
      const stored = this.subscriptions.get(key);
      if (stored) {
        stored.activeSub = sub;
      }
    } catch (e) {
      console.error(`[STOMP] Failed to subscribe to ${destination}`, e);
    }
  }

  unsubscribe(key) {
    const subObj = this.subscriptions.get(key);
    if (subObj && subObj.activeSub) {
      try {
        subObj.activeSub.unsubscribe();
      } catch (e) {
        // ignore
      }
    }
    this.subscriptions.delete(key);
  }

  sendAck(notificationId, status = 'DELIVERED') {
    if (this.client && this.connected) {
      try {
        this.client.publish({
          destination: '/app/notifications/ack',
          body: JSON.stringify({ notificationId, status })
        });
        console.log(`[STOMP] Sent client ACK for notif ${notificationId} (status: ${status})`);
      } catch (e) {
        console.warn('[STOMP] Failed to send STOMP ACK:', e);
      }
    }
  }
}

export const stompService = new GateSyncStompService();
export default stompService;
