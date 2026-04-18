import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const FONT = "'Press Start 2P', monospace";

// ── Pure helpers (module-level, no closure deps) ──────────────────────────────

function makeQuestion(tables) {
  const a = tables[Math.floor(Math.random() * tables.length)];
  const b = Math.floor(Math.random() * 12) + 1;
  return { a, b, answer: a * b };
}

function makeBubbles(answer, cw) {
  const wrongs = new Set();
  let attempts = 0;
  while (wrongs.size < 3 && attempts < 200) {
    attempts++;
    const offset = (Math.floor(Math.random() * 10) + 1) * (Math.random() < 0.5 ? 1 : -1);
    const c = Math.max(1, answer + offset);
    if (c !== answer) wrongs.add(c);
  }
  const vals = [answer, ...[...wrongs]].sort(() => Math.random() - 0.5);
  const xs = [cw * 0.14, cw * 0.38, cw * 0.62, cw * 0.86];
  return vals.map((val, i) => ({
    x: xs[i],
    y: -55 - i * 65,
    val,
    correct: val === answer,
    r: 30,
    alive: true,
    flash: 0,
    flashCol: "#10b981",
  }));
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TimesTableBlaster() {
  const navigate = useNavigate();

  // Font
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // Audio
  const acRef = useRef(null);
  const tone = useCallback((freq, dur, wave = "square", vol = 0.2) => {
    try {
      if (!acRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        acRef.current = new AC();
      }
      const ac = acRef.current;
      if (ac.state === "suspended") ac.resume();
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch (_) {}
  }, []);

  // Screens
  const [screen, setScreen] = useState("menu");
  const [selTables, setSelTables] = useState([2, 5, 10]);
  const [result, setResult] = useState({ score: 0, level: 1, answered: 0 });

  // Canvas + mutable game state
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const tRef = useRef(null);
  const gsRef = useRef(null);

  const initGs = useCallback((tables) => {
    const W = 480;
    const q = makeQuestion(tables);
    gsRef.current = {
      tables,
      cannon: { x: W / 2 },
      bullets: [],
      bubbles: makeBubbles(q.answer, W),
      question: q,
      score: 0,
      lives: 3,
      level: 1,
      answered: 0,
      answeredThisLevel: 0,
      bubbleSpeed: 45,
      fireDelay: 0,
      paused: false,
      pauseTimer: 0,
      keys: {},
      stars: Array.from({ length: 50 }, () => ({
        x: Math.random(),
        y: Math.random() * 0.72,
        r: Math.random() * 1.5 + 0.3,
        t: Math.random() * 100,
      })),
      over: false,
    };
  }, []);

  // Game loop — useCallback with stable deps only (refs + stable setters)
  const gameLoop = useCallback((ts) => {
    const gs = gsRef.current;
    if (!gs || gs.over) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 480, H = 640;

    const dt = tRef.current ? Math.min((ts - tRef.current) / 1000, 0.05) : 0.016;
    tRef.current = ts;

    // ── UPDATE ──────────────────────────────────────────────────────────────

    if (gs.paused) {
      gs.pauseTimer = Math.max(0, gs.pauseTimer - dt);
      if (gs.pauseTimer <= 0) {
        gs.paused = false;
        const q = makeQuestion(gs.tables);
        gs.question = q;
        gs.bubbles = makeBubbles(q.answer, W);
        gs.bullets = [];
      }
    } else {
      // Cannon movement
      const cSpeed = 260;
      if (gs.keys["ArrowLeft"] || gs.keys["KeyA"])
        gs.cannon.x = Math.max(32, gs.cannon.x - cSpeed * dt);
      if (gs.keys["ArrowRight"] || gs.keys["KeyD"])
        gs.cannon.x = Math.min(W - 32, gs.cannon.x + cSpeed * dt);

      // Fire
      gs.fireDelay = Math.max(0, gs.fireDelay - dt);
      if ((gs.keys["Space"] || gs.keys["ArrowUp"]) && gs.fireDelay <= 0) {
        gs.bullets.push({ x: gs.cannon.x, y: H - 70, alive: true });
        gs.fireDelay = 0.22;
        tone(880, 0.06, "square", 0.12);
      }

      // Move bullets
      gs.bullets = gs.bullets.filter(b => b.alive && b.y > -10);
      for (const b of gs.bullets) b.y -= 380 * dt;

      // Move bubbles + ground check
      for (const bub of gs.bubbles) {
        if (bub.flash > 0) bub.flash = Math.max(0, bub.flash - dt);
        if (!bub.alive) continue;
        bub.y += gs.bubbleSpeed * dt;

        if (bub.y - bub.r > H - 50) {
          bub.alive = false;
          if (bub.correct) {
            gs.lives--;
            tone(300, 0.1, "triangle", 0.2);
            setTimeout(() => tone(200, 0.2, "triangle", 0.15), 100);
            if (gs.lives <= 0) {
              gs.over = true;
              [400, 300, 220, 160].forEach((f, i) =>
                setTimeout(() => tone(f, 0.25, "sawtooth", 0.18), i * 200)
              );
              setResult({ score: gs.score, level: gs.level, answered: gs.answered });
              setTimeout(() => setScreen("gameover"), 900);
              return;
            }
            gs.paused = true;
            gs.pauseTimer = 0.7;
          }
        }
      }

      // Bullet–bubble collisions
      outer: for (const b of gs.bullets) {
        if (!b.alive) continue;
        for (const bub of gs.bubbles) {
          if (!bub.alive) continue;
          const dx = b.x - bub.x, dy = b.y - bub.y;
          if (dx * dx + dy * dy < (bub.r + 5) * (bub.r + 5)) {
            b.alive = false;

            if (bub.correct) {
              bub.alive = false;
              bub.flash = 0.55;
              bub.flashCol = "#10b981";
              gs.bubbles.forEach(bb => { if (!bb.correct) bb.alive = false; });
              gs.score += 10 + gs.level * 5;
              gs.answered++;
              gs.answeredThisLevel++;
              tone(523, 0.1, "triangle", 0.25);
              setTimeout(() => tone(659, 0.1, "triangle", 0.25), 100);
              setTimeout(() => tone(784, 0.15, "triangle", 0.3), 200);
              if (gs.answeredThisLevel >= 5) {
                gs.level++;
                gs.answeredThisLevel = 0;
                gs.bubbleSpeed = Math.min(130, 45 + (gs.level - 1) * 14);
                [523, 659, 784, 1047].forEach((f, i) =>
                  setTimeout(() => tone(f, 0.15, "triangle", 0.25), i * 120)
                );
              }
              gs.paused = true;
              gs.pauseTimer = 0.65;
            } else {
              bub.alive = false;
              bub.flash = 0.45;
              bub.flashCol = "#ef4444";
              gs.lives--;
              tone(180, 0.2, "sawtooth", 0.2);
              if (gs.lives <= 0) {
                gs.over = true;
                [400, 300, 220, 160].forEach((f, i) =>
                  setTimeout(() => tone(f, 0.25, "sawtooth", 0.18), i * 200)
                );
                setResult({ score: gs.score, level: gs.level, answered: gs.answered });
                setTimeout(() => setScreen("gameover"), 900);
                return;
              }
              gs.paused = true;
              gs.pauseTimer = 0.7;
            }
            break outer;
          }
        }
      }
    }

    // ── RENDER ──────────────────────────────────────────────────────────────

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#0a0018";
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (const s of gs.stars) {
      const blink = 0.4 + 0.6 * Math.sin(ts * 0.0008 + s.t);
      ctx.globalAlpha = blink;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Question banner
    ctx.font = `16px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "#ffe066";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffe066";
    ctx.fillText(`${gs.question.a} × ${gs.question.b} = ?`, W / 2, 14);
    ctx.shadowBlur = 0;

    // Lives (♥)
    ctx.font = `14px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < gs.lives ? "#f87171" : "#2d2040";
      ctx.fillText("♥", 10 + i * 22, 56);
    }

    // Score
    ctx.font = `10px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffe066";
    ctx.fillText(String(gs.score), W - 10, 56);

    // Level label
    ctx.font = `7px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`LVL ${gs.level}`, W / 2, 44);

    // Level progress bar
    const prog = gs.answeredThisLevel / 5;
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(W / 2 - 40, 46, 80, 7);
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(W / 2 - 40, 46, 80 * prog, 7);
    ctx.strokeStyle = "#6d28d9";
    ctx.lineWidth = 1;
    ctx.strokeRect(W / 2 - 40, 46, 80, 7);

    // Separator
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 67);
    ctx.lineTo(W, 67);
    ctx.stroke();

    // Bubbles
    for (const bub of gs.bubbles) {
      const alpha = bub.alive ? 1 : Math.min(1, bub.flash / 0.45);
      if (alpha <= 0) continue;
      ctx.globalAlpha = alpha;

      const flashing = !bub.alive && bub.flash > 0;
      ctx.beginPath();
      ctx.arc(bub.x, bub.y, bub.r, 0, Math.PI * 2);
      ctx.fillStyle = flashing ? bub.flashCol + "33" : "#1e1b4b";
      ctx.fill();
      ctx.shadowColor = flashing ? bub.flashCol : "#7c3aed";
      ctx.shadowBlur = flashing ? 16 : 7;
      ctx.strokeStyle = flashing ? bub.flashCol : "#7c3aed";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const numStr = String(bub.val);
      ctx.font = `${numStr.length > 2 ? 10 : 13}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = flashing ? bub.flashCol : "#e2e8f0";
      ctx.fillText(numStr, bub.x, bub.y);
      ctx.textBaseline = "alphabetic";
      ctx.globalAlpha = 1;
    }

    // Bullets
    for (const b of gs.bullets) {
      if (!b.alive) continue;
      ctx.shadowColor = "#00f5d4";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#00f5d4";
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Ground panel
    ctx.fillStyle = "#0d0028";
    ctx.fillRect(0, H - 50, W, 50);
    ctx.strokeStyle = "#6d28d9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 50);
    ctx.lineTo(W, H - 50);
    ctx.stroke();

    // Cannon
    const ccx = gs.cannon.x;
    const ccy = H - 48;

    // Base ellipse
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.ellipse(ccx, ccy + 10, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Barrel
    ctx.fillStyle = "#d97706";
    ctx.fillRect(ccx - 6, ccy - 22, 12, 28);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1;
    ctx.strokeRect(ccx - 6, ccy - 22, 12, 28);

    // Muzzle flash on recent fire
    if (gs.fireDelay > 0.15) {
      ctx.shadowColor = "#fffbeb";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#fffbeb";
      ctx.beginPath();
      ctx.arc(ccx, ccy - 22, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [tone]); // tone is stable (useCallback + [])

  // RAF lifecycle
  useEffect(() => {
    if (screen !== "playing") {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const onKey = (down) => (e) => {
      if (!gsRef.current) return;
      gsRef.current.keys[e.code] = down;
      if (["Space", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.code))
        e.preventDefault();
    };
    const kd = onKey(true);
    const ku = onKey(false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    tRef.current = null;
    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [screen, gameLoop]);

  // Touch control helper
  const setKey = useCallback((code, val) => {
    if (gsRef.current) gsRef.current.keys[code] = val;
  }, []);

  // Table toggle
  const toggleTable = useCallback((n) => {
    setSelTables(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  }, []);

  // ── MENU SCREEN ──────────────────────────────────────────────────────────────
  if (screen === "menu") {
    const allOn = selTables.length === 11;
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0018",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "20px 16px", fontFamily: FONT,
        color: "#e2e8f0",
      }}>
        <div
          onClick={() => navigate("/")}
          style={{ position: "absolute", top: 12, left: 16, color: "#4a4a6a", fontSize: 12, cursor: "pointer", padding: "6px 12px", borderRadius: 6, background: "rgba(10,0,24,0.8)", border: "1px solid #1a1a3a" }}
        >← ARCADE</div>

        <div style={{ fontSize: 28, marginBottom: 6 }}>💥</div>
        <div style={{ fontSize: 17, color: "#ffe066", textShadow: "3px 3px 0 #000, 0 0 20px rgba(255,224,102,0.3)", letterSpacing: 3, marginBottom: 4 }}>TIMES TABLE</div>
        <div style={{ fontSize: 22, color: "#ffe066", textShadow: "3px 3px 0 #000, 0 0 20px rgba(255,224,102,0.3)", letterSpacing: 4, marginBottom: 28 }}>BLASTER</div>

        <div style={{ fontSize: 8, color: "#94a3b8", marginBottom: 10, letterSpacing: 1 }}>CHOOSE YOUR TABLES:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 360, marginBottom: 10 }}>
          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => {
            const on = selTables.includes(n);
            return (
              <div
                key={n}
                onClick={() => toggleTable(n)}
                style={{
                  width: 46, height: 46, borderRadius: 8, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 11,
                  cursor: "pointer",
                  background: on ? "#7c3aed" : "#1e1b4b",
                  border: `3px solid ${on ? "#a78bfa" : "#374151"}`,
                  color: on ? "#fff" : "#94a3b8",
                  boxShadow: on ? "0 0 10px rgba(124,58,237,0.35)" : "none",
                  userSelect: "none", WebkitTapHighlightColor: "transparent",
                }}
              >
                {n}
              </div>
            );
          })}
        </div>

        <div
          onClick={() => setSelTables(allOn ? [2, 5, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
          style={{
            fontSize: 8, cursor: "pointer", marginBottom: 28,
            padding: "5px 14px", borderRadius: 4, userSelect: "none",
            border: `1px solid ${allOn ? "#00f5d4" : "#374151"}`,
            color: allOn ? "#00f5d4" : "#94a3b8",
          }}
        >
          {allOn ? "✓ ALL TABLES" : "SELECT ALL"}
        </div>

        <div
          onClick={() => {
            if (selTables.length === 0) return;
            initGs(selTables);
            setScreen("playing");
          }}
          style={{
            fontFamily: FONT, fontSize: 14, padding: "16px 40px",
            background: selTables.length > 0 ? "#ffe066" : "#374151",
            color: "#000", border: "4px solid #000", borderRadius: 8,
            cursor: selTables.length > 0 ? "pointer" : "not-allowed",
            boxShadow: selTables.length > 0 ? "inset 0 -4px 0 #a16207" : "none",
            userSelect: "none",
          }}
        >
          ▶ BLAST OFF!
        </div>

        {selTables.length === 0 && (
          <div style={{ fontSize: 7, color: "#f87171", marginTop: 10 }}>Pick at least one table!</div>
        )}

        <div style={{ marginTop: 28, fontSize: 7, color: "#475569", lineHeight: 2.2, textAlign: "center" }}>
          ← → MOVE &nbsp;|&nbsp; SPACE / ▲ FIRE<br />
          Shoot the correct answer bubble!<br />
          Wrong shot or missed = lose a life
        </div>
      </div>
    );
  }

  // ── GAME OVER SCREEN ─────────────────────────────────────────────────────────
  if (screen === "gameover") {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0018",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: 20, fontFamily: FONT,
        color: "#e2e8f0", textAlign: "center",
      }}>
        <div
          onClick={() => navigate("/")}
          style={{ position: "absolute", top: 12, left: 16, color: "#4a4a6a", fontSize: 12, cursor: "pointer", padding: "6px 12px", borderRadius: 6, background: "rgba(10,0,24,0.8)", border: "1px solid #1a1a3a" }}
        >← ARCADE</div>

        <div style={{ fontSize: 36, marginBottom: 16 }}>💥</div>
        <div style={{ fontSize: 14, color: "#f87171", marginBottom: 24 }}>GAME OVER</div>

        <div style={{ background: "#0d0028", border: "2px solid #6d28d9", borderRadius: 8, padding: "20px 36px", marginBottom: 28, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 9, color: "#ffe066" }}>
            SCORE: <span style={{ fontSize: 18 }}>{result.score}</span>
          </div>
          <div style={{ fontSize: 8, color: "#94a3b8" }}>LEVEL REACHED: {result.level}</div>
          <div style={{ fontSize: 8, color: "#94a3b8" }}>QUESTIONS ANSWERED: {result.answered}</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <div
            onClick={() => { initGs(selTables); setScreen("playing"); }}
            style={{ fontFamily: FONT, fontSize: 10, padding: "13px 24px", background: "#ffe066", color: "#000", border: "4px solid #000", borderRadius: 6, cursor: "pointer", boxShadow: "inset 0 -4px 0 #a16207", userSelect: "none" }}
          >▶ PLAY AGAIN</div>
          <div
            onClick={() => setScreen("menu")}
            style={{ fontFamily: FONT, fontSize: 10, padding: "13px 24px", background: "#7c3aed", color: "#fff", border: "4px solid #000", borderRadius: 6, cursor: "pointer", boxShadow: "inset 0 -3px 0 #4c1d95", userSelect: "none" }}
          >CHANGE TABLES</div>
          <div
            onClick={() => navigate("/")}
            style={{ fontFamily: FONT, fontSize: 10, padding: "13px 24px", background: "#475569", color: "#e2e8f0", border: "4px solid #000", borderRadius: 6, cursor: "pointer", boxShadow: "inset 0 -3px 0 #334155", userSelect: "none" }}
          >← ARCADE</div>
        </div>
      </div>
    );
  }

  // ── PLAYING SCREEN ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0a0018", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 16 }}>
      <div
        onClick={() => navigate("/")}
        style={{ position: "absolute", top: 12, left: 16, color: "#4a4a6a", fontSize: 12, cursor: "pointer", zIndex: 10, padding: "6px 12px", borderRadius: 6, background: "rgba(10,0,24,0.8)", border: "1px solid #1a1a3a", fontFamily: FONT }}
      >← ARCADE</div>

      <div style={{ position: "relative", width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 8px" }}>
        <canvas
          ref={canvasRef}
          width={480}
          height={640}
          style={{ width: "100%", maxWidth: 480, display: "block", border: "2px solid #6d28d9", borderRadius: 4, boxShadow: "0 0 30px rgba(109,40,217,0.3)" }}
        />

        {/* Mobile touch controls */}
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 480, marginTop: 10, padding: "0 4px" }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[["ArrowLeft", "◀"], ["ArrowRight", "▶"]].map(([code, label]) => (
              <div
                key={code}
                onPointerDown={() => setKey(code, true)}
                onPointerUp={() => setKey(code, false)}
                onPointerLeave={() => setKey(code, false)}
                style={{
                  width: 62, height: 50, borderRadius: 8,
                  background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, cursor: "pointer",
                  userSelect: "none", WebkitTapHighlightColor: "transparent",
                  color: "#e2e8f0", fontFamily: FONT,
                }}
              >{label}</div>
            ))}
          </div>
          <div
            onPointerDown={() => setKey("Space", true)}
            onPointerUp={() => setKey("Space", false)}
            onPointerLeave={() => setKey("Space", false)}
            style={{
              width: 90, height: 50, borderRadius: 8,
              background: "rgba(0,245,212,0.15)", border: "2px solid rgba(0,245,212,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#00f5d4", cursor: "pointer",
              userSelect: "none", WebkitTapHighlightColor: "transparent",
              fontFamily: FONT,
            }}
          >FIRE</div>
        </div>
      </div>
    </div>
  );
}
