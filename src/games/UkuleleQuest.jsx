import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ============================================================================
   UKULELE QUEST — a classroom fretboard teaching game for shared tablets.
   Ported to the arcade container format (single JSX file, inline styles).
   ============================================================================ */

// ---------- MUSIC DATA ----------
// Standard re-entrant ukulele tuning, drawn top-to-bottom: G, C, E, A.
const STRINGS = [
  { name: "G", midi: 67 }, // high re-entrant G
  { name: "C", midi: 60 },
  { name: "E", midi: 64 },
  { name: "A", midi: 69 },
];
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const NUM_FRETS_FULL = 12;
const NUM_FRETS_COMPACT = 5;

const midiToName = (midi) => NOTE_NAMES[midi % 12];
const midiToPitch = (midi) => NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
const midiAt = (stringIdx, fret) => STRINGS[stringIdx].midi + fret;

// Open-position chord voicings. string 0 = G (top), 3 = A (bottom).
// Verified against chord tones: all ten produce the expected triad/tetrad.
const CHORDS = {
  C:  { dots: [{ s: 3, f: 3 }], desc: "C Major — one finger on the A string, 3rd fret" },
  Am: { dots: [{ s: 0, f: 2 }], desc: "A minor — G string, 2nd fret" },
  F:  { dots: [{ s: 0, f: 2 }, { s: 2, f: 1 }], desc: "F Major — G string 2nd fret, E string 1st fret" },
  G7: { dots: [{ s: 1, f: 2 }, { s: 2, f: 1 }, { s: 3, f: 2 }], desc: "G7 — C string 2, E string 1, A string 2" },
  G:  { dots: [{ s: 1, f: 2 }, { s: 2, f: 3 }, { s: 3, f: 2 }], desc: "G Major — C string 2, E string 3, A string 2" },
  Dm: { dots: [{ s: 0, f: 2 }, { s: 1, f: 2 }, { s: 2, f: 1 }], desc: "D minor — G string 2, C string 2, E string 1" },
  A7: { dots: [{ s: 1, f: 1 }], desc: "A7 — C string, 1st fret" },
  D7: { dots: [{ s: 0, f: 2 }, { s: 1, f: 2 }, { s: 2, f: 2 }, { s: 3, f: 3 }], desc: "D7 — G, C, E strings 2nd fret, A string 3rd fret" },
  Em: { dots: [{ s: 1, f: 4 }, { s: 2, f: 3 }, { s: 3, f: 2 }], desc: "E minor — C4, E3, A2" },
  E7: { dots: [{ s: 0, f: 1 }, { s: 1, f: 2 }, { s: 3, f: 2 }], desc: "E7 — G string 1, C string 2, E string open, A string 2" },
};

// ---------- COLOR / STYLE TOKENS ----------
const C = {
  wood1: "#d4a574",
  wood2: "#b8864d",
  wood3: "#8b5e34",
  woodDark: "#5a3a1f",
  cream: "#fff8ec",
  paper: "#fef3dc",
  ink: "#2b1d10",
  accent: "#e85d3a",
  accent2: "#f4a93b",
  good: "#5bb06b",
  goodGlow: "#8fde9e",
  bad: "#e8523a",
  badGlow: "#ff8877",
  cool: "#4a90c2",
};

// ---------- GLOBAL STYLE INJECTION ----------
// Inline styles can't express @font-face, @keyframes, or media queries,
// so we inject a <style> block once. All element-level styling stays inline.
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,700&family=Nunito:wght@600;800;900&display=swap');

.uq-root, .uq-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.uq-root { font-family: 'Nunito', system-ui, sans-serif; }
.uq-root button { font-family: inherit; }

