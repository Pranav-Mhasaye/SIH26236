"""
FastAPI Server for SIH26236 AI Food Packaging Recommendation System.
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import json

from pipeline.recommender import PackagingRecommender
from pipeline.search import CommoditySearchEngine
from vision.service import VisionService
from documents.extractor import DocumentExtractor
from costing.engine import CostingEngine
from passport.qr_service import PassportService
from peer_review.workflow import PeerReviewWorkflow
from peer_review.trends import ScientificTrendCrawler
from ml_personalization.service import PersonalizationPipeline

app = FastAPI(
    title="PackPulse API — SIH26236 Food Packaging Recommendation Engine",
    description="MoFPI AI-Powered Decision Support Platform for Food Packaging Materials & Digital Traceability",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service Singletons
recommender = PackagingRecommender()
search_engine = CommoditySearchEngine()
vision_service = VisionService()
doc_extractor = DocumentExtractor()
costing_engine = CostingEngine()
passport_service = PassportService()
peer_review_workflow = PeerReviewWorkflow()
trend_crawler = ScientificTrendCrawler()
personalization_pipeline = PersonalizationPipeline()

# ----------------- Models -----------------
class RecommendRequest(BaseModel):
    commodity_id: Optional[str] = None
    custom_params: Optional[Dict[str, Any]] = None
    user_role: str = "general" # researcher, farmer, logistics, general
    session_id: Optional[str] = None
    importance_weights: Optional[Dict[str, float]] = None

class CostCalculateRequest(BaseModel):
    material: Dict[str, Any]
    pack_weight_g: float = 500.0
    order_quantity: int = 5000

class PassportGenerateRequest(BaseModel):
    commodity: Dict[str, Any]
    material: Dict[str, Any]
    pack_weight_g: float = 500.0
    batch_number: Optional[str] = None

class PeerReviewVoteRequest(BaseModel):
    submission_id: str
    reviewer_name: str
    institution: str
    decision: str # Approve / Reject
    comment: str

class CookieConsentRequest(BaseModel):
    session_id: str
    consent_granted: bool
    preferences: Optional[Dict[str, bool]] = None

class CookieLogRequest(BaseModel):
    session_id: str
    role: str
    commodity_id: str
    chosen_material_id: Optional[str] = None
    eco_clicked: bool = False

# ----------------- Endpoints -----------------

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "PackPulse SIH26236 Engine",
        "organization": "Ministry of Food Processing Industries (MoFPI)",
        "commodities_count": len(recommender.commodities),
        "materials_count": len(recommender.materials)
    }

@app.get("/api/commodities")
def get_commodities(category: Optional[str] = None):
    items = recommender.commodities
    if category:
        items = [c for c in items if c.get("category", "").lower() == category.lower()]
    return items

@app.get("/api/commodities/{cid}")
def get_commodity(cid: str):
    comm = recommender.get_commodity(cid)
    if not comm:
        raise HTTPException(status_code=404, detail="Commodity not found")
    return comm

@app.get("/api/materials")
def get_materials():
    # Reload live materials to reflect peer-approved additions
    with open(os.path.join(os.path.dirname(__file__), "datasets", "materials.json"), "r", encoding="utf-8") as f:
        mats = json.load(f)
    return mats

@app.get("/api/citations")
def get_citations():
    return recommender.citations

@app.get("/api/rules")
def get_rules():
    return recommender.rules

@app.get("/api/search")
def search_commodities(q: str = Query("", min_length=1)):
    return search_engine.search(q)

@app.post("/api/recommend")
def recommend_packaging(req: RecommendRequest):
    try:
        # Check if session has personalized weights
        weights = req.importance_weights
        if not weights and req.session_id:
            weights = personalization_pipeline.get_session_weights(req.session_id, req.user_role)

        res = recommender.recommend(
            commodity_id=req.commodity_id,
            custom_params=req.custom_params,
            user_role=req.user_role,
            importance_weights=weights
        )

        # Log interaction for consented sessions
        if req.session_id and req.commodity_id:
            primary_mat_id = res["top_recommendations"][0]["material"]["id"] if res.get("top_recommendations") else None
            personalization_pipeline.record_interaction(
                session_id=req.session_id,
                role=req.user_role,
                commodity_id=req.commodity_id,
                chosen_material_id=primary_mat_id
            )

        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/vision/classify")
async def classify_image(
    file: UploadFile = File(...),
    openrouter_key: Optional[str] = Form(None)
):
    try:
        content = await file.read()
        service = VisionService(openrouter_key)
        res = service.identify_commodity(content, file.filename or "upload.jpg")
        
        # Attach full commodity record if identified
        if res.get("commodity_id"):
            res["commodity_profile"] = recommender.get_commodity(res["commodity_id"])

        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@app.post("/api/documents/extract")
async def extract_document(file: UploadFile = File(...)):
    try:
        content = await file.read()
        fn = file.filename or "file"
        if fn.lower().endswith(".pdf"):
            res = doc_extractor.extract_from_pdf(content, fn)
        elif fn.lower().endswith((".csv", ".txt")):
            res = doc_extractor.extract_from_csv(content, fn)
        else:
            raise HTTPException(status_code=400, detail="Only PDF and CSV files are supported.")
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document parsing failed: {str(e)}")

@app.post("/api/costing/calculate")
def calculate_cost(req: CostCalculateRequest):
    unit_calc = costing_engine.calculate_pouch_cost(
        material=req.material,
        pack_weight_g=req.pack_weight_g,
        order_quantity=req.order_quantity
    )
    comparative = costing_engine.compare_architectures(
        pack_weight_g=req.pack_weight_g,
        order_quantity=req.order_quantity
    )
    return {
        "calculation": unit_calc,
        "comparative_architectures": comparative,
        "polymer_market_benchmarks": costing_engine.POLYMER_MARKET_BENCHMARKS
    }

@app.post("/api/passport/generate")
def generate_passport(req: PassportGenerateRequest):
    return passport_service.generate_passport(
        commodity=req.commodity,
        material=req.material,
        pack_weight_g=req.pack_weight_g,
        batch_number=req.batch_number
    )

@app.get("/api/passport/{pid}")
def get_passport(pid: str):
    passport = passport_service.get_passport(pid)
    if not passport:
        # Generate sample fallback passport for preview
        dummy_comm = recommender.commodities[0]
        dummy_mat = recommender.materials[0]
        passport = passport_service.generate_passport(dummy_comm, dummy_mat, batch_number=pid)
    return passport

@app.get("/api/peer-review/queue")
def get_peer_review_queue():
    return peer_review_workflow.get_pending_submissions()

@app.post("/api/peer-review/submit")
def submit_peer_review(
    data: Dict[str, Any] = Body(...),
    researcher_name: str = Query("Dr. Researcher"),
    institution: str = Query("Agricultural University")
):
    sub = peer_review_workflow.submit_new_material(data, researcher_name, institution)
    return {"message": "Material submitted for peer-review", "submission": sub}

@app.post("/api/peer-review/vote")
def vote_peer_review(req: PeerReviewVoteRequest):
    try:
        res = peer_review_workflow.vote_submission(
            sub_id=req.submission_id,
            reviewer_name=req.reviewer_name,
            institution=req.institution,
            decision=req.decision,
            comment=req.comment
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/peer-review/trends")
def get_scientific_trends(q: str = Query("food packaging barrier")):
    return trend_crawler.fetch_recent_trends(q)

@app.post("/api/cookies/consent")
def set_cookie_consent(req: CookieConsentRequest):
    return personalization_pipeline.register_consent(req.session_id, req.consent_granted, req.preferences)

@app.post("/api/cookies/log")
def log_cookie_interaction(req: CookieLogRequest):
    personalization_pipeline.record_interaction(
        session_id=req.session_id,
        role=req.role,
        commodity_id=req.commodity_id,
        chosen_material_id=req.chosen_material_id,
        eco_clicked=req.eco_clicked
    )
    return {"status": "logged"}

@app.get("/api/cookies/stats")
def get_cookie_stats():
    return personalization_pipeline.get_stats()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
