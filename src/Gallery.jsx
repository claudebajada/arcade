import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/*
  Add new games to this array.
  Each entry becomes a card on the gallery page.
*/
const GAMES = [
  {
    id: 'fish-for-fruit',
    title: 'Fish for Fruit',
    subtitle: 'an identity crisis in the deep',
    emoji: '🐟',
    path: '/fish-for-fruit',
    colors: ['#00f5d4', '#ff2d95'],
    description: 'Transform between fish and fruit in this surreal underwater arcade game. Dodge divers, eat falling fruit, and collect power-ups.',
    tags: ['arcade', 'action', 'weird'],
  },
  {
    id: 'number-nomad',
    title: 'Number Nomad',
    subtitle: 'a maths platformer on graph paper',
    emoji: '✏️',
    path: '/number-nomad',
    colors: ['#48bb78', '#4d96ff'],
    description: 'Jump, dash and wall-slide through hand-drawn worlds. Collect the right equation pieces, dodge erasers, and solve your way to the next level.',
    tags: ['platformer', 'maths', 'educational'],
  },
  {
    id: 'embassy-of-oddballs',
    title: 'Embassy of Oddballs',
    subtitle: 'absurd crises demand absurd diplomacy',
    emoji: '🏛️',
    path: '/embassy-of-oddballs',
    colors: ['#d4a847', '#e85d5d'],
    description: 'Match real countries to solve ridiculous international crises. All 193 UN member states. Learn the world — one oddball crisis at a time.',
    tags: ['strategy', 'geography', 'educational'],
  },
  {
    id: 'gravity-lab',
    title: 'Gravity Lab',
    subtitle: 'bend gravity, guide the comet!',
    emoji: '🌌',
    path: '/gravity-lab',
    colors: ['#7c3aed', '#06b6d4'],
    description: "Place planets to bend a comet's path with gravity. Solve 8 space puzzles and learn how gravity works!",
    tags: ['strategy', 'science', 'puzzle'],
  },
  // {
  //   id: 'your-next-game',
  //   title: 'Your Next Game',
  //   subtitle: 'a tagline goes here',
  //   emoji: '🎮',
  //   path: '/your-next-game',
  //   colors: ['#fee440', '#b537f2'],
  //   description: 'Description of your game.',
  //   tags: ['genre'],
  // },
];

