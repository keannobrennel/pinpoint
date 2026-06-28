# Contributing to PinPoint

## Branch Structure

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code only. Protected — no direct pushes. |
| `dev` | Active development integration branch. All feature branches merge here first. |
| `feat/<name>` | Feature branches (e.g. `feat/gemini-pipeline`, `feat/heatmap`) |
| `fix/<name>` | Bug fix branches |

## Workflow

1. **Branch off `dev`**, never `main`
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/your-feature-name
   ```

2. **Commit with clear messages** (see convention below)

3. **Open a PR from your feature branch → `dev`**
   - Describe what changed and why
   - Tag a teammate for review before merging

4. **`dev` → `main` merges** are done by the team lead only, after confirming the build is stable

---

## Commit Message Convention

Format:
```
type: short description in lowercase
```

| Type | When to use |
|------|-------------|
| `feat:` | Adding a new feature |
| `fix:` | Fixing a bug |
| `chore:` | Setup, config, non-code changes |
| `style:` | UI/CSS changes only |
| `refactor:` | Restructuring code without changing behavior |
| `docs:` | README, comments, documentation |

**Examples:**
```
feat: add Gemini Vision validation pipeline
feat: implement heatmap density layer
fix: correct triage ranking weight calculation
chore: add README and env example
style: update dashboard card layout
docs: add setup instructions to CONTRIBUTING
```

**Rules:**
- Always lowercase after the colon
- Keep it short and specific — one line
- Use present tense ("add" not "added")

---

## Environment Setup

Copy `.env.example` to `.env.local` and fill in your keys:
```bash
cp .env.example .env.local
```

Required keys:
- `NEXT_PUBLIC_FIREBASE_*` — Firebase project config
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps Platform
- `GEMINI_API_KEY` — Gemini Vision Flash API
- `FIREBASE_ADMIN_SDK` — Service account for server-side role management

## Never commit `.env.local` or any file containing API keys.
