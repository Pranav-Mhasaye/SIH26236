"use client";

import React from "react";

export default function Header({
  currentRole,
  onRoleChange,
  currentLang,
  onLangChange,
  onOpenWalkthrough,
  onOpenCitations,
  onOpenPeerReview,
  onOpenPassportLookup,
  apiOnline
}) {
  const roles = [
    { id: "researcher", label: "Researcher", icon: "🔬" },
    { id: "farmer", label: "Farmer / Producer", icon: "🌾" },
    { id: "logistics", label: "Logistics Manager", icon: "🚛" },
    { id: "general", label: "General User", icon: "👤" }
  ];

  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी (Hindi)" },
    { code: "mr", label: "मराठी (Marathi)" },
    { code: "ta", label: "தமிழ் (Tamil)" },
    { code: "te", label: "తెలుగు (Telugu)" }
  ];

  return (
    <header className="top-nav">
      <div className="nav-container">
        {/* Brand & Gov Badge */}
        <div className="brand-section">
          <a href="/" className="brand-logo">
            <span className="brand-dot"></span>
            PackPulse
          </a>
          <span className="gov-badge">SIH 26236 • MoFPI</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.72rem",
              color: apiOnline ? "#34d399" : "#f43f5e",
              fontWeight: 600
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: apiOnline ? "#10b981" : "#f43f5e"
              }}
            ></span>
            {apiOnline ? "API Live" : "Connecting..."}
          </span>
        </div>

        {/* Quick Role Switcher Bar for SIH Judges */}
        <div className="role-switcher-bar" title="Quick Role Switcher for Hackathon Judges">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`role-btn ${currentRole === r.id ? "active" : ""}`}
              onClick={() => onRoleChange(r.id)}
            >
              <span>{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Nav Actions */}
        <div className="nav-actions">
          <select
            className="lang-select"
            value={currentLang}
            onChange={(e) => onLangChange(e.target.value)}
            aria-label="Select Language"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="nav-link-btn"
            onClick={onOpenWalkthrough}
            title="Step-by-step Guided Tour"
          >
            <span>📖</span>
            <span>How It Works</span>
          </button>

          <button
            type="button"
            className="nav-link-btn"
            onClick={onOpenCitations}
            title="Scientific Database Sources"
          >
            <span>📚</span>
            <span>Citations</span>
          </button>

          {currentRole === "researcher" && (
            <button
              type="button"
              className="nav-link-btn"
              onClick={onOpenPeerReview}
              style={{ borderColor: "rgba(99, 102, 241, 0.4)", color: "#a5b4fc" }}
            >
              <span>🧪</span>
              <span>Peer Review & Trends</span>
            </button>
          )}

          <button
            type="button"
            className="nav-link-btn"
            onClick={onOpenPassportLookup}
            title="Scan or Lookup Digital Passport"
          >
            <span>📱</span>
            <span>Scan QR</span>
          </button>
        </div>
      </div>
    </header>
  );
}
