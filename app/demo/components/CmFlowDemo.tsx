"use client";
import { useState, useCallback } from "react";

type Preset = "cell" | "frequency" | "power";
type NodeState = "idle" | "active" | "done" | "error";

const PRESETS: Record<Preset, { label: string; yang: string; xml: string; latencies: number[] }> = {
  cell: {
    label: "Cell Config",
    yang: "/ietf-interfaces:interfaces/interface[name='NR-Cell-001']/ietf-ip:ipv4/address",
    xml: `<edit-config>
  <target><running/></target>
  <config>
    <interfaces xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">
      <interface>
        <name>NR-Cell-001</name>
        <cell-id>42</cell-id>
        <pci>87</pci>
        <arfcn-dl>632628</arfcn-dl>
        <tx-power dbm="23"/>
      </interface>
    </interfaces>
  </config>
</edit-config>`,
    latencies: [12, 8, 5, 3, 6],
  },
  frequency: {
    label: "Freq Band",
    yang: "/bbf-nr-du:nr-du/cell-list/cell[name='NR-Cell-001']/frequency-info",
    xml: `<edit-config>
  <target><running/></target>
  <config>
    <nr-du xmlns="urn:bbf:yang:bbf-nr-du">
      <cell-list>
        <cell>
          <name>NR-Cell-001</name>
          <frequency-info>
            <band>n78</band>
            <arfcn-dl>632628</arfcn-dl>
            <arfcn-ul>632628</arfcn-ul>
            <bw-dl>100MHz</bw-dl>
          </frequency-info>
        </cell>
      </cell-list>
    </nr-du>
  </config>
</edit-config>`,
    latencies: [10, 6, 4, 3, 7],
  },
  power: {
    label: "TX Power",
    yang: "/bbf-nr-du:nr-du/cell-list/cell[name='NR-Cell-001']/tx-power-info",
    xml: `<edit-config>
  <target><running/></target>
  <config>
    <nr-du xmlns="urn:bbf:yang:bbf-nr-du">
      <cell-list>
        <cell>
          <name>NR-Cell-001</name>
          <tx-power-info>
            <max-power dbm="43"/>
            <ref-signal-power dbm="15"/>
            <attenuation db="0"/>
          </tx-power-info>
        </cell>
      </cell-list>
    </nr-du>
  </config>
</edit-config>`,
    latencies: [9, 7, 4, 2, 5],
  },
};

const NODES = [
  { id: "nms", label: "NMS", sub: "NETCONF Client", color: "border-cyan-500/60 bg-cyan-500/5" },
  { id: "confd", label: "ConfD", sub: "YANG Validation", color: "border-violet-500/60 bg-violet-500/5" },
  { id: "oam", label: "OAM Agent", sub: "C++ Middleware", color: "border-blue-500/60 bg-blue-500/5" },
  { id: "zmq", label: "ZMQ", sub: "Message Broker", color: "border-amber-500/60 bg-amber-500/5" },
  { id: "gnb", label: "gNB", sub: "Base Station", color: "border-emerald-500/60 bg-emerald-500/5" },
];

