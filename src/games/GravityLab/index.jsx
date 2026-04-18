import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 800;
const CANVAS_H = 600;
const TRAJ_STEPS = 600;
const G_CONSTANT = 300;
const COMET_RADIUS = 10;
const PORTAL_RADIUS = 24;
const HAZARD_RADIUS = 18;
const MAX_SPEED = 18;

const PLANET_TYPES = [
  { id: 'small',  label: 'Small',  mass: 1.5, radius: 14, color: '#a78bfa', glowColor: '#7c3aed', emoji: '🔵' },
  { id: 'medium', label: 'Medium', mass: 4,   radius: 22, color: '#34d399', glowColor: '#059669', emoji: '🟢' },
  { id: 'large',  label: 'Large',  mass: 9,   radius: 32, color: '#fb923c', glowColor: '#c2410c', emoji: '🟠' },
];

const PHYSICS_FACTS = [
  'Gravity is a force that pulls everything with mass toward everything else! Even YOU pull on distant stars — just a tiny bit!',
  'The bigger the planet, the stronger its gravity. That\'s why Earth keeps us firmly on the ground!',
  'Astronauts use "gravity assists" to slingshot spacecraft around planets to save fuel — just like you did!',
  'Asteroids in our solar system orbit the Sun because of its huge gravitational pull keeping them in curved paths.',
  'The Moon stays in orbit around Earth because gravity and the Moon\'s speed balance perfectly — it\'s always "falling" sideways!',
  'Every star, planet, and moon has gravity. Even YOU have a tiny gravitational pull on everything around you!',
  'Isaac Newton figured out the law of gravity in 1666 after observing how objects always fall toward Earth\'s centre.',
  'Real space probes use these same physics to navigate the solar system. You think like a rocket scientist! 🚀',
];

// ─── Level Definitions ────────────────────────────────────────────────────────

const LEVELS = [
  {
    title: 'Baby Steps',
    comet: { x: 80, y: 300, vx: 3.5, vy: 0 },
    portal: { x: 700, y: 190 },
    fixedPlanets: [],
    hazards: [],
    planetBudget: { small: 0, medium: 1, large: 0 },
    hint: '👇 Place the green planet ABOVE the dotted line to bend the comet up toward the portal!',
    tutorialGuide: { x: 600, y: 165 },
  },
  {
    title: 'Upward Curve',
    comet: { x: 80, y: 430, vx: 3.2, vy: -0.5 },
    portal: { x: 700, y: 140 },
    fixedPlanets: [],
    hazards: [],
    planetBudget: { small: 0, medium: 1, large: 0 },
    hint: '⬆️ A heavier planet pulls harder. Place the medium planet to arc the comet upward!',
  },
  {
    title: 'The Slingshot',
    comet: { x: 80, y: 510, vx: 3.0, vy: -1.0 },
    portal: { x: 720, y: 90 },
    fixedPlanets: [
      { x: 400, y: 310, mass: 14, radius: 44, color: '#475569', glowColor: '#334155', fixed: true },
    ],
    hazards: [],
    planetBudget: { small: 2, medium: 0, large: 0 },
    hint: '🌀 The big planet bends every path. Use it to slingshot the comet up and around!',
  },
  {
    title: 'Asteroid Dodge',
    comet: { x: 80, y: 300, vx: 3.5, vy: 0 },
    portal: { x: 720, y: 300 },
    fixedPlanets: [],
    hazards: [{ x: 400, y: 300 }],
    planetBudget: { small: 1, medium: 1, large: 0 },
    hint: '☄️ Watch out! Curve the comet above or below the asteroid.',
  },
  {
    title: 'The Needle',
    comet: { x: 80, y: 200, vx: 3.0, vy: 1.4 },
    portal: { x: 680, y: 430 },
    fixedPlanets: [],
    hazards: [{ x: 380, y: 270 }, { x: 380, y: 390 }],
    planetBudget: { small: 0, medium: 1, large: 1 },
    hint: '🎯 Thread the comet through the gap between the two asteroids!',
  },
  {
    title: 'Double Pull',
    comet: { x: 80, y: 100, vx: 2.8, vy: 1.8 },
    portal: { x: 720, y: 510 },
    fixedPlanets: [],
    hazards: [{ x: 240, y: 360 }, { x: 560, y: 210 }],
    planetBudget: { small: 0, medium: 2, large: 0 },
    hint: '🤝 Two planets working together can create a path one alone cannot!',
  },
  {
    title: 'The Maze',
    comet: { x: 80, y: 510, vx: 3.2, vy: -0.5 },
    portal: { x: 720, y: 510 },
    fixedPlanets: [
      { x: 260, y: 310, mass: 10, radius: 30, color: '#475569', glowColor: '#334155', fixed: true },
      { x: 550, y: 310, mass: 10, radius: 30, color: '#475569', glowColor: '#334155', fixed: true },
    ],
    hazards: [{ x: 405, y: 155 }, { x: 405, y: 465 }],
    planetBudget: { small: 1, medium: 1, large: 0 },
    hint: '🗺️ The fixed planets are your friends — use them to navigate the maze!',
  },
  {
    title: 'Grand Finale',
    comet: { x: 80, y: 310, vx: 2.6, vy: 2.6 },
    portal: { x: 400, y: 75 },
    fixedPlanets: [
      { x: 250, y: 490, mass: 12, radius: 38, color: '#475569', glowColor: '#334155', fixed: true },
      { x: 610, y: 200, mass: 8,  radius: 28, color: '#475569', glowColor: '#334155', fixed: true },
    ],
    hazards: [{ x: 360, y: 310 }, { x: 510, y: 430 }, { x: 200, y: 175 }],
    planetBudget: { small: 1, medium: 1, large: 1 },
    hint: '🏆 All three planet types available. Think carefully about placement order!',
  },
];

