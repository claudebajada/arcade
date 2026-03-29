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
- `public/sitemap.xml`: static sitemap — add a `<url>` entry for every new game
- `public/robots.txt`: points to sitemap; no changes needed when adding games
- `public/og/`: OG/Twitter social share images — add `[game-slug].png` (1200×630px) per game
- `src/index.js`: app mount (`ReactDOM.createRoot`, `BrowserRouter`, `StrictMode`)
- `src/App.js`: route registry and `PAGE_META` SEO config (add entries here for every new game)
- `src/Gallery.jsx`: landing page; game cards driven by `export const GAMES`
- `src/games/*.jsx`: one self-contained file per game
- `src/components/GamePageWrapper.jsx`: wraps every game route with SEO content + Related Games
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

### 1. Game component
Create `src/games/YourGame.jsx` using `GAME_GUIDE.md` patterns.

### 2. Route + SEO metadata (`src/App.js`)
Add a lazy import and a wrapped route:
```js
const YourGame = React.lazy(() => import('./games/YourGame'));
```
```jsx
<Route path="/your-game" element={
  <GamePageWrapper path="/your-game"><YourGame /></GamePageWrapper>
} />
```
Add an entry to `PAGE_META`:
```js
'/your-game': {
  title: 'Your Game | Free [Genre] Game | Odd Noodle Games',  // keyword-rich, ~60 chars
  description: 'One or two sentences describing the game. 150–160 characters max. End with "No download needed!" or similar CTA.',
  genre: ['Genre1', 'Genre2'],           // matches the game's tags
  image: `${BASE_URL}/og/your-game.png`, // 1200×630 social share image
},
```

### 3. Gallery card (`src/Gallery.jsx`)
Add an entry to the `GAMES` array:
```js
{
  id: 'your-game',
  title: 'Your Game',
  subtitle: 'a short tagline',
  emoji: '🎮',
  path: '/your-game',
  colors: ['#hex1', '#hex2'],
  description: 'One or two sentences shown on the gallery card.',
  tags: ['genre1', 'genre2'],
},
```

### 4. SEO content section (`src/components/GamePageWrapper.jsx`)
Add an entry to `GAME_SEO_CONTENT`:
```js
'/your-game': {
  name: 'Your Game',
  tagline: 'Free [Genre] Game',
  about: '2–3 sentences describing the game world, premise, and appeal.',
  howToPlay: '2–3 sentences explaining the core loop and win condition.',
  controls: 'Arrow Keys — Move | Space — Action | Mobile: on-screen controls',
  whatYoullLearn: '1–2 sentences on educational or skill-building value.',
},
```

### 5. Social share image
Add `public/og/your-game.png` — 1200×630px. Used by `og:image` and `twitter:image`.

### 6. Sitemap (`public/sitemap.xml`)
Add a `<url>` block for the new game:
```xml
<url>
  <loc>https://oddnoodlegames.com/your-game</loc>
  <lastmod>YYYY-MM-DD</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

### 7. Rebuild
```
docker compose up --build -d
```
