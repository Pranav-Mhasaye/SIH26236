"""
PackPulse Recommendation Engine
Physics-based + rule-filtered packaging material recommendation.

Architecture:
  Food properties → Required barrier specs → Filter materials → Score & rank → Explain

Scoring weights (justified in PID):
  Technical compatibility   40%
  Shelf-life suitability    25%
  Cost efficiency           15%
  Sustainability            10%
  Transport suitability     10%
"""

import math
from typing import Optional


# ---------------------------------------------------------------------------
# 1.  Determine what a food NEEDS from its packaging
# ---------------------------------------------------------------------------

def compute_required_barriers(commodity: dict) -> dict:
    """
    From a commodity's properties, compute the barrier requirements.
    Returns dict of required_otr_max, required_wvtr_max, needs_map, etc.
    """
    moisture = commodity.get("moisture", 50)
    fat = commodity.get("fat", 5)
    ph = commodity.get("ph", 6)
    resp20 = commodity.get("resp20", 0)
    storage = commodity.get("storage", "ambient")
    temp = commodity.get("temp", 25)
    shelf_life = commodity.get("shelf_life", 30)
    form = commodity.get("form", "solid")
    mode = commodity.get("mode", "air")

    is_produce = resp20 > 0
    is_fatty = fat > 10
    is_moisture_sensitive = moisture < 15
    is_high_moisture = moisture > 60
    needs_map = mode in ("emap", "map_gas", "n2_flush")
    needs_vacuum = mode == "vacuum"
    needs_retort = mode == "retort"
    needs_aseptic = mode == "aseptic"
    needs_light_block = is_fatty or commodity.get("id", "") in ("milk", "edible-oil", "ghee", "spice-powder")

    # --- OTR requirement ---
    if needs_retort or needs_aseptic:
        required_otr_max = 1.0  # near-zero for sterile
    elif is_fatty and shelf_life > 60:
        required_otr_max = 5.0  # high O₂ barrier for fats
    elif is_fatty:
        required_otr_max = 50.0
    elif needs_map and not is_produce:
        required_otr_max = 30.0  # gas flush needs decent barrier
    elif is_produce:
        # produce needs breathable film: OTR must be HIGH enough
        # but we'll handle this separately
        required_otr_max = 999999  # effectively no upper limit
    elif is_moisture_sensitive and shelf_life > 90:
        required_otr_max = 200.0
    elif shelf_life > 180:
        required_otr_max = 100.0
    else:
        required_otr_max = 5000.0  # relaxed

    # --- WVTR requirement ---
    if is_moisture_sensitive:
        required_wvtr_max = 2.0  # chips, biscuits, powders
    elif is_high_moisture and storage == "chilled":
        required_wvtr_max = 10.0  # prevent drying
    elif needs_retort or needs_aseptic:
        required_wvtr_max = 1.0
    elif shelf_life > 180:
        required_wvtr_max = 5.0
    else:
        required_wvtr_max = 20.0

    # --- Mechanical ---
    min_puncture = "Low"
    if form in ("solid", "paste") and commodity.get("pack_g", 500) > 2000:
        min_puncture = "Good"
    if needs_vacuum:
        min_puncture = "Very high"
    if needs_retort:
        min_puncture = "Very high"

    # --- Temperature range ---
    if storage == "frozen":
        required_temp_min = -25
    elif storage == "chilled":
        required_temp_min = -5
    else:
        required_temp_min = 0

    required_temp_max = 50
    if needs_retort:
        required_temp_max = 125

    return {
        "required_otr_max": required_otr_max,
        "required_wvtr_max": required_wvtr_max,
        "is_produce": is_produce,
        "is_fatty": is_fatty,
        "is_moisture_sensitive": is_moisture_sensitive,
        "is_high_moisture": is_high_moisture,
        "needs_map": needs_map,
        "needs_vacuum": needs_vacuum,
        "needs_retort": needs_retort,
        "needs_aseptic": needs_aseptic,
        "needs_light_block": needs_light_block,
        "needs_breathable": is_produce and mode in ("emap", "ventilated"),
        "min_puncture": min_puncture,
        "required_temp_min": required_temp_min,
        "required_temp_max": required_temp_max,
        "mode": mode,
    }


# ---------------------------------------------------------------------------
# 2.  Filter materials that COULD work
# ---------------------------------------------------------------------------

