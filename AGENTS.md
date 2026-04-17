# Odd Noodle Games — Agent Guide

## Project Overview
- **Site:** Odd Noodle Games — https://oddnoodlegames.com
- **Goal:** Kid-friendly browser games playable on desktop and mobile
- **Audience:** Children first; suitable for all ages

## Task Categories

Not every request is "build a new game." Identify the category before proceeding.

| Category | When it applies | Key files to read | See section |
|---|---|---|---|
| New game | Create, add, or build a game | GAME_GUIDE.md | Adding a New Game |
| Documentation update | Edit AGENTS.md, CLAUDE.md, GAME_GUIDE.md, README.md, or in-code comments | The specific doc file | — (edit in place) |
| To-do / Roadmap | Capture tasks, a feature wishlist, or a roadmap | TODO.md (create if absent) | — |
| Bug fix / Refactoring | Fix a bug or improve existing code | src/games/[Game].jsx | Coding Standards |
| Infrastructure | Docker, nginx, deployment, or environment changes | Dockerfile, docker-compose.yml, nginx/default.conf | README.md |
| SEO / Metadata | SEO, OG images, sitemap, or meta-description updates | public/index.html, public/sitemap.xml, src/App.js, src/components/GamePageWrapper.jsx | Adding a New Game §2 §4 §6 |

For any category other than "New game," do not follow the seven-step game workflow unless explicitly requested.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18.2 |
| Routing | React Router DOM 6 |
| Styling | Inline `style={{}}` only — no CSS files |
| Build | react-scripts (Create React App) |
| Server | Nginx Alpine (static file serving) |
| Container | Docker multi-stage build (Node 20 → Nginx, ~25MB) |
| Language | JavaScript (`.jsx`) — no TypeScript |

## Repository Structure
- `public/index.html`: HTML shell (`<div id="root">`) with SEO meta tags and JSON-LD `ItemList` — update when adding a game
- `public/sitemap.xml`: static sitemap — add a `<url>` entry for every new game
- `public/robots.txt`: points to sitemap; no changes needed when adding games
- `public/og/`: OG/Twitter social share images — add `[game-slug].png` (1200×630px) per game
- `public/favicon.svg`: site favicon served at `/favicon.svg`
- `public/favicon.ico`: ICO fallback for older browsers (32×32 PNG-in-ICO)
- `public/apple-touch-icon.png`: 180×180px PNG for iOS home-screen bookmarks
- `src/index.js`: app mount (`ReactDOM.createRoot`, `BrowserRouter`, `StrictMode`)
- `src/App.js`: route registry and `PAGE_META` SEO config — add entries here for every new game
- `src/Gallery.jsx`: landing page; game cards driven by `export const GAMES`
- `src/components/GamePageWrapper.jsx`: wraps every game route with SEO content + Related Games
- `src/games/*.jsx`: one self-contained file per game:
  - `FishForFruit.jsx` — canvas action/arcade
  - `NumberNomad.jsx` — canvas math platformer
  - `EmbassyOfOddballs.jsx` — React DOM geography strategy
  - `GravityLab.jsx` — canvas space physics puzzle
  - `DebugDynasty.jsx` — canvas arcade coding game
  - `MathPracticeRoom.jsx` — React DOM maths practice
  - `RelativisticRacer_Arcade.jsx` — canvas science arcade
  - `Enigma.jsx` — React DOM cipher/history puzzle
  - `NoteQuest.jsx` — React DOM music theory quiz
  - `UkuleleQuest.jsx` — React DOM classroom ukulele game
- `GAME_GUIDE.md`: game-building reference patterns
- `README.md`: deployment/infrastructure details

## Core Architecture Rules
1. `src/index.js` mounts into `public/index.html`.
2. `src/App.js` maps URL paths to game components (lazy-loaded via `React.lazy`).
3. `src/Gallery.jsx` controls landing-page cards via `GAMES`.
4. Each game in `src/games/` is standalone and includes a back button to `/`.

## Coding Standards
- Single game file per game: `src/games/GameName.jsx`
- Export pattern: `export default function GameName()`
- Inline styles only: `style={{}}`
- No TypeScript, no external CSS, no image imports, no server-side game code
- Keep games client-side; avoid external API dependencies
- Clean up listeners/animation frames in `useEffect` cleanup

## Frontend Design Principles

### Visual Style
- Bright, saturated, playful colors; avoid dark or gritty palettes
- Prefer rounded/playful fonts (Nunito, Fredoka One, Baloo 2) over harsh monospace in UI headings
- Use emoji liberally — they communicate fast and kids love them
- Generous whitespace and padding; don't cram elements

### Tone & Language
- Simple words, short sentences; avoid jargon
- Encouraging and positive: celebrate wins loudly, soften failure ("Try again!" not "GAME OVER")
- Playful, slightly quirky — the site is called Odd Noodle Games for a reason
- No sarcasm, negativity, or adult humour

### Interaction Design
- Tap targets minimum 44×44px
- Buttons should look like buttons; interactive elements need obvious hover/active states
- Every action gets an immediate visual or audio response
- No dark patterns: no pressure timers, no confusing UI, no fake close buttons

### Accessibility
- High contrast between text and background
- Font sizes: minimum 14px body, 18px for important UI
- No rapid flashing that could trigger photosensitive reactions
- Touch and keyboard both work everywhere

## Game UX & Safety Requirements
- Minimum flow: start/menu → gameplay → game-over/results
- Support desktop controls (keyboard and/or mouse)
- Support mobile touch controls (virtual joystick for action games; on-screen buttons for platformers; tap natively works for DOM games)
- Back button calls `navigate("/")` labelled `← ARCADE` (or `← ODD NOODLE` — either is acceptable):

