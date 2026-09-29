"""
Digital Packaging Passport & QR Traceability Engine.
Generates:
- Unique Digital Packaging Passport (DPP)
- Base64 Scannable QR Code linking to full digital passport specs
- Live Shelf-Life & Cold Chain Traceability Log
- Statutory FSSAI & EPR Disposal Directives
"""

import io
import base64
import uuid
import qrcode
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class PassportService:
    def __init__(self):
        # In-memory store for generated passports (persistent across server run)
        self.passports_db = {}

    def generate_passport(
        self,
        commodity: Dict[str, Any],
        material: Dict[str, Any],
        pack_weight_g: float = 500.0,
        batch_number: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates a complete Digital Packaging Passport and QR code.
        """
        passport_id = f"DPP-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
        batch_id = batch_number or f"BATCH-{datetime.now().strftime('%d%m')}-{uuid.uuid4().hex[:4].upper()}"
        
        mfg_date = datetime.now()
        shelf_life_days = int(commodity.get("shelf_life", 30))
        expiry_date = mfg_date + timedelta(days=shelf_life_days)

        passport_data = {
            "passport_id": passport_id,
            "batch_number": batch_id,
            "created_at": mfg_date.isoformat(),
            "commodity": {
                "id": commodity.get("id"),
                "name": commodity.get("name"),
                "category": commodity.get("category"),
                "pack_weight_g": pack_weight_g,
                "moisture_pct": commodity.get("moisture"),
                "fat_pct": commodity.get("fat"),
                "ph": commodity.get("ph"),
                "respiration_rate": commodity.get("resp20")
            },
            "packaging_specification": {
                "material_id": material.get("id"),
                "material_name": material.get("name"),
                "structure": material.get("structure"),
                "thickness_um": material.get("thickness_um"),
                "otr": material.get("otr"),
                "wvtr": material.get("wvtr"),
                "puncture_grade": material.get("puncture", 3),
                "heat_seal_temp_c": material.get("seal", {}).get("sit_c", 115)
            },
            "lifecycle_and_shelf_life": {
                "manufacture_date": mfg_date.strftime("%d %b %Y"),
                "expiry_date": expiry_date.strftime("%d %b %Y"),
                "total_shelf_life_days": shelf_life_days,
                "days_remaining": shelf_life_days,
                "freshness_status": "Optimal Freshness (100%)"
            },
            "storage_and_logistics_rules": {
                "storage_mode": commodity.get("mode_label", "Standard"),
                "recommended_temp_c": commodity.get("temp", 25),
                "recommended_rh_pct": commodity.get("rh", 65),
                "map_gas": commodity.get("map_gas_recommended", {}),
                "transit_notes": "Maintain continuous cold-chain. Avoid puncture shocks."
            },
            "circularity_and_disposal": {
                "degradability_type": material.get("degradability_type", "Standard Recyclable"),
                "eco_grade": material.get("eco_grade", "B"),
                "resin_code": material.get("recyclability", {}).get("resin_code", 4),
                "disposal_instructions": material.get("recyclability", {}).get("note", "Recycle with soft plastics."),
                "carbon_footprint_g_co2e": material.get("carbon_footprint_g_m2", 100)
            },
            "supply_chain_checkpoints": [
                {"stage": "Farm / Food Processing Plant", "status": "Packed & Sealed", "timestamp": mfg_date.strftime("%d %b %Y %H:%M")},
                {"stage": "Depot Quality Clearance", "status": "Inspected & Verified", "timestamp": (mfg_date + timedelta(hours=4)).strftime("%d %b %Y %H:%M")},
                {"stage": "Cold Chain Logistics Transit", "status": "In Transit (Reefer Vehicle)", "timestamp": "Active Monitoring"},
                {"stage": "Retail Distribution", "status": "Pending Arrival", "timestamp": "-"}
            ]
        }

        # Generate QR Code image (base64 PNG)
        qr_content = f"https://packpulse-sih26236.gov.in/passport/{passport_id}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=6,
            border=2,
        )
        qr.add_data(qr_content)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

        passport_data["qr_code_image"] = qr_b64
        passport_data["qr_target_url"] = qr_content

        # Save to database
        self.passports_db[passport_id] = passport_data

        return passport_data

    def get_passport(self, passport_id: str) -> Optional[Dict[str, Any]]:
        return self.passports_db.get(passport_id)
