"use client";
import { useState, useEffect, useRef } from "react";

type AlarmState = "ACTIVE" | "ACKNOWLEDGED" | "CLEARING" | "CLEARED";
type Severity = "CRITICAL" | "MAJOR" | "MINOR";
type Alarm = {
  id: string; type: string; severity: Severity; source: string;
  state: AlarmState; ts: string; zmqPayload: string; pipelineLog: string[];
};

const ARCH = [
  {
    id: "gnb", layer: "gNB Hardware", layerSub: "Fault Origination", chi: false,
    nodes: [
      { icon: "📡", label: "gNB App", desc: "DU software — detects fault conditions (link, CPU, sync, cell)" },
      { icon: "🔌", label: "F1 Interface", desc: "F1-U/F1-C link to CU — monitored for connectivity" },
    ],
    conn: { label: "ZMQ PUB — FM_ALARM_IND struct published on fault detect", proto: "tcp://127.0.0.1:5555 (PUB socket)" },
  },
  {
    id: "oam", layer: "OAM Agent — FM Module", layerSub: "★ Chi Nguyen @ TMA Solutions", chi: true,
    nodes: [
      { icon: "⚙", label: "OAM Agent", desc: "C++ main process — lifecycle owner of all alarm state machines" },
      { icon: "🚨", label: "FM Module", desc: "SUB socket — receives FM_ALARM_IND, maps to ITU-T X.733 fields" },
      { icon: "📋", label: "Alarm Store", desc: "In-memory store — deduplication, severity tracking, history" },
      { icon: "🔔", label: "Notification Engine", desc: "Converts alarm state changes → YANG notifications to ConfD" },
    ],
    conn: { label: "YANG alarm notification", proto: "NETCONF / TCP:830 → ConfD" },
  },
  {
    id: "confd", layer: "YANG Datastore", layerSub: "Cisco ConfD", chi: false,
    nodes: [{ icon: "🗄", label: "ConfD", desc: "Stores alarm state in YANG datastore, routes notifications to NMS" }],
    conn: { label: "NETCONF event notification stream", proto: "SSH / TCP:830 → NMS" },
  },
  {
    id: "nms", layer: "O&M System", layerSub: "External FM Dashboard", chi: false,
    nodes: [{ icon: "🖥", label: "Virtuora NMS FM", desc: "Displays alarms, ACK/clear workflow, escalation to NOC" }],
    conn: null,
  },
];

