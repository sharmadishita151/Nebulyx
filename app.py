import math
import os
import streamlit as st
import streamlit.components.v1 as components

from utils.data import load_data, startup_check
from utils.landing import get_landing_hero_html
from utils.accretion_hero import get_accretion_hero_html

# Page configuration - browser tab title MUST be Ignis Atelier
st.set_page_config(
    page_title="Ignis Atelier",
    page_icon="🔥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state for Scenarios A and B
if "scenario_a" not in st.session_state:
    st.session_state["scenario_a"] = None
if "scenario_b" not in st.session_state:
    st.session_state["scenario_b"] = None

# Custom styling for Ignis Atelier theme
st.html("""
<style>
/* Ignis Atelier Global Styles */
.stApp {
    background-color: #030105;
    color: #e2e8f0;
}
.vahni-header {
    border-bottom: 1px solid rgba(249, 115, 22, 0.25);
    padding-bottom: 12px;
    margin-bottom: 24px;
}
.notice-box {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.35);
    border-radius: 8px;
    padding: 14px 18px;
    margin-top: 16px;
    margin-bottom: 24px;
    color: #fca5a5;
    font-size: 14px;
    line-height: 1.5;
}
.notice-title {
    font-weight: 700;
    color: #f87171;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}
.stat-card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(249, 115, 22, 0.25);
    border-radius: 8px;
    padding: 16px;
    text-align: center;
}
.stat-value {
    font-size: 26px;
    font-weight: 800;
    color: #ff7700;
}
.stat-label {
    font-size: 12px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
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

# Load dataset and execute startup terminal check
df = load_data()

# -----------------------------------------------------------------------------
# HERO VISUALIZATION TOGGLE (Black Hole Accretion Disk is Default & Prominent)
# -----------------------------------------------------------------------------
st.sidebar.markdown("### 🪐 Interactive 3D Hero Mode")
hero_mode = st.sidebar.radio(
    "Choose Visualization View:",
    options=[
        "🔥 3D Black Hole Accretion Disk (Combustion Fire)",
        "🌍 3D Earth & ISS Orbit (Microgravity Lab)"
    ],
    index=0,
    help="Default is the prominent 3D interactive Black Hole Accretion Disk with Keplerian orbits, Einstein gravitational lensing arcs, and 3D mouse drag rotation."
)

# -----------------------------------------------------------------------------
# 1. LANDING HERO (Interactive 3D Black Hole or 3D Earth/ISS)
# -----------------------------------------------------------------------------
if "Black Hole" in hero_mode:
    hero_html = get_accretion_hero_html()
else:
    hero_html = get_landing_hero_html()

components.html(hero_html, height=640)

# -----------------------------------------------------------------------------
# 2. MANDATORY PROTOCOL NOTICE
# -----------------------------------------------------------------------------
st.html("""
<div class="notice-box">
<div class="notice-title">⚠️ Mandatory Scientific Research Notice</div>
<div>Research and education prototype, not a certified fire-safety tool and not a predictive model. All data shown derives exclusively from peer-reviewed NASA BASS and BASS-II spaceflight experiments conducted aboard the International Space Station. Ignis Atelier contains no machine-learning extrapolation and never evaluates spacecraft safety.</div>
</div>
""")

# -----------------------------------------------------------------------------
# 3. NATIVE NAVIGATION BUTTONS
# -----------------------------------------------------------------------------
col_nav1, col_nav2 = st.columns(2)
with col_nav1:
    st.page_link(
        "pages/1_Experiment_Lab.py",
        label="🔬 Enter the Experiment Lab",
        help="Interactively select oxygen and airflow conditions, inspect evidence proximity, and view nearest measurements.",
        use_container_width=True
    )
with col_nav2:
    st.page_link(
        "pages/2_Outcome_Map.py",
        label="🗺️ Open the Outcome Map",
        help="Explore the full 2D empirical scatter space of oxygen vs. airflow, flammability boundaries, and evidence drawers.",
        use_container_width=True
    )

st.write("")

# -----------------------------------------------------------------------------
# 4. OVERVIEW & DATASET HIGHLIGHTS
# -----------------------------------------------------------------------------
st.subheader("Ignis Atelier: Researching Microgravity Combustion")
st.markdown(
    """
    **Ignis Atelier** (*Sanskrit for "Eye of Fire"*) is an interactive microgravity combustion laboratory built for 
    the **NASA Space Apps Challenge "Flame in Freefall"**.
    
    Combustion aboard orbiting spacecraft behaves in fundamentally different ways than on Earth:
    - **No Buoyant Convection:** On Earth, hot gases become buoyant and rise vigorously, feeding fresh oxygen into the flame base and stretching it into a flickering teardrop.
    - **Pure Diffusion & Forced Ventilation:** In microgravity, buoyancy ceases. In quiescent air, flames quickly suffocate in their own combustion products. When forced low-speed airflow is supplied, flames spread as cool, dim, circular blue envelopes.
    - **Low-Speed Quenching Boundary:** At low ventilation speeds (1 to 5 cm/s), radiative and conductive heat loss outpaces heat release, causing sudden **quenching extinction**.
    """
)

# Dataset Summary Metrics
c1, c2, c3, c4 = st.columns(4)
with c1:
    fabric_count = len(df[df["material"].str.contains("fabric", case=False, na=False)]) if not df.empty else 0
    st.html(f"""
    <div class="stat-card">
        <div class="stat-value">{fabric_count}</div>
        <div class="stat-label">SIBAL Fabric Tests (Concurrent)</div>
    </div>
    """)
with c2:
    pmma_count = len(df[df["material"].str.contains("PMMA", case=False, na=False)]) if not df.empty else 0
    st.html(f"""
    <div class="stat-card">
        <div class="stat-value">{pmma_count}</div>
        <div class="stat-label">PMMA Rod Tests (Opposed)</div>
    </div>
    """)
with c3:
    total_count = len(df) if not df.empty else 0
    st.html(f"""
    <div class="stat-card">
        <div class="stat-value">{total_count}</div>
        <div class="stat-label">Total Real ISS Measurements</div>
    </div>
    """)
with c4:
    st.html("""
    <div class="stat-card">
        <div class="stat-value">0</div>
        <div class="stat-label">AI Predictions / Synthetics</div>
    </div>
    """)

st.write("")
col_left, col_right = st.columns(2)

with col_left:
    st.markdown("### Two Complementary Experiment Families")
    st.markdown(
        """
        1. **Concurrent Flow Fabric Tests (31 rows):**
           - **Material:** SIBAL composite fabric blend (75% cotton cellulose, 25% fiberglass mesh).
           - **Geometry:** Flat thin sheets (1.2 cm and 2.2 cm width, 10 cm exposed length).
           - **Flow:** Concurrent forced flow (0 to 55 cm/s). Airflow was actively stepped down during tests to locate the low-speed quenching boundary.
           - **Outcomes:** `quenched`, `blowoff`, `no_blowoff`, `no_ignition`, `ignited`, `one_sided_flame`, `not_stated`.
        
        2. **Opposed Flow PMMA Cylinders (52 rows):**
           - **Material:** Polymethyl methacrylate (PMMA; black cast, clear cast).
           - **Geometry:** Cylindrical solid rods of 0.64 cm (1/4"), 0.95 cm (3/8"), and 1.27 cm (1/2") diameter.
           - **Flow:** Opposed forced flow (0.41 to 7.55 cm/s).
           - **Outcomes:** Quantitative steady-state flame spread rates (units: $10^{-3}\\text{ cm/s}$).
        """
    )

with col_right:
    st.markdown("### Scientific Ground Truth Principles")
    st.markdown(
        """
        - **Zero Synthetic Rows:** Every single point shown in the application exists in peer-reviewed publications from the NASA BASS and BASS-II investigations.
        - **Explicit Missing Evidence:** Where NASA did not record data, Ignis Atelier explicitly informs the user that no experimental measurements exist.
        - **Geometry Separation:** Concurrently spreading thin fabrics and opposed thick PMMA rods possess distinct physics and are never intermingled.
        - **Hand-Transcribed Precision:** Accurately reflects notes, footnotes, O₂ measurement uncertainties (±0.3%), and sensor qualifications.
        """
    )

# -----------------------------------------------------------------------------
# 5. FOOTER
# -----------------------------------------------------------------------------
st.html("""
<div class="footer-bar">
<strong>Ignis Atelier</strong> — Microgravity Fire Experiment Lab<br>
<em>"See what real ISS flame experiments measured, and exactly where the evidence stops."</em><br>
Developed for NASA Space Apps Challenge "Flame in Freefall" • Data: NASA BASS / BASS-II Investigations
</div>
""")
