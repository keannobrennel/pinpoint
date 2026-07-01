# 📍 PinPoint

**Pre and Post-Disaster Structural Assessment for Communities**  
_Flag Hazards. Drive Action._

## 📖 Project Brief

PinPoint is a crowdsourced, AI-assisted infrastructure hazard reporting and assessment web application. Citizens submit photo reports of structural damage or hazards — both before and after disaster events — while LGU engineers and emergency responders get a real-time, AI-pre-assessed, geographically clustered dashboard to prioritize inspections.

The platform operates in two modes on a single system:

- **Hazard Mode** — always-on reporting of pre-existing structural concerns (cracks, exposed rebar, leaning structures), aligned with FEMA P-154 Rapid Visual Screening.
- **Disaster Mode** — post-seismic surge triage, ranking incoming reports by density and AI-generated severity, aligned with ATC-20 Post-Earthquake Safety Evaluation.

Every submitted photo runs through a single Gemini 2.5 Flash Vision pipeline that validates the image and generates a structured pre-assessment (damage classification, severity score, suggested placard) before entering a two-tier human verification workflow — barangay-level Responders, then licensed Engineers, who issue the final official safety placard.

## 👥 Team

**Neo Culture Technology**

| Name                        | Role                                  |
| --------------------------- | ------------------------------------- |
| [Keanno Brennel Macatangay] | [Team Lead & Full Stack Developer]    |
| [Kenneth Carl Binasa]       | [Frontend Developer (Admin)]          |
| [Eloissa Francisco]         | [Frontend Developer & UI/UX Designer] |
| [Jaero Octaviano]           | [Frontend Developer]                  |

## ☁️ Google Technologies Used

- **Gemini 2.5 Flash API** — photo validation, damage classification, and severity scoring
- **Google Maps Platform** — Maps JavaScript API, Places API (Autocomplete), Geocoding API (heatmap, pulsing triage pins, location picker, reverse geocoding)
- **Firebase** — Authentication, Firestore, Cloud Storage

## 🛠️ Tech Stack

| Layer                 | Technology                          |
| --------------------- | ----------------------------------- |
| Frontend + API Routes | Next.js (App Router)                |
| UI                    | Tailwind CSS                        |
| Auth & Backend        | Firebase (Auth, Firestore, Storage) |
| AI Assessment         | Gemini 2.5 Flash API                |
| Mapping & Location    | Google Maps Platform                |
| Deployment            | Vercel                              |

## 🚀 Installation

### 📋 Prerequisites

- Node.js (LTS recommended)
- npm

### ⚙️ Steps

1. **Clone the repository**

```bash
git clone https://github.com/<your-org>/pinpoint.git
cd pinpoint
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

- Request the `.env.local` file from the team (contains Firebase, Gemini, and Google Maps API keys/config).
- Place it in the project root.

4. **Run the development server**

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 📝 Note

This project was developed for **SparkFest 2026**.