@keyframes uq-turnPulse {
  0%   { transform: scale(0.8); opacity: 0; }
  60%  { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes uq-correctPop {
  0%   { transform: translate(-50%, -50%) scale(1); }
  40%  { transform: translate(-50%, -50%) scale(1.35); }
  100% { transform: translate(-50%, -50%) scale(1); }
}
@keyframes uq-ghostPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.85; }
  50%      { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}
@keyframes uq-fall {
  to { transform: translateY(110vh) rotate(720deg); opacity: 0.2; }
}

.uq-turn-indicator { animation: uq-turnPulse 0.6s cubic-bezier(.68,-0.3,.32,1.3); }
.uq-finger-dot.uq-correct { animation: uq-correctPop 0.6s ease-out; }
.uq-finger-dot.uq-ghost, .uq-open-mark.uq-ghost { animation: uq-ghostPulse 1.2s ease-in-out infinite; }

.uq-app.uq-flipped { transform: rotate(180deg); }
.uq-app            { transition: transform 0.6s cubic-bezier(.68,-0.3,.32,1.3); }
.uq-topbar-inner.uq-flipped { transform: rotate(180deg); }
.uq-topbar-inner             { transition: transform 0.6s cubic-bezier(.68,-0.3,.32,1.3); }

.uq-feedback.uq-show            { opacity: 1; }
.uq-feedback.uq-show .uq-fb-card { transform: scale(1); }

.uq-confetti { animation: uq-fall 1.4s ease-out forwards; }

/* Active-press feedback — inline styles can't express :active */
.uq-press:active { transform: translateY(2px) !important; filter: brightness(0.95); }

/* Fretboard ratios — media queries can't be expressed inline */
.uq-fretboard { aspect-ratio: 16 / 5; max-width: 1100px; }
@media (orientation: portrait) {
  .uq-fretboard { aspect-ratio: 10 / 5; max-width: 700px; }
}

.uq-hitbox { position: absolute; cursor: pointer; z-index: 4; transform: translate(-50%, -50%); }
`;

function useInjectStyle(css) {
  useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = css;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, [css]);
}

function useTone() {
  // Load Tone.js via CDN — returns a ref that becomes truthy once loaded.
  const toneRef = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.Tone) {
      toneRef.current = window.Tone;
      setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js";
    script.async = true;
    script.onload = () => {
      toneRef.current = window.Tone;
      setReady(true);
    };
    document.head.appendChild(script);
    // No cleanup — script stays loaded for the session; removing it mid-game
    // would be worse than leaving it.
  }, []);
  return { Tone: toneRef, ready };
}

// ---------- MAIN COMPONENT ----------
export default function UkuleleQuest() {
  const navigate = useNavigate();
  useInjectStyle(GLOBAL_CSS);
  const { Tone } = useTone();

  // ----- CORE STATE -----
  const [screen, setScreen] = useState("home"); // "home" | "game"
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState("relay");           // relay | council | master
  const [level, setLevel] = useState("notes");         // notes | chords
  const [scoring, setScoring] = useState("team");      // team | leaderboard
  const [players, setPlayers] = useState([
    { name: "Asha", score: 0 },
    { name: "Ben",  score: 0 },
    { name: "Cora", score: 0 },
    { name: "Dev",  score: 0 },
  ]);

  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [teamScore, setTeamScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);

  const [prompt, setPrompt] = useState(null);          // { type, ... }
  const [placedDots, setPlacedDots] = useState([]);    // [{s, f, correct?}]
  const [submitted, setSubmitted] = useState(false);
  const [ghostDots, setGhostDots] = useState(null);    // correct answer shown after wrong submit / reveal

  const [feedback, setFeedback] = useState(null);      // { good: bool, text, sub }
  const [confetti, setConfetti] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // ----- AUDIO -----
  const synthRef = useRef(null);
  const audioReadyRef = useRef(false);

  const initAudio = useCallback(() => {
    if (audioReadyRef.current) return;
    const T = Tone.current;
    if (!T) return;
    try {
      if (T.start) T.start();
      synthRef.current = new T.PolySynth(T.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 1.2 },
      }).toDestination();
      synthRef.current.volume.value = -6;
      audioReadyRef.current = true;
    } catch (e) {
      // Audio just won't play — game still works.
    }
  }, [Tone]);

  const playNote = useCallback((midi) => {
    if (!audioReadyRef.current || !synthRef.current) return;
    try { synthRef.current.triggerAttackRelease(midiToPitch(midi), "4n"); }
    catch (e) {}
  }, []);

  const playStrum = useCallback((midiList) => {
    midiList.forEach((m, i) => setTimeout(() => playNote(m), i * 45));
  }, [playNote]);

  const playSuccess = useCallback(() => {
    if (!audioReadyRef.current || !synthRef.current) return;
    ["C5", "E5", "G5", "C6"].forEach((n, i) =>
      setTimeout(() => synthRef.current.triggerAttackRelease(n, "8n"), i * 80)
    );
  }, []);

  const playFail = useCallback(() => {
    if (!audioReadyRef.current || !synthRef.current) return;
    synthRef.current.triggerAttackRelease("E3", "4n");
    setTimeout(() => synthRef.current.triggerAttackRelease("D#3", "4n"), 120);
  }, []);

  // ----- FRETBOARD GEOMETRY -----
  // Recalculated on resize/orientation change. Stored in state so dots
  // render at the correct (cx, cy) positions derived from hitbox centers.
  const fretboardRef = useRef(null);
  const [fbGeom, setFbGeom] = useState(null);
  const [fretCount, setFretCount] = useState(NUM_FRETS_FULL);

  const computeGeometry = useCallback(() => {
    const el = fretboardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const isPortrait = window.innerHeight > window.innerWidth;
    const nFrets = isPortrait ? NUM_FRETS_COMPACT : NUM_FRETS_FULL;
    setFretCount(nFrets);

    const W = rect.width, H = rect.height;
    const labelGutter = 32;
    const topGutter = 26;
    const playableH = H - topGutter;
    const nutWidth = Math.max(14, (W - labelGutter) * 0.035);
    const rightPad = Math.max(18, W * 0.025);
    const playWidth = W - labelGutter - nutWidth - rightPad;

    // Rule of 18: fret N sits at scaleLen * (1 - 2^(-N/12)), normalized so
    // fret N=nFrets lands at the right edge. Fret 1 is widest; each subsequent
    // fret space is ~5-6% narrower.
    const rawFrac = [];
    for (let i = 1; i <= nFrets; i++) rawFrac.push(1 - Math.pow(2, -i / 12));
    const norm = rawFrac[rawFrac.length - 1];
    const positions = rawFrac.map((f) => (f / norm) * playWidth);

    const nutLeft = labelGutter;
    const nutRightX = nutLeft + nutWidth;

    const stringMargin = playableH * 0.15;
    const usableH = playableH - stringMargin * 2;
    const stringYs = STRINGS.map(
      (_, i) => topGutter + stringMargin + usableH * (i / (STRINGS.length - 1))
    );

    // Build cell centers for every (string, fret) intersection.
    const cells = [];
    for (let si = 0; si < STRINGS.length; si++) {
      for (let fi = 0; fi <= nFrets; fi++) {
        let cx, cellW;
        if (fi === 0) {
          cx = nutLeft + nutWidth / 2;
          cellW = nutWidth * 1.8;
        } else {
          const prevX = fi === 1 ? nutRightX : nutRightX + positions[fi - 2];
          const thisX = nutRightX + positions[fi - 1];
          cx = (prevX + thisX) / 2;
          cellW = thisX - prevX;
        }
        cells.push({ s: si, f: fi, cx, cy: stringYs[si], w: cellW });
      }
    }

    const stringSpacing = stringYs[1] - stringYs[0];
    const dotSize = Math.max(26, Math.round(Math.min(stringSpacing * 0.72, 58)));
    const openSize = Math.round(dotSize * 0.75);

    setFbGeom({
      W, H, nutWidth, nutLeft, nutRightX, topGutter, playableH,
      positions, stringYs, stringSpacing, cells, dotSize, openSize, nFrets,
    });
  }, []);

  useEffect(() => {
    if (screen !== "game") return;
    // Defer geometry calc to next frame so the fretboard element has real dimensions.
    const raf = requestAnimationFrame(computeGeometry);
    const onResize = () => computeGeometry();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [screen, computeGeometry]);

  // ----- ROUND LOGIC -----
  const makeNotePrompt = useCallback(() => {
    const choices = ["C", "D", "E", "F", "G", "A", "B", "F#", "G#"];
    const target = choices[Math.floor(Math.random() * choices.length)];
    const answers = [];
    for (let si = 0; si < STRINGS.length; si++) {
      for (let fi = 0; fi <= 3; fi++) {
        if (midiToName(midiAt(si, fi)) === target) answers.push({ s: si, f: fi });
      }
    }
    return answers.length ? { type: "note", note: target, answers } : makeNotePrompt();
  }, []);

  const makeChordPrompt = useCallback(() => {
    const keys = Object.keys(CHORDS);
    const name = keys[Math.floor(Math.random() * keys.length)];
    return { type: "chord", name, dots: CHORDS[name].dots, desc: CHORDS[name].desc };
  }, []);

  const nextRound = useCallback(() => {
    setPlacedDots([]);
    setSubmitted(false);
    setGhostDots(null);
    setFeedback(null);
    setRoundsPlayed((r) => {
      // Advance current player starting from round 2.
      if (r >= 1) setCurrentPlayerIdx((i) => (i + 1) % Math.max(players.length, 1));
      return r + 1;
    });
    setPrompt(level === "notes" ? makeNotePrompt() : makeChordPrompt());
  }, [level, players.length, makeNotePrompt, makeChordPrompt]);

  // ----- LIFECYCLE: start / reset / end -----
  const startGame = useCallback(() => {
    if (players.length === 0) {
      setPlayers([{ name: "Player 1", score: 0 }]);
    }
    setPlayers((ps) => ps.map((p) => ({ ...p, score: 0 })));
    setTeamScore(0);
    setRoundsPlayed(0);
    setCurrentPlayerIdx(0);
    setScreen("game");
    initAudio();
    // Seed the first round after state has committed.
    setTimeout(() => {
      setPlacedDots([]);
      setSubmitted(false);
      setGhostDots(null);
      setFeedback(null);
      setPrompt(level === "notes" ? makeNotePrompt() : makeChordPrompt());
      setRoundsPlayed(1);
    }, 0);
  }, [players.length, level, initAudio, makeNotePrompt, makeChordPrompt]);

  const endGame = useCallback(() => { setShowResults(true); }, []);

  const goHome = useCallback(() => {
    setShowResults(false);
    setScreen("home");
  }, []);

  // ----- INTERACTION -----
  const onHitboxTap = useCallback((s, f) => {
    if (submitted) return;
    if (mode === "master") return; // teacher-led: kids play real ukuleles, no tapping.
    if (level === "notes") {
      setPlacedDots([{ s, f }]);
      playNote(midiAt(s, f));
      // Auto-submit after a beat so students see their placement register.
      setTimeout(() => submitAnswer([{ s, f }]), 180);
    } else {
      setPlacedDots((prev) => {
        const existing = prev.findIndex((d) => d.s === s && d.f === f);
        if (existing >= 0) return prev.filter((_, i) => i !== existing);
        const withoutSameString = prev.filter((d) => d.s !== s);
        playNote(midiAt(s, f));
        return [...withoutSameString, { s, f }];
      });
    }

  }, [submitted, mode, level, playNote]);

  const dotsEqual = (a, b) => {
    if (a.length !== b.length) return false;
    const key = (d) => `${d.s}.${d.f}`;
    const A = a.map(key).sort();
    const B = b.map(key).sort();
    return A.every((v, i) => v === B[i]);
  };

  const submitAnswer = useCallback((overrideDots) => {
    if (submitted || !prompt) return;
    const dots = overrideDots || placedDots;
    let correct = false;
    if (prompt.type === "note") {
      if (dots.length !== 1) return;
      correct = prompt.answers.some((a) => a.s === dots[0].s && a.f === dots[0].f);
    } else {
      correct = dotsEqual(dots, prompt.dots);
    }
    setSubmitted(true);

    // Annotate each placed dot with its correctness for color-coding.
    const annotated = dots.map((d) => {
      let ok;
      if (prompt.type === "note") ok = correct;
      else ok = prompt.dots.some((a) => a.s === d.s && a.f === d.f);
      return { ...d, correct: ok };
    });
    setPlacedDots(annotated);

    if (correct) {
      if (prompt.type === "chord") playStrum(prompt.dots.map((d) => midiAt(d.s, d.f)));
      setTimeout(playSuccess, prompt.type === "chord" ? 400 : 150);

      // Award point according to current scoring mode.
      if (scoring === "team") setTeamScore((t) => t + 1);
      else setPlayers((ps) => ps.map((p, i) => i === currentPlayerIdx ? { ...p, score: p.score + 1 } : p));

      showFeedbackCard(true, prompt);
      spawnConfetti();
    } else {
      playFail();
      setGhostDots(prompt.type === "note" ? prompt.answers : prompt.dots);
      showFeedbackCard(false, prompt);
    }

  }, [submitted, prompt, placedDots, scoring, currentPlayerIdx, playStrum, playSuccess, playFail]);

  const revealAnswer = useCallback(() => {
    if (submitted || !prompt) return;
    setSubmitted(true);
    if (prompt.type === "note") {
      setGhostDots(prompt.answers);
      const a = prompt.answers[0];
      playNote(midiAt(a.s, a.f));
    } else {
      setGhostDots(prompt.dots);
      setTimeout(() => playStrum(prompt.dots.map((d) => midiAt(d.s, d.f))), 200);
    }

  }, [submitted, prompt, playNote, playStrum]);

  const awardPoint = useCallback(() => {
    if (scoring === "team") setTeamScore((t) => t + 1);
    else setPlayers((ps) => ps.map((p, i) => i === currentPlayerIdx ? { ...p, score: p.score + 1 } : p));
    playSuccess();
  }, [scoring, currentPlayerIdx, playSuccess]);

  const showFeedbackCard = (good, p) => {
    const goodWords = ["Nailed it!", "Perfect!", "Beautiful!", "Chord of champions!", "Yes!"];
    const badWords = ["Not quite!", "Close!", "Try again next time!", "Almost!"];
    const text = good
      ? goodWords[Math.floor(Math.random() * goodWords.length)]
      : badWords[Math.floor(Math.random() * badWords.length)];
    let sub = "";
    if (!good) sub = p.type === "note" ? `${p.note} is the one in green` : (p.desc || p.name);
    setFeedback({ good, text, sub });
    setTimeout(() => setFeedback(null), good ? 1400 : 1800);
  };

  const spawnConfetti = () => {
    const pieces = [];
    const colors = ["#e85d3a", "#f4a93b", "#5bb06b", "#4a90c2", "#d4a574"];
    for (let i = 0; i < 40; i++) {
      pieces.push({
        id: Date.now() + "-" + i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
        rot: Math.random() * 360,
      });
    }
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 2000);
  };

  // ----- PLAYERS UI HELPERS -----
  const addPlayer = () => {
    if (players.length >= 8) return;
    setPlayers((ps) => [...ps, { name: `Player ${ps.length + 1}`, score: 0 }]);
  };
  const updatePlayerName = (idx, name) => {
    setPlayers((ps) => ps.map((p, i) => i === idx ? { ...p, name: name || `Player ${idx + 1}` } : p));
  };
  const removePlayer = (idx) => {
    setPlayers((ps) => ps.filter((_, i) => i !== idx));
  };

  // ---------- RENDER: BACK BUTTON ----------
  // Per the arcade guide, this must be present and use navigate("/").
  const backBtn = (
    <div
      onClick={() => navigate("/")}
      style={{
        position: "fixed", top: 12, left: 16,
        color: "#4a4a6a", fontSize: 12, cursor: "pointer",
        zIndex: 300, padding: "6px 12px", borderRadius: 6,
        background: "#0a0c2080", border: "1px solid #1a1a3a",
        fontFamily: "'Courier New', monospace", letterSpacing: 2,
      }}
    >
      ← ARCADE
    </div>
  );

  // ---------- RENDER: TOP BAR (pinned, outside rotating content) ----------
  const topbar = (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 68,
        background: `linear-gradient(180deg, ${C.wood3} 0%, ${C.woodDark} 100%)`,
        color: C.cream,
        boxShadow: "0 4px 0 rgba(0,0,0,0.15), 0 6px 20px rgba(0,0,0,0.18)",
        zIndex: 100,
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <div
        className={"uq-topbar-inner" + (flipped ? " uq-flipped" : "")}
        style={{
          height: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 18px 0 120px",
        }}
      >
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: C.accent2, boxShadow: "0 0 0 3px rgba(244,169,59,0.3)" }} />
          Ukulele Quest
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <TopBtn onClick={() => setFlipped((f) => !f)} title="Flip the screen for the opposite side">⟲ Flip</TopBtn>
          {screen === "game" && <TopBtn onClick={goHome} title="Back to setup">⌂ Menu</TopBtn>}
        </div>
      </div>
    </div>
  );

  // ---------- RENDER ----------
  return (
    <div className="uq-root" style={{ position: "fixed", inset: 0, background: C.cream, color: C.ink, overflow: "hidden", userSelect: "none", WebkitUserSelect: "none", touchAction: "manipulation" }}>
      {backBtn}
      {topbar}

      {/* Ambient background wash */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(232,93,58,0.05) 0%, transparent 40%)," +
          "radial-gradient(circle at 80% 70%, rgba(244,169,59,0.05) 0%, transparent 40%)",
      }} />

      {/* Rotating content container */}
      <div
        className={"uq-app" + (flipped ? " uq-flipped" : "")}
        style={{ position: "relative", width: "100vw", height: "100vh", zIndex: 1, transformOrigin: "center center" }}
      >
        {/* Screens — absolutely positioned, equal top/bottom clearance for flip safety */}
        <div style={{
          position: "absolute",
          top:    `calc(68px + env(safe-area-inset-top, 0px))`,
          bottom: `calc(68px + env(safe-area-inset-bottom, 0px))`,
          left: 0, right: 0,
          padding: 18,
          overflowY: "auto", overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          display: screen === "home" ? "block" : "none",
        }}>
          <HomeScreen
            mode={mode} setMode={setMode}
            level={level} setLevel={setLevel}
            scoring={scoring} setScoring={setScoring}
            players={players}
            addPlayer={addPlayer}
            updatePlayerName={updatePlayerName}
            removePlayer={removePlayer}
            onStart={startGame}
          />
        </div>

        <div style={{
          position: "absolute",
          top:    `calc(68px + env(safe-area-inset-top, 0px))`,
          bottom: `calc(68px + env(safe-area-inset-bottom, 0px))`,
          left: 0, right: 0,
          padding: 18,
          overflowY: "auto", overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          display: screen === "game" ? "block" : "none",
        }}>
          <GameScreen
            prompt={prompt}
            mode={mode} level={level} scoring={scoring}
            players={players}
            currentPlayerIdx={currentPlayerIdx}
            teamScore={teamScore}
            placedDots={placedDots}
            ghostDots={ghostDots}
            submitted={submitted}
            fretboardRef={fretboardRef}
            fbGeom={fbGeom}
            fretCount={fretCount}
            onHitboxTap={onHitboxTap}
            onClear={() => setPlacedDots([])}
            onSubmit={() => submitAnswer()}
            onReveal={revealAnswer}
            onNext={nextRound}
            onAward={awardPoint}
            onEnd={endGame}
          />
        </div>
      </div>

      {/* Feedback overlay */}
      {feedback && (
        <div className={"uq-feedback uq-show"} style={{
          position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 200, opacity: 1, transition: "opacity 0.2s",
        }}>
          <div className="uq-fb-card" style={{
            background: "white", borderRadius: 24, padding: "26px 44px",
            fontFamily: "'Fraunces', serif", fontWeight: 900,
            fontSize: "clamp(32px, 5vw, 54px)", textAlign: "center",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            border: `5px solid ${feedback.good ? C.good : C.bad}`,
            color: feedback.good ? C.good : C.bad,
            transform: "scale(1)", transition: "transform 0.3s cubic-bezier(.68,-0.3,.32,1.3)",
          }}>
            {feedback.text}
            {feedback.sub && (
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 18, marginTop: 6, color: C.wood3 }}>
                {feedback.sub}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confetti */}
      {confetti.map((c) => (
        <div key={c.id} className="uq-confetti" style={{
          position: "fixed", pointerEvents: "none", width: 10, height: 14,
          top: -20, left: c.left + "vw", zIndex: 99,
          background: c.color, animationDelay: c.delay + "s", transform: `rotate(${c.rot}deg)`,
        }} />
      ))}

      {/* Results modal */}
      {showResults && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(43,29,16,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 250, padding: 20,
        }}>
          <div style={{
            background: C.cream, border: `5px solid ${C.woodDark}`, borderRadius: 24,
            padding: 24, maxWidth: 500, width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 32, margin: "0 0 14px", color: C.woodDark, textAlign: "center" }}>
              Final Scores 🎉
            </h2>
            <ResultsBody scoring={scoring} teamScore={teamScore} roundsPlayed={roundsPlayed} players={players} />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <ActionBtn primary style={{ flex: 1 }} onClick={() => { setShowResults(false); startGame(); }}>Play Again</ActionBtn>
              <ActionBtn style={{ flex: 1 }} onClick={goHome}>Menu</ActionBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function TopBtn({ children, onClick, title }) {
  return (
    <button
      className="uq-press"
      onClick={onClick}
      title={title}
      style={{
        background: "rgba(255,248,236,0.12)", color: C.cream,
        border: "2px solid rgba(255,248,236,0.25)",
        borderRadius: 14, padding: "10px 14px",
        fontWeight: 800, fontSize: 15, cursor: "pointer", minHeight: 48,
        display: "flex", alignItems: "center", gap: 8,
        transition: "transform 0.15s, background 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function ActionBtn({ children, onClick, primary, danger, disabled, style = {} }) {
  const bg = danger ? C.bad : primary ? C.good : C.wood3;
  const border = danger ? "#a83c21" : primary ? "#3d8a4e" : C.woodDark;
  const fs = primary ? 18 : 16;
  const pad = primary ? "16px 28px" : "14px 22px";
  return (
    <button
      className="uq-press"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#b5b5b5" : bg,
        color: C.cream,
        border: `3px solid ${disabled ? "#8a8a8a" : border}`,
        borderRadius: 16, padding: pad,
        fontWeight: 900, fontSize: fs, cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: `0 4px 0 ${disabled ? "#8a8a8a" : border}`,
        minHeight: 52, transition: "transform 0.12s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22,
      margin: "18px 0 10px", color: C.woodDark,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ width: 24, height: 4, background: C.accent, borderRadius: 2 }} />
      {children}
    </div>
  );
}

function ChoiceCard({ emoji, title, body, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className="uq-press"
      style={{
        background: selected ? "#fff" : C.paper,
        border: `3px solid ${selected ? C.accent : C.wood2}`,
        borderRadius: 20, padding: 18, cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
        boxShadow: selected
          ? `0 4px 0 ${C.accent}, 0 0 0 4px rgba(232,93,58,0.15)`
          : `0 4px 0 ${C.wood2}`,
        display: "flex", flexDirection: "column", gap: 6,
        minHeight: 120, position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ fontSize: 34, lineHeight: 1 }}>{emoji}</div>
      <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, margin: 0, color: C.woodDark }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14, color: C.wood3, fontWeight: 600, lineHeight: 1.35 }}>{body}</p>
    </div>
  );
}

// ---------- HOME SCREEN ----------
function HomeScreen({ mode, setMode, level, setLevel, scoring, setScoring, players, addPlayer, updatePlayerName, removePlayer, onStart }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
      <div style={{ textAlign: "center", padding: "12px 0 22px" }}>
        <h1 style={{
          fontFamily: "'Fraunces', serif", fontWeight: 900,
          fontSize: "clamp(38px, 6vw, 64px)", margin: "0 0 8px",
          lineHeight: 0.95, letterSpacing: "-0.03em", color: C.woodDark,
        }}>
          Play the <em style={{ fontStyle: "italic", color: C.accent }}>Ukulele</em>, Together.
        </h1>
        <p style={{ fontSize: 18, color: C.wood3, margin: 0, fontWeight: 700 }}>
          A shared-tablet fretboard quest for classrooms of 2–8 players.
        </p>
      </div>

      <SectionTitle>Pick a mode</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <ChoiceCard emoji="🏃" title="Pass & Play" body="Fast solo turns. One student solves, then passes the tablet. Everyone gets fair screen time."
          selected={mode === "relay"} onClick={() => setMode("relay")} />
        <ChoiceCard emoji="🤝" title="The Council" body="Team huddle. Discuss, agree, and a rotating Captain taps the answer for the group."
          selected={mode === "council"} onClick={() => setMode("council")} />
        <ChoiceCard emoji="🎓" title="GamesMaster" body="Teacher holds the tablet. Kids play on real ukuleles. Tap Reveal to show the answer."
          selected={mode === "master"} onClick={() => setMode("master")} />
      </div>

      <SectionTitle>Pick a level</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <ChoiceCard emoji="🎯" title="Note Hunter" body="Beginner · Single tap. Find one note on the fretboard (open strings & frets 1–3)."
          selected={level === "notes"} onClick={() => setLevel("notes")} />
        <ChoiceCard emoji="🎼" title="Chord Builder" body="Intermediate · Place multiple finger dots to build a chord shape, then Submit."
          selected={level === "chords"} onClick={() => setLevel("chords")} />
      </div>

      <SectionTitle>Scoring style</SectionTitle>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "8px 0 18px" }}>
        {[
          { key: "team", label: "👥 Team Score" },
          { key: "leaderboard", label: "🏆 Player Leaderboard" },
        ].map((opt) => (
          <button key={opt.key} className="uq-press"
            onClick={() => setScoring(opt.key)}
            style={{
              flex: 1, minWidth: 150,
              background: scoring === opt.key ? C.accent : C.paper,
              color: scoring === opt.key ? "white" : C.woodDark,
              border: `3px solid ${scoring === opt.key ? C.accent : C.wood2}`,
              borderRadius: 14, padding: 14,
              fontWeight: 900, fontSize: 16, cursor: "pointer",
              boxShadow: `0 3px 0 ${scoring === opt.key ? "#a83c21" : C.wood2}`,
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      <SectionTitle>Players</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        {players.map((p, i) => (
          <div key={i} style={{
            background: C.paper, border: `3px solid ${C.wood2}`, borderRadius: 999,
            padding: "10px 14px", fontWeight: 900, fontSize: 16,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: `0 3px 0 ${C.wood2}`,
          }}>
            <span>🎸</span>
            <input type="text" value={p.name} maxLength={12}
              onChange={(e) => updatePlayerName(i, e.target.value)}
              style={{
                background: "transparent", border: "none", outline: "none",
                font: "inherit", color: "inherit", width: 90, padding: 0,
              }}
            />
            {players.length > 1 && (
              <button onClick={() => removePlayer(i)} style={{
                background: C.bad, color: "white", border: "none",
                width: 26, height: 26, borderRadius: "50%",
                fontWeight: 900, cursor: "pointer", fontSize: 14, lineHeight: 1,
              }}>×</button>
            )}
          </div>
        ))}
      </div>
      <button onClick={addPlayer} className="uq-press" style={{
        background: C.accent2, color: C.ink,
        border: `3px solid ${C.woodDark}`, borderRadius: 999,
        padding: "10px 18px", fontWeight: 900, fontSize: 16,
        cursor: "pointer", boxShadow: `0 3px 0 ${C.woodDark}`,
      }}>+ Add Player</button>

      <button onClick={onStart} className="uq-press" style={{
        display: "block", margin: "24px auto 30px",
        background: C.good, color: "white",
        border: "4px solid #3d8a4e", borderRadius: 20,
        padding: "20px 48px",
        fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 28,
        letterSpacing: "0.02em", cursor: "pointer",
        boxShadow: "0 5px 0 #3d8a4e, 0 8px 20px rgba(61,138,78,0.3)",
        transition: "transform 0.12s",
      }}>
        🎵  Start the Quest  🎵
      </button>
    </div>
  );
}

// ---------- GAME SCREEN ----------
function GameScreen({
  prompt, mode, level, scoring,
  players, currentPlayerIdx, teamScore,
  placedDots, ghostDots, submitted,
  fretboardRef, fbGeom, fretCount,
  onHitboxTap, onClear, onSubmit, onReveal, onNext, onAward, onEnd,
}) {
  if (!prompt) return <div style={{ padding: 40, textAlign: "center", fontWeight: 900 }}>Loading…</div>;

  const isChords = level === "chords";
  const isMaster = mode === "master";
  const player = players[currentPlayerIdx] || { name: "" };

  const promptLabel =
    prompt.type === "note"
      ? (isMaster ? "Students: play this note" : "Find the note")
      : (isMaster ? "Students: play this chord" : "Build the chord");

  const turnText =
    mode === "relay"   ? `🎤 ${player.name}'s turn`
  : mode === "council" ? `🤝 Captain: ${player.name}`
                       : `🎓 GamesMaster`;

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "stretch", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <div style={{
          background: C.paper, border: `4px solid ${C.wood2}`,
          borderRadius: 18, padding: "10px 20px", textAlign: "center",
          boxShadow: `0 4px 0 ${C.wood2}`, flex: 1, minWidth: 200,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: C.wood3 }}>
            {promptLabel}
          </div>
          <div style={{
            fontFamily: "'Fraunces', serif", fontWeight: 900,
            fontSize: "clamp(28px, 4.5vw, 48px)",
            lineHeight: 1, color: C.woodDark, marginTop: 2,
          }}>
            <em style={{ color: C.accent, fontStyle: "normal" }}>
              {prompt.type === "note" ? prompt.note : prompt.name}
            </em>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center", minWidth: 150 }}>
          <div key={currentPlayerIdx + "-" + (prompt ? prompt.note || prompt.name : "")}
               className="uq-turn-indicator"
               style={{
                background: `linear-gradient(135deg, ${C.accent2} 0%, ${C.accent} 100%)`,
                color: "white", padding: "8px 16px", borderRadius: 12,
                fontFamily: "'Fraunces', serif", fontWeight: 900,
                fontSize: "clamp(15px, 2.2vw, 22px)",
                boxShadow: "0 3px 0 rgba(0,0,0,0.15)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
            {turnText}
          </div>
          <ScoreBadges scoring={scoring} players={players} currentIdx={currentPlayerIdx} teamScore={teamScore} />
        </div>
      </div>

      {/* Fretboard */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 0", width: "100%" }}>
        <div
          ref={fretboardRef}
          className="uq-fretboard"
          style={{
            width: "100%",
            background: `linear-gradient(180deg, #6b4423 0%, ${C.wood3} 15%, #a87147 50%, ${C.wood3} 85%, #6b4423 100%)`,
            borderRadius: 12,
            border: `4px solid ${C.woodDark}`,
            boxShadow: "inset 0 2px 8px rgba(255,255,255,0.15), inset 0 -4px 12px rgba(0,0,0,0.3), 0 8px 0 " + C.woodDark + ", 0 12px 30px rgba(0,0,0,0.25)",
            position: "relative", overflow: "hidden", touchAction: "none",
          }}
        >
          {/* Wood-grain overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 3px)," +
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 7px)",
          }} />

          {fbGeom && <FretboardContents
            fbGeom={fbGeom}
            fretCount={fretCount}
            placedDots={placedDots}
            ghostDots={ghostDots}
            onHitboxTap={onHitboxTap}
            tapDisabled={isMaster || submitted}
          />}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ display: "flex", gap: 10, padding: "12px 0 4px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
        {!isMaster && isChords && !submitted && (
          <>
            <ActionBtn onClick={onClear}>Clear</ActionBtn>
            <ActionBtn primary onClick={onSubmit} disabled={placedDots.length === 0}>Submit</ActionBtn>
          </>
        )}
        {isMaster && !submitted && (
          <ActionBtn primary onClick={onReveal}>Reveal Answer</ActionBtn>
        )}
        {submitted && (
          <>
            {isMaster && <ActionBtn onClick={onAward}>+1 Point</ActionBtn>}
            <ActionBtn onClick={onNext}>Next ▶</ActionBtn>
          </>
        )}
        <ActionBtn danger onClick={onEnd}>End Game</ActionBtn>
      </div>
    </>
  );
}

function ScoreBadges({ scoring, players, currentIdx, teamScore }) {
  if (scoring === "team") {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{
          background: C.accent, color: "white", border: `2px solid ${C.accent}`,
          borderRadius: 10, padding: "6px 10px", fontWeight: 900, fontSize: 14,
          display: "flex", gap: 6, alignItems: "center",
        }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "white" }} />
          Team: {teamScore}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
      {players.map((p, i) => {
        const active = i === currentIdx;
        return (
          <div key={i} style={{
            background: active ? C.accent : C.cream,
            color: active ? "white" : C.ink,
            border: `2px solid ${active ? C.accent : C.wood2}`,
            borderRadius: 10, padding: "6px 10px", fontWeight: 900, fontSize: 14,
            display: "flex", gap: 6, alignItems: "center",
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: active ? "white" : C.accent }} />
            {p.name}: {p.score}
          </div>
        );
      })}
    </div>
  );
}

// ---------- FRETBOARD CONTENTS (nut, wires, strings, hitboxes, dots) ----------
function FretboardContents({ fbGeom, fretCount, placedDots, ghostDots, onHitboxTap, tapDisabled }) {
  const { W, H, nutWidth, nutLeft, nutRightX, topGutter, playableH,
          positions, stringYs, stringSpacing, cells, dotSize, openSize } = fbGeom;

  // Render layers (z-order matters): nut → fret wires → inlay markers →
  // fret numbers → strings → string labels → hitboxes → dots/ghosts.

  const nut = (
    <div key="nut" style={{
      position: "absolute", left: nutLeft, width: nutWidth,
      top: topGutter, bottom: 0,
      background: "linear-gradient(180deg, #fffaf0 0%, #ede0b8 50%, #b8a06a 100%)",
      borderRight: "4px solid #2b1d10",
      boxShadow: "inset -2px 0 4px rgba(0,0,0,0.2)",
      zIndex: 3,
    }} />
  );

  const wires = [];
  const inlays = [];
  const fretNums = [];
  for (let i = 1; i <= fretCount; i++) {
    const x = nutRightX + positions[i - 1];
    wires.push(
      <div key={"w" + i} style={{
        position: "absolute", left: x, top: topGutter, bottom: 0,
        width: 4, transform: "translateX(-50%)",
        background: "linear-gradient(180deg, #f0f0f0 0%, #b8b8b8 50%, #808080 100%)",
        boxShadow: "1px 0 3px rgba(0,0,0,0.5), inset -1px 0 0 rgba(0,0,0,0.2)",
        zIndex: 2,
      }} />
    );
    const prevX = i === 1 ? nutRightX : nutRightX + positions[i - 2];
    const spaceMid = (prevX + x) / 2;

    fretNums.push(
      <div key={"n" + i} style={{
        position: "absolute", top: 4, left: spaceMid,
        transform: "translateX(-50%)",
        fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 900,
        color: "rgba(255,248,236,0.85)",
        background: "rgba(43,29,16,0.55)",
        padding: "2px 8px", borderRadius: 8, zIndex: 3,
        pointerEvents: "none", letterSpacing: "0.02em",
      }}>{i}</div>
    );

    if ([3, 5, 7, 10].includes(i)) {
      inlays.push(
        <div key={"m" + i} style={{
          position: "absolute", width: 16, height: 16, borderRadius: "50%",
          left: spaceMid, top: topGutter + playableH * 0.5,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle at 30% 30%, #fff8ec, #c9b687)",
          boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.3), 0 1px 1px rgba(0,0,0,0.2)",
          zIndex: 1, pointerEvents: "none",
        }} />
      );
    }
    if (i === 12) {
      [0.33, 0.67].forEach((t, k) => {
        inlays.push(
          <div key={"m12-" + k} style={{
            position: "absolute", width: 16, height: 16, borderRadius: "50%",
            left: spaceMid, top: topGutter + playableH * t,
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle at 30% 30%, #fff8ec, #c9b687)",
            boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.3), 0 1px 1px rgba(0,0,0,0.2)",
            zIndex: 1, pointerEvents: "none",
          }} />
        );
      });
    }
  }

  const stringGrad = {
    G: "linear-gradient(180deg, #faf2d4 0%, #e8d59a 50%, #b09760 100%)",
    C: "linear-gradient(180deg, #f5ebc5 0%, #dcc683 50%, #9b8250 100%)",
    E: "linear-gradient(180deg, #f4f4f4 0%, #d0d0d0 50%, #8a8a8a 100%)",
    A: "linear-gradient(180deg, #ffffff 0%, #e0e0e0 50%, #9a9a9a 100%)",
  };
  const stringH = { G: 4, C: 3.5, E: 3, A: 2.5 };

  const strings = STRINGS.map((s, i) => (
    <React.Fragment key={"s" + i}>
      <div style={{
        position: "absolute", left: 0, right: 0,
        top: stringYs[i] - 2, height: stringH[s.name],
        background: stringGrad[s.name],
        zIndex: 2, pointerEvents: "none",
        boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
      }} />
      <div style={{
        position: "absolute", left: 2, top: stringYs[i],
        transform: "translate(-2px, -50%)",
        fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 18,
        color: C.cream, background: "rgba(43,29,16,0.7)",
        padding: "2px 7px", borderRadius: 8, zIndex: 4,
        pointerEvents: "none", minWidth: 24, textAlign: "center",
      }}>{s.name}</div>
    </React.Fragment>
  ));

  const hitboxes = cells.map((cell) => (
    <div
      key={`h${cell.s}.${cell.f}`}
      className="uq-hitbox"
      style={{
        left: cell.cx, top: cell.cy,
        width: Math.max(cell.w, 32),
        height: Math.max(stringSpacing * 0.95, 32),
        display: "flex", alignItems: "center", justifyContent: "center",
        ...(tapDisabled ? { cursor: "default" } : {}),
      }}
      onClick={tapDisabled ? undefined : () => onHitboxTap(cell.s, cell.f)}
    />
  ));

  // Dots — placed + ghost. Ghost dots skipped if already matched by placed.
  const dots = [];
  placedDots.forEach((d, idx) => {
    const cell = cells.find((c) => c.s === d.s && c.f === d.f);
    if (!cell) return;
    dots.push(renderDot({
      key: `p${idx}`, cx: cell.cx, cy: cell.cy,
      fret: d.f, correct: d.correct, dotSize, openSize,
    }));
  });
  if (ghostDots) {
    ghostDots.forEach((d, idx) => {
      const matched = placedDots.some((p) => p.s === d.s && p.f === d.f);
      if (matched) return;
      const cell = cells.find((c) => c.s === d.s && c.f === d.f);
      if (!cell) return;
      dots.push(renderDot({
        key: `g${idx}`, cx: cell.cx, cy: cell.cy,
        fret: d.f, ghost: true, dotSize, openSize,
      }));
    });
  }

  return (
    <>
      {nut}
      {wires}
      {inlays}
      {fretNums}
      {strings}
      {hitboxes}
      {dots}
    </>
  );
}

function renderDot({ key, cx, cy, fret, correct, ghost, dotSize, openSize }) {
  if (fret === 0) {
    // Open-string indicator — a ring, not a filled dot.
    let borderColor = "white";
    let bg = "transparent";
    let extraClass = "";
    let boxShadow = "";
    if (ghost) {
      borderColor = C.goodGlow;
      extraClass = "uq-ghost uq-open-mark";
    } else if (correct === true) {
      borderColor = C.goodGlow;
      boxShadow = `0 0 0 4px rgba(91,176,107,0.3)`;
    } else if (correct === false) {
      borderColor = C.badGlow;
    }
    return (
      <div key={key} className={("uq-open-mark " + extraClass).trim()} style={{
        position: "absolute", left: cx, top: cy,
        width: openSize, height: openSize, borderRadius: "50%",
        border: `3px ${ghost ? "dashed" : "solid"} ${borderColor}`,
        background: bg, boxShadow,
        transform: "translate(-50%, -50%) scale(1)",
        zIndex: 5, pointerEvents: "none",
        transition: "transform 0.2s cubic-bezier(.68,-0.3,.32,1.3)",
      }} />
    );
  }
  // Fretted-note finger dot.
  let gradient;
  let extraClass = "";
  if (ghost) {
    gradient = `radial-gradient(circle at 35% 30%, rgba(91,176,107,0.6) 0%, rgba(91,176,107,0.9) 60%, rgba(61,138,78,0.9) 100%)`;
    extraClass = "uq-ghost uq-finger-dot";
  } else if (correct === true) {
    gradient = `radial-gradient(circle at 35% 30%, #a5e6b0 0%, ${C.good} 60%, #3d8a4e 100%)`;
    extraClass = "uq-correct uq-finger-dot";
  } else if (correct === false) {
    gradient = `radial-gradient(circle at 35% 30%, #ff9e8e 0%, ${C.bad} 60%, #a83c21 100%)`;
    extraClass = "uq-finger-dot";
  } else {
    gradient = `radial-gradient(circle at 35% 30%, #ff8b6a 0%, ${C.accent} 60%, #a83c21 100%)`;
    extraClass = "uq-finger-dot";
  }
  return (
    <div key={key} className={extraClass.trim()} style={{
      position: "absolute", left: cx, top: cy,
      width: dotSize, height: dotSize, borderRadius: "50%",
      background: gradient,
      border: `3px ${ghost ? "dashed" : "solid"} ${C.cream}`,
      transform: "translate(-50%, -50%) scale(1)",
      zIndex: 5, pointerEvents: "none",
      boxShadow: "0 3px 8px rgba(0,0,0,0.4)",
      transition: "transform 0.2s cubic-bezier(.68,-0.3,.32,1.3)",
    }} />
  );
}

// ---------- RESULTS MODAL BODY ----------
function ResultsBody({ scoring, teamScore, roundsPlayed, players }) {
  if (scoring === "team") {
    return (
      <>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px",
          background: "linear-gradient(135deg, #fff5d1, #f4d97b)",
          border: "2px solid #d4a51f", borderRadius: 12, marginBottom: 8,
          fontWeight: 900, fontSize: 18,
        }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: C.accent, minWidth: 32 }}>🏆</span>
          <span>Team Score</span>
          <span>{teamScore} / {roundsPlayed}</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontWeight: 800, color: C.wood3 }}>
          {teamScore === roundsPlayed && roundsPlayed > 0 ? "PERFECT ROUND! 🎉" : "Great teamwork!"}
        </div>
      </>
    );
  }
  const ranked = [...players].sort((a, b) => b.score - a.score);
  return (
    <>
      {ranked.map((p, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
        const first = i === 0;
        return (
          <div key={p.name + i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 16px",
            background: first ? "linear-gradient(135deg, #fff5d1, #f4d97b)" : C.paper,
            border: `2px solid ${first ? "#d4a51f" : C.wood2}`,
            borderRadius: 12, marginBottom: 8, fontWeight: 900, fontSize: 18,
          }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: C.accent, minWidth: 32 }}>{medal}</span>
            <span>{p.name}</span>
            <span>{p.score}</span>
          </div>
        );
      })}
    </>
  );
}
