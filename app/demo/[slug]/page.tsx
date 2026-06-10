import { notFound } from "next/navigation";
import Link from "next/link";
import { products } from "@/data/products";
import type { Metadata } from "next";
import DemoRenderer from "./DemoRenderer";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return products.filter((p) => p.demoUrl).map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const product = products.find((p) => p.slug === params.slug);
  if (!product) return {};
  return {
    title: `${product.name} — Live Demo`,
    description: `Interactive demo: ${product.tagline}`,
  };
}

const ACCENT_BADGE: Record<string, string> = {
  cyan: "border-cyan-500/40 text-cyan-400 bg-cyan-500/5",
  emerald: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
  amber: "border-amber-500/40 text-amber-400 bg-amber-500/5",
  violet: "border-violet-500/40 text-violet-400 bg-violet-500/5",
  blue: "border-blue-500/40 text-blue-400 bg-blue-500/5",
  orange: "border-orange-500/40 text-orange-400 bg-orange-500/5",
  red: "border-red-500/40 text-red-400 bg-red-500/5",
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

const CATEGORY_LABEL: Record<string, string> = {
  automation: "Automation",
  "5g-oam": "5G OAM",
  nms: "NMS",
  devops: "DevOps",
};

export default function DemoPage({ params }: Props) {
  const product = products.find((p) => p.slug === params.slug);
  if (!product || !product.demoUrl) notFound();

  const badge = ACCENT_BADGE[product.accent] ?? ACCENT_BADGE.cyan;
  const dot = ACCENT_DOT[product.accent] ?? ACCENT_DOT.cyan;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm shrink-0"
            >
              ←
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
              <span className="text-sm font-semibold text-zinc-100 truncate">{product.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${badge}`}>
                Live Demo
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-600 hidden sm:block">{CATEGORY_LABEL[product.category] ?? product.category}</span>
            <Link
              href="/"
              className="font-mono text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              chi<span className="text-cyan-500/60">.products</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Demo header */}
      <div className="border-b border-zinc-800/60 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <p className="text-sm text-zinc-400 max-w-2xl">{product.tagline}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {product.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded border border-zinc-800 text-zinc-600 bg-zinc-900">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Demo area */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <DemoRenderer slug={params.slug} />
      </main>

      {/* Footer CTA */}
      <div className="border-t border-zinc-800/60 mt-4">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-zinc-200">
              {product.source === "personal" ? "Want this for your project?" : "Interested in this architecture?"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {product.source === "personal"
                ? "I can build a custom version tailored to your exact requirements."
                : "This demo reflects real production work at TMA Solutions."}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {product.source === "personal" && (
              <a
                href="https://www.upwork.com/freelancers/~01c76b5dad02e4b8b2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-lg transition-colors"
              >
                Hire on Upwork ↗
              </a>
            )}
            <a
              href="mailto:chinguyen10022000@gmail.com"
              className="text-xs px-4 py-2 border border-zinc-700 text-zinc-300 hover:border-zinc-500 rounded-lg transition-colors"
            >
              Contact
            </a>
            <Link
              href={`/products/${product.slug}`}
              className="text-xs px-4 py-2 border border-zinc-700 text-zinc-400 hover:border-zinc-600 rounded-lg transition-colors"
            >
              Product Page →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
