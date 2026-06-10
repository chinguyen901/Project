"use client";
import { useState, useRef, useEffect, useCallback } from "react";

type NFState = "IDLE" | "INITIALIZING" | "REGISTERED";
type NetconfState = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "SUBSCRIBED";
type CrashType = "SIGSEGV" | "ZMQ_TIMEOUT" | "CONFD_DROP" | "OOM";

const BOOT_LOGS = [
  { t: 100, msg: "[2025-06-10 09:00:00.001][INFO][OAM_AGENT] Starting OAM Agent v2.4.1..." },
  { t: 200, msg: "[2025-06-10 09:00:00.045][INFO][OAM_LIB]   Loading configuration from /etc/oam/config.xml" },
  { t: 350, msg: "[2025-06-10 09:00:00.112][INFO][OAM_LIB]   OAM_LIB initialized — protocol: NETCONF/YANG" },
  { t: 500, msg: "[2025-06-10 09:00:00.230][INFO][OAM_CM]    CM module started — YANG model: 3GPP TS 28.541" },
  { t: 700, msg: "[2025-06-10 09:00:00.380][INFO][OAM_FM]    FM module started — alarm store ready (0 active)" },
  { t: 900, msg: "[2025-06-10 09:00:00.512][INFO][OAM_PM]    PM module started — counter interval: 15s" },
  { t: 1100, msg: "[2025-06-10 09:00:00.700][INFO][OAM_AGENT] Connecting to ConfD at 127.0.0.1:830 (SSH/NETCONF)..." },
  { t: 1400, msg: "[2025-06-10 09:00:01.020][INFO][OAM_AGENT] NETCONF session established — session-id: 1042" },
  { t: 1700, msg: "[2025-06-10 09:00:01.340][INFO][OAM_AGENT] Subscribed to YANG notifications — xpath: /nr-du" },
  { t: 2000, msg: "[2025-06-10 09:00:01.650][INFO][OAM_AGENT] OAM Agent READY — NF state: REGISTERED ✓" },
];

const CRASH_LOGS: Record<CrashType, string[]> = {
  SIGSEGV: [
    "[09:12:44.332][FATAL][OAM_AGENT] Received signal SIGSEGV (11) — Segmentation fault",
    "[09:12:44.333][FATAL][OAM_AGENT] Fault address: 0x0000000000000000 (null dereference in OAM_CM::applyConfig)",
    "[09:12:44.334][INFO ][OAM_AGENT] Core dump written to /var/crash/oam_agent.1718707964.core",
    "[09:12:44.900][INFO ][SUPERVISOR] oam_agent crashed — restarting in 3s (attempt 1/3)",
    "[09:12:47.910][INFO ][OAM_AGENT] Restarted — re-establishing NETCONF session...",
    "[09:12:48.500][INFO ][OAM_AGENT] NETCONF session re-established — session-id: 1043. Recovery complete.",
  ],
  ZMQ_TIMEOUT: [
    "[09:15:12.001][WARN ][OAM_AGENT] ZMQ recv timeout (5000ms) — no message from gNB",
    "[09:15:17.002][WARN ][OAM_AGENT] ZMQ recv timeout (5000ms) — attempt 2/3",
    "[09:15:22.003][ERROR][OAM_AGENT] ZMQ connection lost — gNB process may have crashed",
    "[09:15:22.100][INFO ][OAM_AGENT] Attempting ZMQ reconnect to tcp://127.0.0.1:5555",
    "[09:15:23.200][INFO ][OAM_AGENT] ZMQ socket reconnected — resuming message processing",
    "[09:15:23.300][INFO ][OAM_AGENT] Recovered from ZMQ timeout — 0 messages lost.",
  ],
  CONFD_DROP: [
    "[09:18:30.001][ERROR][OAM_AGENT] ConfD connection dropped — NETCONF session-id 1042 terminated",
    "[09:18:30.050][ERROR][OAM_AGENT] Active YANG subscriptions lost — 3 pending notifications dropped",
    "[09:18:30.100][INFO ][OAM_AGENT] NF state → INITIALIZING — waiting for ConfD restart",
    "[09:18:35.500][INFO ][OAM_AGENT] ConfD available — reconnecting NETCONF session...",
    "[09:18:36.200][INFO ][OAM_AGENT] NETCONF session-id: 1044 established. Re-subscribing to /nr-du",
    "[09:18:36.800][INFO ][OAM_AGENT] NF state → REGISTERED — ConfD recovery complete.",
  ],
  OOM: [
    "[09:22:11.001][ERROR][OAM_AGENT] malloc() failed — out of memory (RSS: 2048MB / limit: 2048MB)",
    "[09:22:11.010][ERROR][OAM_AGENT] Emergency: dropping non-critical message queue (1204 items)",
    "[09:22:11.020][WARN ][OAM_AGENT] OOM-killer invoked — freeing alarm history cache",
    "[09:22:11.100][INFO ][OAM_AGENT] Memory freed — RSS now 890MB. Resuming normal operation.",
    "[09:22:11.200][INFO ][OAM_AGENT] Memory pressure mitigation complete — no messages lost.",
  ],
};

