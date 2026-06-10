"use client";
import { useState, useCallback } from "react";

type Action = "auto-reply" | "forward" | "archive" | "flag";
type Condition = "contains" | "equals" | "starts_with";
type Field = "subject" | "from" | "body";

type Rule = { field: Field; condition: Condition; value: string; action: Action };
type Email = { from: string; subject: string; preview: string };
type EmailResult = Email & { status: Action | null; processed: boolean };

const SAMPLE_EMAILS: Email[] = [
  { from: "billing@vendor.com", subject: "Invoice #1042 — Payment Due", preview: "Please find attached invoice for services rendered..." },
  { from: "jobs@linkedin.com", subject: "New job matches for you", preview: "We found 12 jobs matching your profile this week..." },
  { from: "boss@company.com", subject: "Urgent: Deploy by EOD", preview: "We need the new release deployed before 5pm today..." },
  { from: "newsletter@techdigest.io", subject: "Tech Digest — Weekly Edition", preview: "This week in tech: AI advancements, new frameworks..." },
  { from: "support@stripe.com", subject: "Your subscription has been renewed", preview: "Your Pro plan has been renewed for another month..." },
  { from: "alice@client.com", subject: "Re: Project proposal", preview: "Thanks for sending over the proposal. I have a few questions..." },
  { from: "spam@promo.xyz", subject: "YOU HAVE WON $1,000,000!!!", preview: "Congratulations! Click here to claim your prize..." },
  { from: "dev@github.com", subject: "Pull request merged: fix/auth-bug", preview: "Your pull request has been successfully merged..." },
  { from: "billing@vendor.com", subject: "Invoice #1043 — Final Notice", preview: "This is a final reminder that payment is overdue..." },
  { from: "ceo@company.com", subject: "Team meeting rescheduled", preview: "The all-hands meeting has been moved to Friday at 2pm..." },
];

const DEFAULT_RULES: Rule[] = [
  { field: "subject", condition: "contains", value: "Invoice", action: "auto-reply" },
  { field: "from", condition: "contains", value: "newsletter", action: "archive" },
  { field: "subject", condition: "contains", value: "Urgent", action: "flag" },
];

const ACTION_STYLES: Record<Action, string> = {
  "auto-reply": "text-blue-400 bg-blue-500/10 border-blue-500/30",
  forward: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  archive: "text-zinc-400 bg-zinc-800 border-zinc-700",
  flag: "text-red-400 bg-red-500/10 border-red-500/30",
};

const ACTION_ICONS: Record<Action, string> = {
  "auto-reply": "↩️",
  forward: "➡️",
  archive: "📁",
  flag: "🚩",
};

function matchEmail(email: Email, rule: Rule): boolean {
  const val = email[rule.field === "from" ? "from" : rule.field === "subject" ? "subject" : "preview"].toLowerCase();
  const q = rule.value.toLowerCase();
  if (rule.condition === "contains") return val.includes(q);
  if (rule.condition === "equals") return val === q;
  if (rule.condition === "starts_with") return val.startsWith(q);
  return false;
}

