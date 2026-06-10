"use client";
import { useState, useEffect, useRef } from "react";

const METRICS = {
  weekly: {
    label: "Last 7 days",
    bar: [42, 68, 55, 91, 73, 88, 62],
    line: [1200, 1850, 1620, 2340, 2010, 2580, 1940],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    stats: { total: "12,540", avg: "1,791", peak: "2,580", pct: "+18.4%" },
  },
  monthly: {
    label: "Last 4 weeks",
    bar: [55, 72, 81, 68],
    line: [8200, 11400, 14200, 12100],
    labels: ["W1", "W2", "W3", "W4"],
    stats: { total: "45,900", avg: "11,475", peak: "14,200", pct: "+24.1%" },
  },
};

type Period = keyof typeof METRICS;

function AnimatedBar({ value, max, delay, color }: { value: number; max: number; delay: number; color: string }) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setHeight(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  const pct = (height / max) * 100;
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="w-full flex items-end justify-center" style={{ height: 80 }}>
        <div
          className={`w-4/5 rounded-t-sm transition-all duration-700 ease-out ${color}`}
          style={{ height: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AnimatedLine({ data, color }: { data: number[]; color: string }) {
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(false);
    setProgress(0);
    const t1 = setTimeout(() => { setMounted(true); }, 50);
    const t2 = setTimeout(() => setProgress(100), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [data]);

  if (!mounted || data.length < 2) return null;
  const W = 300, H = 80;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 10) - 5,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id="lineClip">
          <rect x="0" y="0" width={`${progress}%`} height={H} />
        </clipPath>
      </defs>
      <path d={pathD + ` L ${W} ${H} L 0 ${H} Z`} fill="url(#lineGrad)" clipPath="url(#lineClip)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#lineClip)" style={{ transition: "all 1s ease-out" }} />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity={progress === 100 ? 1 : 0} style={{ transition: "opacity 0.3s" }} />
      ))}
    </svg>
  );
}

export default function ReportGeneratorDemo() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [format, setFormat] = useState<"html" | "pdf" | "both">("both");
  const [email, setEmail] = useState("chinguyen10022000@gmail.com");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [step, setStep] = useState("");
  const [sent, setSent] = useState(false);
  const [key, setKey] = useState(0);

  const d = METRICS[period];

  const generate = () => {
    setGenerated(false);
    setSent(false);
    setGenerating(true);
    setKey((k) => k + 1);

    const steps = [
      "Collecting data from sources...",
      "Aggregating metrics...",
      "Building charts...",
      format !== "pdf" ? "Rendering HTML template..." : "Generating PDF...",
      "Report ready.",
    ];
    let i = 0;
    const run = () => {
      setStep(steps[i]);
      i++;
      if (i < steps.length) setTimeout(run, 500);
      else {
        setGenerating(false);
        setGenerated(true);
        setStep("");
      }
    };
    run();
  };

  const sendEmail = () => {
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  const barMax = Math.max(...d.bar);

  return (
    <div className="space-y-4">
      {/* Config */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Time Range</label>
            <select
              value={period}
              onChange={(e) => { setPeriod(e.target.value as Period); setGenerated(false); setSent(false); }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
            >
              <option value="weekly">Last 7 days</option>
              <option value="monthly">Last 4 weeks</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Output Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "html" | "pdf" | "both")}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
            >
              <option value="html">HTML</option>
              <option value="pdf">PDF</option>
              <option value="both">HTML + PDF</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Delivery Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
            />
          </div>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="mt-4 w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold text-sm rounded-lg transition-colors"
        >
          {generating ? step : generated ? "🔄 Regenerate" : "📈 Generate Report"}
        </button>
      </div>

      {/* Report preview */}
      {(generating || generated) && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-zinc-100">Automation Performance Report</div>
              <div className="text-xs text-zinc-500">{d.label} · Generated {new Date().toLocaleDateString()}</div>
            </div>
            {generated && (
              <div className="flex gap-2">
                <button
                  onClick={sendEmail}
                  className="text-xs px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors"
                >
                  {sent ? "✓ Sent!" : "📬 Send Email"}
                </button>
              </div>
            )}
          </div>

          <div className="p-5 space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
              {([
                ["Total Events", d.stats.total],
                ["Daily Avg.", d.stats.avg],
                ["Peak", d.stats.peak],
                ["vs Prior", d.stats.pct],
              ] as const).map(([label, val]) => (
                <div key={label} className={`p-3 rounded-lg border text-center ${generating ? "border-zinc-800 bg-zinc-900" : "border-amber-500/20 bg-amber-500/5"}`}>
                  <div className={`text-lg font-bold transition-all duration-500 ${generating ? "text-zinc-700" : "text-amber-400"}`}>{val}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div>
              <div className="text-xs font-semibold text-zinc-400 mb-2">Automation Runs per Day</div>
              <div className="flex items-end gap-1 px-2" key={`bar-${key}`} style={{ height: 90 }}>
                {d.bar.map((v, i) => (
                  <AnimatedBar key={i} value={v} max={barMax} delay={i * 80 + 200} color="bg-amber-500/70" />
                ))}
              </div>
              <div className="flex gap-1 px-2 mt-1">
                {d.labels.map((l) => (
                  <div key={l} className="flex-1 text-center text-[10px] text-zinc-600">{l}</div>
                ))}
              </div>
            </div>

            {/* Line chart */}
            <div>
              <div className="text-xs font-semibold text-zinc-400 mb-2">Records Processed</div>
              <div key={`line-${key}-${period}`}>
                <AnimatedLine data={d.line} color="#f59e0b" />
              </div>
              <div className="flex gap-1 px-2 mt-1">
                {d.labels.map((l) => (
                  <div key={l} className="flex-1 text-center text-[10px] text-zinc-600">{l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!generating && !generated && (
        <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center text-zinc-600 text-sm">
          Configure and click <span className="text-amber-400 font-medium">Generate Report</span> to see an animated preview
        </div>
      )}
    </div>
  );
}
