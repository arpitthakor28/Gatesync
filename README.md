# GateSync — Production-Grade PWA & Residential Visitor Alerting Platform

GateSync is an enterprise, multi-tenant residential society security and visitor management platform. It pairs a **Spring Boot 3 (Java 21)** multi-tenant backend with a **React + Vite Progressive Web App (PWA)** deployed to GitHub Pages at `/Gatesync/`.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Frontend["Frontend Client (PWA) /Gatesync/"]
        UI["React + Vite UI\n44px touch targets • Safe-area insets"]
        SW["Custom Service Worker (sw.js)\nPush • Notification Actions • Cache"]
        STOMP_Client["STOMP Client\nHeartbeat • Backoff Reconnect"]
        Audio["Web Audio Ring Synthesizer\nAutoplay Unlocked • Vibration"]
        WakeLock["Screen Wake Lock API\nGate Desk Keep-Alive"]
    end

    subgraph Backend["Backend API (Render.com)"]
        SecFilter["Spring Security + JWT\nMethod-Level Tenant & Role Shield"]
        NotifService["NotificationService.dispatch()\nSingle Entry Point • Persist First"]
        FCMService["FirebaseService\nHTTP v1 FCM API • Retry • Stale Token Cleanup"]
        Escalation["EscalationService\n60s Reminder • 120s Guard Alert • Expire"]
        WebSocketBroker["STOMP over WebSocket\n/user/queue/notifications • /topic/society"]
    end

    subgraph Storage["Persistence Layer"]
        MongoDB["MongoDB Atlas\nNotifications • FCM Tokens • Passes • Escalation Tasks • Audit Logs"]
        Relational["H2 / MySQL\nUsers • Sessions • Flats • Billing"]
    end

    UI -->|JWT Bearer + Credentials| SecFilter
    SecFilter --> NotifService
    NotifService -->|Channel 1| WebSocketBroker
    WebSocketBroker -->|Real-Time| STOMP_Client
    NotifService -->|2s Dedupe Wait| FCMService
    FCMService -->|Channel 2 Fallback| SW
    Escalation --> MongoDB
    NotifService --> MongoDB
```

---

## 🚀 Live Notification & Escalation Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Guard as Security Guard
    participant Backend as NotificationService
    participant Mongo as MongoDB Atlas
    participant Resident as Resident PWA
    participant FCM as Web Push (FCM v1)

    Guard->>Backend: POST /api/guard/visitor-requests
    Backend->>Mongo: Persist Notification (status: CREATED) & EscalationTasks
    Backend->>Resident: Channel 1: STOMP to /user/queue/notifications
    
    alt Resident App is Active / Foregrounded
        Resident->>Backend: Immediate STOMP ACK (/app/notifications/ack)
        Note over Backend: Dedupe window satisfied (<2s). FCM Push is SKIPPED!
        Resident->>Resident: Ringing Chime + Vibration + Incoming Visitor Modal
        Resident->>Backend: POST /api/resident/visitor-requests/decision (Approved)
        Backend->>Guard: Broadcast Decision to Gate Desk
    else Resident App is Backgrounded / Closed
        Note over Backend: No ACK received after 2000ms
        Backend->>FCM: Channel 2 Fallback: FCM HTTP v1 Web Push
        FCM->>Resident: System Notification with "Approve" & "Deny" Actions
        Resident->>Backend: Tap "Approve" -> Service Worker background fetch with cookie
        Backend->>Guard: Broadcast Decision to Gate Desk
    end

    alt No response within 60s
        Backend->>Resident: Send 60s Intercom Reminder
    else No response within 120s
        Backend->>Guard: Dispatch VISITOR_NO_RESPONSE alert + Resident "tel:" phone link
    end
```

---

## 🔑 Environment Variables

### Backend Configuration (Render / Production)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Dynamic web port assigned by Render | `8080` |
| `MONGODB_URI` | MongoDB Atlas cluster connection string | `mongodb+srv://...` |
| `JWT_SECRET` | 256-bit HMAC SHA secret for JWT signing | Set in production |
| `FIREBASE_CREDENTIALS_JSON` | Firebase Admin Service Account JSON string for HTTP v1 Push | Optional (runs in simulation mode if blank) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary storage bucket | Optional |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Optional |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | Optional |

### Frontend Configuration (`.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE` | Backend API base URL | `https://gatesync-backend.onrender.com` |

---

## 🛠️ Testing Matrix & Verification Steps

### 1. Manual Testing Matrix

| Scenario | Steps to Verify | Expected Outcome |
| :--- | :--- | :--- |
| **STOMP Live Alert (App Open)** | 1. Open Resident tab on Flat A-101.<br>2. In Guard tab, check-in a visitor for Flat A-101.<br>3. Submit. | Full-screen incoming visitor modal appears on Resident screen within 500ms with ringing sound & vibration. |
| **FCM Push Fallback (App Closed)** | 1. Close the Resident browser tab.<br>2. Guard registers a visitor for Flat A-101. | After 2s dedupe window, browser receives Web Push with visitor photo and "✓ Approve" / "✕ Deny" actions. |
| **Direct SW Decision** | 1. Tap "✓ Approve" directly on the push notification banner. | Service worker executes atomic background decision. Guard screen turns green instantly with "Approved". |
| **Persistent Auth** | 1. Log in as Resident or Guard.<br>2. Hard refresh the page (`Ctrl + Shift + R`). | Session remains authenticated. No logout occurs. Access token silently refreshes. |
| **Emergency SOS** | 1. Resident taps floating red "SOS" button.<br>2. Countdown completes (or click trigger). | Guard screen displays high-priority red siren banner with sound and flat number. |
| **Pre-Approved Pass** | 1. Resident clicks "Create Pre-Approved Pass".<br>2. Guard clicks "Scan Pass / OTP" and enters the 6-digit code. | Clearance pass verified. Instant admission without intercom call. |

### 2. Automated Test Commands

```bash
# Frontend production build validation
npm run build

# Playwright E2E mobile approval flow
npx playwright test e2e/visitor-approval.spec.js

# Backend JUnit & Tenant Isolation tests (in Docker or Maven environment)
mvn test
```
