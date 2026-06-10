"use client";
import { useState, useRef, useCallback } from "react";

const DEVICES = [
  { id: "tn-foss", label: "TN-FOSS", proto: "SNMP v2c", color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/5" },
  { id: "e-passtel", label: "E-PASSTEL", proto: "NETCONF", color: "text-blue-400 border-blue-500/40 bg-blue-500/5" },
  { id: "of-passtel", label: "OF-PASSTEL", proto: "SNMP v3", color: "text-violet-400 border-violet-500/40 bg-violet-500/5" },
  { id: "if-passtel", label: "IF-PASSTEL", proto: "SFTP", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/5" },
];

const PIPELINE_NODES = ["Network Devices", "EMS", "DDC", "Kafka", "IDB", "Zabbix", "Virtuora VXM"];

const LOG_TEMPLATES = (device: string, proto: string) => [
  `[09:00:00.001][INFO ][DDC] Starting data collection cycle for ${device}`,
  `[09:00:00.050][INFO ][DDC] Protocol: ${proto} — connecting to ${device}`,
  `[09:00:00.210][INFO ][DDC] Polling OID .1.3.6.1.2.1.2.2.1 (ifTable)`,
  `[09:00:00.390][INFO ][DDC] Received 48 metric rows from ${device}`,
  `[09:00:00.430][INFO ][DDC] Transforming to internal schema — 48 records`,
  `[09:00:00.510][INFO ][KAFKA] Producing 48 records to topic: ras-metrics-${device.toLowerCase()}`,
  `[09:00:00.620][INFO ][KAFKA] All records ACK'd — offset: 102400`,
  `[09:00:00.700][INFO ][IDB] Writing 48 rows to PostgreSQL — table: device_metrics`,
  `[09:00:00.820][INFO ][IDB] Committed — 48 rows written, 0 errors`,
  `[09:00:00.890][INFO ][VXM] Metrics pushed to Virtuora VXM — dashboard updated`,
  `[09:00:00.950][INFO ][DDC] Cycle complete: ${device} — 48 metrics in 949ms`,
];

const FAULT_LOGS = (device: string) => [
  `[09:05:14.001][WARN ][DDC] SNMP timeout for ${device} — retrying (1/3)`,
  `[09:05:19.005][WARN ][DDC] SNMP timeout for ${device} — retrying (2/3)`,
  `[09:05:24.010][ERROR][DDC] ${device} unreachable after 3 retries — raising alarm`,
  `[09:05:24.100][INFO ][KAFKA] Producing fault event: DEVICE_UNREACHABLE/${device}`,
  `[09:05:24.200][INFO ][ZABBIX] Alert triggered: ${device} DOWN — severity CRITICAL`,
  `[09:05:24.300][INFO ][ZABBIX] Notification sent to NOC team via email + SMS`,
];

export default function RasNmsDemo() {
  const [device, setDevice] = useState(DEVICES[0]);
  const [logs, setLogs] = useState<string[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [faultInjected, setFaultInjected] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => { timerRefs.current.forEach(clearTimeout); timerRefs.current = []; };

  const startMonitoring = useCallback(() => {
    clearTimers();
    setLogs([]);
    setFaultInjected(false);
    setAlert(null);
    setMonitoring(true);

    const lines = LOG_TEMPLATES(device.id.toUpperCase(), device.proto);
    lines.forEach((line, i) => {
      const t = setTimeout(() => {
        setLogs((prev) => [...prev, line]);
        setActiveNode(Math.min(Math.floor((i / lines.length) * PIPELINE_NODES.length), PIPELINE_NODES.length - 1));
        if (i === lines.length - 1) {
          setMonitoring(false);
          setActiveNode(null);
        }
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, i * 200);
      timerRefs.current.push(t);
    });
  }, [device]);

  const injectFault = () => {
    if (faultInjected) return;
    setFaultInjected(true);
    const lines = FAULT_LOGS(device.id.toUpperCase());
    lines.forEach((line, i) => {
      const t = setTimeout(() => {
        setLogs((prev) => [...prev, line]);
        if (line.includes("[ZABBIX]") && line.includes("Alert triggered")) {
          setAlert(`🚨 ZABBIX ALERT: ${device.label} DOWN — NOC notified`);
        }
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, i * 350);
      timerRefs.current.push(t);
    });
  };

  const lineColor = (line: string) => {
    if (line.includes("[ERROR]")) return "text-red-400";
    if (line.includes("[WARN ]")) return "text-amber-400/80";
    if (line.includes("[ZABBIX]")) return "text-orange-400";
    if (line.includes("[KAFKA]")) return "text-violet-400";
    if (line.includes("[IDB]")) return "text-blue-300/80";
    if (line.includes("[VXM]")) return "text-emerald-400";
    return "text-zinc-400";
  };

  return (
    <div className="space-y-4">
      {/* Device selection + controls */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="text-xs text-zinc-500 mb-3 font-semibold">Select Device Family</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => { setDevice(d); setLogs([]); setFaultInjected(false); setAlert(null); }}
              className={`p-3 rounded-lg border text-left transition-all ${
                device.id === d.id ? d.color : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <div className="text-xs font-semibold">{d.label}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{d.proto}</div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={startMonitoring}
            disabled={monitoring}
            className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            {monitoring ? "Collecting metrics..." : "▶ Start Monitoring"}
          </button>
          <button
            onClick={injectFault}
            disabled={faultInjected || logs.length === 0}
            className="px-4 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed text-sm rounded-lg transition-colors"
          >
            💥 Inject Fault
          </button>
        </div>
      </div>

      {/* Pipeline diagram */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-x-auto">
        <div className="flex items-center min-w-max gap-0">
          {PIPELINE_NODES.map((node, i) => (
            <div key={node} className="flex items-center">
              <div className={`rounded-lg border px-3 py-2 text-center transition-all duration-300 min-w-[80px] ${
                activeNode === i
                  ? "border-blue-400/60 bg-blue-500/10 scale-105"
                  : activeNode !== null && i < activeNode
                  ? "border-zinc-700 bg-zinc-800/60 opacity-70"
                  : "border-zinc-800 bg-zinc-900"
              }`}>
                <div className={`text-xs font-semibold transition-colors ${activeNode === i ? "text-blue-300" : "text-zinc-400"}`}>
                  {node}
                </div>
                {activeNode === i && (
                  <div className="flex justify-center mt-1 gap-0.5">
                    {[0, 1, 2].map((j) => (
                      <span key={j} className="w-1 h-1 rounded-full bg-blue-400 animate-bounce inline-block" style={{ animationDelay: `${j * 100}ms` }} />
                    ))}
                  </div>
                )}
              </div>
              {i < PIPELINE_NODES.length - 1 && (
                <div className={`w-6 h-px transition-all ${activeNode !== null && i < activeNode ? "bg-blue-500/50" : "bg-zinc-800"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className="px-4 py-3 rounded-xl border border-red-500/40 bg-red-500/10 flex items-center gap-3">
          <div className="text-lg">🚨</div>
          <div className="text-sm font-semibold text-red-300">{alert}</div>
        </div>
      )}

      {/* Log stream */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500">DDC Server log — [timestamp][LEVEL][MODULE]</span>
          {monitoring && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block ml-auto" />}
        </div>
        <div className="bg-zinc-950 p-4 h-52 overflow-y-auto font-mono text-xs leading-relaxed">
          {logs.length === 0 ? (
            <p className="text-zinc-700 italic">Start monitoring to see the DDC log stream</p>
          ) : (
            logs.map((line, i) => (
              <div key={i} className={lineColor(line)}>{line}</div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
