"use client"

import * as React from "react"
import EtchedAccretion, {
  type AccretionParams,
  type AccretionPreset,
} from "@/components/ui/etched-accretion"
import {
  Flame,
  Wind,
  Gauge,
  Activity,
  Sparkles,
  Compass,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react"

// Bundled local preview backgrounds (no external hotlinks)
const SPACE_STATION_IMG = "/logo.png"
const ORBIT_EARTH_IMG = "/logo.png"
const ROCKET_FIRE_IMG = "/logo.png"

export default function VahniAccretionHero({
  onNavigate,
  height = "100vh",
}: {
  onNavigate?: (tab: string) => void
  height?: string
} = {}) {
  const [preset, setPreset] = React.useState<AccretionPreset>("combustion")
  const [oxygen, setOxygen] = React.useState<number>(18.7)
  const [airflow, setAirflow] = React.useState<number>(3.5)
  const [flareFactor, setFlareFactor] = React.useState<number>(1.2)
  const [showHUD, setShowHUD] = React.useState<boolean>(true)

  // Dynamically map real ISS combustion parameters to WebGL shader properties
  const dynamicParams = React.useMemo<Partial<AccretionParams>>(() => {
    // Oxygen % (16-21) controls flame brightness, crimson vibrancy, and exposure
    const o2Norm = Math.max(0, Math.min(1, (oxygen - 16.0) / 5.0))
    // Airflow (0.5 - 10 cm/s) drives orbital rotation speed and shear
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
    <div className="relative w-full overflow-hidden bg-[#040206]" style={{ height }}>
      {/* Background WebGL2 Canvas */}
      <EtchedAccretion
        height="100%"
        preset={preset}
        params={dynamicParams}
        interactive={true}
        className="transition-colors duration-1000"
      >
        <div className="pointer-events-none flex h-full flex-col justify-between p-6 sm:p-10 z-20">
          {/* Header Bar */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-4">
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
                  <h2
                    className="font-extrabold tracking-tight text-amber-300 text-lg sm:text-2xl"
                    style={{
                      textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    Ignis Atelier
                  </h2>
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

            {/* Quick Preset Selector */}
            <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/80 p-1.5 backdrop-blur-xl shadow-xl">
              {(["combustion", "ember", "crimson", "glacier"] as AccretionPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition-all ${
                    preset === p
                      ? "bg-amber-300 text-black shadow-md font-extrabold"
                      : "text-amber-200/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setShowHUD(!showHUD)}
                className="ml-2 rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-amber-200 hover:bg-white/15 hover:text-white"
              >
                {showHUD ? "Hide Controls" : "Controls"}
              </button>
            </div>
          </div>

          {/* Center / Bottom Layout */}
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8 pb-4">
            {/* Title & Narrative (High-Visibility Glow) */}
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
              <h1
                className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-[1.08]"
                style={{
                  textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                }}
              >
                Where fire burns as a{" "}
                <span
                  className="font-serif italic font-extrabold text-[#ffa028]"
                  style={{
                    textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                  }}
                >
                  sphere
                </span>
                <span className="text-white">.</span>
              </h1>
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
              <div className="mt-6 flex flex-wrap gap-3 text-xs font-mono text-amber-200">
                <span
                  className="flex items-center gap-2 bg-black/60 px-3.5 py-1.5 rounded-full border border-orange-500/30 backdrop-blur-md font-semibold"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  <Compass className="h-4 w-4 text-orange-400" />
                  Drag pointer for parallax
                </span>
                <span
                  className="flex items-center gap-2 bg-black/60 px-3.5 py-1.5 rounded-full border border-orange-500/30 backdrop-blur-md font-semibold"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  <Activity className="h-4 w-4 text-red-400" />
                  Hold click to pull the rings closer
                </span>
              </div>

              {/* Navigation Action Buttons */}
              {onNavigate && (
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onNavigate("lab")}
                    className="flex items-center gap-2.5 rounded-full bg-[#fdfdfd] hover:bg-white px-5 py-2.5 text-xs font-semibold text-[#050505] shadow-lg shadow-black/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Launch Experiment Lab</span>
                    <svg className="w-3 h-3 text-[#050505]" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                      <path d="M0.8 5h10M7.1 1.4 10.9 5l-3.8 3.6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <button
                    onClick={() => onNavigate("map")}
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 hover:bg-black/80 px-4 py-2.5 text-xs font-medium text-zinc-200 backdrop-blur-md transition-all hover:border-white/30"
                  >
                    <Compass className="h-3.5 w-3.5 text-sky-400" />
                    <span>Outcome Map</span>
                  </button>

                  <button
                    onClick={() => onNavigate("compare")}
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 hover:bg-black/80 px-4 py-2.5 text-xs font-medium text-zinc-200 backdrop-blur-md transition-all hover:border-white/30"
                  >
                    <Activity className="h-3.5 w-3.5 text-purple-400" />
                    <span>Compare Scenarios</span>
                  </button>

                  <button
                    onClick={() => onNavigate("sources")}
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 hover:bg-black/80 px-4 py-2.5 text-xs font-medium text-zinc-200 backdrop-blur-md transition-all hover:border-white/30"
                  >
                    <Info className="h-3.5 w-3.5 text-amber-400" />
                    <span>Sources & Limits</span>
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Telemetry HUD Card */}
            {showHUD && (
              <div className="pointer-events-auto w-full lg:w-96 rounded-2xl border border-white/15 bg-black/75 p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                      ISS Duct Telemetry
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-orange-400">
                    Live Shader Coupling
                  </span>
                </div>

                {/* Oxygen Slider */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-zinc-500" /> Oxygen Level:
                    </span>
                    <span className="font-mono text-white font-semibold">
                      {oxygen.toFixed(1)}% O₂
                    </span>
                  </div>
                  <input
                    type="range"
                    min="16.4"
                    max="21.0"
                    step="0.1"
                    value={oxygen}
                    onChange={(e) => setOxygen(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                    <span>16.4% (Quench threshold)</span>
                    <span>21.0% (Ambient)</span>
                  </div>
                </div>

                {/* Airflow Slider */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Wind className="h-3.5 w-3.5 text-zinc-500" /> Forced Flow Speed:
                    </span>
                    <span className="font-mono text-white font-semibold">
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
                    className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                    <span>0.5 cm/s (Quench zone)</span>
                    <span>10.0 cm/s (Forced)</span>
                  </div>
                </div>

                {/* Solar Corona / Flare */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-zinc-500" /> Photon Crown Flare:
                    </span>
                    <span className="font-mono text-white font-semibold">
                      {flareFactor.toFixed(2)}×
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={flareFactor}
                    onChange={(e) => setFlareFactor(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Microgravity Condition Quick-Presets (No external Unsplash links) */}
                <div className="pt-3 border-t border-white/20">
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-orange-400" /> Presets:
                    </span>
                    <span className="text-[10px] font-mono text-orange-300 font-bold">
                      Click to apply
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPreset("glacier")
                        setOxygen(21.0)
                        setAirflow(5.0)
                        setFlareFactor(1.0)
                      }}
                      className="group relative h-14 overflow-hidden rounded-xl border border-white/25 hover:border-cyan-400 transition-all text-left"
                      title="Load ISS Orbit Ambient condition (21.0% O₂, 5.0 cm/s)"
                    >
                      <img
                        src={SPACE_STATION_IMG}
                        alt="ISS Orbit"
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 flex flex-col justify-end p-1.5">
                        <span className="text-xs font-extrabold text-white">ISS Orbit</span>
                        <span className="text-[9px] font-mono text-cyan-300 font-bold">21% • 5cm/s</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPreset("combustion")
                        setOxygen(18.7)
                        setAirflow(3.5)
                        setFlareFactor(1.35)
                      }}
                      className="group relative h-14 overflow-hidden rounded-xl border border-white/25 hover:border-orange-400 transition-all text-left"
                      title="Load BASS-II Glovebox Chamber condition (18.7% O₂, 3.5 cm/s)"
                    >
                      <img
                        src={ORBIT_EARTH_IMG}
                        alt="Atmosphere"
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 flex flex-col justify-end p-1.5">
                        <span className="text-xs font-extrabold text-white">Atmosphere</span>
                        <span className="text-[9px] font-mono text-orange-300 font-bold">18.7% • 3.5cm/s</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPreset("ember")
                        setOxygen(16.4)
                        setAirflow(1.0)
                        setFlareFactor(0.7)
                      }}
                      className="group relative h-14 overflow-hidden rounded-xl border border-white/25 hover:border-rose-400 transition-all text-left"
                      title="Load Quench Edge condition (16.4% O₂, 1.0 cm/s)"
                    >
                      <img
                        src={ROCKET_FIRE_IMG}
                        alt="Combustion"
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 flex flex-col justify-end p-1.5">
                        <span className="text-xs font-extrabold text-white">Combustion</span>
                        <span className="text-[9px] font-mono text-rose-300 font-bold">16.4% • 1cm/s</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Footnote */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-200 font-medium">
                  <Info className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                  <span>Real experimental ground-truth: 83 rows, 0 predictions.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </EtchedAccretion>
    </div>
  )
}
