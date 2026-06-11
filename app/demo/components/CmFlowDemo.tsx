"use client";
import { useState, useCallback, useRef, useEffect } from "react";

type Preset = "cell" | "frequency" | "power";

const PRESETS: Record<Preset, { label: string; yang: string; xml: string; latencies: number[]; errorMsg: string }> = {
  cell: {
    label: "Cell Config",
    yang: "/GNBDUFunction=1/NRCellDU=NR-Cell-001/attributes",
    xml: `<edit-config xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <target><running/></target>
  <config>
    <GNBDUFunction xmlns="urn:3gpp:sa5:_3gpp-nr-nrm-gnbdufunction">
      <id>1</id>
      <NRCellDU>
        <id>NR-Cell-001</id>
        <attributes>
          <cellLocalId>42</cellLocalId>
          <nrPCI>87</nrPCI>
          <operationalState>ENABLED</operationalState>
          <administrativeState>UNLOCKED</administrativeState>
        </attributes>
      </NRCellDU>
    </GNBDUFunction>
  </config>
</edit-config>`,
    latencies: [12, 8, 5, 3, 6],
    errorMsg: "YANG constraint violation: nrPCI value 87 conflicts with neighbor cell NR-Cell-002 (pci=87)",
  },
  frequency: {
    label: "Freq Band",
    yang: "/GNBDUFunction=1/NRCellDU=NR-Cell-001/attributes/nrFreqBand",
    xml: `<edit-config xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <target><running/></target>
  <config>
    <GNBDUFunction xmlns="urn:3gpp:sa5:_3gpp-nr-nrm-gnbdufunction">
      <id>1</id>
      <NRCellDU>
        <id>NR-Cell-001</id>
        <attributes>
          <nrFreqBand>78</nrFreqBand>
          <arfcnDL>632628</arfcnDL>
          <arfcnUL>632628</arfcnUL>
          <bSChannelBwDL>100</bSChannelBwDL>
        </attributes>
      </NRCellDU>
    </GNBDUFunction>
  </config>
</edit-config>`,
    latencies: [10, 6, 4, 3, 7],
    errorMsg: "YANG constraint violation: arfcnDL 632628 out of range for nrFreqBand 78 (valid: 620000–653333)",
  },
  power: {
    label: "TX Power",
    yang: "/GNBDUFunction=1/NRCellDU=NR-Cell-001/attributes/configuredMaxTxPower",
    xml: `<edit-config xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <target><running/></target>
  <config>
    <GNBDUFunction xmlns="urn:3gpp:sa5:_3gpp-nr-nrm-gnbdufunction">
      <id>1</id>
      <NRCellDU>
        <id>NR-Cell-001</id>
        <attributes>
          <configuredMaxTxPower>400</configuredMaxTxPower>
          <ssbFrequency>632628</ssbFrequency>
          <txDirection>DL</txDirection>
        </attributes>
      </NRCellDU>
    </GNBDUFunction>
  </config>
</edit-config>`,
    latencies: [9, 7, 4, 2, 5],
    errorMsg: "YANG constraint violation: configuredMaxTxPower 430 exceeds hardware limit 400 (0.1 dBm units)",
  },
};

const ARCH = [
  {
    id: "nms", layer: "O&M System", layerSub: "External Network Management", chi: false,
    nodes: [{ icon: "🖥", label: "Virtuora NMS", desc: "NETCONF/SSH client — sends management RPCs to gNB" }],
    conn: { label: "NETCONF edit-config RPC", proto: "SSH / TCP:830" },
  },
  {
    id: "confd", layer: "YANG Datastore", layerSub: "Cisco ConfD — Validation Engine", chi: false,
    nodes: [{ icon: "🗄", label: "ConfD", desc: "Validates edit-config against 3GPP TS 28.541 YANG schema" }],
    conn: { label: "YANG subscription callback", proto: "IPC notify → OAM Agent" },
  },
  {
    id: "oam", layer: "OAM Middleware", layerSub: "★ Chi Nguyen @ TMA Solutions", chi: true,
    nodes: [
      { icon: "⚙", label: "OAM Agent", desc: "C++ main process — bridges NMS ↔ gNB" },
      { icon: "📋", label: "CM Module", desc: "Handles ConfD callbacks, serializes YANG → ZMQ messages" },
      { icon: "🚨", label: "FM Module", desc: "Subscribes to ZMQ alarms, raises YANG notifications to ConfD" },
      { icon: "📊", label: "PM Module", desc: "Collects gNB performance counters, reports via NETCONF" },
    ],
    conn: { label: "ZMQ REQ/REP — config apply message", proto: "tcp://127.0.0.1:5555" },
  },
  {
    id: "gnb", layer: "gNB Application", layerSub: "5G Base Station Software Stack", chi: false,
    nodes: [
      { icon: "📡", label: "gNB App", desc: "DU software stack — receives ZMQ config, applies to radio" },
      { icon: "📻", label: "RRU / BBU", desc: "Radio frontend hardware — executes final RF configuration" },
    ],
    conn: null,
  },
];

