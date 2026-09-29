"use client";

import React from "react";

export default function RoleInsightCard({ currentRole, roleInsights, onOpenCitations }) {
  if (!roleInsights || !roleInsights.headline) return null;

  return (
    <div className="role-side-panel">
      <div className="role-intel-card glass-card">
        <h4>
          <span>{roleInsights.headline}</span>
          <span style={{ fontSize: "0.72rem", background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
            {roleInsights.badge}
          </span>
        </h4>

        <ul className="action-bullets">
          {roleInsights.action_items?.map((item, idx) => (
            <li key={idx} className="action-bullet-item">
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.74rem", color: "var(--text-sub)" }}>
            Ground Truth: NIFTEM-T / CFTRI Guidelines
          </span>
          <button
            type="button"
            style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
            onClick={onOpenCitations}
          >
            Verify Sources →
          </button>
        </div>
      </div>
    </div>
  );
}
