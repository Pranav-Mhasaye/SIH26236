"use client";

import React, { useState, useEffect, useRef } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function InputModes({
  currentRole,
  onSelectCommodity,
  onExtractCustomParams,
  lang
}) {
  const [activeTab, setActiveTab] = useState("search"); // 'search', 'photo', 'category', 'document'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [correctedQuery, setCorrectedQuery] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [commoditiesList, setCommoditiesList] = useState([]);
  
  // Photo capture states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [visionResult, setVisionResult] = useState(null);

  // Document upload states
  const [docFile, setDocFile] = useState(null);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [docExtractedData, setDocExtractedData] = useState(null);

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Load all commodities and categories on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/commodities`)
      .then((res) => res.json())
      .then((data) => {
        setCommoditiesList(data);
        const cats = Array.from(new Set(data.map((c) => c.category))).filter(Boolean);
        setCategories(cats);
      })
      .catch((err) => console.error("Failed to load commodities", err));
  }, []);

  // Debounced Search API query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCorrectedQuery(null);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`${API_BASE}/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.results || []);
          setCorrectedQuery(data.corrected_query || null);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Photo Upload
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setIsClassifying(true);
    setVisionResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/vision/classify`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setVisionResult(data);
      setIsClassifying(false);
      if (data.commodity_profile) {
        onSelectCommodity(data.commodity_profile);
      }
    } catch (e) {
      console.error(e);
      setIsClassifying(false);
    }
  };

  // Handle Document Upload (PDF / CSV)
  const handleDocUpload = async (file) => {
    if (!file) return;
    setDocFile(file);
    setIsExtractingDoc(true);
    setDocExtractedData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/documents/extract`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setDocExtractedData(data);
      setIsExtractingDoc(false);
    } catch (e) {
      console.error(e);
      setIsExtractingDoc(false);
    }
  };

  // Regional quick chip helpers
  const quickPicks = [
    { id: "potato", label: "Aloo / Batata (Potato)" },
    { id: "tomato", label: "Tamatar (Tomato)" },
    { id: "okra", label: "Bhindi (Okra)" },
    { id: "mango", label: "Aam (Mango)" },
    { id: "apple", label: "Seb (Apple)" },
    { id: "banana", label: "Kela (Banana)" },
    { id: "potato-chips", label: "Aloo Chips (Snacks)" },
    { id: "paneer", label: "Fresh Paneer (Dairy)" },
    { id: "spice-powder", label: "Haldi / Mirchi (Spices)" }
  ];

  return (
    <div className="input-tabs-wrapper">
      {/* Tab Switcher Buttons */}
      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === "search" ? "active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          <span>🔍</span>
          <span>Instant Search</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "photo" ? "active" : ""}`}
          onClick={() => setActiveTab("photo")}
        >
          <span>📸</span>
          <span>Photo Scanner</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "category" ? "active" : ""}`}
          onClick={() => setActiveTab("category")}
        >
          <span>🗂️</span>
          <span>Commodity Catalog</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "document" ? "active" : ""}`}
          onClick={() => setActiveTab("document")}
        >
          <span>📄</span>
          <span>Lab Document (PDF/CSV)</span>
        </button>
      </div>

      {/* TAB 1: INSTANT SEARCH */}
      {activeTab === "search" && (
        <div>
          <div className="search-box-card">
            <span style={{ fontSize: "1.2rem", color: "#94a3b8" }}>🔍</span>
            <input
              type="text"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commodity (e.g. Potato, Tamatar, Alphonso Mango, Chips, Paneer, Atta)..."
              autoFocus
            />
            {isSearching && (
              <span style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: 600 }}>
                Searching...
              </span>
            )}

            {/* Dropdown Suggestions */}
            {searchResults.length > 0 && (
              <div className="search-dropdown">
                {correctedQuery && (
                  <div style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#38bdf8", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    ✨ Auto-corrected: <b>&quot;{correctedQuery}&quot;</b>
                  </div>
                )}
                {searchResults.map((item) => {
                  const c = item.commodity;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="sugg-item"
                      onClick={() => {
                        onSelectCommodity(c);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <div>
                        <span className="sugg-name">{c.name}</span>
                        {c.regional_names && c.regional_names[lang] && c.regional_names[lang] !== c.name && (
                          <span style={{ marginLeft: "8px", fontSize: "0.82rem", color: "#94a3b8" }}>
                            ({c.regional_names[lang]})
                          </span>
                        )}
                      </div>
                      <span className="sugg-category">{c.category}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Vernacular Chips */}
          <div className="quick-chips">
            <span className="chip-label">Quick Select:</span>
            {quickPicks.map((qp) => (
              <button
                key={qp.id}
                type="button"
                className="commodity-chip"
                onClick={() => {
                  const found = commoditiesList.find((c) => c.id === qp.id);
                  if (found) onSelectCommodity(found);
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PHOTO SCANNER */}
      {activeTab === "photo" && (
        <div className="glass-card" style={{ padding: "24px" }}>
          <div
            className="upload-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handlePhotoUpload(e.target.files[0])}
            />
            {photoPreview ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Food Sample Preview"
                  style={{ maxHeight: "200px", borderRadius: "12px", border: "1px solid var(--border-glass)" }}
                />
                <span style={{ fontSize: "0.85rem", color: "#34d399", fontWeight: 600 }}>
                  Click to choose a different photo
                </span>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "2.4rem", marginBottom: "8px" }}>📸</div>
                <h4 style={{ color: "#fff", fontWeight: 700, marginBottom: "4px" }}>
                  Upload or Capture Commodity Photo
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Supports JPEG, PNG, WEBP. Analyzed via On-Device Spectral Classifier &amp; Vision Engine.
                </p>
              </div>
            )}
          </div>

          {isClassifying && (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#38bdf8", fontWeight: 600 }}>
              ⚡ Classifying commodity image through multi-tier cascade...
            </div>
          )}

          {visionResult && (
            <div style={{ marginTop: "16px", padding: "14px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#34d399", fontWeight: 700 }}>
                    {visionResult.tier}
                  </span>
                  <h4 style={{ color: "#fff", fontWeight: 800, marginTop: "2px" }}>
                    Detected: {visionResult.commodity_profile?.name || visionResult.commodity_id}
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onSelectCommodity(visionResult.commodity_profile)}
                >
                  Generate Recommendation →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMMODITY CATALOG */}
      {activeTab === "category" && (
        <div>
          <div className="categories-grid">
            {categories.map((cat) => {
              const items = commoditiesList.filter((c) => c.category === cat);
              return (
                <div
                  key={cat}
                  className="category-card"
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                >
                  <div className="category-header">
                    <span className="category-title">{cat}</span>
                    <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 700 }}>
                      {items.length} items
                    </span>
                  </div>
                  <div className="items-pills">
                    {items.slice(0, 5).map((it) => (
                      <span
                        key={it.id}
                        className="item-pill"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCommodity(it);
                        }}
                      >
                        {it.name}
                      </span>
                    ))}
                    {items.length > 5 && (
                      <span className="item-pill" style={{ color: "#38bdf8" }}>
                        +{items.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: LAB DOCUMENT UPLOAD (PDF / CSV) */}
      {activeTab === "document" && (
        <div className="glass-card" style={{ padding: "24px" }}>
          <div
            className="upload-dropzone"
            onClick={() => docInputRef.current?.click()}
          >
            <input
              type="file"
              ref={docInputRef}
              accept=".pdf,.csv,.txt"
              style={{ display: "none" }}
              onChange={(e) => handleDocUpload(e.target.files[0])}
            />
            <div style={{ fontSize: "2.4rem", marginBottom: "8px" }}>📑</div>
            <h4 style={{ color: "#fff", fontWeight: 700, marginBottom: "4px" }}>
              Upload Laboratory Specification Sheet (PDF / CSV)
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Deterministic regex engine extracts moisture, pH, fat/oil, respiration rate, and shelf-life target.
            </p>
            {docFile && (
              <span style={{ display: "inline-block", marginTop: "10px", fontSize: "0.85rem", color: "#38bdf8", fontWeight: 600 }}>
                Selected: {docFile.name}
              </span>
            )}
          </div>

          {isExtractingDoc && (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#38bdf8", fontWeight: 600 }}>
              Parsing document parameters via regex extractor...
            </div>
          )}

          {docExtractedData && (
            <div style={{ marginTop: "18px", padding: "16px", borderRadius: "12px", background: "rgba(15, 23, 42, 0.9)", border: "1px solid var(--border-glass)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <h4 style={{ color: "#fff", fontWeight: 700 }}>
                    Extracted Food Parameters ({docExtractedData.fields_extracted_count} fields detected)
                  </h4>
                  <span style={{ fontSize: "0.78rem", color: "#34d399" }}>
                    Confidence: {Math.round(docExtractedData.confidence * 100)}% • Source: {docExtractedData.format}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onExtractCustomParams(docExtractedData.parameters)}
                >
                  Apply &amp; Recommend →
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                {Object.entries(docExtractedData.parameters).map(([k, v]) => (
                  <div key={k} style={{ background: "rgba(255,255,255,0.04)", padding: "8px 12px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-sub)", textTransform: "uppercase", display: "block" }}>
                      {k}
                    </span>
                    <span style={{ fontSize: "0.95rem", color: "#fff", fontWeight: 700 }}>
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
