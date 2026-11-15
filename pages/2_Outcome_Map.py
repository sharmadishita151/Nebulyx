import math
import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from utils.data import (
    load_data,
    format_pressure,
    format_spread_rate,
    format_airflow
)

st.set_page_config(
    page_title="Ignis Atelier - Outcome Map",
    page_icon="🗺️",
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
.map-info-box {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 20px;
    font-size: 13px;
    line-height: 1.5;
}
.evidence-drawer-box {
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 8px;
    padding: 18px;
    margin-top: 14px;
}
.drawer-title {
    font-size: 17px;
    font-weight: 700;
    color: #38bdf8;
    margin-bottom: 8px;
}
.drawer-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 12px;
}
.drawer-label {
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 600;
}
.drawer-val {
    font-size: 13px;
    color: #f1f5f9;
    font-weight: 500;
}
.drawer-notes {
    background: rgba(30, 41, 59, 0.7);
    border-left: 3px solid #38bdf8;
    padding: 10px 14px;
    border-radius: 4px;
    font-size: 12px;
    color: #cbd5e1;
    margin-top: 10px;
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

st.title("Ignis Atelier: Microgravity Outcome Map")
st.caption("See what real ISS flame experiments measured, and exactly where the evidence stops.")

if df.empty:
    st.error("Error: Dataset 'data/measurements_all.csv' is missing or empty.")
    st.stop()

# -----------------------------------------------------------------------------
# HARD RULE 4: NEVER MIX DIFFERENT EXPERIMENT TYPES IN ONE CHART
# -----------------------------------------------------------------------------
st.sidebar.header("🗺️ Map Filters")

view_type = st.sidebar.radio(
    "Select Experiment Family",
    options=["SIBAL Fabric (Concurrent Flow)", "PMMA Rods (Opposed Flow)"],
    help="Hard Rule 4: Never mix different experiment types in one chart. Filter by material, geometry, and flow regime."
)

if view_type == "SIBAL Fabric (Concurrent Flow)":
    sub_df = df[df["material"].str.contains("fabric", case=False, na=False)].copy()
    
    # Filter by width
    avail_widths = sorted([float(w) for w in sub_df["sample_size_cm"].dropna().unique()])
    chosen_width = st.sidebar.selectbox("Sample Width", ["All Widths"] + [f"{w} cm" for w in avail_widths])
    if chosen_width != "All Widths":
        w_val = float(chosen_width.split()[0])
        sub_df = sub_df[abs(sub_df["sample_size_cm"].astype(float) - w_val) < 1e-4]
        
    # Filter by experiment series (BASS vs BASS-II)
    avail_exp = ["All Experiments"] + sorted(sub_df["experiment"].dropna().unique().tolist())
    chosen_exp = st.sidebar.selectbox("Experiment Series", avail_exp)
    if chosen_exp != "All Experiments":
        sub_df = sub_df[sub_df["experiment"] == chosen_exp]
        
    # Filter by outcome
    avail_outcomes = ["All Outcomes"] + sorted(sub_df["outcome"].dropna().unique().tolist())
    chosen_outcome = st.sidebar.selectbox("Outcome Filter", avail_outcomes)
    if chosen_outcome != "All Outcomes":
        sub_df = sub_df[sub_df["outcome"] == chosen_outcome]

else:
    sub_df = df[df["material"].str.contains("PMMA", case=False, na=False)].copy()
    
    # Filter by rod diameter
    avail_diameters = sorted([float(d) for d in sub_df["sample_size_cm"].dropna().unique()])
    chosen_diam = st.sidebar.selectbox("Rod Diameter", ["All Diameters"] + [f"{d:.2f} cm ({d/2.54:.3f}\")" for d in avail_diameters])
    if chosen_diam != "All Diameters":
        d_val = float(chosen_diam.split()[0])
        sub_df = sub_df[abs(sub_df["sample_size_cm"].astype(float) - d_val) < 1e-4]
        
    # Filter by PMMA color / type
    avail_mat = ["All PMMA Variants"] + sorted(sub_df["material"].dropna().unique().tolist())
    chosen_mat = st.sidebar.selectbox("Material Variant", avail_mat)
    if chosen_mat != "All PMMA Variants":
        sub_df = sub_df[sub_df["material"] == chosen_mat]

st.html(f"""
<div class="map-info-box">
    <strong>Displaying:</strong> {view_type} &nbsp;|&nbsp; 
    <strong>Active Filter Matches:</strong> {len(sub_df)} real ISS data points &nbsp;|&nbsp;
    <strong>Axis:</strong> X = Oxygen Molar % &nbsp;•&nbsp; Y = Airflow Speed (cm/s).<br>
    <em>Thin connecting lines indicate tests where airflow was dynamically altered (e.g. reduced towards extinction).</em>
</div>
""")

# -----------------------------------------------------------------------------
# PLOTLY CHART GENERATION
# -----------------------------------------------------------------------------
fig = go.Figure()

if view_type == "SIBAL Fabric (Concurrent Flow)":
    # Outcome styles: Color and Marker shape by outcome
    outcome_styles = {
        "quenched": {"color": "#ef4444", "symbol": "diamond", "name": "Quenched"},
        "blowoff": {"color": "#f97316", "symbol": "x", "name": "Blow-off"},
        "no_blowoff": {"color": "#a855f7", "symbol": "cross", "name": "No Blow-off"},
        "no_ignition": {"color": "#64748b", "symbol": "square", "name": "No Ignition"},
        "ignited": {"color": "#eab308", "symbol": "circle", "name": "Ignited (Reused)"},
        "one_sided_flame": {"color": "#ec4899", "symbol": "triangle-up", "name": "One-Sided Flame"},
        "not_stated": {"color": "#38bdf8", "symbol": "circle-open", "name": "Not Stated in Source"}
    }

    # 1. Draw airflow transition lines for runs where airflow changed (start != end)
    line_traces_added = False
    for _, r in sub_df.iterrows():
        try:
            start_f = float(r["airflow_start_cm_s"])
            end_f = float(r["airflow_end_cm_s"])
            o2 = float(r["oxygen_percent"])
        except (ValueError, TypeError):
            continue

        if abs(start_f - end_f) > 0.05:
            fig.add_trace(go.Scatter(
                x=[o2, o2],
                y=[start_f, end_f],
                mode="lines",
                line=dict(color="rgba(148, 163, 184, 0.45)", width=1.8, dash="dot"),
                hoverinfo="skip",
                showlegend=not line_traces_added,
                name="Flow Reduced During Run"
            ))
            line_traces_added = True

    # 2. Add scatter points grouped by outcome
    for outcome_key, style in outcome_styles.items():
        grp = sub_df[sub_df["outcome"] == outcome_key]
        if grp.empty:
            continue

        hover_texts = []
        for _, row in grp.iterrows():
            press_txt = format_pressure(row)
            flow_txt = format_airflow(row)
            notes_txt = str(row.get("notes", "")).strip()
            if not notes_txt or notes_txt.lower() == "nan":
                notes_txt = "None"
            hover_texts.append(
                f"<b>Run ID: {row['run_id']}</b> ({row['experiment']})<br>"
                f"Material: {row['material']}<br>"
                f"Width: {row['sample_size_cm']} cm<br>"
                f"Oxygen: {row['oxygen_percent']}%<br>"
                f"Airflow: {flow_txt}<br>"
                f"Pressure: {press_txt}<br>"
                f"Outcome: {row['outcome_as_written'] if pd.notna(row['outcome_as_written']) and str(row['outcome_as_written']).strip() != '' else row['outcome']}<br>"
                f"Source: {row['source_title']}<br>"
                f"Page/Fig: {row['page_or_figure']}<br>"
                f"Notes: {notes_txt}"
            )

        fig.add_trace(go.Scatter(
            x=grp["oxygen_percent"],
            y=grp["airflow_end_cm_s"],
            mode="markers",
            marker=dict(
                size=12,
                color=style["color"],
                symbol=style["symbol"],
                line=dict(width=1.5, color="#ffffff")
            ),
            name=style["name"],
            text=hover_texts,
            hoverinfo="text"
        ))

    # Add Region Boundaries & Missing Evidence Annotations
    fig.add_shape(
        type="rect",
        x0=15.5, x1=16.3, y0=0, y1=60,
        fillcolor="rgba(239, 68, 68, 0.05)",
        line=dict(color="rgba(239, 68, 68, 0.2)", width=1, dash="dash")
    )
    fig.add_annotation(
        x=15.9, y=45,
        text="No measurements in this region<br>(Below tested O₂ limits)",
        showarrow=False,
        font=dict(size=10, color="#f87171"),
        align="center",
        bgcolor="rgba(15, 23, 42, 0.8)",
        bordercolor="rgba(239, 68, 68, 0.4)",
        borderwidth=1,
        borderpad=4
    )

    fig.add_annotation(
        x=19.5, y=50,
        text="No measurements in this region<br>(High flow blow-off unmapped)",
        showarrow=False,
        font=dict(size=10, color="#94a3b8"),
        align="center",
        bgcolor="rgba(15, 23, 42, 0.8)",
        bordercolor="rgba(148, 163, 184, 0.3)",
        borderwidth=1,
        borderpad=4
    )

    fig.update_layout(
        title="SIBAL Cotton-Fiberglass Fabric Flammability & Quenching Map (Concurrent Flow)",
        xaxis_title="Ambient Oxygen Concentration (% O₂)",
        yaxis_title="Airflow Speed (cm/s)",
        xaxis=dict(range=[15.5, 22.0], dtick=1.0, gridcolor="rgba(148, 163, 184, 0.15)"),
        yaxis=dict(range=[0, 58], dtick=10, gridcolor="rgba(148, 163, 184, 0.15)"),
        template="plotly_dark",
        paper_bgcolor="#090d1a",
        plot_bgcolor="#090d1a",
        height=580,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            bgcolor="rgba(15, 23, 42, 0.8)"
        )
    )

