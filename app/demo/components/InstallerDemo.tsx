"use client";
import { useState, useCallback } from "react";

type Tab = "msi" | "android" | "ios";
type StepStatus = "idle" | "running" | "done" | "error";

const MSI_STEPS = [
  { label: "Configure", desc: "Load project.ism — 842 components, 12 features, 3 custom actions" },
  { label: "Compile", desc: "Compiling ISM → compiling scripts → 0 errors, 2 warnings" },
  { label: "Package", desc: "Building MSI: setup.msi (142 MB) — compression: LZX max" },
  { label: "Sign", desc: "Authenticode signing with SHA-256 — certificate: TMA Solutions EV" },
  { label: "Deploy", desc: "Uploading to \\\\deploy-server\\releases\\v2.4.1\\ — done" },
];

const ANDROID_STEPS = [
  { label: "Gradle Build", desc: "assembleRelease — 24 tasks, 6 up-to-date, 18 executed" },
  { label: "JUnit4 Tests", desc: "Running 142 tests — 140 passed, 0 failed, 2 skipped" },
  { label: "APK Sign (v2)", desc: "Signing with release keystore — APK v2 signature scheme" },
  { label: "Firebase Dist.", desc: "Uploading app-release.apk (38 MB) → Firebase App Distribution" },
];

const IOS_STEPS = [
  { label: "CocoaPods", desc: "pod install — 28 pods, 4 updated. Resolving dependencies ✓" },
  { label: "Fastlane", desc: "Running lane :beta — building with xcodebuild archive" },
  { label: "XCTest", desc: "Running 98 test cases — 97 passed, 0 failed, 1 skipped" },
  { label: "TestFlight", desc: "Uploading app.ipa (52 MB) → TestFlight — build 1042 processing" },
];

const WIZARD_STEPS = [
  { title: "Welcome", content: "Welcome to the TMA Solutions Enterprise Suite v2.4.1 Setup Wizard.\n\nThis wizard will guide you through the installation process.\nClick Next to continue." },
  { title: "License Agreement", content: "END USER LICENSE AGREEMENT\n\nThis software is proprietary to TMA Solutions and licensed, not sold...\n\n[✓] I accept the terms of the license agreement" },
  { title: "Destination Folder", content: "Install TMA Solutions Enterprise Suite to:\n\nC:\\Program Files\\TMA Solutions\\Enterprise Suite\\\n\n[Change...]  Required: 348 MB  Available: 120 GB" },
  { title: "Installing", content: "Please wait while the Setup Wizard installs TMA Solutions...\n\n████████████░░░░░░░░ 60%\n\nInstalling: core components..." },
  { title: "Installation Complete", content: "TMA Solutions Enterprise Suite v2.4.1 has been successfully installed.\n\n[✓] Launch TMA Solutions\n[✓] Create desktop shortcut\n\nClick Finish to exit." },
];

