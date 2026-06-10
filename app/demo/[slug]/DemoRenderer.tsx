"use client";
import PriceAlertDemo from "../components/PriceAlertDemo";
import EcommerceScraperDemo from "../components/EcommerceScraperDemo";
import JobMonitorDemo from "../components/JobMonitorDemo";
import ChromeAutomatorDemo from "../components/ChromeAutomatorDemo";
import DiscordBotDemo from "../components/DiscordBotDemo";
import EmailAutomatorDemo from "../components/EmailAutomatorDemo";
import GoogleSheetsSyncDemo from "../components/GoogleSheetsSyncDemo";
import ReportGeneratorDemo from "../components/ReportGeneratorDemo";
import CmFlowDemo from "../components/CmFlowDemo";
import FmDashboardDemo from "../components/FmDashboardDemo";
import OamAgentDemo from "../components/OamAgentDemo";
import RasNmsDemo from "../components/RasNmsDemo";
import InstallerDemo from "../components/InstallerDemo";

const DEMO_MAP: Record<string, React.ComponentType> = {
  "price-alert-bot": PriceAlertDemo,
  "ecommerce-scraper": EcommerceScraperDemo,
  "job-monitor": JobMonitorDemo,
  "chrome-automator": ChromeAutomatorDemo,
  "discord-bot": DiscordBotDemo,
  "email-automator": EmailAutomatorDemo,
  "google-sheets-sync": GoogleSheetsSyncDemo,
  "report-generator": ReportGeneratorDemo,
  "cm-flow": CmFlowDemo,
  "fm-dashboard": FmDashboardDemo,
  "oam-agent": OamAgentDemo,
  "ras-nms": RasNmsDemo,
  installer: InstallerDemo,
};

export default function DemoRenderer({ slug }: { slug: string }) {
  const Demo = DEMO_MAP[slug];
  if (!Demo) {
    return (
      <div className="p-12 text-center rounded-xl border border-zinc-800 bg-zinc-900">
        <p className="text-zinc-500 text-sm">Demo not found for <span className="font-mono text-zinc-300">{slug}</span></p>
      </div>
    );
  }
  return <Demo />;
}
