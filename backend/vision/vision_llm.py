"""
Tier 2: Cloud Vision LLM Classifier using OpenRouter API.
Takes image bytes, encodes to base64, queries vision model (e.g. google/gemini-2.0-flash-exp:free or similar),
and parses commodity name.
"""

import os
import base64
import requests
import json
from typing import Dict, Any, Optional

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

class VisionLLMClassifier:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY", "")

    def classify(self, image_bytes: bytes, filename: str = "image.jpg") -> Optional[Dict[str, Any]]:
        if not self.api_key:
            return None

        try:
            b64_image = base64.b64encode(image_bytes).decode("utf-8")
            mime_type = "image/jpeg" if filename.lower().endswith((".jpg", ".jpeg")) else "image/png"

            prompt = (
                "You are an agricultural and food packaging expert. Identify the primary food commodity shown in this image. "
                "Respond ONLY with a valid JSON object with keys: "
                "\"commodity_name\" (e.g. 'Tomato', 'Apple', 'Mango', 'Potato', 'Potato Chips', 'Bread'), "
                "\"condition\" (e.g. 'Fresh', 'Ripe', 'Packaged', 'Dry'), "
                "\"confidence\" (number between 0.0 and 1.0). "
                "Do NOT wrap in markdown backticks."
            )

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "SIH26236 Food Packaging AI"
            }

            payload = {
                "model": "google/gemini-2.0-flash-exp:free",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{b64_image}"
                                }
                            }
                        ]
                    }
                ],
                "temperature": 0.1
            }

            resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                # Clean possible backticks
                if content.startswith("```"):
                    content = content.strip("`").replace("json\n", "").strip()
                parsed = json.loads(content)
                return {
                    "commodity_name": parsed.get("commodity_name"),
                    "confidence": float(parsed.get("confidence", 0.90)),
                    "method": "Vision LLM (OpenRouter Cloud API)",
                    "details": f"Detected {parsed.get('commodity_name')} ({parsed.get('condition')})"
                }
            return None
        except Exception:
            return None
