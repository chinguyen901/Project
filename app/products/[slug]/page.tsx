import { notFound } from "next/navigation";
import Link from "next/link";
import { products } from "@/data/products";
import type { Metadata } from "next";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const product = products.find((p) => p.slug === params.slug);
  if (!product) return {};
  return {
    title: `${product.name} — Chi Nguyen`,
    description: product.description,
  };
}

const ACCENT_BG: Record<string, string> = {
  cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
  emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  violet: "bg-violet-500/10 border-violet-500/30 text-violet-400",
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  orange: "bg-orange-500/10 border-orange-500/30 text-orange-400",
  red: "bg-red-500/10 border-red-500/30 text-red-400",
};

const ACCENT_GLOW: Record<string, string> = {
  cyan: "from-cyan-500/5",
  emerald: "from-emerald-500/5",
  amber: "from-amber-500/5",
  violet: "from-violet-500/5",
  blue: "from-blue-500/5",
  orange: "from-orange-500/5",
  red: "from-red-500/5",
};

const ACCENT_BORDER: Record<string, string> = {
  cyan: "border-cyan-500/30",
  emerald: "border-emerald-500/30",
  amber: "border-amber-500/30",
  violet: "border-violet-500/30",
  blue: "border-blue-500/30",
  orange: "border-orange-500/30",
  red: "border-red-500/30",
};

const ACCENT_CTA: Record<string, string> = {
  cyan: "bg-cyan-500 hover:bg-cyan-400 text-zinc-950",
  emerald: "bg-emerald-500 hover:bg-emerald-400 text-zinc-950",
  amber: "bg-amber-500 hover:bg-amber-400 text-zinc-950",
  violet: "bg-violet-500 hover:bg-violet-400 text-white",
  blue: "bg-blue-500 hover:bg-blue-400 text-white",
  orange: "bg-orange-500 hover:bg-orange-400 text-white",
  red: "bg-red-500 hover:bg-red-400 text-white",
};

const STATUS_BADGE: Record<string, string> = {
  live: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  beta: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  "coming-soon": "bg-zinc-800 text-zinc-500 border border-zinc-700",
};

const CATEGORY_LABEL: Record<string, string> = {
  automation: "Automation Tool",
  "5g-oam": "5G OAM",
  nms: "Network Management",
  devops: "DevOps",
  saas: "SaaS",
};

export default function ProductPage({ params }: Props) {
  const product = products.find((p) => p.slug === params.slug);
  if (!product) notFound();

  const accentBg = ACCENT_BG[product.accent] ?? ACCENT_BG.cyan;
  const accentGlow = ACCENT_GLOW[product.accent] ?? ACCENT_GLOW.cyan;
  const accentBorder = ACCENT_BORDER[product.accent] ?? ACCENT_BORDER.cyan;
  const accentCta = ACCENT_CTA[product.accent] ?? ACCENT_CTA.cyan;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-sm font-semibold text-zinc-50 hover:text-cyan-400 transition-colors"
          >
            chi<span className="text-cyan-400">.products</span>
          </Link>
          <a
            href="mailto:chinguyen10022000@gmail.com"
            className="text-xs px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:border-cyan-500/60 hover:text-cyan-400 transition-all"
          >
            Contact
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className={`pt-32 pb-20 px-6 bg-gradient-to-b ${accentGlow} to-transparent`}
      >
        <div className="max-w-5xl mx-auto">
          {/* Back */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
          >
            ← All Products
          </Link>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span
              className={`text-xs px-3 py-1 rounded-full border ${accentBg}`}
            >
              {CATEGORY_LABEL[product.category] ?? product.category}
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full ${STATUS_BADGE[product.status]}`}
            >
              {product.status === "coming-soon" ? "Coming soon" : product.status}
            </span>
            {product.source === "company" && (
              <span className="text-xs px-3 py-1 rounded-full border border-zinc-700 text-zinc-500 bg-zinc-800/50">
                {product.company}
              </span>
            )}
          </div>

          {/* Title + tagline */}
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-50 mb-3">
            {product.name}
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mb-8">
            {product.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            {product.demoUrl && (
              <Link
                href={product.demoUrl}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${accentCta}`}
              >
                Try Live Demo →
              </Link>
            )}
            <a
              href="mailto:chinguyen10022000@gmail.com"
              className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-500 hover:text-zinc-50 transition-all text-sm"
            >
              Contact
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-zinc-50 mb-2">Features</h2>
          <p className="text-zinc-500 text-sm mb-10">What this tool does</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {product.features.map((f) => (
              <div
                key={f.title}
                className={`p-5 rounded-xl border border-zinc-800 bg-zinc-900 hover:${accentBorder} transition-colors`}
              >
                <span className="text-2xl block mb-3">{f.icon}</span>
                <h3 className="font-semibold text-zinc-100 mb-2 text-sm">
                  {f.title}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      {product.demoUrl && (
        <section className="py-20 px-6 border-t border-zinc-800/60">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-zinc-50 mb-2">Live Demo</h2>
            <p className="text-zinc-500 text-sm mb-8">
              Interactive demo — runs entirely in your browser, no install required
            </p>
            <div
              className={`rounded-xl border ${accentBorder} bg-zinc-900/60 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  <span className="text-xs text-emerald-400 font-medium">Interactive — no backend required</span>
                </div>
                <p className="text-zinc-300 font-medium mb-1">{product.name}</p>
                <p className="text-zinc-500 text-sm max-w-md">
                  {product.features[0]?.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {product.features.map((f) => (
                    <span key={f.title} className="text-xs px-2 py-0.5 rounded border border-zinc-800 text-zinc-600 bg-zinc-900">
                      {f.icon} {f.title}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={product.demoUrl}
                className={`shrink-0 px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${accentCta}`}
              >
                Open Demo →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Tech Stack ── */}
      <section className="py-20 px-6 border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-zinc-50 mb-2">Tech Stack</h2>
          <p className="text-zinc-500 text-sm mb-8">Tools &amp; technologies used</p>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm px-4 py-2 rounded-lg border border-zinc-800 text-zinc-400 bg-zinc-900"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing / CTA ── */}
      <section className="py-20 px-6 border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto">
          <div
            className={`rounded-xl border ${accentBorder} bg-zinc-900/60 p-8`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded border ${accentBg}`}>
                    {product.pricing.label}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-50 mb-1">
                  {product.source === "personal"
                    ? "Want this for your project?"
                    : "Interested in this tech?"}
                </h3>
                <p className="text-zinc-500 text-sm max-w-md">
                  {product.source === "personal"
                    ? "I can build a custom version tailored to your specific data sources, platforms, and delivery format."
                    : "This demo reflects real production work. Happy to discuss the architecture or similar implementations."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                {product.source === "personal" && (
                  <a
                    href="https://www.upwork.com/freelancers/~01c76b5dad02e4b8b2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${accentCta}`}
                  >
                    Hire on Upwork ↗
                  </a>
                )}
                <a
                  href="mailto:chinguyen10022000@gmail.com"
                  className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-500 hover:text-zinc-50 transition-all text-sm"
                >
                  Send email
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="font-mono text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ← chi<span className="text-cyan-500/60">.products</span>
          </Link>
          <span className="text-xs text-zinc-700">
            Chi Nguyen Quoc — Software Engineer &amp; Automation Specialist
          </span>
        </div>
      </footer>
    </div>
  );
}
