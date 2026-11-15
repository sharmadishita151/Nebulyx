"use client"

import * as React from "react"
import { MEASUREMENTS, MeasurementRow } from "@/lib/dataset"
import { formatPressure, formatSpreadRate, formatAirflow } from "@/lib/matching"
import {
  BookOpen,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Download,
  Search,
  ExternalLink,
  Table,
  CheckCircle2,
} from "lucide-react"

export default function SourcesLimitsView() {
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [downloadSuccess, setDownloadSuccess] = React.useState<boolean>(false)

  // Filtered rows for the dataset table
  const filteredRows = React.useMemo(() => {
    if (!searchQuery.trim()) return MEASUREMENTS
    const q = searchQuery.toLowerCase()
    return MEASUREMENTS.filter(
      (r) =>
        r.run_id.toLowerCase().includes(q) ||
        r.material.toLowerCase().includes(q) ||
        r.experiment.toLowerCase().includes(q) ||
        r.outcome.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q) ||
        r.source_title.toLowerCase().includes(q)
    )
  }, [searchQuery])

  // Download raw CSV
  const handleDownloadCSV = () => {
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
    const csvLines = [headers.join(",")]
    MEASUREMENTS.forEach((r) => {
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
      csvLines.push(rowVals.join(","))
    })

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "measurements_all.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setDownloadSuccess(true)
    setTimeout(() => setDownloadSuccess(false), 3000)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-white/15 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-amber-400" /> Ignis Atelier: Sources, Pedigree, and Limitations
          </h1>
          <span className="rounded-full border border-amber-400/50 bg-amber-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-200">
            NTRS & Scientific Reports
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-slate-100">
          "See what real ISS flame experiments measured, and exactly where the evidence stops."
        </p>
      </div>

      {/* 1. Primary Sources Cards */}
      <div className="mb-10">
        <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-sky-400" /> Published Primary Literature
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Paper 1: Zhao et al. */}
          <div className="rounded-2xl border border-sky-500/40 bg-[#0c1222]/95 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-extrabold text-white text-base leading-snug">
                1. Concurrent Flame Growth, Spread and Extinction over Composite Fabric Samples in Low Speed Purely Forced Flow in Microgravity
              </h3>
              <span className="rounded-lg bg-sky-500/20 text-sky-200 border border-sky-400/50 text-xs font-mono font-bold px-2.5 py-0.5 whitespace-nowrap">
                31 Runs
              </span>
            </div>
            <p className="mt-2 text-xs font-bold text-sky-200">
              Xiaoyang Zhao, James S. T’ien, Paul V. Ferkul, Sandra L. Olson
            </p>
            <div className="mt-3 space-y-2 text-xs text-slate-200">
              <div>
                <strong className="text-white">Venue:</strong> 9th U.S. National Combustion Meeting, Central States Section of the Combustion Institute, Cincinnati, Ohio (2015).
              </div>
              <div>
                <strong className="text-white">NASA Report:</strong> NTRS Citation 20150008962.
              </div>
              <div>
                <strong className="text-white">Affiliations:</strong> Case Western Reserve University & NASA Glenn Research Center.
              </div>
              <div className="pt-2 text-slate-100 text-xs font-medium leading-relaxed border-t border-white/10">
                <strong className="text-white">Contribution:</strong> 31 experimental runs (Appendix Table p. 9) of SIBAL composite fabric (75% cotton / 25% fiberglass), 1.2 cm and 2.2 cm widths, under concurrent forced flow (about 2 to 53 cm/s in these 31 runs) and ambient oxygen (16.4%–21.0%).
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <a
                href="https://ntrs.nasa.gov/citations/20150008962"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-extrabold text-sky-300 hover:text-white underline underline-offset-2"
              >
                Access via NASA NTRS (20150008962) <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="text-slate-400 font-mono text-[11px]">Accessed: Nov 2026</span>
            </div>
          </div>

          {/* Paper 2: Link et al. */}
          <div className="rounded-2xl border border-sky-500/40 bg-[#0c1222]/95 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-extrabold text-white text-base leading-snug">
                2. The Effect of Gravity on Flame Spread over PMMA Cylinders
              </h3>
              <span className="rounded-lg bg-sky-500/20 text-sky-200 border border-sky-400/50 text-xs font-mono font-bold px-2.5 py-0.5 whitespace-nowrap">
                52 Runs
              </span>
            </div>
            <p className="mt-2 text-xs font-bold text-sky-200">
              S. Link, X. Huang, C. Fernandez-Pello, S. L. Olson, P. V. Ferkul
            </p>
            <div className="mt-3 space-y-2 text-xs text-slate-200">
              <div>
                <strong className="text-white">Journal:</strong> Scientific Reports, Volume 8, Article number 120 (2018).
              </div>
              <div>
                <strong className="text-white">DOI:</strong> 10.1038/s41598-017-18398-4.
              </div>
              <div>
                <strong className="text-white">Affiliations:</strong> University of California Berkeley & NASA Glenn Research Center.
              </div>
              <div className="pt-2 text-slate-100 text-xs font-medium leading-relaxed border-t border-white/10">
                <strong className="text-white">Contribution:</strong> 52 experimental runs (Supplementary Table S1) of PMMA cylindrical rods (0.64 cm, 0.95 cm, 1.27 cm diameters) in opposed forced flow (0.41–7.55 cm/s) and ambient oxygen (16.8%–20.9%).
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <a
                href="https://doi.org/10.1038/s41598-017-18398-4"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-extrabold text-sky-300 hover:text-white underline underline-offset-2"
              >
                Access via Scientific Reports (8:120) <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="text-slate-400 font-mono text-[11px]">Accessed: Nov 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scientific Disclaimers & What It Does NOT Claim */}
      <div className="mb-10">
        <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-400" /> What This Tool Does Not Claim & Scope Limits
        </h2>
        <div className="rounded-2xl border-2 border-rose-500/50 bg-rose-950/40 p-5 shadow-xl">
          <ul className="space-y-3.5 text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
            <li className="flex items-start gap-2.5">
              <span className="font-extrabold text-rose-300">• NOT a Fire Safety Tool:</span>
              <span>
                Ignis Atelier is strictly an educational and scientific exploration tool. It must never be used for spacecraft mission safety qualification, operational fire response protocols, or environmental control decisions.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-extrabold text-rose-300">• NO Predictive Extrapolation:</span>
              <span>
                Ignis Atelier performs no predictive machine learning, regressions, or empirical curve-fitting. It does not predict whether an unmeasured point is "safe" or "hazardous". If data does not exist, it displays <em className="text-amber-200 font-bold">"Not supported by data"</em>.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-extrabold text-rose-300">• Small Empirical Dataset:</span>
              <span>
                Spaceflight combustion experiments are exceptionally resource-intensive. This tool's dataset has 83 runs from two papers. It is not the complete BASS-II archive. Whole regions of the oxygen-airflow parameter space remain completely untested.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-extrabold text-rose-300">• Two Isolated Experiment Families:</span>
              <span>
                Data encompasses only two specific fuel systems (thin SIBAL fabric in concurrent flow and thick PMMA rods in opposed flow). Results cannot be generalized to other polymers, metals, electronics, or complex geometries.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-extrabold text-rose-300">• Data Provenance:</span>
              <span>
                Data provenance: rows were transcribed from the papers with AI assistance and spot-checked by the team. Original outcome wording is kept in the outcome_as_written column.
              </span>
            </li>
          </ul>
          <div className="mt-3.5 pt-3 border-t border-rose-500/20 space-y-1.5 text-xs text-slate-200 font-medium">
            <p>
              <strong>Visual rendering note:</strong> Flame visuals for slider positions between discrete spaceflight tests are illustrative interpolations, not AI-predicted flame shapes. Only discrete points matching published runs represent real measurements.
            </p>
            <p className="text-slate-300">
              How this was made: data extracted from the papers with AI assistance; the website was built with AI coding tools.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Known Data Cautions & Errata */}
      <div className="mb-10">
        <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" /> Known Data Cautions & Source Errata
        </h2>
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-950/30 p-4.5 shadow-lg">
            <div className="text-xs sm:text-sm font-extrabold text-amber-200">
              1. Non-Systematic Spaceflight Sampling & Oxygen Uncertainty
            </div>
            <p className="mt-1 text-xs text-slate-100 leading-normal font-medium">
              Microgravity combustion runs aboard the International Space Station were conducted across various flight increments and operational windows. The ±0.3% O₂ uncertainty is from Link et al. (Fig. 7). Separately, the Zhao et al. table footnote marks the O₂ reading in GMT45-T1 and GMT45-T2 as possibly inaccurate.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-950/30 p-4.5 shadow-lg">
            <div className="text-xs sm:text-sm font-extrabold text-amber-200">
              2. PMMA Supplementary Table S1 Header Unit Discrepancy
            </div>
            <p className="mt-1 text-xs text-slate-100 leading-normal font-medium">
              In the supplementary material of Link et al. (2018), the table header for the 0.64 cm diameter rod block is labeled <em>"mm/s"</em>, whereas the other blocks are labeled <em>"10⁻³ cm/s"</em>. A comparison with Figure 5 and Figure S1 of the paper appears consistent with the numerical values (e.g., 10.0, 9.74, 8.32) being in <strong className="text-amber-300">10⁻³ cm/s</strong> (which is equivalent to 10⁻² mm/s). Ignis Atelier treats them as <strong className="text-amber-300">10⁻³ cm/s</strong> to maintain scientific consistency with the publication's graphical figures.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-950/30 p-4.5 shadow-lg">
            <div className="text-xs sm:text-sm font-extrabold text-amber-200">
              3. Undefined Sample Prefix 'P17' in PMMA Source Table
            </div>
            <p className="mt-1 text-xs text-slate-100 leading-normal font-medium">
              Runs S1-P17-1, S1-P17-2, and S1-P17-3 use sample ID <em>"P17"</em>. The table caption in Supplementary Table S1 only defines <strong className="text-white">B</strong> (black cast PMMA) and <strong className="text-white">C</strong> (clear cast PMMA). The exact color or formulation of sample 'P' is not defined in the source, so Ignis Atelier records its material as <em className="text-amber-200">"PMMA, colour not defined in table"</em> without guessing.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-950/30 p-4.5 shadow-lg">
            <div className="text-xs sm:text-sm font-extrabold text-amber-200">
              4. Fabric Rows with Outcome 'not_stated'
            </div>
            <p className="mt-1 text-xs text-slate-100 leading-normal font-medium">
              In Zhao et al. (Appendix Table p. 9), 11 tests have no text in the Comments column (or are listed as baseline BASS runs without an explicit extinction tag). Ignis Atelier encodes these as <code className="text-orange-300 font-bold bg-black/40 px-1.5 py-0.5 rounded">not_stated</code> rather than assuming whether steady spread or burnout occurred.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-950/30 p-4.5 shadow-lg">
            <div className="text-xs sm:text-sm font-extrabold text-amber-200">
              5. Pressure Reporting Difference: Fabric vs PMMA
            </div>
            <p className="mt-1 text-xs text-slate-100 leading-normal font-medium">
              Zhao et al. explicitly reports ambient pressure as <strong className="text-white">1 atm</strong> for all fabric tests inside the Microgravity Science Glovebox. In contrast, Link et al. provides no pressure column or statement in Supplementary Table S1. Consequently, Ignis Atelier displays <em className="text-amber-300 font-bold">"Pressure: not stated in the source"</em> for all 52 PMMA rows and never assumes 1.0 atm.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Concrete Evidence Gaps & Untested Conditions */}
      <div className="mb-10">
        <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-400" /> Concrete Evidence Gaps & Untested Parameter Envelopes
        </h2>
        <div className="rounded-2xl border-2 border-rose-500/35 bg-rose-950/30 p-5 shadow-xl space-y-3.5 text-xs leading-relaxed text-slate-100 font-medium">
          <p>
            Spaceflight microgravity combustion data is extraordinarily sparse. From the 83 published runs across both papers, the following physical regions remain <strong className="text-rose-300 font-bold">completely unmeasured</strong>:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            <div className="rounded-xl bg-zinc-950/70 p-3.5 border border-white/10">
              <strong className="text-amber-300 block mb-1">1. Low-Speed Radiative Quench Edge (2 to 5 cm/s)</strong>
              In concurrent flow over cotton-fiberglass fabric, flames consistently quenched at final ventilation speeds between ~2.2 and 5.0 cm/s. Forced flows slower than these terminal speeds cannot sustain concurrent flame spread in microgravity.
            </div>
            <div className="rounded-xl bg-zinc-950/70 p-3.5 border border-white/10">
              <strong className="text-amber-300 block mb-1">2. Opposed Flow Lower Boundary (&lt; 0.41 cm/s)</strong>
              For PMMA cylindrical rods in opposed flow, the lowest tested speed in BASS-II was 0.41 cm/s. The purely quiescent microgravity regime (&lt; 0.41 cm/s) was never tested.
            </div>
            <div className="rounded-xl bg-zinc-950/70 p-3.5 border border-white/10">
              <strong className="text-amber-300 block mb-1">3. Untested Hypoxic Boundary (&lt; 16.4% O₂)</strong>
              Fabric tests cease at 16.4% O₂ and PMMA tests at 16.8% O₂. Combustion behavior in deeply hypoxic spacecraft environments (&lt; 16.4% O₂) is completely absent from the dataset.
            </div>
            <div className="rounded-xl bg-zinc-950/70 p-3.5 border border-white/10">
              <strong className="text-amber-300 block mb-1">4. PMMA Upper Flow Ceiling (&gt; 7.55 cm/s)</strong>
              Opposed flow over cylindrical rods was only tested up to 7.55 cm/s. The blow-off extinction boundary for PMMA cylinders at higher forced flows remains unmeasured.
            </div>
            <div className="rounded-xl bg-zinc-950/70 p-3.5 border border-white/10">
              <strong className="text-amber-300 block mb-1">5. Large Geometries &amp; Fuel Diversity</strong>
              Experiments were restricted to 1.2 cm and 2.2 cm fabric sheets, and 0.64 cm, 0.95 cm, and 1.27 cm PMMA rods. Complex 3D components, wires, foam, and structural polymers have zero representation.
            </div>
            <div className="rounded-xl bg-zinc-950/70 p-3.5 border border-white/10">
              <strong className="text-amber-300 block mb-1">6. Sub-Atmospheric Exploration Pressures</strong>
              Fabric runs were conducted exclusively at 1.0 atm (sea-level equivalent). Exploration atmospheres proposed for future lunar/Mars habitats (e.g., 0.56 atm / 8.2 psi with 34% O₂) were not tested.
            </div>
          </div>
        </div>
      </div>

      {/* 5. Complete Dataset Browser (83 Rows, 20 Columns) */}
      <div className="mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Table className="h-5 w-5 text-sky-400" /> Complete Dataset Browser (83 Rows, 20 Columns)
            </h2>
            <p className="text-xs text-slate-200 font-medium mt-0.5">
              Inspect every published row and column in data/measurements_all.csv with verifiable NTRS and DOI citations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
              <input
                type="text"
                placeholder="Filter by Run ID, Material, Outcome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 rounded-xl border border-white/20 bg-zinc-900/90 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none font-medium shadow-inner"
              />
            </div>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-xs font-extrabold text-black transition-all shadow-lg"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-black" /> Downloaded!
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Download CSV (83 Rows)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl border border-white/20 bg-[#0e0e1c]/95 overflow-hidden shadow-2xl">
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-zinc-950 text-white uppercase tracking-wider font-mono sticky top-0 border-b border-white/20 z-10 text-[11px] font-bold">
                <tr>
                  <th className="px-3.5 py-3">Run ID</th>
                  <th className="px-3.5 py-3">Material</th>
                  <th className="px-3.5 py-3">Geometry</th>
                  <th className="px-3.5 py-3">Flow Dir</th>
                  <th className="px-3.5 py-3">Size (cm)</th>
                  <th className="px-3.5 py-3">O₂ (%)</th>
                  <th className="px-3.5 py-3">Airflow (cm/s)</th>
                  <th className="px-3.5 py-3">Pressure</th>
                  <th className="px-3.5 py-3">Outcome</th>
                  <th className="px-3.5 py-3">Spread Rate (10⁻³ cm/s)</th>
                  <th className="px-3.5 py-3">Δt (s)</th>
                  <th className="px-3.5 py-3">Table Location</th>
                  <th className="px-3.5 py-3">Archive Identifier (NTRS / DOI)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 font-mono">
                {filteredRows.map((r) => (
                  <tr key={r.run_id} className="hover:bg-sky-950/40 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-sky-300">{r.run_id}</td>
                    <td className="px-3.5 py-2.5 text-white font-sans font-medium">{r.material}</td>
                    <td className="px-3.5 py-2.5 text-slate-200">{r.geometry}</td>
                    <td className="px-3.5 py-2.5 text-slate-200">{r.flow_direction}</td>
                    <td className="px-3.5 py-2.5 text-white font-bold">{r.sample_size_cm}</td>
                    <td className="px-3.5 py-2.5 text-orange-300 font-bold">{r.oxygen_percent}%</td>
                    <td className="px-3.5 py-2.5 text-cyan-300 font-bold">
                      {formatAirflow(r)}
                    </td>
                    <td className="px-3.5 py-2.5 text-amber-200 font-semibold">
                      {formatPressure(r)}
                    </td>
                    <td className="px-3.5 py-2.5 font-sans">
                      <span className="rounded-md bg-white/10 border border-white/15 px-2 py-0.5 text-white font-bold text-xs">
                        {r.outcome_as_written || r.outcome}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-amber-300 font-bold">
                      {formatSpreadRate(r.flame_spread_rate_1e3_cm_s)}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-200 font-medium">{r.delta_t_s || "—"}</td>
                    <td className="px-3.5 py-2.5 text-slate-300 font-sans truncate max-w-[200px]" title={`${r.source_title} (${r.page_or_figure})`}>
                      {r.page_or_figure}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] font-bold">
                      {r.material.toLowerCase().includes("fabric") ? (
                        <span className="bg-sky-950/60 text-sky-200 border border-sky-400/30 px-2 py-0.5 rounded">
                          NTRS 20150008962
                        </span>
                      ) : (
                        <span className="bg-purple-950/60 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded">
                          10.1038/s41598-017-18398-4
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-zinc-950 px-4 py-2.5 border-t border-white/15 text-xs text-slate-200 flex justify-between items-center font-medium">
            <span>Showing <strong className="text-white font-bold">{filteredRows.length}</strong> of {MEASUREMENTS.length} total runs</span>
            <span className="text-slate-300">All rows verifiable against NASA NTRS 20150008962 & Scientific Reports 8:120</span>
          </div>
        </div>
      </div>

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
