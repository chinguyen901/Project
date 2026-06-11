"use client";
import { useState, useCallback, useRef, useEffect } from "react";

type Tab = "msi" | "android" | "ios";
type StepStatus = "idle" | "running" | "done" | "error";

const ARCH = [
  {
    id: "source", layer: "Source Code", layerSub: "Version Control", chi: false,
    nodes: [
      { icon: "📦", label: "Git Repository", desc: "Versioned source — tagged releases trigger CI/CD pipeline" },
      { icon: "📋", label: "InstallShield ISM", desc: "MSI project file — 842 components, 12 features, 3 custom actions" },
    ],
    conn: { label: "Commit/tag trigger → CI/CD pipeline", proto: "Git webhooks" },
  },
  {
    id: "build", layer: "Build Pipeline", layerSub: "★ Chi Nguyen @ TMA Solutions", chi: true,
    nodes: [
      { icon: "🪟", label: "InstallShield", desc: "MSI authoring — ISM compile, package, custom action scripts" },
      { icon: "🤖", label: "Gradle / Firebase", desc: "Android assembleRelease → APK sign (v2) → Firebase App Distribution" },
      { icon: "🍎", label: "Fastlane / Xcode", desc: "iOS lane :beta → xcodebuild archive → TestFlight upload" },
    ],
    conn: { label: "Signed artifacts → distribution channels", proto: "Authenticode · APK v2 · Apple notarization" },
  },
  {
    id: "sign", layer: "Code Signing", layerSub: "Authenticode · Google Play · Apple", chi: false,
    nodes: [
      { icon: "🔐", label: "Authenticode (MSI)", desc: "SHA-256 EV certificate — TMA Solutions code signing" },
      { icon: "🔑", label: "APK Keystore", desc: "Android release keystore — APK v2 signature scheme" },
      { icon: "🍏", label: "Apple Certificates", desc: "Distribution certificate + provisioning profile — notarized" },
    ],
    conn: { label: "Publish signed builds", proto: "File share · Firebase · TestFlight" },
  },
  {
    id: "dist", layer: "Distribution", layerSub: "Internal & Beta Channels", chi: false,
    nodes: [
      { icon: "🗂", label: "Deploy Server", desc: "\\\\deploy-server\\releases\\v2.4.1\\ — internal MSI distribution" },
      { icon: "📱", label: "Firebase App Dist.", desc: "Android beta — QA team download & install" },
      { icon: "✈", label: "TestFlight", desc: "iOS build 1042 — beta testers + App Store submission" },
    ],
    conn: null,
  },
];

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

const MSI_LOGS = [
  `[BUILD] ► Loading project.ism — InstallShield 2020 Professional`,
  `[BUILD] ► 842 components, 12 features, 3 custom actions loaded`,
  `[COMPILE] ► Compiling InstallScript — 0 errors, 2 warnings`,
  `[PACKAGE] ► Packaging: setup.msi — LZX max compression`,
  `[PACKAGE] ✓ setup.msi created — 142 MB`,
  `[SIGN] ► Signing with Authenticode SHA-256 (TMA Solutions EV certificate)`,
  `[SIGN] ✓ Timestamp applied: http://timestamp.digicert.com`,
  `[SIGN] ✓ Signature verified — certificate chain valid`,
  `[DEPLOY] ► Uploading to \\\\deploy-server\\releases\\v2.4.1\\`,
  `[DEPLOY] ✓ setup.msi deployed — accessible to QA team`,
  `[BUILD] ✓ MSI pipeline complete — build v2.4.1 ready for testing`,
];
const ANDROID_LOGS = [
  `[GRADLE] ► Running assembleRelease — 24 tasks`,
  `[GRADLE] ► 6 tasks up-to-date, 18 tasks executed`,
  `[GRADLE] ✓ BUILD SUCCESSFUL in 2m 34s`,
  `[JUNIT ] ► Running 142 tests (JUnit4)`,
  `[JUNIT ] ✓ 140 passed, 0 failed, 2 skipped`,
  `[SIGN  ] ► Signing APK with release keystore (APK v2 scheme)`,
  `[SIGN  ] ✓ app-release.apk signed and aligned`,
  `[FIREBASE] ► Uploading app-release.apk (38 MB) to Firebase App Distribution`,
  `[FIREBASE] ✓ Build uploaded — QA group notified via email`,
  `[BUILD ] ✓ Android CI/CD complete — build distributed to QA`,
];
const IOS_LOGS = [
  `[PODS  ] ► pod install — resolving 28 dependencies`,
  `[PODS  ] ✓ 4 pods updated, 24 unchanged`,
  `[FASTLANE] ► Executing lane :beta`,
  `[XCODE ] ► xcodebuild archive — scheme: App, config: Release`,
  `[XCODE ] ✓ Archive created: App.xcarchive`,
  `[XCTEST] ► Running 98 test cases`,
  `[XCTEST] ✓ 97 passed, 0 failed, 1 skipped`,
  `[EXPORT] ► Exporting IPA — App Store distribution profile`,
  `[TF    ] ► Uploading app.ipa (52 MB) to TestFlight`,
  `[TF    ] ✓ Build 1042 processing — testers will be notified`,
  `[BUILD ] ✓ iOS pipeline complete — TestFlight build 1042 ready`,
];

