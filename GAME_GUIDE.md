# Game Development Guide

How to create games that work with the Game Arcade container.

---

## The Golden Rule

**Each game lives in its own folder** inside `src/games/`.

The folder must contain `index.jsx` — a React component with `export default function GameName()`. That is the only required file. You may add sibling files (`constants.js`, `utils.js`, `components/`) as the game grows, but they are optional.

No CSS files anywhere in the folder. No TypeScript. All styles remain inline `style={{}}`.

---

## Game File Template

Every game should follow this structure:

```jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function YourGameName() {
  const navigate = useNavigate();

  // ... all your game state, refs, logic, rendering ...

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      {/* Back button */}
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

      {/* Your game UI here */}
    </div>
  );
}
```

---

## What You CAN Use

### React Hooks
The project includes React 18. Use any hooks you want:
- `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, `useReducer`

### HTML5 Canvas
Best approach for action/arcade games. Use a `<canvas>` element with `useRef`:
```jsx
const canvasRef = useRef(null);
useEffect(() => {
  const ctx = canvasRef.current.getContext("2d");
  // draw stuff
}, []);
return <canvas ref={canvasRef} width={800} height={600} />;
```

### React DOM Elements
Fine for puzzle games, card games, board games, or anything tile/grid-based. Just use divs, spans, and inline styles.

### Inline Styles Only
No CSS files, no CSS modules, no styled-components. Everything is inline `style={{}}` objects. This keeps each game as a single file.

```jsx
// YES - inline styles
<div style={{ color: "red", fontSize: 24 }}>Score: 100</div>

// NO - don't do this
import "./MyGame.css";
```

### Web Audio API
For sound effects, use the Web Audio API directly:
```jsx
const playBeep = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.frequency.value = 440;
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};
```

### Google Fonts (via @import in a style tag)
```jsx
useEffect(() => {
  const style = document.createElement("style");
  style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}, []);
```

### CDN Libraries (loaded at runtime)
If you need a library that isn't bundled, load it dynamically:
```jsx
useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js";
  script.onload = () => { /* window.Matter is now available */ };
  document.head.appendChild(script);
}, []);
```

---

## What You CANNOT Use

| Don't use | Why | Use instead |
|-----------|-----|-------------|
| Separate `.css` files | Breaks single-file rule | Inline `style={{}}` |
| `import image from "./pic.png"` | No asset pipeline per game | Canvas drawing, emoji, SVG inline, or data URIs |
| Node.js / server-side code | Container only serves static files | Everything runs in the browser |
| `localStorage` | Works but data doesn't persist across container rebuilds | Fine for high scores during a session |
| External API calls | Container has no backend | Keep games fully client-side |
| TypeScript `.tsx` | Project is plain JS | Use `.jsx` |
| Tailwind / CSS-in-JS libs | Not installed | Inline styles |
| Files outside the game folder | Keep all game code in `src/games/GameName/` | Use `./constants.js`, `./utils.js` siblings |

---

## Recommended Game Patterns

### Canvas Game Loop (action/arcade games)
```jsx
const gameLoop = useCallback((timestamp) => {
  update(deltaTime);   // physics, collisions, AI
  render(ctx);         // draw everything
  requestAnimationFrame(gameLoop);
}, []);

useEffect(() => {
  const id = requestAnimationFrame(gameLoop);
  return () => cancelAnimationFrame(id);
}, [gameLoop]);
```

### React State Game (puzzle/board/card games)
```jsx
const [board, setBoard] = useState(initialBoard);
const [score, setScore] = useState(0);

const handleClick = (row, col) => {
  setBoard(prev => {
    const next = [...prev];
    // game logic
    return next;
  });
};

return (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 60px)" }}>
    {board.map((cell, i) => (
      <div key={i} onClick={() => handleClick(i)} style={{...}}>
        {cell}
      </div>
    ))}
  </div>
);
```

---

## Images and Art

Since you can't import image files, here are your options (best to worst):

1. **Canvas drawing** — draw everything procedurally (what Fish for Fruit does)
2. **Emoji** — surprisingly effective for game objects: 🐟 🍎 🛡️ ⚡ 👻
3. **Inline SVG** — embed SVG directly in JSX for complex shapes
4. **Data URI** — base64-encode small images directly in code:
   ```jsx
   const sprite = "data:image/png;base64,iVBORw0KGgo...";
   <img src={sprite} alt="" />
   ```
5. **External URLs** — load from a CDN (requires internet, may break)

---

## Input Handling

### Keyboard
```jsx
useEffect(() => {
  const onKey = (e) => { keysRef.current[e.key] = true; };
  const offKey = (e) => { keysRef.current[e.key] = false; };
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", offKey);
  return () => {
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", offKey);
  };
}, []);
```

### Touch (mobile support)
Always add touch controls if your game uses keyboard input. A virtual joystick for movement + action buttons works well. See `FishForFruit/index.jsx` for a full implementation.

### Mouse / Click
```jsx
<canvas
  ref={canvasRef}
  onClick={(e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleClick(x, y);
  }}
/>
```

---

## Adding Your Game to the Arcade

### Step 1: Create the game folder
```
src/games/YourGame/index.jsx
```
Create the folder `src/games/YourGame/` and put your component in `index.jsx`. The `React.lazy` import in `App.js` (`import('./games/YourGame')`) automatically resolves to this file via webpack module resolution.

### Step 2: Add the route in `src/App.js`
```jsx
const YourGame = React.lazy(() => import('./games/YourGame'));

// Inside <Routes>:
<Route path="/your-game" element={
  <GamePageWrapper path="/your-game"><YourGame /></GamePageWrapper>
} />
```

### Step 3: Add the gallery card in `src/Gallery.jsx`
Add to the `GAMES` array:
```js
{
  id: 'your-game',
  title: 'Your Game',
  subtitle: 'a witty tagline',
  emoji: '🎮',
  path: '/your-game',
  colors: ['#fee440', '#b537f2'],   // two accent colors for the card
  description: 'One or two sentences about the game.',
  tags: ['arcade', 'puzzle'],
},
```

### Step 4: Rebuild
```bash
docker compose up --build -d
```

---

## Asking Claude to Make Games

When asking Claude (or any AI) to generate a game for this arcade, use a prompt like:

> Create a [game type] game for the Odd Noodle Games arcade. Place it in `src/games/YourGameName/index.jsx`.
> Requirements:
> - Folder-based entry point (`index.jsx`), default export, all inline styles
> - Uses HTML5 Canvas for rendering (or React DOM for board games)
> - Includes keyboard controls AND touch controls for mobile
> - Import React hooks from "react" and useNavigate from "react-router-dom"
> - Include a back button: `<div onClick={() => navigate("/")}>`
> - No external CSS, no image imports, no TypeScript
> - Include a start screen, gameplay, and game over screen

---

## Checklist Before Adding a Game

- [ ] Game lives in `src/games/GameName/index.jsx`
- [ ] `export default function GameName()`
- [ ] Imports only `react` and `react-router-dom`
- [ ] Has `← ARCADE` back button using `useNavigate`
- [ ] All styles are inline
- [ ] No image file imports
- [ ] Works on desktop (keyboard)
- [ ] Works on mobile (touch controls)
- [ ] Has a menu/start screen
- [ ] Has a game over screen
- [ ] Cleans up event listeners and animation frames in `useEffect` returns
