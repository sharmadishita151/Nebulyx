import { MeasurementRow } from "./dataset"

export const EXACT_O2_DIFF = 0.1
export const EXACT_FLOW_DIFF = 0.2
export const NEARBY_DISTANCE_MAX = 1.0
export const SCALE_O2 = 1.0
export const SCALE_FLOW = 1.0

export interface ScoredRow extends MeasurementRow {
  distance: number
  is_exact: boolean
}

export function formatPressure(row: MeasurementRow): string {
  const val = row.pressure_atm
  const material = row.material || ""

  if (material.includes("PMMA") || !val || val.trim() === "" || val.toLowerCase() === "nan") {
    return "Pressure: not stated in the source"
  }
  const fval = parseFloat(val)
  return isNaN(fval) ? val : `${fval.toFixed(1)} atm`
}

export function formatSpreadRate(val: string | null | undefined): string {
  if (!val || val.trim() === "" || val.toLowerCase() === "nan") {
    return "No spread rate measured"
  }
  const fval = parseFloat(val)
  return isNaN(fval) ? val : `${fval.toFixed(2)} × 10⁻³ cm/s`
}

export function formatAirflow(row: MeasurementRow): string {
  const start = parseFloat(row.airflow_start_cm_s)
  const end = parseFloat(row.airflow_end_cm_s)
  if (isNaN(end)) return "Not stated"
  if (!isNaN(start) && Math.abs(start - end) > 0.05) {
    if (end < start) {
      return `${start} → ${end} cm/s (flow reduced)`
    }
    if (end > start) {
      return `${start} → ${end} cm/s (flow increased)`
    }
  }
  return `${end} cm/s`
}

export function computeEvidenceStatus(
  filteredRows: MeasurementRow[],
  targetO2: number,
  targetFlow: number
): {
  status: "Exact match" | "Nearby observation" | "Not supported by data"
  message: string
  top3: ScoredRow[]
} {
  if (!filteredRows || filteredRows.length === 0) {
    return {
      status: "Not supported by data",
      message: "No experimental rows found for this filter.",
      top3: [],
    }
  }

  const scored: ScoredRow[] = []

  for (const row of filteredRows) {
    const o2 = parseFloat(row.oxygen_percent)
    const flow = parseFloat(row.airflow_end_cm_s)
    if (isNaN(o2) || isNaN(flow)) continue

    const o2Diff = Math.abs(o2 - targetO2)
    const flowDiff = Math.abs(flow - targetFlow)

    const dist = Math.sqrt(
      Math.pow(o2Diff / SCALE_O2, 2) + Math.pow(flowDiff / SCALE_FLOW, 2)
    )

    const isExact = o2Diff <= EXACT_O2_DIFF && flowDiff <= EXACT_FLOW_DIFF

    scored.push({
      ...row,
      distance: Math.round(dist * 1000) / 1000,
      is_exact: isExact,
    })
  }

  if (scored.length === 0) {
    return {
      status: "Not supported by data",
      message: "No valid numerical measurements in filtered set.",
      top3: [],
    }
  }

  scored.sort((a, b) => a.distance - b.distance)
  const top3 = scored.slice(0, 3)
  const nearest = scored[0]
  const hasExact = scored.some((r) => r.is_exact)

  let status: "Exact match" | "Nearby observation" | "Not supported by data"
  let message: string

  if (hasExact) {
    status = "Exact match"
    message = `Direct experimental match! Run ${nearest.run_id} is within 0.1% O₂ and 0.2 cm/s airflow.`
  } else if (nearest.distance <= NEARBY_DISTANCE_MAX) {
    status = "Nearby observation"
    message = `Close experimental observation: Run ${nearest.run_id} (scaled distance ${nearest.distance.toFixed(3)} ≤ 1.0).`
  } else {
    status = "Not supported by data"
    message = `Nearest experimental measurement ${nearest.run_id} is at distance ${nearest.distance.toFixed(3)} (> 1.0). No data supports this condition.`
  }

  return { status, message, top3 }
}
