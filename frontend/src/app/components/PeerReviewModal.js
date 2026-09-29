"use client";

import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function PeerReviewModal({ isOpen, onClose }) {
  const [subTab, setSubTab] = useState("queue"); // 'queue', 'submit', 'trends'
  const [queue, setQueue] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(null);

  // New submission form states
  const [formData, setFormData] = useState({
    material_name: "",
    structure: "",
    thickness_um: 50,
    otr: 5.0,
    wvtr: 2.0,
    degradability_type: "Compostable Bio-Material",
    carbon_footprint_g_m2: 50.0,
    cost_m2: 15.0,
    citation_title: "",
    journal: "Food Packaging & Shelf Life",
    doi: "https://doi.org/10.1016/j.fpsl"
  });

  const loadQueue = () => {
    fetch(`${API_BASE}/api/peer-review/queue`)
      .then((res) => res.json())
      .then((data) => setQueue(data))
      .catch((e) => console.error(e));
  };

  const loadTrends = () => {
    fetch(`${API_BASE}/api/peer-review/trends`)
      .then((res) => res.json())
      .then((data) => setTrends(data))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    if (!isOpen) return;
    loadQueue();
    loadTrends();
  }, [isOpen]);

  const handleVote = async (submissionId, decision) => {
    try {
      const res = await fetch(`${API_BASE}/api/peer-review/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          reviewer_name: "Dr. Peer Reviewer",
          institution: "National Research Laboratory",
          decision: decision,
          comment: "Verified against ASTM barrier standards."
        })
      });
      const data = await res.json();
      setVoteSuccess(`Vote recorded: ${data.current_approvals}/3 approvals. ${data.merged_to_master_dataset ? "🎉 Merged into Master Dataset live!" : ""}`);
      loadQueue();
    } catch (e) {
      alert("Error casting review vote: " + e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/peer-review/submit?researcher_name=Dr.+Lead+Scientist&institution=NIFTEM+Packaging+Lab`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      await res.json();
      setLoading(false);
      alert("Material submitted to Peer-Review Queue!");
      setSubTab("queue");
      loadQueue();
    } catch (err) {
      setLoading(false);
      alert("Submission failed: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "900px" }}>
        <div className="modal-header">
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#a5b4fc", fontWeight: 700 }}>
              Democratic Scientific Governance &amp; Literature Crawler
            </span>
            <h3>Peer-Review Verification &amp; Scientific Trends</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "12px", marginBottom: "20px" }}>
          <button
            type="button"
            className={`tab-btn ${subTab === "queue" ? "active" : ""}`}
            onClick={() => setSubTab("queue")}
          >
            <span>⚖️</span>
            <span>Verification Queue ({queue.length})</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${subTab === "submit" ? "active" : ""}`}
            onClick={() => setSubTab("submit")}
          >
            <span>➕</span>
            <span>Submit New Material</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${subTab === "trends" ? "active" : ""}`}
            onClick={() => setSubTab("trends")}
          >
            <span>📡</span>
            <span>Scientific Trends Crawler</span>
          </button>
        </div>

        {voteSuccess && (
          <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", color: "#34d399", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.88rem" }}>
            {voteSuccess}
          </div>
        )}

        {/* TAB 1: VERIFICATION QUEUE */}
        {subTab === "queue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Under the <b>3-Researcher Consensus Protocol</b>, new packaging structures require 3 independent peer approvals before merging directly into the live master dataset:
            </p>

            {queue.map((sub) => (
              <div key={sub.id} style={{ background: "rgba(15,23,42,0.85)", border: "1px solid var(--border-glass)", borderRadius: "14px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                      {sub.id} • Submitted by {sub.submitted_by} ({sub.institution})
                    </span>
                    <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                      {sub.material_name}
                    </h4>
                    <p style={{ fontSize: "0.82rem", color: "#a5b4fc", fontFamily: "var(--font-mono)" }}>
                      {sub.structure} ({sub.thickness_um} µm)
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: sub.status === "approved" ? "#34d399" : "#f59e0b" }}>
                      {sub.approvals_count} / {sub.threshold_required} Approvals
                    </span>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-sub)" }}>
                      {sub.status === "approved" ? "Live in Master Dataset ✓" : "Pending 3-Peer Consensus"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "18px", fontSize: "0.8rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", margin: "10px 0" }}>
                  <span>OTR: <b>{sub.otr} cc/m²·day</b></span>
                  <span>WVTR: <b>{sub.wvtr} g/m²·day</b></span>
                  <span>Carbon: <b>{sub.carbon_footprint_g_m2} g CO₂e/m²</b></span>
                  <span>Degradability: <b>{sub.degradability_type}</b></span>
                </div>

                <div style={{ fontSize: "0.78rem", color: "var(--text-sub)", marginBottom: "12px" }}>
                  <b>Source Citation:</b> <i>&quot;{sub.citation?.title}&quot;</i>, {sub.citation?.journal} ({sub.citation?.year}).{" "}
                  <a href={sub.citation?.doi} target="_blank" rel="noreferrer" style={{ color: "#38bdf8" }}>
                    View DOI/URL ↗
                  </a>
                </div>

                {/* Reviewer Commentary */}
                {sub.approvals?.length > 0 && (
                  <div style={{ marginBottom: "12px", borderLeft: "2px solid #818cf8", paddingLeft: "10px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <b>Peer Reviews:</b>
                    {sub.approvals.map((ap, idx) => (
                      <div key={idx} style={{ marginTop: "2px" }}>
                        ✓ <b>{ap.reviewer}:</b> &quot;{ap.comment}&quot;
                      </div>
                    ))}
                  </div>
                )}

                {sub.status !== "approved" && (
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ color: "#f43f5e" }}
                      onClick={() => handleVote(sub.id, "Reject")}
                    >
                      Reject Submission
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleVote(sub.id, "Approve")}
                    >
                      Verify &amp; Approve (+1)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: SUBMIT NEW RESEARCH */}
        {subTab === "submit" && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Material Formulation Name:
                </label>
                <input
                  type="text"
                  required
                  className="search-input"
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", borderRadius: "8px" }}
                  value={formData.material_name}
                  onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                  placeholder="e.g. Mycelium Agri-Waste Tray"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Layer Structure Breakdown:
                </label>
                <input
                  type="text"
                  required
                  className="search-input"
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", borderRadius: "8px" }}
                  value={formData.structure}
                  onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                  placeholder="e.g. PLA 30 µm / Bio-Barrier 5 µm"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  OTR (cc/m²·day per ASTM D3985):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="search-input"
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", borderRadius: "8px" }}
                  value={formData.otr}
                  onChange={(e) => setFormData({ ...formData, otr: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  WVTR (g/m²·day per ASTM F1249):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="search-input"
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", borderRadius: "8px" }}
                  value={formData.wvtr}
                  onChange={(e) => setFormData({ ...formData, wvtr: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Publication Citation Title:
                </label>
                <input
                  type="text"
                  required
                  className="search-input"
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", borderRadius: "8px" }}
                  value={formData.citation_title}
                  onChange={(e) => setFormData({ ...formData, citation_title: e.target.value })}
                  placeholder="e.g. Synthesis and barrier evaluation of bio-composite film"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Journal / DOI Link:
                </label>
                <input
                  type="text"
                  required
                  className="search-input"
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", borderRadius: "8px" }}
                  value={formData.doi}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                  placeholder="https://doi.org/..."
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: "flex-end", marginTop: "10px" }}>
              {loading ? "Submitting..." : "Submit for 3-Peer Verification →"}
            </button>
          </form>
        )}

        {/* TAB 3: SCIENTIFIC TRENDS CRAWLER */}
        {subTab === "trends" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Automated crawler streams literature from <b>Europe PMC</b> and open food packaging databases. Researchers can nominate candidate materials into the verification queue:
            </p>

            {trends.map((tr) => (
              <div key={tr.id} style={{ background: "rgba(15,23,42,0.7)", border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#34d399", fontWeight: 700, textTransform: "uppercase" }}>
                      {tr.database_source}
                    </span>
                    <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "0.98rem", marginTop: "2px" }}>
                      {tr.title}
                    </h4>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-sub)" }}>
                      {tr.authors} • {tr.journal} ({tr.year})
                    </span>
                  </div>
                  <a
                    href={tr.doi}
                    target="_blank"
                    rel="noreferrer"
                    className="source-citation-badge"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    DOI Link ↗
                  </a>
                </div>

                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "8px 0" }}>
                  {tr.abstract}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "0.76rem", color: "#38bdf8" }}>
                    Extracted: OTR {tr.extracted_specs?.otr} • WVTR {tr.extracted_specs?.wvtr} • {tr.extracted_specs?.degradability_type}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: "0.78rem", padding: "6px 12px" }}
                    onClick={() => {
                      setFormData({
                        material_name: tr.extracted_specs?.material_name || tr.title.slice(0, 30),
                        structure: tr.extracted_specs?.structure || "Bio-Composite Film",
                        thickness_um: 50,
                        otr: tr.extracted_specs?.otr || 5.0,
                        wvtr: tr.extracted_specs?.wvtr || 2.0,
                        degradability_type: tr.extracted_specs?.degradability_type || "Compostable",
                        carbon_footprint_g_m2: tr.extracted_specs?.carbon_footprint_g_m2 || 50,
                        cost_m2: tr.extracted_specs?.cost_m2 || 14.0,
                        citation_title: tr.title,
                        journal: tr.journal,
                        doi: tr.doi
                      });
                      setSubTab("submit");
                    }}
                  >
                    Nominate for Peer Review ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
