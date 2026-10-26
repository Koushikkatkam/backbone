# Project Backbone — Technical Architecture Specification

## 1. Architectural Principles & Goals

Project Backbone is architected as a modular, type-safe full-stack TypeScript application running on Next.js App Router. It is designed to demonstrate a high-fidelity agricultural coordination and farm-to-market network in Telangana, India (Warangal & Mulugu Pilot).

Key architectural goals:
1. **Self-Contained & Deterministic Prototype:** Requires zero external paid API keys, running locally with SQLite (`dev.db`) and deterministic mock integration adapters.
2. **Clean Layer Separation:** Domain business logic, invariants, and validation are decoupled from visual UI components and raw persistence.
3. **Reusable API Surface (`/api/v1`):** Endpoints under `/api/v1` ensure that future mobile applications (Android/iOS for field operators and farmers) interact with the identical business domain layer.
4. **Strict Role-Based Authorization:** Server-side role validation guarantees that hiding a button in the UI is never treated as security.
5. **Clear Migration Path to PostgreSQL:** Designed with standard relational normalization so that moving to production PostgreSQL requires only a single connection string change.

---

## 2. System Layering & Directory Boundaries

The codebase adheres to a modular hexagonal-inspired directory structure:

```
farmers/
├── prisma/
│   ├── schema.prisma        # Normalized relational schema with SQLite datasource
│   ├── dev.db               # Local SQLite database (ignored by git)
│   └── seed.ts              # Deterministic Telangana pilot seed (10 farms, 3 tiers)
├── src/
│   ├── app/                 # Next.js App Router pages, layouts, and API endpoints
│   │   ├── (auth)/          # Demo login and identity selection
│   │   ├── api/v1/          # Headless RESTful business API route handlers
│   │   ├── dashboard/       # Role-aware dashboard with simulated telemetry cards
│   │   ├── farms/           # Farm units registry and specification detail
│   │   ├── crops/           # Crop catalogues, active cycles, and observations
│   │   ├── infrastructure/  # Capital assets, solar capacity, maintenance logs
│   │   ├── sensors/         # Simulated ESP32/LoRaWAN telemetry streams & controls
│   │   ├── advisories/      # Precision guidance and bio-fertigation recipes
│   │   ├── harvests/        # Traceable lots and provenance graph
│   │   ├── buyback/         # Guaranteed floor price procurement offers
│   │   ├── marketplace/     # B2B produce ordering desk
│   │   ├── orders/          # Procurement contracts and stock reservations
│   │   ├── logistics/       # Cold-chain reefer fleet & transit temperature
│   │   ├── finance/         # Farmer payables and instant 24h settlements
│   │   ├── impact/          # Modeled pilot impact targets
│   │   ├── notifications/   # System broadcast messages
│   │   └── admin/           # Cryptographic audit logs and demo reset
│   ├── components/
│   │   ├── ui/              # Reusable design system primitives (Badge, Card, StatCard, Button)
│   │   ├── layout/          # Persistent Sidebar, Header, AppShell, HeaderSearch, and DemoAccountSwitcher
│   │   ├── advisories/      # Advisory cards and actioning modals
│   │   ├── buyback/         # Commitment dialogs and contract cards
│   │   ├── farms/           # Farm detail and sensor preview widgets
│   │   ├── finance/         # Settlement action drawers and CSV exporter
│   │   ├── harvests/        # Harvest creation form and lot detail drawer
│   │   ├── logistics/       # Transit cards, schedule dialog, and dispatch modal
│   │   ├── marketplace/     # Order placement modal and stock availability pill
│   │   ├── notifications/   # Notification list and broadcast drawers
│   │   └── sensors/         # Actuator control buttons and telemetry charts
│   ├── lib/
│   │   ├── prisma.ts        # Singleton Prisma client instance
│   │   ├── session.ts       # Secure cookie demo session handling & requireRole guard
│   │   ├── constants.ts     # 6 Demo identities and role navigation matrix
│   │   └── utils.ts         # Formatting (INR currency, weights, dates) & cn helper
│   └── server/
│       ├── integrations/    # Replaceable adapters (telemetry, AI, payment, notification, geo)
│       └── services/        # Core domain services enforcing business invariants
│           ├── harvestService.ts   # Oversell prevention, lot reservations, post-harvest losses
│           ├── buybackService.ts   # Floor price agreements and demand matching
│           ├── logisticsService.ts # Dispatch state machine and handover acceptance
│           ├── financeService.ts   # Settlement calculation and instant payout execution
│           ├── sensorService.ts    # Actuator triggers and telemetry streams
│           └── auditService.ts     # Immutable cryptographic audit trail
├── tests/                   # Automated Vitest invariant test suite (6 suites, 19 tests)
├── scripts/                 # Live HTTP acceptance verification (verify-e2e-demo-journey.ts)
└── docs/                    # Architectural, domain, and QA documentation
```