export default function EmailAutomatorDemo() {
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [emails, setEmails] = useState<EmailResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ replied: 0, forwarded: 0, archived: 0, flagged: 0 });

  const processInbox = useCallback(() => {
    const initial = SAMPLE_EMAILS.map((e) => ({ ...e, status: null as Action | null, processed: false }));
    setEmails(initial);
    setProcessing(true);
    setDone(false);
    setStats({ replied: 0, forwarded: 0, archived: 0, flagged: 0 });

    let i = 0;
    const st = { replied: 0, forwarded: 0, archived: 0, flagged: 0 };

    const process = () => {
      if (i >= SAMPLE_EMAILS.length) {
        setProcessing(false);
        setDone(true);
        return;
      }
      const email = SAMPLE_EMAILS[i];
      let matched: Action | null = null;
      for (const rule of rules) {
        if (matchEmail(email, rule)) { matched = rule.action; break; }
      }
      if (matched === "auto-reply") st.replied++;
      if (matched === "forward") st.forwarded++;
      if (matched === "archive") st.archived++;
      if (matched === "flag") st.flagged++;
      setStats({ ...st });
      setEmails((prev) => prev.map((e, idx) => idx === i ? { ...e, status: matched, processed: true } : e));
      i++;
      setTimeout(process, 250);
    };
    process();
  }, [rules]);

  const updateRule = (i: number, field: keyof Rule, val: string) => {
    setRules((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  };

  return (
    <div className="space-y-4">
      {/* Rules */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-200">Rule Engine</h3>
          <span className="text-xs text-zinc-600">First match wins</span>
        </div>
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-600 w-4">{i + 1}.</span>
              <span className="text-xs text-zinc-500">If</span>
              <select
                value={rule.field}
                onChange={(e) => updateRule(i, "field", e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 outline-none"
              >
                <option value="subject">subject</option>
                <option value="from">from</option>
                <option value="body">body</option>
              </select>
              <select
                value={rule.condition}
                onChange={(e) => updateRule(i, "condition", e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 outline-none"
              >
                <option value="contains">contains</option>
                <option value="equals">equals</option>
                <option value="starts_with">starts with</option>
              </select>
              <input
                value={rule.value}
                onChange={(e) => updateRule(i, "value", e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 outline-none w-28"
              />
              <span className="text-xs text-zinc-500">→</span>
              <select
                value={rule.action}
                onChange={(e) => updateRule(i, "action", e.target.value as Action)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 outline-none"
              >
                <option value="auto-reply">auto-reply</option>
                <option value="forward">forward</option>
                <option value="archive">archive</option>
                <option value="flag">flag</option>
              </select>
            </div>
          ))}
        </div>
        <button
          onClick={processInbox}
          disabled={processing}
          className="mt-4 w-full py-2.5 bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold text-sm rounded-lg transition-colors"
        >
          {processing ? "Processing inbox..." : done ? "Re-process" : "Process Inbox (10 emails)"}
        </button>
      </div>

      {/* Stats */}
      {(processing || done) && (
        <div className="grid grid-cols-4 gap-2">
          {([["auto-reply", "Replied", stats.replied], ["forward", "Forwarded", stats.forwarded], ["archive", "Archived", stats.archived], ["flag", "Flagged", stats.flagged]] as const).map(([action, label, count]) => (
            <div key={action} className={`p-3 rounded-xl border text-center ${count > 0 ? ACTION_STYLES[action] : "border-zinc-800 bg-zinc-900"}`}>
              <div className="text-xl font-bold text-inherit">{count}</div>
              <div className="text-xs opacity-70">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Inbox */}
      {emails.length > 0 && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-500 font-medium">
            Inbox — {SAMPLE_EMAILS.length} emails
          </div>
          <div className="divide-y divide-zinc-800/60">
            {emails.map((email, i) => (
              <div
                key={i}
                className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                  email.processed ? "bg-zinc-900" : "bg-zinc-950"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-zinc-200 truncate">{email.subject}</span>
                    {!email.processed && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block shrink-0" />}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">{email.from} · {email.preview}</div>
                </div>
                <div className="shrink-0">
                  {email.status ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${ACTION_STYLES[email.status]} flex items-center gap-1`}>
                      <span>{ACTION_ICONS[email.status]}</span>
                      <span>{email.status}</span>
                    </span>
                  ) : email.processed ? (
                    <span className="text-xs text-zinc-600">no match</span>
                  ) : (
                    <span className="text-xs text-zinc-700">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {emails.length === 0 && (
        <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center text-zinc-600 text-sm">
          Configure rules and click <span className="text-blue-400 font-medium">Process Inbox</span> to run the automation
        </div>
      )}
    </div>
  );
}
