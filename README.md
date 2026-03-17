# 🎮 Game Arcade

A self-hosted collection of web games, served from a single Docker container.

## Quick Start

```bash
# Build and run
docker compose up --build -d

# Open in browser
open http://localhost:8080
```

That's it. The site is now running on port 8080.

## Project Structure

```
game-arcade/
├── Dockerfile              # Multi-stage: node build → nginx serve
├── docker-compose.yml      # One-command deployment
├── nginx/
│   └── default.conf        # SPA routing + caching + gzip
├── public/
│   └── index.html
└── src/
    ├── index.js            # Entry point
    ├── App.js              # Router (add game routes here)
    ├── Gallery.jsx         # Landing page with game cards
    └── games/
        └── FishForFruit.jsx  # First game
```

## Adding a New Game

1. **Create the game component** in `src/games/YourGame.jsx`
   - Export a default React component
   - Import `useNavigate` from `react-router-dom` for the back button

2. **Register the route** in `src/App.js`:
   ```jsx
   import YourGame from './games/YourGame';
   // Inside <Routes>:
   <Route path="/your-game" element={<YourGame />} />
   ```

3. **Add a gallery card** in `src/Gallery.jsx` — add to the `GAMES` array:
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

4. **Rebuild and deploy**:
   ```bash
   docker compose up --build -d
   ```

## Deploying to a VM

```bash
# Copy the project to your VM
scp -r game-arcade/ user@your-vm:/home/user/game-arcade

# SSH in and run
ssh user@your-vm
cd game-arcade
docker compose up --build -d
```

### With a domain name (optional)

Put a reverse proxy (Caddy is easiest) in front:

```bash
# Install Caddy on the VM, then:
sudo caddy reverse-proxy --from yourdomain.com --to localhost:8080
```

Or add a Caddy service to docker-compose.yml for automatic HTTPS.

## Useful Commands

```bash
# Start
docker compose up -d

# Rebuild after adding a game
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Check container size (typically ~25MB)
docker images game-arcade-game-arcade
```

## Technical Details

- **Build stage**: Node 20 Alpine compiles the React app
- **Serve stage**: nginx Alpine serves the static build (~25MB total image)
- **Routing**: nginx `try_files` handles SPA client-side routing
- **Caching**: Static assets cached for 1 year with immutable headers
- **Compression**: Gzip enabled for all text-based assets
