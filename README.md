# Ignis Atelier
> *"See what real ISS flame experiments measured, and exactly where the evidence stops."*

**Ignis Atelier** is an interactive microgravity combustion research and education laboratory developed for the **NASA Space Apps Challenge: "Flame in Freefall"**.

---

## What Ignis Atelier Is
A scientific and educational tool designed to explore **real, peer-reviewed microgravity combustion experiments** conducted aboard the International Space Station (ISS) under NASA's Burning and Suppression of Solids (BASS and BASS-II) investigations.

Users select environmental and flow conditions, observe what NASA astronauts and researchers actually measured, inspect exact source citations, and see unambiguously **where empirical evidence stops**.

## What Ignis Atelier Is NOT
- **NOT a certified fire-safety tool:** It must never be used for spacecraft qualification or fire safety hazard clearance.
- **NOT a prediction model:** There are **zero machine learning or regression extrapolations**. Ignis Atelier never invents numbers, never calls any condition "safe" or "unsafe", and never recommends spacecraft settings.

---

## Hard Rules Strictly Followed
1. **Empirical Ground Truth Only:** Uses exclusively `data/measurements_all.csv` (83 rows, 20 columns). Never invents, estimates, or fills in measurements. Every run ID shown in the UI exists in the published CSV. Missing data is shown as *"no measurements"*.
2. **Zero ML Prediction:** Never brands a condition "safe" or "unsafe", and never uses wording like "near the quench limit" unless an actual published CSV row says so.
3. **Deterministic Plain Rules:** All distance calculations and matching use explicit mathematical distance thresholds with scaled Euclidean differences.
4. **No Mixing of Regimes:** Never mixes different experiment types on one chart. Thin SIBAL fabric sheets in concurrent flow and thick PMMA cylindrical rods in opposed flow are strictly separated.
5. **Illustrative Visualizations:** All flame diagrams and hero graphics are labeled *"Illustrative, not a physical simulation"*.
6. **Graceful Fault Tolerance:** Handles missing or empty data files cleanly with informative guidance rather than crashing.
7. **Accurate Pressure Reporting:** Pressure is filled only for fabric rows (1.0 atm). It is empty for all PMMA rows, where Ignis Atelier displays *"Pressure: not stated in the source"*, never "1.0 atm".

---

## Dataset Overview (`data/measurements_all.csv`)
The dataset contains **83 real spaceflight tests across 20 standardized columns**:
- **31 Fabric Rows (SIBAL Composite):**
  - Cotton-fiberglass blend (75% cotton / 25% fiberglass), 1.2 cm and 2.2 cm widths, flat thin sheets.
  - Concurrent forced flow (1–55 cm/s). Airflow was stepped down during tests to determine the low-speed radiative quenching boundary.
  - Outcomes: `quenched`, `blowoff`, `no_blowoff`, `no_ignition`, `ignited`, `one_sided_flame`, `not_stated`.
- **52 PMMA Cylindrical Rod Rows:**
  - Polymethyl methacrylate (PMMA; black cast, clear cast) rods of diameters 0.64 cm, 0.95 cm, 1.27 cm.
  - Opposed forced flow (0.41–7.55 cm/s).
  - Quantitative flame spread rates ($10^{-3}\text{ cm/s}$) measured at steady state.

---

## Installation & Setup

1. **Clone or navigate to the repository:**
   ```bash
   cd Ignis-Atelier
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   npm run dev
   ```

4. **Open in your browser:**
   Open `http://localhost:3000` to view **Ignis Atelier**.

---

## Primary Scientific Sources
1. **Zhao, X., T’ien, J. S., Ferkul, P. V., Olson, S. L. (2015)**
   *"Concurrent flame growth, spread and extinction over composite fabric samples in low speed purely forced flow in microgravity."*
   9th U. S. National Combustion Meeting, Cincinnati, Ohio. NASA NTRS: [20150008962](https://ntrs.nasa.gov/citations/20150008962).
2. **Link, S., Huang, X., Fernandez-Pello, C., Olson, S. L., Ferkul, P. V. (2018)**
   *"The Effect of Gravity on Flame Spread over PMMA Cylinders."*
   *Scientific Reports* 8:120. DOI: [10.1038/s41598-017-18398-4](https://doi.org/10.1038/s41598-017-18398-4).

---

## License & Attribution
Developed for the **NASA Space Apps Challenge "Flame in Freefall"**. Data sourced from NASA Glenn Research Center, Case Western Reserve University, UC Berkeley, and SDSU BASS/BASS-II scientific investigations.