const ALARM_TYPES = [
  {
    key: "LINK_DOWN", label: "LINK_DOWN", severity: "CRITICAL" as Severity, source: "F1 Interface",
    zmq: `FM_ALARM_IND {
  alarm_id:                0x0001,
  managed_object_class:    "F1Interface",
  managed_object_instance: "GNBDUFunction=1,F1Interface=1",
  event_type:              COMMUNICATIONS_ALARM,
  probable_cause:          COMMUNICATION_SUBSYSTEM_FAILURE,
  specific_problem:        "F1-U link down",
  perceived_severity:      CRITICAL,
  alarm_text:              "DU↔CU F1-U interface link failure",
  additional_text:         "check physical link and IP connectivity",
  ts: {epoch}
}`,
    pipeline: (ts: string) => [
      `[gNB   ] ► F1-U link failure detected — publishing FM_ALARM_IND via ZMQ PUB`,
      `[★ ZMQ ] ► SUB socket received FM_ALARM_IND (alarm_id=0x0001, CRITICAL)`,
      `[★ FM  ] ► Mapping to ITU-T X.733: COMMUNICATIONS_ALARM / COMMUNICATION_SUBSYSTEM_FAILURE`,
      `[★ FM  ] ► managed_object_instance: GNBDUFunction=1,F1Interface=1`,
      `[★ FM  ] ► Deduplication check: alarm 0x0001 not in store — inserting NEW alarm`,
      `[★ FM  ] ► Alarm stored: id=0x0001, severity=CRITICAL, state=ACTIVE  ts=${ts}`,
      `[★ OAM ] ► Sending YANG notification to ConfD: alarm-notification / ACTIVE`,
      `[ConfD ] ✓ NETCONF event-notification delivered to NMS FM subscription`,
      `[NMS   ] ✓ CRITICAL alarm raised: F1 Interface LINK_DOWN — NOC notified`,
    ],
  },
  {
    key: "CPU_HIGH", label: "CPU_HIGH", severity: "MAJOR" as Severity, source: "DU Processor",
    zmq: `FM_ALARM_IND {
  alarm_id:                0x0002,
  managed_object_class:    "GNBDUFunction",
  managed_object_instance: "GNBDUFunction=1",
  event_type:              EQUIPMENT_ALARM,
  probable_cause:          PROCESSOR_PROBLEM,
  specific_problem:        "CPU utilization threshold exceeded",
  perceived_severity:      MAJOR,
  alarm_text:              "CPU utilization 94% — threshold 90%",
  additional_text:         "reduce processing load or scale DU resources",
  ts: {epoch}
}`,
    pipeline: (ts: string) => [
      `[gNB   ] ► CPU utilization 94% > threshold 90% — publishing FM_ALARM_IND`,
      `[★ ZMQ ] ► SUB received FM_ALARM_IND (alarm_id=0x0002, MAJOR)`,
      `[★ FM  ] ► Mapping to ITU-T X.733: EQUIPMENT_ALARM / PROCESSOR_PROBLEM`,
      `[★ FM  ] ► managed_object_instance: GNBDUFunction=1`,
      `[★ FM  ] ► Deduplication: alarm 0x0002 not in store — inserting NEW`,
      `[★ FM  ] ► Alarm stored: id=0x0002, severity=MAJOR, state=ACTIVE  ts=${ts}`,
      `[★ OAM ] ► YANG notification → ConfD: alarm-notification / ACTIVE`,
      `[NMS   ] ✓ MAJOR alarm raised: DU CPU_HIGH — threshold 90% exceeded`,
    ],
  },
  {
    key: "SYNC_LOSS", label: "SYNC_LOSS", severity: "CRITICAL" as Severity, source: "PTP Clock",
    zmq: `FM_ALARM_IND {
  alarm_id:                0x0003,
  managed_object_class:    "NRCellDU",
  managed_object_instance: "GNBDUFunction=1,NRCellDU=NR-Cell-001",
  event_type:              COMMUNICATIONS_ALARM,
  probable_cause:          TIMING_PROBLEM,
  specific_problem:        "PTP synchronization lost",
  perceived_severity:      CRITICAL,
  alarm_text:              "IEEE 1588 PTP sync lost — holdover mode active",
  additional_text:         "check grandmaster clock reachability on sync plane",
  ts: {epoch}
}`,
    pipeline: (ts: string) => [
      `[gNB   ] ► IEEE 1588 PTP grandmaster lost — entering holdover mode`,
      `[★ ZMQ ] ► SUB received FM_ALARM_IND (alarm_id=0x0003, CRITICAL)`,
      `[★ FM  ] ► Mapping to ITU-T X.733: COMMUNICATIONS_ALARM / TIMING_PROBLEM`,
      `[★ FM  ] ► managed_object_instance: GNBDUFunction=1,NRCellDU=NR-Cell-001`,
      `[★ FM  ] ► Alarm stored: id=0x0003, severity=CRITICAL, state=ACTIVE  ts=${ts}`,
      `[★ OAM ] ► YANG notification → ConfD: SYNC_LOSS / CRITICAL`,
      `[NMS   ] ✓ CRITICAL alarm raised: PTP SYNC_LOSS — cell timing at risk`,
    ],
  },
  {
    key: "CELL_UNAVAIL", label: "CELL_UNAVAILABLE", severity: "CRITICAL" as Severity, source: "NR-Cell-001",
    zmq: `FM_ALARM_IND {
  alarm_id:                0x0004,
  managed_object_class:    "NRCellDU",
  managed_object_instance: "GNBDUFunction=1,NRCellDU=NR-Cell-001",
  event_type:              COMMUNICATIONS_ALARM,
  probable_cause:          SOFTWARE_ERROR,
  specific_problem:        "Cell out of service",
  perceived_severity:      CRITICAL,
  alarm_text:              "NR-Cell-001 unavailable — RRC not established",
  additional_text:         "verify F1 connectivity and cell activation state",
  ts: {epoch}
}`,
    pipeline: (ts: string) => [
      `[gNB   ] ► NR-Cell-001 RRC setup failure — cell going out of service`,
      `[★ ZMQ ] ► SUB received FM_ALARM_IND (alarm_id=0x0004, CRITICAL)`,
      `[★ FM  ] ► Mapping to ITU-T X.733: COMMUNICATIONS_ALARM / SOFTWARE_ERROR`,
      `[★ FM  ] ► managed_object_instance: GNBDUFunction=1,NRCellDU=NR-Cell-001`,
      `[★ FM  ] ► Alarm stored: id=0x0004, severity=CRITICAL, state=ACTIVE  ts=${ts}`,
      `[★ OAM ] ► YANG notification → ConfD: CELL_UNAVAILABLE / CRITICAL`,
      `[NMS   ] ✓ CRITICAL alarm raised: NR-Cell-001 out of service`,
    ],
  },
  {
    key: "MEM_THRESHOLD", label: "MEM_THRESHOLD", severity: "MINOR" as Severity, source: "OAM Agent",
    zmq: `FM_ALARM_IND {
  alarm_id:                0x0005,
  managed_object_class:    "GNBDUFunction",
  managed_object_instance: "GNBDUFunction=1,OAMAgent=1",
  event_type:              EQUIPMENT_ALARM,
  probable_cause:          RESOURCE_AT_OR_NEARING_CAPACITY,
  specific_problem:        "OAM Agent memory threshold exceeded",
  perceived_severity:      MINOR,
  alarm_text:              "Memory usage 87% — threshold 85%",
  additional_text:         "consider restarting OAM Agent or reducing cache size",
  ts: {epoch}
}`,
    pipeline: (ts: string) => [
      `[★ OAM ] ► Self-monitoring: RSS 87% > threshold 85% — raising self-alarm`,
      `[★ FM  ] ► Constructing FM_ALARM_IND: EQUIPMENT_ALARM / RESOURCE_AT_OR_NEARING_CAPACITY`,
      `[★ FM  ] ► managed_object_instance: GNBDUFunction=1,OAMAgent=1`,
      `[★ FM  ] ► Alarm stored: id=0x0005, severity=MINOR, state=ACTIVE  ts=${ts}`,
      `[★ OAM ] ► YANG notification → ConfD: MEM_THRESHOLD / MINOR`,
      `[NMS   ] ✓ MINOR alarm raised: OAM Agent memory above 85%`,
    ],
  },
];

