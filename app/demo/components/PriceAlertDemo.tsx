"use client";
import { useState, useEffect, useRef } from "react";

const CRYPTOS = [
  { symbol: "BTC", name: "Bitcoin", base: 67420, color: "amber" },
  { symbol: "ETH", name: "Ethereum", base: 3840, color: "blue" },
  { symbol: "SOL", name: "Solana", base: 178, color: "violet" },
];

type CryptoState = { symbol: string; name: string; base: number; color: string; price: number; change: number; hist: number[] };

const AI_ANALYSES: Record<string, string[]> = {
  BTC: [
    "BTC is consolidating near key resistance at $68K — momentum indicators suggest a breakout attempt within 4–8 hours. Accumulation volume supports a bullish bias.",
    "Short-term bearish pressure from macro sentiment, but on-chain data shows whale accumulation. A retest of $65K support before continuation higher is likely.",
  ],
  ETH: [
    "ETH/BTC ratio is strengthening; options flow shows large call buying at $4,000 strike. Staking yields remain attractive — dip buyers are active.",
    "ETH is forming a higher-low structure on the 4H chart. Gas fees trending down suggests reduced network congestion; a move to $4,200 is plausible this week.",
  ],
  SOL: [
    "SOL DeFi TVL hit a new high — strong ecosystem growth signal. Price action is coiling below $185; a catalyst event could trigger a sharp move higher.",
    "SOL is outperforming the market YTD. Current price action shows a bull flag; target $195 on a close above $182 with volume confirmation.",
  ],
};

export default function PriceAlertDemo() {
  const [prices, setPrices] = useState<CryptoState[]>(
    CRYPTOS.map((c) => ({ ...c, price: c.base, change: 0, hist: [c.base] }))
  );
  const [selected, setSelected] = useState("BTC");
  const [target, setTarget] = useState("70000");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [alertActive, setAlertActive] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const intRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intRef.current = setInterval(() => {
      setPrices((prev) =>
        prev.map((c) => {
          const delta = (Math.random() - 0.48) * c.base * 0.003;
          const newPrice = Math.max(c.base * 0.7, c.price + delta);
          return { ...c, price: newPrice, change: delta, hist: [...c.hist.slice(-19), newPrice] };
        })
      );
    }, 800);
    return () => { if (intRef.current) clearInterval(intRef.current); };
  }, []);

  useEffect(() => {
    if (!alertActive || triggered) return;
    const crypto = prices.find((p) => p.symbol === selected);
    if (!crypto) return;
    const t = parseFloat(target);
    if (isNaN(t)) return;
    const hit = direction === "above" ? crypto.price >= t : crypto.price <= t;
    if (hit) {
      setTriggered(true);
      setAlertActive(false);
      const msg = `🔔 Alert triggered!\n${crypto.symbol}: $${crypto.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nTarget: ${direction} $${Number(t).toLocaleString()}\n\n📊 24h change: ${crypto.change >= 0 ? "+" : ""}${(crypto.change / crypto.base * 100).toFixed(3)}%`;
      setNotification(msg);
      setTimeout(() => setNotification(null), 8000);
    }
  }, [prices, alertActive, triggered, selected, target, direction]);

  const crypto = prices.find((p) => p.symbol === selected)!;

  const sparkPath = (hist: number[]) => {
    if (hist.length < 2) return "";
    const min = Math.min(...hist);
    const max = Math.max(...hist);
    const range = max - min || 1;
    const w = 80, h = 28;
    return hist
      .map((v, i) => {
        const x = (i / (hist.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setAnalysis(null);
    setTimeout(() => {
      const lines = AI_ANALYSES[selected] ?? AI_ANALYSES.BTC;
      setAnalysis(lines[Math.floor(Math.random() * lines.length)]);
      setAnalyzing(false);
    }, 1400);
  };

  return (
    <div className="space-y-4">
      {/* Tickers */}
      <div className="grid grid-cols-3 gap-3">
        {prices.map((c) => (
          <button
            key={c.symbol}
            onClick={() => { setSelected(c.symbol); setTriggered(false); setAnalysis(null); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selected === c.symbol
                ? "border-cyan-500/50 bg-zinc-800"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-xs text-zinc-500">{c.name}</div>
                <div className="font-mono font-bold text-base text-zinc-50 mt-0.5">
                  ${c.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-xs mt-0.5 ${c.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {c.change >= 0 ? "▲" : "▼"} {Math.abs((c.change / c.base) * 100).toFixed(3)}%
                </div>
              </div>
              <svg width="80" height="28" className="mt-1 shrink-0">
                <path d={sparkPath(c.hist)} fill="none" stroke={c.change >= 0 ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alert config */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Configure Alert</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Asset</label>
                <select
                  value={selected}
                  onChange={(e) => { setSelected(e.target.value); setTriggered(false); setAnalysis(null); }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
                >
                  {CRYPTOS.map((c) => (
                    <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Direction</label>
                <select
                  value={direction}
                  onChange={(e) => { setDirection(e.target.value as "above" | "below"); setTriggered(false); }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
                >
                  <option value="above">Above ↑</option>
                  <option value="below">Below ↓</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Target Price (USD)</label>
              <input
                type="number"
                value={target}
                onChange={(e) => { setTarget(e.target.value); setTriggered(false); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono outline-none"
              />
              <p className="text-xs text-zinc-600 mt-1">
                Current: ${crypto.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {" · "}
                {direction === "above"
                  ? `$${(parseFloat(target) - crypto.price).toLocaleString("en-US", { maximumFractionDigits: 0 })} away`
                  : `$${(crypto.price - parseFloat(target)).toLocaleString("en-US", { maximumFractionDigits: 0 })} away`}
              </p>
            </div>
            <button
              onClick={() => { setAlertActive(true); setTriggered(false); setNotification(null); }}
              disabled={alertActive}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-semibold text-sm rounded-lg transition-colors"
            >
              {alertActive ? "⏳ Monitoring..." : triggered ? "✓ Alert Fired — Set New" : "Set Alert"}
            </button>
            {alertActive && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Polling CoinGecko every 4s
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">AI Market Analysis</h3>
          <p className="text-xs text-zinc-600 mb-4">Powered by Gemini 1.5 Flash</p>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-50 disabled:text-zinc-600 text-sm rounded-lg transition-colors mb-4"
          >
            {analyzing ? "Analyzing..." : "Analyze " + selected}
          </button>
          {analyzing && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`h-3 bg-zinc-800 rounded animate-pulse`} style={{ width: `${85 - i * 10}%` }} />
              ))}
            </div>
          )}
          {analysis && (
            <p className="text-sm text-zinc-300 leading-relaxed border-l-2 border-cyan-500/50 pl-3">
              {analysis}
            </p>
          )}
          {!analysis && !analyzing && (
            <p className="text-xs text-zinc-600 italic">Click to get a 2-sentence AI analysis of {selected} price action.</p>
          )}
        </div>
      </div>

      {/* Telegram notification */}
      {notification && (
        <div className="p-4 rounded-xl border border-blue-500/40 bg-blue-500/10 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✈️</div>
            <div>
              <div className="text-xs font-semibold text-blue-400 mb-1">Telegram — @PriceAlertBot</div>
              <pre className="text-sm text-zinc-200 whitespace-pre-wrap font-mono">{notification}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
