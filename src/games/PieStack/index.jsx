import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const CANVAS_W = 480;
const CANVAS_H = 720;
const DROP_LINE_Y = 112;
const SCRIPT_ID = "matter-js-cdn";

const FRACTIONS = [
  [1, 8],
  [1, 6],
  [1, 4],
  [1, 3],
  [3, 8],
  [1, 2],
  [5, 8],
  [2, 3],
  [3, 4],
  [5, 6],
  [7, 8],
];

const FRACTION_META = {
  "1/8": { color: "#93c5fd", ring: "#2563eb" },
  "1/6": { color: "#a7f3d0", ring: "#059669" },
  "1/4": { color: "#fde68a", ring: "#d97706" },
  "1/3": { color: "#fca5a5", ring: "#dc2626" },
  "3/8": { color: "#c4b5fd", ring: "#7c3aed" },
  "1/2": { color: "#f9a8d4", ring: "#db2777" },
  "5/8": { color: "#fdba74", ring: "#ea580c" },
  "2/3": { color: "#86efac", ring: "#16a34a" },
  "3/4": { color: "#67e8f9", ring: "#0891b2" },
  "5/6": { color: "#ddd6fe", ring: "#6d28d9" },
  "7/8": { color: "#fecaca", ring: "#ef4444" },
};

