"use client";
import { useState, useCallback } from "react";

const PRESETS = {
  "vendor-order": {
    label: "Vendor Order Form",
    description: "Auto-fills order forms across supplier portals",
    fields: ["Vendor ID", "Product SKU", "Quantity", "Delivery Date"],
    records: [
      ["VND-001", "SKU-8821", "50", "2025-07-10"],
      ["VND-002", "SKU-3341", "120", "2025-07-12"],
      ["VND-003", "SKU-7765", "25", "2025-07-15"],
      ["VND-004", "SKU-2209", "200", "2025-07-11"],
      ["VND-005", "SKU-9934", "75", "2025-07-14"],
    ],
    timePerItem: { manual: 3.2, extension: 0.4 },
  },
  "price-check": {
    label: "Competitor Price Check",
    description: "Visits product pages and extracts live prices",
    fields: ["Product URL", "Competitor", "SKU", "Price"],
    records: [
      ["amazon.com/dp/B08XYZ", "Amazon", "B08XYZ", "$29.99"],
      ["ebay.com/itm/33412", "eBay", "33412", "$27.50"],
      ["walmart.com/ip/8821", "Walmart", "8821", "$31.00"],
      ["target.com/p/9934", "Target", "9934", "$28.75"],
      ["bestbuy.com/site/77", "BestBuy", "77", "$32.50"],
    ],
    timePerItem: { manual: 4.5, extension: 0.6 },
  },
  "lead-form": {
    label: "Lead Form Fill",
    description: "Submits contact info to lead capture pages",
    fields: ["Name", "Email", "Company", "Role"],
    records: [
      ["Alice Chen", "alice@techco.io", "TechCo", "CTO"],
      ["Bob Smith", "bsmith@agency.com", "Agency Inc.", "Director"],
      ["Carol Lee", "carol@startup.io", "Startup XYZ", "CEO"],
      ["David Park", "dpark@corp.com", "Corp LLC", "VP Sales"],
      ["Emma White", "ewhite@media.net", "MediaGroup", "Manager"],
    ],
    timePerItem: { manual: 2.8, extension: 0.35 },
  },
};

type PresetKey = keyof typeof PRESETS;
type RowStatus = "idle" | "running" | "done" | "error";

export default function ChromeAutomatorDemo() {
  const [preset, setPreset] = useState<PresetKey>("vendor-order");
  const [statuses, setStatuses] = useState<RowStatus[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const p = PRESETS[preset];

  const runWorkflow = useCallback(() => {
    setStatuses(new Array(p.records.length).fill("idle"));
    setRunning(true);
    setDone(false);

    let i = 0;
    const step = () => {
      if (i >= p.records.length) {
        setRunning(false);
        setDone(true);
        return;
      }
      setStatuses((prev) => prev.map((s, idx) => (idx === i ? "running" : s)));
      setTimeout(() => {
        const success = Math.random() > 0.08;
        setStatuses((prev) => prev.map((s, idx) => (idx === i ? (success ? "done" : "error") : s)));
        i++;
        setTimeout(step, 150);
      }, 600);
    };
    step();
  }, [preset, p.records.length]);

  const manualTotal = (p.records.length * p.timePerItem.manual).toFixed(1);
  const extTotal = (p.records.length * p.timePerItem.extension).toFixed(1);
  const saved = (parseFloat(manualTotal) - parseFloat(extTotal)).toFixed(1);
  const speedup = Math.round(p.timePerItem.manual / p.timePerItem.extension);

  const successCount = statuses.filter((s) => s === "done").length;
  const errorCount = statuses.filter((s) => s === "error").length;

  return (
    <div className="space-y-4">
      {/* Preset selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.entries(PRESETS) as [PresetKey, typeof PRESETS[PresetKey]][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => { setPreset(key); setStatuses([]); setDone(false); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              preset === key
                ? "border-orange-500/50 bg-orange-500/5"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
            }`}
          >
            <div className={`text-sm font-semibold mb-1 ${preset === key ? "text-orange-400" : "text-zinc-200"}`}>
              {val.label}
            </div>
            <div className="text-xs text-zinc-500 leading-relaxed">{val.description}</div>
          </button>
        ))}
      </div>

      {/* Records table + run */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <div>
            <span className="text-sm font-semibold text-zinc-200">{p.label}</span>
            <span className="ml-2 text-xs text-zinc-600">{p.records.length} records queued</span>
          </div>
          <button
            onClick={runWorkflow}
            disabled={running}
            className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            {running ? "Running..." : done ? "▶ Run Again" : "▶ Run Workflow"}
          </button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-4 py-2 text-left text-zinc-500 font-medium w-8">#</th>
              {p.fields.map((f) => (
                <th key={f} className="px-4 py-2 text-left text-zinc-500 font-medium">{f}</th>
              ))}
              <th className="px-4 py-2 text-center text-zinc-500 font-medium w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {p.records.map((row, i) => (
              <tr key={i} className={`border-b border-zinc-800/50 transition-colors ${statuses[i] === "running" ? "bg-orange-500/5" : "bg-zinc-900"}`}>
                <td className="px-4 py-2.5 text-zinc-600">{i + 1}</td>
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 text-zinc-300 font-mono">{cell}</td>
                ))}
                <td className="px-4 py-2.5 text-center">
                  {statuses[i] === "running" && (
                    <span className="inline-flex items-center gap-1 text-orange-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping inline-block" />
                      filling
                    </span>
                  )}
                  {statuses[i] === "done" && <span className="text-emerald-400">✓ done</span>}
                  {statuses[i] === "error" && <span className="text-red-400">✗ error</span>}
                  {(!statuses[i] || statuses[i] === "idle") && <span className="text-zinc-700">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Time savings */}
      {done && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-center">
            <div className="text-xs text-zinc-500 mb-1">Manual time</div>
            <div className="text-xl font-bold text-zinc-400">{manualTotal}min</div>
          </div>
          <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 text-center">
            <div className="text-xs text-zinc-500 mb-1">With extension</div>
            <div className="text-xl font-bold text-orange-400">{extTotal}min</div>
          </div>
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center">
            <div className="text-xs text-zinc-500 mb-1">Time saved</div>
            <div className="text-xl font-bold text-emerald-400">{saved}min</div>
          </div>
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-center">
            <div className="text-xs text-zinc-500 mb-1">Speed-up</div>
            <div className="text-xl font-bold text-cyan-400">{speedup}×</div>
          </div>
          {(successCount > 0 || errorCount > 0) && (
            <div className="col-span-full text-xs text-zinc-500 text-center">
              {successCount} succeeded · {errorCount} errors
            </div>
          )}
        </div>
      )}

      {statuses.length === 0 && (
        <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center text-zinc-600 text-sm">
          Select a workflow preset and click <span className="text-orange-400 font-medium">▶ Run Workflow</span>
        </div>
      )}
    </div>
  );
}
