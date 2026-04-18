# Odd Noodle Games

Kid-friendly browser games, live at **[oddnoodlegames.com](https://oddnoodlegames.com)** — served from a single Docker container.

This repository contains the code for the official Odd Noodle Games website and browser games.

> Public repository, but **not open source**. See the `COPYRIGHT` file for usage restrictions.

## Games

| Game | Tags |
|------|------|
| 🎸 Ukulele Quest | educational, music |
| 🎶 Note Quest | educational, music |
| 🔐 Enigma | puzzle, history, educational |
| 🚀 Relativistic Racer | arcade, science |
| 🎯 Math Practice Room | educational, maths |
| 🐟 Fish for Fruit | arcade, action, weird |
| ✏️ Number Nomad | platformer, maths, educational |
| 🏛️ Embassy of Oddballs | strategy, geography, educational |
| 🌌 Gravity Lab | strategy, science, puzzle |
| 🐛 Debug Dynasty | arcade, coding |
| 💥 Times Table Blaster | arcade, maths, educational |

## Quick Start

```bash
docker compose up --build -d
```

Then visit http://localhost:8080

## Project Structure

```
arcade/
├── Dockerfile              # Multi-stage: node build → nginx serve
├── docker-compose.yml
├── nginx/
│   └── default.conf        # SPA routing + caching + gzip
├── public/
│   └── index.html
└── src/
    ├── App.js              # Router — add game routes here
    ├── Gallery.jsx         # Landing page (GAMES array + animated canvas)
    └── games/
        └── GameName/
            └── index.jsx   # One folder per game; inline styles only
```

## Adding a New Game

See `GAME_GUIDE.md` for the full guide. The short version:

1. **Create** `src/games/YourGame/index.jsx` — default-export a React component, inline styles only.

2. **Register the route** in `src/App.js`:
   ```jsx
   const YourGame = React.lazy(() => import('./games/YourGame'));
   <Route path="/your-game" element={
     <GamePageWrapper path="/your-game"><YourGame /></GamePageWrapper>
   } />
   ```

3. **Add a card** to the `GAMES` array in `src/Gallery.jsx`:
   ```js
   {
     id: 'your-game',
     title: 'Your Game',
     subtitle: 'a witty tagline',
     emoji: '🎮',
     path: '/your-game',
     colors: ['#fee440', '#b537f2'],
     description: 'What the game is about.',
     tags: ['genre', 'tags'],
   }
   ```

4. **Rebuild**:
   ```bash
   docker compose up --build -d
   ```

## Deployment

The site runs in Docker and is served behind a reverse proxy with HTTPS.

In production, Caddy is used in front of the container to handle domain routing and TLS.

```bash
sudo caddy reverse-proxy --from oddnoodlegames.com --to localhost:8080
```

To deploy from scratch:

```bash
# Copy project to VM
scp -r arcade/ user@your-vm:/home/user/arcade

# SSH in and run
ssh user@your-vm
cd arcade
docker compose up --build -d
```

## Useful Commands

```bash
docker compose up -d          # Start
docker compose up --build -d  # Rebuild after changes
docker compose logs -f        # Stream logs
docker compose down           # Stop
docker images arcade-arcade   # Check image size (~25 MB)
```

## Technical Details

- **Build**: Node 20 Alpine compiles the React app
- **Serve**: nginx Alpine serves the static build (~25 MB total image)
- **Routing**: `try_files` handles SPA client-side routing
- **Caching**: Static assets cached for 1 year with immutable headers
- **Compression**: Gzip enabled for all text assets
