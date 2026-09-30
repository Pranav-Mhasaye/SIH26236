"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/* ========= LAYER FAMILY COLORS ========= */
const FAMILY_COLORS = {
  PE: "#60a5fa", PP: "#34d399", PET: "#38bdf8", PA: "#a78bfa",
  EVOH: "#fbbf24", BIO: "#86efac", PAPER: "#d97706", ALU: "#94a3b8",
  MET: "#94a3b8", WOVEN: "#a8a29e",
};

/* ========= ROLE DEFINITIONS ========= */
const ROLES = [
  { id: "general", label: "General User", emoji: "👤", desc: "QR scanning, product search, freshness info" },
  { id: "farmer", label: "Farmer / Producer", emoji: "🌾", desc: "Post-harvest handling, crop-specific advice" },
  { id: "logistics", label: "Logistics Manager", emoji: "🚛", desc: "Cold-chain, transport, depot operations" },
  { id: "researcher", label: "Researcher", emoji: "🔬", desc: "Lab specs, dataset updates, peer review" },
];

const INPUT_MODES = [
  { id: "search", label: "Search", icon: "🔍" },
  { id: "category", label: "Browse Categories", icon: "📂" },
  { id: "photo", label: "Photo Capture", icon: "📷" },
  { id: "document", label: "Upload Document", icon: "📄" },
];

