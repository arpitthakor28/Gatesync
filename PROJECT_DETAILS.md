# 🛡️ GateSync - Comprehensive Project Documentation & Technical Overview

> **Project Title:** GateSync - Smart Residential Society Visitor Management Platform  
> **Version:** 1.0.0  
> **Tech Stack:** Java 17, Spring Boot 3.2.3, Spring Security (JWT), Spring Data JPA (H2 In-Memory DB), Spring Data MongoDB (MongoDB Atlas), Spring WebSockets (STOMP / SockJS), HTML5, Vanilla CSS3, Vanilla JavaScript (SPA), WebRTC, PWA.  
> **Repository Location:** `d:\Projects\Gatesync`  

---

## 📋 1. Executive Summary & Purpose

**GateSync** is an enterprise-grade, fullstack visitor management and gated community automation platform designed for modern residential societies and gated complexes. It solves traditional security risks, long gate delays, lost visitor records, and manual paper registers by establishing a real-time, digital communication bridge between three core user roles:

1. **Security Guards:** Gatekeepers who capture visitor details, stream live identity photos via webcam, check pre-approved guest passes, and monitor real-time entry/checkout queues.
2. **Residents:** Flat owners/tenants who receive instant real-time arrival alerts with sound chimes on their devices, approve or reject visitor entry, issue pre-approved passes for guests/deliveries, book society facilities, report maintenance issues, and trigger emergency SOS alerts.
3. **Society Admins:** Management committee members who oversee the society directory, roster security guards across gates/shifts, review visitor metrics and audit logs, approve facility bookings, and resolve community complaints.

---

## 🏗️ 2. System Architecture & Tech Stack

```
                                  +---------------------------------------+
                                  |         Browser / PWA Client          |
                                  | (HTML5, Vanilla CSS, JS SPA, WebRTC)  |
                                  +-------------------+-------------------+
                                                      |
                                   HTTP REST / WS STOMP SockJS
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |         Spring Boot 3.2.3               |
                                  |---------------------------------------|
                                  |  - Spring Security (JWT Auth & RBAC)  |
                                  |  - Spring WebSockets (STOMP Broker)   |
                                  |  - Spring Data JPA / Spring Data Mongo|
                                  +---------+-------------------+---------+
                                            |                   |
                                            v                   v
                                  +-------------------+ +-------------------+
                                  |   H2 In-Memory    | |   MongoDB Atlas   |
                                  |  Relational DB    | |    Document DB    |
                                  +-------------------+ +-------------------+
```

### Key Technical Layer Breakdown

- **Core Backend Framework:** Java 17 with Spring Boot 3.2.3 (`spring-boot-starter-web`, `spring-boot-starter-security`, `spring-boot-starter-websocket`, `spring-boot-starter-data-jpa`, `spring-boot-starter-data-mongodb`).
- **Security & Authorization:** Spring Security 6 with JSON Web Tokens (JJWT `0.11.5`). Implements Role-Based Access Control (RBAC) with `ADMIN`, `GUARD`, and `RESIDENT` roles. Includes forced first-time password reset flows (`mustResetPassword`) and BCrypt password encryption.
- **Dual Persistence Database Strategy:**
  - **H2 Database Engine:** Embedded, high-performance relational database (`jdbc:h2:mem:gatesync`) for fast transactions and instant zero-config setup.
  - **MongoDB Atlas Cloud DB:** NoSQL Document store for scalable, cloud-synchronized persistence across services (`User`, `CommunityProblem`, `EmergencyAlert`, etc.).
- **Real-Time Communication Pipeline:**
  - **Spring WebSockets + STOMP + SockJS:** Delivers sub-second push notifications directly to resident and guard clients without polling overhead.
  - **Browser Synchronization:** HTML5 `BroadcastChannel` API (`gatesync_sync_channel`) and `localStorage` event hooks keep multiple active tabs and windows synchronized instantly.
