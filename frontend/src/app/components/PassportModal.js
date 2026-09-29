"use client";

import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function PassportModal({ isOpen, onClose, commodity, material, packWeightG = 500 }) {
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !commodity || !material) return;

    setLoading(true);
    fetch(`${API_BASE}/api/passport/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commodity: commodity,
        material: material,
        pack_weight_g: packWeightG
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setPassport(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [isOpen, commodity, material, packWeightG]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#34d399", fontWeight: 700 }}>
              National Digital Traceability &amp; Circularity Grid
            </span>
            <h3>Digital Packaging Passport (DPP)</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#38bdf8" }}>
            Generating dynamic QR code &amp; digital passport token...
          </div>
        ) : passport ? (
          <div>
            {/* Top Passport Header Box */}
            <div style={{ display: "flex", gap: "24px", background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "16px", border: "1px solid var(--border-glass)", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
              {passport.qr_code_image && (
                <div style={{ background: "#fff", padding: "8px", borderRadius: "10px", display: "inline-block" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={passport.qr_code_image}
                    alt="Digital Packaging Passport QR Code"
                    style={{ width: "130px", height: "130px", display: "block" }}
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#38bdf8", fontWeight: 700 }}>
                  {passport.passport_id}
                </span>
                <h3 style={{ fontSize: "1.5rem", color: "#fff", fontWeight: 800, marginTop: "2px" }}>
                  {passport.commodity.name} ({passport.commodity.pack_weight_g}g)
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  <b>Packaging:</b> {passport.packaging_specification.material_name} ({passport.packaging_specification.structure})
                </p>
                <div style={{ display: "flex", gap: "14px", marginTop: "8px", fontSize: "0.8rem", color: "var(--text-sub)" }}>
                  <span>Batch: <b style={{ color: "#fff" }}>{passport.batch_number}</b></span>
                  <span>Packed: <b style={{ color: "#fff" }}>{passport.lifecycle_and_shelf_life.manufacture_date}</b></span>
                  <span>Expires: <b style={{ color: "#34d399" }}>{passport.lifecycle_and_shelf_life.expiry_date}</b></span>
                </div>
              </div>
            </div>

            {/* Freshness & Lifecycle Progress */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Shelf Life Preservation Status:</span>
                <span style={{ color: "#34d399", fontWeight: 700 }}>
                  {passport.lifecycle_and_shelf_life.freshness_status} ({passport.lifecycle_and_shelf_life.days_remaining} Days Remaining)
                </span>
              </div>
              <div style={{ height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #10b981, #06b6d4)" }}></div>
              </div>
            </div>

            {/* Two-Column Specification Detail */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div style={{ background: "rgba(15,23,42,0.8)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                <h5 style={{ color: "#a5b4fc", fontSize: "0.85rem", textTransform: "uppercase", marginBottom: "10px" }}>
                  Storage &amp; Cold Chain Mandates
                </h5>
                <ul style={{ listStyle: "none", fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "6px", color: "var(--text-muted)" }}>
                  <li>• Safe Storage Temp: <b>{passport.storage_and_logistics_rules.recommended_temp_c}°C</b></li>
                  <li>• Target Relative Humidity: <b>{passport.storage_and_logistics_rules.recommended_rh_pct}%</b></li>
                  <li>• Headspace Atmosphere: <b>{passport.storage_and_logistics_rules.storage_mode}</b></li>
                  <li>• Handling Note: {passport.storage_and_logistics_rules.transit_notes}</li>
                </ul>
              </div>

              <div style={{ background: "rgba(15,23,42,0.8)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                <h5 style={{ color: "#34d399", fontSize: "0.85rem", textTransform: "uppercase", marginBottom: "10px" }}>
                  EPR &amp; Circularity Guidance
                </h5>
                <ul style={{ listStyle: "none", fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "6px", color: "var(--text-muted)" }}>
                  <li>• Degradability: <b>{passport.circularity_and_disposal.degradability_type}</b></li>
                  <li>• Resin Identification: <b>Code #{passport.circularity_and_disposal.resin_code}</b></li>
                  <li>• Disposal Action: {passport.circularity_and_disposal.disposal_instructions}</li>
                  <li>• Carbon Footprint: <b>{passport.circularity_and_disposal.carbon_footprint_g_co2e} g CO₂e/m²</b></li>
                </ul>
              </div>
            </div>

            {/* Supply Chain Timeline */}
            <div>
              <h5 style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 700, marginBottom: "10px" }}>
                Supply Chain Traceability Log
              </h5>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {passport.supply_chain_checkpoints.map((cp, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "8px 14px", borderRadius: "8px", fontSize: "0.8rem" }}>
                    <div>
                      <span style={{ color: "#fff", fontWeight: 600 }}>{cp.stage}</span>
                      <span style={{ color: "var(--text-sub)", marginLeft: "8px" }}>({cp.timestamp})</span>
                    </div>
                    <span style={{ color: cp.status.includes("Pending") ? "var(--text-sub)" : "#34d399", fontWeight: 700 }}>
                      {cp.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
