"use client";

import React, { useState } from "react";

export default function WalkthroughModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "1. Stakeholder Role-Based Architecture",
      icon: "👥",
      content: (
        <div>
          <p style={{ color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.5" }}>
            PackPulse caters to four distinct personas across the agricultural and food processing supply chain. You can toggle roles anytime using the top navigation bar:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.85rem" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
              <b style={{ color: "#34d399" }}>🔬 Researcher:</b> Laboratory ASTM specs, 3-peer review verification queue, and automated scientific trend monitoring.
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
              <b style={{ color: "#38bdf8" }}>🌾 Farmer / Producer:</b> Post-harvest handling, vernacular regional crop names, and storage condensation warnings.
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
              <b style={{ color: "#f59e0b" }}>🚛 Logistics Manager:</b> Cold-chain transit bounds, road vibration puncture resilience, and depot check-ins.
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
              <b style={{ color: "#a5b4fc" }}>👤 General User:</b> Freshness estimation, photo scanner, and plastic recycling / composting disposal directives.
            </div>
          </div>
        </div>
      )
    },
    {
      title: "2. Multimodal Input Channels",
      icon: "📥",
      content: (
        <div>
          <p style={{ color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.5" }}>
            Four flexible input mechanisms provide seamless data entry for different literacy and operational levels:
          </p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <li>• <b>Instant Search:</b> Handles typos (e.g. &quot;potatto&quot; → Potato) and Indian language aliases (Aloo, Batata, Tamatar, Bhindi, Kela, Seb).</li>
            <li>• <b>Photo Scanner:</b> 3-tier cascade utilizing on-device spectral analysis with cloud vision fallback.</li>
            <li>• <b>Commodity Catalog:</b> 8 visual food categories (Fresh Fruits, Produce, Bakery, Dairy, Meat, Frozen, Grains, Ready-to-Eat).</li>
            <li>• <b>Lab Document Upload:</b> Parses PDF and CSV specification reports with regex parameter extraction.</li>
          </ul>
        </div>
      )
    },
    {
      title: "3. Science-Backed Recommendation & Barrier Physics",
      icon: "🔬",
      content: (
        <div>
          <p style={{ color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.5" }}>
            Rather than generic guess-work, the recommendation engine computes exact physical mass balances:
          </p>
          <div style={{ background: "rgba(15,23,42,0.8)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-glass)", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "10px" }}>
            <span style={{ color: "#34d399", fontWeight: 700, display: "block", marginBottom: "4px" }}>
              Interactive Laminate Stack
            </span>
            Each film structure visualizes real micrometric layers (PE, PP, PET, PA, EVOH, ALU foil, or PLA bio-polymers), calculating individual layer resistance to Oxygen (OTR) and Moisture Vapor (WVTR).
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Fresh respiring produce triggers breathable films (micro-perforated or vented) with Modified Atmosphere Packaging (MAP) target gas compositions.
          </p>
        </div>
      )
    },
    {
      title: "4. Green Innovation: Eco-Friendliness & Carbon Trade-Off",
      icon: "🌱",
      content: (
        <div>
          <p style={{ color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.5" }}>
            Every recommendation evaluates environmental impact alongside mechanical barrier performance:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <div>• <b>Carbon Footprint (g CO₂e):</b> Exact cradle-to-gate emissions calculated per pouch and per square meter.</div>
            <div>• <b>The Eco-Upgrade Banner:</b> Recommends switching from non-recyclable Multilayer Plastic (MLP) to recyclable mono-materials (e.g. MDO-PE/EVOH) or certified compostable structures, showing the exact delta cost (+₹X/pouch) and carbon emissions saved.</div>
            <div>• <b>FSSAI 2025 Compliance:</b> Flags non-compliant recycled plastics under March 2025 directives.</div>
          </div>
        </div>
      )
    },
    {
      title: "5. Digital Packaging Passport & 3-Peer Review",
      icon: "📱",
      content: (
        <div>
          <p style={{ color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.5" }}>
            Completing the lifecycle loop with traceability and continuous scientific evolution:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <div>• <b>Digital Passport (QR):</b> Generates a scannable passport detailing batch expiration, temperature alert thresholds, and EPR recycling directives.</div>
            <div>• <b>Democratic 3-Peer Review:</b> Researchers can add new materials with DOI citations. When verified by 3 independent peer researchers, it merges directly into the live master dataset.</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.6rem" }}>{steps[currentStep].icon}</span>
            <div>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#34d399", fontWeight: 700 }}>
                Step {currentStep + 1} of {steps.length} • Portal Walkthrough
              </span>
              <h3>{steps[currentStep].title}</h3>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Step Content */}
        <div style={{ minHeight: "220px", marginBottom: "24px" }}>
          {steps[currentStep].content}
        </div>

        {/* Pagination & Next/Prev */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-glass)", paddingTop: "18px" }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
            style={{ opacity: currentStep === 0 ? 0.4 : 1 }}
          >
            ← Previous
          </button>

          {/* Step Dots */}
          <div style={{ display: "flex", gap: "6px" }}>
            {steps.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setCurrentStep(idx)}
                style={{
                  width: idx === currentStep ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: idx === currentStep ? "#10b981" : "rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setCurrentStep((p) => Math.min(steps.length - 1, p + 1))}
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={onClose}
            >
              Start Using PackPulse ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