const HAMMER_SPLIT = {
  "1/2": [[1, 4], [1, 4]],
  "1/4": [[1, 8], [1, 8]],
  "1/3": [[1, 6], [1, 6]],
  "3/8": [[1, 8], [1, 4]],
};

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function reduceFrac(num, den) {
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

function keyOf(frac) {
  return `${frac.num}/${frac.den}`;
}

function addFracs(a, b) {
  return reduceFrac(a.num * b.den + b.num * a.den, a.den * b.den);
}

function toFraction(value) {
  return reduceFrac(value[0], value[1]);
}

const ALLOWED_SET = new Set(FRACTIONS.map((f) => keyOf(toFraction(f))));

function createBookState() {
  return { fractions: {}, equations: {} };
}

export default function PieStack() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const engineRef = useRef(null);
  const matterRef = useRef(null);
  const worldRef = useRef(null);
  const bodiesRef = useRef([]);
  const particlesRef = useRef([]);
  const audioCtxRef = useRef(null);
  const suppressCollisionRef = useRef(new Set());
  const seqRef = useRef(1);

  const [screen, setScreen] = useState("menu");
  const [matterReady, setMatterReady] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [message, setMessage] = useState("Stack smart! Make a whole pie!");
  const [spawnX, setSpawnX] = useState(CANVAS_W / 2);
  const [nextFrac, setNextFrac] = useState(toFraction([1, 4]));
  const [hammerMode, setHammerMode] = useState(false);
  const [hammerUsed, setHammerUsed] = useState(0);
  const [bookOpen, setBookOpen] = useState(false);
  const [book, setBook] = useState(createBookState());

  const totalHammer = 3 + Math.floor(score / 50);
  const hammerLeft = Math.max(0, totalHammer - hammerUsed);

  const backBtn = (
    <div
      onClick={() => navigate("/")}
      style={{
        position: "absolute", top: 12, left: 16,
        color: "#4a4a6a", fontSize: 12, cursor: "pointer",
        zIndex: 10, padding: "6px 12px", borderRadius: 6,
        background: "#0a0c2080", border: "1px solid #1a1a3a",
        fontFamily: "'Courier New', monospace", letterSpacing: 2,
      }}
    >
      ← ARCADE
    </div>
  );

  const playTone = useCallback((type) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      const map = {
        drop: [280, 0.09],
        merge: [420, 0.12],
        pop: [680, 0.2],
        hammer: [220, 0.12],
      };
      const [freq, dur] = map[type] || [330, 0.1];
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, now + dur);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.03);
      osc.start(now);
      osc.stop(now + dur + 0.03);
    } catch (e) {
      // ignore silent audio failures
    }
  }, []);

  const radiusFor = useCallback((frac) => {
    const value = frac.num / frac.den;
    return 20 + value * 34;
  }, []);

  const unlockCount = useMemo(() => {
    if (score >= 140) return FRACTIONS.length;
    if (score >= 100) return 9;
    if (score >= 70) return 8;
    if (score >= 45) return 7;
    if (score >= 25) return 6;
    if (score >= 12) return 5;
    return 4;
  }, [score]);

  const pickNextFraction = useCallback((currentScore) => {
    const unlocked = FRACTIONS.slice(0, Math.min(FRACTIONS.length, (() => {
      if (currentScore >= 140) return FRACTIONS.length;
      if (currentScore >= 100) return 9;
      if (currentScore >= 70) return 8;
      if (currentScore >= 45) return 7;
      if (currentScore >= 25) return 6;
      if (currentScore >= 12) return 5;
      return 4;
    })()));

    const weights = unlocked.map((f) => {
      const [n, d] = f;
      const v = n / d;
      return Math.max(1, Math.round((1.15 - v) * 10));
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < unlocked.length; i += 1) {
      roll -= weights[i];
      if (roll <= 0) return toFraction(unlocked[i]);
    }
    return toFraction(unlocked[0]);
  }, []);

  const markDiscovery = useCallback((frac, equation) => {
    const k = keyOf(frac);
    setBook((prev) => {
      const next = {
        fractions: { ...prev.fractions },
        equations: { ...prev.equations },
      };
      next.fractions[k] = true;
      if (equation) next.equations[equation] = true;
      localStorage.setItem("pieStack:book", JSON.stringify(next));
      return next;
    });
  }, []);

  const createPiece = useCallback((x, y, frac, opts = {}) => {
    const Matter = matterRef.current;
    if (!Matter || !worldRef.current) return null;
    const key = keyOf(frac);
    const r = radiusFor(frac);
    const body = Matter.Bodies.circle(x, y, r, {
      restitution: 0.25,
      friction: 0.04,
      frictionAir: 0.007,
      label: "piece",
      ...opts,
    });
    body.pie = {
      id: seqRef.current += 1,
      frac,
      key,
      radius: r,
      aboveMs: 0,
    };
    Matter.Body.setMass(body, 0.5 + (frac.num / frac.den) * 1.4);
    Matter.World.add(worldRef.current, body);
    bodiesRef.current.push(body);
    markDiscovery(frac);
    return body;
  }, [markDiscovery, radiusFor]);

  const removePiece = useCallback((body) => {
    const Matter = matterRef.current;
    if (!Matter || !worldRef.current) return;
    Matter.World.remove(worldRef.current, body);
    bodiesRef.current = bodiesRef.current.filter((b) => b !== body);
  }, []);

  const burst = useCallback((x, y, color) => {
    const p = particlesRef.current;
    for (let i = 0; i < 16; i += 1) {
      const a = (Math.PI * 2 * i) / 16;
      const speed = 2 + Math.random() * 3;
      p.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 45, color });
    }
  }, []);

  const attemptMerge = useCallback((bodyA, bodyB) => {
    if (!bodyA?.pie || !bodyB?.pie) return;
    const idA = bodyA.pie.id;
    const idB = bodyB.pie.id;
    const pairKey = idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
    if (suppressCollisionRef.current.has(pairKey)) return;
    suppressCollisionRef.current.add(pairKey);
    setTimeout(() => suppressCollisionRef.current.delete(pairKey), 120);

    const sum = addFracs(bodyA.pie.frac, bodyB.pie.frac);
    const sumKey = keyOf(sum);
    const eqText = `${bodyA.pie.key} + ${bodyB.pie.key} = ${sumKey}`;

    if (sum.num === sum.den) {
      const x = (bodyA.position.x + bodyB.position.x) / 2;
      const y = (bodyA.position.y + bodyB.position.y) / 2;
      removePiece(bodyA);
      removePiece(bodyB);
      burst(x, y, "#fde047");
      playTone("pop");
      markDiscovery(sum, eqText);
      setScore((s) => s + 12);
      setMessage("Perfect whole pie! 🍰 Pop!");
      return;
    }

    if (sum.num < sum.den && ALLOWED_SET.has(sumKey)) {
      const Matter = matterRef.current;
      if (!Matter) return;
      const x = (bodyA.position.x + bodyB.position.x) / 2;
      const y = (bodyA.position.y + bodyB.position.y) / 2;
      const vx = (bodyA.velocity.x + bodyB.velocity.x) / 2;
      const vy = (bodyA.velocity.y + bodyB.velocity.y) / 2;
      removePiece(bodyA);
      removePiece(bodyB);
      const merged = createPiece(x, y, sum);
      if (merged) Matter.Body.setVelocity(merged, { x: vx * 0.8, y: vy * 0.8 });
      burst(x, y, "#a7f3d0");
      playTone("merge");
      markDiscovery(sum, eqText);
      setScore((s) => s + 5 + sum.num);
      setMessage(`${eqText} ✅`);
    }
  }, [addFracs, burst, createPiece, markDiscovery, playTone, removePiece]);

  const dropCurrentPiece = useCallback(() => {
    if (screen !== "playing") return;
    const frac = nextFrac;
    createPiece(spawnX, DROP_LINE_Y + 8, frac, { friction: 0.02 });
    playTone("drop");
    setNextFrac(pickNextFraction(score));
  }, [createPiece, nextFrac, pickNextFraction, playTone, score, screen, spawnX]);

  const resetWorld = useCallback(() => {
    const Matter = matterRef.current;
    const canvas = canvasRef.current;
    if (!Matter || !canvas) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.0 } });
    engineRef.current = engine;
    worldRef.current = engine.world;
    bodiesRef.current = [];
    particlesRef.current = [];
    suppressCollisionRef.current.clear();

    const wallOpts = { isStatic: true, restitution: 0.1, render: { visible: false } };
    Matter.World.add(engine.world, [
      Matter.Bodies.rectangle(CANVAS_W / 2, CANVAS_H + 24, CANVAS_W, 48, wallOpts),
      Matter.Bodies.rectangle(-20, CANVAS_H / 2, 40, CANVAS_H, wallOpts),
      Matter.Bodies.rectangle(CANVAS_W + 20, CANVAS_H / 2, 40, CANVAS_H, wallOpts),
    ]);

    Matter.Events.off(engine, "collisionStart");
    Matter.Events.on(engine, "collisionStart", (evt) => {
      evt.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        if (bodyA.label === "piece" && bodyB.label === "piece") {
          attemptMerge(bodyA, bodyB);
        }
      });
    });

    let last = performance.now();
    const ctx = canvas.getContext("2d");

    const loop = (t) => {
      const dt = Math.min(33, t - last);
      last = t;
      Matter.Engine.update(engine, dt);

      bodiesRef.current.forEach((body) => {
        if (!body.pie) return;
        if (body.position.y < DROP_LINE_Y) {
          body.pie.aboveMs += dt;
        } else {
          body.pie.aboveMs = 0;
        }
      });

      const hasOut = bodiesRef.current.some((b) => b.pie && b.pie.aboveMs > 2000);
      if (hasOut) {
        const finalScore = score;
        setBest((prev) => {
          const bestNow = Math.max(prev, finalScore);
          localStorage.setItem("pieStack:best", String(bestNow));
          return bestNow;
        });
        setScreen("results");
        setMessage("Out of room! Try another pie stack!");
        return;
      }

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const grd = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grd.addColorStop(0, "#0ea5e9");
      grd.addColorStop(1, "#1d4ed8");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(12, DROP_LINE_Y);
      ctx.lineTo(CANVAS_W - 12, DROP_LINE_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 18px Nunito, sans-serif";
      ctx.fillText("Drop line", 18, DROP_LINE_Y - 10);

      bodiesRef.current.forEach((body) => {
        if (!body.pie) return;
        const { key, frac, radius } = body.pie;
        const meta = FRACTION_META[key] || { color: "#f8fafc", ring: "#334155" };
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        ctx.beginPath();
        ctx.fillStyle = meta.color;
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = meta.ring;
        ctx.stroke();
        ctx.fillStyle = "#0f172a";
        ctx.font = "700 18px Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${frac.num}/${frac.den}`, 0, 1);
        ctx.restore();
      });

      particlesRef.current.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.09;
        pt.life -= 1;
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.life / 45);
        ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6);
        ctx.globalAlpha = 1;
      });
      particlesRef.current = particlesRef.current.filter((pt) => pt.life > 0);

      if (!hammerMode) {
        const p = nextFrac;
        const ghostRadius = radiusFor(p);
        const mk = keyOf(p);
        const meta = FRACTION_META[mk] || { color: "#fff", ring: "#334155" };
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.fillStyle = meta.color;
        ctx.arc(spawnX, DROP_LINE_Y - 32, ghostRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = meta.ring;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [attemptMerge, hammerMode, nextFrac, radiusFor, score, spawnX]);

  const startGame = useCallback(() => {
    setScore(0);
    setHammerUsed(0);
    setHammerMode(false);
    setSpawnX(CANVAS_W / 2);
    const n = pickNextFraction(0);
    setNextFrac(n);
    setMessage("Combine fractions to make whole pies!");
    setScreen("playing");
    setTimeout(() => resetWorld(), 0);
  }, [pickNextFraction, resetWorld]);

  const useHammerAt = useCallback((x, y) => {
    if (!hammerMode || hammerLeft <= 0 || screen !== "playing") return false;
    let target = null;
    for (let i = bodiesRef.current.length - 1; i >= 0; i -= 1) {
      const b = bodiesRef.current[i];
      if (!b?.pie) continue;
      const dx = x - b.position.x;
      const dy = y - b.position.y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= b.pie.radius * b.pie.radius) {
        target = b;
        break;
      }
    }
    if (!target) return false;

    const map = HAMMER_SPLIT[target.pie.key];
    if (!map) {
      setMessage("This slice cannot be split.");
      return true;
    }

    removePiece(target);
    map.forEach((f, idx) => {
      const frac = toFraction(f);
      const body = createPiece(target.position.x + (idx === 0 ? -18 : 18), target.position.y - 8, frac);
      if (body && matterRef.current) {
        matterRef.current.Body.setVelocity(body, {
          x: (idx === 0 ? -1.6 : 1.6) + Math.random() * 0.6,
          y: -1.2,
        });
      }
      markDiscovery(frac, `${target.pie.key} → ${keyOf(frac)} + ${keyOf(frac)}`);
    });
    playTone("hammer");
    burst(target.position.x, target.position.y, "#fca5a5");
    setHammerUsed((h) => h + 1);
    setHammerMode(false);
    setMessage("Hammer smash! Split into tiny slices! 🔨");
    return true;
  }, [burst, createPiece, hammerLeft, hammerMode, markDiscovery, playTone, removePiece, screen]);

  useEffect(() => {
    const onKey = (e) => {
      if (screen !== "playing") return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        setSpawnX((x) => Math.max(42, x - 22));
      }
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        setSpawnX((x) => Math.min(CANVAS_W - 42, x + 22));
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        dropCurrentPiece();
      }
      if (e.key.toLowerCase() === "h" && hammerLeft > 0) {
        setHammerMode((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dropCurrentPiece, hammerLeft, screen]);

  useEffect(() => {
    const b = Number(localStorage.getItem("pieStack:best") || 0);
    setBest(Number.isFinite(b) ? b : 0);
    try {
      const raw = localStorage.getItem("pieStack:book");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.fractions && parsed?.equations) setBook(parsed);
      }
    } catch (e) {
      // ignore malformed state
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const existing = document.getElementById(SCRIPT_ID);

    const boot = () => {
      if (!mounted) return;
      matterRef.current = window.Matter;
      setMatterReady(Boolean(window.Matter));
    };

    if (window.Matter) {
      boot();
    } else if (existing) {
      existing.addEventListener("load", boot);
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js";
      script.async = true;
      script.onload = boot;
      document.head.appendChild(script);
    }

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (engineRef.current && matterRef.current) {
        matterRef.current.World.clear(engineRef.current.world, false);
        matterRef.current.Engine.clear(engineRef.current);
      }
      bodiesRef.current = [];
      particlesRef.current = [];
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const pointerToCanvas = (clientX) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return CANVAS_W / 2;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    return Math.max(38, Math.min(CANVAS_W - 38, x));
  };

  const handleCanvasPointer = (e) => {
    if (screen !== "playing") return;
    const touch = e.touches?.[0];
    const x = pointerToCanvas(touch ? touch.clientX : e.clientX);
    setSpawnX(x);
  };

  const handleCanvasTap = (e) => {
    if (screen !== "playing") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.changedTouches?.[0];
    const cx = touch ? touch.clientX : e.clientX;
    const cy = touch ? touch.clientY : e.clientY;
    const x = ((cx - rect.left) / rect.width) * CANVAS_W;
    const y = ((cy - rect.top) / rect.height) * CANVAS_H;

    if (hammerMode && useHammerAt(x, y)) return;
    dropCurrentPiece();
  };

  const discoveredFractions = Object.keys(book.fractions).length;
  const discoveredEquations = Object.keys(book.equations).length;

  if (screen === "menu") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#0ea5e9,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: 20, fontFamily: "Nunito, system-ui" }}>
        {backBtn}
        <div style={{ maxWidth: 440, width: "100%", background: "rgba(255,255,255,0.92)", borderRadius: 22, padding: "24px 24px 20px", boxShadow: "0 18px 50px rgba(15,23,42,0.35)", textAlign: "center" }}>
          <h1 style={{ margin: "0 0 8px", color: "#1e293b", fontSize: 42 }}>🥧 PieStack</h1>
          <p style={{ margin: "0 0 14px", color: "#0f172a", fontSize: 18 }}>Drop fraction slices, merge them, and pop whole pies!</p>
          <p style={{ margin: "0 0 16px", color: "#334155", fontSize: 15 }}>Learn equivalent fractions by building to exactly <strong>1</strong>.</p>
          <div style={{ margin: "0 auto 16px", background: "#dbeafe", borderRadius: 14, padding: 12, color: "#1e3a8a", fontWeight: 700 }}>Best Score: {best} · Matter ready: {matterReady ? "Yes ✅" : "Loading…"}</div>
          <button
            onClick={startGame}
            disabled={!matterReady}
            style={{ width: "100%", minHeight: 54, borderRadius: 14, border: "none", background: matterReady ? "#f97316" : "#94a3b8", color: "white", fontWeight: 800, fontSize: 20, cursor: matterReady ? "pointer" : "wait" }}
          >
            {matterReady ? "▶ Start Stacking" : "Loading Physics…"}
          </button>
          <div style={{ marginTop: 12, fontSize: 14, color: "#334155" }}>Move: mouse/touch or ← → · Drop: click, tap, Space, or button · Hammer: H then tap</div>
        </div>
      </div>
    );
  }

  if (screen === "results") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#1d4ed8,#1e3a8a)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: 20, fontFamily: "Nunito, system-ui" }}>
        {backBtn}
        <div style={{ width: "100%", maxWidth: 460, background: "rgba(255,255,255,0.94)", borderRadius: 20, padding: 24, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 8px", color: "#1e293b", fontSize: 34 }}>📦 Out of Room!</h2>
          <p style={{ margin: "0 0 8px", color: "#334155", fontSize: 17 }}>{message}</p>
          <p style={{ margin: "0 0 14px", color: "#0f172a", fontSize: 22, fontWeight: 800 }}>Score: {score}</p>
          <p style={{ margin: "0 0 18px", color: "#475569" }}>Best: {Math.max(best, score)} · Fractions found: {discoveredFractions} · Equations logged: {discoveredEquations}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={startGame} style={{ minHeight: 50, padding: "0 24px", borderRadius: 12, border: "none", background: "#16a34a", color: "#fff", fontWeight: 800, cursor: "pointer" }}>🔁 Play Again</button>
            <button onClick={() => setScreen("menu")} style={{ minHeight: 50, padding: "0 24px", borderRadius: 12, border: "none", background: "#334155", color: "#fff", fontWeight: 800, cursor: "pointer" }}>🏠 Menu</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "#082f49", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", fontFamily: "Nunito, system-ui", padding: "54px 10px 16px" }}>
      {backBtn}

      <div style={{ width: "100%", maxWidth: 560, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", color: "#e0f2fe", marginBottom: 8, padding: "0 8px" }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Score: {score}</div>
        <div style={{ fontSize: 14 }}>Unlocked: {unlockCount}/{FRACTIONS.length}</div>
        <div style={{ fontSize: 14 }}>Hammer: {hammerLeft}</div>
      </div>

      <div style={{ position: "relative", width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: "100%", maxWidth: 500, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15,23,42,0.55)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 12, color: "#e2e8f0", padding: "8px 10px", fontSize: 14 }}>
          <span>{message}</span>
          <span style={{ fontWeight: 700 }}>Next: {keyOf(nextFrac)}</span>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseMove={handleCanvasPointer}
          onTouchStart={(e) => { e.preventDefault(); handleCanvasPointer(e); }}
          onTouchMove={(e) => { e.preventDefault(); handleCanvasPointer(e); }}
          onClick={handleCanvasTap}
          onTouchEnd={(e) => { e.preventDefault(); handleCanvasTap(e); }}
          style={{
            width: "100%",
            maxWidth: 480,
            maxHeight: "calc(100vh - 240px)",
            aspectRatio: "2 / 3",
            display: "block",
            borderRadius: 14,
            border: "2px solid rgba(255,255,255,0.35)",
            boxShadow: "0 12px 40px rgba(8,47,73,0.55)",
            touchAction: "none",
            background: "#0ea5e9",
          }}
        />

        <div style={{ width: "100%", maxWidth: 500, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <button onClick={() => dropCurrentPiece()} style={{ minHeight: 54, borderRadius: 12, border: "none", background: "#f97316", color: "white", fontWeight: 800, fontSize: 18, cursor: "pointer" }}>⬇ DROP</button>
          <button onClick={() => setHammerMode((h) => !h)} disabled={hammerLeft <= 0} style={{ minHeight: 54, borderRadius: 12, border: "none", background: hammerMode ? "#ef4444" : "#f59e0b", color: "#111827", fontWeight: 800, fontSize: 16, cursor: hammerLeft <= 0 ? "not-allowed" : "pointer", opacity: hammerLeft <= 0 ? 0.55 : 1 }}>🔨 {hammerMode ? "Tap Pie" : "Hammer"}</button>
          <button onClick={() => setBookOpen(true)} style={{ minHeight: 54, borderRadius: 12, border: "none", background: "#a78bfa", color: "#1e1b4b", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>📘 Book</button>
        </div>
      </div>

      {bookOpen && (
        <div onClick={() => setBookOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, maxHeight: "80vh", overflowY: "auto", background: "#eff6ff", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0, color: "#1e3a8a", fontSize: 24 }}>📘 Fraction Discovery Book</h3>
              <button onClick={() => setBookOpen(false)} style={{ border: "none", background: "#1e3a8a", color: "#fff", borderRadius: 8, minHeight: 40, padding: "0 12px", cursor: "pointer" }}>Close</button>
            </div>
            <div style={{ marginBottom: 12, color: "#334155" }}>Fractions found: {discoveredFractions} · Equations discovered: {discoveredEquations}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {Array.from(ALLOWED_SET).map((f) => (
                <div key={f} style={{ padding: "6px 10px", borderRadius: 20, background: book.fractions[f] ? "#86efac" : "#cbd5e1", color: "#0f172a", fontWeight: 700 }}>{f}</div>
              ))}
            </div>
            <div style={{ color: "#1e293b", fontWeight: 700, marginBottom: 6 }}>Equations</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.keys(book.equations).length === 0 && <div style={{ color: "#64748b" }}>No equations yet. Start stacking!</div>}
              {Object.keys(book.equations).sort().map((eq) => (
                <div key={eq} style={{ background: "#dbeafe", borderRadius: 8, padding: "6px 8px", color: "#1e3a8a", fontWeight: 600 }}>{eq}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
