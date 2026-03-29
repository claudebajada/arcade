import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Gallery from './Gallery';
import GamePageWrapper from './components/GamePageWrapper';

/*
  ============================================================
  HOW TO ADD A NEW GAME:
  ============================================================
  1. Create your game component in src/games/YourGame.jsx
  2. Add a React.lazy import below
  3. Add a <Route> inside <Routes> pointing to your component
     (wrap with <GamePageWrapper game={GAME_DATA_ENTRY}>)
  4. Add an entry to the GAMES array in Gallery.jsx
  5. Add an entry to PAGE_META below
  6. Rebuild the Docker image: docker compose up --build
  ============================================================
*/

// Lazy-load games so the initial bundle only includes the Gallery
const FishForFruit = React.lazy(() => import('./games/FishForFruit'));
const NumberNomad = React.lazy(() => import('./games/NumberNomad'));
const EmbassyOfOddballs = React.lazy(() => import('./games/EmbassyOfOddballs'));
const GravityLab = React.lazy(() => import('./games/GravityLab'));
const DebugDynasty = React.lazy(() => import('./games/DebugDynasty'));
const MathPracticeRoom = React.lazy(() => import('./games/MathPracticeRoom'));
const RelativisticRacer_Arcade = React.lazy(() => import('./games/RelativisticRacer_Arcade'));

const BASE_URL = 'https://oddnoodlegames.com';

// Per-page SEO metadata
// title format: [Game Name] | [Descriptive Keywords] | Odd Noodle Games
const PAGE_META = {
  '/fish-for-fruit': {
    title: 'Fish for Fruit | Free Underwater Arcade Game | Odd Noodle Games',
    description: 'Transform between fish and fruit in this surreal underwater arcade game. Dodge divers, eat falling fruit, and collect power-ups. Free to play, no download needed!',
    genre: ['Arcade', 'Action'],
    image: `${BASE_URL}/og/fish-for-fruit.png`,
  },
  '/number-nomad': {
    title: 'Number Nomad | Free Math Platformer Game | Odd Noodle Games',
    description: 'Jump, dash and wall-slide through hand-drawn worlds solving maths equations. A free educational platformer game for kids. Sharpen mental maths — no download needed!',
    genre: ['Platformer', 'Educational'],
    image: `${BASE_URL}/og/number-nomad.png`,
  },
  '/embassy-of-oddballs': {
    title: 'Embassy of Oddballs | Free Geography Strategy Game | Odd Noodle Games',
    description: 'Match real countries to solve ridiculous international crises. Learn all 193 UN nations through absurd diplomacy. A free geography strategy game — no download needed!',
    genre: ['Strategy', 'Geography', 'Educational'],
    image: `${BASE_URL}/og/embassy-of-oddballs.png`,
  },
  '/gravity-lab': {
    title: 'Gravity Lab | Free Space Physics Puzzle Game | Odd Noodle Games',
    description: 'Place planets to bend a comet\'s path with gravity. Solve 8 space puzzles and learn how gravity works. A free science game for kids. No download — play in your browser!',
    genre: ['Puzzle', 'Science'],
    image: `${BASE_URL}/og/gravity-lab.png`,
  },
  '/debug-dynasty': {
    title: 'Debug Dynasty | Free Arcade Coding Game | Odd Noodle Games',
    description: 'Find the glitches and squash bugs to rule the Debug Dynasty! A free coding-themed arcade game for kids that makes programming concepts fun. No download needed!',
    genre: ['Arcade', 'Coding'],
    image: `${BASE_URL}/og/debug-dynasty.png`,
  },
  '/math-practice-room': {
    title: 'Math Practice Room | Free Kids Maths Practice | Odd Noodle Games',
    description: 'Practise addition and subtraction with doubles, friends of 10, and bridging strategies. A free, cosy maths game for kids. Build number fluency — no download needed!',
    genre: ['Educational', 'Maths'],
    image: `${BASE_URL}/og/math-practice-room.png`,
  },
  '/relativistic-racer_arcade': {
    title: 'Relativistic Racer | Free Space Racing Science Game | Odd Noodle Games',
    description: "Race at near-light speed and feel Einstein's special relativity for real. The faster you fly, the slower time ticks. A free science arcade game — no download needed!",
    genre: ['Arcade', 'Science'],
    image: `${BASE_URL}/og/relativistic-racer.png`,
  },
};

// Inject or update a <script type="application/ld+json"> tag by id
function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data, null, 2);
}

