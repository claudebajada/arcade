# Odd Noodle Games — Agent Guide

## Project Overview
- **Site:** Odd Noodle Games
- **Goal:** Kid-friendly browser games playable on desktop and mobile
- **Audience:** Children first; suitable for all ages

## Tech Stack
- React 18.2 + React Router DOM 6
- JavaScript with `.jsx` (no TypeScript)
- Create React App (`react-scripts`)
- Static hosting via Nginx (Alpine)
- Docker multi-stage build (`node:20-alpine` → `nginx:alpine`)
- **Styling rule:** inline `style={{}}` only (no CSS files, no `className` styling systems)

## Repository Structure
- `public/index.html`: HTML shell (`<div id="root">`)
- `src/index.js`: app mount (`ReactDOM.createRoot`, `BrowserRouter`, `StrictMode`)
- `src/App.js`: route registry (add new game routes here)
- `src/Gallery.jsx`: landing page; game cards are driven by `GAMES`
- `src/games/*.jsx`: one self-contained file per game
- `GAME_GUIDE.md`: game-building reference patterns
- `README.md`: deployment/infrastructure details

## Core Architecture Rules
1. `src/index.js` mounts into `public/index.html`.
2. `src/App.js` maps URL paths to game components.
3. `src/Gallery.jsx` controls landing-page cards via `GAMES`.
4. Each game in `src/games/` is standalone and includes a back button to `/`.

## Coding Standards
- Single game file per game: `src/games/GameName.jsx`
- Export pattern: `export default function GameName()`
- Inline styles only: `style={{}}`
- No TypeScript, no external CSS, no image imports, no server-side game code
- Keep games client-side; avoid external API dependencies
- Clean up listeners/animation frames in `useEffect` cleanup

## Game UX & Safety Requirements
- Minimum flow: start/menu → gameplay → game-over/results
- Support desktop controls (keyboard and/or mouse)
- Support mobile touch controls
- Back button should call `navigate("/")` and use a friendly label (e.g., `← ODD NOODLE`)
- Child-safe content only:
  - No violence/gore, adult themes, horror, or gambling mechanics
  - No user data collection, accounts, tracking, or analytics
- Accessibility baseline:
  - Tap targets at least 44×44px
  - Readable sizing (body >= 14px; important UI >= 18px)
  - High contrast and no rapid flashing

## Preferred Design Direction
- Bright, playful colors and generous spacing
- Positive, simple, encouraging language
- Emoji-friendly and approachable presentation

## Allowed Patterns
- React hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, `useReducer`)
- Canvas + `requestAnimationFrame` for action games
- React DOM for card/puzzle/board games
- Web Audio API for synthesized sounds
- Dynamic Google Fonts (`<style>` in `useEffect`), CDN scripts (`<script>` in `useEffect`), inline SVG, data URIs

## Common Commands
- Start/rebuild locally: `docker compose up --build -d`
- Stream logs: `docker compose logs -f`
- Stop services: `docker compose down`

## Adding a New Game
1. Create `src/games/YourGame.jsx` using `GAME_GUIDE.md` patterns.
2. Register route in `src/App.js`:
   - `import YourGame from './games/YourGame';`
   - `<Route path="/your-game" element={<YourGame />} />`
3. Add game metadata card to `GAMES` in `src/Gallery.jsx`.
4. Rebuild: `docker compose up --build -d`