---

## 3. Data & Request Flow

```
+-------------------------------------------------------------+
| Browser Client / Future Mobile App                         |
+-------------------------------------------------------------+
                              |
                     HTTP / Cookie Session
                              v
+-------------------------------------------------------------+
| Next.js App Router (Server Components & /api/v1 Handlers)   |
+-------------------------------------------------------------+
                              |
               Session Validation & Role Guard
                              v
+-------------------------------------------------------------+
| Domain Service Layer (src/server/services/)                |
| - harvestService.ts   (Oversell prevention, reservation hold)|
| - buybackService.ts   (Contract commitment, demand matching)|
| - logisticsService.ts (Shipment transitions, QC handover)   |
| - financeService.ts   (Pure calculation, 24h payout trigger)|
| - auditService.ts     (Immutable state transition log)      |
+-------------------------------------------------------------+
        |                                             |
 Replaceable Adapter Boundary                 Prisma ORM Client
        v                                             v
+-----------------------------+           +-------------------+
| src/server/integrations/    |           | SQLite Database   |
| - MockTelemetryAdapter      |           | (dev.db)          |
| - MockPaymentAdapter        |           +-------------------+
| - MockAdvisoryAdapter       |
| - MockNotificationAdapter   |
| - MockGeoAdapter            |
+-----------------------------+
```

---

## 4. Session & Authorization Model

Because this is a realistic prototype intended for live client demonstrations, stakeholder alignment, and testing, authentication is managed via a dedicated **Demo Session Cookie** (`pb_demo_session`):
- Stored as an HTTP-only, secure, `SameSite=lax` cookie.
- Switching identities via `<DemoAccountSwitcher />` triggers `POST /api/v1/auth/session` which securely signs and writes the session cookie for the selected user.
- **Server-Side Authorization:** Domain services and route handlers execute `requireRole(currentUser, [allowedRoles])`. An unauthorized role returns an explicit `HTTP 403 Forbidden` response, preventing bypass even if UI elements are manipulated in the client.

---

## 5. Visual Design System Tokens

The visual language follows the deliberate color scheme requested:
- **Primary Navy:** `#0F1D2F` and `#08111E` for primary typography, persistent left sidebar, and structural contrast.
- **Agricultural Green:** `#1B532D`, `#133E21`, and `#E8F5EC` for active states, verified lots, healthy sensors, and positive transitions.
- **Warm Off-White Surfaces:** `#F8F9F6` background paired with pure `#FFFFFF` cards and `#E2E8E0` borders to ensure high scannability.
- **Restrained Gold & Amber:** `#B45309`, `#D97706`, and `#FEF3C7` reserved for financial transactions, floor price guarantees, and telemetry warnings.

---

## 6. PostgreSQL Production Migration Plan

The application is structured to allow zero-downtime migration from SQLite to PostgreSQL:
1. Update `prisma/schema.prisma` datasource provider from `"sqlite"` to `"postgresql"`.
2. Configure `.env` with the PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://backbone_admin:SecretPass@postgres-db.internal:5432/backbone_prod?schema=public"
   ```
3. Run Prisma migration:
   ```bash
   npx prisma migrate dev --name init_postgres
   ```
4. Run `npm run db:seed` to populate baseline catalogues and configuration.
All schema models utilize standard relational types and cuid keys, ensuring seamless cross-database compatibility.
