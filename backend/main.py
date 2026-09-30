"""
PackPulse — FastAPI Backend
AI-Based Intelligent Food Packaging Material Recommendation System
Ministry of Food Processing Industries (MoFPI) | SIH 26236
"""

import json
import math
import os
import io
import base64
import hashlib
import uuid
from datetime import datetime, date
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from engine.recommender import recommend

# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------
BASE = Path(__file__).resolve().parent
DATA = BASE / "datasets"

def _load(name):
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)

COMMODITIES = _load("commodities.json")
MATERIALS   = _load("materials.json")

COMMODITY_MAP = {c["id"]: c for c in COMMODITIES}
MATERIAL_MAP  = {m["id"]: m for m in MATERIALS}

# In-memory stores for prototype
PEER_REVIEWS = []   # submitted materials awaiting review
SAVED_PASSPORTS = []

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="PackPulse API",
    description="AI-Based Intelligent Food Packaging Material Recommendation System — SIH 26236",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "commodities": len(COMMODITIES),
        "materials": len(MATERIALS),
        "pending_reviews": len([r for r in PEER_REVIEWS if r["status"] == "pending"]),
        "version": "1.0.0",
    }

# ---------------------------------------------------------------------------
# Commodities
# ---------------------------------------------------------------------------
@app.get("/api/commodities")
def list_commodities(category: Optional[str] = None):
    items = COMMODITIES
    if category:
        items = [c for c in items if c["category"].lower() == category.lower()]
    return items

@app.get("/api/commodities/{commodity_id}")
def get_commodity(commodity_id: str):
    c = COMMODITY_MAP.get(commodity_id)
    if not c:
        raise HTTPException(404, f"Commodity '{commodity_id}' not found")
    return c

@app.get("/api/categories")
def list_categories():
    cats = sorted(set(c["category"] for c in COMMODITIES))
    return [{"name": cat, "count": sum(1 for c in COMMODITIES if c["category"] == cat)} for cat in cats]

# ---------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------
@app.get("/api/materials")
def list_materials():
    return MATERIALS

@app.get("/api/materials/{material_id}")
def get_material(material_id: str):
    m = MATERIAL_MAP.get(material_id)
    if not m:
        raise HTTPException(404, f"Material '{material_id}' not found")
    return m

# ---------------------------------------------------------------------------
# Search (fuzzy + multilingual)
# ---------------------------------------------------------------------------
@app.get("/api/search")
def search_commodities(q: str = Query(..., min_length=1)):
    q_lower = q.strip().lower()
    results = []
    for c in COMMODITIES:
        score = 0
        # Exact match on name
        if c["name"].lower() == q_lower:
            score = 100
        elif c["name"].lower().startswith(q_lower):
            score = 70
        elif q_lower in c["name"].lower():
            score = 50
        # Hindi name
        elif c.get("name_hi") and q_lower in c["name_hi"].lower():
            score = 60
        # Aliases
        else:
            for alias in c.get("aliases", []):
                if alias.lower() == q_lower:
                    score = max(score, 90)
                elif alias.lower().startswith(q_lower):
                    score = max(score, 65)
                elif q_lower in alias.lower():
                    score = max(score, 45)
                # Levenshtein-lite: check if close enough
                elif len(q_lower) >= 3 and len(alias) >= 3:
                    if _simple_similarity(q_lower, alias.lower()) > 0.7:
                        score = max(score, 40)
        # Category match
        if q_lower in c.get("category", "").lower():
            score = max(score, 30)
        if score > 0:
            results.append({"commodity": c, "score": score})

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:10]


def _simple_similarity(a: str, b: str) -> float:
    """Simple bigram similarity for typo tolerance."""
    if not a or not b:
        return 0.0
    a_bigrams = set(a[i:i+2] for i in range(len(a)-1))
    b_bigrams = set(b[i:i+2] for i in range(len(b)-1))
    if not a_bigrams or not b_bigrams:
        return 0.0
    return len(a_bigrams & b_bigrams) / max(len(a_bigrams), len(b_bigrams))


# ---------------------------------------------------------------------------
# Recommendation
# ---------------------------------------------------------------------------
class RecommendRequest(BaseModel):
    commodity_id: str
    role: str = "general"  # general | farmer | logistics | researcher
    # Optional overrides
    moisture: Optional[float] = None
    fat: Optional[float] = None
    ph: Optional[float] = None
    resp20: Optional[float] = None
    shelf_life: Optional[int] = None
    temp: Optional[float] = None
    rh: Optional[float] = None
    storage: Optional[str] = None


