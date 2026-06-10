"use client";
import { useState, useCallback } from "react";

const SAMPLE_PRODUCTS = [
  { title: "A Light in the Attic", price: 51.77, rating: 3, stock: true },
  { title: "Tipping the Velvet", price: 53.74, rating: 1, stock: true },
  { title: "Soumission", price: 50.1, rating: 1, stock: true },
  { title: "Sharp Objects", price: 47.82, rating: 4, stock: true },
  { title: "Sapiens: A Brief History", price: 54.23, rating: 5, stock: false },
  { title: "The Requiem Red", price: 22.65, rating: 1, stock: true },
  { title: "The Dirty Little Secrets", price: 33.34, rating: 4, stock: true },
  { title: "The Coming Woman", price: 17.93, rating: 3, stock: false },
  { title: "The Boys in the Boat", price: 22.6, rating: 4, stock: true },
  { title: "The Black Maria", price: 52.15, rating: 1, stock: true },
  { title: "Starving Hearts", price: 13.99, rating: 2, stock: true },
  { title: "Shakespeare's Sonnets", price: 20.66, rating: 4, stock: false },
];

type SortKey = "none" | "price-asc" | "price-desc" | "rating-asc" | "rating-desc";

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400 text-xs">
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

export default function EcommerceScraperDemo() {
  const [url, setUrl] = useState("books.toscrape.com/catalogue/page-1");
  const [rows, setRows] = useState<typeof SAMPLE_PRODUCTS>([]);
  const [progress, setProgress] = useState(0);
  const [scraping, setScraping] = useState(false);
  const [done, setDone] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "out">("all");
  const [sort, setSort] = useState<SortKey>("none");

  const runScrape = useCallback(() => {
    setRows([]);
    setProgress(0);
    setScraping(true);
    setDone(false);

    let i = 0;
    const interval = setInterval(() => {
      setProgress(Math.round(((i + 1) / SAMPLE_PRODUCTS.length) * 100));
      setRows((prev) => [...prev, SAMPLE_PRODUCTS[i]]);
      i++;
      if (i >= SAMPLE_PRODUCTS.length) {
        clearInterval(interval);
        setScraping(false);
        setDone(true);
      }
    }, 180);
  }, []);

  const downloadCSV = () => {
    const header = "Title,Price,Rating,In Stock\n";
    const body = rows
      .map((r) => `"${r.title}",${r.price},${r.rating},${r.stock ? "Yes" : "No"}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "scraped_products.csv";
    a.click();
  };

  const filtered = rows
    .filter((r) => (ratingFilter === 0 ? true : r.rating >= ratingFilter))
    .filter((r) => stockFilter === "all" ? true : stockFilter === "in" ? r.stock : !r.stock)
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating-asc") return a.rating - b.rating;
      if (sort === "rating-desc") return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="space-y-4">
      {/* URL bar + scrape */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <label className="text-xs text-zinc-500 mb-2 block">Target URL</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
            <span className="text-xs text-zinc-600">https://</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-200 outline-none font-mono"
            />
          </div>
          <button
            onClick={runScrape}
            disabled={scraping}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold text-sm rounded-lg transition-colors shrink-0"
          >
            {scraping ? "Scraping..." : done ? "Re-scrape" : "Scrape ↗"}
          </button>
        </div>
        {scraping || done ? (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>{scraping ? `Fetching page... (${rows.length}/${SAMPLE_PRODUCTS.length})` : `✓ Done — ${rows.length} products`}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Filters + sort */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Min rating:</span>
            {[0, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => setRatingFilter(r)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  ratingFilter === r
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                {r === 0 ? "All" : "★".repeat(r) + "+"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Stock:</span>
            {(["all", "in", "out"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStockFilter(s)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  stockFilter === s
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                {s === "all" ? "All" : s === "in" ? "In Stock" : "Out"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-300 outline-none"
            >
              <option value="none">Default</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="rating-desc">Rating ↓</option>
              <option value="rating-asc">Rating ↑</option>
            </select>
          </div>
          {done && (
            <button
              onClick={downloadCSV}
              className="ml-auto text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              📥 Export CSV ({rows.length})
            </button>
          )}
        </div>
      )}

      {/* Results table */}
      {filtered.length > 0 && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-4 py-2.5 text-left text-xs text-zinc-500 font-medium">Title</th>
                <th className="px-4 py-2.5 text-right text-xs text-zinc-500 font-medium">Price</th>
                <th className="px-4 py-2.5 text-center text-xs text-zinc-500 font-medium">Rating</th>
                <th className="px-4 py-2.5 text-center text-xs text-zinc-500 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-800/60 bg-zinc-900 hover:bg-zinc-800/40 transition-colors animate-in fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="px-4 py-2.5 text-zinc-200 text-xs max-w-[200px] truncate">{r.title}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-400 text-xs">£{r.price.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-center"><Stars n={r.rating} /></td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.stock ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-500 bg-zinc-800"}`}>
                      {r.stock ? "In Stock" : "Out"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && rows.length > 0 && (
            <div className="p-8 text-center text-zinc-500 text-sm">No products match the current filters.</div>
          )}
        </div>
      )}

      {!scraping && !done && (
        <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center text-zinc-600 text-sm">
          Click <span className="text-emerald-400 font-medium">Scrape ↗</span> to fetch product data
        </div>
      )}
    </div>
  );
}