const WIZARD_STEPS = [
  { title: "Welcome", content: "Welcome to TMA Solutions Enterprise Suite v2.4.1 Setup Wizard.\n\nThis wizard will guide you through the installation process.\nClick Next to continue." },
  { title: "License Agreement", content: "END USER LICENSE AGREEMENT\n\nThis software is proprietary to TMA Solutions and licensed, not sold...\n\n[✓] I accept the terms of the license agreement" },
  { title: "Destination Folder", content: "Install TMA Solutions Enterprise Suite to:\n\nC:\\Program Files\\TMA Solutions\\Enterprise Suite\\\n\n[Change...]  Required: 348 MB  Available: 120 GB" },
  { title: "Installing", content: "Please wait while the Setup Wizard installs TMA Solutions...\n\n████████████░░░░░░░░ 60%\n\nInstalling: core components..." },
  { title: "Complete", content: "TMA Solutions Enterprise Suite v2.4.1 has been successfully installed.\n\n[✓] Launch TMA Solutions\n[✓] Create desktop shortcut\n\nClick Finish to exit." },
];

function nodeFromLog(line: string, tab: Tab): string | null {
  if (tab === "msi") {
    if (line.startsWith("[BUILD") || line.startsWith("[COMPILE") || line.startsWith("[PACKAGE")) return "InstallShield";
    if (line.startsWith("[SIGN")) return "Authenticode (MSI)";
    if (line.startsWith("[DEPLOY")) return "Deploy Server";
  }
  if (tab === "android") {
    if (line.startsWith("[GRADLE") || line.startsWith("[JUNIT") || line.startsWith("[BUILD")) return "Gradle / Firebase";
    if (line.startsWith("[SIGN")) return "APK Keystore";
    if (line.startsWith("[FIREBASE")) return "Firebase App Dist.";
  }
  if (tab === "ios") {
    if (line.startsWith("[PODS") || line.startsWith("[FASTLANE") || line.startsWith("[XCODE") || line.startsWith("[XCTEST") || line.startsWith("[BUILD")) return "Fastlane / Xcode";
    if (line.startsWith("[EXPORT")) return "Apple Certificates";
    if (line.startsWith("[TF")) return "TestFlight";
  }
  return null;
}

const INTERVAL = 500;

