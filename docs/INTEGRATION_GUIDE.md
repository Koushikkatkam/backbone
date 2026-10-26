# Project Backbone — External Integration & API Reference Guide

This document specifies the integration architecture, provider interface contracts, security boundaries, and reusable `/api/v1` API documentation for Project Backbone.

---

## 1. Architectural Philosophy: Provider Decoupling

Project Backbone is engineered so that business domain logic, database operations, and UI presentation components **never directly import or depend on proprietary third-party SDKs**.

All external service interactions pass through strongly-typed TypeScript interfaces located in [`src/server/integrations/`](file:///d:/farmers/src/server/integrations/):
- **`ITelemetryAdapter`** — IoT sensor fleet ingest and simulated time-series generation.
- **`IAdvisoryAdapter`** — Precision AI agronomy generation based on crop stage and sensor readings.
- **`IPaymentAdapter`** — 24-hour instant digital payouts and settlement processing.
- **`INotificationAdapter`** — Multi-channel broadcast messages (SMS / WhatsApp).
- **`IGeoAdapter`** — Logistics route corridor and transit estimation.

### Execution Modes (`INTEGRATION_MODE`)

| Mode | Behavior | Connectivity |
| :--- | :--- | :--- |
| **`mock`** *(Default)* | All adapters run self-contained, deterministic simulations with explicit `source: "SIMULATED"` / `"DEMO"` flags. | **No external network or API keys required.** |
| **`test`** | Adapters connect to staging/sandbox endpoints (e.g. RazorpayX Test Mode, Twilio Sandbox). | Requires sandbox credentials in `.env.local`. |
| **`live`** | Adapters load production credentials from server-only environment variables. | Requires production credentials. Fails fast if credentials are not configured. |

> [!IMPORTANT]
> The application will **never** automatically fall back from live mode to mock mode in a way that silently presents mock data as verified live data. When in mock mode, all data carries the `SIMULATED` badge.

---

## 2. Provider Interfaces & Implementation Map

| Provider Domain | Interface | Default Implementation File | Consuming Server-Side Service | Config Variable Placeholders |
| :--- | :--- | :--- | :--- | :--- |
| **IoT Telemetry** | `ITelemetryAdapter` | [`src/server/integrations/index.ts`](file:///d:/farmers/src/server/integrations/index.ts) | [`sensorService.ts`](file:///d:/farmers/src/server/services/sensorService.ts), `/api/v1/sensors/telemetry` | `IOT_GATEWAY_URL`, `IOT_GATEWAY_API_KEY` |
| **Agronomy Advisory** | `IAdvisoryAdapter` | [`src/server/integrations/index.ts`](file:///d:/farmers/src/server/integrations/index.ts) | `/api/v1/advisories`, Agronomy Advisory Engine | `AI_AGRONOMY_API_KEY`, `AI_AGRONOMY_MODEL` |
| **Instant Settlement** | `IPaymentAdapter` | [`src/server/integrations/index.ts`](file:///d:/farmers/src/server/integrations/index.ts) | [`financeService.ts`](file:///d:/farmers/src/server/services/financeService.ts), `/api/v1/finance/settlements` | `PAYMENT_GATEWAY_KEY`, `PAYMENT_GATEWAY_SECRET`, `PAYMENT_WEBHOOK_SECRET` |
| **Notifications** | `INotificationAdapter` | [`src/server/integrations/index.ts`](file:///d:/farmers/src/server/integrations/index.ts) | [`logisticsService.ts`](file:///d:/farmers/src/server/services/logisticsService.ts), `/api/v1/notifications` | `SMS_GATEWAY_API_KEY`, `SMS_SENDER_ID` |
| **Geo-Logistics** | `IGeoAdapter` | [`src/server/integrations/index.ts`](file:///d:/farmers/src/server/integrations/index.ts) | [`logisticsService.ts`](file:///d:/farmers/src/server/services/logisticsService.ts), `/api/v1/logistics` | `MAP_GEO_API_KEY` |

---

## 3. Features Operating in Mock Mode

Out-of-the-box, the following complete feature set functions without third-party accounts:
1. **Sensor Telemetry & Graphs:** Generates realistic diurnal curves for temperature, humidity, soil moisture, EC, pH, solar radiation, and flow rate for the ESP32-S3 sensor fleet.
2. **AI Agronomy Advisories:** Generates stage-specific fertigation, disease prevention, and harvest-timing protocols tailored to Warangal microclimates.
3. **Instant 24h Payouts:** Generates UPI-format transaction references (`UPI-TXN-TELANGANA-XXXXX`), calculates settlement times (target < 24 hrs), and records audit log entries with `source: "SIMULATED"`.
4. **Logistics Routing & Cold-Chain Badges:** Calculates distances and estimated transit durations for Warangal/Mulugu agricultural corridors to Hyderabad hubs with recommended reefer set-points (4°C).
5. **Multi-Channel Notifications:** Queues SMS and WhatsApp status alerts in the database with delivery confirmation timestamps.

---

## 4. How to Connect a Future External Provider

When real vendor credentials are provided, follow this procedure without altering UI components or business invariants:

1. **Keep Provider Secrets on Server Only:**
   - Define variable names in `.env.example` with blank placeholders.
   - Set secret keys in `.env.local` or host secret vaults (AWS Secrets Manager, Doppler).
   - **Never** prefix secrets with `NEXT_PUBLIC_`.
2. **Implement the Adapter Class:**
   - Create a class implementing the respective interface in `src/server/integrations/providers/<providerName>Adapter.ts`.
   - Wrap network requests in strict timeouts (e.g., 5000ms) and catch connection errors.
   - Tag successful results with `source: "VERIFIED_LIVE"`.
3. **Register in Adapter Factory:**
   - In [`src/server/integrations/index.ts`](file:///d:/farmers/src/server/integrations/index.ts), check `process.env.INTEGRATION_MODE === "live"`.
   - If keys are present, instantiate the live provider; otherwise instantiate `Mock*Adapter` and log a structured warning.
4. **Validate Against Business Invariant Test Suite:**
   - Run `npm run test` to verify that contract serialization, idempotency handling, and data guarantees remain satisfied.

---

## 5. Security & Permission Considerations

1. **Role Enforcement:** Server-side API handlers verify sessions and role permissions before calling any integration adapter.
2. **Idempotency Safeguard:** Settlement payouts use idempotency tokens derived from `farmerPayable.id` to prevent double-settlement under concurrent triggers or network retries.
3. **Audit Log Non-Repudiation:** Every disbursement and status mutation creates a SHA-256 hashed `AuditLog` entry attributing the operator, timestamp, and payload metadata.

---

## 6. Mobile & Headless API Reference (`/api/v1`)

The prototype exposes clean, headless REST API endpoints under `/api/v1`, ready for mobile application pairing:

### 6.1 Authentication & Session
- **`GET /api/v1/auth/session`**
  - Returns current authenticated user profile and permissions.
  - Returns: `200 OK` with user details, or `{ user: null }` if unauthenticated.
- **`POST /api/v1/auth/session`**
  - Body: `{ userId: string }`
  - Sets HTTP-only, SameSite cookie `pb_demo_session`.
  - Returns: `200 OK` with `{ success: true, user: User }`.

### 6.2 Farm & Sensor Telemetry
- **`GET /api/v1/farms`**
  - Returns farm units filtered by user role permissions.
- **`GET /api/v1/sensors/telemetry?deviceCode={code}&count={n}`**
  - Returns time-series telemetry array with `source` attribution tag.
- **`POST /api/v1/sensors/control`**
  - Body: `{ deviceCode: string, actuatorType: string, state: "ON" | "OFF", durationMinutes: number }`
  - Required Role: `FARMER`, `FRANCHISE_OPERATOR`, `AGRONOMIST`, `ADMIN`
  - Returns: `200 OK` with software execution receipt.

### 6.3 Harvests & Lots
- **`GET /api/v1/harvests`**
  - Returns harvest records and associated traceable lots.
- **`POST /api/v1/harvests`**
  - Body: `{ cropCycleId, grossQuantityKg, marketableQuantityKg, grade, rejectionReason, farmgateNotes, unitPricePerKg }`
  - Required Role: `FARMER`, `FRANCHISE_OPERATOR`, `ADMIN`
  - Invariant: Atomically creates `HarvestRecord`, `HarvestLot`, and `InventoryMovement`.
- **`PATCH /api/v1/harvests/[id]`**
  - Body: `{ quantityAdjustmentKg, reason }`
  - Required Role: `FRANCHISE_OPERATOR`, `ADMIN` (Rejects `FARMER` with `403 Forbidden`).
  - Invariant: Reason must be at least 5 characters; records cryptographic audit trail.

### 6.4 Marketplace & Orders
- **`GET /api/v1/orders`**
  - Returns orders matching role visibility.
- **`POST /api/v1/orders`**
  - Body: `{ items: [{ harvestLotId: string, quantityKg: number }], deliveryAddress?: string }`
  - Required Role: `BUYER`, `ADMIN`
  - Invariant: Atomically reserves lot inventory in transaction; rejects overselling with `400 Bad Request`.
- **`PATCH /api/v1/orders/[id]`**
  - Body: `{ action: "CANCEL", reason: string }`
  - Releases reserved inventory back to available stock.

### 6.5 Logistics & Cold Chain
- **`GET /api/v1/logistics`**
  - Returns shipments, assignments, and temperature telemetry.
- **`POST /api/v1/logistics`**
  - Body: `{ orderId, vehicleNumber, driverName, driverPhone, scheduledPickupTime }`
  - Required Role: `LOGISTICS_OPERATOR`, `ADMIN`
- **`PATCH /api/v1/logistics/[id]`**
  - Body: `{ status: "IN_TRANSIT" | "DELIVERED", currentTemperatureC, acceptedQuantityKg }`
  - Invariant: Delivery requires prior dispatch (`IN_TRANSIT`).

### 6.6 Finance & Settlements
- **`GET /api/v1/finance/settlements`**
  - Returns payables ledger, receivables, and settlements.
- **`POST /api/v1/finance/settlements`**
  - Body: `{ farmerPayableId: string }`
  - Required Role: `ADMIN`
  - Invariant: Disburses settlement via adapter, sets payable to `SETTLED`, and stores immutable `Settlement` record.

### 6.7 Standard Error Response Schema
```json
{
  "error": "UNAUTHORIZED | INVARIANT_VIOLATION | NOT_FOUND | VALIDATION_ERROR",
  "message": "Human-readable description of error.",
  "details": {}
}
```
Standard HTTP status codes enforced:
- **`401 Unauthorized`**: Missing or expired session cookie.
- **`403 Forbidden`**: Insufficient role privileges for the requested endpoint.
- **`400 Bad Request`**: Invariant violation, insufficient inventory, or invalid input parameters.
- **`404 Not Found`**: Target record does not exist.
- **`500 Internal Server Error`**: Unexpected system failure.
