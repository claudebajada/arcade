# Odd Noodle Games — Claude Code Reference

This file is the primary context document for AI-assisted development on this project. Read it fully at the start of every session.

---

## Project Identity

**Site name:** Odd Noodle Games
**Purpose:** A collection of fun, kid-friendly browser games playable on any device
**Audience:** Children (primary), curious adults (welcome)
**Status:** Moving from self-hosted to publicly accessible
**Current games:** Fish for Fruit · Number Nomad · Embassy of Oddballs

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

```
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
```

### How the pieces connect

1. `src/index.js` mounts the app into `public/index.html`
2. `src/App.js` maps URL paths to game components
3. `src/Gallery.jsx` renders the landing page — the `GAMES` array drives the game cards
4. Each game in `src/games/` is a standalone React component with its own back button

---

## Frontend Design Principles — Kid-Friendly

The site is aimed at children. Every UI decision should reflect that.

### Visual Style
- **Colors:** Bright, saturated, and playful. Avoid dark/gritty palettes. Use vibrant backgrounds, not just black.
- **Typography:** Prefer rounded or playful fonts (Nunito, Fredoka One, Baloo 2, Bubblegum Sans) over harsh monospace in UI headings. Monospace is fine for in-game score/debug text.
- **Emoji:** Use liberally — they communicate quickly and kids love them.
- **Whitespace:** Generous padding. Don't cram elements together.

### Tone & Language
- Simple words, short sentences. Avoid jargon.
- Encouraging and positive: celebrate wins loudly, soften failure messages ("Try again!" not "GAME OVER").
- Playful, slightly silly — the site is called Odd Noodle Games for a reason.
- Avoid sarcasm, negativity, or adult humour.

### Interaction Design
- **Tap targets:** Minimum 44×44px for all interactive elements (buttons, cards, controls).
- **Clear affordances:** Buttons should look like buttons. Interactive things should have obvious hover/active states.
- **Feedback:** Every action gets an immediate visual or audio response.
- **No dark patterns:** No timers that pressure kids, no confusing UI, no fake close buttons.

### Accessibility
- High contrast between text and background.
- Font sizes readable on small screens (minimum 14px body, 18px for important UI).
- No rapid flashing that could trigger photosensitive reactions.
- Touch and keyboard both work everywhere.

### Content Policy (mandatory for public site)
- No violence, blood, or gore.
- No adult themes, scary imagery, or horror.
- No gambling mechanics (loot boxes, random pay-to-win).
- No user data collection, no accounts, no tracking.
- Age-appropriate humour only.

---

## Game Requirements — What Every Game Must Have

**These are non-negotiable.** All games must satisfy every item on this list before being added.

### Functionality Checklist
- [ ] **Single `.jsx` file** in `src/games/` — no separate CSS, JS, or asset files
- [ ] **`export default function GameName()`** — named export matching the file name
- [ ] **Desktop controls** — full keyboard (and/or mouse) support
- [ ] **Mobile controls** — touch input via virtual joystick, on-screen buttons, or tap gestures
- [ ] **Three screens minimum:** start/menu screen → gameplay → game-over/results screen
- [ ] **Back button** → `navigate("/")` labelled `← ODD NOODLE` (or similar friendly label)
- [ ] **All styles inline** — `style={{}}` objects only, no `className`, no CSS imports
- [ ] **Kid-appropriate content** — passes content policy above
- [ ] **Cleanup in useEffect returns** — cancel animation frames, remove event listeners

### Mobile Controls — Implementation Notes

For **canvas-based games** (action/platformer), implement a virtual joystick + action buttons:
- Virtual joystick: track `touchstart`/`touchmove`/`touchend` on the canvas or a dedicated overlay
- Action buttons: absolute-positioned divs in the bottom-right corner
- See `FishForFruit.jsx` for a complete joystick implementation and `NumberNomad.jsx` for a button-grid approach

For **React DOM games** (card/puzzle/board), touch works natively via `onClick`. Ensure:
- All tap targets are at least 44×44px
- Drag interactions use `onTouchStart`/`onTouchMove`/`onTouchEnd` as well as mouse equivalents
- See `EmbassyOfOddballs.jsx` for a DOM-based game example

### Back Button Template
```jsx
<div
  onClick={() => navigate("/")}
  style={{
    position: "absolute", top: 12, left: 16,
    color: "#fff", fontSize: 13, cursor: "pointer",
    zIndex: 10, padding: "8px 14px", borderRadius: 20,
    background: "rgba(0,0,0,0.4)", border: "2px solid rgba(255,255,255,0.3)",
    fontFamily: "'Nunito', 'Baloo 2', sans-serif", fontWeight: 700,
    userSelect: "none",
  }}
>
  ← ODD NOODLE
</div>
```

---

## What You CAN Use