const SEV_STYLE: Record<Severity, string> = {
  CRITICAL: "text-red-400 bg-red-500/10 border-red-500/30",
  MAJOR: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  MINOR: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
};
const STATE_STYLE: Record<AlarmState, string> = {
  ACTIVE: "text-red-400", ACKNOWLEDGED: "text-amber-400", CLEARING: "text-blue-400", CLEARED: "text-zinc-500",
};
const STATE_NEXT: Record<AlarmState, AlarmState | null> = {
  ACTIVE: "ACKNOWLEDGED", ACKNOWLEDGED: "CLEARING", CLEARING: "CLEARED", CLEARED: null,
};
const STATE_ACTION: Record<AlarmState, string> = {
  ACTIVE: "ACK →", ACKNOWLEDGED: "Clearing →", CLEARING: "Clear →", CLEARED: "—",
};

function nodeFromLog(line: string): string | null {
  if (line.startsWith("[gNB")) return "gNB App";
  if (line.startsWith("[★ ZMQ")) return "FM Module";
  if (line.startsWith("[★ FM") && (line.includes("Deduplication") || line.includes("stored"))) return "Alarm Store";
  if (line.startsWith("[★ FM")) return "FM Module";
  if (line.startsWith("[★ OAM")) return "Notification Engine";
  if (line.startsWith("[ConfD")) return "ConfD";
  if (line.startsWith("[NMS")) return "Virtuora NMS FM";
  return null;
}