// Remove a JSON-LD tag if it exists (used when navigating away from a game page)
function removeJsonLd(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Scroll to top + update document title, description, canonical, OG tags,
// Twitter Card tags, and JSON-LD schema on every route change
function RouteEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    const meta = PAGE_META[pathname];

    // ── Title ────────────────────────────────────────────────────
    document.title = meta
      ? meta.title
      : 'Odd Noodle Games — Free Browser Games for Kids';

    // ── Meta description ─────────────────────────────────────────
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) {
      descEl.setAttribute('content', meta
        ? meta.description
        : 'Odd Noodle Games — free, quirky browser games for kids! Play Fish for Fruit, Number Nomad, Embassy of Oddballs, Gravity Lab, and more. No download needed.'
      );
    }

    // ── Canonical ────────────────────────────────────────────────
    const canonical = document.getElementById('canonical-link');
    if (canonical) canonical.setAttribute('href', `${BASE_URL}${pathname}`);

    // ── Open Graph ───────────────────────────────────────────────
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', `${BASE_URL}${pathname}`);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', meta
        ? meta.title
        : 'Odd Noodle Games — Free Browser Games for Kids'
      );
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', meta
        ? meta.description
        : 'Fun, quirky browser games for kids — play free, no download needed! Arcade, puzzles, maths, and more.'
      );
    }

    const ogImage = document.getElementById('og-image');
    if (ogImage) {
      ogImage.setAttribute('content', meta
        ? meta.image
        : `${BASE_URL}/og/default.png`
      );
    }

    // ── Twitter Card ─────────────────────────────────────────────
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) {
      twTitle.setAttribute('content', meta
        ? meta.title
        : 'Odd Noodle Games — Free Browser Games for Kids'
      );
    }

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) {
      twDesc.setAttribute('content', meta
        ? meta.description
        : 'Fun, quirky browser games for kids — play free, no download needed!'
      );
    }

    const twImage = document.getElementById('twitter-image');
    if (twImage) {
      twImage.setAttribute('content', meta
        ? meta.image
        : `${BASE_URL}/og/default.png`
      );
    }

    // ── JSON-LD: per-game VideoGame + WebApplication schema ───────
    if (meta) {
      upsertJsonLd('game-schema', {
        '@context': 'https://schema.org',
        '@type': ['VideoGame', 'WebApplication'],
        name: meta.title.split(' | ')[0],
        description: meta.description,
        genre: meta.genre,
        playMode: 'SinglePlayer',
        applicationCategory: 'Game',
        operatingSystem: 'Web Browser',
        url: `${BASE_URL}${pathname}`,
        image: meta.image,
        isAccessibleForFree: true,
        author: {
          '@type': 'Organization',
          name: 'Odd Noodle Games',
          url: BASE_URL,
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      });
    } else {
      removeJsonLd('game-schema');
    }
  }, [pathname]);

  return null;
}

// Loading screen shown while a game chunk is being fetched
function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0b0020',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito', 'Baloo 2', sans-serif",
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🍜</div>
      <div style={{
        color: '#b09fd4', fontSize: 18, fontWeight: 700, letterSpacing: 2,
      }}>
        Loading...
      </div>
    </div>
  );
}

// Kid-friendly 404 page
function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(180deg, #0d0028, #050010)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito', 'Baloo 2', sans-serif",
      textAlign: 'center', padding: 24,
    }}>
      <div style={{ fontSize: 80, marginBottom: 8 }}>🍜</div>
      <h1 style={{
        fontSize: 48, fontWeight: 900,
        color: '#ffe066', margin: '0 0 12px',
        fontFamily: "'Boogaloo', 'Comic Sans MS', cursive",
      }}>
        Oops!
      </h1>
      <p style={{
        fontSize: 20, color: '#b09fd4', maxWidth: 400,
        lineHeight: 1.6, marginBottom: 32,
      }}>
        This page got lost in the noodle bowl. Let's get you back to the games!
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'linear-gradient(135deg, #ff3cac, #7c00ff)',
          color: '#fff', border: 'none', borderRadius: 24,
          padding: '14px 36px', fontSize: 18, fontWeight: 900,
          fontFamily: "'Nunito', sans-serif",
          cursor: 'pointer', letterSpacing: 1,
        }}
      >
        Take Me Home
      </button>
    </div>
  );
}

export default function App() {
  return (
    <>
      <RouteEffects />
      <React.Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/fish-for-fruit" element={
            <GamePageWrapper path="/fish-for-fruit"><FishForFruit /></GamePageWrapper>
          } />
          <Route path="/number-nomad" element={
            <GamePageWrapper path="/number-nomad"><NumberNomad /></GamePageWrapper>
          } />
          <Route path="/embassy-of-oddballs" element={
            <GamePageWrapper path="/embassy-of-oddballs"><EmbassyOfOddballs /></GamePageWrapper>
          } />
          <Route path="/gravity-lab" element={
            <GamePageWrapper path="/gravity-lab"><GravityLab /></GamePageWrapper>
          } />
          <Route path="/debug-dynasty" element={
            <GamePageWrapper path="/debug-dynasty"><DebugDynasty /></GamePageWrapper>
          } />
          <Route path="/math-practice-room" element={
            <GamePageWrapper path="/math-practice-room"><MathPracticeRoom /></GamePageWrapper>
          } />
          <Route path="/relativistic-racer_arcade" element={
            <GamePageWrapper path="/relativistic-racer_arcade"><RelativisticRacer_Arcade /></GamePageWrapper>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </>
  );
}
