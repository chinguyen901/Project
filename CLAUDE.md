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
data/
  products.ts              — SOURCE OF TRUTH cho tất cả products
                             Exports: products[], filterProducts(), FILTER_LABELS, FilterKey
```

## Thêm product mới (data/products.ts)
1. Thêm object vào `products[]` theo đúng type `Product`
2. Set `source: "personal"` hoặc `"company"`
3. Set `demoUrl` nếu có live demo (link đến portfolio hoặc external)
4. `generateStaticParams()` trong `[slug]/page.tsx` tự động pick up — không cần sửa

## Products hiện tại (13)

### Personal (8 — Upwork)
| slug | Demo URL |
|------|----------|
| price-alert-bot | /demo/price-alert |
| ecommerce-scraper | /demo/scraper |
| job-monitor | /demo/job-monitor |
| chrome-automator | /demo/chrome-extension |
| discord-bot | /demo/discord-bot |
| email-automator | /demo/email-automator |
| google-sheets-sync | /demo/google-sheets |
| report-generator | /demo/report-generator |

### Company — TMA Solutions (5)
| slug | Demo URL |
|------|----------|
| cm-flow | /demo/cm-flow |
| fm-dashboard | /demo/fm-dashboard |
| oam-agent | /demo/oam-agent |
| ras-nms | /demo/ras-nms |
| installer | /demo/installer |

## Accent colors per product
`cyan` / `emerald` / `amber` / `violet` / `blue` / `orange` / `red`  
→ Được dùng trong card border hover, hero gradient, CTA button, feature card hover

## Filter logic
`FilterKey = "all" | "personal" | "company" | "automation" | "5g-oam" | "nms" | "devops"`  
→ Filter bằng `filterProducts(products, key)` trong page.tsx — client-side, không re-fetch

## RULE OF PROJECT
- Source of truth duy nhất là `data/products.ts` — không hardcode data ở page
- Luôn update CLAUDE.md khi thêm products hoặc thay đổi cấu trúc
