"""
Document Specification Extractor for Researchers & Industry Lab Reports.
Supports PDF and CSV file formats.
Uses deterministic regex and key-value mapping to reliably parse:
- Commodity Name
- Moisture Content (%)
- Oil / Fat Content (%)
- pH Value
- Respiration Rate (mg CO2/kg·h)
- Target Shelf Life (Days)
- Storage Temperature (°C)
- Relative Humidity (%)
"""

import io
import re
import csv
from typing import Dict, Any, Optional
from pypdf import PdfReader

class DocumentExtractor:
    def extract_from_pdf(self, pdf_bytes: bytes, filename: str = "report.pdf") -> Dict[str, Any]:
        """
        Extracts raw text from PDF and parses parameters via regex.
        """
        reader = PdfReader(io.BytesIO(pdf_bytes))
        full_text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                full_text += t + "\n"

        extracted = self._parse_text_with_regex(full_text)
        extracted["source_file"] = filename
        extracted["format"] = "PDF"
        extracted["raw_text_snippet"] = full_text[:400] + ("..." if len(full_text) > 400 else "")
        return extracted

    def extract_from_csv(self, csv_bytes: bytes, filename: str = "spec.csv") -> Dict[str, Any]:
        """
        Extracts key-value pairs from CSV text.
        """
        text = csv_bytes.decode("utf-8", errors="ignore")
        # Try both structured dictionary mapping and regex scan
        extracted = {}
        reader = csv.reader(io.StringIO(text))
        for row in reader:
            if len(row) >= 2:
                key = row[0].strip().lower()
                val = row[1].strip()
                self._map_key_val(key, val, extracted)

        # Fallback to regex scan if table wasn't simple key-value
        if len(extracted) < 2:
            extracted = self._parse_text_with_regex(text)

        extracted["source_file"] = filename
        extracted["format"] = "CSV"
        return extracted

    def _parse_text_with_regex(self, text: str) -> Dict[str, Any]:
        params = {}

        # 1. Commodity Name
        name_match = re.search(r'(?:commodity|product|sample|food|item)\s*(?:name)?\s*[:=\t-]\s*([a-zA-Z\s()]+)', text, re.I)
        if name_match:
            params["name"] = name_match.group(1).split("\n")[0].strip()

        # 2. Moisture Content
        moist_match = re.search(r'(?:moisture|water\s*content)\s*[:=\t-]?\s*([0-9.]+)\s*%?', text, re.I)
        if moist_match:
            try: params["moisture"] = float(moist_match.group(1))
            except ValueError: pass

        # 3. Fat / Oil Content
        fat_match = re.search(r'(?:fat|oil|lipid)\s*(?:content)?\s*[:=\t-]?\s*([0-9.]+)\s*%?', text, re.I)
        if fat_match:
            try: params["fat"] = float(fat_match.group(1))
            except ValueError: pass

        # 4. pH
        ph_match = re.search(r'\bph\b\s*[:=\t-]?\s*([0-9.]+)', text, re.I)
        if ph_match:
            try: params["ph"] = float(ph_match.group(1))
            except ValueError: pass

        # 5. Respiration Rate
        resp_match = re.search(r'(?:respiration|resp(?:\.?)?\s*rate)\s*[:=\t-]?\s*([0-9.]+)', text, re.I)
        if resp_match:
            try: params["resp20"] = float(resp_match.group(1))
            except ValueError: pass

        # 6. Desired Shelf Life
        shelf_match = re.search(r'(?:shelf\s*life|target\s*life|storage\s*duration)\s*[:=\t-]?\s*([0-9.]+)\s*(?:days|d|months|m)?', text, re.I)
        if shelf_match:
            try:
                days = float(shelf_match.group(1))
                # If months mentioned, convert to days
                if "month" in text[shelf_match.start():shelf_match.end()+10].lower():
                    days *= 30
                params["shelf_life"] = days
            except ValueError: pass

        # 7. Storage Temperature
        temp_match = re.search(r'(?:storage\s*temp(?:erature)?|temp(?:erature)?)\s*[:=\t-]?\s*([0-9.-]+)\s*°?C?', text, re.I)
        if temp_match:
            try: params["temp"] = float(temp_match.group(1))
            except ValueError: pass

        # 8. Relative Humidity
        rh_match = re.search(r'(?:relative\s*humidity|humidity|rh)\s*[:=\t-]?\s*([0-9.]+)\s*%?', text, re.I)
        if rh_match:
            try: params["rh"] = float(rh_match.group(1))
            except ValueError: pass

        # Compute extraction confidence score
        confidence = min(0.98, max(0.50, len(params) * 0.16))
        return {
            "parameters": params,
            "fields_extracted_count": len(params),
            "confidence": round(confidence, 2)
        }

    def _map_key_val(self, key: str, val: str, target: Dict[str, Any]):
        num_clean = re.findall(r'[-+]?\d*\.\d+|\d+', val)
        val_float = float(num_clean[0]) if num_clean else None

        if "commodity" in key or "product" in key or "sample" in key:
            target["name"] = val
        elif "moisture" in key and val_float is not None:
            target["moisture"] = val_float
        elif ("fat" in key or "oil" in key) and val_float is not None:
            target["fat"] = val_float
        elif "ph" in key and val_float is not None:
            target["ph"] = val_float
        elif "resp" in key and val_float is not None:
            target["resp20"] = val_float
        elif "shelf" in key and val_float is not None:
            target["shelf_life"] = val_float
        elif "temp" in key and val_float is not None:
            target["temp"] = val_float
        elif ("humidity" in key or "rh" in key) and val_float is not None:
            target["rh"] = val_float