else:
    # PMMA Rods: Marker color and size mapped to flame_spread_rate_1e3_cm_s
    # Ensure numerical spread rate
    pmma_valid = sub_df.dropna(subset=["flame_spread_rate_1e3_cm_s"]).copy()
    pmma_valid["spread_rate_val"] = pmma_valid["flame_spread_rate_1e3_cm_s"].astype(float)

    hover_texts = []
    for _, row in pmma_valid.iterrows():
        press_txt = format_pressure(row)
        flow_txt = format_airflow(row)
        notes_txt = str(row.get("notes", "")).strip()
        hover_texts.append(
            f"<b>Run ID: {row['run_id']}</b><br>"
            f"Material: {row['material']}<br>"
            f"Diameter: {row['sample_size_cm']} cm ({float(row['sample_size_cm'])/2.54:.3f}\")<br>"
            f"Spread Rate: {row['spread_rate_val']:.2f} × 10⁻³ cm/s<br>"
            f"Oxygen: {row['oxygen_percent']}%<br>"
            f"Airflow: {flow_txt}<br>"
            f"Pressure: {press_txt}<br>"
            f"Source: {row['source_title']}<br>"
            f"Page/Fig: {row['page_or_figure']}<br>"
            f"Notes: {notes_txt}"
        )

    # Color scale by flame spread rate with continuous colorbar
    fig.add_trace(go.Scatter(
        x=pmma_valid["oxygen_percent"],
        y=pmma_valid["airflow_end_cm_s"],
        mode="markers",
        marker=dict(
            size=pmma_valid["spread_rate_val"].apply(lambda v: max(10, min(24, v * 2.0))),
            color=pmma_valid["spread_rate_val"],
            colorscale="Viridis",
            showscale=True,
            colorbar=dict(
                title="Spread Rate<br>(10⁻³ cm/s)",
                tickformat=".1f",
                thickness=16,
                len=0.85
            ),
            line=dict(width=1.5, color="#ffffff"),
            opacity=0.9
        ),
        text=hover_texts,
        hoverinfo="text",
        name="PMMA Measurements"
    ))

    # Mark regions far from any data
    fig.add_annotation(
        x=20.0, y=6.0,
        text="No measurements in this region<br>(High flow opposed regime unmapped)",
        showarrow=False,
        font=dict(size=10, color="#94a3b8"),
        align="center",
        bgcolor="rgba(15, 23, 42, 0.8)",
        bordercolor="rgba(148, 163, 184, 0.3)",
        borderwidth=1,
        borderpad=4
    )
    fig.add_annotation(
        x=16.0, y=2.0,
        text="No measurements in this region<br>(O₂ < 16.8% unstudied)",
        showarrow=False,
        font=dict(size=10, color="#f87171"),
        align="center",
        bgcolor="rgba(15, 23, 42, 0.8)",
        bordercolor="rgba(239, 68, 68, 0.4)",
        borderwidth=1,
        borderpad=4
    )

    fig.update_layout(
        title="PMMA Cylindrical Rods Flame Spread Rate Map (Opposed Flow)",
        xaxis_title="Ambient Oxygen Concentration (% O₂)",
        yaxis_title="Opposed Airflow Speed (cm/s)",
        xaxis=dict(range=[15.5, 22.0], dtick=1.0, gridcolor="rgba(148, 163, 184, 0.15)"),
        yaxis=dict(range=[0, 9.0], dtick=1.0, gridcolor="rgba(148, 163, 184, 0.15)"),
        template="plotly_dark",
        paper_bgcolor="#090d1a",
        plot_bgcolor="#090d1a",
        height=580
    )