- **Frontend Architecture:**
  - Single Page Application (SPA) with zero external heavy frameworks.
  - Vanilla HTML5, modular JavaScript (`js/app.js`), and custom CSS design tokens (`css/styles.css`) supporting modern glassmorphism, responsive drawer navigation, and light/dark theme aesthetics.
  - **WebRTC Camera Module:** Uses `navigator.mediaDevices.getUserMedia` for capturing live identity photographs of visitors at the gate, with preset sample fallbacks.
  - **Progressive Web App (PWA):** Service worker (`sw.js`) and manifest (`manifest.json`) support installability on Android and iOS devices.
- **Notification Pipeline:**
  - Pluggable SMS architecture (`SmsProvider` interface).
  - Development mode uses `MockSmsProvider` (logs to console/audit log), production uses `TwilioSmsProvider`.
  - Notification delivery status logged to `NotificationLog` entity.
- **Containerization & Cloud Deployment:**
  - Multi-stage `Dockerfile` (Maven 3.9 build stage + OpenJDK 17 runtime).
  - Render cloud configuration (`render.yaml`).

---

## 👥 3. User Personas & System Workflows

```
  [Security Guard]                     [GateSync Server]                    [Resident]
         |                                     |                                 |
         | --- (1) Register Visitor & Snapshot -> |                                 |
         |                                     | --- (2) Push WebSocket Alert --> |
         |                                     |        (& Play Audio Chime)     |
         |                                     |                                 |
         |                                     | <--- (3) Approve / Deny Entry -- |
         | <--- (4) Update Queue Live ---------|                                 |
         |      (Latency < 1s)                 |                                 |
```

### A. Guard Workflow (Gate Terminal)
1. **Visitor Registration:** Guard enters Visitor Name, Mobile Number, Vehicle Number, Purpose (Delivery, Guest, Service, Cab), Block & Flat Number.
2. **Identity Capture:** Guard clicks "Capture Photo" to open webcam feed or uses preset snapshot.
3. **Queue Monitoring:** Guard monitors the live queue. Approved visitors show a green badge and an active "Checkout" button; denied visitors show a red badge with reasons.
4. **Pre-Approved Pass Lookup:** Guard enters pass code (e.g. `GS-X7A2B9`) to instantly verify and grant gate entry.

### B. Resident Workflow (Home Terminal)
1. **Live Visitor Popup:** When a guard registers a visitor for their flat, an interactive popup modal slides in, playing an audio chime (`alert-sound`).
2. **One-Tap Decision:** Resident views visitor details and photo, then clicks **Approve** or **Deny** (with optional reason).
3. **Pass Generation:** Resident generates custom pass codes for expected guests or delivery drivers.
4. **Clubhouse Booking:** Resident selects venue (Clubhouse Hall, Rooftop Garden, Swimming Pool Lawn), date, and time slot for private events.
5. **Community Complaints:** Resident files maintenance tickets with priority levels (Water, Electricity, Elevator, Security, Hygiene).
6. **SOS Emergency:** Resident triggers Emergency Alert (Security SOS, Fire, Medical) broadcasting to all guards and society management instantly.

### C. Admin Workflow (Management Terminal)
1. **Analytics Dashboard:** Real-time metrics showing total residents, active guards, total flats, today's visitors, approval rate, and pending approvals.
2. **Resident Directory:** Add, view, edit, or deactivate resident flat assignments and contact details.
3. **Guard Roster:** Register security personnel, assign primary gate posts (Main Gate A, Rear Gate B), and set day/night shifts.
4. **Clubhouse & Complaint Approvals:** Review venue requests and resolve community tickets with official committee comments.
5. **Audit Trail:** Inspect persistent system logs for all user logins, visitor approvals, and role updates.

---

## 🗄️ 4. Data Models & Database Schemas

### Core Entities

