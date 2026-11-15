"use client"

import * as React from "react"
import { MEASUREMENTS, MeasurementRow } from "@/lib/dataset"
import {
  computeEvidenceStatus,
  formatPressure,
  formatSpreadRate,
  formatAirflow,
  EXACT_O2_DIFF,
  EXACT_FLOW_DIFF,
} from "@/lib/matching"
import { Flame, Wind, Layers, BookmarkPlus, Info, Download, Crosshair, CheckCircle2 } from "lucide-react"

export interface ScenarioData {
  material: string
  familyName: string
  oxygen: number
  airflow: number
  diameter: string
}

interface ExperimentLabViewProps {
  onSaveScenarioA: (s: ScenarioData) => void
  onSaveScenarioB: (s: ScenarioData) => void
}

export default function ExperimentLabView({
  onSaveScenarioA,
  onSaveScenarioB,
}: ExperimentLabViewProps) {
  const [materialFamily, setMaterialFamily] = React.useState<"fabric" | "pmma">("fabric")
  const [diameterFilter, setDiameterFilter] = React.useState<string>("All")
  const [oxygen, setOxygen] = React.useState<number>(18.7)
  const [airflow, setAirflow] = React.useState<number>(2.5)
  const [saveToast, setSaveToast] = React.useState<string | null>(null)

  // Filter dataset by material family
  const filtered = React.useMemo(() => {
    let rows = MEASUREMENTS.filter((r) =>
      materialFamily === "fabric"
        ? r.material.toLowerCase().includes("fabric")
        : r.material.toLowerCase().includes("pmma")
    )
    if (materialFamily === "pmma" && diameterFilter !== "All") {
      rows = rows.filter((r) => r.sample_size_cm === diameterFilter)
    }
    return rows
  }, [materialFamily, diameterFilter])

  // Get min/max bounds
  const bounds = React.useMemo(() => {
    const o2Vals = filtered.map((r) => parseFloat(r.oxygen_percent)).filter((v) => !isNaN(v))
    const flowVals = filtered.map((r) => parseFloat(r.airflow_end_cm_s)).filter((v) => !isNaN(v))
    return {
      minO2: Math.min(...o2Vals),
      maxO2: Math.max(...o2Vals),
      minFlow: Math.min(...flowVals),
      maxFlow: Math.max(...flowVals),
    }
  }, [filtered])

  // Sync sliders when bounds change
  React.useEffect(() => {
    if (oxygen < bounds.minO2) setOxygen(bounds.minO2)
    if (oxygen > bounds.maxO2) setOxygen(bounds.maxO2)
    if (airflow < bounds.minFlow) setAirflow(bounds.minFlow)
    if (airflow > bounds.maxFlow) setAirflow(bounds.maxFlow)
  }, [bounds])

  // Compute Evidence Status
  const { status, message, top3 } = React.useMemo(() => {
    return computeEvidenceStatus(filtered, oxygen, airflow)
  }, [filtered, oxygen, airflow])

  const handleSave = (target: "A" | "B") => {
    const data: ScenarioData = {
      material: materialFamily === "fabric" ? "SIBAL Cotton-Fiberglass Fabric" : "PMMA Rod",
      familyName:
        materialFamily === "fabric"
          ? "SIBAL Fabric (Flat Thin Sheet, Concurrent Flow)"
          : "PMMA Cylindrical Rods (Opposed Flow)",
      oxygen,
      airflow,
      diameter: materialFamily === "pmma" ? `${diameterFilter} cm` : "1.2 & 2.2 cm width",
    }
    if (target === "A") onSaveScenarioA(data)
    else onSaveScenarioB(data)

    setSaveToast(`Saved to Scenario ${target}!`)
    setTimeout(() => setSaveToast(null), 3000)
  }

  // Snap sliders to the nearest measured spaceflight run
  const handleSnapToNearestRun = () => {
    if (!top3 || top3.length === 0) return
    const nearest = top3[0]
    const o2 = parseFloat(nearest.oxygen_percent)
    const flow = parseFloat(nearest.airflow_end_cm_s)
    if (!isNaN(o2)) setOxygen(o2)
    if (!isNaN(flow)) setAirflow(flow)
    setSaveToast(`Snapped to ${nearest.run_id} (${o2}% O₂, ${flow} cm/s)`)
    setTimeout(() => setSaveToast(null), 3000)
  }

  // Export currently matched top 3 runs to CSV with exact 20 source columns
  const handleExportTop3CSV = () => {
    if (!top3 || top3.length === 0) return
    const headers = [
      "run_id",
      "experiment",
      "gravity",
      "material",
      "geometry",
      "flow_direction",
      "sample_size_cm",
      "sample_size_type",
      "sample_id",
      "airflow_start_cm_s",
      "airflow_end_cm_s",
      "oxygen_percent",
      "pressure_atm",
      "outcome",
      "outcome_as_written",
      "flame_spread_rate_1e3_cm_s",
      "delta_t_s",
      "source_title",
      "page_or_figure",
      "notes",
    ]
    const lines = [headers.join(",")]
    top3.forEach((r) => {
      const rowVals = [
        r.run_id,
        r.experiment,
        r.gravity,
        `"${r.material}"`,
        r.geometry,
        r.flow_direction,
        r.sample_size_cm,
        r.sample_size_type,
        r.sample_id,
        r.airflow_start_cm_s,
        r.airflow_end_cm_s,
        r.oxygen_percent,
        r.pressure_atm,
        r.outcome,
        `"${r.outcome_as_written}"`,
        r.flame_spread_rate_1e3_cm_s,
        r.delta_t_s,
        `"${r.source_title}"`,
        `"${r.page_or_figure}"`,
        `"${r.notes.replace(/"/g, '""')}"`,
      ]
      lines.push(rowVals.join(","))
    })
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `experiment_lab_nearest_runs_${materialFamily}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setSaveToast("✓ Exported nearest runs CSV!")
    setTimeout(() => setSaveToast(null), 3000)
  }

  // Microgravity round blue flame scaling
  const normFlow = Math.min(Math.max(airflow / 10.0, 0.15), 2.0)
  const baseRadius = 42 + normFlow * 14
  const flameRx = baseRadius * (1.0 + (normFlow - 0.5) * 0.25)
  const flameRy = baseRadius * (1.0 - (normFlow - 0.5) * 0.15)
  const coreR = Math.max(10, baseRadius * 0.38)
  const opacityOuter = Math.min(0.85, 0.35 + normFlow * 0.25)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" /> Experiment Lab
          </h2>
          <p className="text-sm font-medium text-slate-100 mt-1">
            Select environmental conditions to see exactly what was measured, and where evidence stops.
          </p>
        </div>
        {saveToast && (
          <div className="rounded-xl bg-orange-500/30 border border-orange-400 px-4 py-2 text-xs font-bold text-orange-200 shadow-lg">
            {saveToast}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Controls */}
        <div className="rounded-2xl border border-white/20 bg-[#0e0e1c]/95 p-5 space-y-6 shadow-xl backdrop-blur-xl">
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-white block mb-2">
              1. Material & Geometry Family
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMaterialFamily("fabric")}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                  materialFamily === "fabric"
                    ? "bg-orange-600/30 border-2 border-orange-400 text-white shadow-md shadow-orange-950/40"
                    : "border-zinc-700 bg-zinc-900/90 text-slate-200 hover:text-white hover:border-zinc-500"
                }`}
              >
                SIBAL Fabric
                <span className="block text-[11px] text-slate-300 font-medium mt-0.5">Concurrent flow</span>
              </button>
              <button
                onClick={() => setMaterialFamily("pmma")}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                  materialFamily === "pmma"
                    ? "bg-orange-600/30 border-2 border-orange-400 text-white shadow-md shadow-orange-950/40"
                    : "border-zinc-700 bg-zinc-900/90 text-slate-200 hover:text-white hover:border-zinc-500"
                }`}
              >
                PMMA Rods
                <span className="block text-[11px] text-slate-300 font-medium mt-0.5">Opposed flow</span>
              </button>
            </div>
          </div>

          {materialFamily === "pmma" && (
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-white block mb-2">
                Rod Diameter
              </label>
              <select
                value={diameterFilter}
                onChange={(e) => setDiameterFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-600 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-orange-400"
              >
                <option value="All">All Diameters (0.64, 0.95, 1.27 cm)</option>
                <option value="0.64">0.64 cm (1/4")</option>
                <option value="0.95">0.95 cm (3/8")</option>
                <option value="1.27">1.27 cm (1/2")</option>
              </select>
            </div>
          )}

          {/* Oxygen Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-100 flex items-center gap-1.5 font-bold">
                <Layers className="h-4 w-4 text-orange-400" /> Oxygen Concentration
              </span>
              <span className="font-mono text-orange-300 font-bold text-sm">{oxygen.toFixed(1)}% O₂</span>
            </div>
            <input
              type="range"
              min={bounds.minO2}
              max={bounds.maxO2}
              step="0.1"
              value={oxygen}
              onChange={(e) => setOxygen(parseFloat(e.target.value))}
              className="w-full accent-orange-500 h-2 bg-zinc-800 rounded-lg cursor-pointer border border-zinc-700"
            />
            <div className="flex justify-between text-xs text-slate-200 font-semibold font-mono">
              <span>Tested: {bounds.minO2.toFixed(1)}%</span>
              <span>{bounds.maxO2.toFixed(1)}%</span>
            </div>
          </div>

          {/* Airflow Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-100 flex items-center gap-1.5 font-bold">
                <Wind className="h-4 w-4 text-orange-400" /> Forced Airflow Speed
              </span>
              <span className="font-mono text-orange-300 font-bold text-sm">{airflow.toFixed(2)} cm/s</span>
            </div>
            <input
              type="range"
              min={bounds.minFlow}
              max={bounds.maxFlow}
              step="0.1"
              value={airflow}
              onChange={(e) => setAirflow(parseFloat(e.target.value))}
              className="w-full accent-orange-500 h-2 bg-zinc-800 rounded-lg cursor-pointer border border-zinc-700"
            />
            <div className="flex justify-between text-xs text-slate-200 font-semibold font-mono">
              <span>Tested: {bounds.minFlow.toFixed(2)} cm/s</span>
              <span>{bounds.maxFlow.toFixed(2)} cm/s</span>
            </div>
          </div>

          {/* Save Scenario Buttons */}
          <div className="pt-2 border-t border-white/15 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleSave("A")}
              className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl text-xs font-extrabold shadow-lg transition-transform hover:scale-[1.02]"
            >
              <BookmarkPlus className="h-4 w-4" /> Save Scenario A
            </button>
            <button
              onClick={() => handleSave("B")}
              className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-xs font-extrabold shadow-lg transition-transform hover:scale-[1.02]"
            >
              <BookmarkPlus className="h-4 w-4" /> Save Scenario B
            </button>
          </div>
        </div>

        {/* Center / Flame Visual & Evidence Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Banner */}
          <div
            className={`p-5 rounded-2xl border ${
              status === "Exact match"
                ? "bg-emerald-950/85 border-2 border-emerald-400 text-emerald-100 shadow-xl"
                : status === "Nearby observation"
                ? "bg-amber-950/85 border-2 border-amber-400 text-amber-100 shadow-xl"
                : "bg-zinc-900/90 border-2 border-zinc-600 text-slate-100 shadow-xl"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-2">
              <div className="flex items-center gap-2 font-extrabold text-base">
                <span
                  className={`h-3 w-3 rounded-full ${
                    status === "Exact match"
                      ? "bg-emerald-400 animate-pulse ring-2 ring-emerald-300"
                      : status === "Nearby observation"
                      ? "bg-amber-400 ring-2 ring-amber-300"
                      : "bg-zinc-400"
                  }`}
                />
                Evidence Status: {status}
              </div>
              {top3.length > 0 && status !== "Exact match" && (
                <button
                  onClick={handleSnapToNearestRun}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all shadow"
                  title="Snap sliders to nearest real spaceflight run"
                >
                  <Crosshair className="h-3.5 w-3.5 text-amber-300" />
                  Snap to nearest run ({top3[0].run_id})
                </button>
              )}
            </div>
            <p className="text-xs font-medium text-slate-100 leading-relaxed">{message}</p>
            <div className="mt-2.5 text-xs text-slate-200 font-mono font-medium">
              Thresholds: Exact match (ΔO₂ ≤ {EXACT_O2_DIFF}%, Δflow ≤ {EXACT_FLOW_DIFF} cm/s) • Nearby (distance ≤ 1.0)
            </div>
          </div>

          {/* Flame Visual & Condition Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/20 bg-black/90 p-5 text-center flex flex-col items-center justify-center shadow-xl">
              {/* Measured vs Interpolated Badge */}
              <div className="mb-2 w-full flex justify-center">
                {status === "Exact match" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/60 shadow">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Measured run (within ±0.1% O₂, ±0.2 cm/s of ISS run)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/60 shadow">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Interpolated visual (visual is illustrative; point lies between or outside measured runs)
                  </span>
                )}
              </div>

              <svg width="260" height="170" viewBox="0 0 260 170" className="mx-auto">
                <defs>
                  <radialGradient id="labBlueGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
                    <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.75" />
                    <stop offset="65%" stopColor="#0284c7" stopOpacity={opacityOuter} />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="labInnerCore" cx="50%" cy="50%" r="40%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#bae6fd" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <ellipse cx="130" cy="85" rx={flameRx} ry={flameRy} fill="url(#labBlueGlow)" />
                <circle cx="130" cy="85" r={coreR} fill="url(#labInnerCore)" />
                <line x1="30" y1="150" x2="80" y2="150" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />
                <polygon points="80,146 88,150 80,154" fill="#38bdf8" />
                <text x="96" y="154" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  Flow ({airflow.toFixed(1)} cm/s)
                </text>
              </svg>
              <span className="text-xs text-slate-200 mt-2 block font-medium leading-relaxed">
                Illustrative, not a physical simulation. In microgravity, flames spread as slow spherical blue diffusion envelopes.
              </span>
            </div>

            <div className="rounded-2xl border border-white/20 bg-[#0e0e1c]/95 p-5 space-y-3.5 text-xs shadow-xl">
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">
                Selected Parameters
              </h3>
              <div>
                <span className="text-slate-300 font-semibold block mb-0.5">Material:</span>
                <span className="text-white font-bold text-sm">
                  {materialFamily === "fabric" ? "SIBAL Fabric (Flat Sheet)" : "PMMA Cylindrical Rods"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-300 font-semibold block mb-0.5">Oxygen:</span>
                  <span className="font-mono text-orange-300 font-bold text-sm">{oxygen.toFixed(1)}% O₂</span>
                </div>
                <div>
                  <span className="text-slate-300 font-semibold block mb-0.5">Airflow:</span>
                  <span className="font-mono text-orange-300 font-bold text-sm">{airflow.toFixed(2)} cm/s</span>
                </div>
              </div>
              <div>
                <span className="text-slate-300 font-semibold block mb-0.5">Pressure:</span>
                <span className="text-amber-200 font-bold text-xs">
                  {materialFamily === "fabric" ? "1.0 atm (Glovebox)" : "Pressure: not stated in the source"}
                </span>
              </div>
              <div className="pt-2 border-t border-white/15 text-xs text-slate-100 font-medium flex items-start gap-2">
                <Info className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <span>At low ventilation (1-5 cm/s), radiative heat loss outpaces heat release, causing quenching.</span>
              </div>
            </div>
          </div>

          {/* Closest 3 Measured Rows */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Closest Measured Experimental Rows (Top 3)
              </h3>
              <button
                onClick={handleExportTop3CSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-black transition-all shadow"
                title="Download CSV of the 3 nearest measured runs"
              >
                <Download className="h-3.5 w-3.5" />
                Export Nearest Runs CSV
              </button>
            </div>
            {top3.map((r) => {
              const press = formatPressure(r)
              const flow = formatAirflow(r)
              const spread = formatSpreadRate(r.flame_spread_rate_1e3_cm_s)
              const outcome = r.outcome_as_written || r.outcome || "not_stated"

              return (
                <div
                  key={r.run_id}
                  className="rounded-2xl border border-white/20 bg-[#0e0e1c]/95 p-5 space-y-3 hover:border-orange-500/60 transition-all shadow-xl"
                >
                  <div className="flex justify-between items-center border-b border-white/15 pb-2.5">
                    <div className="font-extrabold text-orange-300 text-base flex items-center gap-2">
                      Run {r.run_id}
                      <span className="text-xs font-semibold text-slate-200">({r.experiment})</span>
                    </div>
                    <span className="font-mono text-xs font-bold bg-white/10 text-white px-2.5 py-1 rounded-md border border-white/20">
                      Dist: {r.distance.toFixed(3)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-300 block text-[11px] font-bold uppercase tracking-wider mb-0.5">Oxygen</span>
                      <span className="font-mono text-white font-bold text-sm">{r.oxygen_percent}% O₂</span>
                    </div>
                    <div>
                      <span className="text-slate-300 block text-[11px] font-bold uppercase tracking-wider mb-0.5">Airflow</span>
                      <span className="font-mono text-white font-bold text-sm">{flow}</span>
                    </div>
                    <div>
                      <span className="text-slate-300 block text-[11px] font-bold uppercase tracking-wider mb-0.5">Pressure</span>
                      <span className="text-amber-200 font-bold text-xs">{press}</span>
                    </div>
                    <div>
                      <span className="text-slate-300 block text-[11px] font-bold uppercase tracking-wider mb-0.5">Outcome</span>
                      <span className="text-white font-extrabold text-xs capitalize bg-white/10 px-2 py-0.5 rounded border border-white/10 inline-block">
                        {outcome}
                      </span>
                    </div>
                  </div>

                  {r.flame_spread_rate_1e3_cm_s && (
                    <div className="text-xs text-slate-100 font-medium">
                      <span className="text-slate-300 font-bold">Spread Rate: </span>
                      <span className="font-mono text-amber-300 font-bold">{spread}</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-200 font-medium">
                    <span className="font-bold text-white">Source:</span> {r.source_title} ({r.page_or_figure})
                  </div>

                  <div className="text-xs bg-zinc-900/90 border-l-4 border-orange-400 p-2.5 rounded-lg text-slate-100 font-medium">
                    <span className="font-bold text-orange-300">Notes: </span>
                    {r.notes || "No additional footnotes in source."}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
