import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=Nunito:wght@400;700;900&display=swap');`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const p = {
    color: '#c0b0e0',
    fontSize: 15,
    lineHeight: 1.75,
    marginTop: 0,
    marginBottom: 16,
    fontFamily: "'Nunito', sans-serif",
  };

  const h2 = {
    fontFamily: "'Nunito', sans-serif",
    fontSize: 13,
    fontWeight: 900,
    color: '#b09fd4',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 40,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0020', position: 'relative' }}>
      <div
        onClick={() => navigate('/')}
        style={{
          position: 'absolute', top: 12, left: 16,
          color: '#4a4a6a', fontSize: 12, cursor: 'pointer',
          zIndex: 10, padding: '6px 12px', borderRadius: 6,
          background: '#0a0c2080', border: '1px solid #1a1a3a',
          fontFamily: "'Courier New', monospace", letterSpacing: 2,
        }}
      >
        ← ARCADE
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px 100px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🍜</div>
          <h1 style={{
            fontFamily: "'Boogaloo', cursive",
            fontSize: 'clamp(32px, 6vw, 52px)',
            color: '#ffe066',
            margin: '0 0 12px',
          }}>
            About Odd Noodle Games
          </h1>
          <p style={{ ...p, color: '#9080b8', fontSize: 14, marginBottom: 0 }}>
            Free browser games for curious kids — no accounts, no ads, no download
          </p>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, #3a1a6a, transparent)',
          marginBottom: 48,
        }} />

        {/* What is this place? */}
        <h2 style={h2}>What is this place?</h2>
        <p style={p}>
          Odd Noodle Games is a small arcade of free browser games made for kids. Every game runs
          directly in your browser — nothing to install, nothing to sign up for. Just pick a game
          and play.
        </p>
        <p style={p}>
          The games here are a bit weird. That's on purpose. Quirky ideas stick in your brain longer
          than boring ones, and we'd rather you remember something strange than forget something dull.
        </p>

        {/* Every game teaches something */}
        <h2 style={h2}>Every game teaches something</h2>
        <p style={p}>
          Science, maths, geography, music, history, coding — learning is baked into the gameplay,
          not bolted on as an afterthought. You won't find a quiz that interrupts the fun. The fun
          <em> is</em> the learning.
        </p>
        <p style={p}>
          Whether it's bending comets with gravity, operating a WWII cipher machine, or resolving
          ridiculous diplomatic crises involving 193 real countries, every game is designed so that
          the thing you're learning is also the thing you're doing.
        </p>

        {/* Who made it? */}
        <h2 style={h2}>Who made it?</h2>
        <p style={p}>
          Odd Noodle Games is an indie project made by a small team of developers who care a lot
          about making the web a more interesting place for kids. We're not a big company. We don't
          run ads. We don't sell data. We just make games.
        </p>
        <p style={p}>
          New games are added over time. If you have ideas, feedback, or just want to say something
          nice (or weird), get in touch.
        </p>

        {/* Contact */}
        <h2 style={h2}>Say hello</h2>
        <p style={p}>
          You can reach us at{' '}
          <a
            href="mailto:hello@oddnoodlegames.com"
            style={{ color: '#ffe066', textDecoration: 'underline' }}
          >
            hello@oddnoodlegames.com
          </a>
          . We read everything.
        </p>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #ff3cac, #7c00ff)',
              border: 'none',
              borderRadius: 14,
              color: '#fff',
              fontFamily: "'Boogaloo', cursive",
              fontSize: 20,
              padding: '14px 36px',
              cursor: 'pointer',
              letterSpacing: 1,
            }}
          >
            Play the games →
          </button>
        </div>

      </div>
    </div>
  );
}
