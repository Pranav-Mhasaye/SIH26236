"use client";

import React, { useState } from "react";

export default function ResultsView({
  recommendationData,
  onOpenCosting,
  onOpenPassport,
  onOpenCitationDetail,
  onSelectAlternative
}) {
  const [activeMaterial, setActiveMaterial] = useState(
    recommendationData?.top_recommendations?.[0]?.material || null
  );

  if (!recommendationData) return null;

  const {
    commodity,
    required_specifications,
    top_recommendations,
    green_innovation_upgrade,
    dataset_citations
  } = recommendationData;

  const currentPrimary = top_recommendations?.find(
    (r) => r.material.id === (activeMaterial?.id || top_recommendations[0]?.material.id)
  ) || top_recommendations?.[0];

  const mat = currentPrimary?.material;
  if (!mat) return null;

  const layers = mat.layers || [];

  return (
    <div className="recommendation-results-root">
      {/* 1. GREEN INNOVATION UPGRADE BANNER */}
      {green_innovation_upgrade && (
        <div className="green-innovation-banner">
          <div className="green-content">
            <h4>
              <span>🌱</span>
              <span>Green Innovation Recommendation: Eco-Upgrade Available</span>
              <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.2)", padding: "2px 8px", borderRadius: "12px", border: "1px solid #10b981" }}>
                {green_innovation_upgrade.eco_badge}
              </span>
            </h4>
            <p>{green_innovation_upgrade.benefit_summary}</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span
              className="source-citation-badge"
              onClick={() => onOpenCitationDetail(green_innovation_upgrade.citations?.[0] || dataset_citations.statutory_law)}
              title="Click to view scientific peer citation"
            >
              📖 Citation Verified
            </span>
            <button
              type="button"
              className="green-action-btn"
              onClick={() => {
                const alt = top_recommendations.find(
                  (r) => r.material.name === green_innovation_upgrade.alternative_name
                );
                if (alt) {
                  setActiveMaterial(alt.material);
                  if (onSelectAlternative) onSelectAlternative(alt);
                }
              }}
            >
              Switch to Eco-Option →
            </button>
          </div>
        </div>
      )}

      {/* 2. PRIMARY RECOMMENDATION CARD */}
      <div className="primary-card glass-card">
        <div className="card-top-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: 700, textTransform: "uppercase" }}>
                Primary Recommended Packaging
              </span>
              <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "4px", color: "#94a3b8" }}>
                {mat.family}
              </span>
            </div>
            <h2 className="mat-title">{mat.name}</h2>
            <p className="mat-structure">{mat.structure}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
            {/* Top-Right Citation Box */}
            <span
              className="source-citation-badge"
              onClick={() => onOpenCitationDetail(mat.primary_citation || dataset_citations.materials_source)}
              title="Click to inspect laboratory citation"
            >
              📖 [{mat.primary_citation?.institution?.slice(0, 14) || "NIFTEM-T"}] Verified
            </span>
            <div className="suitability-badge">
              {currentPrimary.suitability_score}% Match
            </div>
          </div>
        </div>

        {/* Plain Language Science Explanation */}
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px", borderLeft: "3px solid #10b981", paddingLeft: "12px" }}>
          <b>Why this works:</b> {currentPrimary.why_text}
        </p>

        {/* 3. INTERACTIVE LAMINATE LAYER STACK VISUALIZER */}
        <div className="laminate-stack-container">
          <div className="stack-env-bar">
            <span>Outside Atmosphere (Ambient Air &amp; Humidity)</span>
            <div className="flux-heads">
              <span className="flux-head o2">⬇ O₂ Flux (Air In)</span>
              <span className="flux-head w">⬇ H₂O Flux (Moisture In)</span>
            </div>
          </div>

          <div className="layers-list">
            {layers.map((l, idx) => (
              <div
                key={idx}
                className={`layer-bar fam-${l.family || "PE"}`}
                style={{ height: `${Math.max(42, Math.min(80, 22 + Math.sqrt(l.um || 20) * 6))}px` }}
              >
                <div className="layer-meta">
                  <span className="layer-name">{l.name}</span>
                  <span className="layer-thickness">{l.um} µm</span>
                  <span className="layer-role">— {l.role}</span>
                </div>
                <div style={{ display: "flex", gap: "14px", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                  <span style={{ color: "#f87171" }}>
                    O₂ Barrier: {Math.round((l.share_o2 || 0.5) * 100)}%
                  </span>
                  <span style={{ color: "#38bdf8" }}>
                    WVTR Barrier: {Math.round((l.share_w || 0.5) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="stack-env-bar inside">
            <span>Food Matrix Contact Surface ({commodity.name})</span>
            <span style={{ color: "#34d399", fontWeight: 700 }}>
              Target Shelf Life: {currentPrimary.predicted_shelf_life_days} Days
            </span>
          </div>
        </div>

        {/* 4. KEY SPECIFICATIONS METRICS GRID */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">
              <span>Oxygen Barrier (OTR)</span>
              <span
                style={{ cursor: "pointer", color: "#38bdf8" }}
                onClick={() => onOpenCitationDetail(dataset_citations.testing_standard)}
                title="Tested via ASTM D3985 Coulometric"
              >
                ⓘ ASTM
              </span>
            </div>
            <div className="metric-val">
              {mat.otr} <span className="metric-unit">cc/m²·day</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              <span>Moisture Barrier (WVTR)</span>
              <span
                style={{ cursor: "pointer", color: "#38bdf8" }}
                onClick={() => onOpenCitationDetail(dataset_citations.testing_standard)}
                title="Tested via ASTM F1249 Modulated IR"
              >
                ⓘ ASTM
              </span>
            </div>
            <div className="metric-val">
              {mat.wvtr} <span className="metric-unit">g/m²·day</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              <span>Film Thickness</span>
            </div>
            <div className="metric-val">
              {mat.thickness_um} <span className="metric-unit">µm</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              <span>Heat Seal Window</span>
            </div>
            <div className="metric-val">
              {mat.seal?.sit_c || 110}°C <span className="metric-unit">{mat.seal?.method}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              <span>Puncture Strength</span>
            </div>
            <div className="metric-val">
              {mat.puncture_label || "Good"} <span className="metric-unit">({mat.puncture || 3}/5)</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              <span>Unit Material Cost</span>
            </div>
            <div className="metric-val">
              ₹{currentPrimary.pouch_material_cost_inr} <span className="metric-unit">/ pouch</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              <span>Carbon Trace</span>
            </div>
            <div className="metric-val" style={{ color: "#34d399" }}>
              {currentPrimary.pouch_co2e_grams}g <span className="metric-unit">CO₂e / pouch</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              <span>EPR Recyclability</span>
            </div>
            <div className="metric-val" style={{ fontSize: "1rem" }}>
              {mat.eco_badge}
            </div>
          </div>
        </div>

        {/* MAP Gas Atmosphere Specification if applicable */}
        {required_specifications.map_suitability && (
          <div style={{ marginTop: "14px", padding: "12px 16px", borderRadius: "10px", background: "rgba(6, 182, 212, 0.08)", border: "1px solid rgba(6, 182, 212, 0.25)" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#06b6d4", textTransform: "uppercase" }}>
              Modified Atmosphere Packaging (MAP) Gas Recommendation:
            </span>
            <div style={{ display: "flex", gap: "20px", marginTop: "4px", fontSize: "0.88rem", color: "#e2e8f0" }}>
              <span><b>Target Gas Mix:</b> {required_specifications.recommended_map_gas?.desc}</span>
              <span><b>O₂:</b> {required_specifications.recommended_map_gas?.O2_pct}</span>
              <span><b>CO₂:</b> {required_specifications.recommended_map_gas?.CO2_pct}</span>
              <span><b>N₂:</b> {required_specifications.recommended_map_gas?.N2_pct}</span>
            </div>
          </div>
        )}

        {/* 5. ACTION BUTTONS BAR */}
        <div className="action-buttons-bar">
          <button
            type="button"
            className="btn-primary"
            onClick={() => onOpenPassport(commodity, mat)}
          >
            <span>📱</span>
            <span>Generate Digital Packaging Passport (QR)</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => onOpenCosting(mat, commodity.pack_g || 500)}
          >
            <span>💰</span>
            <span>Cost &amp; MOQ Optimizer</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.print()}
          >
            <span>🖨️</span>
            <span>Export Technical Spec Sheet</span>
          </button>
        </div>
      </div>

      {/* 6. ALTERNATIVE PACKAGING CANDIDATES */}
      {top_recommendations.length > 1 && (
        <div style={{ marginTop: "28px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", marginBottom: "14px" }}>
            Ranked Alternative Candidates &amp; Structures
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            {top_recommendations.slice(1).map((cand, idx) => (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: "16px",
                  cursor: "pointer",
                  border: activeMaterial?.id === cand.material.id ? "1px solid #10b981" : "1px solid var(--border-glass)"
                }}
                onClick={() => setActiveMaterial(cand.material)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 700 }}>
                      Option #{idx + 2}
                    </span>
                    <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "0.98rem" }}>
                      {cand.material.name}
                    </h4>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-sub)", fontFamily: "var(--font-mono)" }}>
                      {cand.material.structure}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#34d399", background: "rgba(16, 185, 129, 0.15)", padding: "3px 8px", borderRadius: "6px" }}>
                    {cand.suitability_score}%
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <span>Shelf Life: ~{cand.predicted_shelf_life_days}d</span>
                  <span>₹{cand.pouch_material_cost_inr}/pouch</span>
                  <span style={{ color: "#34d399" }}>{cand.pouch_co2e_grams}g CO₂e</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
