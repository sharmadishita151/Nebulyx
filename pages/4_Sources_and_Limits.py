import math
import os
import pandas as pd
import streamlit as st

from utils.data import load_data, format_pressure, format_spread_rate, format_airflow

st.set_page_config(
    page_title="Ignis Atelier - Sources and Limits",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom styling
st.html("""
<style>
.stApp {
    background-color: #050811;
    color: #e2e8f0;
}
.paper-card {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 8px;
    padding: 18px;
    margin-bottom: 20px;
}
.paper-title {
    font-size: 16px;
    font-weight: 700;
    color: #38bdf8;
    margin-bottom: 6px;
}
.paper-authors {
    font-size: 13px;
    color: #cbd5e1;
    margin-bottom: 6px;
}
.paper-meta {
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.5;
}
.caution-card {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.35);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 16px;
    color: #fde68a;
}
.caution-title {
    font-size: 15px;
    font-weight: 700;
    color: #facc15;
    margin-bottom: 6px;
}
.disclaimer-card {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 24px;
    color: #fca5a5;
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

st.title("Ignis Atelier: Sources, Pedigree, and Limitations")
st.caption("See what real ISS flame experiments measured, and exactly where the evidence stops.")

# -----------------------------------------------------------------------------
# 1. PRIMARY PEER-REVIEWED SOURCES
# -----------------------------------------------------------------------------
st.subheader("📄 Published Primary Sources")
st.markdown("All 83 rows in Ignis Atelier are strictly transcribed from peer-reviewed NASA and academic combustion literature:")

st.html("""
<div class="paper-card">
    <div class="paper-title">1. Concurrent Flame Growth, Spread and Extinction over Composite Fabric Samples in Low Speed Purely Forced Flow in Microgravity</div>
    <div class="paper-authors"><strong>Authors:</strong> Xiaoyang Zhao, James S. T’ien, Paul V. Ferkul, Sandra L. Olson</div>
    <div class="paper-meta">
        <strong>Venue:</strong> 9th U. S. National Combustion Meeting, Central States Section of the Combustion Institute, Cincinnati, Ohio (May 17–20, 2015).<br>
        <strong>Report Number:</strong> NASA NTRS 20150008962.<br>
        <strong>Affiliations:</strong> Case Western Reserve University, Universities Space Research Association, NASA Glenn Research Center.<br>
        <strong>Dataset Contribution:</strong> 31 experimental runs (Appendix Table p. 9) of SIBAL composite fabric (75% cotton / 25% fiberglass), 1.2 cm and 2.2 cm widths, under concurrent forced flow (1–55 cm/s) and nitrogen-diluted oxygen (16.4%–21.0%).<br>
        <strong>Official Access:</strong> <a href="https://ntrs.nasa.gov/citations/20150008962" target="_blank" style="color:#38bdf8;">NASA NTRS Citation 20150008962</a> &nbsp;|&nbsp; <em>Accessed: October 2024</em>
    </div>
</div>

<div class="paper-card">
    <div class="paper-title">2. The Effect of Gravity on Flame Spread over PMMA Cylinders</div>
    <div class="paper-authors"><strong>Authors:</strong> S. Link, X. Huang, C. Fernandez-Pello, S. L. Olson, P. V. Ferkul</div>
    <div class="paper-meta">
        <strong>Journal:</strong> <em>Scientific Reports</em>, Volume 8, Article number 120 (2018).<br>
        <strong>DOI:</strong> <a href="https://doi.org/10.1038/s41598-017-18621-2" target="_blank" style="color:#38bdf8;">10.1038/s41598-017-18621-2</a><br>
        <strong>Affiliations:</strong> University of California Berkeley, NASA Glenn Research Center, Universities Space Research Association.<br>
        <strong>Dataset Contribution:</strong> 52 experimental runs (Supplementary Table S1) of PMMA cylindrical rods (diameters 0.64 cm, 0.95 cm, 1.27 cm) in opposed forced flow (0.41–7.55 cm/s) and ambient oxygen (16.8%–20.9%), recording steady-state flame spread rates.<br>
        <strong>Official Access:</strong> <a href="https://doi.org/10.1038/s41598-017-18621-2" target="_blank" style="color:#38bdf8;">Nature Scientific Reports 8:120</a> &nbsp;|&nbsp; <em>Accessed: October 2024</em>
    </div>
</div>
""")

# -----------------------------------------------------------------------------
# 2. WHAT IGNIS ATELIER DOES NOT CLAIM
# -----------------------------------------------------------------------------
st.subheader("🚫 What Ignis Atelier Does NOT Claim")

st.html("""
<div class="disclaimer-card">
    <h4 style="color:#f87171; margin-bottom:8px;">Crucial Scientific Disclaimers</h4>
    <ul style="margin-left:20px; line-height:1.6; font-size:13px;">
        <li><strong>NOT a Fire Safety Tool:</strong> Ignis Atelier is strictly an educational and scientific exploration tool. It must never be used for spacecraft mission safety qualification, operational fire response protocols, or environmental control decisions.</li>
        <li><strong>NO Predictive Extrapolation:</strong> Ignis Atelier performs zero artificial intelligence or machine-learning regressions. It does not predict whether an unmeasured point is "safe" or "hazardous". If data does not exist, it displays <em>"Not supported by data"</em>.</li>
        <li><strong>Small Empirical Dataset:</strong> Spaceflight combustion experiments are exceptionally resource-intensive. The entire dataset contains exactly 83 published runs. Whole regions of the oxygen-airflow parameter space remain untested.</li>
        <li><strong>Two Isolated Experiment Families:</strong> Data encompasses only two specific fuel systems (thin SIBAL fabric in concurrent flow and thick PMMA rods in opposed flow). Results cannot be generalized to other polymers, metals, electronics, or complex geometry architectures.</li>
        <li><strong>Hand-Transcribed from Literature:</strong> All values were transcribed directly from the printed tables and supplementary documents of the respective publications. Any typographical quirks of the original sources have been faithfully preserved.</li>
    </ul>
</div>
""")

# -----------------------------------------------------------------------------
# 3. KNOWN DATA CAUTIONS & SOURCE ERRATA
# -----------------------------------------------------------------------------
st.subheader("⚠️ Data Cautions and Known Instrumentation Errata")

st.html("""
<div class="caution-card">
    <div class="caution-title">1. Non-Systematic Spaceflight Sampling & Oxygen Measurement Uncertainty</div>
    <div style="font-size:13px; line-height:1.5;">
        Microgravity combustion runs aboard the International Space Station were conducted across various flight increments and operational windows. 
        As noted in Link et al. (Fig. 7) and Zhao et al. (Table footnote), oxygen concentration readings carry an instrumentation uncertainty of approximately <strong>±0.3% O₂</strong>. 
        Tests GMT45-T1 and GMT45-T2 explicitly carry the paper footnote: <em>"O₂ reading in these two tests might be inaccurate."</em>
    </div>
</div>

<div class="caution-card">
    <div class="caution-title">2. PMMA Supplementary Table S1 Header Unit Discrepancy</div>
    <div style="font-size:13px; line-height:1.5;">
        In the supplementary material of Link et al. (2018), the table header for the 0.64 cm diameter rod block is labeled <em>"mm/s"</em>, 
        whereas the other blocks are labeled <em>"10⁻³ cm/s"</em>. A comparison with Figure 5 and Figure S1 of the paper confirms that the numerical values 
        (e.g., 10.0, 9.74, 8.32) are in <strong>10⁻³ cm/s</strong> (which is equivalent to 10⁻² mm/s). Ignis Atelier treats them as <strong>10⁻³ cm/s</strong> to maintain scientific consistency with the publication's graphical figures.
    </div>
</div>

<div class="caution-card">
    <div class="caution-title">3. Undefined Sample Prefix 'P17' in PMMA Source Table</div>
    <div style="font-size:13px; line-height:1.5;">
        Runs S1-P17-1, S1-P17-2, and S1-P17-3 use sample ID <em>"P17"</em>. The table caption in Supplementary Table S1 only defines <strong>B</strong> (black cast PMMA) 
        and <strong>C</strong> (clear cast PMMA). The exact color or formulation of sample 'P' is not defined in the source, so Ignis Atelier records its material as 
        <em>"PMMA, colour not defined in table"</em> without guessing.
    </div>
</div>

<div class="caution-card">
    <div class="caution-title">4. Fabric Rows with Outcome 'not_stated'</div>
    <div style="font-size:13px; line-height:1.5;">
        In Zhao et al. (Appendix Table p. 9), 11 tests have no text in the Comments column (or are listed as baseline BASS runs without an explicit extinction tag). 
        Ignis Atelier encodes these as <code>not_stated</code> rather than assuming whether steady spread or burnout occurred.
    </div>
</div>

<div class="caution-card">
    <div class="caution-title">5. Pressure Reporting Difference: Fabric vs PMMA</div>
    <div style="font-size:13px; line-height:1.5;">
        Zhao et al. explicitly reports ambient pressure as <strong>1 atm</strong> for all fabric tests inside the Microgravity Science Glovebox. 
        In contrast, Link et al. provides no pressure column or statement in Supplementary Table S1. Consequently, Ignis Atelier shows 
        <em>"Pressure: not stated in the source"</em> for all 52 PMMA rows and never assumes 1.0 atm.
    </div>
</div>
""")

# -----------------------------------------------------------------------------
# 4. RAW DATA EXPLORER & CSV DOWNLOAD
# -----------------------------------------------------------------------------
st.subheader("📊 Complete Dataset Browser (83 Rows, 20 Columns)")
st.markdown("Inspect every column and row in `data/measurements_all.csv` exactly as loaded:")

search_query = st.text_input("Filter rows by Run ID, Material, Experiment, or Notes:", "")
display_df = df.copy()

if search_query:
    mask = (
        display_df["run_id"].astype(str).str.contains(search_query, case=False, na=False) |
        display_df["material"].astype(str).str.contains(search_query, case=False, na=False) |
        display_df["experiment"].astype(str).str.contains(search_query, case=False, na=False) |
        display_df["notes"].astype(str).str.contains(search_query, case=False, na=False)
    )
    display_df = display_df[mask]

st.dataframe(display_df, use_container_width=True)

csv_data = df.to_csv(index=False).encode("utf-8")
st.download_button(
    label="📥 Download measurements_all.csv (83 rows)",
    data=csv_data,
    file_name="measurements_all.csv",
    mime="text/csv"
)

# Footer
st.html("""
<div class="footer-bar">
<strong>Ignis Atelier</strong> — Microgravity Fire Experiment Lab<br>
<em>"See what real ISS flame experiments measured, and exactly where the evidence stops."</em>
</div>
""")
