# 📍 PinPoint

A crowdsourced, AI-assisted infrastructure hazard reporting and triage platform for LGU engineers and emergency responders.

---

## 🚀 About the Project

This project is developed as part of **SparkFest 2026**, a hackathon organized by **Google Developer Groups on Campus – Polytechnic University of the Philippines (GDG PUP)**.

PinPoint addresses the critical information gap between what citizens observe after a disaster — or before one — and what municipal engineers and LDRRMO personnel can actually act on. By combining community photo reporting with AI-assisted pre-assessment and real-time geo-visualization, PinPoint gives emergency responders structured, location-specific situational awareness instead of fragmented phone calls and informal messages.

---

## 🎯 Problem Statement

The Philippines is one of the most disaster-prone nations in the world, sitting at the convergence of the Pacific Ring of Fire and the Western Pacific typhoon belt. PHIVOLCS has identified 37 active fault lines nationally — several passing through densely populated urban centers. When a major seismic event strikes, or when structural hazards develop quietly over time, municipal engineering offices and LDRRMOs face a critical operational gap:

**They have no real-time, location-specific situational awareness of where damage is occurring or where structural hazards already exist.**

Current methods — windshield surveys, phone calls, informal chat messages — capture only ~30% of buildings requiring evaluation post-disaster, and dispatch engineers based on who reported first, not where actual damage is concentrated. Pre-existing hazards like visible cracks, exposed rebar, and deteriorating structures go unreported for months until they become critical failures.

People see damage. They photograph it. They share it. The problem is that none of it reaches the people who can act on it, in a form they can actually use.

---

## 💡 Proposed Solution

PinPoint is a crowdsourced, AI-assisted infrastructure hazard reporting and assessment web application that enables:

- **Citizens** to submit geo-tagged photo reports of structural damage or hazards — before and after disaster events
- **LGU engineers and LDRRMO personnel** to access a real-time, AI-pre-assessed, geographically clustered triage dashboard to prioritize inspection response

The system operates in two complementary modes:

- **Hazard Mode (Always-On):** Citizens report pre-existing structural concerns at any time, building a living baseline hazard registry visible as a public density heatmap and a full actionable feed for engineers.
- **Disaster Mode (Surge Triage):** Following a seismic event or structural emergency, the same platform handles a surge of reports. Engineers declare disaster events and see a priority-ranked triage dashboard ordered by report density weighted by AI-assessed severity — not by who reported first.

AI is load-bearing throughout, not decorative. Every submitted photo passes through a **Gemini Vision two-phase pipeline**: validation (blurry or irrelevant photos are rejected before entering the database) and pre-assessment (damage classification, ATC-20 suggested placard, severity score, recommended action tag). The severity score feeds directly into the triage ranking algorithm.

What makes it different:

- Triage priority is computed, not manual — report density × AI severity × recency
- Role-gated information visibility prevents unverified details from reaching the public while giving engineers full situational awareness
- Framework-aligned: maps onto ATC-20 (post-earthquake safety evaluation) and FEMA P-154 (rapid visual screening) standards used by engineers

---

## ⚙️ Features

- **AI-Validated Photo Submission** — Gemini Vision rejects blurry, irrelevant, or non-structural photos before they enter the system; accepted photos receive a full pre-assessment card
- **Structured AI Pre-Assessment** — Damage classification, ATC-20 suggested placard, affected structure type, visible risk indicators, confidence level, severity score, and recommended action tag per report
- **Real-Time Google Maps Heatmap** — Public density view and full engineer pin layer with AI tags and thumbnails, updating live via Firestore listeners
- **Engineer Triage Dashboard** — Reports ranked by computed priority score (density × AI severity × recency), with official ATC-20 verdict posting and zone alert banner controls
- **Public Disaster Mode Experience** — Elevated zone visuals, official status display, and engineer-pushed alert banners — without exposing unverified individual report details
- **Role-Based Access Control** — Three roles (Public User, Engineer, Admin) with server-side enforcement; Admin manages Engineer accounts via backend-coded role routes

---

## 🧪 Tech Stack

- **Frontend + API Routes:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion
- **Authentication + Database:** Firebase Auth + Firestore
- **AI Assessment:** Gemini Vision Flash API (photo validation and pre-assessment pipeline)
- **Mapping + Heatmap:** Google Maps Platform (Visualization library, Places API)
- **Deployment:** Vercel

> **Google Technology Integration:** Gemini Vision Flash API · Google Maps Platform · Firebase (Auth + Firestore)

---

## 🌐 Deployed Project

- **Live Demo:** https://your-deployed-link.com
- **GitHub:** https://github.com/keannobrennel/pinpoint
