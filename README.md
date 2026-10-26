# Project Backbone — Agricultural Technology & Farmgate Coordination Network

> **Telangana Pilot Prototype (Warangal & Mulugu Districts)**  
> **Shot 3 of 3: Hardening, QA, Polish and Integration Readiness — COMPLETE**

Project Backbone connects smallholder farmers (10 fictional 0.25-acre plots) with modern agricultural technology, precision guidance, and guaranteed direct market coordination in Telangana, India.

---

## 🌾 Pilot Operating Concept

Project Backbone bridges the gap between field-level precision horticulture and guaranteed institutional demand:
- **Smallholder Farmers & Franchise Operators:** Deployed in rural clusters across Warangal and Mulugu districts.
- **Three Cultivation & Infrastructure Tiers:**
  1. *Vertical Hydroponic A-Frames (PVC, closed-loop solar fertigation, culinary greens: Gongura, Coriander, Pudina).*
  2. *Semi-Closed Poly-Canopies (UV 200-micron, 40-mesh anti-insect barriers, Warangal Red Chilli, Vine Tomatoes).*
  3. *Farmgate Processing & Silos (Hermetic 5-MT storage silos, solar dehydrators, onions, pulses, spices).*
- **IoT Sensors & Telemetry Fleet:** Microclimate nodes tracking soil moisture, EC (electrical conductivity), pH, solar radiation, ambient temperature, relative humidity, and flow rate.
- **Precision Agronomy:** AI-assisted and human agronomist advisories calibrated to cultivation stages.
- **Traceable Harvest Lots:** Barcode lot coding linking origin farm, growing conditions, and quality grades (Grade A / Grade B).
- **Guaranteed Farmgate Buyback & B2B Marketplace:** Institutional off-take contracts with retail buyers (Hyderabad Fresh Marts, Deccan Organic Retailers).
- **Cold-Chain Logistics:** Temperature-monitored refrigerated transit mini-vans (TS-03-EB-4192) with delivery acceptance inspection.
- **Guaranteed 24-Hour Settlement:** Instant digital payouts to farmer UPI/bank accounts within 24 hours of farmgate acceptance.

> [!IMPORTANT]
> **Prototype Target Disclaimer:**  
> The project impact goals (such as 2.4x income multiplier, &lt;5% post-harvest waste, 90% water conservation, &ge;95% crop survival, and 100% settlement within 24 hours) represent **modeled strategic pilot targets**, NOT validated retrospective results. They are clearly identified as targets throughout the application.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 16.4.3 (App Router) | React 19, Turbopack, dynamic SSR & headless API routes |
| **Language** | TypeScript 5 | Strict mode (`strict: true`), zero untyped bypasses |
| **Styling** | Tailwind CSS v4 & Vanilla CSS | Deep navy (`#0F1D2F`), Agricultural green (`#1B532D`), Warm neutral (`#F8F9F6`), Gold accents (`#B45309`) |
| **Database ORM** | Prisma 6.19.3 | SQLite (`file:./dev.db`) for self-contained, offline-capable local prototype |
| **API Boundary** | REST Route Handlers under `/api/v1` | Headless, mobile-client reusable business logic |
| **Validation** | Zod | Server-side request schema verification |
| **Icons & Charts** | Lucide React & Recharts | Line icons, responsive data visualizations |
| **Testing** | Vitest 5.0.5 | Automated invariant and concurrency test suite (19 tests) |
| **Integrations** | Replaceable Typed Adapters | Deterministic mock implementations (`INTEGRATION_MODE=mock`) |

---

## 👥 Six Stakeholder Personas & 1-Click Demo Login

The application implements role-aware navigation and server-side authorization guards across 6 distinct roles:

1. **Farmer (`FARMER`):** *M. Narayana* (`usr-farmer-01`) — Own farm unit, crop cycles, live sensor telemetry, advisories, harvest registration, and instant payout ledger.
2. **Franchise Operator (`FRANCHISE_OPERATOR`):** *S. Rama Rao* (`usr-franchise-01`) — Cluster of 5 farm units in Warangal North, solar pump uptime, nutrient dosing, lot curation, and maintenance checklists.
3. **Agronomist (`AGRONOMIST`):** *Dr. P. Radhika* (`usr-agronomist-01`) — Crop health observations, growth stages, EC/pH thresholds, and advisory issuance.
4. **Buyer (`BUYER`):** *Kavitha Sunder* (`usr-buyer-01`) — B2B produce marketplace, lot purchasing, delivery status, and quality inspection reports.
5. **Logistics Operator (`LOGISTICS_OPERATOR`):** *Naresh Naik* (`usr-logistics-01`) — Cold-chain reefer fleet (TS-03-EB-4192), scheduled farmgate pickups, and cargo temperature monitoring.
6. **Administrator (`ADMIN`):** *Rajeev Chary* (`usr-admin-01`) — State network dashboard, user registry, audit logs, and 1-click demo data reset controls.

---

## 🚀 Quickstart & Setup Instructions

A new developer can clone and run the application locally **without any external paid API keys or credentials**:

