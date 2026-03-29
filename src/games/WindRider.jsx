import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GAME_WIDTH = 420;
const GAME_HEIGHT = 700;
const HORIZON_Y = 190;
const MAX_SAIL = 90;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wrapAngle(deg) {
  let value = deg;
  while (value < 0) value += 360;
  while (value >= 360) value -= 360;
  return value;
}

function shortestAngleDifference(a, b) {
  let diff = ((a - b + 540) % 360) - 180;
  return diff;
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

export default function WindRider() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const lastRef = useRef(0);
  const keysRef = useRef({ left: false, right: false, up: false, down: false });
  const touchRef = useRef({ left: false, right: false, trimIn: false, trimOut: false });
  const worldRef = useRef(null);

  const [phase, setPhase] = useState('menu');
  const [hud, setHud] = useState({
    distance: 0,
    score: 0,
    sailState: 'Reaching',
    speedLabel: 'Ready to Sail!',
    trimLabel: 'Aim for smooth wind flow',
    windDirection: 45,
    speed: 0,
    sailAngle: 25,
    heading: 0,
    tips: 0,
    treasures: 0,
    dolphins: 0,
  });

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth < 980;
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') keysRef.current.left = true;
      if (event.key === 'ArrowRight') keysRef.current.right = true;
      if (event.key === 'ArrowUp') keysRef.current.up = true;
      if (event.key === 'ArrowDown') keysRef.current.down = true;
      if (event.key.toLowerCase() === 'p' && phase === 'running') {
        setPhase('paused');
      } else if (event.key.toLowerCase() === 'p' && phase === 'paused') {
        setPhase('running');
      }
      if (event.key.toLowerCase() === 'r' && phase === 'gameover') {
        startRun();
      }
    };

    const onKeyUp = (event) => {
      if (event.key === 'ArrowLeft') keysRef.current.left = false;
      if (event.key === 'ArrowRight') keysRef.current.right = false;
      if (event.key === 'ArrowUp') keysRef.current.up = false;
      if (event.key === 'ArrowDown') keysRef.current.down = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [phase]);

  const makeItem = (kind) => ({
    id: `${kind}-${Math.random().toString(36).slice(2)}`,
    kind,
    lane: randBetween(-1, 1),
    z: randBetween(60, 110),
    drift: randBetween(-0.16, 0.16),
  });

  const makeObstacle = (kind) => ({
    id: `${kind}-${Math.random().toString(36).slice(2)}`,
    kind,
    lane: randBetween(-1.1, 1.1),
    z: randBetween(55, 120),
    drift: randBetween(-0.1, 0.1),
  });

  const startRun = () => {
    worldRef.current = {
      boatX: 0,
      heading: 0,
      sailAngle: 25,
      windDirection: 50,
      windTimer: 0,
      speed: 0,
      distance: 0,
      score: 0,
      tips: 0,
      treasures: 0,
      dolphins: 0,
      combo: 0,
      health: 100,
      pointsOfSail: 'Reaching',
      speedLabel: 'Catch that breeze!',
      trimLabel: 'Trim sail to ~25°',
      particles: [],
      popups: [],
      collectibles: [makeItem('treasure'), makeItem('tip'), makeItem('dolphin')],
      obstacles: [makeObstacle('rock'), makeObstacle('whirlpool'), makeObstacle('sandbar')],
      elapsed: 0,
    };
    lastRef.current = 0;
    setPhase('running');
  };

  useEffect(() => {
    if (phase !== 'running') {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = (time) => {
      const world = worldRef.current;
      if (!world) return;
      if (!lastRef.current) lastRef.current = time;
      const dt = clamp((time - lastRef.current) / 1000, 0.001, 0.05);
      lastRef.current = time;

      updateWorld(world, dt);
      drawWorld(ctx, world);

      setHud({
        distance: Math.floor(world.distance),
        score: Math.floor(world.score),
        sailState: world.pointsOfSail,
        speedLabel: world.speedLabel,
        trimLabel: world.trimLabel,
        windDirection: Math.round(world.windDirection),
        speed: Math.round(world.speed * 10) / 10,
        sailAngle: Math.round(world.sailAngle),
        heading: Math.round(world.heading),
        tips: world.tips,
        treasures: world.treasures,
        dolphins: world.dolphins,
      });

      if (world.health <= 0) {
        setPhase('gameover');
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
  }, [phase]);

  const updateWorld = (world, dt) => {
    world.elapsed += dt;
    const steerInput = (keysRef.current.left || touchRef.current.left ? -1 : 0) + (keysRef.current.right || touchRef.current.right ? 1 : 0);
    const sailInput = (keysRef.current.up || touchRef.current.trimIn ? -1 : 0) + (keysRef.current.down || touchRef.current.trimOut ? 1 : 0);

    world.heading = wrapAngle(world.heading + steerInput * 82 * dt);
    world.boatX = clamp(world.boatX + steerInput * 0.9 * dt, -1.35, 1.35);
    world.sailAngle = clamp(world.sailAngle + sailInput * 70 * dt, 5, MAX_SAIL);

    world.windTimer += dt;
    if (world.windTimer > 6) {
      world.windTimer = 0;
      world.windDirection = wrapAngle(world.windDirection + randBetween(-45, 45));
      world.popups.push({ text: 'Wind shift! Re-trim sails!', life: 1.8, color: '#fde047' });
    }

    const relWind = Math.abs(shortestAngleDifference(world.heading, world.windDirection));
    const sailOptimal = clamp(Math.abs(relWind - 90), 10, 85);
    const sailError = Math.abs(world.sailAngle - sailOptimal);

    let sailState = 'Reaching';
    let baseFactor = 0.95;
    let speedLabel = 'Good Breeze!';

    if (relWind >= 150) {
      sailState = 'Running';
      baseFactor = 0.75;
      speedLabel = 'Steady Downwind';
    } else if (relWind >= 95) {
      sailState = 'Broad Reach';
      baseFactor = 1.05;
      speedLabel = 'Super Speed!';
    } else if (relWind >= 45) {
      sailState = 'Beam Reach';
      baseFactor = 1.2;
      speedLabel = 'Super Speed!';
    } else if (relWind >= 32) {
      sailState = 'Beating';
      baseFactor = 0.72;
      speedLabel = 'Tricky Angle';
    } else {
      sailState = 'In Irons';
      baseFactor = 0.14;
      speedLabel = 'Stuck! Turn away!';
    }

    const trimBonus = clamp(1 - sailError / 60, 0.15, 1.07);
    const targetSpeed = 9.5 * baseFactor * trimBonus;
    world.speed += (targetSpeed - world.speed) * dt * 2.8;
    world.distance += world.speed * dt * 8;

    if (sailError < 10 && relWind > 30 && relWind < 170) {
      world.combo = clamp(world.combo + dt * 28, 0, 160);
      world.score += (6 + world.combo * 0.12) * dt;
    } else {
      world.combo = clamp(world.combo - dt * 32, 0, 160);
      world.score += 2.8 * dt;
    }

    world.pointsOfSail = sailState;
    world.speedLabel = speedLabel;
    world.trimLabel = sailError <= 10
      ? 'Perfect trim! Keep it there!'
      : sailError <= 22
        ? 'Nice trim! Tiny tweak needed.'
        : `Aim sail near ${Math.round(sailOptimal)}°`;

    const worldSpeed = Math.max(world.speed, 0.4) * dt * 14;
    world.collectibles.forEach((item) => {
      item.z -= worldSpeed;
      item.lane = clamp(item.lane + item.drift * dt, -1.2, 1.2);
      if (item.z < 0) {
        item.z = randBetween(95, 130);
        item.lane = randBetween(-1.2, 1.2);
      }
    });

    world.obstacles.forEach((item) => {
      item.z -= worldSpeed * 0.92;
      item.lane = clamp(item.lane + item.drift * dt, -1.25, 1.25);
      if (item.z < -2) {
        item.z = randBetween(95, 140);
        item.lane = randBetween(-1.15, 1.15);
      }
    });

    world.collectibles.forEach((item) => {
      if (item.z < 12 && Math.abs(item.lane - world.boatX) < 0.25) {
        item.z = randBetween(95, 130);
        item.lane = randBetween(-1.2, 1.2);
        if (item.kind === 'treasure') {
          world.score += 120;
          world.treasures += 1;
          world.popups.push({ text: '+Treasure! Great line!', life: 1.6, color: '#facc15' });
        }
        if (item.kind === 'tip') {
          world.score += 90;
          world.tips += 1;
          world.popups.push({ text: 'Sailing Tip: Reaches are fastest!', life: 1.8, color: '#86efac' });
        }
        if (item.kind === 'dolphin') {
          world.score += 150;
          world.dolphins += 1;
          world.popups.push({ text: 'Dolphin boost! Smooth steering!', life: 1.6, color: '#7dd3fc' });
          world.speed += 0.8;
        }
      }
    });

    world.obstacles.forEach((item) => {
      if (item.z < 12 && Math.abs(item.lane - world.boatX) < 0.26) {
        item.z = randBetween(100, 145);
        item.lane = randBetween(-1.15, 1.15);
        world.health -= item.kind === 'rock' ? 18 : item.kind === 'whirlpool' ? 13 : 10;
        world.speed *= 0.72;
        world.combo = 0;
        world.popups.push({ text: 'Oops! Avoid obstacles!', life: 1.4, color: '#fca5a5' });
      }
    });

    world.popups.forEach((popup) => {
      popup.life -= dt;
    });
    world.popups = world.popups.filter((popup) => popup.life > 0);
  };

  const project = (lane, z) => {
    const perspective = 1 / Math.max(0.2, z * 0.06);
    const x = GAME_WIDTH / 2 + lane * 160 * perspective;
    const y = HORIZON_Y + (1 - perspective) * (GAME_HEIGHT - HORIZON_Y - 30);
    const scale = perspective;
    return { x, y, scale };
  };

  const drawWorld = (ctx, world) => {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 30);
    sky.addColorStop(0, '#1e3a8a');
    sky.addColorStop(1, '#38bdf8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, GAME_WIDTH, HORIZON_Y + 20);

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(72, 68, 35, 0, Math.PI * 2);
    ctx.fill();

    const ocean = ctx.createLinearGradient(0, HORIZON_Y, 0, GAME_HEIGHT);
    ocean.addColorStop(0, '#2563eb');
    ocean.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y);

    for (let i = 1; i <= 21; i += 1) {
      const t = i / 21;
      const y = HORIZON_Y + Math.pow(t, 1.8) * (GAME_HEIGHT - HORIZON_Y);
      const width = 8 + t * GAME_WIDTH * 1.15;
      const left = GAME_WIDTH / 2 - width / 2;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(125,211,252,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.24)';
    for (let i = -4; i <= 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(GAME_WIDTH / 2 + i * 12, HORIZON_Y + 2);
      ctx.lineTo(GAME_WIDTH / 2 + i * 90, GAME_HEIGHT);
      ctx.stroke();
    }

    const windArrowLength = 55;
    const windR = (world.windDirection - world.heading) * (Math.PI / 180);
    const wx = 74;
    const wy = HORIZON_Y + 36;
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + Math.cos(windR) * windArrowLength, wy + Math.sin(windR) * windArrowLength);
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 14px Nunito, sans-serif';
    ctx.fillText('WIND', wx - 24, wy - 18);

    const worldItems = [
      ...world.collectibles.map((item) => ({ ...item, type: 'collectible' })),
      ...world.obstacles.map((item) => ({ ...item, type: 'obstacle' })),
    ].sort((a, b) => b.z - a.z);

    worldItems.forEach((item) => {
      const p = project(item.lane, item.z);
      if (item.type === 'collectible') {
        if (item.kind === 'treasure') {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(p.x - 11 * p.scale, p.y - 10 * p.scale, 22 * p.scale, 15 * p.scale);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(p.x - 11 * p.scale, p.y - 10 * p.scale, 22 * p.scale, 5 * p.scale);
        } else if (item.kind === 'tip') {
          ctx.fillStyle = '#e0f2fe';
          ctx.beginPath();
          ctx.arc(p.x, p.y - 4 * p.scale, 10 * p.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0284c7';
          ctx.font = `${Math.max(7, 11 * p.scale)}px Nunito, sans-serif`;
          ctx.fillText('Tip', p.x - 8 * p.scale, p.y - 2 * p.scale);
        } else {
          ctx.fillStyle = '#93c5fd';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, 16 * p.scale, 8 * p.scale, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0ea5e9';
          ctx.beginPath();
          ctx.moveTo(p.x + 15 * p.scale, p.y);
          ctx.lineTo(p.x + 24 * p.scale, p.y - 5 * p.scale);
          ctx.lineTo(p.x + 24 * p.scale, p.y + 5 * p.scale);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        if (item.kind === 'rock') {
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 12 * p.scale, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.kind === 'whirlpool') {
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = Math.max(1, 3 * p.scale);
          for (let r = 3; r < 14; r += 3) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * p.scale, 0.4, Math.PI * 2 - 0.4);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = '#fcd34d';
          ctx.fillRect(p.x - 14 * p.scale, p.y - 5 * p.scale, 28 * p.scale, 10 * p.scale);
        }
      }
    });

    const boatY = GAME_HEIGHT - 105;
    const boatX = GAME_WIDTH / 2 + world.boatX * 120;

    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.moveTo(boatX - 36, boatY + 28);
    ctx.lineTo(boatX + 36, boatY + 28);
    ctx.lineTo(boatX + 24, boatY + 45);
    ctx.lineTo(boatX - 24, boatY + 45);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(boatX, boatY + 28);
    ctx.lineTo(boatX, boatY - 40);
    ctx.stroke();

    const sailRadians = (world.sailAngle * Math.PI) / 180;
    const sailDirection = world.windDirection > world.heading ? 1 : -1;
    const sailX = boatX + Math.sin(sailRadians) * 55 * sailDirection;

    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.moveTo(boatX, boatY - 35);
    ctx.lineTo(sailX, boatY - 5);
    ctx.lineTo(boatX, boatY + 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Nunito, sans-serif';
    ctx.fillText(world.speedLabel, 140, 44);
    ctx.font = 'bold 14px Nunito, sans-serif';
    ctx.fillStyle = '#dcfce7';
    ctx.fillText(world.trimLabel, 112, 66);

    world.popups.forEach((popup, index) => {
      ctx.fillStyle = popup.color;
      ctx.font = 'bold 16px Nunito, sans-serif';
      ctx.fillText(popup.text, 90, 100 + index * 22);
    });

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px Nunito, sans-serif';
    ctx.fillText(`Hull: ${Math.max(0, Math.round(world.health))}%`, GAME_WIDTH - 94, 28);
  };

  const controlBtnStyle = {
    width: 64,
    height: 64,
    borderRadius: 16,
    border: '2px solid #bfdbfe',
    background: 'linear-gradient(180deg,#eff6ff,#bfdbfe)',
    fontSize: 26,
    fontWeight: 900,
    color: '#0c4a6e',
    touchAction: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #082f49 0%, #0ea5e9 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '18px 12px 30px',
      fontFamily: "'Nunito', 'Baloo 2', sans-serif",
      color: '#f8fafc',
    }}>
      <button
        onClick={() => navigate('/')}
        style={{
          alignSelf: 'flex-start',
          marginBottom: 10,
          border: 'none',
          background: '#fef3c7',
          color: '#1e3a8a',
          borderRadius: 14,
          padding: '12px 16px',
          fontSize: 18,
          fontWeight: 900,
          cursor: 'pointer',
          minWidth: 170,
          minHeight: 48,
        }}
      >
        ← ODD NOODLE
      </button>

      <div style={{
        width: '100%',
        maxWidth: 930,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
        gap: 14,
      }}>
        <div style={{
          background: 'rgba(15,23,42,0.36)',
          borderRadius: 18,
          padding: 10,
          border: '2px solid rgba(191,219,254,0.5)',
        }}>
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            style={{
              width: '100%',
              maxWidth: 520,
              borderRadius: 14,
              border: '2px solid rgba(255,255,255,0.32)',
              background: '#0369a1',
              display: 'block',
              margin: '0 auto',
            }}
          />

          {phase === 'menu' && (
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <h1 style={{ fontSize: 38, margin: '4px 0', color: '#fef08a' }}>⛵ Wind Rider</h1>
              <p style={{ fontSize: 19, margin: '8px auto', maxWidth: 560 }}>
                Ride ocean wind, trim your sail, and learn points of sail! Best speed comes on a reach.
              </p>
              <button
                onClick={startRun}
                style={{
                  marginTop: 10,
                  border: 'none',
                  borderRadius: 14,
                  padding: '14px 24px',
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#082f49',
                  background: 'linear-gradient(180deg,#fef08a,#facc15)',
                  cursor: 'pointer',
                  minHeight: 50,
                  minWidth: 150,
                }}
              >
                Start Sailing!
              </button>
            </div>
          )}

          {phase === 'gameover' && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <h2 style={{ fontSize: 36, color: '#fecaca', margin: '6px 0' }}>Storm Got You!</h2>
              <p style={{ fontSize: 19, margin: '6px 0' }}>Distance: {hud.distance}m · Score: {hud.score}</p>
              <p style={{ fontSize: 17, margin: '6px 0' }}>
                Treasure: {hud.treasures} · Tips: {hud.tips} · Dolphins: {hud.dolphins}
              </p>
              <button
                onClick={startRun}
                style={{
                  marginTop: 8,
                  border: 'none',
                  borderRadius: 14,
                  padding: '12px 22px',
                  fontSize: 21,
                  fontWeight: 900,
                  color: '#082f49',
                  background: 'linear-gradient(180deg,#a7f3d0,#34d399)',
                  cursor: 'pointer',
                  minHeight: 48,
                  minWidth: 140,
                }}
              >
                Sail Again!
              </button>
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(15,23,42,0.45)',
          border: '2px solid rgba(191,219,254,0.5)',
          borderRadius: 18,
          padding: 14,
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 28, color: '#fef08a' }}>Captain HUD</h3>
          <p style={{ fontSize: 18, margin: '4px 0' }}>Score: <b>{hud.score}</b></p>
          <p style={{ fontSize: 18, margin: '4px 0' }}>Distance: <b>{hud.distance} m</b></p>
          <p style={{ fontSize: 18, margin: '4px 0' }}>Boat Speed: <b>{hud.speed} kn</b></p>
          <p style={{ fontSize: 18, margin: '4px 0' }}>Point of Sail: <b>{hud.sailState}</b></p>
          <p style={{ fontSize: 18, margin: '4px 0' }}>Heading: <b>{hud.heading}°</b></p>
          <p style={{ fontSize: 18, margin: '4px 0' }}>Sail Angle: <b>{hud.sailAngle}°</b></p>
          <p style={{ fontSize: 18, margin: '4px 0' }}>Wind Dir: <b>{hud.windDirection}°</b></p>

          <div style={{
            marginTop: 12,
            borderRadius: 14,
            padding: 12,
            background: 'rgba(236,253,245,0.16)',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 18, color: '#86efac', fontWeight: 800 }}>{hud.speedLabel}</p>
            <p style={{ margin: 0, fontSize: 16 }}>{hud.trimLabel}</p>
          </div>

          <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.4 }}>
            <p style={{ margin: '0 0 6px' }}>• Beam/Broad Reach = fastest.</p>
            <p style={{ margin: '0 0 6px' }}>• Beating is slower but works upwind.</p>
            <p style={{ margin: '0 0 6px' }}>• In Irons means no-go zone: turn away!</p>
            <p style={{ margin: '0 0 6px' }}>• Score grows faster with good trim.</p>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 14,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
      }}>
        <p style={{ margin: 0, fontSize: 17 }}>Keyboard: ← → steer · ↑ ↓ sail trim · P pause · R restart</p>
      </div>

      {isMobile && (
        <div style={{
          marginTop: 14,
          width: '100%',
          maxWidth: 460,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={controlBtnStyle}
              onTouchStart={() => { touchRef.current.left = true; }}
              onTouchEnd={() => { touchRef.current.left = false; }}
              onMouseDown={() => { touchRef.current.left = true; }}
              onMouseUp={() => { touchRef.current.left = false; }}
              onMouseLeave={() => { touchRef.current.left = false; }}
            >
              ◀
            </button>
            <button
              style={controlBtnStyle}
              onTouchStart={() => { touchRef.current.right = true; }}
              onTouchEnd={() => { touchRef.current.right = false; }}
              onMouseDown={() => { touchRef.current.right = true; }}
              onMouseUp={() => { touchRef.current.right = false; }}
              onMouseLeave={() => { touchRef.current.right = false; }}
            >
              ▶
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={controlBtnStyle}
              onTouchStart={() => { touchRef.current.trimIn = true; }}
              onTouchEnd={() => { touchRef.current.trimIn = false; }}
              onMouseDown={() => { touchRef.current.trimIn = true; }}
              onMouseUp={() => { touchRef.current.trimIn = false; }}
              onMouseLeave={() => { touchRef.current.trimIn = false; }}
            >
              ⬆
            </button>
            <button
              style={controlBtnStyle}
              onTouchStart={() => { touchRef.current.trimOut = true; }}
              onTouchEnd={() => { touchRef.current.trimOut = false; }}
              onMouseDown={() => { touchRef.current.trimOut = true; }}
              onMouseUp={() => { touchRef.current.trimOut = false; }}
              onMouseLeave={() => { touchRef.current.trimOut = false; }}
            >
              ⬇
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
