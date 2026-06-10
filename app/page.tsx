"use client";

import { useState } from "react";
import Link from "next/link";
import {
  products,
  filterProducts,
  type FilterKey,
  FILTER_LABELS,
} from "@/data/products";

const ACCENT_BORDER: Record<string, string> = {
  cyan: "hover:border-cyan-500/60 group-hover:text-cyan-400",
  emerald: "hover:border-emerald-500/60 group-hover:text-emerald-400",
  amber: "hover:border-amber-500/60 group-hover:text-amber-400",
  violet: "hover:border-violet-500/60 group-hover:text-violet-400",
  blue: "hover:border-blue-500/60 group-hover:text-blue-400",
  orange: "hover:border-orange-500/60 group-hover:text-orange-400",
  red: "hover:border-red-500/60 group-hover:text-red-400",
};

const ACCENT_DOT: Record<string, string> = {
  cyan: "bg-cyan-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  violet: "bg-violet-400",
  blue: "bg-blue-400",
  orange: "bg-orange-400",
  red: "bg-red-400",
};

const ACCENT_TEXT: Record<string, string> = {
  cyan: "text-cyan-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  violet: "text-violet-400",
  blue: "text-blue-400",
  orange: "text-orange-400",
  red: "text-red-400",
};

const STATUS_BADGE: Record<string, string> = {
  live: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  beta: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  "coming-soon": "bg-zinc-800 text-zinc-500 border border-zinc-700",
};

const CATEGORY_LABEL: Record<string, string> = {
  automation: "Automation",
  "5g-oam": "5G OAM",
  nms: "NMS",
  devops: "DevOps",
  saas: "SaaS",
};

const FILTER_KEYS: FilterKey[] = [
  "all",
  "personal",
  "company",
  "automation",
  "5g-oam",
  "nms",
  "devops",
];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const visible = filterProducts(products, activeFilter);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono text-sm font-semibold text-zinc-50">
            chi<span className="text-cyan-400">.products</span>
          </span>
          <a
            href="mailto:chinguyen10022000@gmail.com"
            className="text-xs px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:border-cyan-500/60 hover:text-cyan-400 transition-all"
          >
            Contact
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900 text-xs text-zinc-500 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Available for freelance
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-50 mb-4 leading-tight">
            Products &amp; Tools
            <br />
            <span className="text-zinc-500">by Chi Nguyen</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mb-8">
            Automation scripts, 5G OAM demos, and engineering tools — built from
            real freelance projects and production work at TMA Solutions.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Python",
              "Playwright",
              "Telegram API",
              "C++",
              "NETCONF/YANG",
              "ZMQ",
              "Kafka",
            ].map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full border border-zinc-800 text-zinc-500 bg-zinc-900"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Grid ── */}
      <section className="pb-24 px-6 border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto pt-12">
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2 mb-10">
            {FILTER_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`text-xs px-4 py-2 rounded-full border transition-all ${
                  activeFilter === key
                    ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-400"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}
              >
                {FILTER_LABELS[key]}
                <span className="ml-1.5 text-zinc-600">
                  {filterProducts(products, key).length}
                </span>
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((product) => (
              <Link
                key={product.slug}
                href={`/products/${product.slug}`}
                className={`group relative p-5 rounded-xl border border-zinc-800 bg-zinc-900 transition-all ${ACCENT_BORDER[product.accent]} flex flex-col`}
              >
                {/* Category + source */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${ACCENT_DOT[product.accent]}`}
                    />
                    <span className="text-xs text-zinc-500">
                      {CATEGORY_LABEL[product.category] ?? product.category}
                    </span>
                  </div>
                  {product.source === "company" && (
                    <span className="text-xs px-2 py-0.5 rounded border border-zinc-700 text-zinc-500 bg-zinc-800/50">
                      TMA Solutions
                    </span>
                  )}
                </div>

                {/* Name + tagline */}
                <h3
                  className={`font-semibold text-zinc-50 mb-1.5 transition-colors ${ACCENT_TEXT[product.accent].replace("text-", "group-hover:text-")}`}
                >
                  {product.name}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed flex-1 mb-4">
                  {product.tagline}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {product.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded border border-zinc-800 text-zinc-600 bg-zinc-900"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[product.status]}`}
                  >
                    {product.status === "coming-soon"
                      ? "Coming soon"
                      : product.status}
                  </span>
                  <span
                    className={`text-xs transition-colors text-zinc-600 ${ACCENT_TEXT[product.accent].replace("text-", "group-hover:text-")}`}
                  >
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 border-t border-zinc-800/60 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-zinc-50 mb-3">
            Need a custom automation tool?
          </h2>
          <p className="text-zinc-500 mb-8 max-w-md mx-auto">
            I build bespoke scrapers, bots, and data pipelines on Upwork.
            Describe your use case and I&apos;ll quote within 24h.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://www.upwork.com/freelancers/~01c76b5dad02e4b8b2"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-cyan-500 text-zinc-950 font-semibold rounded-lg hover:bg-cyan-400 transition-colors text-sm"
            >
              Hire on Upwork ↗
            </a>
            <a
              href="mailto:chinguyen10022000@gmail.com"
              className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-500 hover:text-zinc-50 transition-all text-sm"
            >
              Send email
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-xs text-zinc-600">
            chi<span className="text-cyan-500/60">.products</span>
          </span>
          <span className="text-xs text-zinc-700">
            Chi Nguyen Quoc — Software Engineer & Automation Specialist
          </span>
        </div>
      </footer>
    </div>
  );
}