/* ========= MAIN APP ========= */
export default function PackPulsePage() {
  const [role, setRole] = useState("general");
  const [inputMode, setInputMode] = useState("search");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [costing, setCosting] = useState(null);
  const [passport, setPassport] = useState(null);
  const [trends, setTrends] = useState([]);
  const [showCookie, setShowCookie] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [costInputs, setCostInputs] = useState({ quantity: 1000, length: 20, width: 15 });
  const searchRef = useRef(null);

  // Load initial data
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { if (Array.isArray(d)) setCategories(d); })
      .catch(() => { });
    fetch(`${API}/api/commodities`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { if (Array.isArray(d)) setCommodities(d); })
      .catch(() => { });
    if (typeof window !== "undefined" && !localStorage.getItem("pp_cookie_consent")) {
      setTimeout(() => setShowCookie(true), 2000);
    }
  }, []);

  // Search handler
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      fetch(`${API}/api/search?q=${encodeURIComponent(query)}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(data => setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []))
        .catch(() => { });
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Get recommendation
  const getRecommendation = useCallback(async (commodityId) => {
    setLoading(true);
    setRecommendation(null);
    setCosting(null);
    setPassport(null);
    setExpandedCard(null);
    try {
      const res = await fetch(`${API}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commodity_id: commodityId, role }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !data.recommendations) throw new Error("Invalid response");
      setRecommendation(data);
      setSelectedCommodity(data.commodity);
      // Load trends for researchers
      if (role === "researcher") {
        fetch(`${API}/api/trends`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => { if (Array.isArray(d)) setTrends(d); }).catch(() => { });
      }
    } catch (e) {
      showToast("Failed to get recommendation. Is the backend running?", "error");
    }
    setLoading(false);
  }, [role]);

  const selectCommodity = (id) => {
    setQuery("");
    setSuggestions([]);
    getRecommendation(id);
  };

  const getCosting = async (materialId) => {
    try {
      const res = await fetch(`${API}/api/costing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material_id: materialId,
          pack_g: selectedCommodity?.pack_g || 500,
          quantity: costInputs.quantity,
          pack_length_cm: costInputs.length,
          pack_width_cm: costInputs.width,
        }),
      });
      setCosting(await res.json());
    } catch (e) {
      showToast("Costing calculation failed", "error");
    }
  };

  const generatePassport = async (materialId) => {
    try {
      const res = await fetch(`${API}/api/passport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodity_id: selectedCommodity?.id,
          material_id: materialId,
        }),
      });
      setPassport(await res.json());
      showToast("Digital Packaging Passport generated!", "success");
    } catch (e) {
      showToast("Passport generation failed", "error");
    }
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const goBack = () => {
    setRecommendation(null);
    setSelectedCommodity(null);
    setCosting(null);
    setPassport(null);
    setExpandedCard(null);
  };

  const filteredCommodities = activeCategory
    ? commodities.filter(c => c.category === activeCategory)
    : commodities;

  /* ========= RENDER ========= */
  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); goBack(); }}>
            <span className="brand-dot" />PackPulse
          </a>
          <nav className="header-nav">
            <a className="nav-link active" href="#">Recommend</a>
            <a className="nav-link" href="#" onClick={e => { e.preventDefault(); if (recommendation) { document.querySelector('.costing-section')?.scrollIntoView({ behavior: 'smooth' }); } }}>Costing</a>
            <a className="nav-link" href="#" onClick={e => { e.preventDefault(); if (passport) { document.querySelector('.passport-section')?.scrollIntoView({ behavior: 'smooth' }); } }}>Passport</a>
          </nav>
        </div>
      </header>

      {/* Role Selector */}
      <div className="role-bar">
        {ROLES.map(r => (
          <button key={r.id} className={`role-btn ${role === r.id ? "active" : ""}`}
            onClick={() => { setRole(r.id); if (selectedCommodity) getRecommendation(selectedCommodity.id); }}
            title={r.desc}>
            <span className="emoji">{r.emoji}</span> {r.label}
          </button>
        ))}
      </div>

      <main className="container">
        {!recommendation && !loading ? (
          /* ========= HOME / SEARCH ========= */
          <>
            <section className="hero animate-in">
              <div className="hero-badge"><span className="dot" /> Ministry of Food Processing Industries</div>
              <h1>Intelligent packaging<br /><em>recommendations</em></h1>
              <p className="hero-sub">
                Select your food commodity and get scientifically-grounded packaging material recommendations
                with barrier specs, cost analysis, and sustainability scores.
              </p>

              {/* Input Mode Tabs */}
              <div className="input-modes">
                {INPUT_MODES.map(m => (
                  <button key={m.id} className={`mode-tab ${inputMode === m.id ? "active" : ""}`}
                    onClick={() => setInputMode(m.id)}>
                    <span className="icon">{m.icon}</span> {m.label}
                  </button>
                ))}
              </div>

              {/* Search Mode */}
              {inputMode === "search" && (
                <div className="search-section animate-in stagger-1" style={{ marginTop: 24 }}>
                  <div className="search-row">
                    <input ref={searchRef} className="search-input" type="search"
                      placeholder='Search "tomato", "आलू", "chips", "achar"...'
                      value={query} onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && suggestions[0]) selectCommodity(suggestions[0].commodity.id); }}
                    />
                    <button className="search-btn" onClick={() => { if (suggestions[0]) selectCommodity(suggestions[0].commodity.id); }}>
                      Search
                    </button>
                  </div>
                  {suggestions.length > 0 && (
                    <div className="suggestions animate-in">
                      {suggestions.map(s => (
                        <div key={s.commodity.id} className="suggestion-item" onClick={() => selectCommodity(s.commodity.id)}>
                          <div>
                            <div className="name">{s.commodity.name}</div>
                            <div className="category">{s.commodity.category}</div>
                          </div>
                          <div className="hindi">{s.commodity.name_hi}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Photo Mode */}
              {inputMode === "photo" && (
                <div className="search-section animate-in stagger-1" style={{ marginTop: 24 }}>
                  <div className="upload-zone" onClick={() => showToast("Camera simulation — select a commodity from search or categories", "info")}>
                    <div className="icon">📷</div>
                    <div className="text">Tap to capture or upload a photo of your food product</div>
                    <div className="hint">AI will identify the commodity and suggest packaging</div>
                  </div>
                </div>
              )}

              {/* Document Mode */}
              {inputMode === "document" && (
                <div className="search-section animate-in stagger-1" style={{ marginTop: 24 }}>
                  <div className="upload-zone" onClick={() => showToast("Document upload — for the prototype, use search or categories", "info")}>
                    <div className="icon">📄</div>
                    <div className="text">Upload a PDF or CSV with product specifications</div>
                    <div className="hint">We'll extract moisture, fat, pH, respiration rate, and storage conditions automatically</div>
                  </div>
                </div>
              )}
            </section>

            {/* Category Browser */}
            {(inputMode === "category" || inputMode === "search") && (
              <section className="animate-in stagger-2">
                <div className="categories">
                  <button className={`cat-chip ${!activeCategory ? "active" : ""}`}
                    onClick={() => setActiveCategory(null)}>All</button>
                  {categories.map(cat => (
                    <button key={cat.name} className={`cat-chip ${activeCategory === cat.name ? "active" : ""}`}
                      onClick={() => setActiveCategory(cat.name === activeCategory ? null : cat.name)}>
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                </div>
                <div className="commodity-grid">
                  {filteredCommodities.map(c => (
                    <div key={c.id} className="commodity-card" onClick={() => selectCommodity(c.id)}>
                      <div className="name">{c.name}</div>
                      <div className="name-hi">{c.name_hi}</div>
                      <div className="meta">
                        <span>{c.storage}</span>
                        <span>{c.shelf_life}d shelf life</span>
                        <span>{c.moisture}% moisture</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : loading ? (
          /* ========= LOADING ========= */
          <div className="loading animate-in">
            <div className="spinner" />
            Analyzing food properties and matching packaging structures...
          </div>
        ) : recommendation ? (
          /* ========= RESULTS ========= */
          <section className="results-section animate-in">
            <div className="results-header">
              <div>
                <button className="back-btn" onClick={goBack}>← Back to search</button>
                <h2 style={{ marginTop: 16 }}>
                  Packaging for <em>{recommendation.commodity.name}</em>
                </h2>
                <div className="results-meta">
                  <div className="meta-item">
                    <div className="label">Shelf Life Target</div>
                    <div className="value">{recommendation.commodity.shelf_life}<small>days</small></div>
                  </div>
                  <div className="meta-item">
                    <div className="label">Storage</div>
                    <div className="value" style={{ fontSize: 22 }}>{recommendation.commodity.storage} @ {recommendation.commodity.temp}°C</div>
                  </div>
                  <div className="meta-item">
                    <div className="label">Mode</div>
                    <div className="value" style={{ fontSize: 18 }}>{recommendation.commodity.mode_label}</div>
                  </div>
                </div>
                {recommendation.commodity.map_target && (
                  <div style={{ marginTop: 12 }}>
                    <span className="spec-badge blue">MAP Target: O₂ {recommendation.commodity.map_target.o2}% / CO₂ {recommendation.commodity.map_target.co2}% / N₂ {recommendation.commodity.map_target.n2}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendation Cards */}
            <div className="rec-list">
              {(recommendation.recommendations || []).map((rec, i) => (
                <div key={rec.material_id}>
                  <div className={`rec-card ${i === 0 ? "best" : ""} animate-in stagger-${i + 1}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setExpandedCard(expandedCard === rec.material_id ? null : rec.material_id);
                      if (!costing || costing.material_id !== rec.material_id) getCosting(rec.material_id);
                    }}>
                    <div className="rec-rank">{rec.rank}</div>
                    <div className="rec-body">
                      <h3>{rec.material_name}</h3>
                      <div className="family">{rec.family} — {rec.layers_desc}</div>
                      <p className="explanation">{rec.explanation}</p>
                      <div className="rec-specs">
                        <span className="spec-badge">OTR {rec.otr < 1 ? rec.otr.toFixed(2) : rec.otr < 100 ? rec.otr.toFixed(1) : Math.round(rec.otr)} cc/m²·day</span>
                        <span className="spec-badge">WVTR {rec.wvtr < 1 ? rec.wvtr.toFixed(2) : rec.wvtr < 10 ? rec.wvtr.toFixed(1) : Math.round(rec.wvtr)} g/m²·day</span>
                        <span className="spec-badge">{rec.thickness_um} µm</span>
                        <span className="spec-badge">{rec.puncture} puncture</span>
                        <span className={`spec-badge ${rec.recyclability === "recyclable" ? "green" : rec.recyclability === "compostable" ? "green" : rec.recyclability === "not_recyclable" ? "red" : "amber"}`}>
                          {rec.recyclability === "recyclable" ? "♻️ Recyclable" : rec.recyclability === "compostable" ? "🌱 Compostable" : rec.recyclability === "not_recyclable" ? "⚠️ MLP" : "🔄 " + rec.recyclability}
                        </span>
                        {rec.light_barrier > 0.7 && <span className="spec-badge amber">🌑 Light barrier</span>}
                        {rec.map_suitable && <span className="spec-badge blue">MAP suitable</span>}
                      </div>

                      {/* Role-specific notes */}
                      {rec.farmer_note && (
                        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 14, color: "#166534" }}>
                          🌾 <strong>Farmer Note:</strong> {rec.farmer_note}
                        </div>
                      )}
                      {rec.logistics_note && (
                        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 14, color: "#1e40af" }}>
                          🚛 <strong>Logistics Note:</strong> {rec.logistics_note}
                        </div>
                      )}

                      {/* Score breakdown */}
                      <div className="score-bars">
                        {[
                          { label: "Technical (40%)", key: "technical" },
                          { label: "Shelf Life (25%)", key: "shelf_life" },
                          { label: "Cost (15%)", key: "cost" },
                          { label: "Sustainability (10%)", key: "sustainability" },
                          { label: "Transport (10%)", key: "transport" },
                        ].map(s => (
                          <div key={s.key} className="score-row">
                            <span className="label">{s.label}</span>
                            <div className="bar"><div className="bar-fill" style={{ width: `${rec.scores[s.key]}%` }} /></div>
                            <span className="val">{Math.round(rec.scores[s.key])}</span>
                          </div>
                        ))}
                      </div>

                      {/* Sources */}
                      <div style={{ marginTop: 12, fontSize: 12, color: "#888" }}>
                        Sources: {rec.sources?.join(" · ")}
                      </div>

                      {/* Cautions */}
                      {rec.cautions?.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 13, color: "#dc2626" }}>
                          ⚠️ {rec.cautions.join(" ")}
                        </div>
                      )}
                    </div>
                    <div className="rec-score">
                      <div className="number">{rec.total_score}</div>
                      <div className="unit">/ 100</div>
                    </div>
                  </div>

                  {/* Expanded: Laminate Visualizer */}
                  {expandedCard === rec.material_id && (
                    <div className="laminate-section animate-in">
                      <div className="laminate-title">Laminate Structure — {rec.layers_desc}</div>
                      <div className="laminate-env"><b>Outside</b> <span>Ambient atmosphere</span></div>
                      <div className="laminate-layers">
                        {rec.layers?.map((layer, li) => (
                          <div key={li} className="layer-bar"
                            style={{ "--layer-color": FAMILY_COLORS[layer.family] || "#888", minHeight: Math.max(36, 20 + Math.sqrt(layer.um) * 5) }}>
                            <div className="layer-info">
                              <span className="layer-name">{layer.name}</span>
                              <span className="layer-um">{layer.um} µm</span>
                              <span className="layer-role">{layer.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="laminate-env" style={{ paddingTop: 8 }}><b>Food side</b>
                        <span>OTR: {rec.otr < 1 ? rec.otr.toFixed(2) : Math.round(rec.otr)} cc/m²·day · WVTR: {rec.wvtr < 1 ? rec.wvtr.toFixed(2) : rec.wvtr.toFixed(1)} g/m²·day</span>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                        <button className="btn-primary" onClick={(e) => { e.stopPropagation(); getCosting(rec.material_id); document.querySelector('.costing-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
                          💰 Calculate Cost
                        </button>
                        <button className="btn-outline" onClick={(e) => { e.stopPropagation(); generatePassport(rec.material_id); }}>
                          📱 Generate QR Passport
                        </button>
                      </div>

                      {/* Researcher test methods */}
                      {rec.test_methods && (
                        <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: "#faf5ff", border: "1px solid #e9d5ff" }}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🔬 ASTM Test Methods</div>
                          {rec.test_methods.map((tm, ti) => (
                            <div key={ti} style={{ fontSize: 13, color: "#6b21a8", marginBottom: 4 }}>
                              <strong>{tm.property}</strong>: {tm.method} at {tm.conditions}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Costing Section */}
            {costing && (
              <div className="costing-section animate-in">
                <h3>💰 Cost Analysis — {costing.material_name}</h3>
                <div className="cost-inputs">
                  <div className="cost-field">
                    <label>Order Quantity (pouches)</label>
                    <input type="number" value={costInputs.quantity}
                      onChange={e => { setCostInputs(p => ({ ...p, quantity: parseInt(e.target.value) || 1000 })); }}
                      onBlur={() => getCosting(costing.material_id)} />
                  </div>
                  <div className="cost-field">
                    <label>Pouch Length (cm)</label>
                    <input type="number" value={costInputs.length}
                      onChange={e => setCostInputs(p => ({ ...p, length: parseInt(e.target.value) || 20 }))}
                      onBlur={() => getCosting(costing.material_id)} />
                  </div>
                  <div className="cost-field">
                    <label>Pouch Width (cm)</label>
                    <input type="number" value={costInputs.width}
                      onChange={e => setCostInputs(p => ({ ...p, width: parseInt(e.target.value) || 15 }))}
                      onBlur={() => getCosting(costing.material_id)} />
                  </div>
                </div>
                <div className="cost-breakdown">
                  <div className="cost-card">
                    <div className="label">Material Cost / Pouch</div>
                    <div className="amount">₹{costing.breakdown.material_cost.toFixed(2)}</div>
                  </div>
                  <div className="cost-card">
                    <div className="label">Conversion Cost / Pouch</div>
                    <div className="amount">₹{costing.breakdown.conversion_cost.toFixed(2)}</div>
                  </div>
                  <div className="cost-card highlight">
                    <div className="label">Total Cost / Pouch</div>
                    <div className="amount">₹{costing.breakdown.total_per_pouch.toFixed(2)}</div>
                  </div>
                  <div className="cost-card">
                    <div className="label">Total Order Cost</div>
                    <div className="amount">₹{Number(costing.breakdown.total_order).toLocaleString("en-IN")}<small> for {costing.quantity} pouches</small></div>
                  </div>
                  <div className="cost-card eco">
                    <div className="label">CO₂ per Pouch</div>
                    <div className="amount">{costing.co2_per_pouch_g.toFixed(1)}<small> g CO₂e</small></div>
                  </div>
                  <div className="cost-card eco">
                    <div className="label">Total Carbon Footprint</div>
                    <div className="amount">{costing.co2_total_kg}<small> kg CO₂e</small></div>
                  </div>
                </div>

                {/* Polymer benchmark table */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Current Polymer Benchmark Prices (₹/kg, India mid-2026)
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {Object.entries(costing.polymer_benchmarks).map(([k, v]) => (
                      <span key={k} className="spec-badge">
                        {k}: ₹{v}/kg
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Passport Section */}
            {passport && (
              <div className="passport-section animate-in">
                <div className="passport-header">
                  <div>
                    <div className="passport-id"><span className="prefix">DPP</span>-{passport.passport_id.slice(4)}</div>
                    <div style={{ fontSize: 14, color: "#888", marginTop: 4 }}>Digital Packaging Passport</div>
                    <div className="verified-badge">Verified by PackPulse</div>
                  </div>
                  {passport.qr_base64 && (
                    <div className="passport-qr">
                      <img src={`data:image/png;base64,${passport.qr_base64}`} alt="QR Code" />
                    </div>
                  )}
                </div>
                <div className="passport-grid">
                  <div className="passport-cell">
                    <div className="label">Commodity</div>
                    <div className="value">{passport.commodity}</div>
                  </div>
                  <div className="passport-cell">
                    <div className="label">Material</div>
                    <div className="value" style={{ fontSize: 14 }}>{passport.material}</div>
                  </div>
                  <div className="passport-cell">
                    <div className="label">Shelf Life</div>
                    <div className="value">{passport.shelf_life_days}d</div>
                  </div>
                  <div className="passport-cell">
                    <div className="label">Storage</div>
                    <div className="value">{passport.storage} @ {passport.temp_c}°C</div>
                  </div>
                </div>
                <div className="passport-grid" style={{ borderBottom: "none" }}>
                  <div className="passport-cell">
                    <div className="label">OTR</div>
                    <div className="value">{passport.otr < 1 ? passport.otr.toFixed(2) : Math.round(passport.otr)}</div>
                  </div>
                  <div className="passport-cell">
                    <div className="label">WVTR</div>
                    <div className="value">{passport.wvtr < 1 ? passport.wvtr.toFixed(2) : passport.wvtr.toFixed(1)}</div>
                  </div>
                  <div className="passport-cell">
                    <div className="label">Thickness</div>
                    <div className="value">{passport.thickness_um} µm</div>
                  </div>
                  <div className="passport-cell">
                    <div className="label">Recyclability</div>
                    <div className="value" style={{ fontSize: 14 }}>{passport.recycle_note}</div>
                  </div>
                </div>
                <div style={{ padding: "16px 0", fontSize: 12, color: "#888" }}>
                  Sources: {passport.sources?.join(" · ")} | Batch: {passport.batch_date} | Created: {new Date(passport.created_at).toLocaleString()}
                </div>
              </div>
            )}

            {/* Researcher Panel */}
            {role === "researcher" && (
              <div className="research-panel animate-in">
                <h3>🔬 Scientific Trends & Dataset Updates</h3>
                <p style={{ fontSize: 15, color: "#555", marginBottom: 16 }}>
                  Recent publications from Europe PMC and open-access journals relevant to food packaging materials.
                </p>
                {trends.map((t, i) => (
                  <div key={i} className="trend-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div className="title">{t.title}</div>
                      <span className={`relevance-tag ${t.relevance}`}>{t.relevance}</span>
                    </div>
                    <div className="journal">{t.journal} ({t.year}) — DOI: {t.doi}</div>
                    <div className="summary">{t.summary}</div>
                    <button className="btn-outline" style={{ marginTop: 10, padding: "6px 14px", fontSize: 13 }}
                      onClick={() => showToast("Nominated for peer review! 3 researcher approvals needed.", "success")}>
                      📋 Nominate for Dataset
                    </button>
                  </div>
                ))}

                {/* Submit new material */}
                <div className="submit-form">
                  <h4>📝 Submit New Material for Peer Review</h4>
                  <p style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>
                    New materials require DOI citation and approval from 3 independent researchers before being added to the dataset.
                  </p>
                  <div className="form-grid">
                    <div className="form-field"><label>Material Name</label><input placeholder="e.g. Chitosan-nanocellulose film" /></div>
                    <div className="form-field"><label>Family</label><input placeholder="e.g. Compostable" /></div>
                    <div className="form-field"><label>OTR (cc/m²·day)</label><input type="number" placeholder="320" /></div>
                    <div className="form-field"><label>WVTR (g/m²·day)</label><input type="number" placeholder="15" /></div>
                    <div className="form-field"><label>Thickness (µm)</label><input type="number" placeholder="30" /></div>
                    <div className="form-field"><label>DOI / Citation</label><input placeholder="10.1016/j.foodchem.2026...." /></div>
                  </div>
                  <button className="btn-primary" style={{ marginTop: 16 }}
                    onClick={() => showToast("Submitted for peer review! Awaiting 3 approvals.", "success")}>
                    Submit for Review
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-text">
            <strong>PackPulse</strong> — SIH 2026 · PS 26236 · Ministry of Food Processing Industries
          </div>
          <div className="footer-sources">
            <span>NIFTEM-T</span>
            <span>CSIR-CFTRI</span>
            <span>FAO</span>
            <span>FSSAI</span>
            <span>ASTM</span>
          </div>
        </div>
      </footer>

      {/* Cookie Consent */}
      <div className={`cookie-bar ${showCookie ? "show" : ""}`}>
        <div className="cookie-inner">
          <div className="cookie-text">
            🍪 PackPulse uses cookies to personalize recommendations based on your role and search history.
            Your data helps improve our ML-based curation pipeline.{" "}
            <a href="#">Learn more</a>
          </div>
          <div className="cookie-btns">
            <button className="cookie-btn accept" onClick={() => { localStorage.setItem("pp_cookie_consent", "accepted"); setShowCookie(false); showToast("Cookies accepted — personalization enabled", "success"); }}>
              Accept
            </button>
            <button className="cookie-btn decline" onClick={() => { localStorage.setItem("pp_cookie_consent", "declined"); setShowCookie(false); }}>
              Decline
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast show ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