PUNCTURE_ORDER = {"Low": 1, "Moderate": 2, "Good": 3, "High": 4, "Very high": 5}


def material_passes_filter(mat: dict, reqs: dict) -> bool:
    """Hard filter: does this material even qualify?"""
    otr = mat.get("otr", 9999)
    wvtr = mat.get("wvtr", 9999)

    # For produce: we NEED high OTR (breathable), skip ultra-barrier films
    if reqs["needs_breathable"]:
        if otr < 100 and not mat.get("perforated", False):
            return False  # too tight for produce
    else:
        if otr > reqs["required_otr_max"] * 3:  # allow some headroom
            return False

    # WVTR filter (not for produce)
    if not reqs["is_produce"]:
        if wvtr > reqs["required_wvtr_max"] * 5:
            return False

    # Temperature range
    if mat.get("temp_min", 0) > reqs["required_temp_min"]:
        return False
    if mat.get("temp_max", 100) < reqs["required_temp_max"]:
        return False

    # Puncture requirement
    mat_puncture = PUNCTURE_ORDER.get(mat.get("puncture", "Moderate"), 2)
    req_puncture = PUNCTURE_ORDER.get(reqs["min_puncture"], 1)
    if mat_puncture < req_puncture:
        return False

    # Retort needs high temp seal
    if reqs["needs_retort"] and mat.get("seal_temp_c", 0) < 130:
        return False

    return True


# ---------------------------------------------------------------------------
# 3.  Score each passing material (0–100)
# ---------------------------------------------------------------------------

def score_material(mat: dict, reqs: dict, commodity: dict) -> dict:
    """
    Multi-objective score.
    Returns dict with total score and component scores.
    """
    scores = {}

    # --- Technical compatibility (40%) ---
    tech = 100.0

    otr = mat.get("otr", 9999)
    wvtr = mat.get("wvtr", 9999)

    if reqs["needs_breathable"]:
        # For produce, mid-range OTR is best
        ideal_otr = commodity.get("resp20", 100) * 15  # rough heuristic
        deviation = abs(math.log10(max(otr, 1)) - math.log10(max(ideal_otr, 1)))
        tech -= min(deviation * 20, 40)
        if mat.get("perforated", False):
            tech += 10  # bonus for perforated films
    else:
        # Lower OTR is better (tighter barrier)
        if otr <= reqs["required_otr_max"]:
            tech += 0  # perfect
        elif otr <= reqs["required_otr_max"] * 2:
            tech -= 15
        else:
            tech -= 30

    # WVTR score
    if reqs["is_moisture_sensitive"]:
        if wvtr <= reqs["required_wvtr_max"]:
            tech += 0
        elif wvtr <= reqs["required_wvtr_max"] * 2:
            tech -= 10
        else:
            tech -= 25
    elif reqs["is_high_moisture"]:
        if wvtr < 5:
            tech += 5  # prevents drying
        else:
            tech -= 5

    # Light barrier bonus
    if reqs["needs_light_block"] and mat.get("light_barrier", 0) > 0.7:
        tech += 10
    elif reqs["needs_light_block"] and mat.get("light_barrier", 0) < 0.2:
        tech -= 15

    # Seal rating
    seal = mat.get("seal_rating", 3)
    if seal >= 4:
        tech += 5
    elif seal <= 2:
        tech -= 10

    scores["technical"] = max(0, min(100, tech))

    # --- Shelf-life suitability (25%) ---
    shelf = 80.0
    target_life = commodity.get("shelf_life", 30)

    # Tighter barriers = longer shelf life potential
    barrier_quality = 100 - min(100, math.log10(max(otr, 0.01)) * 15 + math.log10(max(wvtr, 0.01)) * 10)
    if target_life > 180:
        if barrier_quality > 60:
            shelf += 15
        elif barrier_quality < 30:
            shelf -= 20
    elif target_life > 60:
        if barrier_quality > 40:
            shelf += 10
    else:
        shelf += 5  # short shelf life, most things work

    scores["shelf_life"] = max(0, min(100, shelf))

    # --- Cost efficiency (15%) ---
    cost_m2 = mat.get("cost_m2", 10)
    if cost_m2 < 5:
        cost_score = 95
    elif cost_m2 < 8:
        cost_score = 85
    elif cost_m2 < 12:
        cost_score = 70
    elif cost_m2 < 18:
        cost_score = 55
    elif cost_m2 < 30:
        cost_score = 35
    else:
        cost_score = 20
    scores["cost"] = cost_score

    # --- Sustainability (10%) ---
    recyclability = mat.get("recyclability", "not_recyclable")
    if recyclability == "recyclable":
        sus = 80
    elif recyclability == "compostable":
        sus = 90
    elif recyclability == "reusable":
        sus = 85
    elif recyclability == "limited":
        sus = 50
    else:
        sus = 25

    co2 = mat.get("co2e_g_m2", 200)
    if co2 < 80:
        sus += 10
    elif co2 > 300:
        sus -= 15

    scores["sustainability"] = max(0, min(100, sus))

    # --- Transport suitability (10%) ---
    trans = 70.0
    puncture_val = PUNCTURE_ORDER.get(mat.get("puncture", "Moderate"), 2)
    trans += puncture_val * 5
    tensile = mat.get("tensile_mpa", 30)
    if tensile > 80:
        trans += 10
    if mat.get("temp_min", 0) <= -40:
        trans += 5  # works in freezer trucks
    scores["transport"] = max(0, min(100, trans))

    # --- Weighted total ---
    total = (
        scores["technical"] * 0.40 +
        scores["shelf_life"] * 0.25 +
        scores["cost"] * 0.15 +
        scores["sustainability"] * 0.10 +
        scores["transport"] * 0.10
    )
    scores["total"] = round(total, 1)

    return scores


