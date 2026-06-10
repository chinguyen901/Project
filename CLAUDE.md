# chi-products — Product Showcase Site

## Tổng quan
SaaS-style product showcase site cho Chi Nguyen — Next.js 14, TypeScript strict, Tailwind CSS.  
Phân biệt rõ **dự án cá nhân** (Upwork freelance) và **dự án công ty** (TMA Solutions).

## Chạy local
```bash
npm run dev   # http://localhost:3000
npm run build # production check
```

## Stack
- Next.js 14 · TypeScript strict · Tailwind CSS 3.4
- Deploy: Vercel (project riêng, tách hoàn toàn khỏi portfolio)

## Cấu trúc
```
app/
  layout.tsx               — Root layout, SEO meta
  page.tsx                 — Main hub: hero + filterable product grid (client component)
  globals.css              — Dark theme base styles
  products/
    [slug]/
      page.tsx             — Dynamic product landing page (static generation)
  demo/
    [slug]/
      page.tsx             — Demo host page (server component + SEO meta)
      DemoRenderer.tsx     — Client component, maps slug → demo component
    components/
      PriceAlertDemo.tsx   — Live crypto ticker + alert + AI analysis
      EcommerceScraperDemo.tsx — URL scrape → table + CSV export
      JobMonitorDemo.tsx   — Multi-source job scan + results
      ChromeAutomatorDemo.tsx  — Workflow preset + batch execution
      DiscordBotDemo.tsx   — Slash command interface + rich embeds
      EmailAutomatorDemo.tsx   — Rule engine + inbox processing
      GoogleSheetsSyncDemo.tsx — Animated row-by-row spreadsheet sync
      ReportGeneratorDemo.tsx  — Animated SVG charts + email delivery mock
      CmFlowDemo.tsx       — 5-node NETCONF/YANG flow + latency breakdown
      FmDashboardDemo.tsx  — Alarm lifecycle + ZMQ payload viewer
      OamAgentDemo.tsx     — Boot sequence terminal + crash injection
      RasNmsDemo.tsx       — Pipeline monitoring + log stream + fault inject
      InstallerDemo.tsx    — MSI/Android/iOS build pipeline + wizard
data/
  products.ts              — SOURCE OF TRUTH cho tất cả products
                             Exports: products[], filterProducts(), FILTER_LABELS, FilterKey
```

## Thêm product mới (data/products.ts)
1. Thêm object vào `products[]` theo đúng type `Product`
2. Set `source: "personal"` hoặc `"company"`
3. Set `demoUrl: "/demo/<slug>"` — demo page được build static tự động
4. Tạo demo component tại `app/demo/components/<Name>Demo.tsx`
5. Đăng ký trong `app/demo/[slug]/DemoRenderer.tsx` → DEMO_MAP
6. `generateStaticParams()` trong các `[slug]/page.tsx` tự động pick up — không cần sửa

## Products hiện tại (13)

### Personal (8 — Upwork)
| slug | Demo URL (internal) | Demo Component |
|------|---------------------|----------------|
| price-alert-bot | /demo/price-alert-bot | PriceAlertDemo |
| ecommerce-scraper | /demo/ecommerce-scraper | EcommerceScraperDemo |
| job-monitor | /demo/job-monitor | JobMonitorDemo |
| chrome-automator | /demo/chrome-automator | ChromeAutomatorDemo |
| discord-bot | /demo/discord-bot | DiscordBotDemo |
| email-automator | /demo/email-automator | EmailAutomatorDemo |
| google-sheets-sync | /demo/google-sheets-sync | GoogleSheetsSyncDemo |
| report-generator | /demo/report-generator | ReportGeneratorDemo |

### Company — TMA Solutions (5)
| slug | Demo URL (internal) | Demo Component |
|------|---------------------|----------------|
| cm-flow | /demo/cm-flow | CmFlowDemo |
| fm-dashboard | /demo/fm-dashboard | FmDashboardDemo |
| oam-agent | /demo/oam-agent | OamAgentDemo |
| ras-nms | /demo/ras-nms | RasNmsDemo |
| installer | /demo/installer | InstallerDemo |

## Accent colors per product
`cyan` / `emerald` / `amber` / `violet` / `blue` / `orange` / `red`  
→ Được dùng trong card border hover, hero gradient, CTA button, feature card hover

## Filter logic
`FilterKey = "all" | "personal" | "company" | "automation" | "5g-oam" | "nms" | "devops"`  
→ Filter bằng `filterProducts(products, key)` trong page.tsx — client-side, không re-fetch

## RULE OF PROJECT
- Source of truth duy nhất là `data/products.ts` — không hardcode data ở page
- Luôn update CLAUDE.md khi thêm products hoặc thay đổi cấu trúc
