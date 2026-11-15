"use client"

import * as React from "react"
import EtchedAccretion, {
  type AccretionParams,
  type AccretionPreset,
} from "@/components/ui/etched-accretion"
import ExperimentLabView, { ScenarioData } from "@/components/experiment-lab-view"
import OutcomeMapView from "@/components/outcome-map-view"
import CompareView, { ScenarioItem } from "@/components/compare-view"
import SourcesLimitsView from "@/components/sources-limits-view"
import {
  Flame,
  Layers,
  Map as MapIcon,
  Scale,
  BookOpen,
  Activity,
  CheckCircle2,
  ArrowRight,
  Compass,
  Gauge,
  Sparkles,
  X,
  ChevronLeft,
  Info,
} from "lucide-react"

type ActiveView = "home" | "lab" | "map" | "compare" | "sources"

// Self-contained inline vector previews for environment presets (no external network dependencies)
function OrbitPresetIcon() {
  return (
    <svg viewBox="0 0 100 60" className="h-full w-full bg-slate-950/80">
      <defs>
        <radialGradient id="orbitGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="30" r="13" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
      <ellipse cx="50" cy="30" rx="34" ry="11" fill="none" stroke="#7dd3fc" strokeWidth="1.2" strokeDasharray="3,2" transform="rotate(-15, 50, 30)" />
      <circle cx="24" cy="24" r="3" fill="#38bdf8" />
      <circle cx="50" cy="30" r="20" fill="url(#orbitGlow)" pointerEvents="none" />
    </svg>
  )
}

function AtmospherePresetIcon() {
  return (
    <svg viewBox="0 0 100 60" className="h-full w-full bg-slate-950/80">
      <rect x="22" y="10" width="56" height="40" rx="6" fill="#18181b" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,2" />
      <circle cx="50" cy="30" r="10" fill="#f59e0b" fillOpacity="0.25" stroke="#fbbf24" strokeWidth="1.5" />
      <circle cx="50" cy="30" r="4" fill="#fbbf24" />
      <line x1="30" y1="30" x2="40" y2="30" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
    </svg>
  )
}

function QuenchPresetIcon() {
  return (
    <svg viewBox="0 0 100 60" className="h-full w-full bg-slate-950/80">
      <ellipse cx="50" cy="30" rx="16" ry="12" fill="#ef4444" fillOpacity="0.2" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3,2" />
      <circle cx="50" cy="30" r="4.5" fill="#fca5a5" />
      <line x1="22" y1="44" x2="78" y2="44" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3,2" />
      <text x="50" y="18" fill="#fca5a5" fontSize="7.5" textAnchor="middle" fontFamily="monospace" fontWeight="bold">QUENCH</text>
    </svg>
  )
}

