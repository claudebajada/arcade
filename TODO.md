# Odd Noodle Games — TODO & Roadmap

## Priority — Must Do First

- [ ] Create an About page
- [ ] Add a Contact page or contact email
- [ ] Publish a Privacy Policy
- [ ] Publish Terms of Service
- [ ] Add a clear Home button on every game page
- [ ] Add a visible site-wide navigation/menu
- [ ] Check that all broken or placeholder routes are fixed
- [ ] Add basic accessibility support across the site

---

## New Games

- [ ] **Typing Trainer** — keyboard skills; type falling words before they hit the ground
- [ ] **Color Lab** — mix primary colors to match a target; art + science education
- [ ] **Times Table Blaster** — arcade-style multiplication practice
- [ ] **Fraction Frenzy** — fractions and equivalent-fraction matching puzzles
- [ ] **Rhythm Tapper** — tap along to a beat; complements UkuleleQuest & NoteQuest
- [ ] **World Capitals Quiz** — geography follow-up to Embassy of Oddballs; match capitals to countries

> Target 12 games total — Gallery shows a "Coming Soon" placeholder card for odd game counts, so adding 1 game at a time is fine.

---

## Existing Game Improvements

- [ ] **NoteQuest** (137 KB) — largest file in the project; profile for performance if load times degrade
- [ ] **EmbassyOfOddballs** (84 KB) — consider lazy-loading country data arrays to reduce initial parse time
- [ ] **All games** — audit mobile touch controls end-to-end on a real device
- [ ] **All games** — verify every interactive element meets the 44 × 44 px minimum tap-target size (AGENTS.md standard)
- [ ] **Gallery dark/light mode** — persist preference to `localStorage` so it survives page refreshes

### Ukulele Quest
- [ ] Add clearer onboarding for first-time users
- [ ] Add progressive difficulty for note finding and chord building
- [ ] Add more chord libraries and practice modes
- [ ] Add audio feedback for notes/chords
- [ ] Add teacher-led classroom instructions page

### Note Quest
- [ ] Add review mode for missed questions
- [ ] Add more paths and more question banks
- [ ] Add spaced repetition or adaptive difficulty
- [ ] Add clearer progress indicators by topic
- [ ] Add better audio replay/help UX

### Math Practice Room
- [ ] Add more arithmetic categories
- [ ] Add clearer explanation of strategies like doubles and bridging
- [ ] Add adaptive difficulty
- [ ] Add optional timed mode and untimed mastery mode
- [ ] Add session summary with strengths and weak spots

### Number Nomad
- [ ] Add more worlds/levels
- [ ] Add smoother difficulty scaling by grade
- [ ] Improve readability of equations during motion
- [ ] Add better checkpointing
- [ ] Add more explicit learning feedback after each level

### Embassy of Oddballs
- [ ] Add country facts after each round
- [ ] Add map-based reinforcement
- [ ] Add region-focused modes
- [ ] Add difficulty options by continent/region
- [ ] Add classroom pack for geography teachers

### Gravity Lab
- [ ] Add more puzzles
- [ ] Add a sandbox mode
- [ ] Add clearer visualisation of trajectories before launch
- [ ] Add short explanations of the physics concept after each puzzle
- [ ] Add progression from simple to more advanced gravity ideas

### Relativistic Racer
- [ ] Make the relativity concept even clearer during play
- [ ] Add better visual explanation of time dilation
- [ ] Add post-level science summaries
- [ ] Tune the balance between arcade play and learning
- [ ] Add accessibility options for fast motion and flashing visuals

### Fish for Fruit
- [ ] Clarify rules sooner for first-time players
- [ ] Add more variety in hazards and levels
- [ ] Add a gentler early difficulty curve
- [ ] Add clearer scoring and survival feedback
- [ ] Decide whether the educational angle should be strengthened or presented as arcade-first

### Debug Dynasty
- [ ] Add clearer explanations of programming terms
- [ ] Add a glossary for bug names/concepts
- [ ] Add difficulty levels for younger vs older players
- [ ] Add more educational framing after each round
- [ ] Add a classroom extension for coding teachers

### Enigma
- [ ] Add beginner and advanced modes
- [ ] Add clearer explanation of how the machine works
- [ ] Add more historical challenge missions
- [ ] Add optional guided walkthrough
- [ ] Add more explicit link between gameplay and cryptography concepts