// Keyframe animations + Google Fonts injected once into <head>
const ANIM_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=Righteous&family=Nunito:wght@400;700;900&display=swap');

  @keyframes wobble {
    0%,100% { transform: skewX(0deg); }
    25%      { transform: skewX(-1.5deg) scaleY(1.01); }
    75%      { transform: skewX(1.5deg)  scaleY(0.99); }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes blobpulse {
    0%,100% { transform: scale(1); }
    50%     { transform: scale(1.15); }
  }
  @keyframes floatdot {
    0%,100% { transform: translateY(0);     opacity: .8; }
    50%     { transform: translateY(-10px); opacity: 1;  }
  }
  @keyframes starwiggle {
    0%,100% { transform: rotate(0deg)  scale(1);   }
    50%     { transform: rotate(20deg) scale(1.2); }
  }
`;

export default function Gallery() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const [darkMode, setDarkMode] = useState(true);

  // Inject fonts + keyframes once
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = ANIM_STYLES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Animated background canvas — re-runs when darkMode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0;

    const darkPColors  = ['#ff3cac', '#ffe066', '#48dbfb', '#7c00ff', '#ff9f43'];
    const lightPColors = ['#fb7185', '#f59e0b', '#c084fc', '#818cf8', '#34d399'];

    const resize = () => {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 70 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 1.5 + Math.random() * 3,
      speed: 0.3 + Math.random() * 0.6,
      wobble: Math.random() * Math.PI * 2,
      colorIdx: i % 5,
    }));

    const loop = (ts) => {
      timeRef.current = ts / 1000;
      const t = timeRef.current;

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      if (darkMode) {
        bg.addColorStop(0,   '#0d0028');
        bg.addColorStop(0.5, '#08001a');
        bg.addColorStop(1,   '#050010');
      } else {
        bg.addColorStop(0,   '#f0eaff');
        bg.addColorStop(0.5, '#fce7f3');
        bg.addColorStop(1,   '#e0f2fe');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Soft light rays
      const rayColors = darkMode
        ? ['#7c00ff', '#ff3cac', '#48dbfb', '#ffe066']
        : ['#c084fc', '#fb7185', '#67e8f9', '#fde68a'];
      ctx.globalAlpha = darkMode ? 0.04 : 0.06;
      for (let i = 0; i < 4; i++) {
        const rx = w * 0.12 + i * w * 0.25 + Math.sin(t * 0.18 + i) * 50;
        ctx.beginPath();
        ctx.moveTo(rx - 20, 0);
        ctx.lineTo(rx - 100, h);
        ctx.lineTo(rx + 100, h);
        ctx.lineTo(rx + 20, 0);
        ctx.closePath();
        ctx.fillStyle = rayColors[i];
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Floating colour particles
      const pColors = darkMode ? darkPColors : lightPColors;
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += Math.sin(p.wobble + t * 0.7) * 0.4;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }

        ctx.globalAlpha = darkMode ? 0.55 : 0.45;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = pColors[p.colorIdx];
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [darkMode]);

  const dm = darkMode;

  // ── Theme tokens ──────────────────────────────────────────────
  const pageColor   = dm ? '#f0e6ff'  : '#1a0a2e';
  const cardBg      = dm ? '#0d0b2b'  : '#ffffff';
  const cardBorder  = dm ? '#2a1a5e'  : '#e9d5ff';
  const subtitleClr = dm ? '#9d7fcb'  : '#7c3aed';
  const descClr     = dm ? '#b09fd4'  : '#4c1d95';
  const tagBorder   = dm ? '#3a2070'  : '#ddd6fe';
  const tagClr      = dm ? '#a78bfa'  : '#6d28d9';
  const footerClr   = dm ? '#5a3a8a'  : '#9061c2';

  // Logo card
  const logoBg      = dm ? '#0b0b1e'  : '#ffffff';
  const logoShadow  = dm
    ? '0 0 80px #7c00ff22, 0 0 30px #ff3cac11'
    : '0 8px 60px #c084fc33, 0 2px 20px #fb718522';
  const gridLine    = dm ? 'rgba(124,0,255,0.07)' : 'rgba(192,132,252,0.10)';
  const blob1Bg     = dm
    ? 'radial-gradient(circle, #7c00ff22 0%, transparent 70%)'
    : 'radial-gradient(circle, #e9d5ff55 0%, transparent 70%)';
  const blob2Bg     = dm
    ? 'radial-gradient(circle, #ff3cac22 0%, transparent 70%)'
    : 'radial-gradient(circle, #fce7f355 0%, transparent 70%)';
  const bowlFilter  = dm
    ? 'drop-shadow(0 0 16px #ff3cac77) drop-shadow(0 0 32px #7c00ff44)'
    : 'drop-shadow(0 0 12px #fb718566) drop-shadow(0 0 20px #c084fc44)';

  const oddColor    = dm ? '#ff3cac' : '#db2777';
  const oddShadow   = dm
    ? '0 0 20px #ff3cac99, 0 0 60px #ff3cac44, 3px 3px 0 #7c00ff'
    : '2px 3px 0 #f9a8d4, 0 0 20px #fb718544';
  const noodleColor = dm ? '#ffe066' : '#f59e0b';
  const noodleShadow = dm
    ? '0 0 20px #ff9f4399, 0 0 50px #ff9f4333, 3px 3px 0 #ff6b35'
    : '2px 3px 0 #fde68a, 0 0 20px #f59e0b44';
  const shimmerBg   = dm
    ? 'linear-gradient(90deg, transparent, #7c00ff, #ff3cac, #ffe066, transparent)'
    : 'linear-gradient(90deg, transparent, #c084fc, #fb7185, #f59e0b, transparent)';
  const shimmerShadow = dm ? '0 0 8px #ff3cac' : '0 0 6px #fb7185';
  const gamesStroke = dm ? '#48dbfb' : '#7c00ff';
  const gamesShadow = dm ? '0 0 16px #48dbfb88' : '0 0 12px #7c00ff55';

  // Toggle
  const pillBg      = dm
    ? 'linear-gradient(90deg, #7c00ff, #ff3cac)'
    : 'linear-gradient(90deg, #c084fc, #fb7185)';
  const pillShadow  = dm ? '0 0 12px #ff3cac55' : '0 0 10px #fb718544';
  const lblClr      = dm ? '#ffffff' : '#333333';

  const dotColors   = dm
    ? ['#ff3cac', '#ffe066', '#48dbfb', '#7c00ff']
    : ['#fb7185', '#f59e0b', '#c084fc', '#7c00ff'];
  const starColors  = dm
    ? ['#ff3cac', '#ffe066', '#48dbfb', '#7c00ff']
    : ['#db2777', '#f59e0b', '#7c00ff', '#c084fc'];

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      fontFamily: "'Nunito', 'Baloo 2', sans-serif",
      color: pageColor,
      overflow: 'auto',
      transition: 'color 0.4s',
    }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 960,
        margin: '0 auto',
        padding: '48px 24px 80px',
      }}>

        {/* ── Dark / Light toggle ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          marginBottom: 28,
        }}>
          <span style={{
            fontFamily: "'Righteous', sans-serif",
            fontSize: 12,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: lblClr,
            opacity: dm ? 1 : 0.4,
            transition: 'opacity 0.3s',
            userSelect: 'none',
          }}>☾ Dark</span>

          <button
            onClick={() => setDarkMode(!dm)}
            style={{
              width: 56, height: 28,
              borderRadius: 14,
              cursor: 'pointer',
              position: 'relative',
              background: pillBg,
              boxShadow: pillShadow,
              border: 'none', outline: 'none',
              transition: 'background 0.4s, box-shadow 0.4s',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute',
              top: 3,
              left: dm ? 3 : 31,
              width: 22, height: 22,
              borderRadius: '50%',
              background: 'white',
              transition: 'left 0.35s cubic-bezier(.4,0,.2,1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
            }}>
              {dm ? '☾' : '☀'}
            </div>
          </button>

          <span style={{
            fontFamily: "'Righteous', sans-serif",
            fontSize: 12,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: lblClr,
            opacity: dm ? 0.4 : 1,
            transition: 'opacity 0.3s',
            userSelect: 'none',
          }}>☀ Light</span>
        </div>

        {/* ── Logo header card ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 52 }}>
          <div style={{
            position: 'relative',
            width: 'min(620px, 100%)',
            borderRadius: 32,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: logoBg,
            boxShadow: logoShadow,
            transition: 'background 0.5s, box-shadow 0.5s',
          }}>
            {/* Grid overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px),
                                linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }} />

            {/* Glow blobs */}
            <div style={{
              position: 'absolute', top: -40, left: -30,
              width: 220, height: 180, borderRadius: '50%', pointerEvents: 'none',
              background: blob1Bg,
              animation: 'blobpulse 4s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', bottom: -40, right: -20,
              width: 220, height: 180, borderRadius: '50%', pointerEvents: 'none',
              background: blob2Bg,
              animation: 'blobpulse 4s ease-in-out infinite',
              animationDelay: '2s',
            }} />

            {/* Decorative dots */}
            {[
              { top: 22, left: 28,   width: 7, height: 7, animationDuration: '3.2s', idx: 0 },
              { top: 35, right: 38,  width: 5, height: 5, animationDuration: '2.6s', idx: 1 },
              { bottom: 28, left: 48, width: 6, height: 6, animationDuration: '3.8s', idx: 2 },
              { bottom: 35, right: 55, width: 5, height: 5, animationDuration: '2.9s', idx: 3 },
            ].map((d, i) => {
              const { idx, ...pos } = d;
              return (
                <div key={i} style={{
                  position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
                  background: dotColors[idx],
                  boxShadow: `0 0 8px ${dotColors[idx]}`,
                  animation: 'floatdot ease-in-out infinite',
                  ...pos,
                }} />
              );
            })}

            {/* Decorative stars */}
            {[
              { top: 18,   left: 18,  fontSize: 16, animationDelay: '0s',   char: '✦', idx: 0 },
              { top: 14,   right: 24, fontSize: 16, animationDelay: '1s',   char: '★', idx: 1 },
              { bottom: 18, left: 20, fontSize: 13, animationDelay: '0.5s', char: '✦', idx: 2 },
              { top: '40%', right: 14, fontSize: 19, animationDelay: '1.5s', char: '✦', idx: 3 },
            ].map((s, i) => {
              const { char, idx, ...pos } = s;
              return (
                <div key={i} style={{
                  position: 'absolute', pointerEvents: 'none',
                  animation: 'starwiggle 4s ease-in-out infinite',
                  color: starColors[idx],
                  filter: `drop-shadow(0 0 5px ${starColors[idx]})`,
                  ...pos,
                }}>
                  {char}
                </div>
              );
            })}

            {/* Content row */}
            <div style={{
              position: 'relative', zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: '24px 32px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {/* Bowl SVG */}
              <svg
                width="130" height="142"
                viewBox="0 0 148 162"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0, filter: bowlFilter, transition: 'filter 0.5s' }}
              >
                <defs>
                  <linearGradient id="logoRimG" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stopColor="#ffe066"/>
                    <stop offset="100%" stopColor="#ff9f43"/>
                  </linearGradient>
                  <linearGradient id="logoBowlG" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stopColor="#48DBFB"/>
                    <stop offset="100%" stopColor="#0652DD"/>
                  </linearGradient>
                  <linearGradient id="logoNoodleG" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#ffe066"/>
                    <stop offset="50%"  stopColor="#ff9f43"/>
                    <stop offset="100%" stopColor="#ff3cac"/>
                  </linearGradient>
                  <filter id="logoGlow">
                    <feGaussianBlur stdDeviation="2.5" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                {/* Steam */}
                <path d="M54 70 Q47 55 54 40 Q61 25 54 12" stroke="#ffffff55" strokeWidth="4" fill="none" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="translate" values="0,0;-3,-5;0,0" dur="2s" repeatCount="indefinite"/>
                </path>
                <path d="M74 66 Q67 50 74 36 Q81 22 74 9" stroke="#ffffff66" strokeWidth="3.5" fill="none" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="translate" values="0,0;3,-6;0,0" dur="2.5s" repeatCount="indefinite"/>
                </path>
                <path d="M94 68 Q87 53 94 39 Q101 25 94 12" stroke="#ffffff55" strokeWidth="4" fill="none" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="translate" values="0,0;-2,-5;0,0" dur="1.8s" repeatCount="indefinite"/>
                </path>
                {/* Rim */}
                <ellipse cx="74" cy="78" rx="66" ry="13" fill="url(#logoRimG)" filter="url(#logoGlow)"/>
                <ellipse cx="74" cy="78" rx="66" ry="13" fill="none" stroke="#ffe066" strokeWidth="1.5" opacity="0.5"/>
                {/* Bowl body */}
                <path d="M8 78 Q12 148 74 154 Q136 148 140 78 Z" fill="url(#logoBowlG)"/>
                <path d="M22 90 Q24 140 74 148" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.15"/>
                {/* Noodles */}
                <path d="M22 82 Q36 72 50 82 Q64 92 78 82 Q92 72 106 82 Q120 92 130 82"
                      stroke="url(#logoNoodleG)" strokeWidth="6" fill="none" strokeLinecap="round" filter="url(#logoGlow)"/>
                <path d="M26 92 Q40 80 56 92 Q70 104 86 92 Q100 80 116 92 Q126 100 132 92"
                      stroke="#ff3cac" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7"/>
                <path d="M30 76 Q38 64 46 72" stroke="#ffe066" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
                <path d="M100 72 Q110 62 116 70" stroke="#ff9f43" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
                {/* Chopsticks */}
                <rect x="100" y="36" width="5.5" height="66" rx="2.8" fill="#c0392b" transform="rotate(14,100,68)"/>
                <rect x="116" y="36" width="5.5" height="66" rx="2.8" fill="#e74c3c" transform="rotate(5,116,68)"/>
              </svg>

              {/* Text block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{
                  fontFamily: "'Righteous', 'Arial Black', sans-serif",
                  fontSize: 'clamp(44px, 7vw, 70px)',
                  fontWeight: 900, lineHeight: 1, letterSpacing: 5,
                  color: oddColor, textShadow: oddShadow,
                  transition: 'color 0.4s, text-shadow 0.4s',
                }}>ODD</div>

                <div style={{
                  fontFamily: "'Boogaloo', 'Comic Sans MS', cursive",
                  fontSize: 'clamp(48px, 8vw, 76px)',
                  fontWeight: 400, lineHeight: 1, letterSpacing: 1,
                  color: noodleColor, textShadow: noodleShadow,
                  animation: 'wobble 3s ease-in-out infinite',
                  display: 'inline-block',
                  transition: 'color 0.4s, text-shadow 0.4s',
                }}>NOODLE</div>

                <div style={{
                  height: 3, borderRadius: 2, margin: '5px 0',
                  background: shimmerBg, backgroundSize: '200% 100%',
                  animation: 'shimmer 2.5s linear infinite',
                  boxShadow: shimmerShadow,
                  transition: 'box-shadow 0.4s',
                }} />

                <div style={{
                  fontFamily: "'Righteous', 'Arial Black', sans-serif",
                  fontSize: 'clamp(20px, 3.5vw, 36px)',
                  fontWeight: 900, letterSpacing: 12,
                  color: 'transparent',
                  WebkitTextStroke: `2px ${gamesStroke}`,
                  textShadow: gamesShadow,
                  transition: 'text-shadow 0.4s',
                }}>GAMES</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Game grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))',
          gap: 28,
        }}>
          {GAMES.map((game) => {
            const isHovered = hovered === game.id;
            return (
              <div
                key={game.id}
                onClick={() => navigate(game.path)}
                onMouseEnter={() => setHovered(game.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'relative',
                  background: cardBg,
                  border: `2px solid ${isHovered ? game.colors[0] + 'cc' : cardBorder}`,
                  borderRadius: 20,
                  padding: '32px 28px 48px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'none',
                  boxShadow: isHovered
                    ? `0 16px 50px ${game.colors[0]}30, 0 0 80px ${game.colors[1]}15`
                    : dm
                      ? '0 4px 24px rgba(0,0,0,0.5)'
                      : '0 4px 24px rgba(124,0,255,0.08)',
                  overflow: 'hidden',
                  minHeight: 220,
                }}
              >
                {/* Top colour bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                  background: `linear-gradient(90deg, ${game.colors[0]}, ${game.colors[1]})`,
                  opacity: isHovered ? 1 : 0.5,
                  transition: 'opacity 0.3s',
                  borderRadius: '18px 18px 0 0',
                }} />

                {/* Corner glow */}
                <div style={{
                  position: 'absolute', top: -50, right: -50,
                  width: 150, height: 150, borderRadius: '50%', pointerEvents: 'none',
                  background: `radial-gradient(circle, ${game.colors[0]}18, transparent)`,
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.4s',
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, position: 'relative' }}>
                  {/* Emoji */}
                  <div style={{
                    fontSize: 52, lineHeight: 1, flexShrink: 0,
                    filter: isHovered ? `drop-shadow(0 0 14px ${game.colors[0]}88)` : 'none',
                    transition: 'filter 0.3s',
                  }}>
                    {game.emoji}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h2 style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 22, fontWeight: 900, lineHeight: 1.2,
                      color: isHovered ? game.colors[0] : pageColor,
                      transition: 'color 0.3s',
                      marginBottom: 4,
                    }}>
                      {game.title}
                    </h2>

                    <p style={{
                      fontSize: 13, fontStyle: 'italic',
                      color: subtitleClr, marginBottom: 12, letterSpacing: 0.3,
                    }}>
                      {game.subtitle}
                    </p>

                    <p style={{
                      fontSize: 14, color: descClr, lineHeight: 1.65, marginBottom: 18,
                    }}>
                      {game.description}
                    </p>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {game.tags.map((tag) => (
                        <span key={tag} style={{
                          fontSize: 11, fontWeight: 700,
                          color: isHovered ? game.colors[0] : tagClr,
                          border: `1.5px solid ${isHovered ? game.colors[0] + '80' : tagBorder}`,
                          borderRadius: 20,
                          padding: '3px 12px',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          transition: 'color 0.3s, border-color 0.3s',
                          background: isHovered ? game.colors[0] + '12' : 'transparent',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Play button */}
                <div style={{
                  position: 'absolute', bottom: 14, right: 18,
                  fontSize: 12, fontWeight: 900,
                  fontFamily: "'Nunito', sans-serif",
                  letterSpacing: 1.5, textTransform: 'uppercase',
                  padding: '6px 18px', borderRadius: 20,
                  background: isHovered
                    ? `linear-gradient(135deg, ${game.colors[0]}, ${game.colors[1]})`
                    : 'transparent',
                  color: isHovered ? '#fff' : game.colors[0],
                  border: `1.5px solid ${game.colors[0]}`,
                  transition: 'all 0.25s',
                  opacity: isHovered ? 1 : 0.65,
                  userSelect: 'none',
                }}>
                  Play →
                </div>
              </div>
            );
          })}

          {/* Coming soon card */}
          {GAMES.length < 4 && (
            <div style={{
              background: dm ? '#0a0c2040' : '#ffffff60',
              border: `2px dashed ${dm ? '#2a1a5e' : '#ddd6fe'}`,
              borderRadius: 20,
              padding: '32px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 220,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>🎮</div>
                <p style={{
                  color: dm ? '#4a2a7a' : '#a78bfa',
                  fontSize: 13, fontWeight: 700,
                  letterSpacing: 2, textTransform: 'uppercase',
                }}>
                  More games coming soon!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          textAlign: 'center', marginTop: 64,
          color: footerClr, fontSize: 13, fontWeight: 700, letterSpacing: 1,
        }}>
          Odd Noodle Games — play, learn, be weird 🍜
        </div>
      </div>
    </div>
  );
}
