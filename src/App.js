import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Gallery from './Gallery';

/*
  ============================================================
  HOW TO ADD A NEW GAME:
  ============================================================
  1. Create your game component in src/games/YourGame.jsx
  2. Add a React.lazy import below
  3. Add a <Route> inside <Routes> pointing to your component
  4. Add an entry to the GAMES array in Gallery.jsx
  5. Rebuild the Docker image: docker compose up --build
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

// Page title map — keeps browser tabs and bookmarks useful
const PAGE_TITLES = {
  '/fish-for-fruit': 'Fish for Fruit',
  '/number-nomad': 'Number Nomad',
  '/embassy-of-oddballs': 'Embassy of Oddballs',
  '/gravity-lab': 'Gravity Lab',
  '/debug-dynasty': 'Debug Dynasty',
  '/math-practice-room': 'Math Practice Room',
  '/relativistic-racer_arcade': 'Relativistic Racer',
};

// Scroll to top + update document title on every route change
function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const gameTitle = PAGE_TITLES[pathname];
    document.title = gameTitle
      ? `${gameTitle} — Odd Noodle Games`
      : 'Odd Noodle Games';
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
          <Route path="/fish-for-fruit" element={<FishForFruit />} />
          <Route path="/number-nomad" element={<NumberNomad />} />
          <Route path="/embassy-of-oddballs" element={<EmbassyOfOddballs />} />
          <Route path="/gravity-lab" element={<GravityLab />} />
          <Route path="/debug-dynasty" element={<DebugDynasty />} />
          <Route path="/math-practice-room" element={<MathPracticeRoom />} />
          <Route path="/relativistic-racer_arcade" element={<RelativisticRacer_Arcade />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </>
  );
}
