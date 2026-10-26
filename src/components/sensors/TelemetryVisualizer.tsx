"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Play,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface TelemetryPoint {
  id: string;
  timestamp: string;
  timeLabel: string;
  soilMoisturePercent: number | null;
  ambientTemperatureC: number | null;
  relativeHumidityPercent: number | null;
  ecMilliSiemens: number | null;
  phLevel: number | null;
}

interface TelemetryVisualizerProps {
  device: {
    id: string;
    deviceCode: string;
    farmName: string;
    farmUnitId: string;
    model: string;
    batteryLevel: number;
    status: string;
  };
  readings: TelemetryPoint[];
  allFarms: Array<{ id: string; name: string }>;
}

export function TelemetryVisualizer({ device, readings, allFarms }: TelemetryVisualizerProps) {
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<"soilMoisture" | "temperature" | "ec" | "ph">("soilMoisture");
  const [timeFilter, setTimeFilter] = useState<"6h" | "24h" | "7d">("24h");
  const [ingestLoading, setIngestLoading] = useState(false);

  // Control Modal State
  const [isControlOpen, setIsControlOpen] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState(device.farmUnitId || allFarms[0]?.id || "");
  const [command, setCommand] = useState<"START_DRIP" | "NUTRIENT_FLUSH" | "CALIBRATE_PH" | "STOP_DRIP">("START_DRIP");
  const [controlLoading, setControlLoading] = useState(false);
  const [controlResult, setControlResult] = useState<string | null>(null);
  const [controlError, setControlError] = useState<string | null>(null);

  // Filtered readings for chart
  const chartData = readings.map((r) => ({
    time: r.timeLabel,
    soilMoisture: r.soilMoisturePercent,
    temperature: r.ambientTemperatureC,
    ec: r.ecMilliSiemens,
    ph: r.phLevel,
  }));

  const handleIngestTelemetry = async () => {
    setIngestLoading(true);
    try {
      const res = await fetch("/api/v1/sensors/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceCode: device.deviceCode }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIngestLoading(false);
    }
  };

  const handleExecuteControl = async (e: React.FormEvent) => {
    e.preventDefault();
    setControlLoading(true);
    setControlError(null);
    setControlResult(null);

    try {
      const res = await fetch("/api/v1/sensors/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmUnitId: selectedFarmId,
          command,
          durationMinutes: 15,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Simulation control failed");
      }

      setControlResult(data.message);
      setTimeout(() => {
        setIsControlOpen(false);
        setControlResult(null);
        router.refresh();
      }, 1800);
    } catch (err: unknown) {
      setControlError(err instanceof Error ? err.message : "Control failed");
    } finally {
      setControlLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="font-bold text-sm text-[#0F1D2F]">
              Node: {device.deviceCode} &bull; {device.farmName}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {device.model}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
              SIMULATED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Battery: {device.batteryLevel}% &bull; LoRaWAN 865 MHz &bull; Target EC: 1.8 - 2.2 mS/cm &bull; Target pH: 6.0 - 6.5
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleIngestTelemetry}
            disabled={ingestLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Generate simulated sensor reading"
          >
            {ingestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
            <span>Simulate Ingest</span>
          </button>

          <button
            onClick={() => setIsControlOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-emerald-300" />
            <span>Simulated Pump &amp; Fertigation Panel</span>
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSelectedMetric("soilMoisture")}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedMetric === "soilMoisture"
                  ? "bg-white text-emerald-800 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Soil Moisture (%)
            </button>
            <button
              onClick={() => setSelectedMetric("temperature")}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedMetric === "temperature"
                  ? "bg-white text-emerald-800 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Ambient Temp (°C)
            </button>
            <button
              onClick={() => setSelectedMetric("ec")}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedMetric === "ec"
                  ? "bg-white text-emerald-800 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Basin EC (mS/cm)
            </button>
            <button
              onClick={() => setSelectedMetric("ph")}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedMetric === "ph"
                  ? "bg-white text-emerald-800 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Basin pH Level
            </button>
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-1 text-xs">
            {(["6h", "24h", "7d"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf)}
                className={`px-2.5 py-1 rounded-md font-semibold ${
                  timeFilter === tf
                    ? "bg-[#0F1D2F] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Line Visualizer */}
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No telemetry readings recorded for this window.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F1D2F",
                    border: "none",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                />
                {selectedMetric === "soilMoisture" && (
                  <Line
                    type="monotone"
                    dataKey="soilMoisture"
                    name="Soil Moisture (%)"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#10B981" }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {selectedMetric === "temperature" && (
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature (°C)"
                    stroke="#0284C7"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#0284C7" }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {selectedMetric === "ec" && (
                  <Line
                    type="monotone"
                    dataKey="ec"
                    name="Basin EC (mS/cm)"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#F59E0B" }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {selectedMetric === "ph" && (
                  <Line
                    type="monotone"
                    dataKey="ph"
                    name="Basin pH"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#8B5CF6" }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Simulated Pump/Fertigation Control Modal */}
      <Modal isOpen={isControlOpen} onClose={() => setIsControlOpen(false)} maxWidth="max-w-lg">
        <div className="text-xs">
          <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Simulated Hardware Control
                </span>
                <h3 className="font-bold text-sm tracking-tight text-white mt-0.5">
                  Hydroponic Automation &amp; Fertigation Panel
                </h3>
              </div>
              <button
                onClick={() => setIsControlOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteControl} className="p-6 space-y-4">
              {controlError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{controlError}</span>
                </div>
              )}

              {controlResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{controlResult}</span>
                </div>
              )}

              {/* Strict Hardware Isolation Disclaimer */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Prototype Hardware Safety Isolation Active</span>
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  It is impossible for this prototype to actuate physical farm pumps, valves, or dosing solenoids. All actions simulate state changes and generate cryptographic audit logs.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Farm Unit</label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] bg-white outline-none"
                >
                  {allFarms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Automated Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCommand("START_DRIP")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      command === "START_DRIP"
                        ? "bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-600/30"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-bold block">15-min Solar Drip</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Low-pressure solar pulse
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommand("NUTRIENT_FLUSH")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      command === "NUTRIENT_FLUSH"
                        ? "bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-600/30"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-bold block">Root Basin Flush</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Dilute high EC back to 1.8
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommand("CALIBRATE_PH")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      command === "CALIBRATE_PH"
                        ? "bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-600/30"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-bold block">Calibrate pH Buffer</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Buffer dose to target 6.2
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommand("STOP_DRIP")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      command === "STOP_DRIP"
                        ? "bg-rose-50 border-rose-600 text-rose-950 ring-2 ring-rose-600/30"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-bold block text-rose-800">Emergency Stop</span>
                    <span className="text-[10px] text-rose-600 block mt-0.5">
                      Close all solenoid valves
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsControlOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={controlLoading}
                  className="px-5 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {controlLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Execute Simulated Command</span>
                </button>
              </div>
            </form>
        </div>
      </Modal>
    </div>
  );
}
