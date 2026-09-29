"""
Researcher Peer-Review & Live Master Dataset Workflow Engine.
Implements the democratic 3-Researcher Verification Protocol:
1. Researcher submits new packaging material/structure with DOI citation & test specs.
2. Item enters the Peer-Review Verification Queue (Status: Pending Verification).
3. Other authenticated domain researchers inspect the test methodology and submit reviews.
4. When 3 approvals are recorded, item is automatically merged into the live Master Dataset (materials.json),
   making it immediately searchable and recommendable across all user roles!
"""

import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "datasets")
MATERIALS_FILE = os.path.join(DATASETS_DIR, "materials.json")

class PeerReviewWorkflow:
    def __init__(self):
        # In-memory queue with initial seed items for demonstration
        self.submissions = [
            {
                "id": "SUB-2026-001",
                "submitted_by": "Dr. Ramesh Sharma",
                "institution": "National Institute of Food Technology (NIFTEM)",
                "submitted_at": "2026-09-20T10:30:00",
                "material_name": "Chitosan-Graphene Oxide Bionanocomposite Film",
                "structure": "Chitosan 40 µm / Graphene Oxide 1.5% wt / Gelatin 10 µm",
                "thickness_um": 50.0,
                "otr": 4.2,
                "wvtr": 1.8,
                "degradability_type": "Certified Home Compostable (Bio-Marine Derived)",
                "carbon_footprint_g_m2": 45.0,
                "cost_m2": 16.50,
                "citation": {
                    "title": "Chitosan-graphene oxide functional nanocomposites with enhanced gas barrier for food packaging",
                    "journal": "Carbohydrate Polymers",
                    "year": "2025",
                    "doi": "https://doi.org/10.1016/j.carbpol.2025.121045",
                    "test_standard": "ASTM D3985 (23°C, 50% RH)"
                },
                "status": "pending_review",
                "approvals": [
                    {"reviewer": "Dr. Ananya Roy (CFTRI)", "decision": "Approve", "comment": "Excellent barrier data verified under ASTM conditions.", "date": "2026-09-22"},
                    {"reviewer": "Prof. S. Venkatesh (IIT Kharagpur)", "decision": "Approve", "comment": "Compostability kinetics follow ISO 17088.", "date": "2026-09-25"}
                ],
                "approvals_count": 2,
                "threshold_required": 3
            },
            {
                "id": "SUB-2026-002",
                "submitted_by": "Dr. Sarah Al-Mansoor",
                "institution": "CIRAD Packaging Lab",
                "submitted_at": "2026-09-24T14:15:00",
                "material_name": "Algae-Derived Agarose Oxygen Scavenging Film",
                "structure": "Agarose 35 µm / Ascorbic Acid Scavenger 5 µm / PLA 20 µm",
                "thickness_um": 60.0,
                "otr": 0.85,
                "wvtr": 3.4,
                "degradability_type": "100% Marine & Soil Biodegradable",
                "carbon_footprint_g_m2": 38.0,
                "cost_m2": 18.20,
                "citation": {
                    "title": "Active oxygen scavenging bio-films from seaweed polysaccharides for high-lipid food storage",
                    "journal": "npj Science of Food",
                    "year": "2026",
                    "doi": "https://doi.org/10.1038/s41538-026-00890-1",
                    "test_standard": "ASTM F1249 & MOCON Oxtran"
                },
                "status": "pending_review",
                "approvals": [
                    {"reviewer": "Dr. K. Meenakshi (TNAU Coimbatore)", "decision": "Approve", "comment": "Active scavenging rate matches shelf-life extension data.", "date": "2026-09-27"}
                ],
                "approvals_count": 1,
                "threshold_required": 3
            }
        ]

    def get_pending_submissions(self) -> List[Dict[str, Any]]:
        return self.submissions

    def submit_new_material(self, data: Dict[str, Any], researcher_name: str, institution: str) -> Dict[str, Any]:
        """
        Submits a new packaging material for community peer review.
        """
        sub_id = f"SUB-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"
        submission = {
            "id": sub_id,
            "submitted_by": researcher_name,
            "institution": institution,
            "submitted_at": datetime.now().isoformat(),
            "material_name": data.get("material_name"),
            "structure": data.get("structure"),
            "thickness_um": float(data.get("thickness_um", 50.0)),
            "otr": float(data.get("otr", 10.0)),
            "wvtr": float(data.get("wvtr", 2.0)),
            "degradability_type": data.get("degradability_type", "Compostable Bio-Material"),
            "carbon_footprint_g_m2": float(data.get("carbon_footprint_g_m2", 75.0)),
            "cost_m2": float(data.get("cost_m2", 15.0)),
            "citation": {
                "title": data.get("citation_title", "Independent Research Publication"),
                "journal": data.get("journal", "Food Packaging and Shelf Life"),
                "year": data.get("year", str(datetime.now().year)),
                "doi": data.get("doi", "https://doi.org/10.1016/j.fpsl"),
                "test_standard": data.get("test_standard", "ASTM D3985 / ASTM F1249")
            },
            "status": "pending_review",
            "approvals": [],
            "approvals_count": 0,
            "threshold_required": 3
        }

        self.submissions.append(submission)
        return submission

    def vote_submission(self, sub_id: str, reviewer_name: str, institution: str, decision: str, comment: str) -> Dict[str, Any]:
        """
        A peer researcher casts an approval vote with laboratory commentary.
        If approvals reach 3, the material is immediately merged into materials.json!
        """
        sub = next((s for s in self.submissions if s["id"] == sub_id), None)
        if not sub:
            raise ValueError(f"Submission {sub_id} not found.")

        # Check if already approved
        for app in sub["approvals"]:
            if app["reviewer"] == reviewer_name:
                raise ValueError(f"Reviewer {reviewer_name} has already voted on this submission.")

        sub["approvals"].append({
            "reviewer": f"{reviewer_name} ({institution})",
            "decision": decision,
            "comment": comment,
            "date": datetime.now().strftime("%Y-%m-%d %H:%M")
        })

        if decision.lower() == "approve":
            sub["approvals_count"] += 1

        # Check threshold
        merged_to_master = False
        if sub["approvals_count"] >= sub["threshold_required"] and sub["status"] != "approved":
            sub["status"] = "approved"
            merged_to_master = self._merge_into_master_dataset(sub)

        return {
            "submission_id": sub_id,
            "current_approvals": sub["approvals_count"],
            "status": sub["status"],
            "merged_to_master_dataset": merged_to_master
        }

    def _merge_into_master_dataset(self, sub: Dict[str, Any]) -> bool:
        """
        Appends the approved research material into the live materials.json file.
        """
        try:
            with open(MATERIALS_FILE, "r", encoding="utf-8") as f:
                materials = json.load(f)

            new_id = f"mat-live-{uuid.uuid4().hex[:6]}"
            new_mat = {
                "id": new_id,
                "name": sub["material_name"],
                "family": "Live Peer-Approved Research",
                "layers": [{"m": "LIVE_RES", "name": sub["material_name"], "long": sub["material_name"], "family": "BIO", "um": sub["thickness_um"], "role": "Peer-Verified Active Barrier", "adjust": None, "share_o2": 1.0, "share_w": 1.0}],
                "structure": sub["structure"],
                "thickness_um": sub["thickness_um"],
                "gsm": sub["thickness_um"] * 1.1,
                "otr": sub["otr"],
                "wvtr": sub["wvtr"],
                "beta": 3.5,
                "cost_m2": sub["cost_m2"],
                "co2e_g_m2": sub["carbon_footprint_g_m2"],
                "seal": {"rating": 4, "sit_c": 115, "method": "Heat seal"},
                "tensile_mpa": 75,
                "puncture": 3,
                "puncture_label": "Good",
                "temp_min": -20,
                "temp_max": 80,
                "light_barrier": 0.8,
                "max_pack_kg": 2,
                "formats": ["Pouch", "Bag"],
                "uses": ["Gas flush", "Produce"],
                "recyclability": {"class": "compostable", "label": "Compostable", "note": sub["degradability_type"], "resin_code": 0},
                "cautions": ["Laboratory validated under peer-review protocol."],
                "citations": [
                    {
                        "institution": sub["institution"],
                        "title": sub["citation"]["title"],
                        "year": sub["citation"]["year"],
                        "url": sub["citation"]["doi"],
                        "confidence": "Peer-Verified Gold Standard",
                        "type": "Peer-Reviewed Literature"
                    }
                ],
                "primary_citation": {
                    "institution": sub["institution"],
                    "title": sub["citation"]["title"],
                    "year": sub["citation"]["year"],
                    "url": sub["citation"]["doi"],
                    "confidence": "Peer-Verified"
                },
                "degradability_type": sub["degradability_type"],
                "eco_grade": "A+",
                "eco_badge": "Live Peer-Verified",
                "carbon_footprint_g_m2": sub["carbon_footprint_g_m2"],
                "fssai_compliance": {"status": "Research Validation Completed", "regulation": "IS 9845 / ISO 17088"}
            }

            materials.insert(0, new_mat)
            with open(MATERIALS_FILE, "w", encoding="utf-8") as f:
                json.dump(materials, f, indent=2, ensure_ascii=False)

            return True
        except Exception as e:
            print(f"Error merging to master dataset: {e}")
            return False