const LOGS: Record<Preset, { ok: string[]; err: string[] }> = {
  cell: {
    ok: [
      "[NMS   ] ► Sending NETCONF edit-config — session-id: 1042, target: running",
      "[NMS   ] ► Payload: NRCellDU=NR-Cell-001 attributes (cellLocalId=42, nrPCI=87)",
      "[ConfD ] ► Received RPC — validating against 3GPP TS 28.541 YANG schema",
      "[ConfD ] ✓ Schema validation passed — 4 leaves validated OK",
      "[ConfD ] ► Triggering YANG subscription callback → OAM Agent CM Module",
      "[★ OAM ] ► CM Module received config notification for NRCellDU=NR-Cell-001",
      "[★ OAM ] ► CM Module serializing YANG diff → ZMQ binary message (128 bytes)",
      "[★ ZMQ ] ► REQ socket: CM_CONFIG_UPDATE → tcp://127.0.0.1:5555",
      "[gNB   ] ► Received CM_CONFIG_UPDATE — applying NR cell parameters",
      "[gNB   ] ✓ Config committed to DU stack: PCI=87, cellLocalId=42, adminState=UNLOCKED",
      "[★ ZMQ ] ✓ REP: CM_CONFIG_ACK received from gNB (RTT: 6ms)",
      "[★ OAM ] ► Committing applied config to ConfD running datastore",
      "[ConfD ] ✓ Datastore updated — operational state synchronized",
      "[NMS   ] ✓ NETCONF rpc-ok received — configuration committed successfully",
    ],
    err: [
      "[NMS   ] ► Sending NETCONF edit-config — session-id: 1042",
      "[NMS   ] ► Payload: NRCellDU=NR-Cell-001 nrPCI=87",
      "[ConfD ] ► Validating nrPCI=87 uniqueness in cell neighborhood (3GPP constraint)",
      "[ConfD ] ✗ YANG constraint FAILED: nrPCI=87 already assigned to NRCellDU=NR-Cell-002",
      "[ConfD ] ✗ Returning rpc-error: error-tag=invalid-value, error-type=application",
      "[NMS   ] ✗ NETCONF rpc-error received — configuration NOT applied, rollback complete",
    ],
  },
  frequency: {
    ok: [
      "[NMS   ] ► Sending NETCONF edit-config — session-id: 1043, target: running",
      "[NMS   ] ► Payload: nrFreqBand=78, arfcnDL=632628, arfcnUL=632628, bSChannelBwDL=100",
      "[ConfD ] ► Validating NR frequency band constraints (3GPP TS 28.541)",
      "[ConfD ] ✓ arfcnDL=632628 in valid range for band 78, bSChannelBw=100MHz supported",
      "[ConfD ] ► Subscription callback → OAM Agent — frequency band change",
      "[★ OAM ] ► CM Module: NR frequency update — band=78 (3500–3600 MHz range)",
      "[★ OAM ] ► CM Module serializing → ZMQ message: CM_FREQ_UPDATE (96 bytes)",
      "[★ ZMQ ] ► REQ: CM_FREQ_UPDATE → tcp://127.0.0.1:5555",
      "[gNB   ] ► Retuning RF subsystem to band n78, DL center: 3600 MHz",
      "[gNB   ] ✓ RF retune complete — new DL ARFCN: 632628, BW: 100 MHz",
      "[★ ZMQ ] ✓ REP: CM_FREQ_ACK (RTT: 9ms)",
      "[NMS   ] ✓ NETCONF rpc-ok — frequency configuration applied",
    ],
    err: [
      "[NMS   ] ► Sending NETCONF edit-config — session-id: 1043",
      "[ConfD ] ► Validating: arfcnDL=632628 for nrFreqBand=78",
      "[ConfD ] ✗ ERROR: arfcnDL 632628 out of valid range for band 78 (valid: 620000–653333)",
      "[ConfD ] ✗ Returning rpc-error: invalid-value",
      "[NMS   ] ✗ NETCONF rpc-error — frequency config rejected, no RF changes made",
    ],
  },
  power: {
    ok: [
      "[NMS   ] ► Sending NETCONF edit-config — session-id: 1044, target: running",
      "[NMS   ] ► Payload: configuredMaxTxPower=400 (40.0 dBm), ssbFrequency=632628",
      "[ConfD ] ► Validating TX power against hardware capability model",
      "[ConfD ] ✓ 400 (40.0 dBm) within hardware limit (max: 400) — OK",
      "[ConfD ] ► Subscription callback → OAM Agent — TX power change",
      "[★ OAM ] ► CM Module: TX power config — maxPwr=400, dir=DL, ssbFreq=632628",
      "[★ ZMQ ] ► REQ: CM_POWER_UPDATE → tcp://127.0.0.1:5555",
      "[gNB   ] ► Calibrating PA to 40.0 dBm DL (SSB reference: 3600 MHz)",
      "[gNB   ] ✓ PA calibration complete — output power verified",
      "[★ ZMQ ] ✓ REP: CM_POWER_ACK (RTT: 7ms)",
      "[NMS   ] ✓ NETCONF rpc-ok — TX power configuration applied",
    ],
    err: [
      "[NMS   ] ► Sending NETCONF edit-config — session-id: 1044",
      "[ConfD ] ► Validating configuredMaxTxPower=430 (43.0 dBm)",
      "[ConfD ] ✗ ERROR: 430 exceeds hardware limit 400 (40.0 dBm max for this RRU)",
      "[ConfD ] ✗ Returning rpc-error: invalid-value",
      "[NMS   ] ✗ NETCONF rpc-error — power config rejected, PA unchanged",
    ],
  },
};