# -----------------------------------------------------------------------------
# HIGHLIGHT SELECTED SCENARIOS (Scenario A and Scenario B)
# -----------------------------------------------------------------------------
scen_a = st.session_state.get("scenario_a")
if scen_a and ((view_type.startswith("SIBAL") and "Fabric" in scen_a["material_option"]) or (view_type.startswith("PMMA") and "PMMA" in scen_a["material_option"])):
    fig.add_trace(go.Scatter(
        x=[scen_a["oxygen_percent"]],
        y=[scen_a["airflow_cm_s"]],
        mode="markers",
        marker=dict(symbol="star", size=20, color="#facc15", line=dict(color="#ffffff", width=2)),
        name="Scenario A Target",
        hovertext=f"Scenario A Target: {scen_a['oxygen_percent']}% O₂, {scen_a['airflow_cm_s']} cm/s",
        hoverinfo="text"
    ))

scen_b = st.session_state.get("scenario_b")
if scen_b and ((view_type.startswith("SIBAL") and "Fabric" in scen_b["material_option"]) or (view_type.startswith("PMMA") and "PMMA" in scen_b["material_option"])):
    fig.add_trace(go.Scatter(
        x=[scen_b["oxygen_percent"]],
        y=[scen_b["airflow_cm_s"]],
        mode="markers",
        marker=dict(symbol="diamond-wide", size=20, color="#f87171", line=dict(color="#ffffff", width=2)),
        name="Scenario B Target",
        hovertext=f"Scenario B Target: {scen_b['oxygen_percent']}% O₂, {scen_b['airflow_cm_s']} cm/s",
        hoverinfo="text"
    ))