@app.post("/api/recommend")
def get_recommendation(req: RecommendRequest):
    commodity = COMMODITY_MAP.get(req.commodity_id)
    if not commodity:
        raise HTTPException(404, f"Commodity '{req.commodity_id}' not found")

    # Allow user overrides
    c = dict(commodity)
    if req.moisture is not None: c["moisture"] = req.moisture
    if req.fat is not None: c["fat"] = req.fat
    if req.ph is not None: c["ph"] = req.ph
    if req.resp20 is not None: c["resp20"] = req.resp20
    if req.shelf_life is not None: c["shelf_life"] = req.shelf_life
    if req.temp is not None: c["temp"] = req.temp
    if req.rh is not None: c["rh"] = req.rh
    if req.storage is not None: c["storage"] = req.storage

    result = recommend(c, MATERIALS, role=req.role)
    return result


# ---------------------------------------------------------------------------
# Costing engine
# ---------------------------------------------------------------------------
# Realistic Indian polymer benchmark prices (₹/kg, mid-2026 estimates)
POLYMER_PRICES = {
    "LDPE": 125, "LLDPE": 130, "HDPE": 120, "PP": 115, "BOPP": 140,
    "PET": 105, "Nylon": 310, "EVOH": 850, "Aluminium": 220,
    "PLA": 350, "PBAT": 400, "Kraft": 65, "Paperboard": 55,
}

class CostingRequest(BaseModel):
    material_id: str
    pack_g: float = 500          # grams per package
    quantity: int = 1000         # number of packages
    pack_length_cm: float = 20
    pack_width_cm: float = 15


@app.post("/api/costing")
def calculate_costing(req: CostingRequest):
    mat = MATERIAL_MAP.get(req.material_id)
    if not mat:
        raise HTTPException(404, f"Material '{req.material_id}' not found")

    # Calculate area per pouch
    area_m2 = (req.pack_length_cm * req.pack_width_cm * 2) / 10000  # both sides
    cost_per_m2 = mat.get("cost_m2", 10)

    # Material cost per pouch
    material_cost = area_m2 * cost_per_m2

    # Conversion cost (printing, laminating, slitting, pouching)
    conversion_cost = area_m2 * 4.5  # ₹4.5/m² average

    # Cylinder/plate setup amortization
    setup_cost = 15000  # ₹15,000 for printing cylinders
    setup_per_pouch = setup_cost / max(req.quantity, 1)

    # Total cost per pouch
    total_per_pouch = material_cost + conversion_cost + setup_per_pouch

    # CO₂ per pouch
    co2_per_pouch = area_m2 * mat.get("co2e_g_m2", 100)

    return {
        "material_id": req.material_id,
        "material_name": mat["name"],
        "quantity": req.quantity,
        "area_m2_per_pouch": round(area_m2, 4),
        "breakdown": {
            "material_cost": round(material_cost, 2),
            "conversion_cost": round(conversion_cost, 2),
            "setup_amortized": round(setup_per_pouch, 2),
            "total_per_pouch": round(total_per_pouch, 2),
            "total_order": round(total_per_pouch * req.quantity, 0),
        },
        "co2_per_pouch_g": round(co2_per_pouch, 1),
        "co2_total_kg": round(co2_per_pouch * req.quantity / 1000, 2),
        "polymer_benchmarks": POLYMER_PRICES,
    }


# ---------------------------------------------------------------------------
# Digital Packaging Passport (QR)
# ---------------------------------------------------------------------------
class PassportRequest(BaseModel):
    commodity_id: str
    material_id: str
    batch_date: Optional[str] = None
    quantity: Optional[int] = None
    manufacturer: Optional[str] = None


@app.post("/api/passport")
def create_passport(req: PassportRequest):
    commodity = COMMODITY_MAP.get(req.commodity_id)
    material = MATERIAL_MAP.get(req.material_id)
    if not commodity or not material:
        raise HTTPException(404, "Commodity or material not found")

    # Generate passport ID
    today = date.today()
    uid = uuid.uuid4().hex[:6].upper()
    passport_id = f"DPP-{today.strftime('%Y%m')}-{uid}"

    # QR data
    qr_data = json.dumps({
        "id": passport_id,
        "commodity": commodity["name"],
        "material": material["name"],
        "otr": material.get("otr"),
        "wvtr": material.get("wvtr"),
        "shelf_life_days": commodity["shelf_life"],
        "storage": commodity["storage"],
        "temp_c": commodity["temp"],
        "recyclability": material.get("recyclability"),
        "recycle_code": material.get("recycle_code"),
        "batch": req.batch_date or today.isoformat(),
        "manufacturer": req.manufacturer or "PackPulse User",
    }, indent=2)

    # Generate QR code as base64 PNG
    try:
        import qrcode
        qr = qrcode.QRCode(version=1, box_size=8, border=2)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_base64 = base64.b64encode(buf.getvalue()).decode()
    except ImportError:
        qr_base64 = None

    passport = {
        "passport_id": passport_id,
        "commodity": commodity["name"],
        "commodity_id": commodity["id"],
        "material": material["name"],
        "material_id": material["id"],
        "layers_desc": material.get("layers_desc", ""),
        "otr": material.get("otr"),
        "wvtr": material.get("wvtr"),
        "thickness_um": material.get("thickness_um"),
        "shelf_life_days": commodity["shelf_life"],
        "storage": commodity["storage"],
        "temp_c": commodity["temp"],
        "rh": commodity.get("rh"),
        "recyclability": material.get("recyclability"),
        "recycle_code": material.get("recycle_code"),
        "recycle_note": material.get("recycle_note"),
        "batch_date": req.batch_date or today.isoformat(),
        "manufacturer": req.manufacturer or "PackPulse User",
        "created_at": datetime.utcnow().isoformat(),
        "qr_base64": qr_base64,
        "qr_data": qr_data,
        "sources": material.get("sources", []),
    }

    SAVED_PASSPORTS.append(passport)
    return passport