// ─── Physics Helpers ──────────────────────────────────────────────────────────

function computeAcceleration(cx, cy, planets) {
  let ax = 0, ay = 0;
  for (const p of planets) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);
    if (dist < (p.radius || 10) + COMET_RADIUS) continue;
    const force = (G_CONSTANT * p.mass) / distSq;
    ax += force * (dx / dist);
    ay += force * (dy / dist);
  }
  return { ax, ay };
}

function eulerStep(x, y, vx, vy, planets) {
  const { ax, ay } = computeAcceleration(x, y, planets);
  const nvx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vx + ax));
  const nvy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vy + ay));
  return { x: x + nvx, y: y + nvy, vx: nvx, vy: nvy };
}

function circlesOverlap(ax, ay, ar, bx, by, br) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy < (ar + br) * (ar + br);
}

function runSimulation(level, playerPlanets) {
  const allPlanets = [...level.fixedPlanets, ...playerPlanets];
  let { x, y, vx, vy } = level.comet;
  const points = [{ x, y }];
  let outcome = 'timeout';

  for (let i = 0; i < TRAJ_STEPS; i++) {
    const s = eulerStep(x, y, vx, vy, allPlanets);
    x = s.x; y = s.y; vx = s.vx; vy = s.vy;
    points.push({ x, y });

    if (circlesOverlap(x, y, COMET_RADIUS, level.portal.x, level.portal.y, PORTAL_RADIUS)) {
      outcome = 'portal'; break;
    }
    let hitHazard = false;
    for (const h of level.hazards) {
      if (circlesOverlap(x, y, COMET_RADIUS, h.x, h.y, HAZARD_RADIUS)) { hitHazard = true; break; }
    }
    if (hitHazard) { outcome = 'hazard'; break; }
    for (const p of allPlanets) {
      if (circlesOverlap(x, y, COMET_RADIUS, p.x, p.y, p.radius || 10)) { outcome = 'planet'; break; }
    }
    if (outcome !== 'timeout') break;
    if (x < -60 || x > CANVAS_W + 60 || y < -60 || y > CANVAS_H + 60) { outcome = 'oob'; break; }
  }
  return { points, outcome };
}

