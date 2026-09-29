"""
Tier 1: On-Device / Local Backend Image Classifier.
Extracts basic visual features (RGB color histogram, aspect ratio, texture intensity)
and classifies against predefined commodity spectral signatures.
"""

from typing import Dict, Any, Optional
from PIL import Image
import io

COMMODITY_COLOR_SIGNATURES = {
    "tomato": {"r": (140, 255), "g": (20, 110), "b": (20, 110), "aspect": (0.8, 1.2)},
    "apple": {"r": (130, 240), "g": (20, 120), "b": (20, 90), "aspect": (0.8, 1.2)},
    "banana": {"r": (180, 255), "g": (160, 245), "b": (20, 100), "aspect": (1.4, 3.5)},
    "mango": {"r": (180, 255), "g": (130, 220), "b": (20, 100), "aspect": (1.1, 1.8)},
    "potato": {"r": (140, 210), "g": (110, 180), "b": (60, 140), "aspect": (1.0, 1.8)},
    "leafy-greens": {"r": (20, 100), "g": (100, 200), "b": (20, 90), "aspect": (0.5, 2.0)},
    "potato-chips": {"r": (180, 240), "g": (140, 200), "b": (40, 120), "aspect": (0.8, 1.5)},
    "bread": {"r": (160, 220), "g": (120, 180), "b": (60, 130), "aspect": (1.0, 2.5)}
}

class OnDeviceClassifier:
    def classify(self, image_bytes: bytes) -> Optional[Dict[str, Any]]:
        """
        Extracts dominant color profile and aspect ratio to match against commodity signatures.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            width, height = image.size
            aspect = width / max(height, 1)

            # Resize to thumbnail to calculate average color
            thumb = image.resize((50, 50))
            pixels = list(thumb.getdata())
            r_avg = sum(p[0] for p in pixels) / len(pixels)
            g_avg = sum(p[1] for p in pixels) / len(pixels)
            b_avg = sum(p[2] for p in pixels) / len(pixels)

            best_match = None
            highest_score = 0.0

            for cid, sig in COMMODITY_COLOR_SIGNATURES.items():
                r_in = sig["r"][0] <= r_avg <= sig["r"][1]
                g_in = sig["g"][0] <= g_avg <= sig["g"][1]
                b_in = sig["b"][0] <= b_avg <= sig["b"][1]
                asp_in = sig["aspect"][0] <= aspect <= sig["aspect"][1]

                score = 0.0
                if r_in: score += 0.3
                if g_in: score += 0.3
                if b_in: score += 0.2
                if asp_in: score += 0.2

                if score > highest_score:
                    highest_score = score
                    best_match = cid

            if highest_score >= 0.70 and best_match:
                return {
                    "commodity_id": best_match,
                    "confidence": round(highest_score, 2),
                    "method": "On-Device Spectral Profile",
                    "details": f"Matched RGB({int(r_avg)}, {int(g_avg)}, {int(b_avg)}) and aspect {aspect:.2f}"
                }
            return None
        except Exception:
            return None
