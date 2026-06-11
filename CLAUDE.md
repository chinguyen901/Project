# chi-products — Product Showcase Site

## Tổng quan
SaaS-style product showcase site cho Chi Nguyen — Next.js 14, TypeScript strict, Tailwind CSS.  
Phân biệt rõ **dự án cá nhân** (Upwork freelance) và **dự án công ty** (TMA Solutions).

## Chạy local
```bash
npm run dev   # http://localhost:3000
npm run build # production check — phải pass 31 static pages, 0 errors
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
      DemoRenderer.tsx     — Client component, maps slug → demo component (DEMO_MAP)
    components/
      PriceAlertDemo.tsx        — Live crypto ticker + alert + AI analysis
      EcommerceScraperDemo.tsx  — URL scrape → table + CSV export
      JobMonitorDemo.tsx        — Multi-source job scan + results
      ChromeAutomatorDemo.tsx   — Workflow preset + batch execution
      DiscordBotDemo.tsx        — Slash command interface + rich embeds
      EmailAutomatorDemo.tsx    — Rule engine + inbox processing
      GoogleSheetsSyncDemo.tsx  — Animated row-by-row spreadsheet sync
      ReportGeneratorDemo.tsx   — Animated SVG charts + email delivery mock
      CmFlowDemo.tsx            — Full 5G OAM CM arch diagram + NETCONF flow log + latency
      FmDashboardDemo.tsx       — Full FM arch diagram + alarm lifecycle + ZMQ payload + pipeline log
      OamAgentDemo.tsx          — Full OAM Agent arch (external + internals) + boot terminal + crash inject
      RasNmsDemo.tsx            — Full RAS NMS pipeline arch + per-device log stream + fault inject
      InstallerDemo.tsx         — Full CI/CD pipeline arch + build steps + build log + MSI wizard
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

## TMA Demo — Visual Design Pattern (quan trọng, áp dụng cho tất cả 5 demo)

### Architecture Diagram (ở đầu mỗi demo)
Mỗi demo có một architecture diagram full-width hiển thị toàn bộ hệ thống:
- **Layers** xếp dọc, mỗi layer là một box với label + sub-nodes
- **Chi's components** → `border-red-500/60` + `bg-gradient-to-br from-red-950/50` + glow shadow + badge `★ Chi Nguyen — Built & maintained at TMA Solutions`
- **Active layer khi run** → `border-{color}-500/50` + glow + pulsing dot `● processing`
- **Arrows giữa layers** → CSS triangle + label protocol (animate màu khi flow qua)
- **Legend** góc phải header: `■ = Chi's implementation`

### Run Section (professional)
- **Stats bar**: 3 ô (message count, status, protocol/platform)
- **Terminal log** (`font-mono text-[11px]`): màu per source
  - `[★ OAM/CM/FM/ZMQ]` → `text-red-300`
  - `✓` success → `text-emerald-400`
  - `✗` error → `text-red-400`
  - `[NMS/ConfD/gNB/KAFKA/IDB]` → `text-cyan/violet/emerald/violet/blue-300/80`
- **Pulsing dot** ở header terminal khi đang run

### Consistent pattern across all 5:
```
ARCH = [{ id, layer, layerSub, chi: bool, nodes: [{icon, label, desc}], conn: {label, proto} | null }]
```
Render: layer.chi → red styling; activeLayerIdx === i → color styling; conn → arrow + label dưới layer

---

## TMA Demo — chi tiết kỹ thuật (quan trọng cho accuracy)

### CmFlowDemo — 5G OAM Configuration Management
- **Architecture layers**: O&M System → YANG Datastore (ConfD) → OAM Middleware ★Chi → gNB Application
- **Chi's work**: OAM Agent (main), CM Module (YANG→ZMQ), FM Module (ZMQ alarms), PM Module (counters)
- **YANG namespace**: `urn:3gpp:sa5:_3gpp-nr-nrm-gnbdufunction` (3GPP TS 28.541, KHÔNG dùng BBF)
- **NETCONF xmlns**: `urn:ietf:params:xml:ns:netconf:base:1.0`
- **3 presets** với YANG path và XML fields thực tế:
  - Cell Config → `/GNBDUFunction=1/NRCellDU=NR-Cell-001/attributes` → `cellLocalId`, `nrPCI`, `operationalState`, `administrativeState`
  - Freq Band → `.../attributes/nrFreqBand` → `nrFreqBand`, `arfcnDL`, `arfcnUL`, `bSChannelBwDL`
  - TX Power → `.../attributes/configuredMaxTxPower` → `configuredMaxTxPower`, `ssbFrequency`, `txDirection`
- **Run log**: `LOGS[preset].ok` / `.err` — per-preset detailed step log
- rpc-error có `<error-path>` với YANG path + contextual `errorMsg` per preset