| Tool | Notes |
|------|-------|
| React 18 hooks | `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, `useReducer` |
| HTML5 Canvas | Best for action/arcade games. Use `requestAnimationFrame` game loop. |
| React DOM | Best for puzzle, card, board, and turn-based games. |
| Web Audio API | Synthesize sound effects in-browser — no audio file imports needed |
| Google Fonts | Inject via dynamic `<style>` tag in a `useEffect` (see GAME_GUIDE.md) |
| CDN libraries | Load dynamically via `<script>` tag in `useEffect` (e.g. Matter.js) |
| Emoji | Excellent for game art — fast, colourful, no import needed |
| Inline SVG | Embed directly in JSX for complex shapes or icons |
| Data URIs | Base64-encode small images directly in code |

---

## What You CANNOT Use

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

---

## Adding a New Game

### Step 1 — Create the game file
```
src/games/YourGame.jsx
```
Follow the template in `GAME_GUIDE.md`. Must satisfy all checklist items above.

### Step 2 — Register the route in `src/App.js`
```jsx
import YourGame from './games/YourGame';

// Inside <Routes>:
<Route path="/your-game" element={<YourGame />} />
```

### Step 3 — Add a gallery card in `src/Gallery.jsx`
Add to the `GAMES` array:
```js
{
  id: 'your-game',
  title: 'Your Game',
  subtitle: 'a fun one-line description',
  emoji: '🎮',
  path: '/your-game',
  colors: ['#fee440', '#b537f2'],   // two bright accent colors for the card
  description: 'One or two sentences about what you do in the game.',
  tags: ['arcade', 'puzzle'],       // genre tags shown on the card
},
```

### Step 4 — Rebuild
```bash
docker compose up --build -d
```

---

## Current Games

### Fish for Fruit (`/fish-for-fruit`)
- **File:** `src/games/FishForFruit.jsx` (~1733 lines)
- **Type:** Canvas action/arcade game
- **Concept:** A fish that transforms into fruit; collect items, dodge enemies
- **Features:** 6 fruit types, 8 power-ups, combo system, lives, level progression
- **Mobile:** Virtual joystick + action buttons implemented
- **Colors:** `['#00f5d4', '#ff2d95']` (cyan/pink neon)

### Number Nomad (`/number-nomad`)
- **File:** `src/games/NumberNomad.jsx` (~904 lines)
- **Type:** Canvas platformer with math puzzles
- **Concept:** Platform across a graph-paper world solving maths equations
- **Features:** Jump/dash/wall-slide, Web Audio sounds, grade 3–5 difficulty scaling
- **Mobile:** 4-button touch grid (left, right, jump, dash) implemented
- **Colors:** `['#48bb78', '#4d96ff']` (green/blue)

### Embassy of Oddballs (`/embassy-of-oddballs`)
- **File:** `src/games/EmbassyOfOddballs.jsx` (~758 lines)
- **Type:** React DOM card/diplomacy strategy game
- **Concept:** Match country cards to absurd diplomatic crises using geography traits
- **Features:** 193 real countries, 20 crises, 3 difficulty levels, hints, dossier view
- **Mobile:** DOM-click based (touch works natively); ensure tap targets are large
- **Colors:** `['#d4a847', '#e85d5d']` (gold/red)

---

## Build & Deploy

```bash
# Local development
docker compose up --build -d    # Build and start on http://localhost:8080
docker compose logs -f           # Stream logs
docker compose down              # Stop

# After adding a game, always rebuild:
docker compose up --build -d
```

### Public Hosting

The site is intended to go public. When deploying publicly:

1. **Use HTTPS.** Caddy is the easiest option (auto-cert via Let's Encrypt):
   ```bash
   sudo caddy reverse-proxy --from oddnoodlegames.com --to localhost:8080
   ```
   Or add a Caddy service to `docker-compose.yml`.

2. **Review all content** against the kid-safe content policy before launch.

3. **No user data.** The site collects nothing — no analytics, no cookies, no accounts. Keep it that way.

4. **Custom domain.** Point DNS A record to the server IP, let Caddy handle TLS.

See `README.md` for full VM deployment instructions.

---

## Asking Claude to Build a Game

When prompting Claude (or another AI) to create a game for Odd Noodle Games, use this template:

```
Create a [game type] game for the Odd Noodle Games arcade as a single React component (.jsx).

Requirements:
- Single file, default export function, all inline styles
- Kid-friendly design: bright colours, encouraging language, big tap targets
- Canvas-based rendering (or React DOM for board/card/puzzle games)
- Desktop controls: keyboard (and/or mouse)
- Mobile controls: touch (virtual joystick for action games, on-screen buttons for platformers)
- Import React hooks from "react" and useNavigate from "react-router-dom"
- Back button at top-left: onClick={() => navigate("/")} labelled "← ODD NOODLE"
- No external CSS, no image imports, no TypeScript
- Three screens: start/menu → gameplay → game-over/results
- Clean up event listeners and animation frames in useEffect returns
- Content must be appropriate for children

Theme/concept: [describe the game idea]
```

---

## Reference Documents

- **`GAME_GUIDE.md`** — Full developer reference: templates, canvas game loop patterns, input handling, audio, fonts, how to load CDN libraries. Read this before writing a new game.
- **`README.md`** — Infrastructure: Docker commands, VM deployment, reverse proxy setup.
