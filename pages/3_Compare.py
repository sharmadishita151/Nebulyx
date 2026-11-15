import math
import os
import pandas as pd
import streamlit as st

from utils.data import (
    load_data,
    compute_evidence_status,
    format_pressure,
    format_spread_rate,
    format_airflow
)

st.set_page_config(
    page_title="Ignis Atelier - Compare",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom styles
st.html("""
<style>
.stApp {
    background-color: #050811;
    color: #e2e8f0;
}
.compare-header-box {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 24px;
    font-size: 13px;
    line-height: 1.5;
}
.scenario-card {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 8px;
    padding: 18px;
    margin-bottom: 16px;
}
.scenario-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 12px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    padding-bottom: 6px;
}
.delta-box {
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 24px;
    text-align: center;
}
.delta-val {
    font-size: 18px;
    font-weight: 700;
    color: #38bdf8;
}
.warning-box {
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fcd34d;
    padding: 14px 18px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 1.5;
}
.measurement-box {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.15);
    border-radius: 6px;
    padding: 12px;
    margin-top: 10px;
    font-size: 12px;
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

df = load_data()

st.title("Ignis Atelier: Scenario Comparison")
st.caption("See what real ISS flame experiments measured, and exactly where the evidence stops.")

if df.empty:
    st.error("Error: Dataset 'data/measurements_all.csv' is missing or empty.")
    st.stop()

# Initialize session state if missing
if "scenario_a" not in st.session_state:
    st.session_state["scenario_a"] = None
if "scenario_b" not in st.session_state:
    st.session_state["scenario_b"] = None

# -----------------------------------------------------------------------------
# QUICK PRESETS SECTION
# -----------------------------------------------------------------------------
st.sidebar.header("⚡ Quick Preset Scenarios")
st.sidebar.caption("All presets pick exact conditions published in data/measurements_all.csv.")

preset_choice = st.sidebar.selectbox(
    "Choose a Preset Pair",
    [
        "-- Select a Preset --",
        "1. Fabric: Quench Flow vs Steady Spread (GMT45-T4 vs GMT45-T1)",
        "2. Fabric: Low-Speed Quench vs High-Speed Blowoff (GMT100-T13 vs GMT190-T21)",
        "3. PMMA Rod (0.64 cm): Low vs High Opposed Flow (S1-B16-4 vs S1-B16-1)",
        "4. Cross-Material Pair: Fabric Sheet vs PMMA Cylinder"
    ]
)

if preset_choice.startswith("1."):
    if st.sidebar.button("Apply Preset 1", use_container_width=True):
        st.session_state["scenario_a"] = {
            "material_option": "SIBAL Cotton-Fiberglass Fabric",
            "family_name": "SIBAL Fabric (Flat Sheet, Concurrent Flow)",
            "oxygen_percent": 18.7,
            "airflow_cm_s": 2.2,
            "diameter": "2.2 cm width",
            "preset_ref": "GMT45-T4 (Quenched at 2.2 cm/s)"
        }
        st.session_state["scenario_b"] = {
            "material_option": "SIBAL Cotton-Fiberglass Fabric",
            "family_name": "SIBAL Fabric (Flat Sheet, Concurrent Flow)",
            "oxygen_percent": 18.5,
            "airflow_cm_s": 10.0,
            "diameter": "2.2 cm width",
            "preset_ref": "GMT45-T1 (Steady spread at 10.0 cm/s)"
        }
        st.rerun()

elif preset_choice.startswith("2."):
    if st.sidebar.button("Apply Preset 2", use_container_width=True):
        st.session_state["scenario_a"] = {
            "material_option": "SIBAL Cotton-Fiberglass Fabric",
            "family_name": "SIBAL Fabric (Flat Sheet, Concurrent Flow)",
            "oxygen_percent": 17.5,
            "airflow_cm_s": 2.2,
            "diameter": "2.2 cm width",
            "preset_ref": "GMT100-T13 (Quenched at 2.2 cm/s, 17.5% O₂)"
        }
        st.session_state["scenario_b"] = {
            "material_option": "SIBAL Cotton-Fiberglass Fabric",
            "family_name": "SIBAL Fabric (Flat Sheet, Concurrent Flow)",
            "oxygen_percent": 17.2,
            "airflow_cm_s": 47.0,
            "diameter": "1.2 cm width",
            "preset_ref": "GMT190-T21 (Blow-off at 47.0 cm/s, 17.2% O₂)"
        }
        st.rerun()

elif preset_choice.startswith("3."):
    if st.sidebar.button("Apply Preset 3", use_container_width=True):
        st.session_state["scenario_a"] = {
            "material_option": "PMMA Rods",
            "family_name": "PMMA Cylindrical Rods (Opposed Flow)",
            "oxygen_percent": 18.2,
            "airflow_cm_s": 0.72,
            "diameter": "0.64 cm",
            "preset_ref": "S1-B16-4 (Spread rate 5.68 × 10⁻³ cm/s at 0.72 cm/s flow)"
        }
        st.session_state["scenario_b"] = {
            "material_option": "PMMA Rods",
            "family_name": "PMMA Cylindrical Rods (Opposed Flow)",
            "oxygen_percent": 18.2,
            "airflow_cm_s": 7.55,
            "diameter": "0.64 cm",
            "preset_ref": "S1-B16-1 (Spread rate 6.78 × 10⁻³ cm/s at 7.55 cm/s flow)"
        }
        st.rerun()

elif preset_choice.startswith("4."):
    if st.sidebar.button("Apply Preset 4", use_container_width=True):
        st.session_state["scenario_a"] = {
            "material_option": "SIBAL Cotton-Fiberglass Fabric",
            "family_name": "SIBAL Fabric (Flat Sheet, Concurrent Flow)",
            "oxygen_percent": 18.7,
            "airflow_cm_s": 2.2,
            "diameter": "2.2 cm width",
            "preset_ref": "GMT45-T4 (Fabric sheet)"
        }
        # Preset B for cross-material must use PMMA rows only
        st.session_state["scenario_b"] = {
            "material_option": "PMMA Rods",
            "family_name": "PMMA Cylindrical Rods (Opposed Flow)",
            "oxygen_percent": 18.5,
            "airflow_cm_s": 2.0,
            "diameter": "0.95 cm",
            "preset_ref": "S1-B4-1 (PMMA 0.95 cm rod)"
        }
        st.rerun()

st.sidebar.markdown("---")
if st.sidebar.button("Clear Scenarios", use_container_width=True):
    st.session_state["scenario_a"] = None
    st.session_state["scenario_b"] = None
    st.rerun()

# -----------------------------------------------------------------------------
# MAIN DISPLAY
# -----------------------------------------------------------------------------
scen_a = st.session_state.get("scenario_a")
scen_b = st.session_state.get("scenario_b")

if not scen_a and not scen_b:
    st.info(
        "👋 **No scenarios saved yet.**\n\n"
        "To compare test conditions:\n"
        "1. Open the **Experiment Lab** and click **Save as A** and **Save as B**.\n"
        "2. Or pick one of the **Quick Presets** in the sidebar to load real published test conditions instantly."
    )
    st.stop()

# Warning if material or geometry differs
is_cross_material = False
if scen_a and scen_b:
    if scen_a.get("material_option") != scen_b.get("material_option") or scen_a.get("family_name") != scen_b.get("family_name"):
        is_cross_material = True
        st.html("""
        <div class="warning-box">
            <strong>⚠️ Not directly comparable:</strong> Scenarios A and B differ in material, geometry, or flow configuration.
            Microgravity combustion mechanisms differ fundamentally between thermally thin flat fabrics in concurrent flow 
            and thermally thick cylindrical plastic rods in opposed flow.
        </div>
        """)

# Differences in Oxygen and Airflow
if scen_a and scen_b:
    d_o2 = scen_b["oxygen_percent"] - scen_a["oxygen_percent"]
    d_flow = scen_b["airflow_cm_s"] - scen_a["airflow_cm_s"]
    
    st.html(f"""
    <div class="delta-box">
        <div style="font-size:12px; color:#94a3b8; text-transform:uppercase; margin-bottom:4px;">Difference (Scenario B − Scenario A)</div>
        <div style="display:flex; justify-content:space-around; align-items:center;">
            <div>
                <span style="font-size:12px; color:#cbd5e1;">Δ Oxygen:</span> 
                <span class="delta-val">{d_o2:+.1f}% O₂</span>
            </div>
            <div>
                <span style="font-size:12px; color:#cbd5e1;">Δ Airflow:</span> 
                <span class="delta-val">{d_flow:+.2f} cm/s</span>
            </div>
        </div>
    </div>
    """)

# Side-by-Side Display
col_a, col_b = st.columns(2)

def render_scenario_column(scen, label, col_color):
    if not scen:
        st.html(f"""
        <div class="scenario-card" style="border-color: rgba(148, 163, 184, 0.2);">
            <div class="scenario-title" style="color: #94a3b8;">Scenario {label} (Not Set)</div>
            <p style="font-size:13px; color:#64748b;">Save a scenario from the Experiment Lab or apply a preset.</p>
        </div>
        """)
        return

    mat_opt = scen.get("material_option")
    if "fabric" in mat_opt.lower():
        sub_df = df[df["material"].str.contains("fabric", case=False, na=False)].copy()
        press_display = "1.0 atm (Glovebox ambient)"
    else:
        sub_df = df[df["material"].str.contains("PMMA", case=False, na=False)].copy()
        press_display = "Pressure: not stated in the source"

    status, status_msg, top3 = compute_evidence_status(sub_df, scen["oxygen_percent"], scen["airflow_cm_s"])

    status_color = "#4ade80" if status == "Exact match" else ("#facc15" if status == "Nearby observation" else "#94a3b8")

    st.html(f"""
    <div class="scenario-card" style="border-color: {col_color};">
        <div class="scenario-title" style="color: {col_color};">Scenario {label}: {scen['family_name']}</div>
        <div style="font-size:13px; margin-bottom:10px;">
            <div><strong>Oxygen:</strong> {scen['oxygen_percent']:.1f}% O₂</div>
            <div><strong>Airflow:</strong> {scen['airflow_cm_s']:.2f} cm/s</div>
            <div><strong>Pressure:</strong> {press_display}</div>
            <div><strong>Geometry / Size:</strong> {scen.get('diameter', 'Standard')}</div>
        </div>
        <div style="padding:8px 12px; background:rgba(30,41,59,0.6); border-radius:6px; margin-bottom:12px; border-left:3px solid {status_color};">
            <strong style="color:{status_color}; font-size:13px;">Evidence Status: {status}</strong><br>
            <span style="font-size:12px; color:#cbd5e1;">{status_msg}</span>
        </div>
    </div>
    """)

    st.markdown(f"**Nearest Measured Row for Scenario {label}:**")
    if not top3.empty:
        r = top3.iloc[0]
        press_row = format_pressure(r)
        flow_row = format_airflow(r)
        spread_row = format_spread_rate(r.get("flame_spread_rate_1e3_cm_s"))
        outcome_disp = r.get("outcome_as_written") if pd.notna(r.get("outcome_as_written")) and str(r.get("outcome_as_written")).strip() != "" else r.get("outcome", "not_stated")
        notes_txt = str(r.get("notes", "")).strip()
        if not notes_txt or notes_txt.lower() == "nan":
            notes_txt = "No footnotes in source."

        st.html(f"""
        <div class="measurement-box">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <strong style="color:#38bdf8;">Run ID: {r.get('run_id')} ({r.get('experiment')})</strong>
                <span style="color:#94a3b8;">Dist: {r.get('distance'):.3f}</span>
            </div>
            <div><strong>Conditions:</strong> {r.get('oxygen_percent')}% O₂ | Flow: {flow_row}</div>
            <div><strong>Outcome:</strong> {outcome_disp} | <strong>Spread Rate:</strong> {spread_row}</div>
            <div><strong>Pressure:</strong> {press_row}</div>
            <div style="margin-top:6px; font-size:11px; color:#94a3b8;">
                <strong>Source:</strong> {r.get('source_title')} ({r.get('page_or_figure')})
            </div>
            <div style="margin-top:6px; padding:6px 8px; background:rgba(15,23,42,0.6); border-radius:4px; font-size:11px; color:#cbd5e1;">
                <strong>Notes:</strong> {notes_txt}
            </div>
        </div>
        """)
    else:
        st.write("No matching measured rows.")

with col_a:
    render_scenario_column(scen_a, "A", "#facc15")

with col_b:
    render_scenario_column(scen_b, "B", "#f87171")

# Footer
st.html("""
<div class="footer-bar">
<strong>Ignis Atelier</strong> — Microgravity Fire Experiment Lab<br>
<em>"See what real ISS flame experiments measured, and exactly where the evidence stops."</em>
</div>
""")
