"use client";

import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function CitationsModal({ isOpen, onClose, selectedCitation = null }) {
  const [citations, setCitations] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_BASE}/api/citations`)
      .then((res) => res.json())
      .then((data) => setCitations(data))
      .catch((e) => console.error(e));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "860px" }}>
        <div className="modal-header">
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#38bdf8", fontWeight: 700 }}>
              SIH26236 Scientific Ground Truth &amp; Verification Registry
            </span>
            <h3>Authoritative Citations &amp; Testing Standards</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {selectedCitation && (
          <div style={{ background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: "14px", padding: "16px", marginBottom: "20px" }}>
            <span style={{ fontSize: "0.72rem", color: "#38bdf8", textTransform: "uppercase", fontWeight: 700 }}>
              Active Cited Source:
            </span>
            <h4 style={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", marginTop: "2px" }}>
              {selectedCitation.institution || selectedCitation.title}
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
              <i>&quot;{selectedCitation.title}&quot;</i> ({selectedCitation.year || "2024"})
            </p>
            {selectedCitation.url && (
              <a
                href={selectedCitation.url}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-block", marginTop: "8px", color: "#34d399", fontSize: "0.82rem", fontWeight: 700 }}
              >
                Access Official Publication / Standard ↗
              </a>
            )}
          </div>
        )}

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
          In accordance with Smart India Hackathon evaluation criteria, every transmission rate (OTR/WVTR), mechanical puncture rating, and food respiration requirement in PackPulse is directly mapped to peer-reviewed or statutory Indian institutions:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
          {Object.entries(citations).map(([k, c]) => (
            <div key={k} style={{ background: "rgba(15,23,42,0.75)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.74rem", background: "rgba(255,255,255,0.06)", color: "#a5b4fc", padding: "2px 8px", borderRadius: "6px" }}>
                      {c.type}
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "#34d399", fontWeight: 700 }}>
                      Confidence: {c.confidence}
                    </span>
                  </div>
                  <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", marginTop: "4px" }}>
                    {c.institution}
                  </h4>
                  <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    <b>Document:</b> <i>&quot;{c.title}&quot;</i> ({c.year})
                  </p>
                </div>
                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="source-citation-badge"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    View Source ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
