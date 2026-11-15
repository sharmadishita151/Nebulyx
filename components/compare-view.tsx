"use client"

import * as React from "react"
import { MEASUREMENTS, MeasurementRow } from "@/lib/dataset"
import {
  computeEvidenceStatus,
  formatPressure,
  formatSpreadRate,
  formatAirflow,
} from "@/lib/matching"
import {
  Scale,
  Sparkles,
  Flame,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react"

export interface ScenarioItem {
  material: string
  familyName: string
  oxygen: number
  airflow: number
  diameter: string
  presetRef?: string
}

interface CompareViewProps {
  scenarioA: ScenarioItem | null
  scenarioB: ScenarioItem | null
  onUpdateScenarioA: (s: ScenarioItem | null) => void
  onUpdateScenarioB: (s: ScenarioItem | null) => void
  onNavigateToLab?: () => void
}

export default function CompareView({
  scenarioA,
  scenarioB,
  onUpdateScenarioA,
  onUpdateScenarioB,
  onNavigateToLab,
}: CompareViewProps) {
  // Preset definitions (all exact published rows from measurements_all.csv)
  const presets = [
    {
      id: "p1",
      name: "1. Fabric: Quench Flow vs Steady Spread",
      desc: "GMT45-T4 (quenched at 2.2 cm/s) vs GMT45-T1 (steady spread at 10.0 cm/s)",
      scenA: {
        material: "SIBAL Cotton-Fiberglass Fabric",
        familyName: "SIBAL Fabric (Flat Sheet, Concurrent Flow)",
        oxygen: 18.7,
        airflow: 2.2,
        diameter: "2.2 cm width",
        presetRef: "GMT45-T4 (Quenched at 2.2 cm/s)",
      },
      scenB: {
        material: "SIBAL Cotton-Fiberglass Fabric",
        familyName: "SIBAL Fabric (Flat Sheet, Concurrent Flow)",
        oxygen: 18.5,
        airflow: 10.0,
        diameter: "2.2 cm width",
        presetRef: "GMT45-T1 (Steady spread at 10.0 cm/s)",
      },
    },
    {
      id: "p2",
      name: "2. Fabric: Low-Speed Quench vs High-Speed Blowoff",
      desc: "GMT100-T13 (quenched at 2.2 cm/s) vs GMT190-T21 (blow-off at 47.0 cm/s)",
      scenA: {
        material: "SIBAL Cotton-Fiberglass Fabric",
        familyName: "SIBAL Fabric (Flat Sheet, Concurrent Flow)",
        oxygen: 17.5,
        airflow: 2.2,
        diameter: "2.2 cm width",
        presetRef: "GMT100-T13 (Quenched at 2.2 cm/s, 17.5% O₂)",
      },
      scenB: {
        material: "SIBAL Cotton-Fiberglass Fabric",
        familyName: "SIBAL Fabric (Flat Sheet, Concurrent Flow)",
        oxygen: 17.2,
        airflow: 47.0,
        diameter: "1.2 cm width",
        presetRef: "GMT190-T21 (Blow-off at 47.0 cm/s, 17.2% O₂)",
      },
    },
    {
      id: "p3",
      name: "3. PMMA Rod (0.64 cm): Low vs High Opposed Flow",
      desc: "S1-B16-4 (0.72 cm/s flow) vs S1-B16-1 (7.55 cm/s flow)",
      scenA: {
        material: "PMMA Rod",
        familyName: "PMMA Cylindrical Rods (Opposed Flow)",
        oxygen: 18.2,
        airflow: 0.72,
        diameter: "0.64 cm",
        presetRef: "S1-B16-4 (Spread rate 5.68 × 10⁻³ cm/s at 0.72 cm/s flow)",
      },
      scenB: {
        material: "PMMA Rod",
        familyName: "PMMA Cylindrical Rods (Opposed Flow)",
        oxygen: 18.2,
        airflow: 7.55,
        diameter: "0.64 cm",
        presetRef: "S1-B16-1 (Spread rate 6.78 × 10⁻³ cm/s at 7.55 cm/s flow)",
      },
    },
    {
      id: "p4",
      name: "4. Cross-Material Pair: Fabric Sheet vs PMMA Cylinder",
      desc: "GMT45-T4 (Fabric sheet) vs S1-B4-1 (PMMA 0.95 cm rod)",
      scenA: {
        material: "SIBAL Cotton-Fiberglass Fabric",
        familyName: "SIBAL Fabric (Flat Sheet, Concurrent Flow)",
        oxygen: 18.7,
        airflow: 2.2,
        diameter: "2.2 cm width",
        presetRef: "GMT45-T4 (Fabric sheet)",
      },
      scenB: {
        material: "PMMA Rod",
        familyName: "PMMA Cylindrical Rods (Opposed Flow)",
        oxygen: 18.5,
        airflow: 2.0,
        diameter: "0.95 cm",
        presetRef: "S1-B4-1 (PMMA 0.95 cm rod)",
      },
    },
  ]

  const applyPreset = (preset: (typeof presets)[0]) => {
    onUpdateScenarioA(preset.scenA)
    onUpdateScenarioB(preset.scenB)
  }

  const clearScenarios = () => {
    onUpdateScenarioA(null)
    onUpdateScenarioB(null)
  }

  // Check if materials or geometries differ
  const isCrossMaterial = React.useMemo(() => {
    if (!scenarioA || !scenarioB) return false
    return scenarioA.material !== scenarioB.material || scenarioA.familyName !== scenarioB.familyName
  }, [scenarioA, scenarioB])

  // Delta calculations
  const deltas = React.useMemo(() => {
    if (!scenarioA || !scenarioB) return null
    return {
      dO2: scenarioB.oxygen - scenarioA.oxygen,
      dFlow: scenarioB.airflow - scenarioA.airflow,
    }
  }, [scenarioA, scenarioB])

  // Compute evidence for scenario A
  const evidenceA = React.useMemo(() => {
    if (!scenarioA) return null
    const rows = MEASUREMENTS.filter((r) =>
      scenarioA.material.toLowerCase().includes("fabric")
        ? r.material.toLowerCase().includes("fabric")
        : r.material.toLowerCase().includes("pmma")
    )
    return computeEvidenceStatus(rows, scenarioA.oxygen, scenarioA.airflow)
  }, [scenarioA])

  // Compute evidence for scenario B
  const evidenceB = React.useMemo(() => {
    if (!scenarioB) return null
    const rows = MEASUREMENTS.filter((r) =>
      scenarioB.material.toLowerCase().includes("fabric")
        ? r.material.toLowerCase().includes("fabric")
        : r.material.toLowerCase().includes("pmma")
    )
    return computeEvidenceStatus(rows, scenarioB.oxygen, scenarioB.airflow)
  }, [scenarioB])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Scale className="h-7 w-7 text-sky-400" /> Ignis Atelier: Scenario Comparison
            </h1>
            <span className="rounded-full border border-sky-400/50 bg-sky-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-sky-200">
              Rule-Based
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-100">
            Compare two experimental test environments side-by-side using strictly published NASA BASS-II data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(scenarioA || scenarioB) && (
            <button
              onClick={clearScenarios}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/50 bg-red-500/20 px-3.5 py-2 text-xs font-bold text-red-200 hover:bg-red-500/30 transition-all shadow-md"
            >
              <RotateCcw className="h-4 w-4" /> Clear Scenarios
            </button>
          )}
          {onNavigateToLab && (
            <button
              onClick={onNavigateToLab}
              className="flex items-center gap-1.5 rounded-xl border border-orange-500/50 bg-orange-500/20 px-3.5 py-2 text-xs font-bold text-orange-200 hover:bg-orange-500/30 transition-all shadow-md"
            >
              <Flame className="h-4 w-4" /> Go to Experiment Lab
            </button>
          )}
        </div>
      </div>

      {/* Preset Quick Selectors */}
      <div className="mb-8 rounded-2xl border border-sky-500/30 bg-[#0c1222]/90 p-5 backdrop-blur-xl shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white">
            <Sparkles className="h-4 w-4 text-sky-400" />
            <span>Published NASA Ground-Truth Presets</span>
          </div>
          <span className="text-xs font-semibold text-slate-200">Instant side-by-side verification</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className="group flex flex-col text-left rounded-xl border border-white/15 bg-zinc-950/80 p-3.5 hover:border-sky-400 hover:bg-sky-950/30 transition-all shadow-md"
            >
              <span className="text-xs font-extrabold text-sky-300 group-hover:text-white">
                {p.name}
              </span>
              <span className="mt-1 text-xs text-slate-200 leading-tight font-medium">
                {p.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Empty State Banner if no scenarios */}
      {!scenarioA && !scenarioB ? (
        <div className="rounded-2xl border-2 border-dashed border-white/20 bg-zinc-950/80 p-12 text-center shadow-xl">
          <Scale className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-xl font-extrabold text-white">No Scenarios Loaded</h3>
          <p className="mt-1.5 text-sm text-slate-200 max-w-md mx-auto font-medium">
            Select one of the 4 NASA presets above, or go to the <strong className="text-white">Experiment Lab</strong> to configure custom parameters and click <em className="text-orange-300">Save Scenario A</em> or <em className="text-red-300">Save Scenario B</em>.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => applyPreset(presets[0])}
              className="rounded-xl bg-sky-500 hover:bg-sky-400 px-5 py-2.5 text-xs font-extrabold text-black transition-all shadow-lg"
            >
              Load Preset 1 (Fabric Quench vs Spread)
            </button>
            {onNavigateToLab && (
              <button
                onClick={onNavigateToLab}
                className="rounded-xl border border-white/20 bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-all shadow-md"
              >
                Open Experiment Lab
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Cross Material Warning if Applicable */}
          {isCrossMaterial && (
            <div className="mb-6 rounded-2xl border-2 border-amber-500/50 bg-amber-500/20 p-4 text-amber-100 text-xs sm:text-sm flex items-start gap-3 shadow-xl">
              <AlertTriangle className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold text-amber-200">⚠️ Not directly comparable:</strong>{" "}
                Scenarios A and B differ in material, geometry, or flow configuration. Microgravity combustion mechanisms differ fundamentally between thermally thin flat fabrics in concurrent flow and thermally thick cylindrical plastic rods in opposed flow.
              </div>
            </div>
          )}

          {/* Delta Box if both are loaded */}
          {deltas && scenarioA && scenarioB && (
            <div className="mb-6 rounded-2xl border border-sky-400/40 bg-[#0c1222]/95 p-5 shadow-xl">
              <div className="text-center text-xs font-mono font-bold uppercase tracking-wider text-sky-300 mb-3">
                Condition Difference (Scenario B − Scenario A)
              </div>
              <div className="grid grid-cols-2 gap-4 text-center divide-x divide-white/15">
                <div>
                  <div className="text-xs font-bold text-slate-200">Δ Oxygen Concentration</div>
                  <div
                    className={`mt-1 text-2xl sm:text-3xl font-mono font-extrabold ${
                      deltas.dO2 > 0
                        ? "text-emerald-400"
                        : deltas.dO2 < 0
                        ? "text-rose-400"
                        : "text-white"
                    }`}
                  >
                    {deltas.dO2 > 0 ? `+${deltas.dO2.toFixed(2)}` : deltas.dO2.toFixed(2)}% O₂
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Δ Airflow Velocity</div>
                  <div
                    className={`mt-1 text-2xl sm:text-3xl font-mono font-extrabold ${
                      deltas.dFlow > 0
                        ? "text-emerald-400"
                        : deltas.dFlow < 0
                        ? "text-rose-400"
                        : "text-white"
                    }`}
                  >
                    {deltas.dFlow > 0 ? `+${deltas.dFlow.toFixed(2)}` : deltas.dFlow.toFixed(2)} cm/s
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Side by Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scenario A Card */}
            <div className="rounded-2xl border border-white/20 bg-[#0e0e1c]/95 p-5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center justify-center font-extrabold text-sm">
                    A
                  </div>
                  <h3 className="font-extrabold text-white text-base">Scenario A</h3>
                </div>
                {scenarioA?.presetRef && (
                  <span className="text-xs font-mono font-semibold text-slate-200 truncate max-w-[200px]">
                    {scenarioA.presetRef}
                  </span>
                )}
              </div>

              {scenarioA ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-zinc-950/80 p-3 border border-white/10">
                      <div className="text-slate-300 font-bold uppercase text-[10px]">Material</div>
                      <div className="font-extrabold text-white mt-0.5 text-xs">{scenarioA.material}</div>
                    </div>
                    <div className="rounded-xl bg-zinc-950/80 p-3 border border-white/10">
                      <div className="text-slate-300 font-bold uppercase text-[10px]">Sample Dimension</div>
                      <div className="font-extrabold text-white mt-0.5 text-xs">{scenarioA.diameter}</div>
                    </div>
                    <div className="rounded-xl bg-zinc-950/80 p-3 border border-white/10">
                      <div className="text-slate-300 font-bold uppercase text-[10px]">Oxygen Level</div>
                      <div className="font-mono font-extrabold text-orange-300 mt-0.5 text-sm">
                        {scenarioA.oxygen.toFixed(1)}% O₂
                      </div>
                    </div>
                    <div className="rounded-xl bg-zinc-950/80 p-3 border border-white/10">
                      <div className="text-slate-300 font-bold uppercase text-[10px]">Airflow Speed</div>
                      <div className="font-mono font-extrabold text-cyan-300 mt-0.5 text-sm">
                        {scenarioA.airflow.toFixed(2)} cm/s
                      </div>
                    </div>
                  </div>

                  {/* Evidence Status */}
                  {evidenceA && (
                    <div className="pt-2 border-t border-white/15">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-200">Ground-Truth Evidence:</span>
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                            evidenceA.status === "Exact match"
                              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400"
                              : evidenceA.status === "Nearby observation"
                              ? "bg-amber-500/20 text-amber-200 border border-amber-400"
                              : "bg-rose-500/20 text-rose-200 border border-rose-400"
                          }`}
                        >
                          {evidenceA.message}
                        </span>
                      </div>

                      {evidenceA.top3.length > 0 && (
                        <div className="rounded-xl bg-zinc-950/90 border border-white/15 p-4 space-y-2.5 shadow-md">
                          <div className="text-xs font-mono font-medium text-slate-200">
                            Nearest Run ID: <strong className="text-orange-300 font-bold">{evidenceA.top3[0].run_id}</strong>
                          </div>
                          <div className="text-xs flex items-center justify-between">
                            <span className="text-slate-300 font-medium">Observed Outcome:</span>
                            <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                              {evidenceA.top3[0].outcome_as_written || evidenceA.top3[0].outcome}
                            </span>
                          </div>
                          <div className="text-xs flex items-center justify-between">
                            <span className="text-slate-300 font-medium">Airflow:</span>
                            <span className="text-white font-bold font-mono">
                              {formatAirflow(evidenceA.top3[0])}
                            </span>
                          </div>
                          <div className="text-xs flex items-center justify-between">
                            <span className="text-slate-300 font-medium">Pressure:</span>
                            <span className="text-amber-200 font-bold">
                              {formatPressure(evidenceA.top3[0])}
                            </span>
                          </div>
                          <div className="text-xs flex items-center justify-between">
                            <span className="text-slate-300 font-medium">Spread Rate:</span>
                            <span className="font-mono text-amber-300 font-bold">
                              {formatSpreadRate(evidenceA.top3[0].flame_spread_rate_1e3_cm_s)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-200 pt-1.5 border-t border-white/10 font-medium">
                            Source: {evidenceA.top3[0].source_title} ({evidenceA.top3[0].page_or_figure})
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-300 font-medium">
                  Scenario A is empty. Set it from the presets or Experiment Lab.
                </div>
              )}
            </div>

            {/* Scenario B Card */}
            <div className="rounded-2xl border border-white/20 bg-[#0e0e1c]/95 p-5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center justify-center font-extrabold text-sm">
                    B
                  </div>
                  <h3 className="font-extrabold text-white text-base">Scenario B</h3>
                </div>
                {scenarioB?.presetRef && (
                  <span className="text-xs font-mono font-semibold text-slate-200 truncate max-w-[200px]">
                    {scenarioB.presetRef}
                  </span>
                )}
              </div>

              {scenarioB ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-zinc-950/80 p-3 border border-white/10">
                      <div className="text-slate-300 font-bold uppercase text-[10px]">Material</div>
                      <div className="font-extrabold text-white mt-0.5 text-xs">{scenarioB.material}</div>
                    </div>
                    <div className="rounded-xl bg-zinc-950/80 p-3 border border-white/10">
                      <div className="text-slate-300 font-bold uppercase text-[10px]">Sample Dimension</div>
                      <div className="font-extrabold text-white mt-0.5 text-xs">{scenarioB.diameter}</div>
                    </div>
                    <div className="rounded-xl bg-zinc-950/80 p-3 border border-white/10">
                      <div className="text-slate-300 font-bold uppercase text-[10px]">Oxygen Level</div>
                      <div className="font-mono font-extrabold text-orange-300 mt-0.5 text-sm">
                        {scenarioB.oxygen.toFixed(1)}% O₂
                      </div>
                    </div>
                    <div className="rounded-xl bg-zinc-950/80 p-3 border border-white/10">
                      <div className="text-slate-300 font-bold uppercase text-[10px]">Airflow Speed</div>
                      <div className="font-mono font-extrabold text-cyan-300 mt-0.5 text-sm">
                        {scenarioB.airflow.toFixed(2)} cm/s
                      </div>
                    </div>
                  </div>

                  {/* Evidence Status */}
                  {evidenceB && (
                    <div className="pt-2 border-t border-white/15">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-200">Ground-Truth Evidence:</span>
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                            evidenceB.status === "Exact match"
                              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400"
                              : evidenceB.status === "Nearby observation"
                              ? "bg-amber-500/20 text-amber-200 border border-amber-400"
                              : "bg-rose-500/20 text-rose-200 border border-rose-400"
                          }`}
                        >
                          {evidenceB.message}
                        </span>
                      </div>

                      {evidenceB.top3.length > 0 && (
                        <div className="rounded-xl bg-zinc-950/90 border border-white/15 p-4 space-y-2.5 shadow-md">
                          <div className="text-xs font-mono font-medium text-slate-200">
                            Nearest Run ID: <strong className="text-orange-300 font-bold">{evidenceB.top3[0].run_id}</strong>
                          </div>
                          <div className="text-xs flex items-center justify-between">
                            <span className="text-slate-300 font-medium">Observed Outcome:</span>
                            <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                              {evidenceB.top3[0].outcome_as_written || evidenceB.top3[0].outcome}
                            </span>
                          </div>
                          <div className="text-xs flex items-center justify-between">
                            <span className="text-slate-300 font-medium">Airflow:</span>
                            <span className="text-white font-bold font-mono">
                              {formatAirflow(evidenceB.top3[0])}
                            </span>
                          </div>
                          <div className="text-xs flex items-center justify-between">
                            <span className="text-slate-300 font-medium">Pressure:</span>
                            <span className="text-amber-200 font-bold">
                              {formatPressure(evidenceB.top3[0])}
                            </span>
                          </div>
                          <div className="text-xs flex items-center justify-between">
                            <span className="text-slate-300 font-medium">Spread Rate:</span>
                            <span className="font-mono text-amber-300 font-bold">
                              {formatSpreadRate(evidenceB.top3[0].flame_spread_rate_1e3_cm_s)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-200 pt-1.5 border-t border-white/10 font-medium">
                            Source: {evidenceB.top3[0].source_title} ({evidenceB.top3[0].page_or_figure})
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-300 font-medium">
                  Scenario B is empty. Set it from the presets or Experiment Lab.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-12 border-t border-white/15 pt-6 text-center text-xs text-slate-200 font-medium">
        <p className="font-bold text-white">Ignis Atelier — Microgravity Fire Experiment Lab</p>
        <p className="mt-0.5 italic text-slate-300">
          "See what real ISS flame experiments measured, and exactly where the evidence stops."
        </p>
      </div>
    </div>
  )
}
