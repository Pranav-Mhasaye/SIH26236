"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import InputModes from "./components/InputModes";
import ResultsView from "./components/ResultsView";
import RoleInsightCard from "./components/RoleInsightCard";
import CostingModal from "./components/CostingModal";
import PassportModal from "./components/PassportModal";
import WalkthroughModal from "./components/WalkthroughModal";
import CitationsModal from "./components/CitationsModal";
import PeerReviewModal from "./components/PeerReviewModal";
import CookieConsentBanner from "./components/CookieConsentBanner";

const API_BASE = "http://127.0.0.1:8000";

export default function Home() {
  const [currentRole, setCurrentRole] = useState("farmer"); // researcher, farmer, logistics, general
  const [currentLang, setCurrentLang] = useState("en");
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [recommendationData, setRecommendationData] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [sessionId, setSessionId] = useState("session-demo");

  // Modal States
  const [isCostingOpen, setIsCostingOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [isCitationsOpen, setIsCitationsOpen] = useState(false);
  const [isPeerReviewOpen, setIsPeerReviewOpen] = useState(false);
  const [activeCitationDetail, setActiveCitationDetail] = useState(null);
  const [modalMaterial, setModalMaterial] = useState(null);

  // Initialize session ID
  useEffect(() => {
    try {
      let s = sessionStorage.getItem("packpulse_sid");
      if (!s) {
        s = "sid-" + Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem("packpulse_sid", s);
      }
      setSessionId(s);
    } catch {}
  }, []);

  // Health check API
  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "healthy") setApiOnline(true);
      })
      .catch(() => setApiOnline(false));
  }, []);

  // Fetch recommendation function
  const fetchRecommendation = useCallback((commodityId, customParams = null, role = currentRole) => {
    setLoadingRecommendation(true);
    fetch(`${API_BASE}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commodity_id: commodityId,
        custom_params: customParams,
        user_role: role,
        session_id: sessionId
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setRecommendationData(data);
        if (data.top_recommendations?.[0]) {
          setModalMaterial(data.top_recommendations[0].material);
        }
        setLoadingRecommendation(false);
      })
      .catch((err) => {
        console.error("Recommendation error:", err);
        setLoadingRecommendation(false);
      });
  }, [currentRole, sessionId]);

  // Initial demo load: Default to Tomato (a premier horticulture crop under MoFPI)
  useEffect(() => {
    fetch(`${API_BASE}/api/commodities/tomato`)
      .then((res) => res.json())
      .then((comm) => {
        setSelectedCommodity(comm);
        fetchRecommendation("tomato", null, currentRole);
      })
      .catch(() => {});
  }, [fetchRecommendation, currentRole]);

  // Handle role switch from top bar
  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    if (selectedCommodity) {
      fetchRecommendation(selectedCommodity.id, null, newRole);
    }
  };

  // Handle commodity selection from input modes
  const handleSelectCommodity = (comm) => {
    if (!comm) return;
    setSelectedCommodity(comm);
    fetchRecommendation(comm.id, null, currentRole);
  };

  // Handle custom parameters from document extraction
  const handleExtractCustomParams = (params) => {
    fetchRecommendation(null, params, currentRole);
  };

  // Role labels
  const roleDisplayNames = {
    farmer: "Farmer & Producer Mode",
    researcher: "Scientific Researcher Mode",
    logistics: "Logistics Operations Mode",
    general: "General Consumer Mode"
  };

  return (
    <div className="main-wrapper">
      {/* 1. TOP NAVIGATION & ROLE SWITCHER */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        onOpenCitations={() => {
          setActiveCitationDetail(null);
          setIsCitationsOpen(true);
        }}
        onOpenPeerReview={() => setIsPeerReviewOpen(true)}
        onOpenPassportLookup={() => {
          if (recommendationData && modalMaterial) {
            setIsPassportOpen(true);
          } else {
            setIsWalkthroughOpen(true);
          }
        }}
        apiOnline={apiOnline}
      />

      <main className="app-container">
        {/* 2. HERO SECTION */}
        <section className="hero-header">
          <div className="hero-titles">
            <h1>Intelligent Food Packaging Recommendation System</h1>
            <p>
              Physics-grounded barrier matching, live polymer economics, eco-footprint optimization, and digital passport traceability under MoFPI standards.
            </p>
          </div>
          <div className="role-perspective-badge">
            <span>●</span>
            <span>{roleDisplayNames[currentRole] || "General Mode"}</span>
          </div>
        </section>

        {/* 3. MULTIMODAL INPUT TABS */}
        <InputModes
          currentRole={currentRole}
          onSelectCommodity={handleSelectCommodity}
          onExtractCustomParams={handleExtractCustomParams}
          lang={currentLang}
        />

        {/* 4. RESULTS SECTION */}
        {loadingRecommendation ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#34d399", fontSize: "1.1rem", fontWeight: 700 }}>
            ⚡ Computing optimal barrier requirements, OTR/WVTR kinetics, and live cost trade-offs...
          </div>
        ) : recommendationData ? (
          <section className="results-container">
            <ResultsView
              recommendationData={recommendationData}
              onOpenCosting={(mat, packG) => {
                setModalMaterial(mat);
                setIsCostingOpen(true);
              }}
              onOpenPassport={(comm, mat) => {
                setModalMaterial(mat);
                setIsPassportOpen(true);
              }}
              onOpenCitationDetail={(cit) => {
                setActiveCitationDetail(cit);
                setIsCitationsOpen(true);
              }}
              onSelectAlternative={(alt) => {
                setModalMaterial(alt.material);
              }}
            />

            {/* Dedicated Role-Based Intelligence Panel */}
            <RoleInsightCard
              currentRole={currentRole}
              roleInsights={recommendationData.role_insights}
              onOpenCitations={() => {
                setActiveCitationDetail(null);
                setIsCitationsOpen(true);
              }}
            />
          </section>
        ) : null}
      </main>

      {/* 5. MODALS & OVERLAYS */}
      <CostingModal
        isOpen={isCostingOpen}
        onClose={() => setIsCostingOpen(false)}
        material={modalMaterial || recommendationData?.top_recommendations?.[0]?.material}
        packWeightG={selectedCommodity?.pack_g || 500}
      />

      <PassportModal
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
        commodity={selectedCommodity || recommendationData?.commodity}
        material={modalMaterial || recommendationData?.top_recommendations?.[0]?.material}
        packWeightG={selectedCommodity?.pack_g || 500}
      />

      <WalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
      />

      <CitationsModal
        isOpen={isCitationsOpen}
        onClose={() => setIsCitationsOpen(false)}
        selectedCitation={activeCitationDetail}
      />

      <PeerReviewModal
        isOpen={isPeerReviewOpen}
        onClose={() => setIsPeerReviewOpen(false)}
      />

      <CookieConsentBanner
        sessionId={sessionId}
        onConsentChange={(granted) => console.log("Consent set:", granted)}
      />
    </div>
  );
}
