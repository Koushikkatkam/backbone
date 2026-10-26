# Project Backbone — Three-Shot Build Plan

This document establishes the roadmap and milestone division for the three-shot construction of the Project Backbone web prototype.

---

## 🎯 Shot 1: Foundation, Architecture & Design System (COMPLETED)

### Deliverables Achieved
- [x] **Project Scaffolding:** Clean Next.js 16.4 App Router project with TypeScript strict mode and Turbopack.
- [x] **Relational Schema:** Normalized Prisma schema covering 25+ models with SQLite provider (`dev.db`).
- [x] **Deterministic Database Seed:**
  - 10 smallholder farmer units (0.25 acres each) across Warangal and Mulugu.
  - Mixture of all 3 infrastructure tiers (A-Frames, Poly-Canopies, Silos).
  - Crop catalogues (Gongura, Coriander, Mint, Red Chilli, Tomato, Onion).
  - Timestamped sensor telemetry readings and active parameter alerts.
  - Traceable harvest lots, buyback offers, B2B orders, shipments, and instant settlements.
- [x] **Design Tokens & System Components:**
  - Deep navy (`#0F1D2F`), agricultural green (`#1B532D`), warm off-white (`#F8F9F6`), and gold (`#B45309`).
  - Primitives: `Badge`, `StatusBadge`, `Button`, `Card`, `StatCard`, `PrototypeBanner`.
  - Layout: Persistent `Sidebar`, top `Header`, `AppShell`, and 1-click `DemoAccountSwitcher`.
- [x] **Navigable Module Scaffolds:**
  - Public overview (`/`) and demo login (`/login`).
  - Role-aware dashboard (`/dashboard`).
  - Farm registry & unit details (`/farms`, `/farms/[id]`).
  - Crop catalogues & stages (`/crops`).
  - Infrastructure capital assets (`/infrastructure`).
  - IoT telemetry & alerts (`/sensors`).
  - Precision agronomy advisories (`/advisories`).
  - Traceable lots & 5-stage provenance graph (`/harvests`, `/harvests/[id]`).
  - Guaranteed buyback (`/buyback`) & B2B marketplace (`/marketplace`).
  - Procurement orders (`/orders`).
  - Cold-chain logistics & shipments (`/logistics`).
  - Finance, farmer payables & 24h settlements (`/finance`).
  - Pilot impact targets with disclaimer (`/impact`).
  - Broadcast notifications (`/notifications`).
  - Cryptographic audit trail (`/admin/audit`) & 1-click database reset (`/admin/settings`).
- [x] **Reusable API Layer (`/api/v1`):** REST route handlers for session, farms, crops, telemetry, harvests, orders, settlements, impact, and reset.
- [x] **Replaceable Integration Adapters:** Typed interfaces with deterministic mock implementations (`INTEGRATION_MODE=mock`).
- [x] **Automated Testing Suite:** Vitest tests verifying inventory oversell protection, financial calculation formula, and server-side role authorization guards.

---

## ⚡ Shot 2: Complete Application and End-to-End Workflows (COMPLETED)

### Deliverables Achieved Across All Required Modules

- [x] **A. Dynamic Operational Network Dashboard (`/dashboard`):**
  - Fully calculated operational overview pulling directly from live SQLite database records.
  - Active registered farmers (10 smallholders), operational farm units (10 units), active crop cycles categorized by growth stage.
  - Expected harvest in next 30 days (kg), confirmed marketable vs. reserved produce, buyback offered vs. accepted quantities.
  - Orders by status (`RESERVED`, `CONFIRMED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`), active shipments in transit.
  - Outstanding farmer payables and buyer receivables.
  - Warangal North vs. Mulugu Cluster operational summaries with clickable cards routing to filtered records.

- [x] **B. Farmer & Franchise Operations (`/farms`, `/farms/[id]`):**
  - Farmer list/detail, cluster assignment, infrastructure tier, capital asset code, installation checklists.
  - Interactive maintenance activity logging modal with audit trail.
  - Crop stage advancement and growth observation tracking.
  - Server-side role authorization enforcing that farmers access permitted records while admins view network-wide data.

- [x] **C. Crop Operations & Precision Agronomy (`/crops`, `/advisories`):**
  - Configurable crop catalogues (Gongura, Coriander, Mint, Red Chilli, Tomato, Onion) with water requirements, cycle duration, target yield, and market benchmark pricing.
  - Crop cycles with growth observation timeline and field activity logs.
  - Interactive deterministic AI Agronomy Advisory generator with farmer SMS/push notification dispatch.
  - Farmer advisory acknowledgement workflow with verified audit timestamps.

- [x] **D. IoT Sensors & Automation Simulation (`/sensors`):**
  - Recharts time-series visualization for Temperature, Humidity, Soil Moisture, pH, and Electrical Conductivity (EC).
  - Time filters (6h, 24h, 7d) with dynamic threshold indicators.
  - Interactive simulated pump & drip fertigation control panel with mandatory software safety isolation disclaimers.
  - Telemetry batch ingestion simulator generating realistic physiological oscillations.