const PIPE_INTERVAL = 450;

let uid = 0;

export default function FmDashboardDemo() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [activeLayerIdx, setActiveLayerIdx] = useState(-1);
  const [activeNodeLabel, setActiveNodeLabel] = useState<string | null>(null);
  const liveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [pipelineLogs]);

  useEffect(() => {
    if (liveMode) {
      liveRef.current = setInterval(() => {
        const rand = ALARM_TYPES[Math.floor(Math.random() * ALARM_TYPES.length)];
        injectAlarm(rand.key);
      }, 3000 + Math.random() * 2000);
    } else {
      if (liveRef.current) clearInterval(liveRef.current);
    }
    return () => { if (liveRef.current) clearInterval(liveRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode]);

  const nowTs = () => new Date().toISOString().replace("T", " ").slice(0, 23);

  const injectAlarm = (typeKey: string) => {
    const def = ALARM_TYPES.find(t => t.key === typeKey)!;
    const id = `ALM-${String(++uid).padStart(4, "0")}`;
    const ts = nowTs();
    const logs = def.pipeline(ts);
    const alarm: Alarm = {
      id, type: def.label, severity: def.severity, source: def.source,
      state: "ACTIVE", ts, zmqPayload: def.zmq.replace("{epoch}", ts), pipelineLog: logs,
    };
    setAlarms(prev => [alarm, ...prev]);
    setSelected(id);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPipelineLogs([]);
    setActiveLayerIdx(0);
    setActiveNodeLabel(null);
    const layerStep = Math.ceil((logs.length * PIPE_INTERVAL) / ARCH.length);
    ARCH.forEach((_, i) => {
      timers.current.push(setTimeout(() => setActiveLayerIdx(i), i * layerStep));
    });
    logs.forEach((line, i) => {
      timers.current.push(setTimeout(() => {
        setPipelineLogs(prev => [...prev, line]);
        setActiveNodeLabel(nodeFromLog(line));
      }, i * PIPE_INTERVAL + 100));
    });
    timers.current.push(setTimeout(() => {
      setActiveLayerIdx(-1);
      setActiveNodeLabel(null);
    }, logs.length * PIPE_INTERVAL + 400));
  };

  const advance = (id: string) => {
    setAlarms(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next = STATE_NEXT[a.state];
      return next ? { ...a, state: next } : a;
    }));
  };

  const selectedAlarm = alarms.find(a => a.id === selected);
  const activeCount = alarms.filter(a => a.state !== "CLEARED").length;

  return (
    <div className="space-y-4">
      {/* Architecture Diagram */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-zinc-100">5G OAM — Fault Management System</span>
            <span className="ml-3 text-xs text-zinc-500">ITU-T X.733 · ZMQ PUB/SUB · YANG Notifications</span>
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
                  ? "border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_16px_rgba(34,211,238,0.08)]"
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
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${layer.chi ? "text-red-400" : activeLayerIdx === i ? "text-cyan-400" : "text-zinc-500"}`}>{layer.layer}</div>
                    <div className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{layer.layerSub}</div>
                    {activeLayerIdx === i && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
                        <span className="text-[10px] text-cyan-400">processing</span>
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
                            ? "border-cyan-400/60 bg-cyan-500/15 shadow-[0_0_8px_rgba(34,211,238,0.12)]"
                            : activeLayerIdx === i
                            ? "border-cyan-500/30 bg-cyan-500/5"
                            : "border-zinc-700/60 bg-zinc-800/40"
                        }`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span>{node.icon}</span>
                            <span className={`text-xs font-semibold ${
                              layer.chi
                                ? isActiveNode ? "text-red-100" : "text-red-200"
                                : isActiveNode ? "text-cyan-300" : "text-zinc-200"
                            }`}>{node.label}</span>
                            {isActiveNode && (
                              <span className={`ml-auto w-1.5 h-1.5 rounded-full animate-pulse inline-block ${layer.chi ? "bg-red-400" : "bg-cyan-400"}`} />
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
                    <div className={`w-px h-3 ${activeLayerIdx > i ? "bg-cyan-500" : "bg-zinc-700"}`} />
                    <div className={`border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent ${activeLayerIdx > i ? "border-t-cyan-500" : "border-t-zinc-700"}`} />
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

      {/* Inject + Live Mode */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-zinc-300">Inject Fault Alarm</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-zinc-400">Live Mode</span>
            <button onClick={() => setLiveMode(l => !l)}
              className={`w-9 h-5 rounded-full border relative transition-all ${liveMode ? "bg-red-500/30 border-red-500/60" : "bg-zinc-800 border-zinc-700"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${liveMode ? "left-4 bg-red-400" : "left-0.5 bg-zinc-500"}`} />
            </button>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALARM_TYPES.map(t => (
            <button key={t.key} onClick={() => injectAlarm(t.key)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all hover:scale-105 ${SEV_STYLE[t.severity]}`}>
              {t.severity === "CRITICAL" ? "🔴" : t.severity === "MAJOR" ? "🟠" : "🟡"} {t.key}
            </button>
          ))}
        </div>
        {liveMode && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
            Auto-injecting random alarms every 3–5s
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alarm table */}
        <div className="lg:col-span-1 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-300">Active Alarms</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeCount > 0 ? "text-red-400 bg-red-500/10 border border-red-500/30" : "text-zinc-500 bg-zinc-800 border border-zinc-700"}`}>
              {activeCount} active
            </span>
          </div>
          {alarms.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 text-xs">Inject an alarm above to begin</div>
          ) : (
            <div className="divide-y divide-zinc-800/60 max-h-64 overflow-y-auto">
              {alarms.map(a => (
                <div key={a.id} onClick={() => { setSelected(a.id); setPipelineLogs(a.pipelineLog); }}
                  className={`px-4 py-3 cursor-pointer transition-colors ${selected === a.id ? "bg-zinc-800/60" : "hover:bg-zinc-900/50"} ${a.state === "CLEARED" ? "opacity-40" : ""}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-mono font-semibold ${STATE_STYLE[a.state]}`}>{a.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${SEV_STYLE[a.severity]}`}>{a.severity}</span>
                  </div>
                  <div className="text-xs text-zinc-300">{a.type}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-zinc-600">{a.source}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-semibold ${STATE_STYLE[a.state]}`}>{a.state}</span>
                      {STATE_NEXT[a.state] && (
                        <button onClick={e => { e.stopPropagation(); advance(a.id); }}
                          className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-400 hover:border-zinc-500 transition-colors">
                          {STATE_ACTION[a.state]}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ZMQ Payload */}
        <div className="lg:col-span-1 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-300">ZMQ Payload</span>
            <span className="ml-2 text-[10px] text-zinc-600">FM_ALARM_IND struct (ITU-T X.733)</span>
          </div>
          {selectedAlarm ? (
            <pre className="p-3 text-[10px] font-mono text-emerald-300/80 leading-relaxed overflow-x-auto min-h-[180px]">
              {selectedAlarm.zmqPayload}
            </pre>
          ) : (
            <div className="p-4 text-xs text-zinc-600 italic">Select an alarm to view ZMQ payload</div>
          )}
        </div>

        {/* Pipeline Log */}
        <div className="lg:col-span-1 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/50 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 inline-block" />
            </div>
            <span className="text-xs font-mono text-zinc-500">oam_agent — FM pipeline log</span>
            {activeLayerIdx >= 0 && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />}
          </div>
          <div ref={logContainerRef} className="bg-zinc-950 p-3 h-48 overflow-y-auto font-mono text-[10px] leading-relaxed">
            {pipelineLogs.length === 0 ? (
              <p className="text-zinc-700 italic">Inject an alarm to see FM processing pipeline</p>
            ) : pipelineLogs.map((line, i) => (
              <div key={i} className={
                line.includes("[★") ? "text-red-300" :
                line.includes("✓") ? "text-emerald-400" :
                line.startsWith("[gNB") ? "text-emerald-300/60" :
                line.startsWith("[NMS") ? "text-cyan-300/70" :
                line.startsWith("[ConfD") ? "text-violet-300/70" :
                "text-zinc-400"
              }>{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
