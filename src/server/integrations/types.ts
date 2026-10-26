/**
 * Integration Adapter Typed Interfaces
 * Enforces clean separation between business logic and external provider SDKs.
 * In Shot 1, all adapters run deterministically in 'SIMULATED' or 'DEMO' mode.
 */

export type IntegrationSource = "SIMULATED" | "DEMO" | "TEST" | "VERIFIED_LIVE";

export interface TelemetryReading {
  deviceCode: string;
  timestamp: string;
  soilMoisturePercent: number;
  ambientTemperatureC: number;
  relativeHumidityPercent: number;
  ecMilliSiemens: number;
  phLevel: number;
  solarRadiationWm2: number;
  flowRateLpm: number;
  batteryLevel: number;
  source: IntegrationSource;
}

export interface TelemetryAlertThreshold {
  minPh: number;
  maxPh: number;
  minEc: number;
  maxEc: number;
  minMoisture: number;
  maxTemp: number;
}

export interface AdvisoryGenerationRequest {
  cropName: string;
  stage: string;
  daysPlanted: number;
  latestSensorReading: {
    soilMoisturePercent?: number;
    ambientTemperatureC?: number;
    ecMilliSiemens?: number;
    phLevel?: number;
  };
  observedPestsOrSymptoms?: string;
}

export interface AdvisoryGenerationResult {
  advisoryCode: string;
  title: string;
  category: "NUTRIENT_MANAGEMENT" | "PEST_DISEASE_ALERT" | "IRRIGATION_TUNING" | "HARVEST_TIMING";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  content: string;
  recommendedActions: string[];
  issuedBy: string;
  source: IntegrationSource;
}

export interface SettlementPayoutRequest {
  farmerId: string;
  farmerName: string;
  bankAccountOrUpi: string;
  amount: number;
  lotReferenceCode: string;
}

export interface SettlementPayoutResult {
  settlementCode: string;
  transactionReference: string;
  disbursedAmount: number;
  disbursedAt: string;
  hoursToSettle: number;
  status: "SETTLED" | "IN_PROGRESS" | "FAILED";
  source: IntegrationSource;
}

export interface NotificationDispatchPayload {
  recipientUserId: string;
  recipientPhoneOrEmail?: string;
  title: string;
  message: string;
  category: "ALERT" | "ADVISORY" | "SETTLEMENT" | "SHIPMENT" | "SYSTEM";
  deliveryChannel: "IN_APP" | "SMS_SIMULATED" | "WHATSAPP_SIMULATED";
}

export interface NotificationDispatchResult {
  success: boolean;
  messageId: string;
  deliveredAt: string;
  source: IntegrationSource;
}

export interface GeoRouteEstimate {
  originName: string;
  destinationName: string;
  distanceKm: number;
  estimatedTransitMinutes: number;
  suggestedReeferTempC: number;
  source: IntegrationSource;
}