# ---------------------------------------------------------------------------
# 4.  Generate plain-language explanation
# ---------------------------------------------------------------------------

def explain_recommendation(mat: dict, scores: dict, reqs: dict, commodity: dict, rank: int) -> str:
    """Generate a human-readable explanation for why this material was recommended."""
    parts = []
    name = mat.get("name", "Unknown")

    if rank == 1:
        parts.append(f"{name} is the top recommendation for {commodity.get('name', 'this product')}.")
    else:
        parts.append(f"{name} is an alternative option.")

    # Technical reasoning
    if reqs["is_fatty"]:
        if mat.get("otr", 9999) < 5:
            parts.append("Its extremely low oxygen transmission rate protects against fat oxidation and rancidity.")
        elif mat.get("otr", 9999) < 50:
            parts.append("It provides good oxygen barrier to slow fat oxidation.")

    if reqs["is_moisture_sensitive"]:
        if mat.get("wvtr", 9999) < 2:
            parts.append("Its tight moisture barrier prevents the product from absorbing humidity and going soft.")

    if reqs["needs_breathable"]:
        if mat.get("perforated", False):
            parts.append("Its micro-perforations allow controlled gas exchange for respiring produce.")
        elif mat.get("otr", 0) > 1000:
            parts.append("Its high gas permeability allows the produce to breathe naturally.")

    if reqs["needs_light_block"] and mat.get("light_barrier", 0) > 0.7:
        parts.append("It blocks light, preventing photo-oxidation.")

    # Sustainability note
    recyclability = mat.get("recyclability", "not_recyclable")
    if recyclability == "recyclable":
        parts.append(f"It is recyclable (resin code {mat.get('recycle_code', '?')}).")
    elif recyclability == "compostable":
        parts.append("It is industrially compostable under IS/ISO 17088.")

    return " ".join(parts)


# ---------------------------------------------------------------------------
# 5.  Main recommendation function
# ---------------------------------------------------------------------------

