"use client";
import { useState, useRef, useCallback } from "react";

const DEVICES = [
  { id: "tn-foss", label: "TN-FOSS", proto: "SNMP v2c", color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/5" },
  { id: "e-passtel", label: "E-PASSTEL", proto: "NETCONF", color: "text-blue-400 border-blue-500/40 bg-blue-500/5" },
  { id: "of-passtel", label: "OF-PASSTEL", proto: "SNMP v3", color: "text-violet-400 border-violet-500/40 bg-violet-500/5" },
  { id: "if-passtel", label: "IF-PASSTEL", proto: "SFTP", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/5" },
];

const ARCH = [
  {
    id: "devices", layer: "Network Devices", layerSub: "Managed Device Families (4 vendors)", chi: false,
    nodes: [
      { icon: "🔵", label: "TN-FOSS", desc: "Transmission Network — SNMP v2c ifTable polling" },
      { icon: "🟦", label: "E-PASSTEL", desc: "Ethernet Passive — NETCONF get-config collection" },
      { icon: "🟣", label: "OF-PASSTEL", desc: "Optical Fiber — SNMP v3 authPriv mplsLspFecTable" },
      { icon: "🟢", label: "IF-PASSTEL", desc: "Infrastructure — SFTP CSV performance file transfer" },
    ],
    conn: { label: "Multi-protocol collection (SNMP v2c/v3, NETCONF, SFTP)", proto: "per-device protocol" },
  },
  {
    id: "ddc", layer: "DDC — Data Collection", layerSub: "★ Chi Nguyen @ TMA Solutions", chi: true,
    nodes: [
      { icon: "⚙", label: "DDC Server", desc: "Orchestrates all collection cycles — per-device protocol handlers" },
      { icon: "🔵", label: "SNMP Handler", desc: "v2c (community) + v3 (authPriv SHA/AES128) protocol engines" },
      { icon: "🔗", label: "NETCONF Handler", desc: "SSH session management, get-config xpath, rpc-reply parsing" },
      { icon: "📁", label: "SFTP Handler", desc: "SSH key auth, CSV file download + structured parsing" },
    ],
    conn: { label: "Kafka produce — 48 metric records per device per cycle", proto: "Kafka topic: ras-metrics-{device}" },
  },
  {
    id: "kafka", layer: "Message Bus", layerSub: "Apache Kafka", chi: false,
    nodes: [{ icon: "📨", label: "Kafka", desc: "Durable message queue — decouples collection from storage & alerting" }],
    conn: { label: "Kafka consume — metrics + fault events", proto: "Consumer group: ras-consumers" },
  },
  {
    id: "storage", layer: "Storage & Alerting", layerSub: "IDB · Zabbix · Virtuora VXM", chi: false,
    nodes: [
      { icon: "🗄", label: "IDB (PostgreSQL)", desc: "Timeseries metric storage — indexed by device + timestamp" },
      { icon: "🔔", label: "Zabbix", desc: "Threshold alerting — triggers NOC notifications on DEVICE_UNREACHABLE" },
      { icon: "📊", label: "Virtuora VXM", desc: "Executive dashboard — aggregated KPIs, SLA views" },
    ],
    conn: null,
  },
];

const LOG_TEMPLATES: Record<string, string[]> = {
  "tn-foss": [
    `[09:00:00.001][INFO ][DDC] Starting data collection cycle for TN-FOSS`,
    `[09:00:00.050][INFO ][DDC] Protocol: SNMP v2c — connecting to TN-FOSS:161`,
    `[09:00:00.210][INFO ][DDC] Polling OID .1.3.6.1.2.1.2.2.1 (ifTable) — community: public`,
    `[09:00:00.390][INFO ][DDC] SNMP GET-NEXT complete — 48 interface rows received`,
    `[09:00:00.430][INFO ][DDC] Transforming to internal schema — 48 records`,
    `[09:00:00.510][INFO ][KAFKA] Producing 48 records to topic: ras-metrics-tn-foss`,
    `[09:00:00.620][INFO ][KAFKA] All records ACK'd — offset: 102400`,
    `[09:00:00.700][INFO ][IDB] Writing 48 rows to PostgreSQL — table: device_metrics`,
    `[09:00:00.820][INFO ][IDB] Committed — 48 rows written, 0 errors`,
    `[09:00:00.890][INFO ][VXM] Metrics pushed to Virtuora VXM — dashboard updated`,
    `[09:00:00.950][INFO ][DDC] Cycle complete: TN-FOSS — 48 metrics in 949ms`,
  ],
  "e-passtel": [
    `[09:00:00.001][INFO ][DDC] Starting data collection cycle for E-PASSTEL`,
    `[09:00:00.050][INFO ][DDC] Protocol: NETCONF — opening SSH session to E-PASSTEL:830`,
    `[09:00:00.210][INFO ][DDC] NETCONF <hello> exchanged — session-id: 1042`,
    `[09:00:00.290][INFO ][DDC] Sending <get-config> source=running xpath=/interfaces/interface`,
    `[09:00:00.450][INFO ][DDC] NETCONF <rpc-reply> received — 48 interface entries parsed`,
    `[09:00:00.510][INFO ][KAFKA] Producing 48 records to topic: ras-metrics-e-passtel`,
    `[09:00:00.620][INFO ][KAFKA] All records ACK'd — offset: 102403`,
    `[09:00:00.700][INFO ][IDB] Writing 48 rows to PostgreSQL — table: device_metrics`,
    `[09:00:00.820][INFO ][IDB] Committed — 48 rows written, 0 errors`,
    `[09:00:00.890][INFO ][VXM] Metrics pushed to Virtuora VXM — dashboard updated`,
    `[09:00:00.950][INFO ][DDC] Cycle complete: E-PASSTEL — 48 metrics in 949ms`,
  ],
  "of-passtel": [
    `[09:00:00.001][INFO ][DDC] Starting data collection cycle for OF-PASSTEL`,
    `[09:00:00.050][INFO ][DDC] Protocol: SNMP v3 — authPriv SHA/AES128 — connecting to OF-PASSTEL:161`,
    `[09:00:00.180][INFO ][DDC] SNMP v3 engine discovery — engineID: 80000009030a0a0a01`,
    `[09:00:00.310][INFO ][DDC] Polling OID .1.3.6.1.2.1.10.166.11 (mplsLspFecTable)`,
    `[09:00:00.460][INFO ][DDC] SNMP v3 response — 48 MPLS LSP entries received`,
    `[09:00:00.510][INFO ][KAFKA] Producing 48 records to topic: ras-metrics-of-passtel`,
    `[09:00:00.620][INFO ][KAFKA] All records ACK'd — offset: 102408`,
    `[09:00:00.700][INFO ][IDB] Writing 48 rows to PostgreSQL — table: device_metrics`,
    `[09:00:00.820][INFO ][IDB] Committed — 48 rows written, 0 errors`,
    `[09:00:00.890][INFO ][VXM] Metrics pushed to Virtuora VXM — dashboard updated`,
    `[09:00:00.950][INFO ][DDC] Cycle complete: OF-PASSTEL — 48 metrics in 949ms`,
  ],
  "if-passtel": [
    `[09:00:00.001][INFO ][DDC] Starting data collection cycle for IF-PASSTEL`,
    `[09:00:00.050][INFO ][DDC] Protocol: SFTP — connecting to IF-PASSTEL:22`,
    `[09:00:00.180][INFO ][DDC] SSH handshake complete — host key verified`,
    `[09:00:00.310][INFO ][DDC] Downloading perf file: /perf/if-passtel-20250610-0900.csv`,
    `[09:00:00.580][INFO ][DDC] SFTP transfer complete — 48 records parsed from CSV`,
    `[09:00:00.630][INFO ][KAFKA] Producing 48 records to topic: ras-metrics-if-passtel`,
    `[09:00:00.720][INFO ][KAFKA] All records ACK'd — offset: 102415`,
    `[09:00:00.810][INFO ][IDB] Writing 48 rows to PostgreSQL — table: device_metrics`,
    `[09:00:00.910][INFO ][IDB] Committed — 48 rows written, 0 errors`,
    `[09:00:00.970][INFO ][VXM] Metrics pushed to Virtuora VXM — dashboard updated`,
    `[09:00:01.020][INFO ][DDC] Cycle complete: IF-PASSTEL — 48 metrics in 1019ms`,
  ],
};

const FAULT_LOGS: Record<string, string[]> = {
  "tn-foss": [
    `[09:05:14.001][WARN ][DDC] SNMP timeout for TN-FOSS — retrying (1/3)`,
    `[09:05:19.005][WARN ][DDC] SNMP timeout for TN-FOSS — retrying (2/3)`,
    `[09:05:24.010][ERROR][DDC] TN-FOSS unreachable after 3 retries — raising alarm`,
    `[09:05:24.100][INFO ][KAFKA] Producing fault event: DEVICE_UNREACHABLE/TN-FOSS`,
    `[09:05:24.200][INFO ][ZABBIX] Alert triggered: TN-FOSS DOWN — severity CRITICAL`,
    `[09:05:24.300][INFO ][ZABBIX] Notification sent to NOC team via email + SMS`,
  ],
  "e-passtel": [
    `[09:05:14.001][WARN ][DDC] NETCONF SSH connect timeout for E-PASSTEL:830 — retrying (1/3)`,
    `[09:05:19.005][WARN ][DDC] NETCONF connection refused for E-PASSTEL — retrying (2/3)`,
    `[09:05:24.010][ERROR][DDC] E-PASSTEL NETCONF session failed after 3 attempts — raising alarm`,
    `[09:05:24.100][INFO ][KAFKA] Producing fault event: DEVICE_UNREACHABLE/E-PASSTEL`,
    `[09:05:24.200][INFO ][ZABBIX] Alert triggered: E-PASSTEL DOWN — severity CRITICAL`,
    `[09:05:24.300][INFO ][ZABBIX] Notification sent to NOC team via email + SMS`,
  ],
  "of-passtel": [
    `[09:05:14.001][WARN ][DDC] SNMP v3 timeout for OF-PASSTEL — retrying (1/3)`,
    `[09:05:19.005][WARN ][DDC] SNMP v3 authentication failed for OF-PASSTEL — retrying (2/3)`,
    `[09:05:24.010][ERROR][DDC] OF-PASSTEL unreachable after 3 retries — raising alarm`,
    `[09:05:24.100][INFO ][KAFKA] Producing fault event: DEVICE_UNREACHABLE/OF-PASSTEL`,
    `[09:05:24.200][INFO ][ZABBIX] Alert triggered: OF-PASSTEL DOWN — severity CRITICAL`,
    `[09:05:24.300][INFO ][ZABBIX] Notification sent to NOC team via email + SMS`,
  ],
  "if-passtel": [
    `[09:05:14.001][WARN ][DDC] SFTP connection refused for IF-PASSTEL:22 — retrying (1/3)`,
    `[09:05:19.005][WARN ][DDC] SFTP authentication failed for IF-PASSTEL — retrying (2/3)`,
    `[09:05:24.010][ERROR][DDC] IF-PASSTEL SFTP unreachable after 3 retries — raising alarm`,
    `[09:05:24.100][INFO ][KAFKA] Producing fault event: DEVICE_UNREACHABLE/IF-PASSTEL`,
    `[09:05:24.200][INFO ][ZABBIX] Alert triggered: IF-PASSTEL DOWN — severity CRITICAL`,
    `[09:05:24.300][INFO ][ZABBIX] Notification sent to NOC team via email + SMS`,
  ],
};

function nodeFromLog(line: string): string | null {
  if (line.includes("[DDC]") && line.includes("Starting")) {
    if (line.includes("TN-FOSS")) return "TN-FOSS";
    if (line.includes("E-PASSTEL")) return "E-PASSTEL";
    if (line.includes("OF-PASSTEL")) return "OF-PASSTEL";
    if (line.includes("IF-PASSTEL")) return "IF-PASSTEL";
  }
  if (line.includes("[DDC]") && (line.includes("SNMP") || line.includes("OID") || line.includes("engine"))) return "SNMP Handler";
  if (line.includes("[DDC]") && (line.includes("NETCONF") || line.includes("get-config") || line.includes("rpc-reply") || line.includes("hello"))) return "NETCONF Handler";
  if (line.includes("[DDC]") && (line.includes("SFTP") || line.includes("CSV") || line.includes("SSH") || line.includes("Downloading"))) return "SFTP Handler";
  if (line.includes("[DDC]")) return "DDC Server";
  if (line.includes("[KAFKA]")) return "Kafka";
  if (line.includes("[IDB]")) return "IDB (PostgreSQL)";
  if (line.includes("[ZABBIX]")) return "Zabbix";
  if (line.includes("[VXM]")) return "Virtuora VXM";
  return null;
}

const INTERVAL = 400;

export default function RasNmsDemo() {
  const [device, setDevice] = useState(DEVICES[0]);
  const [logs, setLogs] = useState<string[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const [activeLayerIdx, setActiveLayerIdx] = useState(-1);
  const [activeNodeLabel, setActiveNodeLabel] = useState<string | null>(null);
  const [faultInjected, setFaultInjected] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [msgCount, setMsgCount] = useState(0);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => { timerRefs.current.forEach(clearTimeout); timerRefs.current = []; };

  const scrollLog = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  const startMonitoring = useCallback(() => {
    clearTimers();
    setLogs([]);
    setFaultInjected(false);
    setAlert(null);
    setMonitoring(true);
    setMsgCount(0);
    setActiveNodeLabel(null);

    const lines = LOG_TEMPLATES[device.id];
    const layerStep = Math.ceil((lines.length * INTERVAL) / ARCH.length);
    ARCH.forEach((_, i) => {
      timerRefs.current.push(setTimeout(() => setActiveLayerIdx(i), i * layerStep));
    });
    lines.forEach((line, i) => {
      const t = setTimeout(() => {
        setLogs(prev => [...prev, line]);
        setMsgCount(prev => prev + 1);
        setActiveNodeLabel(nodeFromLog(line));
        scrollLog();
      }, i * INTERVAL);
      timerRefs.current.push(t);
    });
    timerRefs.current.push(setTimeout(() => {
      setMonitoring(false);
      setActiveLayerIdx(-1);
      setActiveNodeLabel(null);
    }, lines.length * INTERVAL + 400));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device]);

  const injectFault = () => {
    if (faultInjected) return;
    setFaultInjected(true);
    const lines = FAULT_LOGS[device.id];
    lines.forEach((line, i) => {
      const t = setTimeout(() => {
        setLogs(prev => [...prev, line]);
        setActiveNodeLabel(nodeFromLog(line));
        if (line.includes("[ZABBIX]") && line.includes("Alert triggered")) {
          setAlert(`🚨 ZABBIX ALERT: ${device.label} DOWN — NOC notified`);
        }
        scrollLog();
      }, i * 500);
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
      {/* Architecture Diagram */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-zinc-100">RAS NMS — Network Monitoring Pipeline</span>
            <span className="ml-3 text-xs text-zinc-500">SNMP v2c/v3 · NETCONF · SFTP · Kafka · Zabbix</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <span className="text-[10px] text-red-400 font-bold">= Chi&apos;s implementation</span>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/20">
          {ARCH.map((layer, i) => (
            <div key={layer.id}>
              <div className={`relative rounded-xl border p-4 transition-all duration-300 ${
                layer.chi
                  ? "border-red-500/60 bg-gradient-to-br from-red-950/50 to-zinc-900 shadow-[0_0_28px_rgba(239,68,68,0.15)]"
                  : activeLayerIdx === i
                  ? "border-blue-500/50 bg-blue-950/20 shadow-[0_0_16px_rgba(59,130,246,0.08)]"
                  : "border-zinc-800 bg-zinc-900/60"
              }`}>
                {layer.chi && (
                  <div className="absolute -top-3 left-3">
                    <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-[10px] font-bold text-red-400">
                      ★ Chi Nguyen — Built &amp; maintained at TMA Solutions
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-4 mt-1">
                  <div className="shrink-0 w-36">
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${layer.chi ? "text-red-400" : activeLayerIdx === i ? "text-blue-400" : "text-zinc-500"}`}>{layer.layer}</div>
                    <div className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{layer.layerSub}</div>
                    {activeLayerIdx === i && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                        <span className="text-[10px] text-blue-400">active</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {layer.nodes.map(node => {
                      const isActiveNode = activeNodeLabel === node.label;
                      return (
                        <div key={node.label} className={`flex-1 min-w-[130px] px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                          layer.chi
                            ? isActiveNode
                              ? "border-red-400/70 bg-red-500/25 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                              : "border-red-500/30 bg-red-500/10"
                            : isActiveNode
                            ? "border-blue-400/60 bg-blue-500/15 shadow-[0_0_8px_rgba(59,130,246,0.12)]"
                            : activeLayerIdx === i
                            ? "border-blue-500/30 bg-blue-500/5"
                            : "border-zinc-700/60 bg-zinc-800/40"
                        }`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span>{node.icon}</span>
                            <span className={`text-xs font-semibold ${
                              layer.chi
                                ? isActiveNode ? "text-red-100" : "text-red-200"
                                : isActiveNode ? "text-blue-300" : "text-zinc-200"
                            }`}>{node.label}</span>
                            {isActiveNode && (
                              <span className={`ml-auto w-1.5 h-1.5 rounded-full animate-pulse inline-block ${layer.chi ? "bg-red-400" : "bg-blue-400"}`} />
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 leading-tight">{node.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {layer.conn && (
                <div className="flex items-center gap-3 py-0.5 pl-36 ml-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-px h-3 ${activeLayerIdx > i ? "bg-blue-500" : "bg-zinc-700"}`} />
                    <div className={`border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent ${activeLayerIdx > i ? "border-t-blue-500" : "border-t-zinc-700"}`} />
                  </div>
                  <span className="text-[10px] text-zinc-600 italic">
                    {layer.conn.label} <span className="font-mono text-zinc-700">({layer.conn.proto})</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Device selection + controls */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="text-xs text-zinc-500 mb-3 font-semibold">Select Device Family</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {DEVICES.map(d => (
            <button key={d.id}
              onClick={() => { setDevice(d); setLogs([]); setFaultInjected(false); setAlert(null); setActiveLayerIdx(-1); setActiveNodeLabel(null); setMsgCount(0); }}
              className={`p-3 rounded-lg border text-left transition-all ${device.id === d.id ? d.color : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700"}`}>
              <div className="text-xs font-semibold">{d.label}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{d.proto}</div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={startMonitoring} disabled={monitoring}
            className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold text-sm rounded-lg transition-colors">
            {monitoring ? "⏳ Collecting metrics..." : "▶ Start Monitoring"}
          </button>
          <button onClick={injectFault} disabled={faultInjected || logs.length === 0}
            className="px-4 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed text-sm rounded-lg transition-colors">
            💥 Inject Fault
          </button>
        </div>
      </div>

      {/* Stats + Alert */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Records", value: String(msgCount), color: "text-blue-400" },
          { label: "Device", value: device.label, color: device.color.split(" ")[0] },
          { label: "Protocol", value: device.proto, color: "text-zinc-300" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 text-center">
            <div className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {alert && (
        <div className="px-4 py-3 rounded-xl border border-red-500/40 bg-red-500/10 flex items-center gap-3">
          <div className="text-sm font-semibold text-red-300">{alert}</div>
        </div>
      )}

      {/* Log stream */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/50 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 inline-block" />
          </div>
          <span className="text-xs font-mono text-zinc-500">ddc-server — [timestamp][LEVEL][MODULE]</span>
          {monitoring && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />}
        </div>
        <div ref={logContainerRef} className="bg-zinc-950 p-4 h-52 overflow-y-auto font-mono text-xs leading-relaxed">
          {logs.length === 0 ? (
            <p className="text-zinc-700 italic">Select a device and click ▶ Start Monitoring to see the DDC collection log</p>
          ) : logs.map((line, i) => <div key={i} className={lineColor(line)}>{line}</div>)}
        </div>
      </div>
    </div>
  );
}
