"use client"

import * as React from "react"
import { MEASUREMENTS, MeasurementRow } from "@/lib/dataset"
import { formatPressure, formatSpreadRate, formatAirflow } from "@/lib/matching"
import { Map, Layers, FileText, Info } from "lucide-react"

interface OutcomeMapViewProps {
  scenarioA?: { oxygen: number; airflow: number } | null
  scenarioB?: { oxygen: number; airflow: number } | null
}

export default function OutcomeMapView({ scenarioA, scenarioB }: OutcomeMapViewProps) {
  const [activeFamily, setActiveFamily] = React.useState<"fabric" | "pmma">("fabric")
  const [selectedRunId, setSelectedRunId] = React.useState<string>("GMT45-T4")

  const rows = React.useMemo(() => {
    return MEASUREMENTS.filter((r) =>
      activeFamily === "fabric"
        ? r.material.toLowerCase().includes("fabric")
        : r.material.toLowerCase().includes("pmma")
    )
  }, [activeFamily])

  const selectedRow = React.useMemo(() => {
    return rows.find((r) => r.run_id === selectedRunId) || rows[0]
  }, [rows, selectedRunId])

  // Coordinate scales for SVG scatter
  // Fabric: X in [15.5, 21.5], Y in [0, 55]
  // PMMA: X in [15.5, 21.5], Y in [0, 8.5]
  const svgWidth = 640
  const svgHeight = 380
  const padding = { left: 55, right: 30, top: 30, bottom: 45 }

  const xMin = 15.5
  const xMax = 21.5
  const yMin = 0
  const yMax = activeFamily === "fabric" ? 55 : 8.5

  const scaleX = (o2: number) => {
    return (
      padding.left +
      ((o2 - xMin) / (xMax - xMin)) * (svgWidth - padding.left - padding.right)
    )
  }

  const scaleY = (flow: number) => {
    return (
      svgHeight -
      padding.bottom -
      ((flow - yMin) / (yMax - yMin)) * (svgHeight - padding.top - padding.bottom)
    )
  }

  const outcomeColors: Record<string, string> = {
    quenched: "#ef4444",
    blowoff: "#f97316",
    no_blowoff: "#a855f7",
    no_ignition: "#64748b",
    ignited: "#eab308",
    one_sided_flame: "#ec4899",
    not_stated: "#38bdf8",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Map className="h-6 w-6 text-orange-500" /> Outcome Map
          </h2>
          <p className="text-sm font-medium text-slate-100 mt-1">
            2D empirical scatter space: Oxygen (%) vs. Airflow (cm/s). Never mixes experiment families.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveFamily("fabric")
              setSelectedRunId("GMT45-T4")
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              activeFamily === "fabric"
                ? "bg-orange-600/30 border-2 border-orange-400 text-white shadow-md shadow-orange-950/40"
                : "border-zinc-700 bg-zinc-900/90 text-slate-200 hover:text-white hover:border-zinc-500"
            }`}
          >
            SIBAL Fabric (Concurrent)
          </button>
          <button
            onClick={() => {
              setActiveFamily("pmma")
              setSelectedRunId("S1-B13a-1")
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              activeFamily === "pmma"
                ? "bg-orange-600/30 border-2 border-orange-400 text-white shadow-md shadow-orange-950/40"
                : "border-zinc-700 bg-zinc-900/90 text-slate-200 hover:text-white hover:border-zinc-500"
            }`}
          >
            PMMA Rods (Opposed)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scatter Plot */}
        <div className="lg:col-span-2 rounded-2xl border border-white/20 bg-[#0e0e1c]/95 p-5 space-y-4 shadow-xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-xs text-slate-100 font-medium">
            <span>
              Showing <strong className="text-white font-extrabold text-sm">{rows.length}</strong> real spaceflight measurements
            </span>
            <span className="font-mono text-orange-300 font-bold">
              Dotted lines = Flow reduced during test
            </span>
          </div>

          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto bg-black/90 rounded-xl border border-white/15 shadow-inner"
            >
              {/* Grid Lines */}
              {[16, 17, 18, 19, 20, 21].map((x) => (
                <g key={`x-${x}`}>
                  <line
                    x1={scaleX(x)}
                    y1={padding.top}
                    x2={scaleX(x)}
                    y2={svgHeight - padding.bottom}
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={scaleX(x)}
                    y={svgHeight - padding.bottom + 18}
                    fill="#f1f5f9"
                    fontSize="11"
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {x}%
                  </text>
                </g>
              ))}

              {/* Y Grid Lines */}
              {(activeFamily === "fabric" ? [0, 10, 20, 30, 40, 50] : [0, 2, 4, 6, 8]).map(
                (y) => (
                  <g key={`y-${y}`}>
                    <line
                      x1={padding.left}
                      y1={scaleY(y)}
                      x2={svgWidth - padding.right}
                      y2={scaleY(y)}
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={padding.left - 10}
                      y={scaleY(y) + 4}
                      fill="#f1f5f9"
                      fontSize="11"
                      textAnchor="end"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {y}
                    </text>
                  </g>
                )
              )}

              {/* Axis Labels */}
              <text
                x={svgWidth / 2}
                y={svgHeight - 10}
                fill="#ffffff"
                fontSize="12"
                textAnchor="middle"
                fontWeight="800"
              >
                Ambient Oxygen Concentration (% O₂)
              </text>
              <text
                x={18}
                y={svgHeight / 2}
                fill="#ffffff"
                fontSize="12"
                textAnchor="middle"
                transform={`rotate(-90, 18, ${svgHeight / 2})`}
                fontWeight="800"
              >
                Airflow Velocity (cm/s)
              </text>

              {/* Unmeasured Region Warning Box */}
              <rect
                x={scaleX(15.5)}
                y={scaleY(yMax)}
                width={scaleX(16.3) - scaleX(15.5)}
                height={scaleY(0) - scaleY(yMax)}
                fill="rgba(239, 68, 68, 0.1)"
                stroke="rgba(239, 68, 68, 0.6)"
                strokeDasharray="4,4"
              />
              <text
                x={scaleX(15.9)}
                y={scaleY(yMax * 0.7)}
                fill="#fca5a5"
                fontSize="10"
                textAnchor="middle"
                fontWeight="bold"
                transform={`rotate(-90, ${scaleX(15.9)}, ${scaleY(yMax * 0.7)})`}
              >
                No measurements (Below tested O₂)
              </text>

              {/* Flow Transition Lines */}
              {activeFamily === "fabric" &&
                rows.map((r) => {
                  const s = parseFloat(r.airflow_start_cm_s)
                  const e = parseFloat(r.airflow_end_cm_s)
                  const o2 = parseFloat(r.oxygen_percent)
                  if (isNaN(s) || isNaN(e) || isNaN(o2) || Math.abs(s - e) < 0.1) return null

                  return (
                    <line
                      key={`line-${r.run_id}`}
                      x1={scaleX(o2)}
                      y1={scaleY(s)}
                      x2={scaleX(o2)}
                      y2={scaleY(e)}
                      stroke="rgba(255, 255, 255, 0.5)"
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                    />
                  )
                })}

              {/* Data Points */}
              {rows.map((r) => {
                const o2 = parseFloat(r.oxygen_percent)
                const flow = parseFloat(r.airflow_end_cm_s)
                if (isNaN(o2) || isNaN(flow)) return null

                const isSelected = r.run_id === selectedRunId
                const cx = scaleX(o2)
                const cy = scaleY(flow)

                if (activeFamily === "fabric") {
                  const col = outcomeColors[r.outcome] || "#38bdf8"
                  return (
                    <g
                      key={r.run_id}
                      onClick={() => setSelectedRunId(r.run_id)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 8 : 6}
                        fill={col}
                        stroke={isSelected ? "#ffffff" : "rgba(0,0,0,0.8)"}
                        strokeWidth={isSelected ? 2.5 : 1.2}
                      />
                    </g>
                  )
                } else {
                  // PMMA: colored by spread rate
                  const rate = parseFloat(r.flame_spread_rate_1e3_cm_s) || 5.0
                  const norm = Math.min(Math.max((rate - 2.0) / 8.0, 0), 1)
                  const col = `hsl(${Math.round(240 - norm * 240)}, 95%, 55%)`

                  return (
                    <g
                      key={r.run_id}
                      onClick={() => setSelectedRunId(r.run_id)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 9 : 6 + norm * 4}
                        fill={col}
                        stroke={isSelected ? "#ffffff" : "rgba(0,0,0,0.8)"}
                        strokeWidth={isSelected ? 2.5 : 1.2}
                        opacity={0.95}
                      />
                    </g>
                  )
                }
              })}

              {/* Scenario A & B Target Markers */}
              {scenarioA && (
                <polygon
                  points={`${scaleX(scenarioA.oxygen)},${scaleY(scenarioA.airflow) - 9} ${
                    scaleX(scenarioA.oxygen) + 8
                  },${scaleY(scenarioA.airflow) + 7} ${scaleX(scenarioA.oxygen) - 8},${
                    scaleY(scenarioA.airflow) + 7
                  }`}
                  fill="#facc15"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
              )}
              {scenarioB && (
                <rect
                  x={scaleX(scenarioB.oxygen) - 7}
                  y={scaleY(scenarioB.airflow) - 7}
                  width="14"
                  height="14"
                  fill="#f87171"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  transform={`rotate(45, ${scaleX(scenarioB.oxygen)}, ${scaleY(
                    scenarioB.airflow
                  )})`}
                />
              )}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs font-semibold pt-3 border-t border-white/15">
            {activeFamily === "fabric" ? (
              Object.entries(outcomeColors).map(([k, c]) => (
                <span key={k} className="flex items-center gap-1.5 text-slate-100 capitalize">
                  <span className="h-3 w-3 rounded-full border border-black/40" style={{ backgroundColor: c }} />
                  {k.replace("_", " ")}
                </span>
              ))
            ) : (
              <div className="flex items-center gap-2.5 text-slate-100">
                <span className="font-bold text-white">Spread Rate Scale:</span>
                <span className="font-mono text-cyan-300 font-bold">2.0</span>
                <span className="h-2.5 w-28 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded border border-white/20" />
                <span className="font-mono text-red-300 font-bold">10.0 × 10⁻³ cm/s</span>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Drawer */}
        <div className="rounded-2xl border border-white/20 bg-[#0e0e1c]/95 p-5 space-y-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-500" /> Evidence Drawer
            </h3>
            <span className="font-mono text-xs font-bold text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
              {selectedRow?.run_id}
            </span>
          </div>

          {selectedRow ? (
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-slate-300 block uppercase font-bold text-[11px]">Material & Experiment</span>
                <span className="text-white font-bold text-sm block">
                  {selectedRow.material} ({selectedRow.experiment})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 bg-zinc-900/90 p-3 rounded-xl border border-white/10">
                <div>
                  <span className="text-slate-300 block text-[10px] font-bold uppercase">OXYGEN</span>
                  <span className="font-mono text-white font-extrabold text-sm">
                    {selectedRow.oxygen_percent}% O₂
                  </span>
                </div>
                <div>
                  <span className="text-slate-300 block text-[10px] font-bold uppercase">AIRFLOW</span>
                  <span className="font-mono text-white font-extrabold text-sm">
                    {formatAirflow(selectedRow)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-300 block text-[10px] font-bold uppercase">PRESSURE</span>
                  <span className="text-amber-200 font-bold text-xs">{formatPressure(selectedRow)}</span>
                </div>
                <div>
                  <span className="text-slate-300 block text-[10px] font-bold uppercase">OUTCOME</span>
                  <span className="text-white capitalize font-bold text-xs bg-white/10 px-1.5 py-0.5 rounded border border-white/10 inline-block">
                    {selectedRow.outcome_as_written || selectedRow.outcome}
                  </span>
                </div>
              </div>

              {selectedRow.flame_spread_rate_1e3_cm_s && (
                <div>
                  <span className="text-slate-300 block text-[11px] font-bold uppercase">MEASURED SPREAD RATE</span>
                  <span className="font-mono text-amber-300 font-extrabold text-sm">
                    {formatSpreadRate(selectedRow.flame_spread_rate_1e3_cm_s)}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-300 block text-[11px] font-bold uppercase">PRIMARY CITATION</span>
                <p className="text-white font-medium italic mt-0.5">{selectedRow.source_title}</p>
                <span className="text-slate-200 text-xs block mt-0.5 font-medium">
                  Location: {selectedRow.page_or_figure}
                </span>
              </div>

              <div className="p-3 bg-zinc-900/90 border-l-4 border-orange-400 rounded-lg text-slate-100 text-xs leading-relaxed font-medium">
                <strong className="text-orange-300 block mb-1">Source Notes:</strong>
                {selectedRow.notes || "No extra footnotes recorded for this test."}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-300 font-medium">Select any point to inspect evidence.</p>
          )}
        </div>
      </div>
    </div>
  )
}
