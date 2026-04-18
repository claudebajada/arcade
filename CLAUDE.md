# Claude Instructions

This is **Odd Noodle Games** (https://oddnoodlegames.com) — a Docker-hosted React arcade of kid-friendly browser games.

Read `@AGENTS.md` for all project rules, architecture, coding standards, and commands.

## What kind of task is this?

Requests for this project are not always game creation. Identify the category first, then follow the guidance for that type:

- **New game** — follow the "Adding a New Game" workflow in AGENTS.md; read GAME_GUIDE.md before writing code.
- **Documentation update** — edit only the relevant file(s) (AGENTS.md, CLAUDE.md, GAME_GUIDE.md, README.md, or in-code comments); preserve all existing content unless explicitly asked to remove it.
- **To-do / Roadmap** — create or update `TODO.md` at the repo root; do not touch source code.
- **Bug fix / Refactoring** — read `src/games/[GameName]/index.jsx` and the Coding Standards section of AGENTS.md; preserve the folder-per-game structure and inline-styles-only constraint.
- **Infrastructure / Docker / deployment** — see README.md; changes go in `Dockerfile`, `docker-compose.yml`, or `nginx/default.conf`.
- **SEO / Metadata** — touch `public/index.html`, `public/sitemap.xml`, `src/App.js` (PAGE_META), or `src/components/GamePageWrapper.jsx` as needed.
- **Other** — apply the coding standards and architecture rules from AGENTS.md; ask for clarification if the task type is ambiguous.
