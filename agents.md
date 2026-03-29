# Odd Noodle Games — Agent Context & Architecture Reference

> **⚠️ SYSTEM DIRECTIVE:**
> This file is the primary context document and single source of truth for AI-assisted development on this project. Read it fully at the start of every session. You must strictly adhere to the constraints, design principles, and code patterns defined below.

---

## Project Identity

**Site name:** Odd Noodle Games
**Purpose:** A collection of fun, kid-friendly browser games playable on any device
**Audience:** Children (primary), curious adults (welcome)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18.2 |
| Routing | React Router DOM 6 |
| Styling | Inline `style={{}}` only — no CSS files |
| Build | react-scripts (Create React App) |
| Server | Nginx Alpine (static file serving) |
| Container | Docker multi-stage build (Node 20 → Nginx) |
| Language | JavaScript (`.jsx`) — no TypeScript |

---

## Architecture

```text
arcade/
├── Dockerfile              # Multi-stage: node:20-alpine build → nginx:alpine serve (~25MB)
├── docker-compose.yml      # Single service on port 8080
├── nginx/
│   └── default.conf        # SPA routing (try_files), gzip, 1-year caching, security headers
├── public/
│   └── index.html          # HTML shell — viewport meta, #020208 bg, <div id="root">
├── src/
│   ├── index.js            # ReactDOM.createRoot + BrowserRouter + StrictMode
│   ├── App.js              # Route registry — ADD NEW GAME ROUTES HERE
│   ├── Gallery.jsx         # Landing page — animated canvas bg + GAMES array
│   └── games/              # One .jsx file per game, everything self-contained
│       ├── FishForFruit.jsx        (canvas action game)
│       ├── NumberNomad.jsx         (canvas math platformer)
│       └── EmbassyOfOddballs.jsx   (React DOM card/diplomacy game)
├── GAME_GUIDE.md           # Full developer reference for creating games
└── README.md               # Deployment and infrastructure guide