| Entity | Fields / Attributes | Purpose |
|---|---|---|
| **`User`** | `id`, `loginId`, `password`, `fullName`, `phone`, `role` (`ADMIN`, `GUARD`, `RESIDENT`), `societyId`, `blockNumber`, `flatNumber`, `gatePost`, `shiftSchedule`, `mustResetPassword`, `enabled`, `createdAt` | Core user account and access control profile |
| **`VisitorRequest`** | `id`, `visitorName`, `visitorPhone`, `vehicleNumber`, `purpose`, `societyId`, `blockNumber`, `flatNumber`, `photoUrl`, `status` (`PENDING`, `APPROVED`, `DENIED`, `CHECKED_OUT`), `registeredByGuardId`, `denialReason`, `checkInTime`, `checkOutTime`, `createdAt` | Main gate visitor log & real-time tracking |
| **`PreApprovedPass`** | `id`, `passCode`, `residentId`, `residentName`, `societyId`, `blockNumber`, `flatNumber`, `expectedVisitorName`, `visitorPhone`, `passType` (`GUEST`, `DELIVERY`, `SERVICE`), `validFrom`, `validUntil`, `used`, `createdAt` | QR/Code pre-authorized gate entry pass |
| **`ClubhouseBooking`** | `id`, `facilityName`, `residentId`, `residentName`, `societyId`, `blockNumber`, `flatNumber`, `bookingDate`, `timeSlot`, `purpose`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `adminComment`, `createdAt` | Facility reservation system |
| **`CommunityProblem`** | `id`, `title`, `description`, `category` (`WATER`, `ELECTRICITY`, `ELEVATOR`, `SECURITY`, `HYGIENE`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `residentId`, `residentName`, `societyId`, `blockNumber`, `flatNumber`, `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`), `adminReply`, `createdAt`, `resolvedAt` | Community issue and complaint tracking |
| **`EmergencyAlert`** | `id`, `alertType` (`SECURITY_SOS`, `FIRE_ALERT`, `MEDICAL_EMERGENCY`), `triggeredById`, `triggeredByName`, `societyId`, `blockNumber`, `flatNumber`, `details`, `status` (`ACTIVE`, `RESOLVED`), `resolvedAt`, `createdAt` | High-priority security and safety alert |
| **`NotificationLog`** | `id`, `recipientPhone`, `recipientUserId`, `channel` (`SMS`, `WEBSOCKET`, `IN_APP`), `purpose` (`VISITOR_ARRIVAL`, `EMERGENCY`, `PASS_CODE`), `message`, `status` (`SENT`, `FAILED`, `SKIPPED`), `providerMessageId`, `failureReason`, `sentAt` | Telemetry & SMS audit log |
| **`AuditLog`** | `id`, `username`, `action`, `details`, `societyId`, `timestamp` | System activity security trail |

---

## 📡 5. REST API Specifications

### Authentication Controller (`/api/auth`)
- `POST /api/auth/login`: Authenticate with `loginId` or `phone` + `password`. Returns JWT token and user profile.
- `POST /api/auth/reset-password`: Force reset default password on first login.
- `GET /api/auth/me`: Get current logged-in user profile.

### Guard Controller (`/api/guard`)
- `POST /api/guard/visitor/register`: Create new visitor request and trigger WebSockets broadcast.
- `PUT /api/guard/visitor/checkout/{id}`: Update visitor status to `CHECKED_OUT`.
- `GET /api/guard/visitor/queue`: Get active gate queue for current society.
- `POST /api/guard/pass/verify`: Verify pre-approved guest pass code.

### Resident Controller (`/api/resident`)
- `PUT /api/resident/visitor/approve/{id}`: Approve pending visitor entry.
- `PUT /api/resident/visitor/deny/{id}`: Deny pending visitor entry with reason.
- `POST /api/resident/pass/generate`: Generate pre-approved guest pass.
- `POST /api/resident/clubhouse/book`: Book clubhouse venue.
- `GET /api/resident/clubhouse/my-bookings`: Fetch resident's facility bookings.
- `POST /api/resident/problems/report`: Report community issue.
- `GET /api/resident/problems/all`: Fetch all community problems feed.