```jsx
<div
  onClick={() => navigate("/")}
  style={{
    position: "absolute", top: 12, left: 16,
    color: "#4a4a6a", fontSize: 12, cursor: "pointer",
    zIndex: 10, padding: "6px 12px", borderRadius: 6,
    background: "#0a0c2080", border: "1px solid #1a1a3a",
    fontFamily: "'Courier New', monospace", letterSpacing: 2,
  }}
>
  ← ARCADE
</div>
```

- Child-safe content only:
  - No violence/gore, adult themes, horror, or gambling mechanics
  - No user data collection, accounts, tracking, or analytics
- Teach kids something in every game — learning must be deeply integrated into gameplay, not bolted on
- Games should be slightly quirky and original; no copyright violations

## Allowed Patterns
- React hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, `useReducer`)
- Canvas + `requestAnimationFrame` for action games
- React DOM for card/puzzle/board games
- Web Audio API for synthesized sounds
- Dynamic Google Fonts (`<style>` in `useEffect`), CDN scripts (`<script>` in `useEffect`), inline SVG, data URIs

## Restricted Patterns

| Don't use | Use instead |
|-----------|-------------|
| Separate `.css` files | Inline `style={{}}` objects |
| `import image from "./pic.png"` | Canvas drawing, emoji, inline SVG, or data URI |
| TypeScript / `.tsx` | Plain `.jsx` |
| Tailwind, styled-components, CSS-in-JS libs | Inline styles |
| Multiple component files per game | Helper functions inside the single `.jsx` file |
| `localStorage` for cross-session persistence | Fine for within-session scores; data clears on rebuild |
| External API calls | Keep games fully client-side |
| Node.js / server-side code | Container only serves static files |

## Adding a New Game

> **Helper script:** `scripts/install-game.js` automates Steps 1 and 3 for a game file that is already written:
> ```
> node scripts/install-game.js <path/to/Game.jsx> "Title" "emoji" "bg-color-class"
> ```
> After running it you still need to complete Steps 2 (SEO metadata in App.js), 4 (GamePageWrapper SEO content), 5 (OG image), 6 (sitemap), and 7 (rebuild).

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
  genre: ['Genre1', 'Genre2'],
  image: `${BASE_URL}/og/your-game.png`,
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
Add `public/og/your-game.png` — 1200×630px. Used by `og:image` and `twitter:image`. OG images must exist as real files; without them every social preview will 404.

### 6. Sitemap (`public/sitemap.xml`)
Add a `<url>` block:
```xml
<url>
  <loc>https://oddnoodlegames.com/your-game</loc>
  <lastmod>YYYY-MM-DD</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```
Also update the `ItemList` JSON-LD block in `public/index.html` to include the new game.

### 7. Rebuild
```
docker compose up --build -d
```

## Common Commands
- Start/rebuild locally: `docker compose up --build -d`
- Stream logs: `docker compose logs -f`
- Stop services: `docker compose down`

## AI Prompting Guide

Use the template that matches the task category. See the Task Categories table above to identify which one applies.

### New Game

When asking an AI agent to build a new game, use this prompt:

> Create a [game type] game for the Odd Noodle Games arcade as a single React component (`.jsx`).
>
> Requirements:
> - Single file, default export function, all inline styles
> - Kid-friendly: bright colours, encouraging language, big tap targets (min 44×44px)
> - Canvas-based rendering (or React DOM for board/card/puzzle games)
> - Desktop controls: keyboard and/or mouse
> - Mobile controls: touch (virtual joystick for action games, on-screen buttons for platformers)
> - Import React hooks from `"react"` and `useNavigate` from `"react-router-dom"`
> - Back button at top-left: `onClick={() => navigate("/")}` labelled `← ARCADE`
> - No external CSS, no image imports, no TypeScript
> - Three screens: start/menu → gameplay → game-over/results
> - Clean up event listeners and animation frames in `useEffect` returns
> - Teach kids something through gameplay — learning integrated, not bolted on
> - Slightly quirky and original; no copyright violations
> - Content appropriate for children (no violence, horror, gambling, or user data collection)
>
> Theme/concept: [describe the game idea]

### Documentation Update

> Update the [section name] section of [filename]. [Describe what to add / change / remove]. Preserve all other existing content. Do not reformat sections that are not mentioned.

### Bug Fix / Refactoring

> In `src/games/[GameName].jsx`, [describe the bug or refactor goal]. Do not change any other game files. Follow the Coding Standards in AGENTS.md (single file, inline styles, no TypeScript). Rebuild with `docker compose up --build -d` to verify.

### To-Do / Roadmap

> Add the following items to the project to-do list (create `TODO.md` at the repo root if it doesn't exist): [list items]. Group by category if there are more than five items. Do not modify any source code.

### Infrastructure / Docker

> Update the Docker/nginx configuration to [describe goal]. See README.md for the current setup. Only modify [Dockerfile | docker-compose.yml | nginx/default.conf] unless you have a specific reason to touch others.

### SEO / Metadata

> Update the SEO metadata for [game name | the whole site]. Files to touch: [list]. Do not change game logic. See the "Adding a New Game" section of AGENTS.md for the exact field names and character limits.

## Reference Documents
- **`GAME_GUIDE.md`** — Full developer reference: templates, canvas game loop, input handling, audio, fonts, CDN libraries. Read before writing a new game.
- **`README.md`** — Infrastructure: Docker commands, VM deployment, reverse proxy setup.
- **`TODO.md`** — Project task backlog and roadmap (create at repo root if it does not exist yet).