### Prerequisites
- Node.js 20+ (tested on Node.js v24.21.0)
- npm 10+ (tested on npm 11.19.0)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd farmers
npm install
```

### 2. Environment Configuration
Copy the safe `.env.example` file:
```bash
cp .env.example .env
```
*(Default settings use SQLite `file:./dev.db` and `INTEGRATION_MODE=mock`. Zero paid external API keys required!)*

### 3. Database Initialization & Deterministic Seed
Initialize the SQLite schema and seed the 10 pilot farms, 3 tiers, crop cycles, and baseline records:
```bash
npm run db:push
npm run db:seed
```

### 4. Run Automated Verification Tests
Run the Vitest test suite verifying inventory oversell protection, financial settlement calculation, and role authorization:
```bash
npm run test
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Health Check Commands

All project checks pass cleanly with 100% success:

```bash
# 1. Run full Vitest invariant test suite (6 suites, 19 tests)
npm run test

# 2. Run TypeScript strict typecheck (0 errors)
npm run typecheck

# 3. Run ESLint code quality check (0 errors, 0 warnings)
npm run lint

# 4. Run live HTTP acceptance verification script (12/12 steps verified against localhost:3000)
npx tsx scripts/verify-e2e-demo-journey.ts

# 5. Compile optimized production build (43 routes generated cleanly)
npm run build
```

---

## 📜 Available NPM Scripts

- `npm run dev` — Starts Next.js development server with Turbopack.
- `npm run build` — Compiles optimized production bundle with full static/dynamic analysis.
- `npm run start` — Starts production server.
- `npm run typecheck` — Runs `tsc --noEmit` across all project and test files.
- `npm run lint` — Runs ESLint code quality checks.
- `npm run test` — Executes Vitest automated test suite (`tests/*.test.ts`).
- `npm run db:push` — Synchronizes Prisma schema directly with SQLite database.
- `npm run db:generate` — Regenerates Prisma Client types.
- `npm run db:seed` — Seeds deterministic 10-farmer Telangana pilot dataset.

---

## 🗺️ Route Structure

| Route | Role Access | Description |
|---|---|---|
| `/` | Public | Public landing page, operating concept, and demo entrance |
| `/login` | Public | 6-role demo account selector with 1-click persona switching |
| `/dashboard` | All Roles | Role-aware dashboard tailored to current active identity |
| `/farms` & `/farms/[id]` | Admin, Operator, Farmer | 10 smallholder pilot plots, specifications, and telemetry stream |
| `/crops` | Admin, Agronomist, Farmer | Crop catalogues (Gongura, Chilli, etc.) & active cycle stages |
| `/infrastructure` | Admin, Operator | Capital asset registry, solar capacity (27.5 kW), water reservoirs |
| `/sensors` | Admin, Operator, Agronomist | Simulated ESP32/LoRa telemetry stream and active parameter alerts |
| `/advisories` | Admin, Agronomist, Farmer | AI & agronomist precision guidance and bio-fertigation recipes |
| `/harvests` & `/harvests/[id]` | All Roles | Traceable lots and 5-stage provenance audit graph |
| `/buyback` | Admin, Farmer | Guaranteed floor price contracts and signed farmer off-take |
| `/marketplace` | Admin, Buyer | B2B wholesale produce ordering desk |
| `/orders` & `/orders/[id]` | Admin, Buyer, Logistics | Procurement contracts, stock reservations, fulfillment |
| `/logistics` | Admin, Logistics, Operator | Cold-chain reefer transit, cargo temperatures, and QC handover |
| `/finance` | Admin, Farmer, Buyer | Farmer payables, instant 24h settlements, and CSV export |
| `/impact` | All Roles | Pilot impact targets with explicit disclaimer notice |
| `/notifications` | All Roles | Operational broadcast alerts and messages |
| `/admin/audit` | Admin | Cryptographic audit trail of state changes and payout events |
| `/admin/settings` | Admin | System configuration and 1-click demo database reset |
| `/api/v1/...` | Headless Clients | Reusable API route handlers for future mobile application |

---

## 📚 Technical Documentation

- [`docs/ARCHITECTURE.md`](file:///d:/farmers/docs/ARCHITECTURE.md) — System component boundaries, request flow, and state management.
- [`docs/DOMAIN_MODEL.md`](file:///d:/farmers/docs/DOMAIN_MODEL.md) — Normalized schema, relationships, and business invariants.
- [`docs/INTEGRATION_GUIDE.md`](file:///d:/farmers/docs/INTEGRATION_GUIDE.md) — Adapter specifications, security boundaries, and headless API reference.
- [`docs/DEMO_SCRIPT.md`](file:///d:/farmers/docs/DEMO_SCRIPT.md) — Step-by-step presentation narrative for all 6 personas across Journeys A, B, C, and D.
- [`docs/QA_REPORT.md`](file:///d:/farmers/docs/QA_REPORT.md) — Comprehensive QA report with test matrix, invariant proofs, and limitation documentation.
- [`docs/BUILD_PLAN.md`](file:///d:/farmers/docs/BUILD_PLAN.md) — Project roadmap detailing Shots 1, 2, and 3.