---

## Accessibility

- [ ] Add alt text for meaningful images and icons
- [ ] Add proper labels for buttons and controls
- [ ] Make the site usable with keyboard only
- [ ] Improve focus states so keyboard users can see where they are
- [ ] Add a high-contrast mode
- [ ] Check colour contrast for text and UI elements
- [ ] Make text easier to read on small screens
- [ ] Review font size and spacing for children and low-vision users
- [ ] Add support for screen readers
- [ ] Reduce reliance on colour alone to communicate meaning
- [ ] Add captions or text equivalents for audio-based tasks where needed

---

## Navigation & UX

- [ ] Make it easier to return from a game page to the main game library
- [ ] Add breadcrumbs or a simple page path
- [ ] Make category tags clickable for filtering
- [ ] Add search or filtering by subject, age, or difficulty
- [ ] Add a short one-line summary for each game on the homepage
- [ ] Add a featured/new games section
- [ ] Make loading states more informative
- [ ] Review mobile and tablet layout for all game pages
- [ ] Make touch targets larger where needed
- [ ] Standardise button placement and wording across games

---

## Trust & Professionalism

- [ ] Explain who made the site
- [ ] Explain the educational purpose of the platform
- [ ] State whether progress is stored locally only
- [ ] State clearly whether no personal data is collected
- [ ] Add copyright and licensing information where relevant
- [ ] Add a short note for teachers/parents explaining suitability and intended age range
- [ ] Add a changelog or "last updated" section

---

## Progress & Profiles

- [ ] Add optional player profiles
- [ ] Add a clear save/progress explanation
- [ ] Let users resume where they left off
- [ ] Add per-player progress for shared devices
- [ ] Add optional teacher mode or classroom tracking
- [ ] Add downloadable or printable progress summaries
- [ ] Add badges/certificates for completing games or milestones

---

## Content & Learning Design

- [ ] Expand the number of levels in each game
- [ ] Add more difficulty tiers
- [ ] Add more replayable or generated content
- [ ] Add better feedback for wrong answers
- [ ] Add hints that teach, not just reveal
- [ ] Add short learning goals before each game
- [ ] Add short "what you learned" summaries after each session
- [ ] Align game content more clearly with school levels or curricula
- [ ] Add teacher notes or printable classroom resources
- [ ] Add age/level recommendations for each game

---

## SEO & Metadata

- [ ] Verify `public/og/` contains a 1200 × 630 px social-share image for every game
- [ ] Keep `public/sitemap.xml` `<lastmod>` dates in sync whenever a game is updated
- [ ] Spot-check JSON-LD schema output (generated by `RouteEffects` in `src/App.js`) with Google's Rich Results Test

---

## Infrastructure & DevOps

- [x] Add a GitHub Actions workflow that runs `npm run build` on every PR (catches build errors early)
- [x] Pin the Dockerfile `node:20` image to a specific patch version (e.g., `node:20.19.0`) for reproducible builds
- [x] Run `npm outdated` and schedule periodic dependency updates (React, react-scripts, react-router-dom)

---

## Performance & Technical Quality

- [ ] Test all games on low-powered tablets and older phones
- [ ] Improve loading speed where possible
- [ ] Compress assets where possible
- [ ] Check for layout shifts during loading
- [ ] Test all games in major browsers
- [ ] Test portrait and landscape orientations on tablets
- [ ] Add better error handling if a game fails to load
- [ ] Add analytics only if genuinely needed, and explain them clearly
- [ ] Run a basic security review of the site and game inputs

---

## Documentation

- [ ] Update `GAME_GUIDE.md` whenever a new reusable game pattern is introduced
- [ ] Add a `CONTRIBUTING.md` with a quick-start "how to add a game" summary (README focuses on Docker/infra)

---

## Nice Extras

- [ ] Add a teacher/parent landing page
- [ ] Add a "recommended order" for trying games
- [ ] Add a newsletter or update page
- [ ] Add featured collections like music, maths, science
- [ ] Add seasonal or special-event mini-games
- [ ] Add a feedback form for bug reports and suggestions
- [ ] Add printable worksheets linked to selected games
- [ ] Add multiplayer or cooperative modes where appropriate