### FmDashboardDemo — 5G OAM Fault Management
- **Architecture layers**: gNB Hardware → OAM Agent FM Module ★Chi → YANG Datastore (ConfD) → O&M System
- **Chi's work**: OAM Agent (main), FM Module (ZMQ SUB→ITU-T X.733→YANG notify), Alarm Store, Notification Engine
- **ZMQ**: `tcp://127.0.0.1:5555` PUB/SUB (gNB publishes → OAM Agent subscribes)
- **ZMQ payload** `FM_ALARM_IND` struct với đầy đủ ITU-T X.733 fields:
  - `managed_object_class` / `managed_object_instance` (3GPP DN format)
  - `event_type` (ITU-T X.721): `COMMUNICATIONS_ALARM`, `EQUIPMENT_ALARM`
  - `probable_cause`: `COMMUNICATION_SUBSYSTEM_FAILURE`, `PROCESSOR_PROBLEM`, `TIMING_PROBLEM`, `SOFTWARE_ERROR`, `RESOURCE_AT_OR_NEARING_CAPACITY`
  - `perceived_severity` (KHÔNG phải `severity`), `specific_problem`, `additional_text`
- **5 alarm types**: LINK_DOWN (F1Interface), CPU_HIGH (GNBDUFunction), SYNC_LOSS (NRCellDU PTP), CELL_UNAVAILABLE (NRCellDU), MEM_THRESHOLD (OAMAgent)
- **Per-alarm pipeline log**: `def.pipeline(ts)` returns step-by-step log, animates when alarm injected
- **3-column run layout**: Alarm table | ZMQ Payload | FM Pipeline Log

### OamAgentDemo — OAM Agent Internal Architecture
- **Architecture**: External context (Virtuora NMS, ConfD, gNB App) + OAM Agent internals (ALL Chi's work)
- **Chi's work**: toàn bộ OAM Agent — OAM_AGENT, CM Module, FM Module, PM Module, ZMQ Socket, NETCONF Session
- **Module highlight**: `activeModule` state → box glows khi boot qua từng module
- **ZMQ endpoint**: `tcp://127.0.0.1:5555` (bind trước khi connect NETCONF)
- **NETCONF session**: `127.0.0.1:830` (ConfD), session-id: 1042
- **YANG subscription xpath**: `/GNBDUFunction=1/NRCellDU`
- **Boot sequence** (11 log lines, indices 0–10): OAM_AGENT → OAM_LIB (3GPP TS 28.541) → OAM_CM → OAM_FM (ITU-T X.733) → OAM_PM → ZMQ bind → NETCONF connect → session 1042 → subscribe → READY
- State machine: i=7 → CONNECTING, i=8 → CONNECTED, i=9 → SUBSCRIBED; activeModule per index
- **Thread model**: `OAM_AGENT`, `comm_thread`, `sys_thread`, `OAM_RX`

### RasNmsDemo — RAS NMS Collection Pipeline
- **Architecture layers**: Network Devices → DDC ★Chi → Message Bus (Kafka) → Storage & Alerting
- **Chi's work**: DDC Server + all protocol handlers (SNMP v2c, SNMP v3 authPriv, NETCONF, SFTP)
- **4 devices với protocol riêng biệt** — KHÔNG dùng generic template:
  - TN-FOSS (SNMP v2c): OID `.1.3.6.1.2.1.2.2.1` (ifTable), community: public
  - E-PASSTEL (NETCONF): SSH:830, `<get-config>` source=running xpath=/interfaces/interface
  - OF-PASSTEL (SNMP v3): authPriv SHA/AES128, OID `.1.3.6.1.2.1.10.166.11` (mplsLspFecTable), engineID
  - IF-PASSTEL (SFTP): SSH:22, download `/perf/if-passtel-YYYYMMDD-HHMM.csv`
- Fault logs phân biệt: SNMP timeout / NETCONF session failed / SFTP connection refused

### InstallerDemo — Build & Release Pipeline
- **Architecture layers**: Source Code → Build Pipeline ★Chi → Code Signing → Distribution
- **Chi's work**: InstallShield MSI automation, Gradle/Firebase CI, Fastlane/Xcode/TestFlight pipeline
- **3 tabs**: MSI (InstallShield), Android (Gradle/Firebase), iOS (Fastlane/TestFlight)
- **Per-tab build log**: `MSI_LOGS` / `ANDROID_LOGS` / `IOS_LOGS` — animates alongside step tracker
- **MSI wizard**: 5-step installer wizard sau khi MSI build xong
- **stepStatus fix**: `const doneIdx = i; i++` trước `setStepStatus` để tránh stale closure với React batching

## RULE OF PROJECT
- Source of truth duy nhất là `data/products.ts` — không hardcode data ở page
- Luôn update CLAUDE.md khi thêm products hoặc thay đổi cấu trúc
- TMA demo technical details phải sát với 3GPP/ITU-T standards thực tế — xem section trên trước khi sửa
