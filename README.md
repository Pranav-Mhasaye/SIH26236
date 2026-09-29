# SIH26236 — PackPulse: AI-Based Intelligent Food Packaging Material Recommendation System

[![Ministry of Food Processing Industries](https://img.shields.io/badge/MoFPI-Government%20of%20India-blue.svg)](https://www.mofpi.gov.in/)
[![SIH Problem Statement](https://img.shields.io/badge/SIH%202026-PS%2026236-emerald.svg)](https://www.sih.gov.in/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-38bdf8.svg)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014%20%7C%20Turbopack-000000.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Problem Background (SIH ID: 26236)
Selection of improper packaging material results in moisture absorption, oxidation, microbial spoilage, texture degradation, nutrient loss, and severe post-harvest waste (estimated at 25–35% across Indian horticulture). At present, packaging selection depends heavily on scattered expert heuristics. Small food businesses, startups, and farmers lack technical knowledge regarding barrier properties (OTR, WVTR), modified atmospheres (MAP), storage thermodynamics, and food-packaging compatibility.

**PackPulse** is an intelligent, physics-grounded decision-support platform capable of automatically recommending optimized food packaging materials and packaging specifications for diverse commodities.

---

## 🌟 Key Innovations & Features

### 1. 3-Tier Master Dataset Grounded in Indian Science
* **Tier 1 — Packaging Materials & Structures (29 structures):** Monofilms, co-extrusions, metallized films, and compostable biopolymers with standardized $OTR$ ($cm^3/m^2\cdot day$), $WVTR$ ($g/m^2\cdot day$), thickness ($µm$), heat seal temperature, and puncture grade.
* **Tier 2 — Food Commodities (55 commodities across 8 categories):** Moisture $\%$, fat $\%$, pH, respiration rate $R_{20}$ ($mg\ CO_2/kg\cdot h$), storage temp, RH, and equilibrium MAP gas mix ($O_2/CO_2/N_2$).
* **Tier 3 — Statutory Rules & Standards:** FSSAI (Packaging) Regulations 2018, March 2025 rPET amendments, IS 9845, IS/ISO 17088, ASTM D3985 (OTR), and ASTM F1249 (WVTR).
* **Top-Right Source Citation Badges:** Every metric cites official Indian & international databases (**NIFTEM-T**, **CSIR-CFTRI Mysore**, **FAO**, **ASTM**, **FSSAI**).

### 2. The "Green Trade-Off" & Carbon Footprint Engine
* Calculates cradle-to-gate emissions in $g\ CO_2e/m^2$ and per pouch.
* **Eco-Upgrade Recommendation:** Automatically suggests switching from non-recyclable Multilayer Plastics (MLP) to recyclable mono-materials (e.g. MDO-PE/EVOH) or certified compostable films, detailing exact delta price (+₹X/pouch) and carbon emissions saved.

### 3. Role-Based Access (RBAC) with Judge Quick-Switcher
* **🔬 Researcher:** Laboratory ASTM specs, 3-peer review verification queue, and automated scientific trend crawler.
* **🌾 Farmer / Producer:** Post-harvest crop management, storage condensation alerts, and regional vernacular names.
* **🚛 Logistics Manager:** Cold-chain transit bounds, road vibration puncture resilience, and depot check-ins.
* **👤 General User:** Plain-language freshness estimates, photo capture, and plastic recycling/compost disposal directions.

### 4. 4 Multimodal Input Channels
1. **Instant Search:** Auto-corrects typos (e.g. *"potatto"* → Potato) and supports Indian regional aliases (*"Aloo"*, *"Batata"*, *"Tamatar"*, *"Bhindi"*, *"Aam"*, *"Kela"*, *"Seb"*).
2. **Photo Scanner:** Silent 3-tier cascade (On-Device Spectral Profile → Cloud Vision LLM → Visual Heuristic Fallback).
3. **Commodity Catalog:** 8 visual food categories.
4. **Lab Document Upload:** Parses PDF and CSV specification reports with regex parameter extraction.

### 5. Interactive Laminate Layer Visualizer
* Visualizes outside ambient atmosphere, animated $O_2$ (Air in) and $H_2O$ (Moisture in) barrier flux lanes, exact micrometric layer thicknesses with polymer family colors (PE, PP, PET, PA, EVOH, ALU foil, BIO compostable), and food contact surface.

### 6. Live Costing & MOQ Volume Simulator
* Live polymer benchmark rates (₹/kg for LDPE, HDPE, BOPP, PET, EVOH, ALU, PLA).
* Interactive Minimum Order Quantity (MOQ) slider (500 to 50,000 pouches) calculating cylinder setup amortization.
* 3-Way Comparative Architecture table (Conventional MLP vs Recyclable Mono-Material vs Certified Compostable).

### 7. Digital Packaging Passport (DPP) & Scannable QR Traceability
* Generates a unique traceable passport (`DPP-YYYYMM-XXXXXX`) with a dynamic scannable QR code.
* Displays live freshness preservation countdown, batch manufacturing dates, temperature thresholds, and EPR plastic disposal directives.

### 8. Live Dataset Evolution via Democratic 3-Peer Review
* Researchers can submit newly formulated barrier films with DOI citations.
* Requires **3 independent peer approvals** before automatically appending to `materials.json` in real time.
* **Scientific Trend Crawler:** Streams recent studies from **Europe PMC** and open access journals, allowing researchers to nominate emerging packaging materials with one click.

---

## 🏗️ Architecture

```
SIH 26236/
├── backend/
│   ├── datasets/               # 3-Tier Master Dataset (materials.json, commodities.json, rules.json)
│   ├── pipeline/               # Recommendation & Multilingual Search Engines
│   ├── vision/                 # 3-Tier Vision Cascade (On-Device, Cloud LLM, Heuristic)
│   ├── documents/              # PDF & CSV Regex Parameter Extractor
│   ├── costing/                # Live Polymer Benchmarks & MOQ Costing Engine
│   ├── passport/               # QR Code & Digital Packaging Passport Service
│   ├── peer_review/            # 3-Peer Consensus Workflow & Europe PMC Literature Crawler
│   ├── ml_personalization/     # Cookie Consent & Dynamic Weighting Pipeline
│   └── main.py                 # FastAPI Application Server
│
├── frontend/                   # Next.js 14 Web Application
│   ├── src/app/
│   │   ├── components/         # Header, InputModes, ResultsView, CostingModal, PassportModal, etc.
│   │   ├── globals.css         # Custom Glassmorphic Design System & Laminate Stack Styles
│   │   ├── layout.js           # Metadata and Root Layout
│   │   └── page.js             # Main Integrated Application Page
│   └── package.json
│
├── ppt/                        # Presentation Pitch Decks
└── Problem Statement.txt       # Official Ministry of Food Processing Industries Problem Statement
```

---

## 🚀 Quick Start Guide

### Prerequisites
* Python 3.11+
* Node.js v18+ & npm

### 1. Run the Python Backend
```bash
cd backend
python -m pip install fastapi pydantic pypdf qrcode uvicorn requests pillow pandas numpy scikit-learn
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
Backend API will be live at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

### 2. Run the Next.js Frontend
```bash
cd frontend
npm install
npm run dev -- -p 3000
```
Open `http://localhost:3000` in your web browser.

---

## 📜 Scientific Citations & Standards
* **NIFTEM-T (MoFPI):** *Packaging Materials Handbook for Processed Foods (2023)*
* **CSIR-CFTRI Mysore:** *Physico-chemical properties of flexible packaging materials (Doc 4848)*
* **FAO:** *Properties of Selected Packaging Materials for Food Commodities (W6864E)*
* **Nature npj Science of Food:** *Mapping gas permeability of sustainable packaging materials (2026)*
* **ASTM D3985 / ASTM F1249:** *Standard Test Methods for OTR (Coulometric) and WVTR (Modulated IR)*
* **IS/ISO 17088:** *Specifications for Compostable Plastics (BIS)*
* **FSSAI:** *Food Safety and Standards (Packaging) Regulations 2018 & March 2025 rPET Directives*

---

## 👥 Authors
Developed for **Smart India Hackathon (SIH 2026)** by **Pranav Mhasaye & Team**.
