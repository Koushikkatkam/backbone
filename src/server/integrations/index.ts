import {
  TelemetryReading,
  AdvisoryGenerationRequest,
  AdvisoryGenerationResult,
  SettlementPayoutRequest,
  SettlementPayoutResult,
  NotificationDispatchPayload,
  NotificationDispatchResult,
  GeoRouteEstimate,
} from "./types";

export * from "./types";

/**
 * Replaceable Telemetry Adapter Interface
 */
export interface ITelemetryAdapter {
  fetchLatestReading(deviceCode: string): Promise<TelemetryReading>;
  generateSimulatedBatch(deviceCode: string, count?: number): Promise<TelemetryReading[]>;
}

/**
 * Replaceable AI Agronomy Advisory Adapter Interface
 */
export interface IAdvisoryAdapter {
  generateAdvisory(req: AdvisoryGenerationRequest): Promise<AdvisoryGenerationResult>;
}

/**
 * Replaceable Payment & Instant 24h Settlement Adapter Interface
 */
export interface IPaymentAdapter {
  disburseInstantSettlement(req: SettlementPayoutRequest): Promise<SettlementPayoutResult>;
}

/**
 * Replaceable Notifications Dispatcher
 */
export interface INotificationAdapter {
  dispatchNotification(payload: NotificationDispatchPayload): Promise<NotificationDispatchResult>;
}

/**
 * Replaceable Geo-Logistics Adapter
 */
export interface IGeoAdapter {
  estimateRoute(origin: string, destination: string): Promise<GeoRouteEstimate>;
}

// -----------------------------------------------------------------------------
// DETERMINISTIC MOCK IMPLEMENTATIONS (INTEGRATION_MODE="mock")
// -----------------------------------------------------------------------------

export class MockTelemetryAdapter implements ITelemetryAdapter {
  async fetchLatestReading(deviceCode: string): Promise<TelemetryReading> {
    const now = new Date().toISOString();
    return {
      deviceCode,
      timestamp: now,
      soilMoisturePercent: 68.4,
      ambientTemperatureC: 28.2,
      relativeHumidityPercent: 62.0,
      ecMilliSiemens: 1.85,
      phLevel: 6.4,
      solarRadiationWm2: 640.0,
      flowRateLpm: 14.2,
      batteryLevel: 94.0,
      source: "SIMULATED",
    };
  }

  async generateSimulatedBatch(deviceCode: string, count = 12): Promise<TelemetryReading[]> {
    const list: TelemetryReading[] = [];
    const baseDate = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(baseDate.getTime() - i * 3600 * 1000).toISOString();
      const tempVariation = Math.sin((i / 12) * Math.PI) * 4.5;
      const ecVariation = (i % 3) * 0.1;

      list.push({
        deviceCode,
        timestamp: time,
        soilMoisturePercent: 65.0 + ((i * 1.7) % 8),
        ambientTemperatureC: 27.0 + tempVariation,
        relativeHumidityPercent: 60.0 - tempVariation * 1.5,
        ecMilliSiemens: 1.8 + ecVariation,
        phLevel: 6.3 + (i % 2 === 0 ? 0.1 : -0.1),
        solarRadiationWm2: Math.max(0, 500 + Math.sin(i) * 300),
        flowRateLpm: i % 4 === 0 ? 16.5 : 0.0,
        batteryLevel: 95.0 - i * 0.1,
        source: "SIMULATED",
      });
    }
    return list;
  }
}

export class MockAdvisoryAdapter implements IAdvisoryAdapter {
  async generateAdvisory(req: AdvisoryGenerationRequest): Promise<AdvisoryGenerationResult> {
    const isVegetative = req.stage.toUpperCase().includes("VEGETATIVE");

    return {
      advisoryCode: `ADV-${Date.now().toString().slice(-6)}`,
      title: isVegetative
        ? `Optimized Bio-Fertigation Recipe for ${req.cropName} (Vegetative Phase)`
        : `Harvest Readiness & Grade-A Quality Protocol for ${req.cropName}`,
      category: isVegetative ? "NUTRIENT_MANAGEMENT" : "HARVEST_TIMING",
      severity: "MEDIUM",
      content: `Telemetry indicates optimal canopy microclimate (EC: ${req.latestSensorReading?.ecMilliSiemens ?? 1.8} mS/cm, pH: ${req.latestSensorReading?.phLevel ?? 6.4}). For ${req.cropName} at day ${req.daysPlanted ?? 28}, maintain secondary drip line pressure and calibrate neem-cake bio-solution to forestall fungal damping.`,
      recommendedActions: [
        "Maintain solar fertigation cycle at 07:30 AM and 04:30 PM (15 mins each).",
        "Inspect lower leaf stems for early-stage aphid colonization.",
        "Ensure nutrient reservoir EC does not exceed 2.2 mS/cm.",
      ],
      issuedBy: "AI Agronomy Engine v2.4 (Simulated Model)",
      source: "SIMULATED",
    };
  }
}

export class MockPaymentAdapter implements IPaymentAdapter {
  async disburseInstantSettlement(req: SettlementPayoutRequest): Promise<SettlementPayoutResult> {
    const code = `SETTLE-${Date.now().toString().slice(-6)}`;
    const txRef = `UPI-TXN-TELANGANA-${Math.floor(100000000 + Math.random() * 900000000)}`;

    return {
      settlementCode: code,
      transactionReference: txRef,
      disbursedAmount: req.amount,
      disbursedAt: new Date().toISOString(),
      hoursToSettle: 2.5, // Target invariant: < 24 hours
      status: "SETTLED",
      source: "SIMULATED",
    };
  }
}

export class MockNotificationAdapter implements INotificationAdapter {
  async dispatchNotification(_payload: NotificationDispatchPayload): Promise<NotificationDispatchResult> {
    void _payload;
    return {
      success: true,
      messageId: `NOTIF-MSG-${Date.now().toString().slice(-8)}`,
      deliveredAt: new Date().toISOString(),
      source: "SIMULATED",
    };
  }
}

export class MockGeoAdapter implements IGeoAdapter {
  async estimateRoute(origin: string, destination: string): Promise<GeoRouteEstimate> {
    return {
      originName: origin,
      destinationName: destination,
      distanceKm: 142.5,
      estimatedTransitMinutes: 165,
      suggestedReeferTempC: 4.0,
      source: "SIMULATED",
    };
  }
}

// -----------------------------------------------------------------------------
// ADAPTER FACTORY
// -----------------------------------------------------------------------------
export const telemetryAdapter: ITelemetryAdapter = new MockTelemetryAdapter();
export const advisoryAdapter: IAdvisoryAdapter = new MockAdvisoryAdapter();
export const paymentAdapter: IPaymentAdapter = new MockPaymentAdapter();
export const notificationAdapter: INotificationAdapter = new MockNotificationAdapter();
export const geoAdapter: IGeoAdapter = new MockGeoAdapter();
