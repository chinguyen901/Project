"use client";
import { useState, useRef, useEffect } from "react";

type Message = {
  id: number;
  author: "user" | "bot";
  content: string;
  embed?: { title: string; color: string; fields: { name: string; value: string }[]; footer?: string };
};

const INITIAL: Message[] = [
  {
    id: 0,
    author: "bot",
    content: "👋 PriceBot is online! Try `/price`, `/alert`, `/status`, `/scrape`, or `/help`.",
  },
];

const BOT_RESPONSES: Record<string, (args: string) => Message["embed"] | string> = {
  "/price": (args) => {
    const sym = (args || "BTC").toUpperCase().trim();
    const prices: Record<string, { price: string; change: string; cap: string }> = {
      BTC: { price: "$67,420.30", change: "+2.34%", cap: "$1.32T" },
      ETH: { price: "$3,840.10", change: "+1.87%", cap: "$461B" },
      SOL: { price: "$178.55", change: "-0.42%", cap: "$80B" },
    };
    const data = prices[sym] ?? { price: "N/A", change: "—", cap: "—" };
    return {
      title: `📊 ${sym} — Live Price`,
      color: "border-l-cyan-400",
      fields: [
        { name: "Price", value: data.price },
        { name: "24h Change", value: data.change },
        { name: "Market Cap", value: data.cap },
        { name: "Source", value: "CoinGecko API" },
      ],
      footer: "PriceBot · Updated just now",
    };
  },
  "/alert": (args) => {
    const parts = args.trim().split(" ");
    const sym = parts[0]?.toUpperCase() || "BTC";
    const target = parts[1] || "70000";
    const dir = parts[2] || "above";
    return {
      title: `🔔 Alert Set`,
      color: "border-l-amber-400",
      fields: [
        { name: "Asset", value: sym },
        { name: "Target", value: `$${Number(target).toLocaleString()}` },
        { name: "Direction", value: dir },
        { name: "Delivery", value: "This channel + DM" },
      ],
      footer: "Alert will fire when price crosses target",
    };
  },
  "/status": () => ({
    title: "⚙️ Bot Status",
    color: "border-l-emerald-400",
    fields: [
      { name: "Uptime", value: "14d 6h 32m" },
      { name: "Alerts Active", value: "7" },
      { name: "Requests Today", value: "1,204" },
      { name: "API Latency", value: "38ms" },
    ],
    footer: "All systems operational",
  }),
  "/scrape": (args) => ({
    title: "🕷️ Scrape Result",
    color: "border-l-violet-400",
    fields: [
      { name: "URL", value: args || "books.toscrape.com" },
      { name: "Products Found", value: "48" },
      { name: "Avg. Price", value: "£34.20" },
      { name: "Export", value: "scraped_data.csv attached" },
    ],
    footer: "Scraped with BeautifulSoup · 0.8s",
  }),
  "/help": () => ({
    title: "📋 PriceBot Commands",
    color: "border-l-blue-400",
    fields: [
      { name: "/price [sym]", value: "Get live crypto price" },
      { name: "/alert [sym] [target] [above|below]", value: "Set a price alert" },
      { name: "/status", value: "Check bot status" },
      { name: "/scrape [url]", value: "Scrape a product page" },
      { name: "/help", value: "Show this help" },
    ],
    footer: "PriceBot v2.1 — slash commands enabled",
  }),
};

export default function DiscordBotDemo() {
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const userMsg: Message = { id: nextId.current++, author: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const cmd = text.split(" ")[0].toLowerCase();
    const args = text.slice(cmd.length).trim();
    const handler = BOT_RESPONSES[cmd];

    if (!handler) {
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, author: "bot", content: `Unknown command. Try \`/help\` to see available commands.` },
      ]);
      return;
    }

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const result = handler(args);
      if (typeof result === "string") {
        setMessages((prev) => [...prev, { id: nextId.current++, author: "bot", content: result }]);
      } else {
        setMessages((prev) => [...prev, { id: nextId.current++, author: "bot", content: "", embed: result }]);
      }
    }, 700 + Math.random() * 400);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden flex h-[520px]">
      {/* Sidebar */}
      <div className="w-48 bg-zinc-900/80 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="px-3 py-3 border-b border-zinc-800">
          <div className="text-xs font-bold text-zinc-300">PriceBot Server</div>
          <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> online
          </div>
        </div>
        <div className="px-2 py-2 text-xs text-zinc-600 uppercase font-semibold tracking-wider">Text Channels</div>
        {["# general", "# price-alerts", "# bot-commands"].map((ch) => (
          <div
            key={ch}
            className={`mx-1 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
              ch === "# bot-commands" ? "bg-zinc-700/50 text-zinc-200" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            {ch}
          </div>
        ))}
        <div className="mt-auto px-3 py-3 border-t border-zinc-800 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white font-bold">C</div>
          <div>
            <div className="text-xs text-zinc-200 leading-none">chi_dev</div>
            <div className="text-[10px] text-zinc-500">#0042</div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-zinc-950">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <span className="text-zinc-400 font-medium text-sm"># bot-commands</span>
          <span className="text-xs text-zinc-600 ml-2">Try /price BTC, /alert ETH 4000 above, /help</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                msg.author === "bot" ? "bg-violet-600" : "bg-zinc-700"
              }`}>
                {msg.author === "bot" ? "🤖" : "C"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className={`text-xs font-semibold ${msg.author === "bot" ? "text-violet-400" : "text-zinc-300"}`}>
                    {msg.author === "bot" ? "PriceBot" : "chi_dev"}
                  </span>
                  <span className="text-[10px] text-zinc-600">Today at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {msg.content && <p className="text-sm text-zinc-200 leading-relaxed">{msg.content}</p>}
                {msg.embed && (
                  <div className={`mt-1 pl-3 border-l-4 ${msg.embed.color} bg-zinc-900/60 rounded-r-lg py-2 pr-3`}>
                    <div className="text-sm font-semibold text-zinc-100 mb-2">{msg.embed.title}</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {msg.embed.fields.map((f) => (
                        <div key={f.name}>
                          <div className="text-xs font-semibold text-zinc-400">{f.name}</div>
                          <div className="text-xs text-zinc-200">{f.value}</div>
                        </div>
                      ))}
                    </div>
                    {msg.embed.footer && (
                      <div className="text-[10px] text-zinc-600 mt-2 pt-2 border-t border-zinc-800">{msg.embed.footer}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm">🤖</div>
              <div className="text-xs text-zinc-500 italic flex items-center gap-1.5">
                PriceBot is typing
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce inline-block" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-zinc-800">
          <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Message #bot-commands — try /help"
              className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 transition-colors"
            >
              ↵
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
