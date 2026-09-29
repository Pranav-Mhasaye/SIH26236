"use client";

import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function CookieConsentBanner({ sessionId, onConsentChange }) {
  const [showBanner, setShowBanner] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("packpulse_cookie_consent");
      if (stored === null) {
        setShowBanner(true);
      } else {
        const isGranted = stored === "true";
        setConsentGranted(isGranted);
        onConsentChange(isGranted);
      }
    } catch {
      setShowBanner(true);
    }
  }, [onConsentChange]);

  const handleDecision = (granted) => {
    try {
      localStorage.setItem("packpulse_cookie_consent", String(granted));
    } catch {}

    setConsentGranted(granted);
    setShowBanner(false);
    onConsentChange(granted);

    fetch(`${API_BASE}/api/cookies/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        consent_granted: granted,
        preferences: { analytics: true, personalization: granted }
      })
    }).catch((e) => console.error("Cookie consent failed", e));
  };

  if (!showBanner) {
    if (consentGranted) {
      return (
        <div style={{ position: "fixed", bottom: "16px", right: "16px", zIndex: 90, background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "20px", padding: "4px 12px", fontSize: "0.74rem", color: "#34d399", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
          <span>✨</span>
          <span>Adaptive ML Personalization Active</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        <h5>🍪 Privacy-First ML Personalization</h5>
        <p>
          PackPulse can utilize anonymous query context to adapt multi-criteria recommendation weights and tune our food-packaging compatibility model. No personal identifiers are stored.
        </p>
      </div>
      <div className="cookie-actions">
        <button
          type="button"
          className="btn-sm-accept"
          onClick={() => handleDecision(true)}
        >
          Allow &amp; Personalize ✓
        </button>
        <button
          type="button"
          className="btn-sm-decline"
          onClick={() => handleDecision(false)}
        >
          Decline (Strict)
        </button>
      </div>
    </div>
  );
}
