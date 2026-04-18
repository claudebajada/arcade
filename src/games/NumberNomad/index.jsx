import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function NumberNomad() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const gameRef = useRef(null);
  const touchRef = useRef({ left: false, right: false, jump: false, dash: false });
  const frameRef = useRef(0);
  const [screen, setScreen] = useState("menu");
  const [finalScore, setFinalScore] = useState(0);
  const [finalLevel, setFinalLevel] = useState(1);
  const audioCtxRef = useRef(null);
  const prevKeysRef = useRef({});

  const getAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playSound = (type) => {
    try {
      const ctx = getAudio();
      if (type === "collect") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1047, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
      } else if (type === "wrong") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
      } else if (type === "solve") {
        [523, 659, 784, 1047].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine"; o.frequency.value = f;
          g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
          o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.25);
        });
      } else if (type === "jump") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.08);
      } else if (type === "hurt") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
      } else if (type === "dash") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {}
  };

  // --- MATH EQUATION GENERATION ---
  const generateEquation = (level) => {
    const grade = level <= 3 ? 3 : level <= 6 ? 4 : 5;
    let left, op, right, answer;

    if (grade === 3) {
      const ops = ["+", "-"];
      op = ops[Math.floor(Math.random() * ops.length)];
      if (op === "+") {
        left = Math.floor(Math.random() * 50) + 10;
        right = Math.floor(Math.random() * 50) + 10;
        answer = left + right;
      } else {
        answer = Math.floor(Math.random() * 40) + 10;
        right = Math.floor(Math.random() * (answer - 1)) + 1;
        left = answer + right;
        answer = left - right;
      }
    } else if (grade === 4) {
      const ops = ["+", "-", "×", "÷"];
      op = ops[Math.floor(Math.random() * ops.length)];
      if (op === "+") {
        left = Math.floor(Math.random() * 200) + 50;
        right = Math.floor(Math.random() * 200) + 50;
        answer = left + right;
      } else if (op === "-") {
        left = Math.floor(Math.random() * 300) + 100;
        right = Math.floor(Math.random() * (left - 10)) + 10;
        answer = left - right;
      } else if (op === "×") {
        left = Math.floor(Math.random() * 12) + 2;
        right = Math.floor(Math.random() * 12) + 2;
        answer = left * right;
      } else {
        right = Math.floor(Math.random() * 10) + 2;
        answer = Math.floor(Math.random() * 12) + 2;
        left = right * answer;
      }
    } else {
      const types = ["multi_step", "order_ops", "larger_mult"];
      const type = types[Math.floor(Math.random() * types.length)];
      if (type === "multi_step") {
        const a = Math.floor(Math.random() * 10) + 2;
        const b = Math.floor(Math.random() * 10) + 2;
        const c = Math.floor(Math.random() * 20) + 5;
        left = `${a} × ${b}`;
        op = "+";
        right = c;
        answer = a * b + c;
      } else if (type === "order_ops") {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 5) + 2;
        const c = Math.floor(Math.random() * 5) + 2;
        left = a;
        op = "+";
        right = `${b} × ${c}`;
        answer = a + b * c;
      } else {
        left = Math.floor(Math.random() * 20) + 10;
        right = Math.floor(Math.random() * 20) + 10;
        op = "×";
        answer = left * right;
      }
    }

    const fullEq = `${left} ${op} ${right} = ${answer}`;
    return {
      display: `${left} ${op} ${right}`,
      answer: String(answer),
      full: fullEq,
      parts: splitEquation(fullEq),
    };
  };

  const splitEquation = (fullEq) => {
    const tokens = fullEq.split(" ");
    const parts = [];
    let i = 0;
    while (i < tokens.length) {
      if (tokens[i] === "=") {
        parts.push(tokens.slice(i).join(" "));
        break;
      }
      parts.push(tokens[i]);
      i++;
    }
    return parts;
  };

  const generateDecoys = (equation, level) => {
    const answer = parseInt(equation.answer);
    const decoys = [];
    const count = Math.min(2 + Math.floor(level / 3), 5);
    const offsets = new Set();
    for (let i = 0; i < count; i++) {
      let off;
      do { off = (Math.floor(Math.random() * 15) + 1) * (Math.random() > 0.5 ? 1 : -1); } while (offsets.has(off));
      offsets.add(off);
      decoys.push(isNaN(answer) ? String(Math.floor(Math.random() * 50)) : `= ${answer + off}`);
    }
    if (level > 1) decoys.push(String(Math.floor(Math.random() * 80) + 5));
    return decoys;
  };

  // --- LEVEL GENERATION ---
  const generateLevel = (level) => {
    const W = 1800 + level * 300;
    const H = 800;
    const platforms = [];
    const hazards = [];
    const difficulty = Math.min(level, 10);

    // Ground
    let gx = 0;
    while (gx < W) {
      const pw = level <= 2 ? 200 + Math.random() * 300 : 100 + Math.random() * 200;
      platforms.push({ x: gx, y: H - 50, w: pw, h: 50, type: "ground" });
      const gapBase = level <= 2 ? 30 : 50;
      const gapVar = level <= 2 ? 30 : 40 + difficulty * 5;
      gx += pw + gapBase + Math.random() * gapVar;
    }

    // Floating platforms — built in reachable tiers so you can always climb up
    // Max jump reach is ~130px vertical (double jump), so tiers are spaced 90-120px apart
    const JUMP_REACH = 110; // conservative comfortable reach
    const groundY = H - 50;
    const tiers = [
      groundY - JUMP_REACH,                    // tier 1: ~640
      groundY - JUMP_REACH * 2,                // tier 2: ~530
      groundY - JUMP_REACH * 2.8,              // tier 3: ~440
      groundY - JUMP_REACH * 3.5,              // tier 4: ~365
    ];
    // Only use higher tiers in later levels
    const maxTier = level <= 2 ? 2 : level <= 4 ? 3 : tiers.length;
    const usedTiers = tiers.slice(0, maxTier);

    // Place platforms across the level at each tier
    const platsPerTier = Math.floor((3 + difficulty) / usedTiers.length) + 2;
    usedTiers.forEach((tierY, ti) => {
      for (let i = 0; i < platsPerTier; i++) {
        const section = W / platsPerTier;
        const px = 100 + i * section + Math.random() * (section * 0.6);
        const py = tierY + (Math.random() - 0.5) * 30; // slight Y variation within tier
        const pw = level <= 2 ? 100 + Math.random() * 80 : 75 + Math.random() * 70;
        const isMoving = level >= 3 && Math.random() > 0.8;
        platforms.push({
          x: px, y: py, w: pw, h: 16, type: isMoving ? "moving" : "static",
          moveRange: isMoving ? 30 + Math.random() * 40 : 0,
          moveSpeed: isMoving ? 0.5 + Math.random() * 0.8 : 0,
          moveDir: isMoving ? (Math.random() > 0.6 ? "h" : "v") : "h",
          origX: px, origY: py, phase: Math.random() * Math.PI * 2,
        });
      }
    });

    // Add a few "bridge" platforms between tiers to make paths clearer
    for (let ti = 0; ti < usedTiers.length; ti++) {
      const fromY = ti === 0 ? groundY : usedTiers[ti - 1];
      const toY = usedTiers[ti];
      const midY = (fromY + toY) / 2 + (Math.random() - 0.5) * 20;
      const bridgeCount = 2 + Math.floor(Math.random() * 2);
      for (let b = 0; b < bridgeCount; b++) {
        const bx = 200 + Math.random() * (W - 400);
        const pw = 70 + Math.random() * 60;
        platforms.push({
          x: bx, y: midY, w: pw, h: 16, type: "static",
          moveRange: 0, moveSpeed: 0, moveDir: "h",
          origX: bx, origY: midY, phase: 0,
        });
      }
    }

    // Hazards
    const hazardCount = level <= 1 ? 0 : Math.min(1 + (level - 2) * 2, 12);
    for (let i = 0; i < hazardCount; i++) {
      const plat = platforms[Math.floor(Math.random() * platforms.length)];
      const hx = plat.x + Math.random() * Math.max(0, plat.w - 30);
      const hy = plat.y - 30;
      const isPatrol = level >= 4 && Math.random() > 0.5;
      hazards.push({
        x: hx, y: hy, w: 26, h: 26,
        type: Math.random() > 0.5 ? "eraser" : "pencil_spike",
        patrol: isPatrol, patrolRange: 60 + Math.random() * 80,
        origX: hx, origY: hy, phase: Math.random() * Math.PI * 2,
      });
    }

    // Equation + fragments
    const eq = generateEquation(level);
    const decoys = generateDecoys(eq, level);
    const fragments = [];
    const usablePlatforms = platforms.filter(p => p.w >= 60);

    eq.parts.forEach((part, idx) => {
      const segStart = (idx / eq.parts.length) * W * 0.8 + W * 0.05;
      const segEnd = ((idx + 1) / eq.parts.length) * W * 0.8 + W * 0.05;
      let bestPlat = usablePlatforms.reduce((best, pl) => {
        const px = pl.x + pl.w / 2;
        if (px >= segStart && px <= segEnd) {
          if (!best || Math.abs(px - (segStart + segEnd) / 2) < Math.abs((best.x + best.w / 2) - (segStart + segEnd) / 2)) return pl;
        }
        return best;
      }, null);
      if (!bestPlat) bestPlat = usablePlatforms[Math.min(idx, usablePlatforms.length - 1)];
      const fx = bestPlat.x + 20 + Math.random() * Math.max(0, bestPlat.w - 40);
      const fy = bestPlat.y - 40 - Math.random() * 30;
      fragments.push({ x: fx, y: fy, text: part, correct: true, collected: false, bobPhase: Math.random() * Math.PI * 2, order: idx });
    });

    decoys.forEach((d) => {
      const plat = usablePlatforms[Math.floor(Math.random() * usablePlatforms.length)];
      const fx = plat.x + 10 + Math.random() * Math.max(0, plat.w - 20);
      const fy = plat.y - 35 - Math.random() * 40;
      fragments.push({ x: fx, y: fy, text: d, correct: false, collected: false, bobPhase: Math.random() * Math.PI * 2, order: -1 });
    });

    return { W, H, platforms, hazards, fragments, equation: eq };
  };

  // --- DRAWING HELPERS ---
  const sketchLine = (ctx, x1, y1, x2, y2, wobble = 1.5) => {
    const steps = Math.max(2, Math.floor(Math.hypot(x2 - x1, y2 - y1) / 20));
    ctx.beginPath();
    ctx.moveTo(x1 + (Math.random() - 0.5) * wobble, y1 + (Math.random() - 0.5) * wobble);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      ctx.lineTo(x1 + (x2 - x1) * t + (Math.random() - 0.5) * wobble, y1 + (y2 - y1) * t + (Math.random() - 0.5) * wobble);
    }
    ctx.stroke();
  };

  const sketchRect = (ctx, x, y, w, h, wobble = 1.5) => {
    sketchLine(ctx, x, y, x + w, y, wobble);
    sketchLine(ctx, x + w, y, x + w, y + h, wobble);
    sketchLine(ctx, x + w, y + h, x, y + h, wobble);
    sketchLine(ctx, x, y + h, x, y, wobble);
  };

  const drawGraphPaper = (ctx, cw, ch, camX, camY) => {
    ctx.fillStyle = "#faf8f0";
    ctx.fillRect(0, 0, cw, ch);
    const gs = 25, gl = 125;
    ctx.strokeStyle = "#dde8f4"; ctx.lineWidth = 0.4;
    for (let x = -(camX % gs); x < cw; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
    for (let y = -(camY % gs); y < ch; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
    ctx.strokeStyle = "#b0c8e0"; ctx.lineWidth = 0.8;
    for (let x = -(camX % gl); x < cw; x += gl) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
    for (let y = -(camY % gl); y < ch; y += gl) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
    ctx.strokeStyle = "#e8a0a0"; ctx.lineWidth = 1.5;
    for (let mx = 80 - (camX % 800); mx < cw; mx += 800) { ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, ch); ctx.stroke(); }
  };

  const drawPlayer = (ctx, p, time) => {
    if (p.invincible && Math.floor(time * 12) % 2 === 0) return;
    ctx.save();
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    let sx = 1, sy = 1;
    if (p.dashing) { sx = 1.3; sy = 0.7; }
    else if (!p.grounded && p.vy < -2) { sx = 0.88; sy = 1.15; }
    else if (!p.grounded && p.vy > 2) { sx = 1.12; sy = 0.88; }
    else if (p.grounded) { sx = 1 + Math.sin(time * 5) * 0.02; sy = 1 - Math.sin(time * 5) * 0.02; }

    ctx.translate(cx, cy);
    ctx.scale(p.facingRight ? 1 : -1, 1);
    ctx.scale(sx, sy);

    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.beginPath(); ctx.ellipse(0, p.h / 2 + 3, p.w / 2 + 4, 4, 0, 0, Math.PI * 2); ctx.fill();

    if (p.dashing) {
      ctx.fillStyle = "rgba(77,150,255,0.2)";
      ctx.beginPath(); ctx.ellipse(-12, 0, p.w / 2 + 6, p.h / 2, 0, 0, Math.PI * 2); ctx.fill();
    }

    const bw = p.w / 2 + 2, bh = p.h / 2 + 2;
    const bg = ctx.createRadialGradient(-3, -3, 2, 0, 0, bw + 4);
    bg.addColorStop(0, "#4a5568"); bg.addColorStop(0.6, "#2d3748"); bg.addColorStop(1, "#1a202c");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(0, -bh);
    ctx.bezierCurveTo(bw * 1.1, -bh * 0.8, bw * 1.2, bh * 0.5, bw * 0.5, bh);
    ctx.bezierCurveTo(bw * 0.1, bh * 1.1, -bw * 0.1, bh * 1.1, -bw * 0.5, bh);
    ctx.bezierCurveTo(-bw * 1.2, bh * 0.5, -bw * 1.1, -bh * 0.8, 0, -bh);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath(); ctx.ellipse(-3, -5, 5, 7, -0.3, 0, Math.PI * 2); ctx.fill();

    const ey = -4, bk = Math.sin(time * 0.7) > -0.95 ? 1 : 0.1;
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(5, ey, 5, 5.5 * bk, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1a1a2e"; ctx.beginPath(); ctx.ellipse(6.5, ey, 2.5, 2.8 * bk, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(7.5, ey - 1.5, 0.8, 0.8 * bk, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-4, ey + 1, 4, 4.5 * bk, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1a1a2e"; ctx.beginPath(); ctx.ellipse(-3, ey + 1, 2, 2.2 * bk, 0, 0, Math.PI * 2); ctx.fill();

    if (p.dashing) { ctx.strokeStyle = "#a0aec0"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(1, 5); ctx.lineTo(7, 5); ctx.stroke(); }
    else if (p.vy < -4) { ctx.fillStyle = "#e53e3e"; ctx.beginPath(); ctx.ellipse(3, 6, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.strokeStyle = "#a0aec0"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(3, 4, 3, -0.1, Math.PI * 0.65); ctx.stroke(); }

    const mv = keysRef.current["ArrowLeft"] || keysRef.current["ArrowRight"] || keysRef.current["a"] || keysRef.current["d"] || touchRef.current.left || touchRef.current.right;
    if (p.grounded && mv) {
      const lp = time * 14;
      ctx.strokeStyle = "#2d3748"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-3, bh - 2); ctx.lineTo(-5 + Math.sin(lp) * 5, bh + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, bh - 2); ctx.lineTo(7 + Math.sin(lp + Math.PI) * 5, bh + 5); ctx.stroke();
    }
    ctx.restore();

    const pw2 = 6, tot = p.maxHp * (pw2 + 2);
    for (let i = 0; i < p.maxHp; i++) {
      ctx.fillStyle = i < p.hp ? "#e53e3e" : "#e2e8f0";
      ctx.strokeStyle = "#2d3748"; ctx.lineWidth = 0.8;
      const hx = cx - tot / 2 + i * (pw2 + 2), hy = p.y - 14;
      ctx.beginPath();
      ctx.moveTo(hx + pw2 / 2, hy + 2);
      ctx.bezierCurveTo(hx + pw2 / 2, hy, hx, hy, hx, hy + 2);
      ctx.bezierCurveTo(hx, hy + 4, hx + pw2 / 2, hy + 6, hx + pw2 / 2, hy + 6);
      ctx.bezierCurveTo(hx + pw2 / 2, hy + 6, hx + pw2, hy + 4, hx + pw2, hy + 2);
      ctx.bezierCurveTo(hx + pw2, hy, hx + pw2 / 2, hy, hx + pw2 / 2, hy + 2);
      ctx.fill(); ctx.stroke();
    }
  };

  const drawPlatform = (ctx, p, time) => {
    if (p.type === "ground") {
      ctx.fillStyle = "#8b7355"; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#6b5335"; ctx.lineWidth = 0.8;
      for (let hx = 0; hx < p.w; hx += 9) { ctx.beginPath(); ctx.moveTo(p.x + hx, p.y); ctx.lineTo(p.x + hx + 8, p.y + p.h); ctx.stroke(); }
      ctx.strokeStyle = "#4a3520"; ctx.lineWidth = 2; sketchRect(ctx, p.x, p.y, p.w, p.h, 1);
      ctx.strokeStyle = "#48bb78"; ctx.lineWidth = 2;
      for (let gx = p.x + 5; gx < p.x + p.w - 5; gx += 10 + Math.random() * 10) {
        const gh = 3 + Math.random() * 7;
        ctx.beginPath(); ctx.moveTo(gx, p.y); ctx.quadraticCurveTo(gx + (Math.random() - 0.5) * 5, p.y - gh, gx + 2, p.y - gh); ctx.stroke();
      }
    } else {
      const colors = ["#ffd93d", "#ff6b6b", "#6bcb77", "#4d96ff", "#ff922b"];
      ctx.fillStyle = colors[Math.floor((p.origX || p.x) * 0.013) % colors.length];
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#2d3748"; ctx.lineWidth = 2; sketchRect(ctx, p.x, p.y, p.w, p.h, 1);
      if (p.type === "moving") {
        ctx.setLineDash([3, 4]); ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 1;
        if (p.moveDir === "h") { ctx.beginPath(); ctx.moveTo(p.x - 8, p.y + p.h / 2); ctx.lineTo(p.x + p.w + 8, p.y + p.h / 2); ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(p.x + p.w / 2, p.y - 8); ctx.lineTo(p.x + p.w / 2, p.y + p.h + 8); ctx.stroke(); }
        ctx.setLineDash([]);
      }
    }
  };

  const drawFragment = (ctx, f, time, level) => {
    if (f.collected) return;
    const bob = Math.sin(time * 2.5 + f.bobPhase) * 5;
    const fx = f.x, fy = f.y + bob;
    ctx.save();

    // Color hints fade out by level:
    // 1-2: full green/red  3: subtle tint  4+: all identical neutral
    const showColors = level <= 2;
    const subtleHint = level === 3;

    if (showColors) {
      ctx.shadowColor = f.correct ? "rgba(72,187,120,0.5)" : "rgba(229,62,62,0.25)";
    } else if (subtleHint) {
      ctx.shadowColor = f.correct ? "rgba(72,187,120,0.15)" : "rgba(229,62,62,0.08)";
    } else {
      ctx.shadowColor = "rgba(100,100,100,0.15)";
    }
    ctx.shadowBlur = 6 + Math.sin(time * 3 + f.bobPhase) * 4;
    ctx.font = "bold 15px 'Courier New', monospace";
    const tw = ctx.measureText(f.text).width;
    const pw = Math.max(tw + 18, 34);

    if (showColors) {
      ctx.fillStyle = f.correct ? "#edfff4" : "#fff5f5";
    } else if (subtleHint) {
      ctx.fillStyle = f.correct ? "#f5fff8" : "#fff9f9";
    } else {
      ctx.fillStyle = "#fffff5"; // neutral warm white for all
    }
    ctx.fillRect(fx - pw / 2, fy - 13, pw, 26);

    if (showColors) {
      ctx.strokeStyle = f.correct ? "#48bb78" : "#fc8181";
    } else if (subtleHint) {
      ctx.strokeStyle = f.correct ? "#9ae6b4" : "#feb2b2";
    } else {
      ctx.strokeStyle = "#cbd5e0"; // neutral grey border for all
    }
    ctx.lineWidth = 2;
    sketchRect(ctx, fx - pw / 2, fy - 13, pw, 26, 1);

    // Order number only on levels 1-3
    if (f.correct && level <= 3) {
      ctx.fillStyle = showColors ? "#48bb78" : "#a0aec0";
      ctx.font = "bold 9px 'Courier New', monospace";
      ctx.textAlign = "center"; ctx.fillText(`${f.order + 1}`, fx - pw / 2 + 8, fy - 5);
    }

    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
    ctx.fillStyle = "#2d3748"; ctx.font = "bold 15px 'Courier New', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(f.text, fx, fy);
    ctx.restore();
  };

  const drawHazard = (ctx, h, time) => {
    const b = Math.sin(time * 4 + h.phase) * 2;
    if (h.type === "eraser") {
      ctx.fillStyle = "#fc8181"; ctx.fillRect(h.x, h.y + b, h.w, h.h);
      ctx.fillStyle = "#feb2b2"; ctx.fillRect(h.x + 2, h.y + b + 2, h.w - 4, 5);
      ctx.strokeStyle = "#c53030"; ctx.lineWidth = 1.5; sketchRect(ctx, h.x, h.y + b, h.w, h.h, 1);
      ctx.fillStyle = "#1a1a2e"; ctx.fillRect(h.x + 6, h.y + b + 11, 4, 3); ctx.fillRect(h.x + 16, h.y + b + 11, 4, 3);
      ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(h.x + 5, h.y + b + 9); ctx.lineTo(h.x + 11, h.y + b + 11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(h.x + 21, h.y + b + 9); ctx.lineTo(h.x + 15, h.y + b + 11); ctx.stroke();
    } else {
      ctx.fillStyle = "#ecc94b";
      ctx.beginPath(); ctx.moveTo(h.x + h.w / 2, h.y + b); ctx.lineTo(h.x + h.w, h.y + h.h + b); ctx.lineTo(h.x, h.y + h.h + b); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#d69e2e"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#2d3748"; ctx.beginPath();
      ctx.moveTo(h.x + h.w / 2, h.y + b); ctx.lineTo(h.x + h.w / 2 + 3, h.y + b + 8); ctx.lineTo(h.x + h.w / 2 - 3, h.y + b + 8); ctx.closePath(); ctx.fill();
    }
  };

  const drawCompass = (ctx, cw, ch, px, py, fragments, camX, camY, timeSinceCollect, level) => {
    const uncollected = fragments.filter(f => f.correct && !f.collected);
    if (uncollected.length === 0) return;

    // Compass behavior by level:
    // Level 1-2: always visible (tutorial)
    // Level 3-4: appears after 10s of no collection, fades in over 3s
    // Level 5+: appears after 15s, fades in over 3s
    const threshold = level <= 2 ? 0 : level <= 4 ? 10 : 15;
    const fadeTime = 3;
    if (timeSinceCollect < threshold) return;
    const alpha = level <= 2 ? 0.75 : Math.min(0.7, (timeSinceCollect - threshold) / fadeTime * 0.7);

    const target = uncollected.reduce((a, b) => a.order < b.order ? a : b);
    const sx = target.x - camX, sy = target.y - camY;
    if (sx > 30 && sx < cw - 30 && sy > 60 && sy < ch - 30) return;
    const dx = target.x - px, dy = target.y - py;
    const angle = Math.atan2(dy, dx);
    const r = Math.min(cw, ch) / 2 - 44;
    const ax = cw / 2 + Math.cos(angle) * r;
    const ay = ch / 2 + Math.sin(angle) * r;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(ax, ay); ctx.rotate(angle);
    ctx.fillStyle = "rgba(72,187,120,0.85)";
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#276749"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(72,187,120,0.7)"; ctx.font = "bold 9px 'Courier New', monospace"; ctx.textAlign = "center";
    ctx.fillText(`Piece #${target.order + 1}`, ax, ay + 16);
    ctx.restore();
  };

  const spawnParticles = (g, x, y, color, count, text) => {
    for (let i = 0; i < count; i++) {
      g.particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5 - 2, life: 1, decay: 0.025 + Math.random() * 0.02, color, size: 2 + Math.random() * 3, text: i === 0 ? text : null });
    }
  };

  // --- GAME INIT ---
  const initGame = useCallback(() => {
    const level = 1;
    const ld = generateLevel(level);
    gameRef.current = {
      player: { x: 80, y: 500, w: 22, h: 26, vx: 0, vy: 0, grounded: false, facingRight: true, hp: 5, maxHp: 5, invincible: false, invTimer: 0, jumpCount: 0, maxJumps: 2, dashTimer: 0, dashCooldown: 0, dashing: false, canDash: true, wallSliding: false, wallDir: 0, coyoteTime: 0, jumpLock: false, dashLock: false },
      level, levelData: ld, camX: 0, camY: 0, score: 0, collected: [], collectedOrder: [], particles: [], screenShake: 0, time: 0,
      equationDisplay: ld.equation.display + " = ?", targetAnswer: ld.equation.answer, totalCorrect: ld.equation.parts.length, correctCollected: 0, comboTimer: 0, combo: 0, levelComplete: false, levelTransition: 0, toast: null, toastTimer: 0, timeSinceCollect: 0,
    };
  }, []);

  // --- GAME LOOP ---
  const DASH_DUR = 0.12;
  const DASH_CD = 0.45;

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameRef.current) return;
    const ctx = canvas.getContext("2d");
    const g = gameRef.current;
    const p = g.player;
    const cw = canvas.width, ch = canvas.height;
    const dt = 1 / 60;
    g.time += dt;
    const keys = keysRef.current;
    const touch = touchRef.current;
    const prev = prevKeysRef.current;

    if (g.levelComplete) {
      g.levelTransition += dt;
      if (g.levelTransition > 2.5) {
        g.level++;
        g.levelData = generateLevel(g.level);
        g.equationDisplay = g.levelData.equation.display + " = ?";
        g.targetAnswer = g.levelData.equation.answer;
        g.totalCorrect = g.levelData.equation.parts.length;
        g.correctCollected = 0; g.collected = []; g.collectedOrder = [];
        g.levelComplete = false; g.levelTransition = 0; g.timeSinceCollect = 0;
        p.x = 80; p.y = 500; p.vx = 0; p.vy = 0;
        p.hp = Math.min(p.hp + 2, p.maxHp);
      }
    }

    const moveLeft = keys["ArrowLeft"] || keys["a"] || touch.left;
    const moveRight = keys["ArrowRight"] || keys["d"] || touch.right;
    const jumpDown = keys["ArrowUp"] || keys["w"] || keys[" "] || touch.jump;
    const dashDown = keys["Shift"] || touch.dash;
    const jumpJust = jumpDown && !prev.jump;
    const dashJust = dashDown && !prev.dash;
    prev.jump = jumpDown;
    prev.dash = dashDown;

    const GRAVITY = 0.75, MOVE_ACCEL = 1.8, MAX_SPD = 4.2, GND_DECEL = 0.6, AIR_DECEL = 0.85;
    const JUMP_F = -12.5, DJUMP_F = -11, MAX_FALL = 13, WALL_SLD = 1.8, DASH_SPD = 14;

    if (!g.levelComplete) {
      if (p.dashing) { p.dashTimer -= dt; if (p.dashTimer <= 0) { p.dashing = false; p.vx *= 0.25; } }

      if (!p.dashing) {
        if (moveLeft && !moveRight) { p.vx = Math.max(p.vx - MOVE_ACCEL, -MAX_SPD); p.facingRight = false; }
        else if (moveRight && !moveLeft) { p.vx = Math.min(p.vx + MOVE_ACCEL, MAX_SPD); p.facingRight = true; }
        else {
          p.vx *= p.grounded ? GND_DECEL : AIR_DECEL;
          if (Math.abs(p.vx) < 0.25) p.vx = 0;
        }
        if (Math.abs(p.vx) > MAX_SPD) p.vx = Math.sign(p.vx) * MAX_SPD;
        p.vy += GRAVITY;
        if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      }

      p.wallSliding = false;
      if (!p.grounded && !p.dashing && p.vy > 0) {
        for (const pl of g.levelData.platforms) {
          if (p.y + p.h > pl.y + 4 && p.y < pl.y + pl.h - 4) {
            const tR = moveRight && p.x + p.w >= pl.x - 1 && p.x + p.w <= pl.x + 5;
            const tL = moveLeft && p.x <= pl.x + pl.w + 1 && p.x >= pl.x + pl.w - 5;
            if (tR || tL) { p.wallSliding = true; p.wallDir = tR ? 1 : -1; p.vy = Math.min(p.vy, WALL_SLD); p.jumpCount = 1; break; }
          }
        }
      }

      if (p.grounded) p.coyoteTime = 5; else if (p.coyoteTime > 0) p.coyoteTime--;

      if (jumpJust) {
        if (p.wallSliding) { p.vx = -p.wallDir * 7; p.vy = -10.5; p.jumpCount = 1; p.wallSliding = false; playSound("jump"); spawnParticles(g, p.x + p.w / 2, p.y + p.h, "rgba(150,150,200,0.4)", 4); }
        else if (p.coyoteTime > 0 && p.jumpCount === 0) { p.vy = JUMP_F; p.jumpCount = 1; p.coyoteTime = 0; playSound("jump"); spawnParticles(g, p.x + p.w / 2, p.y + p.h, "rgba(150,150,150,0.4)", 3); }
        else if (p.jumpCount === 1 && p.jumpCount < p.maxJumps) { p.vy = DJUMP_F; p.jumpCount = 2; playSound("jump"); spawnParticles(g, p.x + p.w / 2, p.y + p.h, "rgba(150,150,200,0.4)", 4); }
      }

      if (p.dashCooldown > 0) p.dashCooldown -= dt;
      if (dashJust && !p.dashing && p.dashCooldown <= 0) {
        p.dashing = true; p.dashTimer = DASH_DUR; p.dashCooldown = DASH_CD;
        p.vx = (p.facingRight ? 1 : -1) * DASH_SPD; p.vy = 0;
        playSound("dash"); spawnParticles(g, p.x + p.w / 2, p.y + p.h / 2, "rgba(77,150,255,0.4)", 5);
      }

      p.x += p.vx; p.y += p.vy;
    }

    g.levelData.platforms.forEach((pl) => {
      if (pl.type === "moving") {
        if (pl.moveDir === "h") pl.x = pl.origX + Math.sin(g.time * pl.moveSpeed + pl.phase) * pl.moveRange;
        else pl.y = pl.origY + Math.sin(g.time * pl.moveSpeed + pl.phase) * pl.moveRange;
      }
    });

    p.grounded = false;
    for (const pl of g.levelData.platforms) {
      if (p.x + p.w > pl.x + 2 && p.x < pl.x + pl.w - 2 && p.y + p.h > pl.y && p.y + p.h < pl.y + pl.h + 10 && p.vy >= 0) {
        p.y = pl.y - p.h; p.vy = 0; p.grounded = true; p.jumpCount = 0;
        if (pl.type === "moving" && pl.moveDir === "h") p.x += Math.cos(g.time * pl.moveSpeed + pl.phase) * pl.moveRange * pl.moveSpeed * dt;
      }
    }

    if (p.y > g.levelData.H + 80) {
      p.hp--; playSound("hurt"); g.screenShake = 8;
      if (p.hp <= 0) { setFinalScore(g.score); setFinalLevel(g.level); setScreen("gameover"); return; }
      p.x = 80; p.y = 400; p.vx = 0; p.vy = 0;
    }
    if (p.x < 0) { p.x = 0; p.vx = 0; }
    if (p.x > g.levelData.W - p.w) { p.x = g.levelData.W - p.w; p.vx = 0; }

    if (p.invincible) { p.invTimer -= dt; if (p.invTimer <= 0) p.invincible = false; }

    g.levelData.hazards.forEach((h) => {
      if (h.patrol) h.x = h.origX + Math.sin(g.time * 1.2 + h.phase) * h.patrolRange;
      if (!p.invincible && !p.dashing && p.x + p.w > h.x + 3 && p.x < h.x + h.w - 3 && p.y + p.h > h.y + 3 && p.y < h.y + h.h - 3) {
        p.hp--; p.invincible = true; p.invTimer = 1.5; p.vy = -7; p.vx = (p.x < h.x ? -1 : 1) * 4;
        g.screenShake = 6; playSound("hurt"); spawnParticles(g, p.x + p.w / 2, p.y + p.h / 2, "#e53e3e", 6);
        if (p.hp <= 0) { setFinalScore(g.score); setFinalLevel(g.level); setScreen("gameover"); return; }
      }
    });

    if (!g.levelComplete) {
      g.levelData.fragments.forEach((f) => {
        if (f.collected) return;
        if (Math.hypot(p.x + p.w / 2 - f.x, p.y + p.h / 2 - f.y) < 30) {
          f.collected = true;
          if (f.correct) {
            g.correctCollected++; g.timeSinceCollect = 0; g.collected.push(f.text);
            g.collectedOrder.push({ text: f.text, order: f.order });
            g.score += 100 * (1 + g.combo * 0.5); g.combo++; g.comboTimer = 3;
            playSound("collect"); spawnParticles(g, f.x, f.y, "#48bb78", 8, `+${Math.floor(100 * (1 + (g.combo - 1) * 0.5))}`);
            g.toast = `✓ Piece ${g.correctCollected}/${g.totalCorrect}`; g.toastTimer = 1.2;
            if (g.correctCollected >= g.totalCorrect) {
              g.levelComplete = true; g.levelTransition = 0; g.score += 500 * g.level;
              playSound("solve");
              for (let i = 0; i < 25; i++) spawnParticles(g, p.x + p.w / 2 + (Math.random() - 0.5) * 120, p.y + (Math.random() - 0.5) * 80, ["#ffd93d", "#48bb78", "#4d96ff", "#ff6b6b", "#9f7aea"][i % 5], 2);
            }
          } else {
            p.hp--; p.invincible = true; p.invTimer = 1; g.combo = 0; g.screenShake = 5;
            playSound("wrong"); spawnParticles(g, f.x, f.y, "#e53e3e", 8, "✗ WRONG");
            g.toast = "✗ Wrong piece! −1 HP"; g.toastTimer = 1.5;
            if (p.hp <= 0) { setFinalScore(g.score); setFinalLevel(g.level); setScreen("gameover"); return; }
          }
        }
      });
    }

    if (g.comboTimer > 0) g.comboTimer -= dt; else g.combo = 0;
    g.timeSinceCollect += dt;
    if (g.toastTimer > 0) g.toastTimer -= dt;
    g.particles = g.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.08; pt.life -= pt.decay; return pt.life > 0; });
    if (g.screenShake > 0) g.screenShake *= 0.82;

    const tcx = p.x - cw / 2 + p.w / 2, tcy = p.y - ch / 2 + p.h / 2;
    g.camX += (tcx - g.camX) * 0.1; g.camY += (tcy - g.camY) * 0.1;
    g.camX = Math.max(0, Math.min(g.levelData.W - cw, g.camX));
    g.camY = Math.max(0, Math.min(g.levelData.H - ch, g.camY));

    // === RENDER ===
    ctx.save();
    if (g.screenShake > 0.5) ctx.translate((Math.random() - 0.5) * g.screenShake, (Math.random() - 0.5) * g.screenShake);
    drawGraphPaper(ctx, cw, ch, g.camX, g.camY);
    ctx.save(); ctx.translate(-g.camX, -g.camY);
    g.levelData.platforms.forEach(pl => drawPlatform(ctx, pl, g.time));
    ctx.font = "bold 15px 'Courier New', monospace";
    g.levelData.fragments.forEach(f => drawFragment(ctx, f, g.time, g.level));
    g.levelData.hazards.forEach(h => drawHazard(ctx, h, g.time));
    g.particles.forEach(pt => {
      ctx.globalAlpha = pt.life; ctx.fillStyle = pt.color;
      if (pt.text) { ctx.font = `bold ${10 + pt.size}px 'Courier New', monospace`; ctx.textAlign = "center"; ctx.fillText(pt.text, pt.x, pt.y); }
      else { ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill(); }
    }); ctx.globalAlpha = 1;
    drawPlayer(ctx, p, g.time);
    ctx.restore();

    drawCompass(ctx, cw, ch, p.x + p.w / 2, p.y + p.h / 2, g.levelData.fragments, g.camX, g.camY, g.timeSinceCollect, g.level);

    // HUD
    ctx.fillStyle = "rgba(250,248,240,0.93)"; ctx.fillRect(0, 0, cw, 54);
    ctx.strokeStyle = "#c8d8e8"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 54); ctx.lineTo(cw, 54); ctx.stroke();

    ctx.fillStyle = "#2d3748"; ctx.font = "bold 13px 'Courier New', monospace"; ctx.textAlign = "left";
    ctx.fillText(`Lvl ${g.level}`, 14, 18);
    ctx.fillStyle = "#a0aec0"; ctx.font = "11px 'Courier New', monospace";
    ctx.fillText(g.level <= 3 ? "3rd Grade" : g.level <= 6 ? "4th Grade" : "5th Grade", 14, 34);

    if (p.dashCooldown > 0) { ctx.fillStyle = "rgba(77,150,255,0.3)"; ctx.fillRect(14, 40, 50 * (p.dashCooldown / DASH_CD), 4); }
    else { ctx.fillStyle = "rgba(77,150,255,0.7)"; ctx.fillRect(14, 40, 50, 4); }
    ctx.fillStyle = "#a0aec0"; ctx.font = "8px 'Courier New', monospace"; ctx.fillText("DASH", 14, 50);

    ctx.textAlign = "center"; ctx.font = "bold 17px 'Courier New', monospace"; ctx.fillStyle = "#2d3748";
    ctx.fillText(g.equationDisplay, cw / 2, 20);
    ctx.font = "12px 'Courier New', monospace"; ctx.fillStyle = "#48bb78";
    const sorted = [...g.collectedOrder].sort((a, b) => a.order - b.order);
    ctx.fillText(sorted.map(c => c.text).join("  ") || `Collect ${g.totalCorrect} equation pieces!`, cw / 2, 38);
    const dotY = 48, ds = 4, dw = g.totalCorrect * (ds * 2 + 4);
    for (let i = 0; i < g.totalCorrect; i++) {
      ctx.fillStyle = i < g.correctCollected ? "#48bb78" : "#e2e8f0";
      ctx.beginPath(); ctx.arc(cw / 2 - dw / 2 + i * (ds * 2 + 4) + ds, dotY, ds, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#2d3748"; ctx.lineWidth = 0.5; ctx.stroke();
    }

    ctx.textAlign = "right"; ctx.font = "bold 13px 'Courier New', monospace"; ctx.fillStyle = "#2d3748";
    ctx.fillText(`${Math.floor(g.score)}`, cw - 14, 18);
    if (g.combo > 1) { ctx.fillStyle = "#d69e2e"; ctx.font = "bold 11px 'Courier New', monospace"; ctx.fillText(`×${g.combo} combo`, cw - 14, 34); }

    if (g.toastTimer > 0 && g.toast) {
      ctx.globalAlpha = Math.min(1, g.toastTimer * 2.5);
      ctx.font = "bold 20px 'Courier New', monospace"; ctx.textAlign = "center";
      ctx.fillStyle = g.toast.startsWith("✓") ? "#276749" : "#c53030";
      ctx.fillText(g.toast, cw / 2, 90); ctx.globalAlpha = 1;
    }

    if (g.levelComplete) {
      ctx.fillStyle = `rgba(250,248,240,${Math.min(0.88, g.levelTransition * 0.45)})`;
      ctx.fillRect(0, 54, cw, ch - 54);
      if (g.levelTransition > 0.3) {
        ctx.fillStyle = "#2d3748"; ctx.font = "bold 30px 'Courier New', monospace"; ctx.textAlign = "center";
        ctx.fillText("✓ SOLVED!", cw / 2, ch / 2 - 35);
        ctx.font = "bold 18px 'Courier New', monospace"; ctx.fillStyle = "#48bb78";
        ctx.fillText(g.levelData.equation.full, cw / 2, ch / 2);
        ctx.fillStyle = "#718096"; ctx.font = "14px 'Courier New', monospace";
        ctx.fillText(`+${500 * g.level} bonus!`, cw / 2, ch / 2 + 28);
        ctx.fillText(`Next: Level ${g.level + 1}`, cw / 2, ch / 2 + 52);
      }
    }

    if (g.time < 6) {
      ctx.globalAlpha = Math.max(0, 1 - g.time / 6);
      ctx.fillStyle = "#718096"; ctx.font = "11px 'Courier New', monospace"; ctx.textAlign = "center";
      ctx.fillText("Arrows/WASD = Move • Space = Jump(×2) • Shift = Dash", cw / 2, ch - 16);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    frameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');`;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = Math.min(window.innerWidth, 1100); canvas.height = Math.min(window.innerHeight - 10, 700); };
    resize(); window.addEventListener("resize", resize);
    initGame(); prevKeysRef.current = {};
    frameRef.current = requestAnimationFrame(gameLoop);
    const kd = (e) => { keysRef.current[e.key] = true; if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault(); };
    const ku = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener("resize", resize); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); keysRef.current = {}; prevKeysRef.current = {}; };
  }, [screen, initGame, gameLoop]);

  if (screen === "menu") {
    return (
      <div style={{ minHeight: "100vh", background: "#faf8f0", backgroundImage: "linear-gradient(#d4e4f7 1px, transparent 1px), linear-gradient(90deg, #d4e4f7 1px, transparent 1px)", backgroundSize: "25px 25px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Patrick Hand', 'Courier New', monospace", overflow: "hidden", position: "relative" }}>
        <div onClick={() => navigate("/")} style={{ position: "absolute", top: 12, left: 16, color: "#fff", fontSize: 13, cursor: "pointer", zIndex: 10, padding: "8px 14px", borderRadius: 20, background: "rgba(0,0,0,0.4)", border: "2px solid rgba(255,255,255,0.3)", fontFamily: "'Nunito','Baloo 2',sans-serif", fontWeight: 700, userSelect: "none" }}>← ARCADE</div>
        <div style={{ position: "absolute", left: 80, top: 0, bottom: 0, width: 2, background: "#e8a0a0" }} />
        <div style={{ position: "relative", marginBottom: 16 }}>
          <h1 style={{ fontSize: "clamp(40px, 8vw, 68px)", color: "#2d3748", margin: 0, fontFamily: "'Patrick Hand', cursive", transform: "rotate(-2deg)", textShadow: "3px 3px 0 rgba(0,0,0,0.06)", lineHeight: 1 }}>NUMBER</h1>
          <h1 style={{ fontSize: "clamp(46px, 9vw, 78px)", color: "#e53e3e", margin: 0, fontFamily: "'Patrick Hand', cursive", transform: "rotate(1deg) translateX(20px)", textShadow: "3px 3px 0 rgba(0,0,0,0.06)", lineHeight: 1 }}>NOMAD</h1>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "linear-gradient(135deg, #4a5568, #1a202c)", margin: "8px 0 18px", position: "relative", animation: "bob 2s ease-in-out infinite" }}>
          <div style={{ position: "absolute", left: 16, top: 14, width: 10, height: 11, background: "#fff", borderRadius: "50%" }}><div style={{ position: "absolute", right: 1, top: 3, width: 5, height: 5, background: "#1a1a2e", borderRadius: "50%" }} /></div>
          <div style={{ position: "absolute", right: 14, top: 16, width: 8, height: 9, background: "#fff", borderRadius: "50%" }}><div style={{ position: "absolute", right: 1, top: 2, width: 4, height: 4, background: "#1a1a2e", borderRadius: "50%" }} /></div>
          <style>{`@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
        </div>
        <p style={{ color: "#718096", fontSize: "clamp(13px, 3vw, 17px)", textAlign: "center", maxWidth: 400, lineHeight: 1.6, margin: "0 20px 24px", fontFamily: "'Patrick Hand', cursive" }}>
          Jump, dash & wall-slide through sketched worlds! Collect the correct equation pieces to solve each level. Grab a wrong one and you lose a heart!
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
          {["3rd Grade: + −", "4th Grade: × ÷", "5th Grade: Multi-step"].map((g, i) => (
            <div key={i} style={{ padding: "5px 12px", background: ["#ffd93d", "#6bcb77", "#4d96ff"][i], borderRadius: 4, color: "#2d3748", fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: "bold", border: "2px solid #2d3748", transform: `rotate(${(i - 1) * 2}deg)` }}>{g}</div>
          ))}
        </div>
        <div style={{ background: "#fff", border: "2px solid #2d3748", borderRadius: 6, padding: "10px 18px", marginBottom: 18, maxWidth: 340 }}>
          <p style={{ margin: 0, fontSize: 12, color: "#4a5568", fontFamily: "'Courier New', monospace", lineHeight: 1.5, textAlign: "center" }}>
            <strong>Controls:</strong> Arrow Keys / WASD to move<br/>Space = Jump (press twice to double-jump!)<br/>Shift = Dash burst (has cooldown)
          </p>
        </div>
        <button onClick={() => setScreen("playing")} style={{ padding: "14px 44px", fontSize: 22, fontFamily: "'Patrick Hand', cursive", background: "#48bb78", color: "#fff", border: "3px solid #2d3748", borderRadius: 8, cursor: "pointer", transform: "rotate(-1deg)", boxShadow: "4px 4px 0 #2d3748" }}
          onMouseEnter={e => { e.target.style.transform = "rotate(0deg) translateY(-2px)"; e.target.style.boxShadow = "6px 6px 0 #2d3748"; }}
          onMouseLeave={e => { e.target.style.transform = "rotate(-1deg)"; e.target.style.boxShadow = "4px 4px 0 #2d3748"; }}
        >START PLAYING</button>
        <div style={{ position: "absolute", top: 40, right: 40, fontSize: 30, transform: "rotate(15deg)", opacity: 0.25 }}>📐</div>
        <div style={{ position: "absolute", bottom: 60, left: 40, fontSize: 26, transform: "rotate(-10deg)", opacity: 0.25 }}>✏️</div>
      </div>
    );
  }

  if (screen === "gameover") {
    return (
      <div style={{ minHeight: "100vh", background: "#faf8f0", backgroundImage: "linear-gradient(#d4e4f7 1px, transparent 1px), linear-gradient(90deg, #d4e4f7 1px, transparent 1px)", backgroundSize: "25px 25px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Patrick Hand', 'Courier New', monospace", position: "relative" }}>
        <div onClick={() => navigate("/")} style={{ position: "absolute", top: 12, left: 16, color: "#fff", fontSize: 13, cursor: "pointer", zIndex: 10, padding: "8px 14px", borderRadius: 20, background: "rgba(0,0,0,0.4)", border: "2px solid rgba(255,255,255,0.3)", fontFamily: "'Nunito','Baloo 2',sans-serif", fontWeight: 700, userSelect: "none" }}>← ARCADE</div>
        <div style={{ position: "absolute", left: 80, top: 0, bottom: 0, width: 2, background: "#e8a0a0" }} />
        <div style={{ width: 56, height: 56, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "linear-gradient(135deg, #a0aec0, #718096)", margin: "0 0 16px", position: "relative", opacity: 0.5 }}>
          <div style={{ position: "absolute", left: 14, top: 20, width: 8, height: 3, background: "#2d3748", borderRadius: 2 }} />
          <div style={{ position: "absolute", right: 16, top: 22, width: 6, height: 3, background: "#2d3748", borderRadius: 2 }} />
          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", width: 10, height: 5, borderRadius: "0 0 5px 5px", border: "2px solid #2d3748", borderTop: "none" }} />
        </div>
        <h1 style={{ fontSize: 44, color: "#e53e3e", margin: 0, fontFamily: "'Patrick Hand', cursive", transform: "rotate(-1deg)" }}>ERASED!</h1>
        <div style={{ background: "#fff", border: "2px solid #2d3748", borderRadius: 8, padding: "16px 36px", margin: "16px 0", textAlign: "center", boxShadow: "4px 4px 0 rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: 18, color: "#2d3748", margin: "3px 0" }}>Score: <strong>{Math.floor(finalScore)}</strong></p>
          <p style={{ fontSize: 14, color: "#718096", margin: "3px 0" }}>Reached Level {finalLevel}</p>
          <p style={{ fontSize: 12, color: "#a0aec0", margin: "3px 0" }}>{finalLevel <= 3 ? "3rd Grade Maths" : finalLevel <= 6 ? "4th Grade Maths" : "5th Grade Maths"}</p>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <button onClick={() => setScreen("playing")} style={{ padding: "12px 32px", fontSize: 18, fontFamily: "'Patrick Hand', cursive", background: "#48bb78", color: "#fff", border: "3px solid #2d3748", borderRadius: 8, cursor: "pointer", boxShadow: "4px 4px 0 #2d3748" }}>TRY AGAIN</button>
          <button onClick={() => setScreen("menu")} style={{ padding: "12px 32px", fontSize: 18, fontFamily: "'Patrick Hand', cursive", background: "#4d96ff", color: "#fff", border: "3px solid #2d3748", borderRadius: 8, cursor: "pointer", boxShadow: "4px 4px 0 #2d3748" }}>MENU</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%", maxHeight: "100vh", border: "2px solid #a8c8e8", borderRadius: 4 }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 12px 16px", pointerEvents: "none", zIndex: 100 }}>
        <div style={{ display: "flex", gap: 6, pointerEvents: "auto" }}>
          <div onTouchStart={e => { e.preventDefault(); touchRef.current.left = true; }} onTouchEnd={() => touchRef.current.left = false} onTouchCancel={() => touchRef.current.left = false}
            style={{ width: 60, height: 60, borderRadius: 10, background: "rgba(45,55,72,0.35)", border: "2px solid rgba(45,55,72,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#fff", userSelect: "none", WebkitUserSelect: "none" }}>◀</div>
          <div onTouchStart={e => { e.preventDefault(); touchRef.current.right = true; }} onTouchEnd={() => touchRef.current.right = false} onTouchCancel={() => touchRef.current.right = false}
            style={{ width: 60, height: 60, borderRadius: 10, background: "rgba(45,55,72,0.35)", border: "2px solid rgba(45,55,72,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#fff", userSelect: "none", WebkitUserSelect: "none" }}>▶</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", pointerEvents: "auto" }}>
          <div onTouchStart={e => { e.preventDefault(); touchRef.current.dash = true; setTimeout(() => touchRef.current.dash = false, 80); }}
            style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(77,150,255,0.45)", border: "2px solid rgba(77,150,255,0.65)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: "bold", userSelect: "none", WebkitUserSelect: "none", fontFamily: "'Courier New', monospace" }}>DASH</div>
          <div onTouchStart={e => { e.preventDefault(); touchRef.current.jump = true; setTimeout(() => touchRef.current.jump = false, 80); }}
            style={{ width: 66, height: 66, borderRadius: "50%", background: "rgba(72,187,120,0.45)", border: "2px solid rgba(72,187,120,0.65)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: "bold", userSelect: "none", WebkitUserSelect: "none", fontFamily: "'Courier New', monospace" }}>JUMP</div>
        </div>
      </div>
    </div>
  );
}