export default function InstallerDemo() {
  const [tab, setTab] = useState<Tab>("msi");
  const [stepStatus, setStepStatus] = useState<Record<Tab, StepStatus[]>>({ msi: [], android: [], ios: [] });
  const [running, setRunning] = useState<Record<Tab, boolean>>({ msi: false, android: false, ios: false });
  const [wizardStep, setWizardStep] = useState<number | null>(null);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [msgCount, setMsgCount] = useState(0);
  const [activeLayerIdx, setActiveLayerIdx] = useState(-1);
  const [activeNodeLabel, setActiveNodeLabel] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [runLogs]);

  const steps = tab === "msi" ? MSI_STEPS : tab === "android" ? ANDROID_STEPS : IOS_STEPS;
  const tabLogs = tab === "msi" ? MSI_LOGS : tab === "android" ? ANDROID_LOGS : IOS_LOGS;

  const runBuild = useCallback(() => {
    setStepStatus(prev => ({ ...prev, [tab]: Array(steps.length).fill("idle" as StepStatus) }));
    setRunning(prev => ({ ...prev, [tab]: true }));
    setWizardStep(null);
    setRunLogs([]);
    setMsgCount(0);
    setActiveLayerIdx(1);
    setActiveNodeLabel(null);

    let i = 0;
    const run = () => {
      if (i >= steps.length) {
        setRunning(prev => ({ ...prev, [tab]: false }));
        setActiveLayerIdx(-1);
        setActiveNodeLabel(null);
        if (tab === "msi") setTimeout(() => setWizardStep(0), 500);
        return;
      }
      setStepStatus(prev => ({
        ...prev,
        [tab]: prev[tab].map((s, idx) => idx === i ? "running" : s),
      }));
      const isErr = false;
      setTimeout(() => {
        const doneIdx = i;
        i++;
        setStepStatus(prev => ({
          ...prev,
          [tab]: prev[tab].map((s, idx) => idx === doneIdx ? (isErr ? "error" : "done") : s),
        }));
        setTimeout(run, 300);
      }, 900 + Math.random() * 400);
    };

    // Stream build logs with node highlighting
    tabLogs.forEach((line, li) => {
      setTimeout(() => {
        setRunLogs(prev => [...prev, line]);
        setMsgCount(prev => prev + 1);
        setActiveNodeLabel(nodeFromLog(line, tab));
      }, li * INTERVAL + 200);
    });

    run();
  }, [tab, steps, tabLogs]);

  const STATUS_ICON: Record<StepStatus, string> = { idle: "○", running: "⏳", done: "✓", error: "✗" };
  const STATUS_COLOR: Record<StepStatus, string> = {
    idle: "text-zinc-700", running: "text-amber-400", done: "text-emerald-400", error: "text-red-400",
  };
  const TAB_COLOR: Record<Tab, string> = {
    msi: "border-orange-500/60 bg-orange-500/10 text-orange-400",
    android: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400",
    ios: "border-blue-500/60 bg-blue-500/10 text-blue-400",
  };
  const currentStatuses = stepStatus[tab];
  const isDone = !running[tab] && currentStatuses.length === steps.length && currentStatuses.every(s => s === "done" || s === "error");

  return (
    <div className="space-y-4">
      {/* Architecture Diagram */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-zinc-100">Build &amp; Release Pipeline</span>
            <span className="ml-3 text-xs text-zinc-500">InstallShield · Gradle · Fastlane · Firebase · TestFlight</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <span className="text-[10px] text-red-400 font-bold">= Chi&apos;s implementation</span>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/20">
          {ARCH.map((layer, i) => (
            <div key={layer.id}>
              <div className={`relative rounded-xl border p-4 transition-all duration-300 ${
                layer.chi
                  ? "border-red-500/60 bg-gradient-to-br from-red-950/50 to-zinc-900 shadow-[0_0_28px_rgba(239,68,68,0.15)]"
                  : activeLayerIdx === i
                  ? "border-orange-500/50 bg-orange-950/20 shadow-[0_0_16px_rgba(249,115,22,0.08)]"
                  : "border-zinc-800 bg-zinc-900/60"
              }`}>
                {layer.chi && (
                  <div className="absolute -top-3 left-3">
                    <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-[10px] font-bold text-red-400">
                      ★ Chi Nguyen — Built &amp; automated at TMA Solutions
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-4 mt-1">
                  <div className="shrink-0 w-36">
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${layer.chi ? "text-red-400" : activeLayerIdx === i ? "text-orange-400" : "text-zinc-500"}`}>{layer.layer}</div>
                    <div className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{layer.layerSub}</div>
                    {activeLayerIdx === i && !layer.chi && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
                        <span className="text-[10px] text-orange-400">building</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {layer.nodes.map(node => {
                      const isActiveNode = activeNodeLabel === node.label;
                      return (
                        <div key={node.label} className={`flex-1 min-w-[130px] px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                          layer.chi
                            ? isActiveNode
                              ? "border-red-400/70 bg-red-500/25 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                              : "border-red-500/30 bg-red-500/10"
                            : isActiveNode
                            ? "border-orange-400/60 bg-orange-500/15 shadow-[0_0_8px_rgba(249,115,22,0.12)]"
                            : activeLayerIdx === i
                            ? "border-orange-500/30 bg-orange-500/5"
                            : "border-zinc-700/60 bg-zinc-800/40"
                        }`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span>{node.icon}</span>
                            <span className={`text-xs font-semibold ${
                              layer.chi
                                ? isActiveNode ? "text-red-100" : "text-red-200"
                                : isActiveNode ? "text-orange-300" : "text-zinc-200"
                            }`}>{node.label}</span>
                            {isActiveNode && (
                              <span className={`ml-auto w-1.5 h-1.5 rounded-full animate-pulse inline-block ${layer.chi ? "bg-red-400" : "bg-orange-400"}`} />
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 leading-tight">{node.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {layer.conn && (
                <div className="flex items-center gap-3 py-0.5 pl-36 ml-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-px h-3 ${activeLayerIdx > i ? "bg-orange-500" : "bg-zinc-700"}`} />
                    <div className={`border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent ${activeLayerIdx > i ? "border-t-orange-500" : "border-t-zinc-700"}`} />
                  </div>
                  <span className="text-[10px] text-zinc-600 italic">
                    {layer.conn.label} <span className="font-mono text-zinc-700">({layer.conn.proto})</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-2">
        {(["msi", "android", "ios"] as Tab[]).map(t => (
          <button key={t}
            onClick={() => { setTab(t); setWizardStep(null); setRunLogs([]); setActiveLayerIdx(-1); setActiveNodeLabel(null); setMsgCount(0); }}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${tab === t ? TAB_COLOR[t] : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"}`}>
            {t === "msi" ? "📦 MSI Build" : t === "android" ? "🤖 Android CI/CD" : "🍎 iOS Pipeline"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Build steps */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
            <span className="text-sm font-semibold text-zinc-200">
              {tab === "msi" ? "InstallShield Build Pipeline" : tab === "android" ? "Android CI/CD — Gradle / Firebase" : "iOS Pipeline — Fastlane / TestFlight"}
            </span>
            <button onClick={runBuild} disabled={running[tab]}
              className={`text-xs px-3 py-1.5 font-semibold rounded-lg transition-colors ${
                running[tab] ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                : tab === "msi" ? "bg-orange-500 hover:bg-orange-400 text-white"
                : tab === "android" ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                : "bg-blue-500 hover:bg-blue-400 text-white"
              }`}>
              {running[tab] ? "Building..." : isDone ? "▶ Rebuild" : "▶ Run Pipeline"}
            </button>
          </div>
          <div className="p-4 space-y-3">
            {steps.map((step, i) => {
              const status = currentStatuses[i] ?? "idle";
              return (
                <div key={step.label} className={`flex items-start gap-3 transition-all ${status === "idle" ? "opacity-40" : ""}`}>
                  <div className={`text-base w-5 shrink-0 mt-0.5 ${STATUS_COLOR[status]}`}>
                    {status === "running" ? <span className="inline-block animate-spin">⟳</span> : STATUS_ICON[status]}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${status === "done" ? "text-zinc-200" : status === "running" ? "text-zinc-100" : "text-zinc-600"}`}>{step.label}</div>
                    {status !== "idle" && <div className="text-xs text-zinc-500 mt-0.5 font-mono">{step.desc}</div>}
                  </div>
                  {status === "done" && <span className="text-xs text-emerald-600 shrink-0">✓ done</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Build log */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Log lines", value: String(msgCount), color: "text-orange-400" },
              { label: "Status", value: running[tab] ? "Building" : isDone ? "Done" : "Idle", color: running[tab] ? "text-amber-400" : isDone ? "text-emerald-400" : "text-zinc-500" },
              { label: "Platform", value: tab.toUpperCase(), color: tab === "msi" ? "text-orange-400" : tab === "android" ? "text-emerald-400" : "text-blue-400" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 text-center">
                <div className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/50 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 inline-block" />
              </div>
              <span className="text-xs font-mono text-zinc-500">ci-runner — build output</span>
              {running[tab] && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />}
            </div>
            <div ref={logContainerRef} className="bg-zinc-950 p-4 h-52 overflow-y-auto font-mono text-[11px] leading-relaxed">
              {runLogs.length === 0 ? (
                <p className="text-zinc-700 italic">Click ▶ Run Pipeline to start the build</p>
              ) : runLogs.map((line, i) => (
                <div key={i} className={
                  line.includes("✓") ? "text-emerald-400" :
                  line.includes("✗") || line.includes("ERROR") ? "text-red-400" :
                  line.startsWith("[SIGN") || line.startsWith("[FIREBASE") || line.startsWith("[TF") ? "text-amber-300/80" :
                  "text-zinc-400"
                }>{line}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Installer wizard (MSI only) */}
      {tab === "msi" && wizardStep !== null && (
        <div className="rounded-xl border border-orange-500/20 bg-zinc-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-800/60 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-300">TMA Solutions Setup Wizard — v2.4.1</span>
            <span className="text-xs text-zinc-500">{wizardStep + 1} / {WIZARD_STEPS.length}</span>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-bold text-zinc-100 mb-3">{WIZARD_STEPS[wizardStep].title}</h3>
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono mb-5 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              {WIZARD_STEPS[wizardStep].content}
            </pre>
            <div className="flex justify-between items-center">
              <button onClick={() => setWizardStep(s => Math.max(0, (s ?? 0) - 1))} disabled={wizardStep === 0}
                className="text-xs px-4 py-2 border border-zinc-700 text-zinc-400 hover:border-zinc-600 disabled:opacity-30 rounded-lg transition-colors">
                ← Back
              </button>
              <div className="flex gap-1">
                {WIZARD_STEPS.map((_, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full inline-block ${i === wizardStep ? "bg-orange-400" : "bg-zinc-700"}`} />
                ))}
              </div>
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <button onClick={() => setWizardStep(s => (s ?? 0) + 1)}
                  className="text-xs px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors">
                  Next →
                </button>
              ) : (
                <button onClick={() => setWizardStep(null)}
                  className="text-xs px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-lg transition-colors">
                  Finish ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