export default function HomePage() {
  const [activeView, setActiveView] = React.useState<ActiveView>("home")
  const [preset, setPreset] = React.useState<AccretionPreset>("combustion")
  const [oxygen, setOxygen] = React.useState<number>(18.7)
  const [airflow, setAirflow] = React.useState<number>(3.5)
  const [flareFactor, setFlareFactor] = React.useState<number>(1.2)
  const [showHUD, setShowHUD] = React.useState<boolean>(true)

  const [scenarioA, setScenarioA] = React.useState<ScenarioItem | null>(null)
  const [scenarioB, setScenarioB] = React.useState<ScenarioItem | null>(null)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [lowPowerMode, setLowPowerMode] = React.useState<boolean>(false)

  // Auto-detect reduced-motion setting or mobile viewport for low-power mode
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      if (mq.matches || window.innerWidth < 768) {
        setLowPowerMode(true)
      }
      const onChange = (e: MediaQueryListEvent) => {
        if (e.matches) setLowPowerMode(true)
      }
      mq.addEventListener("change", onChange)
      return () => mq.removeEventListener("change", onChange)
    }
  }, [])

  // Handler for instant microgravity condition presets (No external Unsplash links)
  const handleApplyPreset = (type: "orbit" | "atmosphere" | "combustion") => {
    if (type === "orbit") {
      setPreset("glacier")
      setOxygen(21.0)
      setAirflow(5.0)
      setFlareFactor(1.0)
      setToastMessage("ISS Orbit Ambient applied: 21.0% O₂ • 5.0 cm/s flow")
    } else if (type === "atmosphere") {
      setPreset("combustion")
      setOxygen(18.7)
      setAirflow(3.5)
      setFlareFactor(1.35)
      setToastMessage("BASS-II Glovebox Chamber applied: 18.7% O₂ • 3.5 cm/s flow")
    } else {
      setPreset("ember")
      setOxygen(16.4)
      setAirflow(1.0)
      setFlareFactor(0.7)
      setToastMessage("Radiative Quench Edge applied: 16.4% O₂ • 1.0 cm/s flow")
    }
    setTimeout(() => setToastMessage(null), 3500)
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleSaveScenarioA = (s: ScenarioData) => {
    setScenarioA({
      ...s,
      presetRef: `Lab (${s.oxygen.toFixed(1)}% O₂, ${s.airflow.toFixed(2)} cm/s)`,
    })
    showToast("✓ Saved current conditions to Scenario A (Viewable in Compare)")
  }

  const handleSaveScenarioB = (s: ScenarioData) => {
    setScenarioB({
      ...s,
      presetRef: `Lab (${s.oxygen.toFixed(1)}% O₂, ${s.airflow.toFixed(2)} cm/s)`,
    })
    showToast("✓ Saved current conditions to Scenario B (Viewable in Compare)")
  }

  // Dynamically map real ISS combustion parameters to WebGL shader properties
  const dynamicParams = React.useMemo<Partial<AccretionParams>>(() => {
    const o2Norm = Math.max(0, Math.min(1, (oxygen - 16.0) / 5.0))
    const flowNorm = Math.max(0.1, airflow / 5.0)

    return {
      speed: 0.5 + flowNorm * 0.9,
      shear: 0.6 + flowNorm * 0.7,
      flare: flareFactor,
      crimson: 0.45 + o2Norm * 0.4,
      exposure: 0.9 + o2Norm * 0.5,
      doppler: 0.2 + flowNorm * 0.15,
    }
  }, [oxygen, airflow, flareFactor])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#040206] text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full border border-emerald-500/40 bg-zinc-950/95 px-5 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 
        ========================================================================
        PERSISTENT UNIFIED BLACK HOLE / COMBUSTION WEBGL2 CANVAS (BACKGROUND)
        This stays alive across ALL views so there is never a flat boring black screen!
        ========================================================================
      */}
      <div className="fixed inset-0 z-0 h-screen w-full overflow-hidden">
        <EtchedAccretion
          height="100vh"
          preset={preset}
          params={dynamicParams}
          renderScale={lowPowerMode ? 0.55 : 1.0}
          interactive={activeView === "home"}
          className="w-full h-full"
        />
      </div>

      {/* 
        ========================================================================
        DARK GRADIENT OVERLAY (85% Black on Left to Transparent on Right)
        Protects text readability over bright golden swirl while keeping 3D swirl 
        fully visible on the right side.
        ========================================================================
      */}
      {activeView === "home" && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-black/85 via-black/60 to-black/35 lg:bg-gradient-to-r lg:from-black/85 lg:via-black/50 lg:to-transparent lg:w-[62%] w-full"
          aria-hidden="true"
        />
      )}

      {/* 
        ========================================================================
        VIEW 1: HOME PAGE (ONLY CONTAINS THE BLACK HOLE UI & SLEEK CONTROLS)
        ========================================================================
      */}
      {activeView === "home" && (
        <div className="relative z-10 flex min-h-screen flex-col justify-between p-4 sm:p-8 lg:p-10 pointer-events-none">
          {/* Header Bar */}
          <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 rounded-2xl border border-orange-500/35 bg-black/75 px-4 py-2 backdrop-blur-xl shadow-xl shadow-black/80">
              <div className="flex items-center justify-center flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="Ignis Atelier logo"
                  className="h-[44px] w-auto object-contain transition-transform duration-300 hover:scale-105"
                  height={44}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className="font-extrabold tracking-tight text-amber-300 text-lg sm:text-2xl"
                    style={{
                      textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    Ignis Atelier
                  </h1>
                  <span
                    className="rounded-full border border-orange-400/80 bg-orange-950/90 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-orange-200 shadow-md"
                  >
                    Data: NASA BASS-II
                  </span>
                </div>
                <p
                  className="text-xs sm:text-sm font-semibold text-amber-200/90 mt-0.5 tracking-wide"
                  style={{
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                  }}
                >
                  See what real ISS flame experiments measured, and exactly where the evidence stops.
                </p>
              </div>
            </div>

            {/* Navigation Pills to Open Features */}
            <nav className="flex items-center gap-1.5 rounded-full border border-white/25 bg-black/80 p-1.5 backdrop-blur-xl shadow-xl shadow-black/80">
              <button
                onClick={() => setActiveView("lab")}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:text-white hover:bg-white/15 transition-all"
                style={{ textShadow: "0 1px 3px #000" }}
              >
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span>Lab</span>
              </button>

              <button
                onClick={() => setActiveView("map")}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:text-white hover:bg-white/15 transition-all"
                style={{ textShadow: "0 1px 3px #000" }}
              >
                <MapIcon className="h-3.5 w-3.5 text-sky-400" />
                <span>Outcome Map</span>
              </button>

              <button
                onClick={() => setActiveView("compare")}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:text-white hover:bg-white/15 transition-all"
                style={{ textShadow: "0 1px 3px #000" }}
              >
                <Scale className="h-3.5 w-3.5 text-purple-400" />
                <span>Compare</span>
                {(scenarioA || scenarioB) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                )}
              </button>

              <button
                onClick={() => setActiveView("sources")}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:text-white hover:bg-white/15 transition-all"
                style={{ textShadow: "0 1px 3px #000" }}
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>Sources & Limits</span>
              </button>

              {/* Low-Power Eco Mode Toggle */}
              <button
                onClick={() => setLowPowerMode(!lowPowerMode)}
                className={`ml-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                  lowPowerMode
                    ? "border-emerald-400 bg-emerald-950/70 text-emerald-200"
                    : "border-white/20 text-amber-200 hover:bg-white/15 hover:text-white"
                }`}
                title="Toggle shader resolution scale"
                style={{ textShadow: "0 1px 3px #000" }}
              >
                {lowPowerMode ? "Eco Mode" : "Full Quality"}
              </button>

              {/* Shader HUD Toggle */}
              <button
                onClick={() => setShowHUD(!showHUD)}
                className="ml-1 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-white/15 hover:text-white"
                style={{ textShadow: "0 1px 3px #000" }}
              >
                {showHUD ? "Hide Controls" : "Controls"}
              </button>
            </nav>
          </header>

          {/* Hero Core Content & Narrative */}
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8 pb-4">
            {/* Headline and Narrative (With dark gradient behind, high contrast typography) */}
            <div className="max-w-xl pointer-events-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/60 bg-orange-950/80 px-4 py-1.5 mb-4 backdrop-blur-md shadow-lg shadow-orange-950/50">
                <Sparkles className="h-4 w-4 text-orange-400" />
                <span
                  className="text-xs font-mono font-bold text-orange-200 uppercase tracking-widest"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  Flame in Freefall • ISS Microgravity Lab
                </span>
              </div>

              <h2
                className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-[1.08]"
                style={{
                  textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                }}
              >
                Where fire burns as a{" "}
                <span
                  className="font-serif italic font-extrabold text-white"
                  style={{
                    textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                  }}
                >
                  sphere
                </span>
                <span className="text-white">.</span>
              </h2>

              <p
                className="mt-4 text-base sm:text-lg font-medium text-slate-100 leading-relaxed max-w-xl"
                style={{
                  textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                }}
              >
                In microgravity, buoyant convection stops. Heat loss and diffusion shape
                the reaction zone into slow, round flames. In the fabric tests, flames
                quenched at low airflow, at final speeds of about 2 to 5 cm/s, and the
                limit shifts with oxygen and material.
              </p>

              {/* Interaction hints */}
              <div className="mt-5 flex flex-wrap gap-3 text-xs font-mono text-amber-200">
                <span
                  className="flex items-center gap-2 bg-black/60 px-3.5 py-1.5 rounded-full border border-orange-500/30 backdrop-blur-md font-semibold"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  <Compass className="h-4 w-4 text-orange-400" />
                  Drag pointer for 3D parallax
                </span>
                <span
                  className="flex items-center gap-2 bg-black/60 px-3.5 py-1.5 rounded-full border border-orange-500/30 backdrop-blur-md font-semibold"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  <Activity className="h-4 w-4 text-red-400" />
                  Hold click to pull the rings closer
                </span>
              </div>

              {/* High-Impact Action Pill Buttons */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveView("lab")}
                  className="flex items-center gap-2.5 rounded-full bg-white hover:bg-slate-100 px-6 py-3 text-xs font-extrabold text-[#050505] shadow-xl shadow-black/80 transition-all hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Flame className="h-4 w-4 text-orange-600" />
                  <span>Open Lab</span>
                  <svg
                    className="w-3.5 h-3.5 text-[#050505]"
                    viewBox="0 0 12 10"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M0.8 5h10M7.1 1.4 10.9 5l-3.8 3.6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setActiveView("map")}
                  className="flex items-center gap-2 rounded-full border border-white/25 bg-black/80 hover:bg-black/95 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:border-white/40 shadow-md"
                >
                  <MapIcon className="h-4 w-4 text-sky-400" />
                  <span>Outcome Map</span>
                </button>

                <button
                  onClick={() => setActiveView("compare")}
                  className="flex items-center gap-2 rounded-full border border-white/25 bg-black/80 hover:bg-black/95 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:border-white/40 shadow-md"
                >
                  <Scale className="h-4 w-4 text-purple-400" />
                  <span>Compare Scenarios</span>
                </button>

                <button
                  onClick={() => setActiveView("sources")}
                  className="flex items-center gap-2 rounded-full border border-white/25 bg-black/80 hover:bg-black/95 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:border-white/40 shadow-md"
                >
                  <BookOpen className="h-4 w-4 text-amber-400" />
                  <span>Sources & Limits</span>
                </button>
              </div>

              {/* Mission-Control Stat Chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-1.5 bg-black/80 px-3 py-1.5 rounded-lg border border-white/15 text-slate-200 font-semibold shadow">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  83 Published ISS Runs (31 Fabric / 52 PMMA)
                </span>
                <span className="flex items-center gap-1.5 bg-black/80 px-3 py-1.5 rounded-lg border border-white/15 text-slate-200 font-semibold shadow">
                  <BookOpen className="h-3.5 w-3.5 text-sky-400" />
                  2 Sources (NASA NTRS & Scientific Reports)
                </span>
                <span className="flex items-center gap-1.5 bg-black/80 px-3 py-1.5 rounded-lg border border-white/15 text-slate-200 font-semibold shadow">
                  <Info className="h-3.5 w-3.5 text-amber-400" />
                  Evidence Limit: Low-flow quench 2–5 cm/s
                </span>
              </div>

              {/* Ground-Truth Badge */}
              <div
                className="mt-4 inline-flex items-center gap-2.5 text-xs font-mono font-semibold text-amber-200/90 bg-black/60 px-4 py-2 rounded-full border border-orange-500/30 shadow-md backdrop-blur-md"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none"></span>
                <span>83 Published ISS Runs • 0 AI-generated data points. Visuals between runs are interpolated and flagged. • Zhao et al. (2015) & Link et al. (2018)</span>
              </div>
            </div>

            {/* Interactive Telemetry HUD Card */}
            {showHUD && (
              <div className="pointer-events-auto w-full lg:w-[420px] rounded-2xl border border-white/25 bg-[#090914]/95 p-5 shadow-2xl backdrop-blur-3xl">
                <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-extrabold uppercase tracking-widest text-white">
                      ISS Duct Telemetry
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-orange-300 bg-orange-950/70 px-2 py-0.5 rounded border border-orange-500/30">
                    Published ISS Runs (static dataset)
                  </span>
                </div>

                {/* Primary Combustion Controls */}
                <div className="space-y-4 mb-4">
                  {/* Oxygen Slider */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-white font-bold flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-orange-400" /> Oxygen Level (Primary):
                      </span>
                      <span className="font-mono text-orange-300 font-bold text-sm">
                        {oxygen.toFixed(1)}% O₂
                      </span>
                    </div>
                    <input
                      type="range"
                      min="16.0"
                      max="21.0"
                      step="0.1"
                      value={oxygen}
                      onChange={(e) => setOxygen(parseFloat(e.target.value))}
                      className="w-full accent-orange-500 h-2 bg-zinc-800 rounded-lg cursor-pointer border border-zinc-700"
                    />
                    <div className="flex justify-between text-xs text-slate-200 font-medium mt-1 font-mono">
                      <span>16.0% (Quench edge)</span>
                      <span>21.0% (Ambient)</span>
                    </div>
                  </div>

                  {/* Airflow Slider */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-white font-bold flex items-center gap-1.5">
                        <Compass className="h-4 w-4 text-orange-400" /> Forced Duct Velocity (Primary):
                      </span>
                      <span className="font-mono text-orange-300 font-bold text-sm">
                        {airflow.toFixed(2)} cm/s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="10.0"
                      step="0.1"
                      value={airflow}
                      onChange={(e) => setAirflow(parseFloat(e.target.value))}
                      className="w-full accent-orange-500 h-2 bg-zinc-800 rounded-lg cursor-pointer border border-zinc-700"
                    />
                    <div className="flex justify-between text-xs text-slate-200 font-medium mt-1 font-mono">
                      <span>0.5 cm/s (Quenching)</span>
                      <span>10.0 cm/s (Forced)</span>
                    </div>
                  </div>
                </div>

                {/* Microgravity Condition Quick-Presets (SVG previews, no external images) */}
                <div className="pt-3 border-t border-white/15 mb-4">
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-orange-400" /> Environment Presets:
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-orange-300">
                      Click to load
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Preset 1: ISS Orbit */}
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("orbit")}
                      className={`group relative h-16 overflow-hidden rounded-xl border text-left transition-all ${
                        preset === "glacier" && Math.abs(oxygen - 21.0) < 0.2
                          ? "border-cyan-400 ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-950/60"
                          : "border-white/20 hover:border-white/50"
                      }`}
                      title="Click to apply ISS Orbit Ambient: 21.0% O₂, 5.0 cm/s flow"
                    >
                      <OrbitPresetIcon />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent flex flex-col justify-end p-2 pointer-events-none">
                        <span className="text-xs font-extrabold text-white leading-tight">
                          ISS Orbit
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300 font-bold">
                          21% • 5cm/s
                        </span>
                      </div>
                    </button>

                    {/* Preset 2: Atmosphere / Glovebox */}
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("atmosphere")}
                      className={`group relative h-16 overflow-hidden rounded-xl border text-left transition-all ${
                        preset === "combustion" && Math.abs(oxygen - 18.7) < 0.2
                          ? "border-orange-400 ring-2 ring-orange-400/60 shadow-lg shadow-orange-950/60"
                          : "border-white/20 hover:border-white/50"
                      }`}
                      title="Click to apply BASS-II Glovebox Chamber: 18.7% O₂, 3.5 cm/s flow"
                    >
                      <AtmospherePresetIcon />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent flex flex-col justify-end p-2 pointer-events-none">
                        <span className="text-xs font-extrabold text-white leading-tight">
                          Glovebox
                        </span>
                        <span className="text-[10px] font-mono text-orange-300 font-bold">
                          18.7% • 3.5cm/s
                        </span>
                      </div>
                    </button>

                    {/* Preset 3: Combustion / Quench */}
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("combustion")}
                      className={`group relative h-16 overflow-hidden rounded-xl border text-left transition-all ${
                        preset === "ember" && Math.abs(oxygen - 16.4) < 0.2
                          ? "border-red-400 ring-2 ring-red-400/60 shadow-lg shadow-red-950/60"
                          : "border-white/20 hover:border-white/50"
                      }`}
                      title="Click to apply Radiative Quench Edge: 16.4% O₂, 1.0 cm/s flow"
                    >
                      <QuenchPresetIcon />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent flex flex-col justify-end p-2 pointer-events-none">
                        <span className="text-xs font-extrabold text-white leading-tight">
                          Quench Edge
                        </span>
                        <span className="text-[10px] font-mono text-rose-300 font-bold">
                          16.4% • 1cm/s
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Display options (visual only, no effect on data) */}
                <div className="pt-3 border-t border-white/15 bg-zinc-950/60 p-3 rounded-xl border border-white/10">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Display options (visual only, no effect on data)
                  </div>

                  {/* Accretion Spectrum */}
                  <div className="mb-3">
                    <div className="text-[11px] font-semibold text-slate-400 mb-1">
                      Accretion Spectrum Theme:
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["combustion", "ember", "crimson", "glacier"] as AccretionPreset[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPreset(p)}
                          className={`rounded-lg py-1 text-center text-xs font-bold capitalize transition-all ${
                            preset === p
                              ? "bg-orange-500/30 text-orange-200 border border-orange-400 shadow-sm"
                              : "border border-zinc-700 bg-zinc-900/90 text-slate-300 hover:text-white"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photon Crown Flare */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300 font-medium">Photon Crown Flare:</span>
                      <span className="font-mono text-orange-300 font-bold text-xs">{flareFactor.toFixed(2)}×</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.05"
                      value={flareFactor}
                      onChange={(e) => setFlareFactor(parseFloat(e.target.value))}
                      className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer border border-zinc-700"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        VIEW 2: FEATURES WORKSPACE (EXPERIMENT LAB, OUTCOME MAP, COMPARE, SOURCES)
        RENDERED IN HIGH-TECH FROSTED GLASS OVER THE LIVING ACCRETION DISK!
        This guarantees the black hole continues living behind every feature!
        ========================================================================
      */}
      {activeView !== "home" && (
        <div className="relative z-10 min-h-screen flex flex-col bg-[#030308]/85 backdrop-blur-2xl">
          {/* Glass Top Navigation Bar */}
          <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-[#070712]/95 backdrop-blur-3xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              {/* Return to Singularity / Logo */}
              <button
                onClick={() => setActiveView("home")}
                className="flex items-center gap-3 text-left group"
                title="Return to pure Black Hole view"
              >
                <div className="flex items-center justify-center flex-shrink-0">
                  <img
                    src="/logo.png"
                    alt="Ignis Atelier logo"
                    className="h-[44px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    height={44}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-extrabold tracking-tight text-amber-300 text-base sm:text-lg"
                      style={{ textShadow: "0 2px 4px #000, 0 0 12px rgba(251,191,36,0.5)" }}
                    >
                      Ignis Atelier
                    </span>
                    <span className="rounded-full border border-orange-400/50 bg-orange-950/80 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-orange-200 shadow-md">
                      BASS-II Lab
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/90 flex items-center gap-1 font-semibold group-hover:text-white transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5 text-orange-400" /> Return to Singularity
                  </p>
                </div>
              </button>

              {/* Feature Switcher Tabs */}
              <nav className="flex items-center gap-1.5 rounded-full border border-white/20 bg-zinc-950/90 p-1.5 backdrop-blur-xl shadow-lg">
                <button
                  onClick={() => setActiveView("lab")}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
                    activeView === "lab"
                      ? "bg-white text-black shadow-lg font-extrabold"
                      : "text-slate-100 hover:text-white hover:bg-white/15 font-semibold"
                  }`}
                >
                  <Flame className="h-4 w-4" />
                  <span>Experiment Lab</span>
                </button>

                <button
                  onClick={() => setActiveView("map")}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
                    activeView === "map"
                      ? "bg-white text-black shadow-lg font-extrabold"
                      : "text-slate-100 hover:text-white hover:bg-white/15 font-semibold"
                  }`}
                >
                  <MapIcon className="h-4 w-4" />
                  <span>Outcome Map</span>
                </button>

                <button
                  onClick={() => setActiveView("compare")}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
                    activeView === "compare"
                      ? "bg-white text-black shadow-lg font-extrabold"
                      : "text-slate-100 hover:text-white hover:bg-white/15 font-semibold"
                  }`}
                >
                  <Scale className="h-4 w-4" />
                  <span>Compare</span>
                  {(scenarioA || scenarioB) && (
                    <span className="h-2 w-2 rounded-full bg-purple-400 ring-2 ring-purple-300"></span>
                  )}
                </button>

                <button
                  onClick={() => setActiveView("sources")}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
                    activeView === "sources"
                      ? "bg-white text-black shadow-lg font-extrabold"
                      : "text-slate-100 hover:text-white hover:bg-white/15 font-semibold"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Sources & Limits</span>
                </button>
              </nav>

              {/* Close Button to return Home */}
              <button
                onClick={() => setActiveView("home")}
                className="flex items-center justify-center h-9 w-9 rounded-full border border-white/20 bg-zinc-900/90 text-white hover:bg-white hover:text-black transition-all shadow-md"
                title="Return to Black Hole"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Feature Body Container (Deep Frosted Glass Workspace) */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
            <div className="rounded-3xl border border-white/25 bg-[#090916]/95 backdrop-blur-3xl p-6 sm:p-8 shadow-2xl shadow-black">
              {activeView === "lab" && (
                <ExperimentLabView
                  onSaveScenarioA={handleSaveScenarioA}
                  onSaveScenarioB={handleSaveScenarioB}
                />
              )}

              {activeView === "map" && (
                <OutcomeMapView
                  scenarioA={scenarioA ? { oxygen: scenarioA.oxygen, airflow: scenarioA.airflow } : null}
                  scenarioB={scenarioB ? { oxygen: scenarioB.oxygen, airflow: scenarioB.airflow } : null}
                />
              )}

              {activeView === "compare" && (
                <CompareView
                  scenarioA={scenarioA}
                  scenarioB={scenarioB}
                  onUpdateScenarioA={setScenarioA}
                  onUpdateScenarioB={setScenarioB}
                  onNavigateToLab={() => setActiveView("lab")}
                />
              )}

              {activeView === "sources" && <SourcesLimitsView />}
            </div>
          </main>

          {/* Ambient Glass Footer */}
          <footer className="border-t border-white/20 bg-black/85 backdrop-blur-xl py-6 px-4 text-center text-xs text-slate-200">
            <div className="flex flex-wrap justify-center items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.jpg"
                  alt="Ignis Atelier"
                  className="h-5 w-5 rounded-md object-cover border border-orange-500/40"
                />
                <span className="font-bold text-white">Ignis Atelier</span>
              </div>
              <span className="text-slate-400">•</span>
              <span className="font-medium text-slate-200">Microgravity Fire Experiment Lab</span>
              <span className="text-slate-400">•</span>
              <button
                onClick={() => setActiveView("home")}
                className="text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-2"
              >
                Return to Singularity Core ↑
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  )
}
