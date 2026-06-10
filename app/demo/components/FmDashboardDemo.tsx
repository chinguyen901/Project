"use client";
import { useState, useEffect, useRef } from "react";

type AlarmState = "ACTIVE" | "ACKNOWLEDGED" | "CLEARING" | "CLEARED";
type Severity = "CRITICAL" | "MAJOR" | "MINOR";

type Alarm = {
  id: string;
  type: string;
  severity: Severity;
  source: string;
  state: AlarmState;
  ts: string;
  zmqPayload: string;
};

const ALARM_TYPES = [
  {
    key: "LINK_DOWN",
    label: "LINK_DOWN",
    severity: "CRITICAL" as Severity,
    source: "F1 Interface",
    description: "F1 interface link failure",
    zmq: `FM_ALARM_IND {
  alarm_id: 0x0001,
  severity: CRITICAL,
  type: COMM_ALARM,
  source: "F1_INTERFACE",
  text: "F1-U link down — DU↔CU connection lost",
  ts: {epoch}
}`,
  },
  {
    key: "CPU_HIGH",
    label: "CPU_HIGH",
    severity: "MAJOR" as Severity,
    source: "DU Processor",
    description: "CPU utilization > 90%",
    zmq: `FM_ALARM_IND {
  alarm_id: 0x0002,
  severity: MAJOR,
  type: QOS_ALARM,
  source: "DU_CPU",
  text: "CPU utilization 94% — threshold 90%",
  ts: {epoch}
}`,
  },
  {
    key: "SYNC_LOSS",
    label: "SYNC_LOSS",
    severity: "CRITICAL" as Severity,
    source: "PTP Clock",
    description: "PTP synchronization lost",
    zmq: `FM_ALARM_IND {
  alarm_id: 0x0003,
  severity: CRITICAL,
  type: TIMING_ALARM,
  source: "PTP_CLOCK",
  text: "IEEE 1588 PTP sync lost — holdover active",
  ts: {epoch}
}`,
  },
  {
    key: "CELL_UNAVAIL",
    label: "CELL_UNAVAILABLE",
    severity: "CRITICAL" as Severity,
    source: "NR-Cell-001",
    description: "Cell went out of service",
    zmq: `FM_ALARM_IND {
  alarm_id: 0x0004,
  severity: CRITICAL,
  type: SERVICE_ALARM,
  source: "NR_CELL_001",
  text: "Cell NR-Cell-001 unavailable — RRC not established",
  ts: {epoch}
}`,
  },
  {
    key: "MEM_THRESHOLD",
    label: "MEM_THRESHOLD",
    severity: "MINOR" as Severity,
    source: "OAM Agent",
    description: "Memory usage above 85%",
    zmq: `FM_ALARM_IND {
  alarm_id: 0x0005,
  severity: MINOR,
  type: RESOURCE_ALARM,
  source: "OAM_AGENT",
  text: "Memory usage 87% — threshold 85%",
  ts: {epoch}
}`,
  },
];

const SEV_STYLE: Record<Severity, string> = {
  CRITICAL: "text-red-400 bg-red-500/10 border-red-500/30",
  MAJOR: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  MINOR: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
};

const STATE_STYLE: Record<AlarmState, string> = {
  ACTIVE: "text-red-400",
  ACKNOWLEDGED: "text-amber-400",
  CLEARING: "text-blue-400",
  CLEARED: "text-zinc-500",
};

const STATE_NEXT: Record<AlarmState, AlarmState | null> = {
  ACTIVE: "ACKNOWLEDGED",
  ACKNOWLEDGED: "CLEARING",
  CLEARING: "CLEARED",
  CLEARED: null,
};

const STATE_ACTION: Record<AlarmState, string> = {
  ACTIVE: "ACK →",
  ACKNOWLEDGED: "Clearing →",
  CLEARING: "Clear →",
  CLEARED: "—",
};

let uid = 0;

export default function FmDashboardDemo() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const liveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nowTs = () => new Date().toISOString().replace("T", " ").slice(0, 19);

  const injectAlarm = (typeKey: string) => {
    const def = ALARM_TYPES.find((t) => t.key === typeKey)!;
    const id = `ALM-${String(++uid).padStart(4, "0")}`;
    const ts = nowTs();
    const alarm: Alarm = {
      id,
      type: def.label,
      severity: def.severity,
      source: def.source,
      state: "ACTIVE",
      ts,
      zmqPayload: def.zmq.replace("{epoch}", ts),
    };
    setAlarms((prev) => [alarm, ...prev]);
    setSelected(id);
  };

  const advance = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = STATE_NEXT[a.state];
        return next ? { ...a, state: next } : a;
      })
    );
  };

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
  }, [liveMode]);

  const selectedAlarm = alarms.find((a) => a.id === selected);
  const activeCount = alarms.filter((a) => a.state !== "CLEARED").length;

  return (
    <div className="space-y-4">
      {/* Alarm injection + live mode */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-zinc-300">Inject Alarm</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-zinc-400">Live Mode</span>
            <button
              onClick={() => setLiveMode((l) => !l)}
              className={`w-9 h-5 rounded-full border transition-all relative ${
                liveMode ? "bg-red-500/30 border-red-500/60" : "bg-zinc-800 border-zinc-700"
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${liveMode ? "left-4 bg-red-400" : "left-0.5 bg-zinc-500"}`} />
            </button>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALARM_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => injectAlarm(t.key)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all hover:scale-105 ${SEV_STYLE[t.severity]}`}
            >
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Alarm table */}
        <div className="md:col-span-2 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-300">Active Alarms</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeCount > 0 ? "text-red-400 bg-red-500/10 border border-red-500/30" : "text-zinc-500 bg-zinc-800 border border-zinc-700"}`}>
              {activeCount} active
            </span>
          </div>
          {alarms.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 text-xs">No alarms. Click a button above to inject one.</div>
          ) : (
            <div className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto">
              {alarms.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelected(a.id)}
                  className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    selected === a.id ? "bg-zinc-800/60" : "hover:bg-zinc-900/50"
                  } ${a.state === "CLEARED" ? "opacity-50" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-mono font-semibold ${STATE_STYLE[a.state]}`}>{a.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${SEV_STYLE[a.severity]}`}>{a.severity}</span>
                    </div>
                    <div className="text-xs text-zinc-300">{a.type}</div>
                    <div className="text-[10px] text-zinc-600">{a.source} · {a.ts}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10px] font-semibold ${STATE_STYLE[a.state]}`}>{a.state}</span>
                    {STATE_NEXT[a.state] && (
                      <button
                        onClick={(e) => { e.stopPropagation(); advance(a.id); }}
                        className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        {STATE_ACTION[a.state]}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ZMQ Payload viewer */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-300">ZMQ Payload</span>
            <span className="ml-2 text-[10px] text-zinc-600">FM_ALARM_IND struct</span>
          </div>
          {selectedAlarm ? (
            <pre className="p-3 text-[10px] font-mono text-emerald-300/80 leading-relaxed overflow-x-auto h-full min-h-[150px]">
              {selectedAlarm.zmqPayload}
            </pre>
          ) : (
            <div className="p-4 text-xs text-zinc-600 italic">Select an alarm to view payload</div>
          )}
        </div>
      </div>
    </div>
  );
}