export default function InstallerDemo() {
  const [tab, setTab] = useState<Tab>("msi");
  const [stepStatus, setStepStatus] = useState<Record<Tab, StepStatus[]>>({ msi: [], android: [], ios: [] });
  const [running, setRunning] = useState<Record<Tab, boolean>>({ msi: false, android: false, ios: false });
  const [wizardStep, setWizardStep] = useState<number | null>(null);
  const [wizardRunning, setWizardRunning] = useState(false);

  const steps = tab === "msi" ? MSI_STEPS : tab === "android" ? ANDROID_STEPS : IOS_STEPS;

  const runBuild = useCallback(() => {
    setStepStatus((prev) => ({ ...prev, [tab]: [] }));
    setRunning((prev) => ({ ...prev, [tab]: true }));
    setWizardStep(null);

    let i = 0;
    const run = () => {
      if (i >= steps.length) {
        setRunning((prev) => ({ ...prev, [tab]: false }));
        if (tab === "msi") {
          setTimeout(() => {
            setWizardStep(0);
          }, 500);
        }
        return;
      }
      setStepStatus((prev) => ({
        ...prev,
        [tab]: prev[tab].map((s, idx) => idx === i ? "running" : s).concat(i >= prev[tab].length ? ["running"] : []),
      }));
      const isErr = false;
      setTimeout(() => {
        setStepStatus((prev) => ({
          ...prev,
          [tab]: [...(prev[tab].length > i ? prev[tab].slice(0, i) : []), isErr ? "error" : "done"],
        }));
        i++;
        setTimeout(run, 300);
      }, 900 + Math.random() * 400);
    };
    run();
  }, [tab, steps]);

  const STATUS_ICON: Record<StepStatus, string> = {
    idle: "○",
    running: "⏳",
    done: "✓",
    error: "✗",
  };
  const STATUS_COLOR: Record<StepStatus, string> = {
    idle: "text-zinc-700",
    running: "text-amber-400",
    done: "text-emerald-400",
    error: "text-red-400",
  };
  const TAB_COLOR: Record<Tab, string> = {
    msi: "border-orange-500/60 bg-orange-500/10 text-orange-400",
    android: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400",
    ios: "border-blue-500/60 bg-blue-500/10 text-blue-400",
  };

  const currentStatuses = stepStatus[tab];
  const isDone = !running[tab] && currentStatuses.length === steps.length && currentStatuses.every((s) => s === "done" || s === "error");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["msi", "android", "ios"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setWizardStep(null); }}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${
              tab === t ? TAB_COLOR[t] : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
            }`}
          >
            {t === "msi" ? "📦 MSI Build" : t === "android" ? "🤖 Android CI/CD" : "🍎 iOS Pipeline"}
          </button>
        ))}
      </div>

      {/* Build pipeline */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <span className="text-sm font-semibold text-zinc-200">
            {tab === "msi" ? "InstallShield Build Pipeline" : tab === "android" ? "Android CI/CD — Gradle/Firebase" : "iOS Pipeline — Fastlane/TestFlight"}
          </span>
          <button
            onClick={runBuild}
            disabled={running[tab]}
            className={`text-xs px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              running[tab]
                ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                : tab === "msi" ? "bg-orange-500 hover:bg-orange-400 text-white"
                : tab === "android" ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                : "bg-blue-500 hover:bg-blue-400 text-white"
            }`}
          >
            {running[tab] ? "Building..." : isDone ? "▶ Rebuild" : "▶ Run Pipeline"}
          </button>
        </div>
        <div className="p-4 space-y-3">
          {steps.map((step, i) => {
            const status = currentStatuses[i] ?? "idle";
            return (
              <div key={step.label} className={`flex items-start gap-3 transition-all ${status === "idle" ? "opacity-40" : ""}`}>
                <div className={`text-base w-5 shrink-0 mt-0.5 ${STATUS_COLOR[status]}`}>
                  {status === "running" ? (
                    <span className="inline-block animate-spin">⟳</span>
                  ) : (
                    STATUS_ICON[status]
                  )}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${status === "done" ? "text-zinc-200" : status === "running" ? "text-zinc-100" : "text-zinc-600"}`}>
                    {step.label}
                  </div>
                  {status !== "idle" && (
                    <div className="text-xs text-zinc-500 mt-0.5 font-mono">{step.desc}</div>
                  )}
                </div>
                {status === "done" && (
                  <span className="text-xs text-emerald-600 shrink-0">✓ done</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Installer wizard (MSI only) */}
      {tab === "msi" && wizardStep !== null && (
        <div className="rounded-xl border border-orange-500/20 bg-zinc-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-800/60 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-300">TMA Solutions Setup Wizard</span>
            <span className="text-xs text-zinc-500">{wizardStep + 1} / {WIZARD_STEPS.length}</span>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-bold text-zinc-100 mb-3">{WIZARD_STEPS[wizardStep].title}</h3>
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono mb-5 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              {WIZARD_STEPS[wizardStep].content}
            </pre>
            <div className="flex justify-between">
              <button
                onClick={() => setWizardStep((s) => Math.max(0, (s ?? 0) - 1))}
                disabled={wizardStep === 0}
                className="text-xs px-4 py-2 border border-zinc-700 text-zinc-400 hover:border-zinc-600 disabled:opacity-30 rounded-lg transition-colors"
              >
                ← Back
              </button>
              <div className="flex gap-1">
                {WIZARD_STEPS.map((_, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full inline-block ${i === wizardStep ? "bg-orange-400" : "bg-zinc-700"}`} />
                ))}
              </div>
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <button
                  onClick={() => setWizardStep((s) => (s ?? 0) + 1)}
                  className="text-xs px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => setWizardStep(null)}
                  className="text-xs px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-lg transition-colors"
                >
                  Finish ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!currentStatuses.length && !running[tab] && (
        <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center text-zinc-600 text-sm">
          Click <span className="text-orange-400 font-medium">▶ Run Pipeline</span> to simulate the build process
        </div>
      )}
    </div>
  );
}