export default function CmFlowDemo() {
  const [preset, setPreset] = useState<Preset>("cell");
  const [errorInject, setErrorInject] = useState(false);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [errored, setErrored] = useState(false);
  const [showXml, setShowXml] = useState(false);
  const [latencyResult, setLatencyResult] = useState<number[]>([]);

  const p = PRESETS[preset];

  const runFlow = useCallback(() => {
    setNodeStates({});
    setRunning(true);
    setDone(false);
    setErrored(false);
    setLatencyResult([]);

    const nodeIds = NODES.map((n) => n.id);
    const errorAt = errorInject ? 1 : -1;

    let i = 0;
    const step = () => {
      if (i >= nodeIds.length) {
        setRunning(false);
        setDone(true);
        setLatencyResult(p.latencies);
        return;
      }
      const id = nodeIds[i];
      setNodeStates((prev) => ({ ...prev, [id]: "active" }));
      setTimeout(() => {
        if (i === errorAt) {
          setNodeStates((prev) => ({ ...prev, [id]: "error" }));
          setRunning(false);
          setErrored(true);
          return;
        }
        setNodeStates((prev) => ({ ...prev, [id]: "done" }));
        i++;
        setTimeout(step, 300);
      }, 600);
    };
    step();
  }, [preset, errorInject, p.latencies]);

  const getNodeStyle = (id: string) => {
    const s = nodeStates[id] ?? "idle";
    const base = NODES.find((n) => n.id === id)!;
    if (s === "active") return "border-white/50 bg-white/5 shadow-lg scale-105";
    if (s === "done") return base.color + " opacity-100";
    if (s === "error") return "border-red-500/60 bg-red-500/10 scale-105";
    return "border-zinc-800 bg-zinc-900 opacity-60";
  };

  const totalLatency = latencyResult.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Config preset:</span>
          {(Object.keys(PRESETS) as Preset[]).map((k) => (
            <button
              key={k}
              onClick={() => { setPreset(k); setNodeStates({}); setDone(false); setErrored(false); setLatencyResult([]); }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                preset === k ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {PRESETS[k].label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 ml-auto cursor-pointer">
          <span className="text-xs text-zinc-400">Error inject</span>
          <button
            onClick={() => { setErrorInject((e) => !e); setNodeStates({}); setDone(false); setErrored(false); }}
            className={`w-9 h-5 rounded-full border transition-all relative ${
              errorInject ? "bg-red-500/30 border-red-500/60" : "bg-zinc-800 border-zinc-700"
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
              errorInject ? "left-4 bg-red-400" : "left-0.5 bg-zinc-500"
            }`} />
          </button>
        </label>
        <button
          onClick={runFlow}
          disabled={running}
          className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold text-xs rounded-lg transition-colors"
        >
          {running ? "Running..." : done || errored ? "▶ Run Again" : "▶ Run Flow"}
        </button>
      </div>

      {/* Node diagram */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-0 overflow-x-auto">
          {NODES.map((node, i) => (
            <div key={node.id} className="flex items-center">
              <div className={`rounded-xl border p-3 min-w-[90px] text-center transition-all duration-300 ${getNodeStyle(node.id)}`}>
                <div className="text-xs font-bold text-zinc-100 mb-0.5">{node.label}</div>
                <div className="text-[10px] text-zinc-500">{node.sub}</div>
                <div className="mt-2 h-4 flex items-center justify-center">
                  {nodeStates[node.id] === "active" && (
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((j) => (
                        <span key={j} className="w-1 h-1 rounded-full bg-white/80 animate-bounce inline-block" style={{ animationDelay: `${j * 100}ms` }} />
                      ))}
                    </div>
                  )}
                  {nodeStates[node.id] === "done" && <span className="text-xs text-emerald-400">✓</span>}
                  {nodeStates[node.id] === "error" && <span className="text-xs text-red-400">✗</span>}
                </div>
              </div>
              {i < NODES.length - 1 && (
                <div className={`w-8 h-px transition-all duration-500 ${
                  nodeStates[NODES[i + 1].id] && nodeStates[NODES[i + 1].id] !== "idle"
                    ? "bg-gradient-to-r from-cyan-400 to-cyan-300"
                    : "bg-zinc-800"
                }`} />
              )}
            </div>
          ))}
        </div>

        {errored && (
          <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
            <div className="text-xs text-red-400 font-semibold mb-1">YANG Validation Failed — rpc-error</div>
            <pre className="text-[10px] text-red-300/70 font-mono">{`<rpc-error>
  <error-type>application</error-type>
  <error-tag>invalid-value</error-tag>
  <error-message>YANG constraint violation: tx-power exceeds cell max</error-message>
</rpc-error>`}</pre>
          </div>
        )}
      </div>

      {/* NETCONF XML + Latency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400">NETCONF edit-config</span>
            <button
              onClick={() => setShowXml((s) => !s)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showXml ? "hide" : "show"} XML
            </button>
          </div>
          {showXml ? (
            <pre className="p-4 text-[10px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">{p.xml}</pre>
          ) : (
            <div className="p-4">
              <div className="text-xs text-zinc-500 mb-1">YANG Path</div>
              <div className="text-xs font-mono text-cyan-300 break-all leading-relaxed">{p.yang}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400">Latency Breakdown</span>
          </div>
          <div className="p-4">
            {latencyResult.length > 0 ? (
              <div className="space-y-2">
                {NODES.map((n, i) => (
                  <div key={n.id} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 w-20 shrink-0">{n.label}</span>
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-700"
                        style={{ width: `${(latencyResult[i] / Math.max(...latencyResult)) * 100}%`, transitionDelay: `${i * 100}ms` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-zinc-400 w-12 text-right">{latencyResult[i]}ms</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-zinc-800 flex justify-between text-xs">
                  <span className="text-zinc-500">Round-trip total</span>
                  <span className="font-mono text-cyan-400 font-semibold">{totalLatency}ms</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-600 italic">Run the flow to see per-layer latency</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
