export type Feature = {
  icon: string;
  title: string;
  description: string;
};

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  source: "personal" | "company";
  category: "automation" | "5g-oam" | "nms" | "devops";
  status: "live" | "beta" | "coming-soon";
  company?: string;
  features: Feature[];
  demoUrl?: string;
  pricing: {
    type: "free" | "contact";
    label: string;
  };
  tags: string[];
  accent: string;
};

export const products: Product[] = [
  // ── PERSONAL — Automation Tools ──────────────────────────────────────
  {
    slug: "price-alert-bot",
    name: "Crypto Price Alert Bot",
    tagline: "Real-time crypto monitoring with Telegram alerts",
    description:
      "A Python bot that monitors BTC/ETH prices 24/7 and sends instant Telegram alerts when your target is hit. Live data from CoinGecko with AI-powered market analysis.",
    source: "personal",
    category: "automation",
    status: "live",
    features: [
      {
        icon: "📊",
        title: "Live Price Tracking",
        description: "Polls CoinGecko every 4s — current price, 24h change, market cap, volume.",
      },
      {
        icon: "🔔",
        title: "Smart Alerts",
        description: "Set target price + direction (above/below). Bot fires the moment price crosses.",
      },
      {
        icon: "🤖",
        title: "AI Market Analysis",
        description: "Gemini 1.5 Flash analyzes price action and delivers a 2-sentence verdict on demand.",
      },
      {
        icon: "💬",
        title: "Telegram Integration",
        description: "All alerts land in your Telegram chat. Identical to what real clients receive.",
      },
    ],
    demoUrl: `/demo/price-alert-bot`,
    pricing: { type: "contact", label: "Contact for pricing" },
    tags: ["Python", "Telegram API", "CoinGecko", "asyncio", "aiohttp"],
    accent: "cyan",
  },
  {
    slug: "ecommerce-scraper",
    name: "E-commerce Data Scraper",
    tagline: "Scrape product data at scale, export to CSV instantly",
    description:
      "Scrapes product titles, prices, ratings, and availability from e-commerce sites using Python + BeautifulSoup. Built-in filtering, sorting, and one-click CSV export.",
    source: "personal",
    category: "automation",
    status: "live",
    features: [
      {
        icon: "🕷️",
        title: "Real Scraping Engine",
        description: "Live fetch via cheerio — not mocked. Handles pagination, rate limiting, and User-Agent rotation.",
      },
      {
        icon: "📦",
        title: "Structured Output",
        description: "Extracts title, price, rating, and stock status into a clean product grid.",
      },
      {
        icon: "🔍",
        title: "Filter & Sort",
        description: "Client-side filter by rating/availability + 4 sort modes — no re-scrape needed.",
      },
      {
        icon: "📥",
        title: "CSV Export",
        description: "One click downloads all scraped data as a CSV file — zero backend required.",
      },
    ],
    demoUrl: `/demo/ecommerce-scraper`,
    pricing: { type: "contact", label: "Contact for pricing" },
    tags: ["Python", "BeautifulSoup", "requests", "Pandas", "cheerio"],
    accent: "emerald",
  },
  {
    slug: "job-monitor",
    name: "Job Board Monitor",
    tagline: "Auto-scan LinkedIn, Indeed & Upwork for matching jobs",
    description:
      "Monitors multiple job boards simultaneously and sends Telegram alerts for matching postings. Filters by keyword, job type, and source platform.",
    source: "personal",
    category: "automation",
    status: "live",
    features: [
      {
        icon: "🔍",
        title: "Multi-source Scan",
        description: "Scans LinkedIn, Indeed, and Upwork in parallel — one run, all results.",
      },
      {
        icon: "🎯",
        title: "Smart Filtering",
        description: "Filter by keywords, job type (Remote/Hybrid/On-site), and source platform.",
      },
      {
        icon: "⏰",
        title: "Auto Schedule",
        description: "Runs every 30 minutes automatically. Countdown timer shows time to next scan.",
      },
      {
        icon: "📱",
        title: "Telegram Alerts",
        description: "Instant notification when a matching job is found — title, company, and link.",
      },
    ],
    demoUrl: `/demo/job-monitor`,
    pricing: { type: "contact", label: "Contact for pricing" },
    tags: ["Python", "Selenium", "Playwright", "Telegram API", "schedule"],
    accent: "amber",
  },
  {
    slug: "chrome-automator",
    name: "Chrome Extension Automator",
    tagline: "Browser automation without writing a single line of Selenium",
    description:
      "A Chrome extension that automates repetitive web workflows — form filling, data extraction, batch processing. Built for non-technical teams who need automation fast.",
    source: "personal",
    category: "automation",
    status: "live",
    features: [
      {
        icon: "⚡",
        title: "Workflow Presets",
        description: "3 ready-made workflows: Vendor Order Form, Competitor Price Check, Lead Form Fill.",
      },
      {
        icon: "📋",
        title: "Batch Processing",
        description: "Run a workflow across multiple records at once — queue + real-time status table.",
      },
      {
        icon: "📊",
        title: "Time Savings",
        description: "Visual comparison: manual time vs extension time. Shows ROI immediately.",
      },
      {
        icon: "🔌",
        title: "No-code Setup",
        description: "Configure selectors via UI. No Selenium, no Python install required.",
      },
    ],
    demoUrl: `/demo/chrome-automator`,
    pricing: { type: "contact", label: "Contact for pricing" },
    tags: ["Chrome Extension", "JavaScript", "Manifest V3", "content scripts"],
    accent: "orange",
  },
  {
    slug: "discord-bot",
    name: "Discord Automation Bot",
    tagline: "Slash commands + channel monitoring for your Discord server",
    description:
      "A feature-rich Discord bot with slash commands for crypto prices, scraping, and alerts. Channel monitor mode detects keywords and auto-replies with rich embeds.",
    source: "personal",
    category: "automation",
    status: "live",
    features: [
      {
        icon: "🤖",
        title: "Slash Commands",
        description: "5 built-in commands: /price, /alert, /status, /scrape, /help — with rich embed responses.",
      },
      {
        icon: "👁️",
        title: "Channel Monitor",
        description: "Watches any channel for keywords and auto-replies when a match is detected.",
      },
      {
        icon: "💎",
        title: "Rich Embeds",
        description: "Formatted responses with colored borders, field grids, and bot badge — not plain text.",
      },
      {
        icon: "⚙️",
        title: "Fully Customizable",
        description: "Add your own commands and keyword triggers without touching core bot logic.",
      },
    ],
    demoUrl: `/demo/discord-bot`,
    pricing: { type: "contact", label: "Contact for pricing" },
    tags: ["Python", "discord.py", "slash commands", "embeds"],
    accent: "violet",
  },
  {
    slug: "email-automator",
    name: "Email Inbox Automator",
    tagline: "Auto-reply, forward, and archive emails with rule-based logic",
    description:
      "Processes your inbox automatically using configurable rules. Each email is matched against conditions (subject, sender, body) and gets auto-replied, forwarded, archived, or flagged.",
    source: "personal",
    category: "automation",
    status: "live",
    features: [
      {
        icon: "📧",
        title: "Rule Engine",
        description: "Define conditions (contains/equals/starts_with) on subject, from, or body — first match wins.",
      },
      {
        icon: "⚡",
        title: "4 Actions",
        description: "Auto-reply, forward, archive, or mark as spam/priority — per rule.",
      },
      {
        icon: "📝",
        title: "Reply Templates",
        description: "Pre-built templates for common responses. Customizable per use case.",
      },
      {
        icon: "📊",
        title: "Processing Stats",
        description: "Live stats: emails processed, auto-replied, forwarded, archived in real time.",
      },
    ],
    demoUrl: `/demo/email-automator`,
    pricing: { type: "contact", label: "Contact for pricing" },
    tags: ["Python", "imaplib", "smtplib", "Gmail API", "rule engine"],
    accent: "blue",
  },
  {
    slug: "google-sheets-sync",
    name: "Google Sheets Auto-Sync",
    tagline: "Push scraped data into Google Sheets automatically",
    description:
      "Connects any data source (products, crypto, job listings) to Google Sheets via the gspread API. Runs on a schedule and updates your spreadsheet without any manual work.",
    source: "personal",
    category: "automation",
    status: "live",
    features: [
      {
        icon: "🔄",
        title: "Scheduled Sync",
        description: "Set an interval (15min/1h/daily) and forget it. Data always stays fresh.",
      },
      {
        icon: "📊",
        title: "Multiple Sources",
        description: "Works with product scrapers, crypto APIs, job monitors — any structured data.",
      },
      {
        icon: "⚡",
        title: "Row-by-row Live Write",
        description: "Watch rows appear in real time with cyan highlight as each write completes.",
      },
      {
        icon: "🔑",
        title: "OAuth2 Service Account",
        description: "Secure setup using Google service account — no user login required.",
      },
    ],
    demoUrl: `/demo/google-sheets-sync`,
    pricing: { type: "contact", label: "Contact for pricing" },
    tags: ["Python", "gspread", "google-auth", "OAuth2", "Google Sheets API"],
    accent: "emerald",
  },
  {
    slug: "report-generator",
    name: "Automated Report Generator",
    tagline: "HTML/PDF reports delivered to your inbox on schedule",
    description:
      "Collects data from multiple sources, aggregates it, builds charts, and emails you a formatted HTML/PDF report. Fully automated — set it and never manually compile data again.",
    source: "personal",
    category: "automation",
    status: "live",
    features: [
      {
        icon: "📈",
        title: "Animated Charts",
        description: "Animated bar and line charts built from your data — SVG-based, no library needed.",
      },
      {
        icon: "📄",
        title: "HTML + PDF Output",
        description: "Generate HTML preview and/or PDF file — your choice per report run.",
      },
      {
        icon: "📬",
        title: "Email Delivery",
        description: "Attach report and send to any email address on a recurring schedule.",
      },
      {
        icon: "🔧",
        title: "Multi-source",
        description: "Aggregate from scraper output, APIs, or CSV files into a single polished report.",
      },
    ],
    demoUrl: `/demo/report-generator`,
    pricing: { type: "contact", label: "Contact for pricing" },
    tags: ["Python", "Pandas", "Jinja2", "smtplib", "schedule"],
    accent: "amber",
  },

  // ── COMPANY — TMA Solutions ───────────────────────────────────────────
  {
    slug: "cm-flow",
    name: "CM Flow Visualizer",
    tagline: "Live visualization of 5G config propagation via NETCONF/YANG",
    description:
      "Interactive demo of the Configuration Management flow I built at TMA Solutions — from NMS NETCONF edit-config, through ConfD YANG validation, to ZMQ delivery at the gNB base station.",
    source: "company",
    category: "5g-oam",
    status: "live",
    company: "TMA Solutions",
    features: [
      {
        icon: "📡",
        title: "Full CM Flow",
        description: "5 nodes: NMS → ConfD → OAM Agent → ZMQ → gNB. Each step animates with real timing.",
      },
      {
        icon: "🔧",
        title: "3 Config Presets",
        description: "Cell / Frequency / Power — each with real NETCONF XML and YANG paths from the codebase.",
      },
      {
        icon: "❌",
        title: "Error Injection",
        description: "Toggle YANG validation failure — ConfD returns rpc-error XML, flow halts before gNB.",
      },
      {
        icon: "⏱️",
        title: "Latency Breakdown",
        description: "Round-trip latency panel after successful run. Real timing distribution per layer.",
      },
    ],
    demoUrl: `/demo/cm-flow`,
    pricing: { type: "free", label: "Free demo" },
    tags: ["C++", "NETCONF/YANG", "ConfD", "ZMQ", "3GPP TS 28.541"],
    accent: "cyan",
  },
  {
    slug: "fm-dashboard",
    name: "FM Alarm Dashboard",
    tagline: "Real-time 5G fault monitoring with full alarm lifecycle",
    description:
      "Demonstrates the Fault Management system I implemented at TMA Solutions. Inject real alarm types (LINK_DOWN, SYNC_LOSS), track the ZMQ → OAM Agent → ConfD → NMS flow, and manage the 4-state alarm lifecycle.",
    source: "company",
    category: "5g-oam",
    status: "live",
    company: "TMA Solutions",
    features: [
      {
        icon: "🚨",
        title: "5 Real Alarm Types",
        description: "LINK_DOWN (F1 interface), CPU_HIGH (DU), SYNC_LOSS (PTP), CELL_UNAVAILABLE, MEM_THRESHOLD.",
      },
      {
        icon: "🔄",
        title: "4-State Lifecycle",
        description: "ACTIVE → ACKNOWLEDGED → CLEARING → CLEARED — exact state machine from FMServiceR1.cpp.",
      },
      {
        icon: "📦",
        title: "ZMQ Payload Viewer",
        description: "See the real FM_ALARM_IND struct format sent over ZMQ from gNB to OAM Agent.",
      },
      {
        icon: "🔴",
        title: "Live Mode",
        description: "Auto-inject random alarms every 3–5s to simulate real base station fault conditions.",
      },
    ],
    demoUrl: `/demo/fm-dashboard`,
    pricing: { type: "free", label: "Free demo" },
    tags: ["C++", "ZMQ", "ConfD", "NETCONF", "3GPP ITU-T X.733"],
    accent: "red",
  },
  {
    slug: "oam-agent",
    name: "OAM Agent Startup",
    tagline: "Inside the C++ OAM Agent — boot sequence, state machines, threading",
    description:
      "Visualizes the full startup sequence of the OAM Agent C++ process I built at TMA Solutions. Real log output, dual state machines (NF + NETCONF), 4-thread model, and crash/recovery scenarios.",
    source: "company",
    category: "5g-oam",
    status: "live",
    company: "TMA Solutions",
    features: [
      {
        icon: "🚀",
        title: "9-Step Boot Sequence",
        description: "Real module names (OAM_LIB, OAM_CM, OAM_FM, OAM_PM) from actual LogDUSim.txt.",
      },
      {
        icon: "🔀",
        title: "Dual State Machines",
        description: "NF State (3 states) + NETCONF State (4 states) running in parallel — as in the real system.",
      },
      {
        icon: "🧵",
        title: "Thread Model",
        description: "4 threads: OAM_AGENT, comm_thread, sys_thread, OAM_RX. Explains the CDB deadlock prevention design.",
      },
      {
        icon: "💥",
        title: "Crash Scenarios",
        description: "Simulate SIGSEGV, ZMQ timeout, ConfD drop, OOM — with realistic recovery logs.",
      },
    ],
    demoUrl: `/demo/oam-agent`,
    pricing: { type: "free", label: "Free demo" },
    tags: ["C++", "ZMQ", "ConfD", "NETCONF", "3GPP TS 28.550"],
    accent: "violet",
  },
  {
    slug: "ras-nms",
    name: "RAS Network Management System",
    tagline: "Python pipeline collecting metrics from 4 telecom device families",
    description:
      "Demonstrates the NMS data pipeline I built at TMA Solutions. Collects SNMP/NETCONF metrics from TN-FOSS, E-PASSTEL, OF-PASSTEL, and IF-PASSTEL devices → Kafka → PostgreSQL → Virtuora VXM.",
    source: "company",
    category: "nms",
    status: "live",
    company: "TMA Solutions",
    features: [
      {
        icon: "📡",
        title: "4 Device Families",
        description: "TN-FOSS, E-PASSTEL, OF-PASSTEL, IF-PASSTEL — each with its own protocol and OID set.",
      },
      {
        icon: "⚡",
        title: "7-Node Pipeline",
        description: "Network Devices → EMS → DDC → Kafka → IDB → Zabbix → Virtuora VXM — all animated.",
      },
      {
        icon: "📝",
        title: "Real Log Format",
        description: "Python logs stream in the exact format used by DDC Server: [timestamp][LEVEL][PID].",
      },
      {
        icon: "🔔",
        title: "Fault Injection",
        description: "Inject a fault mid-monitoring to trigger the Zabbix alert panel.",
      },
    ],
    demoUrl: `/demo/ras-nms`,
    pricing: { type: "free", label: "Free demo" },
    tags: ["Python", "Kafka", "SNMP", "SFTP", "PostgreSQL", "Docker"],
    accent: "blue",
  },
  {
    slug: "installer",
    name: "InstallShield / Mobile CI/CD",
    tagline: "MSI packaging + Android/iOS pipeline for enterprise software",
    description:
      "Demonstrates the build and deployment tooling I maintain at TMA Solutions — InstallShield MSI packaging for Windows + Gradle/Fastlane mobile CI/CD pipelines for Android and iOS.",
    source: "company",
    category: "devops",
    status: "live",
    company: "TMA Solutions",
    features: [
      {
        icon: "📦",
        title: "MSI Build Pipeline",
        description: "5-step IS build: Configure → Compile → Package → Sign (Authenticode) → Deploy. Real .ism structure.",
      },
      {
        icon: "🧙",
        title: "Installer Wizard",
        description: "Post-build: interactive installer wizard mock (Welcome → License → Directory → Installing → Finish).",
      },
      {
        icon: "📱",
        title: "Android CI/CD",
        description: "Gradle build → JUnit4 tests → APK signing (v2) → Firebase App Distribution.",
      },
      {
        icon: "🍎",
        title: "iOS Pipeline",
        description: "CocoaPods → Fastlane → XCTest → IPA export → TestFlight upload.",
      },
    ],
    demoUrl: `/demo/installer`,
    pricing: { type: "free", label: "Free demo" },
    tags: ["InstallShield", "Android Studio", "Xcode", "Fastlane", "Gradle"],
    accent: "orange",
  },
];

export type FilterKey = "all" | "personal" | "company" | "automation" | "5g-oam" | "nms" | "devops";

export const FILTER_LABELS: Record<FilterKey, string> = {
  all: "All",
  personal: "Personal",
  company: "Company (TMA)",
  automation: "Automation",
  "5g-oam": "5G OAM",
  nms: "NMS",
  devops: "DevOps",
};

export function filterProducts(list: Product[], key: FilterKey): Product[] {
  if (key === "all") return list;
  if (key === "personal" || key === "company") return list.filter((p) => p.source === key);
  return list.filter((p) => p.category === key);
}