def recommend(commodity: dict, materials: list, role: str = "general") -> list:
    """
    Main entry point. Returns ranked list of recommendations.
    Each item: { material, scores, explanation, rank, ... }
    """
    reqs = compute_required_barriers(commodity)

    candidates = []
    for mat in materials:
        if material_passes_filter(mat, reqs):
            scores = score_material(mat, reqs, commodity)
            candidates.append({
                "material": mat,
                "scores": scores,
                "requirements": reqs,
            })

    # Sort by total score descending
    candidates.sort(key=lambda c: c["scores"]["total"], reverse=True)

    # Take top 5
    results = []
    for i, c in enumerate(candidates[:5]):
        rank = i + 1
        explanation = explain_recommendation(c["material"], c["scores"], reqs, commodity, rank)

        result = {
            "rank": rank,
            "material_id": c["material"]["id"],
            "material_name": c["material"]["name"],
            "family": c["material"].get("family", ""),
            "layers_desc": c["material"].get("layers_desc", ""),
            "total_score": c["scores"]["total"],
            "scores": c["scores"],
            "explanation": explanation,
            "otr": c["material"].get("otr"),
            "wvtr": c["material"].get("wvtr"),
            "thickness_um": c["material"].get("thickness_um"),
            "cost_m2": c["material"].get("cost_m2"),
            "co2e_g_m2": c["material"].get("co2e_g_m2"),
            "recyclability": c["material"].get("recyclability"),
            "recycle_note": c["material"].get("recycle_note"),
            "seal_rating": c["material"].get("seal_rating"),
            "tensile_mpa": c["material"].get("tensile_mpa"),
            "puncture": c["material"].get("puncture"),
            "formats": c["material"].get("formats", []),
            "cautions": c["material"].get("cautions", []),
            "layers": c["material"].get("layers", []),
            "sources": c["material"].get("sources", []),
            "light_barrier": c["material"].get("light_barrier"),
            "map_suitable": reqs["needs_map"],
        }

        # Role-specific additions
        if role == "farmer":
            result["farmer_note"] = _farmer_note(commodity, c["material"])
        elif role == "logistics":
            result["logistics_note"] = _logistics_note(commodity, c["material"])
        elif role == "researcher":
            result["test_methods"] = _test_methods(c["material"])

        results.append(result)

    return {
        "commodity": {
            "id": commodity["id"],
            "name": commodity["name"],
            "category": commodity["category"],
            "storage": commodity["storage"],
            "shelf_life": commodity["shelf_life"],
            "temp": commodity["temp"],
            "rh": commodity.get("rh"),
            "mode_label": commodity.get("mode_label"),
            "map_target": commodity.get("map_target"),
        },
        "requirements": {
            "required_otr_max": reqs["required_otr_max"],
            "required_wvtr_max": reqs["required_wvtr_max"],
            "needs_map": reqs["needs_map"],
            "needs_breathable": reqs["needs_breathable"],
            "needs_vacuum": reqs["needs_vacuum"],
            "needs_light_block": reqs["needs_light_block"],
        },
        "recommendations": results,
        "total_candidates": len(candidates),
    }


def _farmer_note(commodity: dict, mat: dict) -> str:
    """Simple, practical advice for farmers."""
    notes = []
    if commodity.get("storage") == "chilled":
        notes.append(f"Keep at {commodity.get('temp', 4)}°C. If no cold store, sell within 1–2 days.")
    if mat.get("recyclability") == "reusable":
        notes.append("This bag can be reused multiple times — saves cost.")
    if commodity.get("resp20", 0) > 100:
        notes.append("This produce breathes fast. Pack and chill it within 2 hours of harvest.")
    return " ".join(notes) if notes else "Store in a cool, dry, shaded area."


def _logistics_note(commodity: dict, mat: dict) -> str:
    """Transport-focused advice."""
    notes = []
    temp = commodity.get("temp", 25)
    if temp < 10:
        notes.append(f"Maintain reefer at {temp}°C ± 2°C throughout transit.")
    if mat.get("puncture") in ("Low", "Moderate"):
        notes.append("Handle carefully — this packaging tears if punctured during stacking.")
    if commodity.get("storage") == "frozen":
        notes.append("Do not break the cold chain. Re-freezing causes ice crystal damage.")
    return " ".join(notes) if notes else "Standard ambient transport. Avoid direct sunlight."


def _test_methods(mat: dict) -> list:
    """ASTM/IS test methods relevant to this material."""
    methods = []
    if mat.get("otr", 0) > 0:
        methods.append({"property": "OTR", "method": "ASTM D3985", "conditions": "23°C, 0% RH"})
    if mat.get("wvtr", 0) > 0:
        methods.append({"property": "WVTR", "method": "ASTM F1249", "conditions": "38°C, 90% RH"})
    if mat.get("tensile_mpa", 0) > 0:
        methods.append({"property": "Tensile Strength", "method": "ASTM D882", "conditions": "23°C, 50% RH"})
    if mat.get("seal_rating", 0) > 0:
        methods.append({"property": "Seal Strength", "method": "ASTM F88", "conditions": "25 mm/min peel rate"})
    return methods
