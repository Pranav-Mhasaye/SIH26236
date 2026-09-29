"""
Search & Intent Classification Engine with Multi-Lingual Regional Aliases & Typo Tolerance.
Supports:
- English, Hindi (हिन्दी), Marathi (मराठी), Tamil (தமிழ்), Telugu (తెలుగు)
- Fuzzy Levenshtein matching for typo tolerance (e.g. 'potatto' -> potato, 'tamto' -> tomato)
- Direct transliterated aliases ('aloo' -> potato, 'kela' -> banana, 'tamatar' -> tomato)
"""

import os
import json
import difflib
from typing import List, Dict, Any, Optional

DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "datasets")

class CommoditySearchEngine:
    def __init__(self):
        with open(os.path.join(DATASETS_DIR, "commodities.json"), "r", encoding="utf-8") as f:
            self.commodities = json.load(f)
        
        # Build search index
        self.index = []
        for c in self.commodities:
            entry = {
                "id": c["id"],
                "name": c["name"],
                "category": c["category"],
                "keywords": [k.lower().strip() for k in c.get("search_keywords", [])],
                "regional_names": c.get("regional_names", {})
            }
            self.index.append(entry)

    def search(self, query: str, limit: int = 8) -> Dict[str, Any]:
        """
        Executes multi-stage search:
        1. Exact match across commodity ID, English name, or regional keywords
        2. Substring & prefix matches
        3. Fuzzy typo-correction (difflib / Levenshtein similarity)
        """
        q = query.strip().lower()
        if not q:
            return {"query": query, "results": [], "corrected_query": None, "match_type": "empty"}

        exact_matches = []
        prefix_matches = []
        substring_matches = []
        fuzzy_matches = []

        all_terms = {}
        for entry in self.index:
            cid = entry["id"]
            # Check exact match
            if q == entry["name"].lower() or q == cid:
                exact_matches.append((100, entry))
                continue
            
            # Check keywords & regional aliases
            matched_keyword = False
            for kw in entry["keywords"]:
                all_terms[kw] = entry
                if q == kw:
                    exact_matches.append((95, entry))
                    matched_keyword = True
                    break
                elif kw.startswith(q) or q.startswith(kw):
                    prefix_matches.append((80, entry))
                    matched_keyword = True
                    break
                elif q in kw:
                    substring_matches.append((60, entry))
                    matched_keyword = True
                    break
            
            if not matched_keyword:
                # Check regional name values directly
                for lang, rname in entry["regional_names"].items():
                    rname_clean = rname.lower()
                    if q in rname_clean:
                        substring_matches.append((70, entry))
                        break

        # Deduplicate and sort matches
        seen_ids = set()
        results = []

        for score, entry in exact_matches + prefix_matches + substring_matches:
            if entry["id"] not in seen_ids:
                seen_ids.add(entry["id"])
                # Attach full commodity record
                comm_full = next((c for c in self.commodities if c["id"] == entry["id"]), None)
                results.append({"commodity": comm_full, "match_score": score, "matched_via": "keyword_or_alias"})

        # If few or no results, attempt Fuzzy Typo Correction
        corrected_query = None
        match_type = "exact_or_substring"

        if len(results) < 2:
            close_matches = difflib.get_close_matches(q, list(all_terms.keys()), n=3, cutoff=0.55)
            if close_matches:
                corrected_query = close_matches[0]
                match_type = "fuzzy_typo_corrected"
                for candidate in close_matches:
                    entry = all_terms[candidate]
                    if entry["id"] not in seen_ids:
                        seen_ids.add(entry["id"])
                        comm_full = next((c for c in self.commodities if c["id"] == entry["id"]), None)
                        results.append({
                            "commodity": comm_full,
                            "match_score": 50,
                            "matched_via": f"fuzzy_typo_match ('{q}' → '{candidate}')"
                        })

        return {
            "query": query,
            "corrected_query": corrected_query,
            "match_type": match_type,
            "results": results[:limit]
        }