// ─── Asteroid shape seeds ─────────────────────────────────────────────────────
function asteroidPoints(seed, r) {
  const pts = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const noise = 0.7 + 0.3 * Math.abs(Math.sin(seed * 3.7 + i * 1.9));
    pts.push({ x: Math.cos(angle) * r * noise, y: Math.sin(angle) * r * noise });
  }
  return pts;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GravityLab() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animRef = useRef(null);
  const lastTimeRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mouseRef = useRef({ x: -999, y: -999 });

  const [screen, setScreen] = useState('menu');
  const [levelIndex, setLevelIndex] = useState(0);
  const [completedFact, setCompletedFact] = useState('');
  const [uiPlanetType, setUiPlanetType] = useState('small');
  const [, forceUpdate] = useState(0);

  // ── Audio ──────────────────────────────────────────────────────────────────

  const getAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playSound = useCallback((type) => {
    try {
      const ctx = getAudio();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'place') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
      } else if (type === 'launch') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now); osc.stop(now + 0.35);
      } else if (type === 'success') {
        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
          const o2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          o2.connect(g2); g2.connect(ctx.destination);
          o2.type = 'sine';
          o2.frequency.value = freq;
          g2.gain.setValueAtTime(0.15, now + i * 0.1);
          g2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.18);
          o2.start(now + i * 0.1);
          o2.stop(now + i * 0.1 + 0.2);
        });
        return;
      } else if (type === 'fail') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now); osc.stop(now + 0.45);
      } else if (type === 'remove') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
      }
    } catch (e) {}
  }, [getAudio]);

  // ── Game Init ──────────────────────────────────────────────────────────────

  const initLevel = useCallback((idx) => {
    const level = LEVELS[idx];
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      r: 0.5 + Math.random() * 1.5,
      twinkle: 0.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    }));

    const g = {
      levelIdx: idx,
      phase: 'placing',
      comet: { ...level.comet },
      cometTrail: [],
      playerPlanets: [],
      selectedPlanetType: 'small',
      planetsRemaining: { ...level.planetBudget },
      time: 0,
      resultTimer: 0,
      stars,
      particles: [],
      trajectoryCache: { points: [], outcome: 'timeout' },
      asteroidSeeds: level.hazards.map((_, i) => i * 7.3 + 2.1),
    };
    gameRef.current = g;
    // Initial trajectory
    g.trajectoryCache = runSimulation(level, []);
  }, []);

  // ── Canvas Events ──────────────────────────────────────────────────────────

  const getCanvasPos = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const touch = e.touches?.length ? e.touches[0] : e.changedTouches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handleCanvasClick = useCallback((e) => {
    const g = gameRef.current;
    if (!g || g.phase !== 'placing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasPos(e, canvas);
    const typeId = g.selectedPlanetType;
    const pType = PLANET_TYPES.find(p => p.id === typeId);

    // Check if clicking an existing player planet to remove it
    const existingIdx = g.playerPlanets.findIndex(p =>
      circlesOverlap(x, y, 5, p.x, p.y, p.radius + 8)
    );
    if (existingIdx !== -1) {
      const removed = g.playerPlanets.splice(existingIdx, 1)[0];
      const removedType = PLANET_TYPES.find(pt => pt.id === removed.typeId);
      if (removedType) g.planetsRemaining[removedType.id]++;
      playSound('remove');
      g.trajectoryCache = runSimulation(LEVELS[g.levelIdx], g.playerPlanets);
      forceUpdate(n => n + 1);
      return;
    }

    if (!pType || g.planetsRemaining[typeId] <= 0) return;

    // Don't place on top of fixed planets or hazards or portal
    const level = LEVELS[g.levelIdx];
    for (const fp of level.fixedPlanets) {
      if (circlesOverlap(x, y, pType.radius, fp.x, fp.y, fp.radius)) return;
    }
    for (const h of level.hazards) {
      if (circlesOverlap(x, y, pType.radius, h.x, h.y, HAZARD_RADIUS + 8)) return;
    }
    if (circlesOverlap(x, y, pType.radius, level.portal.x, level.portal.y, PORTAL_RADIUS + 8)) return;

    g.playerPlanets.push({
      x, y,
      typeId,
      mass: pType.mass,
      radius: pType.radius,
      color: pType.color,
      glowColor: pType.glowColor,
      age: 0,
      fixed: false,
    });
    g.planetsRemaining[typeId]--;
    playSound('place');
    g.trajectoryCache = runSimulation(LEVELS[g.levelIdx], g.playerPlanets);
    forceUpdate(n => n + 1);
  }, [getCanvasPos, playSound]);

  const handleCanvasMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasPos(e, canvas);
    mouseRef.current = { x, y };
  }, [getCanvasPos]);

  const handleLaunch = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.phase !== 'placing') return;
    const level = LEVELS[g.levelIdx];
    g.comet = { ...level.comet };
    g.cometTrail = [];
    g.phase = 'flying';
    playSound('launch');
  }, [playSound]);

  const handleReset = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const level = LEVELS[g.levelIdx];
    g.playerPlanets = [];
    g.planetsRemaining = { ...level.planetBudget };
    g.phase = 'placing';
    g.comet = { ...level.comet };
    g.cometTrail = [];
    g.resultTimer = 0;
    g.particles = [];
    g.trajectoryCache = runSimulation(level, []);
    forceUpdate(n => n + 1);
  }, []);

  const handleSelectType = useCallback((typeId) => {
    const g = gameRef.current;
    if (g) g.selectedPlanetType = typeId;
    setUiPlanetType(typeId);
  }, []);

  // ── Particles ──────────────────────────────────────────────────────────────

  const spawnParticles = useCallback((x, y, color, count = 12) => {
    const g = gameRef.current;
    if (!g) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      g.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        color,
        r: 3 + Math.random() * 4,
      });
    }
  }, []);

  // ── Draw Functions ─────────────────────────────────────────────────────────

  const drawScene = useCallback((ctx, g, level) => {
    const W = CANVAS_W, H = CANVAS_H;
    const t = g.time;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#03051a');
    bgGrad.addColorStop(1, '#080d2a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Nebula blobs
    const neb1 = ctx.createRadialGradient(200, 150, 0, 200, 150, 220);
    neb1.addColorStop(0, '#1e1b4b28');
    neb1.addColorStop(1, 'transparent');
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, W, H);

    const neb2 = ctx.createRadialGradient(650, 450, 0, 650, 450, 180);
    neb2.addColorStop(0, '#0c4a6e25');
    neb2.addColorStop(1, 'transparent');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (const s of g.stars) {
      const alpha = 0.3 + 0.6 * (Math.sin(t * s.twinkle + s.phase) * 0.5 + 0.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#e0e8ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Launch arrow at comet start
    if (g.phase === 'placing') {
      const c = level.comet;
      ctx.save();
      ctx.translate(c.x, c.y);
      const angle = Math.atan2(c.vy, c.vx);
      ctx.rotate(angle);
      ctx.strokeStyle = '#60a5fa80';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(COMET_RADIUS + 4, 0);
      ctx.lineTo(COMET_RADIUS + 28, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#60a5fa80';
      ctx.beginPath();
      ctx.moveTo(COMET_RADIUS + 32, 0);
      ctx.lineTo(COMET_RADIUS + 24, -5);
      ctx.lineTo(COMET_RADIUS + 24, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Trajectory dots
    if (g.phase === 'placing') {
      const { points, outcome } = g.trajectoryCache;
      const dotColor = outcome === 'portal' ? '#fbbf24' : outcome === 'hazard' || outcome === 'planet' ? '#f87171' : '#94a3b8';
      for (let i = 0; i < points.length; i += 4) {
        const alpha = Math.max(0.06, 0.55 - (i / points.length) * 0.5);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Fixed planets
    for (const fp of level.fixedPlanets) {
      ctx.save();
      ctx.shadowColor = fp.glowColor;
      ctx.shadowBlur = 10 + 4 * Math.sin(t * 0.8);
      const grad = ctx.createRadialGradient(fp.x - fp.radius * 0.3, fp.y - fp.radius * 0.3, 2, fp.x, fp.y, fp.radius);
      grad.addColorStop(0, '#64748b');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fp.x, fp.y, fp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Hazards (asteroids)
    for (let hi = 0; hi < level.hazards.length; hi++) {
      const h = level.hazards[hi];
      const seed = g.asteroidSeeds[hi];
      const pts = asteroidPoints(seed, HAZARD_RADIUS);
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(t * 0.3 * (seed % 2 === 0 ? 1 : -1));
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Portal
    {
      const px = level.portal.x, py = level.portal.y;
      const pulse = 0.7 + 0.3 * Math.sin(t * 2);
      ctx.save();
      ctx.shadowColor = '#fde68a';
      ctx.shadowBlur = 20 * pulse;
      // inner glow
      const portalGrad = ctx.createRadialGradient(px, py, 0, px, py, PORTAL_RADIUS);
      portalGrad.addColorStop(0, `rgba(253,230,138,${0.6 * pulse})`);
      portalGrad.addColorStop(0.6, `rgba(251,191,36,${0.3 * pulse})`);
      portalGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = portalGrad;
      ctx.beginPath();
      ctx.arc(px, py, PORTAL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      // spinning ring
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(px, py, PORTAL_RADIUS, t * 1.5, t * 1.5 + Math.PI * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, PORTAL_RADIUS, t * 1.5 + Math.PI, t * 1.5 + Math.PI * 2.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      // star emoji
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', px, py);
      ctx.restore();
    }

    // Player-placed planets
    for (const pp of g.playerPlanets) {
      pp.age = (pp.age || 0) + 1;
      const scale = Math.min(1, pp.age / 12);
      ctx.save();
      ctx.translate(pp.x, pp.y);
      ctx.scale(scale, scale);
      ctx.shadowColor = pp.glowColor;
      ctx.shadowBlur = 14;
      const grad = ctx.createRadialGradient(-pp.radius * 0.3, -pp.radius * 0.3, 1, 0, 0, pp.radius);
      grad.addColorStop(0, pp.color);
      grad.addColorStop(1, pp.glowColor);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, pp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = pp.color + 'aa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, pp.radius + 4 + 2 * Math.sin(t * 2), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Ghost planet preview (mouse hover)
    if (g.phase === 'placing') {
      const { x: mx, y: my } = mouseRef.current;
      const pType = PLANET_TYPES.find(p => p.id === g.selectedPlanetType);
      if (pType && g.planetsRemaining[g.selectedPlanetType] > 0 && mx > 0 && mx < W) {
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.1 * Math.sin(t * 3);
        ctx.shadowColor = pType.glowColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = pType.color;
        ctx.beginPath();
        ctx.arc(mx, my, pType.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // Comet trail
    if (g.phase === 'flying' || g.phase === 'success' || g.phase === 'fail') {
      for (let i = g.cometTrail.length - 1; i >= 0; i--) {
        const alpha = (1 - i / g.cometTrail.length) * 0.55;
        const r = COMET_RADIUS * (1 - i / g.cometTrail.length * 0.75);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(g.cometTrail[i].x, g.cometTrail[i].y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Comet head
      ctx.save();
      ctx.shadowColor = '#bfdbfe';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#f0f9ff';
      ctx.beginPath();
      ctx.arc(g.comet.x, g.comet.y, COMET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    } else {
      // Static comet at start
      ctx.save();
      ctx.shadowColor = '#bfdbfe';
      ctx.shadowBlur = 12 + 4 * Math.sin(t * 3);
      ctx.fillStyle = '#f0f9ff';
      ctx.beginPath();
      ctx.arc(level.comet.x, level.comet.y, COMET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☄️', level.comet.x, level.comet.y);
      ctx.restore();
    }

    // Particles
    for (const p of g.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // HUD
    ctx.save();
    // Level name
    ctx.fillStyle = 'rgba(3,5,26,0.6)';
    ctx.beginPath();
    ctx.roundRect(CANVAS_W / 2 - 120, 10, 240, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#e0f2fe';
    ctx.font = "bold 15px 'Nunito', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Level ${g.levelIdx + 1}: ${level.title}`, CANVAS_W / 2, 28);

    // Tutorial guide for Level 0
    if (g.phase === 'placing' && level.tutorialGuide && g.playerPlanets.length === 0) {
      const guide = level.tutorialGuide;
      const pulse = 0.35 + 0.25 * Math.sin(g.time * 4);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(guide.x, guide.y, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = pulse * 0.6;
      ctx.fillStyle = '#34d399';
      ctx.font = "bold 12px 'Nunito', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('PLACE HERE', guide.x, guide.y + 48);
      ctx.restore();
    }

    // Hint text
    if (g.phase === 'placing') {
      ctx.fillStyle = 'rgba(3,5,26,0.5)';
      ctx.beginPath();
      ctx.roundRect(10, CANVAS_H - 50, CANVAS_W - 20, 36, 8);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = "13px 'Nunito', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(level.hint, CANVAS_W / 2, CANVAS_H - 32);
    }

    // Click-to-remove hint
    if (g.phase === 'placing' && g.playerPlanets.length > 0) {
      ctx.fillStyle = '#475569';
      ctx.font = "11px 'Nunito', sans-serif";
      ctx.textAlign = 'right';
      ctx.fillText('Click a planet to remove it', CANVAS_W - 12, CANVAS_H - 60);
    }

    ctx.restore();
  }, []);

  // ── Game Loop ──────────────────────────────────────────────────────────────

  const gameLoop = useCallback((timestamp) => {
    const g = gameRef.current;
    if (!g) return;

    const dt = lastTimeRef.current === null ? 1 / 60
      : Math.min((timestamp - lastTimeRef.current) / 1000, 1 / 30);
    lastTimeRef.current = timestamp;

    g.time += dt;

    // Particle update
    for (const p of g.particles) {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.05;
      p.life -= p.decay;
    }
    g.particles = g.particles.filter(p => p.life > 0);

    if (g.phase === 'flying') {
      const level = LEVELS[g.levelIdx];
      const allPlanets = [...level.fixedPlanets, ...g.playerPlanets];
      const s = eulerStep(g.comet.x, g.comet.y, g.comet.vx, g.comet.vy, allPlanets);
      g.comet.x = s.x; g.comet.y = s.y;
      g.comet.vx = s.vx; g.comet.vy = s.vy;

      g.cometTrail.push({ x: g.comet.x, y: g.comet.y });
      if (g.cometTrail.length > 24) g.cometTrail.shift();

      // Win check
      if (circlesOverlap(g.comet.x, g.comet.y, COMET_RADIUS, level.portal.x, level.portal.y, PORTAL_RADIUS)) {
        g.phase = 'success';
        playSound('success');
        spawnParticles(level.portal.x, level.portal.y, '#fbbf24', 20);
        spawnParticles(g.comet.x, g.comet.y, '#bfdbfe', 14);
      }

      // Hazard check
      let hitHazard = false;
      for (const h of level.hazards) {
        if (circlesOverlap(g.comet.x, g.comet.y, COMET_RADIUS, h.x, h.y, HAZARD_RADIUS)) {
          hitHazard = true; break;
        }
      }
      // Planet collision
      if (!hitHazard) {
        for (const p of allPlanets) {
          if (circlesOverlap(g.comet.x, g.comet.y, COMET_RADIUS, p.x, p.y, p.radius)) {
            hitHazard = true; break;
          }
        }
      }
      if (hitHazard) {
        g.phase = 'fail';
        playSound('fail');
        spawnParticles(g.comet.x, g.comet.y, '#f87171', 16);
      }

      // OOB check
      if (g.comet.x < -80 || g.comet.x > CANVAS_W + 80 || g.comet.y < -80 || g.comet.y > CANVAS_H + 80) {
        g.phase = 'fail';
        playSound('fail');
      }
    }

    // Result timer
    if (g.phase === 'success' || g.phase === 'fail') {
      g.resultTimer += dt;
      if (g.resultTimer > 1.6) {
        if (g.phase === 'success') {
          const factIdx = Math.min(g.levelIdx, PHYSICS_FACTS.length - 1);
          setCompletedFact(PHYSICS_FACTS[factIdx]);
          if (g.levelIdx >= LEVELS.length - 1) {
            setScreen('win');
          } else {
            setScreen('levelcomplete');
          }
        } else {
          // Reset for retry
          const level = LEVELS[g.levelIdx];
          g.phase = 'placing';
          g.comet = { ...level.comet };
          g.cometTrail = [];
          g.resultTimer = 0;
          g.particles = [];
        }
      }
    }

    // Trajectory recompute each frame while placing (cheap)
    if (g.phase === 'placing') {
      g.trajectoryCache = runSimulation(LEVELS[g.levelIdx], g.playerPlanets);
    }

    // Draw
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawScene(ctx, g, LEVELS[g.levelIdx]);

    animRef.current = requestAnimationFrame(gameLoop);
  }, [drawScene, playSound, spawnParticles]);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Font injection
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = "@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');";
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Start game loop when playing
  useEffect(() => {
    if (screen !== 'playing') {
      cancelAnimationFrame(animRef.current);
      lastTimeRef.current = null;
      return;
    }
    initLevel(levelIndex);
    lastTimeRef.current = null;
    animRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [screen, levelIndex, initLevel, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    if (screen !== 'playing') return;
    const onKey = (e) => {
      const g = gameRef.current;
      if (!g) return;
      if (e.key === '1') handleSelectType('small');
      if (e.key === '2') handleSelectType('medium');
      if (e.key === '3') handleSelectType('large');
      if (e.key === 'Enter') handleLaunch();
      if (e.key === 'r' || e.key === 'R') handleReset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, handleSelectType, handleLaunch, handleReset]);

  // ── Derived UI state ───────────────────────────────────────────────────────
  const g = gameRef.current;
  const remaining = g ? g.planetsRemaining : LEVELS[levelIndex].planetBudget;

  // ── Render ─────────────────────────────────────────────────────────────────

  const fontFamily = "'Nunito', 'Baloo 2', sans-serif";

  // Back button (shared)
  const backBtn = (
    <div
      onClick={() => { cancelAnimationFrame(animRef.current); navigate('/'); }}
      style={{
        position: 'absolute', top: 12, left: 16,
        color: '#fff', fontSize: 13, cursor: 'pointer',
        zIndex: 20, padding: '8px 14px', borderRadius: 20,
        background: 'rgba(0,0,0,0.45)', border: '2px solid rgba(255,255,255,0.25)',
        fontFamily, fontWeight: 700, userSelect: 'none',
      }}
    >
      ← ARCADE
    </div>
  );

  // ── Menu Screen ────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: 'linear-gradient(135deg,#03051a 0%,#0f0c29 50%,#302b63 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily, position: 'relative', overflow: 'hidden',
      }}>
        {backBtn}

        {/* Stars bg */}
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            borderRadius: '50%',
            background: 'white',
            opacity: 0.4 + (i % 5) * 0.1,
          }} />
        ))}

        <div style={{ fontSize: 64, marginBottom: 8 }}>🌌</div>
        <h1 style={{
          color: '#e0f2fe', fontSize: 'clamp(28px,5vw,48px)', margin: '0 0 8px',
          fontWeight: 900, textAlign: 'center', textShadow: '0 0 20px #7c3aed',
          letterSpacing: 1,
        }}>
          Gravity Lab
        </h1>
        <p style={{ color: '#7c3aed', fontWeight: 700, fontSize: 16, margin: '0 0 24px', letterSpacing: 2 }}>
          BEND THE COSMOS
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 16,
          padding: '20px 28px', maxWidth: 400, marginBottom: 28,
          border: '1px solid rgba(124,58,237,0.3)', color: '#cbd5e1',
          fontSize: 15, lineHeight: 1.6, textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 12px' }}>
            <strong style={{ color: '#a78bfa' }}>Gravity</strong> pulls everything toward mass.
            Place planets to <strong style={{ color: '#34d399' }}>bend</strong> your comet's path and guide it to the ⭐ portal!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
            {PLANET_TYPES.map(pt => (
              <div key={pt.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: pt.color, flexShrink: 0 }} />
                <span style={{ color: '#94a3b8' }}>{pt.label} = {pt.id === 'small' ? 'weak' : pt.id === 'medium' ? 'medium' : 'strong'} pull</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setScreen('playing')}
          style={{
            background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
            color: '#fff', border: 'none', borderRadius: 30,
            padding: '16px 48px', fontSize: 20, fontWeight: 900,
            cursor: 'pointer', fontFamily,
            boxShadow: '0 0 24px #7c3aed80',
            letterSpacing: 1,
          }}
        >
          🚀 Start Adventure
        </button>

        <p style={{ color: '#475569', fontSize: 12, marginTop: 16 }}>
          8 space puzzles · learn real physics!
        </p>
      </div>
    );
  }

  // ── Level Complete Screen ──────────────────────────────────────────────────
  if (screen === 'levelcomplete') {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        background: 'linear-gradient(135deg,#03051a 0%,#1a0533 50%,#0c1a3a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily, position: 'relative',
      }}>
        {backBtn}
        <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
        <h2 style={{ color: '#fbbf24', fontSize: 32, margin: '0 0 8px', fontWeight: 900 }}>
          Brilliant!
        </h2>
        <p style={{ color: '#94a3b8', margin: '0 0 24px', fontSize: 16 }}>
          Level {levelIndex + 1} complete!
        </p>

        <div style={{
          background: 'rgba(124,58,237,0.15)', border: '2px solid #7c3aed50',
          borderRadius: 16, padding: '20px 28px', maxWidth: 420,
          marginBottom: 32, color: '#e0f2fe', fontSize: 16, lineHeight: 1.7,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔬 Physics Fact!</div>
          <p style={{ margin: 0, color: '#cbd5e1' }}>{completedFact}</p>
        </div>

        <button
          onClick={() => {
            const next = levelIndex + 1;
            setLevelIndex(next);
            setScreen('playing');
          }}
          style={{
            background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
            color: '#fff', border: 'none', borderRadius: 30,
            padding: '14px 40px', fontSize: 18, fontWeight: 900,
            cursor: 'pointer', fontFamily,
            boxShadow: '0 0 20px #7c3aed60',
          }}
        >
          Next Level →
        </button>
      </div>
    );
  }

  // ── Win Screen ─────────────────────────────────────────────────────────────
  if (screen === 'win') {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        background: 'linear-gradient(135deg,#03051a 0%,#1a0533 50%,#0c1a3a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily, position: 'relative',
      }}>
        {backBtn}
        <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
        <h2 style={{ color: '#fbbf24', fontSize: 36, margin: '0 0 8px', fontWeight: 900, textAlign: 'center' }}>
          Gravity Master!
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 16, margin: '0 0 24px', textAlign: 'center', maxWidth: 340 }}>
          You completed all 8 levels and learned how gravity shapes the universe!
        </p>
        <div style={{
          background: 'rgba(251,191,36,0.12)', border: '2px solid #fbbf2440',
          borderRadius: 16, padding: '20px 28px', maxWidth: 420,
          marginBottom: 32, color: '#fde68a', fontSize: 15, lineHeight: 1.7,
          textAlign: 'center',
        }}>
          <p style={{ margin: 0 }}>{completedFact}</p>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => { setLevelIndex(0); setScreen('playing'); }}
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
              color: '#fff', border: 'none', borderRadius: 30,
              padding: '14px 36px', fontSize: 17, fontWeight: 900,
              cursor: 'pointer', fontFamily, boxShadow: '0 0 18px #7c3aed60',
            }}
          >
            🔄 Play Again
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.2)',
              color: '#e0f2fe', borderRadius: 30,
              padding: '14px 36px', fontSize: 17, fontWeight: 700,
              cursor: 'pointer', fontFamily,
            }}
          >
            🏠 Gallery
          </button>
        </div>
      </div>
    );
  }

  // ── Playing Screen ─────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#03051a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily, position: 'relative', overflow: 'hidden',
    }}>
      {backBtn}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onClick={handleCanvasClick}
        onTouchStart={(e) => { e.preventDefault(); handleCanvasMouseMove(e); }}
        onTouchMove={(e) => { e.preventDefault(); handleCanvasMouseMove(e); }}
        onTouchEnd={(e) => { e.preventDefault(); handleCanvasClick(e); }}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => { mouseRef.current = { x: -999, y: -999 }; }}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 140px)',
          borderRadius: 12,
          cursor: g && g.phase === 'placing' ? 'crosshair' : 'default',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 0 40px rgba(124,58,237,0.2)',
          touchAction: 'none',
        }}
      />

      {/* DOM Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginTop: 10, flexWrap: 'wrap', padding: '0 8px',
      }}>

        {/* Planet type buttons */}
        {PLANET_TYPES.map(pt => {
          const count = remaining[pt.id] || 0;
          const selected = uiPlanetType === pt.id;
          return (
            <button
              key={pt.id}
              onClick={() => handleSelectType(pt.id)}
              disabled={count === 0}
              style={{
                background: selected
                  ? `linear-gradient(135deg,${pt.glowColor},${pt.color})`
                  : 'rgba(255,255,255,0.06)',
                color: count === 0 ? '#334155' : '#fff',
                border: selected ? `2px solid ${pt.color}` : '2px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '8px 14px',
                fontSize: 14, fontWeight: 700, cursor: count === 0 ? 'not-allowed' : 'pointer',
                fontFamily, display: 'flex', alignItems: 'center', gap: 6,
                minWidth: 90, justifyContent: 'center',
                opacity: count === 0 ? 0.45 : 1,
                transition: 'all 0.15s',
                boxShadow: selected ? `0 0 12px ${pt.color}60` : 'none',
              }}
            >
              <span style={{
                display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                background: pt.color, flexShrink: 0,
              }} />
              {pt.label} ×{count}
            </button>
          );
        })}

        {/* Launch */}
        <button
          onClick={handleLaunch}
          disabled={!g || g.phase !== 'placing'}
          style={{
            background: (!g || g.phase !== 'placing')
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
            color: (!g || g.phase !== 'placing') ? '#334155' : '#fff',
            border: '2px solid rgba(6,182,212,0.4)',
            borderRadius: 12, padding: '8px 18px',
            fontSize: 15, fontWeight: 900, cursor: (!g || g.phase !== 'placing') ? 'not-allowed' : 'pointer',
            fontFamily, minWidth: 100,
            opacity: (!g || g.phase !== 'placing') ? 0.4 : 1,
            boxShadow: (!g || g.phase !== 'placing') ? 'none' : '0 0 14px #06b6d460',
          }}
        >
          🚀 Launch
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: '#94a3b8',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px 16px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily,
          }}
        >
          ↩ Reset
        </button>
      </div>

      {/* Keyboard hint */}
      <p style={{ color: '#1e293b', fontSize: 11, margin: '4px 0 0', userSelect: 'none' }}>
        Keys: 1/2/3 = planet type · Enter = launch · R = reset
      </p>

      {/* Fail flash */}
      {g && g.phase === 'fail' && (
        <div style={{
          position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%)',
          background: 'rgba(127,29,29,0.85)', border: '2px solid #f87171',
          borderRadius: 16, padding: '14px 28px', color: '#fca5a5',
          fontSize: 20, fontWeight: 900, zIndex: 15, pointerEvents: 'none',
        }}>
          💥 Try again!
        </div>
      )}
    </div>
  );
}
