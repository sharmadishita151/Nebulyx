import math
import os
import pandas as pd
import streamlit as st

# ==============================================================================
# EVIDENCE STATUS CONSTANTS (Plain Python thresholds)
# ==============================================================================
EXACT_O2_DIFF = 0.1       # percentage point
EXACT_FLOW_DIFF = 0.2     # cm/s
NEARBY_DISTANCE_MAX = 1.0 # scaled Euclidean distance threshold
SCALE_O2 = 1.0            # scale divisor for oxygen (1.0 percentage point)
SCALE_FLOW = 1.0          # scale divisor for airflow (1.0 cm/s)

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "measurements_all.csv")


def startup_check(df: pd.DataFrame) -> None:
    """Print the row count (must be 83) and the first 5 run_ids in the terminal."""
    count = len(df)
    first_five = df["run_id"].head(5).tolist() if not df.empty else []
    print(f"[Ignis Atelier Startup Check] Total rows: {count} (expected 83)")
    print(f"[Ignis Atelier Startup Check] First 5 run_ids: {first_five}")


@st.cache_data(show_spinner=False)
def load_data(filepath: str = DATA_PATH) -> pd.DataFrame:
    """
    Load data/measurements_all.csv safely without filling or synthesizing any data.
    Empty cells remain empty/missing (NaN/None), never converted to zero.
    """
    if not os.path.exists(filepath):
        print(f"[Ignis Atelier Error] Data file not found at: {filepath}")
        return pd.DataFrame()

    try:
        df = pd.read_csv(filepath, keep_default_na=True)
    except Exception as e:
        print(f"[Ignis Atelier Error] Failed to read {filepath}: {e}")
        return pd.DataFrame()

    if df.empty:
        print(f"[Ignis Atelier Warning] {filepath} is empty.")
        return df

    # Print startup check to terminal
    startup_check(df)
    return df


def format_pressure(row: pd.Series) -> str:
    """
    Hard Rule 7:
    Pressure: pressure_atm is filled only for fabric rows.
    It is EMPTY for all PMMA rows. For PMMA show 'Pressure: not stated in the source'.
    Never show '1.0 atm' for PMMA.
    """
    val = row.get("pressure_atm")
    material = str(row.get("material", ""))

    if "PMMA" in material or pd.isna(val) or str(val).strip() == "" or str(val).lower() == "nan":
        return "Pressure: not stated in the source"
    try:
        fval = float(val)
        return f"{fval:.1f} atm"
    except (ValueError, TypeError):
        return str(val)


def format_spread_rate(val) -> str:
    """Format flame spread rate in units of 1e-3 cm/s."""
    if pd.isna(val) or val is None or str(val).strip() == "" or str(val).lower() == "nan":
        return "No spread rate measured"
    try:
        fval = float(val)
        return f"{fval:.2f} × 10⁻³ cm/s"
    except (ValueError, TypeError):
        return str(val)


def format_airflow(row: pd.Series) -> str:
    """Format airflow showing transition if airflow changed during the test."""
    start = row.get("airflow_start_cm_s")
    end = row.get("airflow_end_cm_s")
    if pd.isna(end):
        return "Not stated"
    try:
        f_start = float(start)
        f_end = float(end)
        if abs(f_start - f_end) > 1e-3:
            return f"{f_start:g} → {f_end:g} cm/s (flow reduced/changed)"
        return f"{f_end:g} cm/s"
    except (ValueError, TypeError):
        return f"{end} cm/s"


def compute_evidence_status(filtered_df: pd.DataFrame, target_o2: float, target_flow: float):
    """
    Calculate Euclidean distance in scaled space:
      d = sqrt(((row_o2 - target_o2)/1.0)**2 + ((row_flow - target_flow)/1.0)**2)
    
    Status Rules:
    - 'Exact match': a measured row within 0.1% O2 and 0.2 cm/s airflow.
    - 'Nearby observation': nearest row within distance 1.0.
    - 'Not supported by data': anything else.
    
    Returns:
      status (str), message (str), top3_df (pd.DataFrame with added 'distance' column)
    """
    if filtered_df.empty:
        return "Not supported by data", "No experimental rows found for this material / geometry filter.", pd.DataFrame()

    records = []
    for idx, row in filtered_df.iterrows():
        try:
            row_o2 = float(row["oxygen_percent"])
            row_flow = float(row["airflow_end_cm_s"])
        except (ValueError, TypeError):
            continue

        o2_diff = abs(row_o2 - target_o2)
        flow_diff = abs(row_flow - target_flow)

        scaled_o2_diff = o2_diff / SCALE_O2
        scaled_flow_diff = flow_diff / SCALE_FLOW
        dist = math.sqrt(scaled_o2_diff**2 + scaled_flow_diff**2)

        is_exact = (o2_diff <= EXACT_O2_DIFF) and (flow_diff <= EXACT_FLOW_DIFF)

        rec = row.to_dict()
        rec["distance"] = round(dist, 3)
        rec["is_exact"] = is_exact
        records.append(rec)

    if not records:
        return "Not supported by data", "No valid numerical data available in filtered set.", pd.DataFrame()

    # Sort strictly by distance ascending
    records.sort(key=lambda x: x["distance"])
    top3 = records[:3]
    top3_df = pd.DataFrame(top3)

    nearest = records[0]
    nearest_dist = nearest["distance"]
    has_exact = any(r["is_exact"] for r in records)

    if has_exact:
        status = "Exact match"
        msg = f"Direct experimental match found! Measured row {nearest['run_id']} is within 0.1% O₂ and 0.2 cm/s airflow."
    elif nearest_dist <= NEARBY_DISTANCE_MAX:
        status = "Nearby observation"
        msg = f"Close experimental observation found: Run {nearest['run_id']} (scaled distance {nearest_dist:.3f} ≤ 1.0)."
    else:
        status = "Not supported by data"
        msg = f"Nearest experimental measurement {nearest['run_id']} is at distance {nearest_dist:.3f} (> 1.0). No data supports this condition."

    return status, msg, top3_df


def test_evidence_logic():
    """Verification unit test: 19.5% O2 with 1.0 cm/s airflow must NOT be an Exact match for fabric."""
    df = load_data(DATA_PATH)
    fabric_df = df[df["material"].str.contains("fabric", case=False, na=False)]
    status, msg, top3 = compute_evidence_status(fabric_df, target_o2=19.5, target_flow=1.0)
    assert status != "Exact match", f"FAILED: 19.5% O2 and 1.0 cm/s was incorrectly classified as '{status}'"
    print(f"[Ignis Atelier Unit Test PASS] 19.5% O2, 1.0 cm/s for fabric evaluated as '{status}' (nearest distance={top3.iloc[0]['distance']}).")


if __name__ == "__main__":
    test_evidence_logic()