# Render chart
st.plotly_chart(fig, use_container_width=True)

# -----------------------------------------------------------------------------
# EVIDENCE DRAWER (EXPANDER)
# -----------------------------------------------------------------------------
st.write("")
st.subheader("🔍 Evidence Drawer: Inspect Experimental Run Details")

run_list = sub_df["run_id"].unique().tolist()
selected_run_id = st.selectbox(
    "Select Run ID to open full experimental record:",
    options=run_list,
    help="Select any measured run_id from data/measurements_all.csv to examine source citation, exact conditions, notes, and experimental limitations."
)

if selected_run_id:
    run_row = sub_df[sub_df["run_id"] == selected_run_id].iloc[0]
    
    with st.expander(f"📁 Evidence File: Run ID {selected_run_id} ({run_row.get('material')})", expanded=True):
        press_str = format_pressure(run_row)
        flow_str = format_airflow(run_row)
        spread_str = format_spread_rate(run_row.get("flame_spread_rate_1e3_cm_s"))
        outcome_disp = run_row.get("outcome_as_written") if pd.notna(run_row.get("outcome_as_written")) and str(run_row.get("outcome_as_written")).strip() != "" else run_row.get("outcome", "not_stated")
        notes_text = str(run_row.get("notes", "")).strip()
        if not notes_text or notes_text.lower() == "nan":
            notes_text = "No footnotes recorded in source for this measurement."

        st.html(f"""
        <div class="evidence-drawer-box">
            <div class="drawer-title">Run ID: {selected_run_id} &nbsp;|&nbsp; {run_row.get('experiment')}</div>
            <div class="drawer-grid">
                <div><div class="drawer-label">Material</div><div class="drawer-val">{run_row.get('material')}</div></div>
                <div><div class="drawer-label">Geometry</div><div class="drawer-val">{run_row.get('geometry')}</div></div>
                <div><div class="drawer-label">Flow Direction</div><div class="drawer-val">{run_row.get('flow_direction')}</div></div>
                <div><div class="drawer-label">Sample Size</div><div class="drawer-val">{run_row.get('sample_size_cm')} cm ({run_row.get('sample_size_type')})</div></div>
                <div><div class="drawer-label">Oxygen Molar %</div><div class="drawer-val">{run_row.get('oxygen_percent')}% O₂</div></div>
                <div><div class="drawer-label">Airflow (Start → End)</div><div class="drawer-val">{flow_str}</div></div>
                <div><div class="drawer-label">Pressure</div><div class="drawer-val">{press_str}</div></div>
                <div><div class="drawer-label">Recorded Outcome</div><div class="drawer-val">{outcome_disp}</div></div>
                <div><div class="drawer-label">Flame Spread Rate</div><div class="drawer-val">{spread_str}</div></div>
            </div>
            <div style="font-size:13px; color:#cbd5e1; margin-top:8px;">
                <strong>Primary Source Publication:</strong><br>
                {run_row.get('source_title')}<br>
                <em>Location in publication: {run_row.get('page_or_figure')}</em>
            </div>
            <div class="drawer-notes">
                <strong>Source Footnotes & Instrumentation Notes:</strong><br>
                {notes_text}
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