- [x] **E. Harvest, Grading & Traceability (`/harvests`, `/harvests/[id]`):**
  - Field harvest registration modal with automatic post-harvest loss calculation (`grossQuantityKg - marketableQuantityKg`) and loss rate %.
  - Atomic generation of traceable harvest lot (`LOT-...`) retaining origin farm, variety, harvest timestamp, and quality grade.
  - Lot Provenance page featuring generated base64 QR code with direct PNG download and link copying.
  - Lot grade and stock adjustment modal enforcing mandatory reason and immutable audit log.

- [x] **F. Buyback Offers & Procurement Commitments (`/buyback`):**
  - Configurable buyback agreements with crop, grade, guaranteed floor price, quantity cap, and validity dates.
  - Farmer off-take commitment sign-off enforcing capacity caps and blocking duplicate commitments.
  - Atomic demand-matching tool transferring committed produce to buyer demand without double-counting.

- [x] **G. Buyer Marketplace & Orders (`/marketplace`, `/orders`):**
  - Produce catalogue with real-time stock availability, grade filters, and sorting.
  - Purchasing modal with transactional anti-oversell inventory hold (`reserveLotInventory`).
  - Order cancellation modal atomically releasing reserved stock back to available inventory (`cancelOrderAndRelease`).

- [x] **H. Cold-Chain Logistics & Pickup Queue (`/logistics`):**
  - Farmgate pickup queue rendering confirmed orders awaiting fleet dispatch.
  - Reefer pickup scheduling modal assigning vehicle reference (`TS-03-EB-4192`), driver, and collection point.
  - Vehicle departure dispatch transitioning shipment to `IN_TRANSIT` with cargo temperature logging (`4.1°C`).
  - Delivery confirmation & QC inspection modal enforcing strict invariant: **Delivery cannot precede dispatch**. Automatically creates farmer payable and buyer receivable on acceptance.

- [x] **I. Finance, Invoices & Settlements (`/finance`):**
  - Distinct farmer payable and buyer receivable ledgers derived strictly from final accepted quantities and agreed prices.
  - One-click instant 24-hour payout disbursal (`disbursePayableSettlement`) with receipt modal, simulated NPCI UPI reference, and SMS alert.
  - Direct CSV export links for farmer payables and settlement ledgers (`/api/v1/finance/export`).

- [x] **J. Pilot Analytics & Impact (`/impact`):**
  - Real calculations for post-harvest loss rate, stock reconciliation, buyback off-take fulfillment, and 24h settlement compliance.
  - Report filters by District (Warangal, Mulugu) and Infrastructure Tier.
  - Prominent notices branding all pilot outcomes (2.4x income, <5% waste, 90% water conservation, zero pesticide runoff) as **modeled pilot targets / claims requiring validation**.
  - Impact report CSV export.

- [x] **K. Notifications, Governance & Audit (`/notifications`, `/admin/settings`, `/admin/audit`):**
  - In-app notification center with read/unread tracking and "Mark All as Read" actions.
  - Global debounced search bar in top header querying permitted farms, lots, orders, and crops.
  - Searchable cryptographic audit log storing actor, action, previous/new states, timestamp, and mandatory reasons.
  - Safe demo reset routine re-seeding the Telangana pilot baseline dataset.

### Verification Status & Invariants Passed
- **Production Build:** `next build` with Turbopack completed successfully in 2.4s across all 35+ routes and pages.
- **Lint & Types:** `npm run lint` (0 errors, 0 warnings) and `npm run typecheck` (0 errors).
- **Test Suite:** 14/14 automated tests passing in Vitest (`tests/e2e-journey.test.ts`, `tests/workflows.test.ts`, `tests/inventory-invariants.test.ts`, `tests/finance-invariants.test.ts`, `tests/role-authorization.test.ts`).
- **Live HTTP E2E Verification:** Automated script (`scripts/verify-e2e-demo-journey.ts`) verified the full 12-step demo journey against the running Next.js server with active session cookies and SQLite transactional updates.

---

## 🛡️ Shot 3: Visual Polish, Multi-Device Hardening & Final Presentation (REMAINING SHOT)

The third and final shot delivers the ultimate stakeholder polish and submission readiness:

### 1. Multi-Device & Mobile Viewport Polish
- Mobile navigation drawer and responsive touch target optimization across all table workflows.
- Visual micro-animations, loading skeletons, and polished empty states.

### 2. Comprehensive Browser Automation Run
- End-to-end browser recording running the complete stakeholder demonstration flow across all 6 personas.
- Visual verification of QR code scanning, Recharts responsiveness, and receipt printing.

### 3. Demo Runbook & Executive Summary
- Stakeholder presentation script detailing pilot operations in Warangal and Mulugu.
- Production readiness assessment for migration to PostgreSQL and physical IoT sensor adapters.

