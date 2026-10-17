# SocietySync

A Spring Boot + React rewrite of your `Society-Management-System` PHP app, built to match
your GateSync stack (Java 21, Spring Boot 3, JWT, WebSocket/STOMP) and to add the real-time
visitor-approval flow you asked for. Read this whole file before you assume something is
missing — the "Known limitations" section is not an accident, it's the scope you asked for.

## What's actually built (full depth)

- **Auth + persistent login**: short-lived JWT access token + a separate, DB-backed,
  revocable refresh token stored on the device. This is what "log in once" means here —
  closing the app, restarting the phone, or reopening days later re-authenticates silently
  as long as the refresh token hasn't been revoked or expired (7 days by default,
  `app.jwt.refresh-token-days` in `application.properties`).
- **Visitor gate-entry approval, real-time**: a guard logs a visitor →
  `VisitorService.createRequest` pushes a WebSocket/STOMP message to
  `/topic/visitor/{flatNumber}` → the resident's app (subscribed via
  `useVisitorSocket`) throws up a full-screen Approve/Reject popup instantly, no polling.
  The decision pushes straight back to the guard's screen the same way. Unanswered
  requests auto-expire after 10 minutes (`VisitorExpiryScheduler`) so the guard isn't
  stuck waiting on an unreachable phone.
- **Billing, fixed**: the original bug was "admin can only mark cash." Now a `Bill` can be
  closed out two ways that converge on the same status model — `BillService.markPaidCash`
  (admin-collected, records who collected it) and `BillService.markPaidOnline`
  (resident-initiated; wire this to a real payment gateway webhook when you add one).
- **PWA**: installable (manifest + service worker via `vite-plugin-pwa`), offline app-shell
  caching, API calls always go to network (never served stale).
- **Onboarding**: admin creates residents/guards; login ID and temp password
  (last 6 digits of mobile) auto-generated, forced reset on first login — same pattern
  as GateSync.

## Known limitations (scoped out on purpose, not missed)

- **Member/flat management** is basic CRUD only, created implicitly when you add a
  resident. No bulk import, no flat-vacancy tracking beyond a boolean.
- **Event Calendar, Neighbourhood board, Home Services, barcode ID cards** — present in
  the original PHP app, not rebuilt here. `AnnouncementController`/`Announcement` is a
  bare-bones stand-in for the first two. If you want these at full depth, say so and
  they're straightforward additions to this same structure.
- **Payment gateway** is not integrated — `markPaidOnline` records the outcome but there's
  no Razorpay/Stripe/etc. call. That's a real integration decision (account, keys,
  webhook signature verification) I didn't want to guess at for you.
- **No automated tests.** None were written. Given the scope, prioritize writing tests
  for `VisitorService` and `BillService` first — they carry the business logic that
  actually matters.
- **I could not compile-verify the Java backend in the environment I built this in** —
  no internet access to Maven Central there. I did a manual pass (cross-checked every
  import against `pom.xml`, every repository method against its usage, every DTO field
  against its accessors) and fixed one real bug that pass caught (`AdminController` was
  returning the raw `User` entity, leaking `passwordHash` over the API — now returns
  `UserSummaryDto`). But "manually reviewed" is not "compiled." Run `mvn spring-boot:run`
  yourself before trusting this in front of anyone.
- The **frontend did actually build successfully** (`npm run build` — verified, not
  assumed) and generates a working service worker.

## Running it

### Backend
```
cd backend
mvn spring-boot:run
```
Runs on `http://localhost:8080` against an in-memory H2 database by default — no DB setup
needed to try it. To use real MySQL, edit `application.properties`: comment out the H2
block, uncomment the MySQL block, and set your credentials. **Change `app.jwt.secret`
before deploying anywhere real** — the checked-in value is a dev placeholder.

A default admin is seeded on first boot: `admin` / `admin123`, forced password reset on
first login.

### Frontend
```
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`. Set `VITE_API_BASE` in a `.env` file (see `.env.example`)
if your backend isn't on `localhost:8080`.

For a production build: `npm run build`, then serve `dist/` from any static host — that's
what makes it installable as a PWA (needs to be served over HTTPS in real deployment,
`localhost` is exempt for local testing).

## Suggested next steps, in priority order

1. Run both halves locally, fix whatever the Java compiler catches that I couldn't.
2. Add tests for `VisitorService` and `BillService`.
3. Decide on and wire a payment gateway for `markPaidOnline`.
4. Decide whether Event Calendar / Neighbourhood / Home Services are worth rebuilding at
   full depth, or whether `Announcement` covers your actual need well enough.
5. Add member/flat bulk management if you're onboarding a real society, not just demo data.
