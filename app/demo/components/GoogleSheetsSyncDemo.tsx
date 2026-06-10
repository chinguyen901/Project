"use client";
import { useState, useCallback, useRef } from "react";

type Source = "crypto" | "products" | "jobs";

const DATA: Record<Source, { headers: string[]; rows: string[][] }> = {
  crypto: {
    headers: ["Symbol", "Price (USD)", "24h Change", "Market Cap", "Timestamp"],
    rows: [
      ["BTC", "$67,420.30", "+2.34%", "$1.32T", ""],
      ["ETH", "$3,840.10", "+1.87%", "$461B", ""],
      ["SOL", "$178.55", "-0.42%", "$80B", ""],
      ["BNB", "$587.20", "+0.91%", "$87B", ""],
      ["ADA", "$0.612", "+3.12%", "$21B", ""],
      ["DOT", "$9.84", "-1.20%", "$12B", ""],
    ],
  },
  products: {
    headers: ["Title", "Price (£)", "Rating", "In Stock", "Scraped At"],
    rows: [
      ["A Light in the Attic", "51.77", "★★★", "Yes", ""],
      ["Tipping the Velvet", "53.74", "★", "Yes", ""],
      ["Sapiens", "54.23", "★★★★★", "No", ""],
      ["Sharp Objects", "47.82", "★★★★", "Yes", ""],
      ["The Boys in the Boat", "22.60", "★★★★", "Yes", ""],
    ],
  },
  jobs: {
    headers: ["Title", "Company", "Type", "Salary", "Source", "Found At"],
    rows: [
      ["Python Automation Dev", "TechCorp Inc.", "Remote", "$45–65/hr", "Upwork", ""],
      ["Web Scraping Specialist", "DataHive LLC", "Remote", "$40–55/hr", "Upwork", ""],
      ["Backend Python Engineer", "FinanceApp Co.", "Remote", "$85k–110k", "Indeed", ""],
      ["Data Pipeline Developer", "Cloud Analytics", "Remote", "$50–70/hr", "Upwork", ""],
      ["ETL Engineer", "DataWorks", "Hybrid", "$90k–120k", "LinkedIn", ""],
    ],
  },
};

const SCHEDULES = ["Every 15 min", "Every 1 hour", "Every 6 hours", "Daily at 9:00 AM"];

export default function GoogleSheetsSyncDemo() {
  const [source, setSource] = useState<Source>("crypto");
  const [schedule, setSchedule] = useState(SCHEDULES[0]);
  const [synced, setSynced] = useState<boolean[]>([]);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [done, setDone] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { headers, rows } = DATA[source];

  const runSync = useCallback(() => {
    setSynced([]);
    setActiveRow(null);
    setSyncing(true);
    setDone(false);

    let i = 0;
    intervalRef.current = setInterval(() => {
      setActiveRow(i);
      setSynced((prev) => [...prev, true]);
      i++;
      if (i >= rows.length) {
        clearInterval(intervalRef.current!);
        setActiveRow(null);
        setSyncing(false);
        setDone(true);
        setSyncCount((c) => c + 1);
      }
    }, 280);
  }, [source, rows.length]);

  const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      {/* Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Data Source</h3>
          <div className="space-y-2">
            {(["crypto", "products", "jobs"] as Source[]).map((s) => (
              <label key={s} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                source === s ? "border-emerald-500/50 bg-emerald-500/5" : "border-zinc-800 hover:border-zinc-700"
              }`}>
                <input
                  type="radio"
                  name="source"
                  value={s}
                  checked={source === s}
                  onChange={() => { setSource(s); setSynced([]); setDone(false); }}
                  className="accent-emerald-500"
                />
                <div>
                  <div className={`text-sm font-medium ${source === s ? "text-emerald-400" : "text-zinc-200"}`}>
                    {s === "crypto" ? "Crypto Prices" : s === "products" ? "Product Scraper" : "Job Listings"}
                  </div>
                  <div className="text-xs text-zinc-500">{DATA[s].rows.length} rows · {DATA[s].headers.length} columns</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Schedule & Auth</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Sync Interval</label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
              >
                {SCHEDULES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <div className="text-xs text-zinc-500 mb-1">Service Account</div>
              <div className="text-xs font-mono text-emerald-400">chi-bot@project-id.iam.gserviceaccount.com</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs text-zinc-500">OAuth2 authenticated</span>
              </div>
            </div>
            {done && (
              <div className="text-xs text-zinc-500">
                Sync #{syncCount} · {DATA[source].rows.length} rows written · Last: {ts}
              </div>
            )}
            <button
              onClick={runSync}
              disabled={syncing}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold text-sm rounded-lg transition-colors"
            >
              {syncing ? "Syncing..." : done ? "🔄 Sync Again" : "🔄 Sync Now"}
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet preview */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
          <div className="flex gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500/60 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/60 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/60 inline-block" />
          </div>
          <span className="text-xs font-mono text-zinc-400 mx-auto">chi-automation-data — Google Sheets</span>
          {done && <span className="text-xs text-emerald-400">{syncCount > 1 ? `↑ Synced ×${syncCount}` : "✓ Synced"}</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            {/* Row numbers + column headers */}
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50">
                <th className="w-8 px-2 py-2 text-center text-zinc-600 font-normal border-r border-zinc-800"></th>
                {headers.map((h, i) => (
                  <th key={h} className={`px-3 py-2 text-left font-semibold text-zinc-400 border-r border-zinc-800/60 ${i === 0 ? "bg-zinc-800/30" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
              {/* Column letters */}
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="w-8 px-2 py-1 text-center text-zinc-700 font-mono text-[10px] border-r border-zinc-800">1</th>
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-1 text-left border-r border-zinc-800/60">
                    <span className="text-[10px] font-mono text-zinc-600">{String.fromCharCode(65 + i)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const isCurrent = activeRow === ri;
                const isSynced = synced[ri] !== undefined;
                return (
                  <tr
                    key={ri}
                    className={`border-b border-zinc-800/40 transition-all duration-300 ${
                      isCurrent ? "bg-emerald-500/15" : isSynced ? "bg-zinc-900" : "bg-zinc-950"
                    }`}
                  >
                    <td className="w-8 px-2 py-2 text-center text-zinc-600 font-mono text-[10px] border-r border-zinc-800">{ri + 2}</td>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-3 py-2 border-r border-zinc-800/40 transition-colors ${
                          isCurrent ? "text-emerald-300" : isSynced ? "text-zinc-200" : "text-zinc-700"
                        }`}
                      >
                        {ci === headers.length - 1 && isSynced ? ts : cell || ""}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!syncing && !done && (
        <p className="text-center text-xs text-zinc-600">Click <span className="text-emerald-400">Sync Now</span> to watch rows write into the spreadsheet in real time</p>
      )}
    </div>
  );
}
