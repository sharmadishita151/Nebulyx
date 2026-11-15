import math
import os
import pandas as pd
import streamlit as st

from utils.data import (
    load_data,
    compute_evidence_status,
    format_pressure,
    format_spread_rate,
    format_airflow,
    EXACT_O2_DIFF,
    EXACT_FLOW_DIFF,
    NEARBY_DISTANCE_MAX
)

st.set_page_config(
    page_title="Ignis Atelier - Experiment Lab",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state if not already set
if "scenario_a" not in st.session_state:
    st.session_state["scenario_a"] = None
if "scenario_b" not in st.session_state:
    st.session_state["scenario_b"] = None

# Custom styling
st.html("""
<style>
.stApp {
    background-color: #050811;
    color: #e2e8f0;
}
.status-badge-exact {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.5);
    color: #4ade80;
    padding: 12px 18px;
    border-radius: 8px;
    margin-bottom: 20px;
}
.status-badge-nearby {
    background: rgba(234, 179, 8, 0.15);
    border: 1px solid rgba(234, 179, 8, 0.5);
    color: #facc15;
    padding: 12px 18px;
    border-radius: 8px;
    margin-bottom: 20px;
}
.status-badge-unsupported {
    background: rgba(148, 163, 184, 0.12);
    border: 1px solid rgba(148, 163, 184, 0.35);
    color: #cbd5e1;
    padding: 12px 18px;
    border-radius: 8px;
    margin-bottom: 20px;
}
.status-title {
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 4px;
}
.status-desc {
    font-size: 13px;
    line-height: 1.4;
}
.flame-card {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 10px;
    padding: 16px;
    text-align: center;
    margin-bottom: 24px;
}
.flame-caption {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 8px;
    letter-spacing: 0.03em;
}
.measurement-card {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 14px;
}
.card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    padding-bottom: 6px;
}
.card-run-id {
    font-size: 16px;
    font-weight: 700;
    color: #38bdf8;
}
.card-distance {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 8px;
    border-radius: 4px;
}
.card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    font-size: 13px;
    margin-bottom: 8px;
}
.grid-item-label {
    color: #64748b;
    font-size: 11px;
    text-transform: uppercase;
}
.grid-item-val {
    color: #f1f5f9;
    font-weight: 500;
}
.card-notes {
    font-size: 12px;
    color: #cbd5e1;
    background: rgba(30, 41, 59, 0.6);
    padding: 8px 12px;
    border-radius: 4px;
    border-left: 3px solid #38bdf8;
    margin-top: 8px;
}
.footer-bar {
    margin-top: 48px;
    padding-top: 20px;
    border-top: 1px solid rgba(148, 163, 184, 0.15);
    color: #64748b;
    font-size: 13px;
    text-align: center;
    line-height: 1.6;
}
</style>
""")

# Load dataset
df = load_data()

st.title("Ignis Atelier: Microgravity Experiment Lab")
st.caption("See what real ISS flame experiments measured, and exactly where the evidence stops.")

if df.empty:
    st.error("Error: Dataset 'data/measurements_all.csv' is missing or empty. Please ensure the CSV is placed in data/.")
    st.stop()

# -----------------------------------------------------------------------------
# SIDEBAR CONTROLS
# -----------------------------------------------------------------------------
st.sidebar.header("🔬 Experiment Parameters")

# 1. Material and Geometry selection
material_option = st.sidebar.radio(
    "Material & Geometry Family",
    options=["SIBAL Cotton-Fiberglass Fabric", "PMMA Rods"],
    help="Hard Rule 4: Microgravity combustion physics differ between thin sheets in concurrent flow and thick rods in opposed flow. Filter by family first."
)

if material_option == "SIBAL Cotton-Fiberglass Fabric":
    filtered_df = df[df["material"].str.contains("fabric", case=False, na=False)].copy()
    family_name = "SIBAL Fabric (Flat Sheet, Concurrent Flow)"
else:
    filtered_df = df[df["material"].str.contains("PMMA", case=False, na=False)].copy()
    family_name = "PMMA Cylindrical Rods (Opposed Flow)"
    
    # Rod diameter filter (PMMA only)
    avail_diameters = sorted([float(d) for d in filtered_df["sample_size_cm"].dropna().unique()])
    diameter_choice = st.sidebar.selectbox(
        "Rod Diameter (cm)",
        options=["All Diameters"] + [f"{d:.2f} cm ({d/2.54:.3f}\")" for d in avail_diameters],
        help="Filter by specific rod diameter tested in BASS-II."
    )
    if diameter_choice != "All Diameters":
        chosen_diam = float(diameter_choice.split()[0])
        filtered_df = filtered_df[abs(filtered_df["sample_size_cm"].astype(float) - chosen_diam) < 1e-4]

# Ensure numerical columns for slider bounds
o2_min = float(filtered_df["oxygen_percent"].min())
o2_max = float(filtered_df["oxygen_percent"].max())
flow_min = float(filtered_df["airflow_end_cm_s"].min())
flow_max = float(filtered_df["airflow_end_cm_s"].max())

st.sidebar.markdown("---")
st.sidebar.markdown(f"**Tested Range in Data:**")
st.sidebar.markdown(f"- Oxygen: `{o2_min:.1f}%` to `{o2_max:.1f}%`")
st.sidebar.markdown(f"- Airflow: `{flow_min:.2f} cm/s` to `{flow_max:.2f} cm/s`")

# Oxygen slider
sel_o2 = st.sidebar.slider(
    "Oxygen Concentration (%)",
    min_value=float(math.floor(o2_min * 10) / 10),
    max_value=float(math.ceil(o2_max * 10) / 10),
    value=float(round((o2_min + o2_max) / 2, 1)),
    step=0.1,
    help=f"Ambient oxygen molar percentage. Range bounded by real measurements: {o2_min:.1f}% - {o2_max:.1f}%"
)

# Airflow slider
sel_flow = st.sidebar.slider(
    "Forced Airflow Speed (cm/s)",
    min_value=float(math.floor(flow_min * 10) / 10),
    max_value=float(math.ceil(flow_max * 10) / 10),
    value=float(round(min(5.0, (flow_min + flow_max) / 2), 2)),
    step=0.1,
    help=f"Forced ventilation flow speed inside the duct. Range bounded by real measurements: {flow_min:.2f} - {flow_max:.2f} cm/s"
)

st.sidebar.markdown("---")
st.sidebar.markdown("### 💾 Scenario Management")
col_scen_a, col_scen_b = st.sidebar.columns(2)

current_scenario_dict = {
    "material_option": material_option,
    "family_name": family_name,
    "oxygen_percent": sel_o2,
    "airflow_cm_s": sel_flow,
    "diameter": diameter_choice if material_option == "PMMA Rods" else "1.2 & 2.2 cm width",
    "filtered_count": len(filtered_df)
}

if col_scen_a.button("Save as A", use_container_width=True):
    st.session_state["scenario_a"] = current_scenario_dict
    st.sidebar.success("Saved to Scenario A!")

if col_scen_b.button("Save as B", use_container_width=True):
    st.session_state["scenario_b"] = current_scenario_dict
    st.sidebar.success("Saved to Scenario B!")

# -----------------------------------------------------------------------------
# MAIN CONTENT AREA
# -----------------------------------------------------------------------------
# Compute plain Python evidence status
status, status_msg, top3_df = compute_evidence_status(filtered_df, sel_o2, sel_flow)

# Display Evidence Status Banner
if status == "Exact match":
    st.html(f"""
    <div class="status-badge-exact">
        <div class="status-title">🟢 Evidence Status: Exact Match</div>
        <div class="status-desc">{status_msg}</div>
        <div class="status-desc" style="margin-top:4px; font-size:12px; color:#86efac;">Thresholds: Oxygen diff ≤ {EXACT_O2_DIFF}% and Airflow diff ≤ {EXACT_FLOW_DIFF} cm/s.</div>
    </div>
    """)
elif status == "Nearby observation":
    st.html(f"""
    <div class="status-badge-nearby">
        <div class="status-title">🟡 Evidence Status: Nearby Observation</div>
        <div class="status-desc">{status_msg}</div>
        <div class="status-desc" style="margin-top:4px; font-size:12px; color:#fde047;">Nearest measured point is within scaled Euclidean distance ≤ {NEARBY_DISTANCE_MAX:.1f}, but not an exact match.</div>
    </div>
    """)
else:
    st.html(f"""
    <div class="status-badge-unsupported">
        <div class="status-title">⚪ Evidence Status: Not Supported by Data</div>
        <div class="status-desc">{status_msg}</div>
        <div class="status-desc" style="margin-top:4px; font-size:12px; color:#94a3b8;">No published ISS experiments occurred at or near these conditions in the BASS / BASS-II dataset.</div>
    </div>
    """)

# Two Column Layout: Flame Appearance & Selected Parameters
col_flame, col_info = st.columns([1, 1])

with col_flame:
    # Round Blue Flame Graphic (Illustrative, not a physical simulation)
    # At lower airflow, flames become smaller, rounder, and dimmer blue.
    # At higher airflow, flames stretch slightly along the flow axis.
    norm_flow = min(max(sel_flow / 10.0, 0.15), 2.0)
    base_radius = 42 + (norm_flow * 14)
    flame_rx = base_radius * (1.0 + (norm_flow - 0.5) * 0.25)
    flame_ry = base_radius * (1.0 - (norm_flow - 0.5) * 0.15)
    core_r = max(10, base_radius * 0.38)
    opacity_outer = min(0.85, 0.35 + norm_flow * 0.25)

    svg_flame = f"""<div class="flame-card">
<svg width="280" height="200" viewBox="0 0 280 200" style="background:#090d1a; border-radius:8px;">
<defs>
<radialGradient id="spaceBlueGlow" cx="50%" cy="50%" r="50%">
<stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.95" />
<stop offset="25%" stop-color="#38bdf8" stop-opacity="0.75" />
<stop offset="65%" stop-color="#0284c7" stop-opacity="{opacity_outer:.2f}" />
<stop offset="100%" stop-color="#0369a1" stop-opacity="0" />
</radialGradient>
<radialGradient id="innerCore" cx="50%" cy="50%" r="40%">
<stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
<stop offset="60%" stop-color="#bae6fd" stop-opacity="0.6" />
<stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
</radialGradient>
</defs>
<ellipse cx="140" cy="100" rx="{flame_rx:.1f}" ry="{flame_ry:.1f}" fill="url(#spaceBlueGlow)" />
<circle cx="140" cy="100" r="{core_r:.1f}" fill="url(#innerCore)" />
<line x1="40" y1="180" x2="100" y2="180" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3" />
<polygon points="100,177 107,180 100,183" fill="#38bdf8" />
<text x="115" y="183" fill="#94a3b8" font-size="11" font-family="sans-serif">Forced Flow ({sel_flow:.1f} cm/s)</text>
</svg>
<div class="flame-caption">Illustrative, not a physical simulation. In microgravity, flames spread out as slow, spherical blue diffusion envelopes.</div>
</div>"""
    st.html(svg_flame)

with col_info:
    st.markdown("### Selected Test Conditions")
    st.markdown(f"- **Material / Geometry:** `{family_name}`")
    st.markdown(f"- **Selected Oxygen:** `{sel_o2:.1f}% O₂`")
    st.markdown(f"- **Selected Airflow:** `{sel_flow:.2f} cm/s`")
    if material_option == "PMMA Rods":
        st.markdown(f"- **Diameter Filter:** `{diameter_choice}`")
        st.markdown(f"- **Pressure:** `Pressure: not stated in the source` *(PMMA rows contain no ambient pressure specification)*")
    else:
        st.markdown(f"- **Pressure:** `1.0 atm` *(BASS / BASS-II Microgravity Science Glovebox ambient)*")

    st.info(
        "💡 **Observation Guideline:** In low-speed forced flows in microgravity, when airflow velocity falls between 1 and 5 cm/s, "
        "radiative heat loss from the shrinking flame volume begins to outpace chemical heat release, precipitating radiative quenching extinction."
    )

st.write("")
st.subheader("Closest Measured Experimental Runs")
st.markdown("Top 3 closest published measurements from NASA BASS / BASS-II for the selected material and geometry:")

if top3_df.empty:
    st.warning("No measured rows found matching the current filters.")
else:
    for _, r in top3_df.iterrows():
        press_str = format_pressure(r)
        flow_str = format_airflow(r)
        spread_str = format_spread_rate(r.get("flame_spread_rate_1e3_cm_s"))
        outcome_disp = r.get("outcome_as_written") if pd.notna(r.get("outcome_as_written")) and str(r.get("outcome_as_written")).strip() != "" else r.get("outcome", "not_stated")
        notes_text = str(r.get("notes", "")).strip()
        if not notes_text or notes_text.lower() == "nan":
            notes_text = "No additional footnotes recorded for this run in source."

        size_str = f"{r.get('sample_size_cm')} cm ({r.get('sample_size_type', 'size')})"

        st.html(f"""
        <div class="measurement-card">
            <div class="card-header-row">
                <div class="card-run-id">Run ID: {r.get('run_id')} &nbsp;<span style="font-size:12px; font-weight:400; color:#cbd5e1;">({r.get('experiment')})</span></div>
                <div class="card-distance">Scaled Distance: {r.get('distance'):.3f}</div>
            </div>
            <div class="card-grid">
                <div><div class="grid-item-label">Oxygen</div><div class="grid-item-val">{r.get('oxygen_percent')}% O₂</div></div>
                <div><div class="grid-item-label">Airflow</div><div class="grid-item-val">{flow_str}</div></div>
                <div><div class="grid-item-label">Pressure</div><div class="grid-item-val">{press_str}</div></div>
                <div><div class="grid-item-label">Sample Size</div><div class="grid-item-val">{size_str}</div></div>
                <div><div class="grid-item-label">Outcome</div><div class="grid-item-val">{outcome_disp}</div></div>
                <div><div class="grid-item-label">Spread Rate</div><div class="grid-item-val">{spread_str}</div></div>
            </div>
            <div style="font-size:12px; color:#94a3b8; margin-top:4px;">
                <strong>Source:</strong> {r.get('source_title')} (<em>{r.get('page_or_figure')}</em>)
            </div>
            <div class="card-notes">
                <strong>Notes / Footnotes:</strong> {notes_text}
            </div>
        </div>
        """)

# Footer
st.html("""
<div class="footer-bar">
<strong>Ignis Atelier</strong> — Microgravity Fire Experiment Lab<br>
<em>"See what real ISS flame experiments measured, and exactly where the evidence stops."</em>
</div>
""")
