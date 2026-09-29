"use client";

import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function CostingModal({ isOpen, onClose, material, packWeightG = 500 }) {
  const [orderQty, setOrderQty] = useState(5000);
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !material) return;

    setLoading(true);
    fetch(`${API_BASE}/api/costing/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        material: material,
        pack_weight_g: packWeightG,
        order_quantity: orderQty
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setCostData(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [isOpen, material, packWeightG, orderQty]);

  if (!isOpen) return null;

  const calc = costData?.calculation;
  const comparative = costData?.comparative_architectures || [];
  const benchmarks = costData?.polymer_market_benchmarks || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#34d399", fontWeight: 700 }}>
              Live Hybrid Costing Engine &amp; Eco-Optimization
            </span>
            <h3>Pouch Economics &amp; Carbon Trade-Off Simulator</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* MOQ Slider Section */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "18px", borderRadius: "14px", border: "1px solid var(--border-glass)", marginBottom: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>
              Batch Production Volume (MOQ Slider):
            </label>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", color: "#34d399", fontWeight: 800 }}>
              {orderQty.toLocaleString("en-IN")} Pouches
            </span>
          </div>

          <input
            type="range"
            min="500"
            max="50000"
            step="500"
            value={orderQty}
            onChange={(e) => setOrderQty(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.75rem", color: "var(--text-sub)" }}>
            <span>500 (Farmer / Pilot Batch)</span>
            <span>5,000 (MSME Standard)</span>
            <span>25,000 (Commercial)</span>
            <span>50,000+ (Industrial Scale)</span>
          </div>

          {calc && (
            <div style={{ marginTop: "12px", display: "flex", gap: "16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <span>Tier: <b style={{ color: "#fff" }}>{calc.moq_tier}</b></span>
              <span>Unit Price: <b style={{ color: "#34d399" }}>₹{calc.cost_breakdown.unit_pouch_price_inr}</b></span>
              <span>Total Batch: <b style={{ color: "#fff" }}>₹{calc.cost_breakdown.total_batch_cost_inr.toLocaleString("en-IN")}</b></span>
              <span>Carbon: <b style={{ color: "#38bdf8" }}>{calc.carbon_breakdown.total_batch_co2e_kg} kg CO₂e</b></span>
            </div>
          )}
        </div>

        {/* 3-WAY COMPARATIVE ARCHITECTURE */}
        <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", marginBottom: "12px" }}>
          3-Way Architecture Trade-Off: Conventional vs Recyclable vs Compostable
        </h4>
        <div style={{ overflowX: "auto", marginBottom: "24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-sub)" }}>
                <th style={{ padding: "10px" }}>Architecture Type</th>
                <th style={{ padding: "10px" }}>Film Structure</th>
                <th style={{ padding: "10px" }}>Unit Price</th>
                <th style={{ padding: "10px" }}>Delta Cost</th>
                <th style={{ padding: "10px" }}>Carbon Footprint</th>
                <th style={{ padding: "10px" }}>Circularity / Recyclability</th>
              </tr>
            </thead>
            <tbody>
              {comparative.map((arch, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "12px 10px", fontWeight: 700, color: "#fff" }}>
                    {arch.label}
                    <div style={{ fontSize: "0.72rem", color: "#34d399" }}>{arch.badge}</div>
                  </td>
                  <td style={{ padding: "12px 10px", fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "#38bdf8" }}>
                    {arch.structure}
                  </td>
                  <td style={{ padding: "12px 10px", fontWeight: 800, color: "#fff" }}>
                    ₹{arch.unit_pouch_price_inr}
                  </td>
                  <td style={{ padding: "12px 10px", color: arch.delta_cost_vs_conventional.includes("+") ? "#f59e0b" : "#34d399", fontWeight: 700 }}>
                    {arch.delta_cost_vs_conventional}
                  </td>
                  <td style={{ padding: "12px 10px", color: "#34d399", fontWeight: 600 }}>
                    {arch.pouch_co2e_grams}g <span style={{ fontSize: "0.7rem", color: "var(--text-sub)" }}>({arch.co2e_saved_grams})</span>
                  </td>
                  <td style={{ padding: "12px 10px", color: "var(--text-muted)" }}>
                    {arch.recyclability}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Polymer Benchmark Rates */}
        <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", marginBottom: "10px" }}>
          Live Indian Polymer Market Benchmark Feeds (₹/kg)
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
          {Object.entries(benchmarks).slice(0, 6).map(([key, bm]) => (
            <div key={key} style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--text-sub)" }}>
                <span>{key}</span>
                <span style={{ color: bm.trend.includes("+") ? "#f43f5e" : "#34d399", fontWeight: 700 }}>{bm.trend}</span>
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                ₹{bm.rate_inr_kg.toFixed(2)} <span style={{ fontSize: "0.72rem", color: "var(--text-sub)" }}>/ kg</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
