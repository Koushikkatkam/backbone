# Project Backbone — Live Demonstration & Stakeholder Presentation Script

This script provides an exact, step-by-step presentation narrative for demonstrating Project Backbone to stakeholders, farmers, buyers, and government partners. It exercises the full farmgate-to-settlement lifecycle across all 6 demo personas.

---

## Demo Personas Overview

The prototype includes 6 pre-configured demo identities accessible via the **Persona Switcher** in the top navigation bar:

| Role | Demo Name | User ID | Demonstration Focus |
| :--- | :--- | :--- | :--- |
| **Farmer** | M. Narayana | `usr-farmer-01` | Microclimate telemetry, precision advisories, and farmgate harvest registration. |
| **Franchise Operator** | S. Rama Rao | `usr-franchise-01` | Multi-farm operational oversight, lot curation, and inventory adjustments. |
| **Agronomist** | Dr. P. Radhika | `usr-agronomist-01` | Bio-fertigation recipe issuance, pest mitigation, and canopy health monitoring. |
| **Buyer** | Kavitha Sunder | `usr-buyer-01` | Traceable lot marketplace browsing, purchase order placement, and delivery QC. |
| **Logistics Operator** | Naresh Naik | `usr-logistics-01` | Reefer mini-van dispatch, cold-chain temperature telemetry, and handover. |
| **Admin** | Rajeev Chary | `usr-admin-01` | Instant 24h UPI settlements, operational KPIs, and cryptographic audit ledger. |

---

## Act 1 — The Farmer: Telemetry, Guidance & Farmgate Harvest (Journey A)