# ---------------------------------------------------------------------------
# Peer Review (Researcher Dataset Updates)
# ---------------------------------------------------------------------------
class PeerReviewSubmission(BaseModel):
    material_name: str
    family: str
    otr: float
    wvtr: float
    thickness_um: float
    doi: Optional[str] = None
    notes: Optional[str] = None
    submitted_by: str = "researcher@packpulse.in"


@app.post("/api/peer-review/submit")
def submit_for_review(req: PeerReviewSubmission):
    submission = {
        "id": uuid.uuid4().hex[:8],
        "material_name": req.material_name,
        "family": req.family,
        "otr": req.otr,
        "wvtr": req.wvtr,
        "thickness_um": req.thickness_um,
        "doi": req.doi,
        "notes": req.notes,
        "submitted_by": req.submitted_by,
        "submitted_at": datetime.utcnow().isoformat(),
        "status": "pending",
        "approvals": [],
        "required_approvals": 3,
    }
    PEER_REVIEWS.append(submission)
    return submission


@app.get("/api/peer-review/pending")
def list_pending_reviews():
    return [r for r in PEER_REVIEWS if r["status"] == "pending"]


@app.post("/api/peer-review/{review_id}/approve")
def approve_review(review_id: str, reviewer: str = "reviewer@packpulse.in"):
    review = next((r for r in PEER_REVIEWS if r["id"] == review_id), None)
    if not review:
        raise HTTPException(404, "Review not found")
    if review["status"] != "pending":
        raise HTTPException(400, "Review already resolved")
    if reviewer in review["approvals"]:
        raise HTTPException(400, "Already approved by this reviewer")

    review["approvals"].append(reviewer)
    if len(review["approvals"]) >= review["required_approvals"]:
        review["status"] = "approved"
        # In production, this would append to materials.json
    return review


@app.post("/api/peer-review/{review_id}/reject")
def reject_review(review_id: str, reason: str = "Does not meet verification criteria"):
    review = next((r for r in PEER_REVIEWS if r["id"] == review_id), None)
    if not review:
        raise HTTPException(404, "Review not found")
    review["status"] = "rejected"
    review["rejection_reason"] = reason
    return review


# ---------------------------------------------------------------------------
# Scientific trends (simulated Europe PMC feed)
# ---------------------------------------------------------------------------
SIMULATED_TRENDS = [
    {
        "title": "Mapping gas permeability of sustainable packaging materials",
        "journal": "npj Science of Food",
        "year": 2026,
        "doi": "10.1038/s41538-026-00741-7",
        "summary": "Clustered 295 OTR/WVTR data points from 49 studies using K-Means and DBSCAN to map sustainable packaging materials.",
        "relevance": "high",
    },
    {
        "title": "Chitosan-based active packaging films for fresh produce",
        "journal": "Food Chemistry",
        "year": 2026,
        "doi": "10.1016/j.foodchem.2026.142578",
        "summary": "Novel chitosan-nanocellulose composite films showing OTR of 320 cc/m²·day and antimicrobial activity against E. coli.",
        "relevance": "medium",
    },
    {
        "title": "Recycled PET safety assessment for food contact in Indian conditions",
        "journal": "Journal of Food Science",
        "year": 2026,
        "doi": "10.1111/1750-3841.17234",
        "summary": "Validates rPET migration limits under FSSAI March 2025 amendment conditions. Supports expanded use of recycled PET.",
        "relevance": "high",
    },
    {
        "title": "Nano-ZnO incorporation in LLDPE films for antimicrobial packaging",
        "journal": "Packaging Technology and Science",
        "year": 2025,
        "doi": "10.1002/pts.2798",
        "summary": "ZnO nanoparticles at 3% loading reduced microbial counts by 99.2% while maintaining mechanical properties.",
        "relevance": "medium",
    },
]

@app.get("/api/trends")
def get_scientific_trends():
    return SIMULATED_TRENDS


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