### Admin Controller (`/api/admin`)
- `GET /api/admin/dashboard`: Fetch overview counters & visitor metrics.
- `GET /api/admin/residents`: List society residents.
- `POST /api/admin/residents`: Add new resident.
- `GET /api/admin/guards`: List security guard roster.
- `POST /api/admin/guards`: Add new security guard.
- `GET /api/admin/clubhouse/bookings`: List facility booking requests.
- `PUT /api/admin/clubhouse/bookings/{id}/status`: Approve or reject venue booking.
- `PUT /api/admin/problems/{id}/resolve`: Mark complaint resolved with admin comment.
- `GET /api/admin/audit-logs`: View system audit trail.

### Emergency Controller (`/api/emergency`)
- `POST /api/emergency/trigger`: Trigger high-priority society SOS alert.
- `GET /api/emergency/active`: List active emergency alerts.
- `PUT /api/emergency/resolve/{id}`: Resolve active emergency alert.

---

## 🔒 6. Security & Authorization Matrix

```
+-----------------------------+-------+-------+----------+
| Feature / Endpoint          | ADMIN | GUARD | RESIDENT |
+-----------------------------+-------+-------+----------+
| Register Visitor at Gate    |   ❌   |   ✅   |    ❌    |
| Checkout Visitor            |   ❌   |   ✅   |    ❌    |
| Approve / Deny Entry        |   ❌   |   ❌   |    ✅    |
| Generate Pre-Approved Pass  |   ❌   |   ❌   |    ✅    |
| Book Clubhouse Venue        |   ❌   |   ❌   |    ✅    |
| Report Community Problem    |   ❌   |   ❌   |    ✅    |
| Approve Facility Bookings   |   ✅   |   ❌   |    ❌    |
| Resolve Community Tickets   |   ✅   |   ❌   |    ❌    |
| Manage Resident Directory   |   ✅   |   ❌   |    ❌    |
| Manage Security Guards      |   ✅   |   ❌   |    ❌    |
| Trigger Emergency SOS       |   ✅   |   ✅   |    ✅    |
| View Analytics & Audit Logs |   ✅   |   ❌   |    ❌    |
+-----------------------------+-------+-------+----------+
```

---

## 🚀 7. How to Run & Deploy GateSync

### Prerequisites
- JDK 17 installed
- Maven 3.8+ (or execute via Spring Boot plugin)
- Node.js / web browser (modern Chrome, Edge, Safari, Firefox)

### Option A: Standard Maven Run
```powershell
mvn clean spring-boot:run
```
- Access application: `http://localhost:8080`
- Access H2 Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:gatesync`, User: `sa`, Password: empty)

### Option B: Docker Container
```bash
docker build -t gatesync-app .
docker run -p 8080:8080 gatesync-app
```

### Option C: Cloud Deployment (Render / Heroku)
- Push code to GitHub repository.
- Link repository to Render Web Service using `render.yaml`.
- Set environment variables (`PORT`, `MONGODB_URI`).

---

## 🔮 8. Roadmap & Technical Enhancements

1. **Twilio Production SMS Client:** Complete live REST HTTP requests in `TwilioSmsProvider.java`.
2. **MongoDB Atlas Full Sync:** Expand dual-write synchronization for `VisitorRequest`, `PreApprovedPass`, and `AuditLog`.
3. **Guard Camera QR Code Scanner:** Integrate `html5-qrcode` library for automatic QR pass scanning at security gates.
4. **WebSocket Auto-Reconnect:** Add exponential backoff reconnection strategies in `app.js` STOMP client.
5. **Automated Integration Testing:** Build JUnit 5 `@SpringBootTest` and MockMvc test cases under `src/test/java`.

---
*Document generated for GateSync Repository.*
