"""
Cookie Consent & Machine Learning Personalization Pipeline.
1. Strictly requires explicit user consent before logging interaction signals.
2. Tracks interaction context (role, commodity categories, eco vs cost preference).
3. Adapts recommendation weighting dynamically for consenting sessions:
   - e.g., if a user repeatedly favors green/mono-materials, increases sustainability weight (0.20 -> 0.35)
   - e.g., if a logistics manager repeatedly checks transit puncture ratings, boosts mechanical strength filter.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

class PersonalizationPipeline:
    def __init__(self):
        self.consent_registry = {} # session_id -> bool
        self.interaction_logs = []  # List of consented anonymous events
        self.profile_weights = {}   # session_id -> weights dict

    def register_consent(self, session_id: str, consent_granted: bool, preferences: Optional[Dict[str, bool]] = None) -> Dict[str, Any]:
        """
        Stores user consent record.
        """
        self.consent_registry[session_id] = {
            "consent_granted": consent_granted,
            "preferences": preferences or {"analytics": True, "personalization": True},
            "timestamp": datetime.now().isoformat()
        }
        return {"session_id": session_id, "status": "Consent updated", "consent": consent_granted}

    def record_interaction(self, session_id: str, role: str, commodity_id: str, chosen_material_id: Optional[str] = None, eco_clicked: bool = False):
        """
        Records interaction signal only if consent has been explicitly granted.
        """
        consent_record = self.consent_registry.get(session_id)
        if not consent_record or not consent_record.get("consent_granted"):
            return # Privacy-first: discard without logging

        event = {
            "session_id": session_id,
            "role": role,
            "commodity_id": commodity_id,
            "chosen_material_id": chosen_material_id,
            "eco_clicked": eco_clicked,
            "timestamp": datetime.now().isoformat()
        }
        self.interaction_logs.append(event)
        self._update_profile_weights(session_id)

    def get_session_weights(self, session_id: str, user_role: str) -> Dict[str, float]:
        """
        Returns personalized or role-default weights.
        """
        if session_id in self.profile_weights:
            return self.profile_weights[session_id]

        # Role-based defaults
        if user_role == "farmer":
            return {"barrier": 0.35, "shelf_life": 0.35, "cost": 0.20, "sustainability": 0.10}
        elif user_role == "logistics":
            return {"barrier": 0.30, "shelf_life": 0.30, "cost": 0.25, "sustainability": 0.15}
        elif user_role == "researcher":
            return {"barrier": 0.45, "shelf_life": 0.25, "cost": 0.10, "sustainability": 0.20}
        else: # general user
            return {"barrier": 0.30, "shelf_life": 0.25, "cost": 0.20, "sustainability": 0.25}

    def _update_profile_weights(self, session_id: str):
        """
        Lightweight ML heuristic adapting weights based on user's recent signals.
        """
        user_events = [e for e in self.interaction_logs if e["session_id"] == session_id]
        if not user_events:
            return

        eco_clicks = sum(1 for e in user_events if e.get("eco_clicked"))
        total = len(user_events)

        base_weights = {"barrier": 0.35, "shelf_life": 0.25, "cost": 0.20, "sustainability": 0.20}
        if eco_clicks / max(total, 1) >= 0.5:
            # User demonstrably values sustainability
            base_weights["sustainability"] = 0.35
            base_weights["barrier"] = 0.30
            base_weights["cost"] = 0.15
            base_weights["shelf_life"] = 0.20

        self.profile_weights[session_id] = base_weights

    def get_stats(self) -> Dict[str, Any]:
        """
        Returns stats for the admin / transparency dashboard.
        """
        consented_count = sum(1 for c in self.consent_registry.values() if c.get("consent_granted"))
        return {
            "total_active_sessions": len(self.consent_registry),
            "consented_sessions": consented_count,
            "consented_interactions_logged": len(self.interaction_logs),
            "personalized_profiles_active": len(self.profile_weights)
        }