### Step 1.1: Switch to Farmer Persona
1. Click the **Demo Persona Switcher** in the top header.
2. Select **M. Narayana (Farmer)**.
3. Observe the personalized greeting, assigned farm unit (*Warangal North Plot #1*), and active crop cycle (*Coriander - Kothimeera*).
4. Point out the **SIMULATED PROTOTYPE** banner, clearly indicating to stakeholders that all values represent controlled pilot simulations.

### Step 1.2: Inspect IoT Microclimate & Simulated Pump Control
1. Click on **Sensors** in the sidebar (or navigate to `/sensors`).
2. Point to the real-time sensor cards:
   - Soil Moisture: `68.4%` (Optimal root zone moisture).
   - Electrical Conductivity (EC): `1.85 mS/cm`.
   - Solution pH: `6.4`.
   - Solar Radiation: `640 W/m²`.
3. Click the **"Trigger Drip Fertigation (15 min)"** button.
4. Show the simulated execution banner confirming the pump control trigger without physical relay dependence.

### Step 1.3: Review Precision AI Agronomy Advisory
1. Click on **Advisories** in the sidebar (or navigate to `/advisories`).
2. Open advisory `ADV-2026-WGL-01`: *"Optimized Bio-Fertigation Recipe for Coriander"*.
3. Note the recommendation: Maintain secondary drip line pressure, apply neem-cake bio-solution, and avoid midday irrigation.
4. Click **"Mark as Actioned"** and observe the status update.

### Step 1.4: Register Farmgate Harvest
1. Click on **Harvests** in the sidebar (or navigate to `/harvests`).
2. Click the **"Register New Harvest"** button.
3. Enter the harvest details:
   - **Gross Quantity Harvested:** `160 kg`
   - **Marketable Quantity:** `152 kg`
   - **Grade:** `Grade A`
   - **Post-Harvest Loss Reason:** `Trimming and leaf culling` (8 kg loss / 5%)
   - **Farmgate Notes:** `Morning harvest, excellent aroma, clean stems`
4. Click **"Submit Harvest Record"**.
5. Confirm that a new traceable lot (`LOT-CORIANDER-...`) is atomically generated and appears in the Available Produce registry.

---

## Act 2 — The Buyer: Buyback Off-Take & Marketplace Order (Journey B)

### Step 2.1: Review Buyback Minimum Support Price
1. In the sidebar, click **Buyback** (or navigate to `/buyback`).
2. Point out offer `BBO-2026-Q4-GONGURA`: Guaranteed floor price of ₹38.00/kg with a ₹5.00/kg Grade-A bonus.
3. Note the active commitment indicator showing that farmers have guaranteed off-take contracts to protect against market price crashes.

### Step 2.2: Switch to Buyer Persona
1. Click the **Demo Persona Switcher** and select **Kavitha Sunder (Buyer)**.
2. Notice the navigation changes dynamically to buyer-relevant modules: **Marketplace**, **Orders**, and **Logistics**.

### Step 2.3: Place B2B Marketplace Order
1. Navigate to **Marketplace** (`/marketplace`).
2. Review available lots. Locate the newly registered Grade-A Coriander lot.
3. Click **"Place Order"**.
4. Order Quantity: Enter `50 kg` (within the available 150 kg limit).
5. Delivery Address: Enter `FreshBasket Distribution Center, Hyderabad`.
6. Click **"Confirm Order"**.
7. Observe that the order (`ORD-...`) transitions to **RESERVED** status, and the lot's available quantity instantly drops from 150 kg to 100 kg.

### Step 2.4: Demonstrate Anti-Oversell Protection
1. Click **"Place Order"** on the same lot again.
2. Attempt to order `120 kg` (which exceeds the remaining 100 kg available).
3. Click **"Confirm Order"**.
4. Point out the error message: `INVARIANT_VIOLATION: Requested 120 kg exceeds available stock. Overselling prevented.` Show stakeholders that the transaction is rejected atomically.

---

## Act 3 — Logistics: Cold-Chain Transit & QC Acceptance (Journey C)

### Step 3.1: Switch to Logistics Operator Persona
1. In the header switcher, select **Naresh Naik (Logistics Operator)**.
2. Navigate to **Logistics** (`/logistics`).

### Step 3.2: Schedule Reefer Pickup
1. Locate the confirmed buyer order in the pending pickup queue.
2. Click **"Schedule Pickup"**.
3. Assign Vehicle: `TS-03-EB-4192` (Refrigerated Reefer Mini-Van).
4. Assign Driver: `Naresh Naik` (`+91 98480 33441`).
5. Confirm the scheduled pickup time.

### Step 3.3: Dispatch Reefer & Monitor Temperature
1. Click **"Dispatch Shipment"**.
2. Note the transit status changes to **IN_TRANSIT**.
3. Point to the live reefer temperature monitor showing `4.1°C` (within the strict 2°C–6°C cold-chain specification to preserve leafy greens freshness).

### Step 3.4: Delivery Handover & Destination Quality Inspection
1. Once arrived at the buyer hub, click **"Record Handover & QC"**.
2. Record destination inspection:
   - **Delivered Quantity:** `50 kg`
   - **Accepted Grade-A Quantity:** `50 kg` (100% acceptance, zero spoilage in reefer transit).
   - **Freshness Score:** `9.8 / 10`.
3. Click **"Confirm Delivery"**.
4. Shipment updates to **DELIVERED**, triggering downstream financial payable generation.

---

## Act 4 — Finance & Admin: Instant 24h Payout & Audit Verification (Journey D)

### Step 4.1: Switch to Admin Persona
1. In the header switcher, select **Rajeev Chary (Admin)**.
2. Navigate to **Finance** (`/finance`).

### Step 4.2: Inspect the Farmer Payables Ledger
1. Review the generated payable for M. Narayana:
   - Produce: 50 kg Grade-A Coriander @ ₹40.00/kg.
   - Gross Amount: ₹2,000.00.
   - Deductions: ₹0.00.
   - **Net Payable:** ₹2,000.00.
   - **Due Date:** Due within 24 hours of delivery.
2. Click **"Export Payables (CSV)"** to demonstrate reporting and accounting interoperability.

### Step 4.3: Disburse Instant Settlement
1. On the pending payable, click **"Disburse Instant Settlement"**.
2. Show the instant settlement execution dialog:
   - Target Farmer: M. Narayana (SBI A/C: `****4921`, UPI: `narayana@upi`).
   - Settlement Rails: Direct UPI Instant Disbursal (Simulated).
3. Click **"Confirm Disbursal"**.
4. Observe the confirmed receipt:
   - Status: **SETTLED**
   - Simulated UPI Reference: `UPI-TXN-TELANGANA-XXXXXXXXX`
   - Settlement Duration: `2.5 hours` (beating the 24-hour SLA commitment).

### Step 4.4: Verify Executive Dashboard & Invariant Consistency
1. Navigate to **Dashboard** (`/dashboard`).
2. Show the matching totals:
   - Total Traceable Harvest Lots
   - Total Marketplace Orders
   - Total Settled 24h Payouts
3. Reiterate to stakeholders that all dashboard figures derive directly from the underlying SQLite database records and are not hard-coded mock values.

### Step 4.5: Inspect Cryptographic Audit Log
1. In the sidebar, navigate to **Admin Audit** (`/admin/audit`).
2. Highlight the complete chronological audit trail:
   - Harvest creation by Farmer (`usr-farmer-01`).
   - Stock reservation by Buyer (`usr-buyer-01`).
   - Shipment dispatch and delivery by Logistics (`usr-logistics-01`).
   - Settlement disbursal by Admin (`usr-admin-01`).
3. Show the SHA-256 cryptographic hash and state diffs for each event, proving non-repudiation and enterprise governance.

---

## Resetting Demo Data
To restore the demonstration database to its clean initial baseline state at any time:
1. Ensure you are signed in as **Rajeev Chary (Admin)**.
2. Navigate to `/admin/settings`.
3. Click **"Reset Demo Database to Initial Baseline"**.
4. Confirm the prompt. The local database will re-seed cleanly in under 2 seconds.