function nodeFromLog(line: string): string | null {
  if (line.startsWith("[NMS")) return "Virtuora NMS";
  if (line.startsWith("[ConfD")) return "ConfD";
  if (line.startsWith("[★ ZMQ")) return "CM Module";
  if (line.startsWith("[★ OAM") && line.includes("CM Module")) return "CM Module";
  if (line.startsWith("[★ OAM")) return "OAM Agent";
  if (line.startsWith("[gNB")) return "gNB App";
  return null;
}

const INTERVAL = 500;

export default function CmFlowDemo() {
  const [preset, setPreset] = useState<Preset>("cell");
  const [errorInject, setErrorInject] = useState(false);
  const [activeLayerIdx, setActiveLayerIdx] = useState(-1);
  const [activeNodeLabel, setActiveNodeLabel] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [errored, setErrored] = useState(false);
  const [showXml, setShowXml] = useState(false);
  const [latencyResult, setLatencyResult] = useState<number[]>([]);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [msgCount, setMsgCount] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const p = PRESETS[preset];

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [runLogs]);

  const runFlow = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActiveLayerIdx(0);
    setActiveNodeLabel(null);
    setRunning(true);
    setDone(false);
    setErrored(false);
    setLatencyResult([]);
    setRunLogs([]);
    setMsgCount(0);

    const logs = errorInject ? LOGS[preset].err : LOGS[preset].ok;
    const layerSeq = errorInject ? [0, 1] : [0, 1, 2, 3];
    const step = Math.ceil((logs.length * INTERVAL) / layerSeq.length);
    layerSeq.forEach((li, i) => {
      timers.current.push(setTimeout(() => setActiveLayerIdx(li), i * step));
    });
    logs.forEach((line, i) => {
      timers.current.push(setTimeout(() => {
        setRunLogs(prev => [...prev, line]);
        setMsgCount(prev => prev + 1);
        setActiveNodeLabel(nodeFromLog(line));
      }, i * INTERVAL + 100));
    });
    timers.current.push(setTimeout(() => {
      setRunning(false);
      setActiveLayerIdx(-1);
      setActiveNodeLabel(null);
      if (errorInject) { setErrored(true); }
      else { setDone(true); setLatencyResult(p.latencies); }
    }, logs.length * INTERVAL + 600));
  }, [preset, errorInject, p.latencies]);

  return (
    <div className="space-y-4">
      {/* Architecture Diagram */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-zinc-100">5G OAM — Configuration Management</span>
            <span className="ml-3 text-xs text-zinc-500">3GPP TS 28.541 · NETCONF/YANG · ZMQ</span>
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
                        <div key={node.label} className={`flex-1 min-w-[140px] px-3 py-2.5 rounded-lg border transition-all duration-200 ${
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
                    {layer.conn.label}{" "}
                    <span className="font-mono text-zinc-700">({layer.conn.proto})</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Run Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRESETS) as Preset[]).map(k => (
                <button key={k}
                  onClick={() => { setPreset(k); setDone(false); setErrored(false); setLatencyResult([]); setRunLogs([]); setActiveLayerIdx(-1); setActiveNodeLabel(null); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${preset === k ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}>
                  {PRESETS[k].label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-zinc-400">Error inject</span>
                <button onClick={() => { setErrorInject(e => !e); setDone(false); setErrored(false); setRunLogs([]); setActiveLayerIdx(-1); setActiveNodeLabel(null); }}
                  className={`w-9 h-5 rounded-full border relative transition-all ${errorInject ? "bg-red-500/30 border-red-500/60" : "bg-zinc-800 border-zinc-700"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${errorInject ? "left-4 bg-red-400" : "left-0.5 bg-zinc-500"}`} />
                </button>
              </label>
              <button onClick={runFlow} disabled={running}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-bold text-xs rounded-lg transition-colors">
                {running ? "⏳ Running..." : done || errored ? "▶ Run Again" : "▶ Run Flow"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400">NETCONF edit-config payload</span>
              <button onClick={() => setShowXml(s => !s)} className="text-xs text-zinc-500 hover:text-zinc-300">{showXml ? "hide XML" : "show XML"}</button>
            </div>
            {showXml ? (
              <pre className="p-4 text-[10px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-52">{p.xml}</pre>
            ) : (
              <div className="p-4">
                <div className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wide">YANG Path (3GPP TS 28.541)</div>
                <div className="text-xs font-mono text-cyan-300 break-all leading-relaxed">{p.yang}</div>
              </div>
            )}
          </div>

          {latencyResult.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400">Per-Layer Latency</span>
              </div>
              <div className="p-4 space-y-2">
                {ARCH.map((l, i) => (
                  <div key={l.id} className="flex items-center gap-3">
                    <span className={`text-[10px] w-20 shrink-0 ${l.chi ? "text-red-300 font-bold" : "text-zinc-500"}`}>{l.layer.split(" ")[0]}{l.chi ? " ★" : ""}</span>
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${l.chi ? "bg-red-400" : "bg-cyan-400"}`}
                        style={{ width: `${(latencyResult[i] / Math.max(...latencyResult)) * 100}%`, transitionDelay: `${i * 100}ms` }} />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">{latencyResult[i]}ms</span>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-zinc-800 flex justify-between text-xs">
                  <span className="text-zinc-600">Round-trip total</span>
                  <span className="font-mono text-cyan-400 font-bold">{latencyResult.reduce((a, b) => a + b, 0)}ms</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Messages", value: String(msgCount), color: "text-cyan-400" },
              { label: "Status", value: running ? "Running" : done ? "Success" : errored ? "Error" : "Idle", color: running ? "text-amber-400" : done ? "text-emerald-400" : errored ? "text-red-400" : "text-zinc-500" },
              { label: "Protocol", value: "NETCONF", color: "text-violet-400" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 text-center">
                <div className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/50 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 inline-block" />
              </div>
              <span className="text-xs font-mono text-zinc-500">oam_agent — CM flow execution log</span>
              {running && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />}
            </div>
            <div ref={logContainerRef} className="bg-zinc-950 p-4 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed">
              {runLogs.length === 0 ? (
                <p className="text-zinc-700 italic">Click ▶ Run Flow to execute the NETCONF CM pipeline</p>
              ) : runLogs.map((line, i) => (
                <div key={i} className={
                  line.includes("[★") ? "text-red-300" :
                  line.includes("✗") ? "text-red-400" :
                  line.includes("✓") ? "text-emerald-400" :
                  line.startsWith("[NMS") ? "text-cyan-300/80" :
                  line.startsWith("[ConfD") ? "text-violet-300/80" :
                  line.startsWith("[gNB") ? "text-emerald-300/60" :
                  "text-zinc-400"
                }>{line}</div>
              ))}
              {running && (
                <div className="flex items-center gap-1.5 text-zinc-600 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                  <span className="italic text-[10px]">processing...</span>
                </div>
              )}
            </div>
          </div>

          {errored && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-950/20">
              <div className="text-xs text-red-400 font-bold mb-2">ConfD rpc-error response</div>
              <pre className="text-[10px] text-red-300/70 font-mono leading-relaxed overflow-x-auto">{`<rpc-reply xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <rpc-error>
    <error-type>application</error-type>
    <error-tag>invalid-value</error-tag>
    <error-severity>error</error-severity>
    <error-message>${p.errorMsg}</error-message>
    <error-path>${p.yang}</error-path>
  </rpc-error>
</rpc-reply>`}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
