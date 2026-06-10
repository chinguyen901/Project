"use client";
import { useState, useEffect, useRef } from "react";

const JOBS_DB = [
  { title: "Python Automation Developer", company: "TechCorp Inc.", type: "Remote", salary: "$45–65/hr", source: "Upwork", match: true },
  { title: "Web Scraping Specialist", company: "DataHive LLC", type: "Remote", salary: "$40–55/hr", source: "Upwork", match: true },
  { title: "Selenium QA Engineer", company: "StartupXYZ", type: "Hybrid", salary: "$70k–90k/yr", source: "LinkedIn", match: false },
  { title: "Backend Python Engineer", company: "FinanceApp Co.", type: "Remote", salary: "$85k–110k/yr", source: "Indeed", match: true },
  { title: "Playwright Test Automation", company: "QA Labs", type: "On-site", salary: "$60k–80k/yr", source: "Indeed", match: false },
  { title: "Data Pipeline Developer", company: "Cloud Analytics", type: "Remote", salary: "$50–70/hr", source: "Upwork", match: true },
  { title: "Bot Developer (Telegram/Discord)", company: "MediaGroup", type: "Remote", salary: "$30–45/hr", source: "Upwork", match: true },
  { title: "Full-Stack Python Developer", company: "Agency Partner", type: "Remote", salary: "$55–75/hr", source: "LinkedIn", match: false },
  { title: "ETL Engineer — Python/Airflow", company: "DataWorks", type: "Hybrid", salary: "$90k–120k/yr", source: "LinkedIn", match: true },
  { title: "DevOps Automation Engineer", company: "InfraCloud", type: "Remote", salary: "$95k–130k/yr", source: "Indeed", match: false },
];

const SOURCE_COLORS: Record<string, string> = {
  Upwork: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  LinkedIn: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  Indeed: "text-amber-400 bg-amber-500/10 border-amber-500/30",
};

const TYPE_COLORS: Record<string, string> = {
  Remote: "text-cyan-400",
  Hybrid: "text-violet-400",
  "On-site": "text-zinc-400",
};

export default function JobMonitorDemo() {
  const [keyword, setKeyword] = useState("Python automation");
  const [sources, setSources] = useState({ Upwork: true, LinkedIn: true, Indeed: true });
  const [typeFilter, setTypeFilter] = useState<"all" | "Remote" | "Hybrid" | "On-site">("all");
  const [scanning, setScanning] = useState(false);
  const [currentSource, setCurrentSource] = useState<string | null>(null);
  const [results, setResults] = useState<typeof JOBS_DB>([]);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(1800);
  const [notification, setNotification] = useState<string | null>(null);
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (cdRef.current) clearInterval(cdRef.current); };
  }, []);

  const startScan = () => {
    setResults([]);
    setDone(false);
    setScanning(true);
    setNotification(null);

    const activeSources = Object.entries(sources).filter(([, v]) => v).map(([k]) => k);
    let srcIdx = 0;
    let jobIdx = 0;

    const scanInterval = setInterval(() => {
      if (srcIdx < activeSources.length) {
        setCurrentSource(activeSources[srcIdx]);
        const srcJobs = JOBS_DB.filter((j) => j.source === activeSources[srcIdx]);
        if (jobIdx < srcJobs.length) {
          setResults((prev) => [...prev, srcJobs[jobIdx]]);
          if (srcJobs[jobIdx].match) {
            setNotification(`📱 Match on ${activeSources[srcIdx]}: "${srcJobs[jobIdx].title}" — ${srcJobs[jobIdx].company}`);
            setTimeout(() => setNotification(null), 4000);
          }
          jobIdx++;
        } else {
          srcIdx++;
          jobIdx = 0;
        }
      } else {
        clearInterval(scanInterval);
        setScanning(false);
        setCurrentSource(null);
        setDone(true);
        setCountdown(1800);
        if (cdRef.current) clearInterval(cdRef.current);
        cdRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              if (cdRef.current) clearInterval(cdRef.current);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      }
    }, 260);
  };

  const filteredResults = results.filter((j) =>
    typeFilter === "all" ? true : j.type === typeFilter
  );

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {/* Config */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Keywords</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Sources</label>
            <div className="flex gap-3">
              {(["Upwork", "LinkedIn", "Indeed"] as const).map((src) => (
                <label key={src} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sources[src]}
                    onChange={(e) => setSources((s) => ({ ...s, [src]: e.target.checked }))}
                    className="accent-amber-400"
                  />
                  <span className="text-xs text-zinc-300">{src}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(["all", "Remote", "Hybrid", "On-site"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                typeFilter === t
                  ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
              }`}
            >
              {t === "all" ? "All Types" : t}
            </button>
          ))}
          <button
            onClick={startScan}
            disabled={scanning}
            className="ml-auto px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold text-sm rounded-lg transition-colors"
          >
            {scanning ? "Scanning..." : done ? "Re-scan" : "Start Scan"}
          </button>
        </div>
      </div>

      {/* Status bar */}
      {(scanning || done) && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs">
          <div className="flex items-center gap-2">
            {scanning ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                <span className="text-zinc-400">Scanning <span className="text-amber-400 font-medium">{currentSource}</span>...</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-zinc-400">Scan complete — {results.length} jobs found, {results.filter((j) => j.match).length} matches</span>
              </>
            )}
          </div>
          {done && countdown > 0 && (
            <div className="flex items-center gap-1.5 text-zinc-600">
              <span>⏰ Next scan in</span>
              <span className="font-mono text-zinc-400">{fmt(countdown)}</span>
            </div>
          )}
        </div>
      )}

      {/* Telegram notification */}
      {notification && (
        <div className="px-4 py-3 rounded-xl border border-blue-500/40 bg-blue-500/10 flex items-center gap-3">
          <span className="text-lg">✈️</span>
          <div>
            <div className="text-xs font-semibold text-blue-400">Telegram Alert</div>
            <p className="text-sm text-zinc-200">{notification}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {filteredResults.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-zinc-500 px-1">
            Showing {filteredResults.length} of {results.length} jobs
            {filteredResults.filter((j) => j.match).length > 0 && (
              <span className="ml-2 text-emerald-400">· {filteredResults.filter((j) => j.match).length} keyword matches</span>
            )}
          </div>
          {filteredResults.map((job, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border transition-all ${
                job.match
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-zinc-800 bg-zinc-900"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-semibold text-zinc-100">{job.title}</h4>
                    {job.match && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">match</span>}
                  </div>
                  <div className="text-xs text-zinc-500">{job.company} · <span className={TYPE_COLORS[job.type]}>{job.type}</span></div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${SOURCE_COLORS[job.source]}`}>{job.source}</span>
                  <span className="text-xs text-zinc-400 font-mono">{job.salary}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!scanning && !done && (
        <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center text-zinc-600 text-sm">
          Configure keywords and click <span className="text-amber-400 font-medium">Start Scan</span> to find matching jobs
        </div>
      )}
    </div>
  );
}
