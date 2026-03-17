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

export default function Gallery() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  // Animated background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * 2000,
      size: 1 + Math.random() * 3,
      speed: 0.2 + Math.random() * 0.5,
      wobble: Math.random() * Math.PI * 2,
    }));

    const loop = (ts) => {
      timeRef.current = ts / 1000;
      const t = timeRef.current;

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#06081a');
      bg.addColorStop(0.5, '#030510');
      bg.addColorStop(1, '#010208');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Light rays
      ctx.globalAlpha = 0.025;
      for (let i = 0; i < 4; i++) {
        const rx = w * 0.15 + i * w * 0.22 + Math.sin(t * 0.2 + i) * 40;
        ctx.beginPath();
        ctx.moveTo(rx - 15, 0);
        ctx.lineTo(rx - 80, h);
        ctx.lineTo(rx + 80, h);
        ctx.lineTo(rx + 15, 0);
        ctx.closePath();
        ctx.fillStyle = '#3366cc';
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Particles / bubbles
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += Math.sin(p.wobble + t) * 0.3;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }

        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      fontFamily: "'Courier New', monospace",
      color: '#e0e0f0',
      overflow: 'auto',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%', height: '100%',
          zIndex: 0,
        }}
      />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 900,
        margin: '0 auto',
        padding: '60px 24px 80px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 56px)',
            fontWeight: 'bold',
            letterSpacing: 4,
            marginBottom: 12,
            background: 'linear-gradient(135deg, #00f5d4, #ff2d95, #fee440)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            GAME ARCADE
          </h1>
          <p style={{
            color: '#4a4a7a',
            fontSize: 14,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}>
            a collection of peculiar digital experiences
          </p>
          <div style={{
            width: 80,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #00f5d450, transparent)',
            margin: '20px auto 0',
          }} />
        </div>

        {/* Game grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
          gap: 24,
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
                  background: '#0a0c20',
                  border: `1px solid ${isHovered ? game.colors[0] + '80' : '#1a1a3a'}`,
                  borderRadius: 12,
                  padding: '32px 28px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isHovered ? 'translateY(-4px)' : 'none',
                  boxShadow: isHovered
                    ? `0 8px 40px ${game.colors[0]}20, 0 0 60px ${game.colors[1]}10`
                    : '0 4px 20px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                }}
              >
                {/* Glow accent */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: 2,
                  background: `linear-gradient(90deg, ${game.colors[0]}, ${game.colors[1]})`,
                  opacity: isHovered ? 1 : 0.3,
                  transition: 'opacity 0.3s',
                }} />

                {/* Corner glow */}
                <div style={{
                  position: 'absolute',
                  top: -40, right: -40,
                  width: 120, height: 120,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${game.colors[0]}10, transparent)`,
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.4s',
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
                  <div style={{
                    fontSize: 48,
                    lineHeight: 1,
                    filter: isHovered ? 'drop-shadow(0 0 12px rgba(255,255,255,0.3))' : 'none',
                    transition: 'filter 0.3s',
                  }}>
                    {game.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: isHovered ? game.colors[0] : '#e0e0f0',
                      transition: 'color 0.3s',
                      marginBottom: 4,
                    }}>
                      {game.title}
                    </h2>
                    <p style={{
                      fontSize: 11,
                      color: '#5a5a8a',
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      marginBottom: 12,
                    }}>
                      {game.subtitle}
                    </p>
                    <p style={{
                      fontSize: 13,
                      color: '#7a7aaa',
                      lineHeight: 1.6,
                      marginBottom: 16,
                    }}>
                      {game.description}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {game.tags.map((tag) => (
                        <span key={tag} style={{
                          fontSize: 10,
                          color: '#5a5a8a',
                          border: '1px solid #1a1a3a',
                          borderRadius: 4,
                          padding: '2px 8px',
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Play prompt */}
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 16,
                  fontSize: 11,
                  color: isHovered ? game.colors[0] : 'transparent',
                  transition: 'color 0.3s',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}>
                  play →
                </div>
              </div>
            );
          })}

          {/* Empty state / coming soon card */}
          {GAMES.length < 4 && (
            <div style={{
              background: '#0a0c2040',
              border: '1px dashed #1a1a3a',
              borderRadius: 12,
              padding: '32px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 180,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>🎮</div>
                <p style={{ color: '#2a2a4a', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
                  more games coming soon
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 60,
          color: '#2a2a4a',
          fontSize: 10,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}>
          game arcade — built with questionable life choices
        </div>
      </div>
    </div>
  );
}