export default function OamAgentDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [booting, setBooting] = useState(false);
  const [booted, setBooted] = useState(false);
  const [nfState, setNfState] = useState<NFState>("IDLE");
  const [netconfState, setNetconfState] = useState<NetconfState>("DISCONNECTED");
  const logEndRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const clearTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };

  const boot = useCallback(() => {
    clearTimers();
    setLogs([]);
    setBooting(true);
    setBooted(false);
    setNfState("IDLE");
    setNetconfState("DISCONNECTED");

    BOOT_LOGS.forEach(({ t, msg }, i) => {
      const timer = setTimeout(() => {
        setLogs((prev) => [...prev, msg]);
        if (i === 1) setNfState("INITIALIZING");
        if (i === 6) setNetconfState("CONNECTING");
        if (i === 7) setNetconfState("CONNECTED");
        if (i === 8) setNetconfState("SUBSCRIBED");
        if (i === BOOT_LOGS.length - 1) {
          setNfState("REGISTERED");
          setBooting(false);
          setBooted(true);
        }
      }, t);
      timerRefs.current.push(timer);
    });
  }, []);

  const injectCrash = (type: CrashType) => {
    const crashLines = CRASH_LOGS[type];
    crashLines.forEach((line, i) => {
      const timer = setTimeout(() => {
        setLogs((prev) => [...prev, line]);
        if (i === 2 && type !== "OOM") setNfState("INITIALIZING");
        if (i === crashLines.length - 1) setNfState("REGISTERED");
      }, i * 400);
      timerRefs.current.push(timer);
    });
  };

  const NFState_STYLE: Record<NFState, string> = {
    IDLE: "text-zinc-500 border-zinc-700",
    INITIALIZING: "text-amber-400 border-amber-500/40",
    REGISTERED: "text-emerald-400 border-emerald-500/40",
  };
  const NC_STYLE: Record<NetconfState, string> = {
    DISCONNECTED: "text-zinc-500 border-zinc-700",
    CONNECTING: "text-amber-400 border-amber-500/40",
    CONNECTED: "text-blue-400 border-blue-500/40",
    SUBSCRIBED: "text-cyan-400 border-cyan-500/40",
  };

  const lineColor = (line: string) => {
    if (line.includes("[FATAL]")) return "text-red-400";
    if (line.includes("[ERROR]")) return "text-red-300/80";
    if (line.includes("[WARN ]")) return "text-amber-400/80";
    if (line.includes("READY") || line.includes("complete") || line.includes("Recovery")) return "text-emerald-400";
    return "text-emerald-300/60";
  };

  return (
    <div className="space-y-4">
      {/* State machines + controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="text-xs text-zinc-500 mb-3 font-semibold">NF State Machine</div>
          <div className="flex items-center gap-2">
            {(["IDLE", "INITIALIZING", "REGISTERED"] as NFState[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <span className={`text-xs px-2 py-1 rounded-lg border transition-all ${nfState === s ? NFState_STYLE[s] : "text-zinc-700 border-zinc-800"}`}>
                  {s}
                </span>
                {i < 2 && <span className="text-zinc-800 text-xs">→</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="text-xs text-zinc-500 mb-3 font-semibold">NETCONF State Machine</div>
          <div className="grid grid-cols-2 gap-1">
            {(["DISCONNECTED", "CONNECTING", "CONNECTED", "SUBSCRIBED"] as NetconfState[]).map((s) => (
              <span key={s} className={`text-xs px-2 py-1 rounded-lg border text-center transition-all ${netconfState === s ? NC_STYLE[s] : "text-zinc-700 border-zinc-800"}`}>
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="text-xs text-zinc-500 mb-3 font-semibold">Thread Model</div>
          <div className="grid grid-cols-2 gap-1">
            {["OAM_AGENT", "comm_thread", "sys_thread", "OAM_RX"].map((t) => (
              <span key={t} className={`text-[10px] px-2 py-1.5 rounded font-mono border text-center ${booted ? "text-violet-300/80 border-violet-500/20 bg-violet-500/5" : "text-zinc-700 border-zinc-800"}`}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500/60 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/60 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/60 inline-block" />
            </div>
            <span className="text-xs font-mono text-zinc-500">oam_agent — /var/log/oam/oam_agent.log</span>
          </div>
          <button
            onClick={boot}
            disabled={booting}
            className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded transition-colors"
          >
            {booting ? "Booting..." : booted ? "↺ Reboot" : "▶ Boot"}
          </button>
        </div>
        <div className="bg-zinc-950 p-4 h-56 overflow-y-auto font-mono text-xs leading-relaxed">
          {logs.length === 0 && !booting && (
            <p className="text-zinc-700 italic">Click ▶ Boot to start the OAM Agent startup sequence</p>
          )}
          {logs.map((line, i) => (
            <div key={i} className={lineColor(line)}>{line}</div>
          ))}
          {booting && (
            <div className="flex items-center gap-1.5 text-zinc-600 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span className="italic">Initializing...</span>
            </div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Crash injection */}
      {booted && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="text-xs text-zinc-500 mb-3">Crash Injection — simulate failure scenarios</div>
          <div className="flex flex-wrap gap-2">
            {(["SIGSEGV", "ZMQ_TIMEOUT", "CONFD_DROP", "OOM"] as CrashType[]).map((t) => (
              <button
                key={t}
                onClick={() => injectCrash(t)}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors font-mono"
              >
                💥 {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
