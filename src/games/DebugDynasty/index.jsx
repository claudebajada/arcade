import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ══════════════════════════════════════════════════════════════
//  DEBUG DYNASTY — THE BINARY BRIDGE
//  Single-file React game for the Game Arcade
// ══════════════════════════════════════════════════════════════

export default function DebugDynasty() {
  const navigate = useNavigate();

  // ── Font Loading ──
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ── Audio Engine ──
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const musicEnabledRef = useRef(true);
  const sfxEnabledRef = useRef(true);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AC();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = 0.5;
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((freq, duration, wave = "square", vol = 0.3) => {
    if (!sfxEnabledRef.current) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(masterGainRef.current);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }, [getAudioCtx]);

  const sfx = useMemo(() => ({
    bitOn: (bitIdx) => {
      const freqs = [262, 330, 392, 523, 659, 784];
      playTone(freqs[bitIdx] || 523, 0.08, "square", 0.25);
    },
    bitOff: (bitIdx) => {
      const freqs = [220, 277, 330, 440, 554, 659];
      playTone(freqs[bitIdx] || 440, 0.06, "square", 0.15);
    },
    match: () => {
      playTone(523, 0.12, "triangle", 0.3);
      setTimeout(() => playTone(659, 0.15, "triangle", 0.3), 100);
    },
    mismatch: () => playTone(150, 0.15, "sawtooth", 0.2),
    bridgeRepair: () => {
      playTone(200, 0.15, "sawtooth", 0.1);
      setTimeout(() => playTone(523, 0.1, "triangle", 0.25), 150);
      setTimeout(() => playTone(659, 0.1, "triangle", 0.25), 250);
      setTimeout(() => playTone(784, 0.15, "triangle", 0.3), 350);
    },
    bridgeCollapse: () => {
      playTone(300, 0.3, "sawtooth", 0.2);
      setTimeout(() => playTone(100, 0.5, "sawtooth", 0.15), 200);
    },
    dialogOpen: () => playTone(600, 0.06, "square", 0.15),
    dialogAdvance: () => playTone(400, 0.08, "triangle", 0.12),
    timerWarn: () => playTone(262, 0.3, "square", 0.15),
    timerCrit: () => playTone(262, 0.2, "square", 0.2),
    timerExpire: () => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => playTone(523 - i * 40, 0.1, "sawtooth", 0.15), i * 80);
      }
    },
    heartLost: () => {
      playTone(400, 0.08, "square", 0.2);
      setTimeout(() => playTone(250, 0.2, "square", 0.2), 80);
    },
    gateZap: () => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playTone(800 + Math.random() * 400, 0.05, "square", 0.15), i * 40);
      }
    },
    victory: () => {
      [262, 330, 392, 523].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.3, "triangle", 0.3), i * 200)
      );
    },
    gameOver: () => {
      [262, 233, 208, 196].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.4, "triangle", 0.2), i * 300)
      );
    },
    actReveal: () => {
      playTone(150, 0.3, "sawtooth", 0.1);
      setTimeout(() => {
        playTone(523, 0.2, "square", 0.25);
        playTone(659, 0.2, "square", 0.2);
      }, 400);
    },
    correctDecode: () => playTone(784, 0.2, "triangle", 0.3),
    wrongDecode: () => playTone(120, 0.2, "sawtooth", 0.2),
  }), [playTone]);

  // ── Level Data ──
  const ACTS = useMemo(() => [
    { label: "ACT I", title: "The Broken Bridges", icon: "🌉", desc: "Learn the ancient binary code to repair bridges and save stranded villages." },
    { label: "ACT II", title: "The Rising Flood", icon: "🌊", desc: "The river is rising! Decode binary under time pressure!" },
    { label: "ACT III", title: "The Shadow Gates", icon: "⚡", desc: "A dark wizard has cursed the bridges with logic gates — AND, OR, and XOR!" },
    { label: "ACT IV", title: "The Final Stand", icon: "👑", desc: "Everything you've learned converges. Save Castle Bitlandia!" },
  ], []);

  const LEVELS = useMemo(() => [
    { act:0,type:"encode",target:1,bits:4,village:"Hamlet of One",vc:1,context:"One family is trapped. The bridge code is 1.",teach:"The rightmost bit = 1. Flip it ON!",
      dialog:[{s:"w",t:"Your Majesty! The storm destroyed every bridge! The villagers are stranded!"},{s:"k",t:"How do these ancient bridges work?"},{s:"w",t:"They use **binary code** — ones and zeroes. Each slot is a **bit** worth a power of 2."},{s:"w",t:"From right to left: **1, 2, 4, 8**. Flip bits ON so they **add up** to the code!"}]},
    { act:0,type:"encode",target:5,bits:4,village:"Middleshire",vc:3,context:"Code 5. Which bits add up to exactly 5?",teach:"5 = 4 + 1. Skip the 2! Pick the right combination.",
      dialog:[{s:"k",t:"I did it! What's next?"},{s:"w",t:"**Middleshire** needs code **5**. You don't use every bit — pick the combination that adds up!"}]},
    { act:0,type:"encode",target:11,bits:4,village:"Ironvale",vc:4,context:"Code 11. Which powers of 2 sum to 11?",teach:"11 = 8 + 2 + 1. Three bits working together!",
      dialog:[{s:"w",t:"**Ironvale** awaits! Code **11**. Think: what combination of 8, 4, 2, 1 makes 11?"},{s:"k",t:"Like making change with coins!"}]},
    { act:0,type:"encode",target:15,bits:4,village:"Maxwall Fortress",vc:5,context:"Code 15 — the MAXIMUM for 4 bits! Every bit ON!",teach:"15 = 8+4+2+1 = all bits ON! 4 bits hold 0–15.",
      dialog:[{s:"w",t:"**Maxwall** — the northern capital. Code **15**!"},{s:"k",t:"That's every bit turned on!"},{s:"w",t:"The **maximum** for 4 bits. To go higher, we'll need more bits!"}]},
    { act:1,type:"decode",target:6,bits:4,village:"Clearwater",vc:2,context:"The bridge shows binary. Read it and type the decimal!",teach:"Reading binary: add ON bit values. 0110 = 4+2 = 6.",
      dialog:[{s:"w",t:"The **Clearwater** bridge shows its code in binary!"},{s:"k",t:"I need to READ binary instead of writing it?"},{s:"w",t:"Yes! Look at which bits are ON, add their values, enter the **decimal number**."}]},
    { act:1,type:"decode",target:13,bits:4,village:"Duskhollow",vc:3,context:"Read the binary: which bits are ON? Add their values!",teach:"1101 = 8+4+1 = 13. Read from left (biggest) to right.",
      dialog:[{s:"w",t:"**Duskhollow** — another encoded bridge. What number is **1101**?"}]},
    { act:1,type:"timed",target:22,bits:5,village:"Stormbreak",vc:4,time:30,context:"THE FLOOD IS RISING! Encode 22 before time runs out!",teach:"New 5th bit = 16! 22 = 16+4+2. Hurry!",
      dialog:[{s:"w",t:"The river is RISING! **Stormbreak** will flood in seconds!"},{s:"k",t:"How much time?!"},{s:"w",t:"**30 seconds!** And you have **5 bits** now — the new one is worth **16**!"}]},
    { act:1,type:"timed",target:29,bits:5,village:"Torrentdale",vc:6,time:25,context:"25 SECONDS! Encode 29 with 5 bits!",teach:"29 = 16+8+4+1. That's 11101 in binary!",
      dialog:[{s:"w",t:"**Torrentdale** is flooding! Code **29** — even less time!"},{s:"k",t:"I can do this!"}]},
    { act:2,type:"gate_and",a:7,b:5,bits:4,village:"Irongate",vc:3,context:"AND gate! Output is 1 ONLY if BOTH input bits are 1.",teach:"AND: both must be 1. Like needing TWO keys for a lock!",
      dialog:[{s:"w",t:"A dark wizard named **Glitch** cursed the bridges with **logic gates**!"},{s:"k",t:"Logic gates?"},{s:"w",t:"**AND** checks each bit: if **both** inputs are 1, output is 1. Otherwise 0."}]},
    { act:2,type:"gate_or",a:10,b:6,bits:4,village:"Sparkhollow",vc:4,context:"OR gate! Output is 1 if EITHER input is 1.",teach:"OR: either input = 1 means output = 1. Only 0+0 gives 0!",
      dialog:[{s:"w",t:"**Sparkhollow** has an **OR** gate curse!"},{s:"w",t:"OR: if **either** input is 1 (or both), output is 1."}]},
    { act:2,type:"gate_xor",a:13,b:11,bits:4,village:"Twistpeak",vc:5,context:"XOR — output is 1 only if the bits are DIFFERENT.",teach:"XOR: same bits → 0. Different bits → 1!",
      dialog:[{s:"w",t:"Glitch's masterpiece: the **XOR** gate on **Twistpeak**!"},{s:"w",t:"XOR: output is 1 when inputs are **different**. Same → 0, different → 1."}]},
    { act:3,type:"timed",target:42,bits:6,village:"Shadowfort",vc:7,time:35,context:"6 bits! 35 seconds! Encode 42!",teach:"6 bits, new = 32. 42 = 32+8+2 = 101010!",
      dialog:[{s:"w",t:"**Shadowfort** guards the road to the castle. Code **42**!"},{s:"w",t:"You have **6 bits** — the new one is **32**. And 35 seconds!"}]},
    { act:3,type:"gate_xor",a:42,b:27,bits:6,village:"Glitch's Tower",vc:6,context:"Defeat Glitch! XOR on 6-bit numbers!",teach:"42 XOR 27: compare each bit. Different → 1, same → 0.",
      dialog:[{s:"w",t:"**Glitch's Tower!** His final curse!"},{s:"k",t:"XOR on SIX bits?!"},{s:"w",t:"One bit at a time. You know the rules!"}]},
    { act:3,type:"timed",target:55,bits:6,village:"Castle Bitlandia",vc:8,time:30,context:"THE FINAL BRIDGE! 30 seconds! 55 in binary!",teach:"55 = 32+16+4+2+1 = 110111. You are the Binary King!",
      dialog:[{s:"w",t:"The final bridge... home to **Castle Bitlandia**."},{s:"k",t:"What's the code?"},{s:"w",t:"**55**. 30 seconds. Everything depends on this."},{s:"k",t:"For Bitlandia!"}]},
  ], []);

  // ── Game State ──
  const [screen, setScreen] = useState("title"); // title, act, game, gameover
  const [level, setLevel] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [saved, setSaved] = useState(0);
  const [currentAct, setCurrentAct] = useState(-1);
  const [phase, setPhase] = useState("dialog"); // dialog, puzzle, crossing, failed
  const [bits, setBits] = useState([]);
  const [dialogIdx, setDialogIdx] = useState(0);
  const [dialogRevealed, setDialogRevealed] = useState(false);
  const [timerPct, setTimerPct] = useState(100);
  const [decodeVal, setDecodeVal] = useState("");
  const [decodeStatus, setDecodeStatus] = useState(""); // correct, wrong, ""
  const [kingPos, setKingPos] = useState("left");
  const [bridgeState, setBridgeState] = useState("collapsed"); // collapsed, solid, failed
  const [toastMsg, setToastMsg] = useState(null);
  const [shaking, setShaking] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const timerRef = useRef(null);
  const timeLeftRef = useRef(0);
  const typeTimerRef = useRef(null);
  const [revealedText, setRevealedText] = useState("");
  const decodeInputRef = useRef(null);

  const currentLevel = LEVELS[level] || LEVELS[0];
  const numBits = currentLevel.bits || 4;
  const target = currentLevel.type === "gate_and" ? (currentLevel.a & currentLevel.b)
    : currentLevel.type === "gate_or" ? (currentLevel.a | currentLevel.b)
    : currentLevel.type === "gate_xor" ? (currentLevel.a ^ currentLevel.b)
    : currentLevel.target;

  const bitSum = bits.reduce((s, b, i) => s + b * Math.pow(2, i), 0);
  const isMatch = bitSum === target;

  // ── Helpers ──
  const showToast = useCallback((msg, sub, type = "success") => {
    setToastMsg({ msg, sub, type });
    setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 300);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const stopTypewriter = useCallback(() => {
    if (typeTimerRef.current) { clearInterval(typeTimerRef.current); typeTimerRef.current = null; }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopTimer(); stopTypewriter(); };
  }, [stopTimer, stopTypewriter]);

  // ── Start Level ──
  const startLevel = useCallback((lvlIdx) => {
    stopTimer();
    stopTypewriter();
    const L = LEVELS[lvlIdx];
    setLevel(lvlIdx);
    setBits(new Array(L.bits).fill(0));
    setPhase("dialog");
    setDialogIdx(0);
    setDialogRevealed(false);
    setRevealedText("");
    setKingPos("left");
    setBridgeState("collapsed");
    setTimerPct(100);
    setDecodeVal("");
    setDecodeStatus("");
    setWrongCount(0);
    setScreen("game");
    sfx.dialogOpen();
  }, [LEVELS, stopTimer, stopTypewriter, sfx]);

  // ── Typewriter for dialog ──
  useEffect(() => {
    if (screen !== "game" || phase !== "dialog") return;
    stopTypewriter();
    const L = LEVELS[level];
    if (!L || !L.dialog[dialogIdx]) return;
    const fullText = L.dialog[dialogIdx].t;
    let ci = 0;
    setRevealedText("");
    setDialogRevealed(false);
    typeTimerRef.current = setInterval(() => {
      ci += 2;
      if (ci >= fullText.length) {
        clearInterval(typeTimerRef.current);
        typeTimerRef.current = null;
        setRevealedText(fullText);
        setDialogRevealed(true);
      } else {
        setRevealedText(fullText.slice(0, ci));
      }
    }, 25);
    return () => stopTypewriter();
  }, [screen, phase, level, dialogIdx, LEVELS, stopTypewriter]);

  // ── Dialog Advance ──
  const advanceDialog = useCallback(() => {
    const L = LEVELS[level];
    if (!dialogRevealed) {
      stopTypewriter();
      setRevealedText(L.dialog[dialogIdx].t);
      setDialogRevealed(true);
      return;
    }
    sfx.dialogAdvance();
    if (dialogIdx < L.dialog.length - 1) {
      setDialogIdx(dialogIdx + 1);
      setDialogRevealed(false);
      setRevealedText("");
    } else {
      setPhase("puzzle");
      if (L.type === "timed") {
        const totalTime = L.time;
        timeLeftRef.current = totalTime;
        setTimerPct(100);
        timerRef.current = setInterval(() => {
          timeLeftRef.current -= 0.25;
          const pct = Math.max(0, (timeLeftRef.current / totalTime) * 100);
          setTimerPct(pct);
          if (pct < 30 && pct > 29.5) sfx.timerWarn();
          if (pct < 10 && pct > 9.5) sfx.timerCrit();
          if (timeLeftRef.current <= 0) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            sfx.timerExpire();
            sfx.bridgeCollapse();
            setBridgeState("failed");
            setLives(prev => {
              const nl = prev - 1;
              if (nl <= 0) {
                sfx.gameOver();
                setTimeout(() => setScreen("gameover"), 1500);
              } else {
                showToast("TIME'S UP!", "The flood swept the bridge away!", "fail");
                setTimeout(() => startLevel(level), 2200);
              }
              return nl;
            });
            sfx.heartLost();
            setPhase("failed");
          }
        }, 250);
      }
      if (L.type === "decode") {
        setTimeout(() => decodeInputRef.current?.focus(), 100);
      }
      if (L.type.startsWith("gate_")) sfx.gateZap();
    }
  }, [level, dialogIdx, dialogRevealed, LEVELS, sfx, stopTypewriter, showToast, startLevel]);

  // ── Toggle Bit ──
  const toggleBit = useCallback((i) => {
    if (phase !== "puzzle") return;
    const L = LEVELS[level];
    if (L.type === "decode") return;
    setBits(prev => {
      const next = [...prev];
      next[i] = next[i] ? 0 : 1;
      if (next[i]) sfx.bitOn(i); else sfx.bitOff(i);
      return next;
    });
  }, [phase, level, LEVELS, sfx]);

  // Check for match sound
  useEffect(() => {
    if (phase === "puzzle" && isMatch && bitSum > 0) {
      sfx.match();
    }
  }, [isMatch, bitSum, phase, sfx]);

  // ── Cross Bridge (Encode / Gate / Timed) ──
  const crossBridge = useCallback(() => {
    if (phase !== "puzzle" || !isMatch) return;
    stopTimer();
    setPhase("crossing");
    sfx.bridgeRepair();
    setBridgeState("solid");
    setKingPos("mid");
    setTimeout(() => setKingPos("right"), 1200);

    const bonus = LEVELS[level].type === "timed" ? Math.ceil(timeLeftRef.current) * 5 : 0;
    const pts = target * 10 + bonus;

    setSaved(prev => prev + 1);
    setScore(prev => prev + pts);
    sfx.victory();
    showToast("BRIDGE REPAIRED!", `${LEVELS[level].village} saved! +${pts}`, "success");

    setTimeout(() => {
      const next = level + 1;
      if (next >= LEVELS.length) {
        showToast("👑 KINGDOM SAVED!", `Final score: ${score + pts}`, "success");
        setTimeout(() => setScreen("gameover"), 2500);
      } else if (LEVELS[next].act !== currentAct) {
        setCurrentAct(LEVELS[next].act);
        setLevel(next);
        sfx.actReveal();
        setScreen("act");
      } else {
        startLevel(next);
      }
    }, 2600);
  }, [phase, isMatch, level, LEVELS, target, score, currentAct, stopTimer, sfx, showToast, startLevel]);

  // ── Decode Submit ──
  const submitDecode = useCallback(() => {
    if (phase !== "puzzle") return;
    const val = parseInt(decodeVal);
    if (isNaN(val)) return;
    if (val === target) {
      sfx.correctDecode();
      setDecodeStatus("correct");
      sfx.bridgeRepair();
      setBridgeState("solid");
      setPhase("crossing");
      setKingPos("mid");
      setTimeout(() => setKingPos("right"), 1200);
      const pts = target * 10;
      setSaved(prev => prev + 1);
      setScore(prev => prev + pts);
      sfx.victory();
      showToast("BRIDGE REPAIRED!", `${LEVELS[level].village} saved! +${pts}`, "success");
      setTimeout(() => {
        const next = level + 1;
        if (next >= LEVELS.length) {
          setTimeout(() => setScreen("gameover"), 2000);
        } else if (LEVELS[next].act !== currentAct) {
          setCurrentAct(LEVELS[next].act);
          setLevel(next);
          sfx.actReveal();
          setScreen("act");
        } else {
          startLevel(next);
        }
      }, 2600);
    } else {
      sfx.wrongDecode();
      setDecodeStatus("wrong");
      triggerShake();
      sfx.heartLost();
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= 3) {
        setLives(prev => {
          const nl = prev - 1;
          if (nl <= 0) {
            sfx.gameOver();
            setTimeout(() => setScreen("gameover"), 1500);
          } else {
            showToast("BRIDGE COLLAPSED!", "Too many wrong answers!", "fail");
            sfx.bridgeCollapse();
            setBridgeState("failed");
            setPhase("failed");
            setTimeout(() => startLevel(level), 2200);
          }
          return nl;
        });
      } else {
        showToast("WRONG!", `That's ${val}. Try again! (${3 - newWrong} left)`, "fail");
      }
      setTimeout(() => { setDecodeStatus(""); setDecodeVal(""); decodeInputRef.current?.focus(); }, 600);
    }
  }, [phase, decodeVal, target, level, LEVELS, currentAct, wrongCount, sfx, showToast, triggerShake, startLevel]);

  // ── Restart ──
  const restartGame = useCallback(() => {
    stopTimer();
    setLives(3);
    setScore(0);
    setSaved(0);
    setCurrentAct(0);
    setLevel(0);
    sfx.actReveal();
    setScreen("act");
  }, [stopTimer, sfx]);

  // ── Colors ──
  const C = {
    sky: "#0f172a", bg: "#1a1a2e", gold: "#f0c040", goldDim: "#a07820", green: "#4ade80",
    red: "#f87171", stone: "#6b7280", wood: "#92400e", woodL: "#b45309",
    water: "#1e40af", waterL: "#2563eb", grass: "#166534",
    white: "#e2e8f0", bitOn: "#facc15", bitOff: "#374151", dialog: "#1e1b4b",
    purple: "#7c3aed", cyan: "#06b6d4",
  };

  const font = "'Press Start 2P', monospace";
  const VC = ["#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#f97316"];

  // ── Format dialog text (bold with **) ──
  const formatText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <span key={i} style={{ color: C.gold }}>{p.slice(2, -2)}</span>;
      }
      return <span key={i}>{p}</span>;
    });
  };

  // ══════════════════════════════════════
  //  RENDER: TITLE SCREEN
  // ══════════════════════════════════════
  if (screen === "title") {
    return (
      <div style={{ minHeight: "100vh", background: C.sky, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: font, color: C.white, textAlign: "center" }}>
        <div onClick={() => navigate("/")} style={{ position: "absolute", top: 12, left: 16, color: "#4a4a6a", fontSize: 12, cursor: "pointer", zIndex: 10, padding: "6px 12px", borderRadius: 6, background: "#0a0c2080", border: "1px solid #1a1a3a", fontFamily: font, letterSpacing: 2 }}>← ARCADE</div>
        <div style={{ fontSize: 48, marginBottom: 16, animation: "none" }}>👑</div>
        <div style={{ fontSize: 20, color: C.gold, textShadow: "3px 3px 0 #000", letterSpacing: 2, marginBottom: 8 }}>DEBUG DYNASTY</div>
        <div style={{ fontSize: 10, color: C.stone, marginBottom: 24 }}>— THE BINARY BRIDGE —</div>
        <div style={{ fontSize: 8, color: "#94a3b8", lineHeight: 2.2, maxWidth: 520, padding: 16, border: "2px solid #334155", borderRadius: 6, background: "rgba(0,0,0,0.3)", textAlign: "left", marginBottom: 24 }}>
          The kingdom of <span style={{ color: C.gold }}>Bitlandia</span> is in trouble.<br /><br />
          A great storm has destroyed every bridge in the realm. Villages are cut off and people are hungry.<br /><br />
          These ancient bridges can only be repaired using <span style={{ color: C.gold }}>binary code</span> — the language of ones and zeroes.<br /><br />
          You are the <span style={{ color: C.gold }}>young King</span>, guided by wizard <span style={{ color: C.gold }}>Merlin-8</span>. Learn binary to save your kingdom.<br /><br />
          <span style={{ color: C.gold }}>The fate of Bitlandia is in your bits.</span>
        </div>
        <div onClick={() => { setCurrentAct(0); setLevel(0); sfx.actReveal(); setScreen("act"); }} style={{ fontFamily: font, fontSize: 14, padding: "14px 36px", background: C.gold, color: "#000", border: "4px solid #000", borderRadius: 6, cursor: "pointer", boxShadow: "inset 0 -4px 0 #a16207" }}>
          ▶ BEGIN QUEST
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  //  RENDER: ACT SCREEN
  // ══════════════════════════════════════
  if (screen === "act") {
    const act = ACTS[currentAct] || ACTS[0];
    return (
      <div style={{ minHeight: "100vh", background: C.sky, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: font, color: C.white, textAlign: "center", gap: 16 }}>
        <div onClick={() => navigate("/")} style={{ position: "absolute", top: 12, left: 16, color: "#4a4a6a", fontSize: 12, cursor: "pointer", zIndex: 10, padding: "6px 12px", borderRadius: 6, background: "#0a0c2080", border: "1px solid #1a1a3a", fontFamily: font, letterSpacing: 2 }}>← ARCADE</div>
        <div style={{ fontSize: 42 }}>{act.icon}</div>
        <div style={{ fontSize: 10, color: C.stone, letterSpacing: 4 }}>{act.label}</div>
        <div style={{ fontSize: 18, color: C.gold, textShadow: "2px 2px 0 #000" }}>{act.title}</div>
        <div style={{ fontSize: 8, color: "#94a3b8", lineHeight: 2, maxWidth: 440 }}>{act.desc}</div>
        <div onClick={() => startLevel(level)} style={{ fontFamily: font, fontSize: 13, padding: "14px 36px", background: C.gold, color: "#000", border: "4px solid #000", borderRadius: 6, cursor: "pointer", boxShadow: "inset 0 -4px 0 #a16207", marginTop: 12 }}>
          CONTINUE ▶
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  //  RENDER: GAME OVER
  // ══════════════════════════════════════
  if (screen === "gameover") {
    const won = saved >= LEVELS.length;
    return (
      <div style={{ minHeight: "100vh", background: C.sky, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: font, color: C.white, textAlign: "center", gap: 16 }}>
        <div onClick={() => navigate("/")} style={{ position: "absolute", top: 12, left: 16, color: "#4a4a6a", fontSize: 12, cursor: "pointer", zIndex: 10, padding: "6px 12px", borderRadius: 6, background: "#0a0c2080", border: "1px solid #1a1a3a", fontFamily: font, letterSpacing: 2 }}>← ARCADE</div>
        <div style={{ fontSize: 48 }}>{won ? "👑" : "💔"}</div>
        <div style={{ fontSize: 16, color: won ? C.gold : C.red }}>{won ? "KINGDOM SAVED!" : "GAME OVER"}</div>
        <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 2, maxWidth: 400 }}>
          {won
            ? "Every bridge in Bitlandia is restored! Binary is the language all computers speak — and now you speak it too."
            : "The kingdom has fallen... but binary never gives up, and neither should you!"}
        </div>
        <div style={{ fontSize: 10, color: C.gold }}>SCORE: {score}</div>
        <div style={{ fontSize: 8, color: C.stone }}>VILLAGES SAVED: {saved}/{LEVELS.length}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div onClick={restartGame} style={{ fontFamily: font, fontSize: 11, padding: "12px 28px", background: C.gold, color: "#000", border: "4px solid #000", borderRadius: 6, cursor: "pointer", boxShadow: "inset 0 -4px 0 #a16207" }}>
            ▶ PLAY AGAIN
          </div>
          <div onClick={() => navigate("/")} style={{ fontFamily: font, fontSize: 11, padding: "12px 28px", background: "#475569", color: C.white, border: "4px solid #000", borderRadius: 6, cursor: "pointer", boxShadow: "inset 0 -3px 0 #334155" }}>
            ← ARCADE
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  //  RENDER: GAME SCREEN
  // ══════════════════════════════════════
  const L = LEVELS[level];
  const actTheme = L.act === 1 ? C.red : L.act === 2 ? C.purple : L.act === 3 ? C.gold : C.green;

  const kingLeft = kingPos === "left" ? "12%" : kingPos === "mid" ? "46%" : "74%";
  const kingTop = kingPos === "mid" ? "26%" : "18%";

  return (
    <div style={{ minHeight: "100vh", background: C.sky, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: font, color: C.white, padding: "8px 16px", transform: shaking ? "translateX(-4px)" : "none", transition: shaking ? "none" : "transform 0.1s" }}>
      {/* Back Button */}
      <div onClick={() => navigate("/")} style={{ position: "absolute", top: 12, left: 16, color: "#4a4a6a", fontSize: 12, cursor: "pointer", zIndex: 10, padding: "6px 12px", borderRadius: 6, background: "#0a0c2080", border: "1px solid #1a1a3a", fontFamily: font, letterSpacing: 2 }}>← ARCADE</div>

      {/* HUD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 720, padding: "4px 0", gap: 8, flexWrap: "wrap", marginTop: 32 }}>
        <div style={{ fontSize: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: C.stone, fontSize: 7 }}>CH</span>
          <span style={{ color: C.gold }}>{level + 1}</span>
          <span style={{ color: C.stone }}>/14</span>
        </div>
        <div style={{ fontSize: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: C.stone, fontSize: 7 }}>SAVED</span>
          <div style={{ display: "flex", gap: 2 }}>
            {LEVELS.map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", border: "1px solid #000", background: i < saved ? C.green : C.bitOff, fontSize: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#000" }}>
                {i < saved ? "✓" : ""}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: C.stone, fontSize: 7 }}>SCORE</span>
          <span style={{ color: C.gold }}>{score}</span>
        </div>
        <div style={{ color: C.red, letterSpacing: 1, fontSize: 10 }}>
          {"♥".repeat(Math.max(0, lives))}{"♡".repeat(Math.max(0, 3 - lives))}
        </div>
      </div>

      {/* Timer Bar */}
      {L.type === "timed" && phase === "puzzle" && (
        <div style={{ width: "100%", maxWidth: 720, height: 14, background: "#1f2937", border: "2px solid #000", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
          <div style={{ height: "100%", width: `${timerPct}%`, background: timerPct < 10 ? C.red : timerPct < 30 ? C.gold : C.green, transition: "width 0.25s linear", opacity: timerPct < 10 ? (Date.now() % 1000 < 500 ? 1 : 0.6) : 1 }} />
        </div>
      )}

      {/* Scene */}
      <div style={{ width: "100%", maxWidth: 720, aspectRatio: "16/9", maxHeight: 240, background: C.grass, border: `4px solid ${actTheme}`, borderRadius: 4, position: "relative", overflow: "hidden", boxShadow: "0 0 20px rgba(0,0,0,0.5)", marginBottom: 8 }}>
        {/* Grass texture dots */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.15, background: "radial-gradient(circle 2px, #1a5c2a 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        {/* River */}
        <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: 50, background: `linear-gradient(180deg, #1e3a5f, ${C.water}, ${C.waterL}, ${C.water}, #1e3a5f)`, zIndex: 1 }} />
        {/* Bridge */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 110, height: 66, zIndex: 2 }}>
          <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", background: "#451a03", border: "2px solid #000", padding: "2px 8px", fontSize: 7, color: C.gold, whiteSpace: "nowrap", zIndex: 4, borderRadius: 2, fontFamily: font }}>
            {L.type.startsWith("gate_") ? L.type.split("_")[1].toUpperCase() : `CODE: ${L.type === "decode" ? "???" : L.target || target}`}
          </div>
          <div style={{ position: "absolute", top: 12, left: 8, right: 8, height: 2, background: "#78350f", zIndex: 3 }} />
          <div style={{ position: "absolute", width: 10, height: 38, background: C.wood, border: "2px solid #000", top: 12, left: -2, zIndex: 3 }} />
          <div style={{ position: "absolute", width: 10, height: 38, background: C.wood, border: "2px solid #000", top: 12, right: -2, zIndex: 3 }} />
          <div style={{
            width: "100%", height: 18, background: `repeating-linear-gradient(90deg, ${C.wood} 0px, ${C.wood} 10px, ${C.woodL} 10px, ${C.woodL} 12px)`,
            border: `2px solid ${bridgeState === "solid" ? C.green : bridgeState === "failed" ? C.red : "#000"}`,
            borderRadius: 2, position: "relative", top: 24,
            transform: bridgeState === "collapsed" ? "translateY(28px) rotate(8deg)" : bridgeState === "failed" ? "translateY(40px) rotate(15deg)" : "none",
            opacity: bridgeState === "collapsed" ? 0.3 : bridgeState === "failed" ? 0.15 : 1,
            boxShadow: bridgeState === "solid" ? `0 0 12px ${C.green}40` : "none",
            transition: "all 0.5s"
          }} />
        </div>
        {/* King */}
        <div style={{ position: "absolute", zIndex: 5, left: kingLeft, top: kingTop, transition: "left 1.2s ease, top 1.2s ease" }}>
          <div style={{ width: 28, height: 34, position: "relative" }}>
            <div style={{ position: "absolute", bottom: 22, left: 6, width: 16, height: 8, background: C.gold, border: "2px solid #000", clipPath: "polygon(0% 100%,0% 40%,20% 0%,20% 40%,40% 0%,40% 40%,60% 0%,60% 40%,80% 0%,80% 40%,100% 0%,100% 100%)" }} />
            <div style={{ width: 14, height: 12, background: "#fbbf24", border: "2px solid #000", position: "absolute", bottom: 12, left: 7, borderRadius: "2px 2px 0 0" }} />
            <div style={{ width: 16, height: 14, background: C.purple, border: "2px solid #000", position: "absolute", bottom: 0, left: 6, borderRadius: 2 }} />
          </div>
        </div>
        {/* Wizard */}
        <div style={{ position: "absolute", zIndex: 6, left: "3%", top: "60%" }}>
          <div style={{ width: 28, height: 36, position: "relative" }}>
            <div style={{ position: "absolute", bottom: 24, left: 5, width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: "16px solid #6366f1" }} />
            <div style={{ position: "absolute", bottom: 23, left: 2, width: 24, height: 4, background: "#6366f1", border: "1px solid #000", borderRadius: 2 }} />
            <div style={{ width: 14, height: 12, background: "#fbbf24", border: "2px solid #000", position: "absolute", bottom: 14, left: 7, borderRadius: 2 }} />
            <div style={{ width: 16, height: 16, background: "#1d4ed8", border: "2px solid #000", position: "absolute", bottom: 0, left: 6, borderRadius: 2 }} />
            <div style={{ position: "absolute", right: -4, bottom: 2, width: 3, height: 30, background: "#a16207", border: "1px solid #000" }} />
            <div style={{ position: "absolute", right: -6, bottom: 30, width: 7, height: 7, background: "#a855f7", border: "1px solid #000", borderRadius: "50%", boxShadow: "0 0 6px #a855f7" }} />
          </div>
        </div>
        {/* Village */}
        <div style={{ position: "absolute", right: "6%", top: "10%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, zIndex: 0 }}>
          <div style={{ width: 22, height: 14, background: C.wood, border: "2px solid #000", borderRadius: 2, position: "relative" }}>
            <div style={{ position: "absolute", top: -8, left: -3, width: 0, height: 0, borderLeft: "14px solid transparent", borderRight: "14px solid transparent", borderBottom: "10px solid #dc2626" }} />
          </div>
          <div style={{ fontSize: 5, color: C.goldDim, fontFamily: font, textAlign: "center" }}>{L.village}</div>
        </div>
        {/* Villagers */}
        <div style={{ position: "absolute", right: "14%", top: "22%", display: "flex", gap: 4, zIndex: 4 }}>
          {phase !== "crossing" && <div style={{ position: "absolute", top: -14, left: 4, fontSize: 8, color: C.red, fontFamily: font }}>!</div>}
          {Array.from({ length: L.vc || 3 }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 12, position: "relative" }}>
              <div style={{ width: 6, height: 6, background: "#fbbf24", border: "1px solid #000", borderRadius: 1, position: "absolute", top: 0, left: 1 }} />
              <div style={{ width: 8, height: 7, background: VC[i % VC.length], border: "1px solid #000", borderRadius: 1, position: "absolute", bottom: 0 }} />
            </div>
          ))}
        </div>
        {/* Trees */}
        {[[24, 6], [4, 72], [82, 68]].map(([l, t], i) => (
          <div key={i} style={{ position: "absolute", left: `${l}%`, top: `${t}%`, zIndex: 0 }}>
            <div style={{ width: 20, height: 16, background: "#15803d", border: "2px solid #000", clipPath: "polygon(50% 0%,0% 100%,100% 100%)", margin: "0 auto -2px" }} />
            <div style={{ width: 6, height: 10, background: "#78350f", margin: "0 auto", border: "1px solid #000" }} />
          </div>
        ))}
        {/* Enemy (Act 2+) */}
        {L.act >= 2 && (
          <div style={{ position: "absolute", left: phase === "crossing" ? "-15%" : "8%", top: "56%", zIndex: 7, transition: "left 0.8s" }}>
            <div style={{ width: 24, height: 28, position: "relative" }}>
              <div style={{ width: 12, height: 10, background: "#65a30d", border: "2px solid #000", position: "absolute", bottom: 10, left: 6, borderRadius: 2 }} />
              <div style={{ width: 14, height: 12, background: "#991b1b", border: "2px solid #000", position: "absolute", bottom: 0, left: 5, borderRadius: 2 }} />
            </div>
          </div>
        )}
      </div>

      {/* Dialog Box */}
      {phase === "dialog" && L.dialog[dialogIdx] && (
        <div style={{ width: "100%", maxWidth: 720, background: C.dialog, border: `3px solid ${C.goldDim}`, borderRadius: 6, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", marginBottom: 8 }}>
          <div style={{ fontSize: 8, color: C.gold, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
              {L.dialog[dialogIdx].s === "w" ? "🧙" : "👑"}
            </div>
            <span>{L.dialog[dialogIdx].s === "w" ? "MERLIN-8" : "KING"}</span>
          </div>
          <div style={{ fontSize: 8, lineHeight: 2, color: C.white, minHeight: 32 }}>
            {dialogRevealed ? formatText(L.dialog[dialogIdx].t) : revealedText}
          </div>
          <div onClick={advanceDialog} style={{ fontFamily: font, fontSize: 7, background: "none", border: `2px solid ${C.goldDim}`, color: C.gold, padding: "5px 12px", borderRadius: 4, cursor: "pointer", alignSelf: "flex-end" }}>
            {!dialogRevealed ? "SKIP ▶▶" : dialogIdx >= L.dialog.length - 1 ? "LET'S GO! ▶" : "NEXT ▶"}
          </div>
        </div>
      )}

      {/* Puzzle Area */}
      {phase === "puzzle" && (
        <div style={{ width: "100%", maxWidth: 720, background: C.bg, border: "3px solid #000", borderRadius: 6, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, boxShadow: "inset 0 0 30px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize: 8, color: C.gold, textShadow: "1px 1px 0 #000" }}>
            {L.type === "decode" ? "🔍 DECODE THE BRIDGE 🔍" : L.type.startsWith("gate_") ? `⚡ ${L.type.split("_")[1].toUpperCase()} GATE ⚡` : "⚔ REPAIR THE BRIDGE ⚔"}
          </div>
          <div style={{ fontSize: 7, color: "#94a3b8", textAlign: "center", lineHeight: 1.8 }}>{L.context}</div>

          {/* Gate visual */}
          {L.type.startsWith("gate_") && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(124,58,237,0.15)", border: "2px solid rgba(124,58,237,0.3)", borderRadius: 6, fontSize: 9 }}>
              <span style={{ color: C.cyan, fontSize: 11 }}>{L.a.toString(2).padStart(L.bits, "0")}</span>
              <span style={{ color: C.purple, fontSize: 10, fontWeight: "bold", minWidth: 36, textAlign: "center" }}>{L.type.split("_")[1].toUpperCase()}</span>
              <span style={{ color: C.cyan, fontSize: 11 }}>{L.b.toString(2).padStart(L.bits, "0")}</span>
              <span style={{ color: C.stone }}>→</span>
              <span style={{ color: C.gold }}>?</span>
            </div>
          )}

          {/* Target */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div>
              <div style={{ fontSize: 7, color: C.stone }}>{L.type === "decode" ? "BINARY CODE" : "BRIDGE CODE"}</div>
              <div style={{ color: C.gold, fontSize: 20, textShadow: "2px 2px 0 #000, 0 0 8px rgba(240,192,64,0.3)", minWidth: 50, textAlign: "center" }}>
                {L.type === "decode" ? L.target.toString(2).padStart(L.bits, "0") : L.type.startsWith("gate_") ? (isMatch ? target : "?") : L.target}
              </div>
            </div>
          </div>

          {/* Decode input */}
          {L.type === "decode" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 7, color: C.stone }}>DECIMAL:</span>
              <input
                ref={decodeInputRef}
                type="number"
                min="0"
                max="255"
                value={decodeVal}
                onChange={e => setDecodeVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") submitDecode(); }}
                style={{ fontFamily: font, fontSize: 18, width: 80, textAlign: "center", padding: 8, background: "#111827", border: `3px solid ${decodeStatus === "correct" ? C.green : decodeStatus === "wrong" ? C.red : C.goldDim}`, borderRadius: 4, color: decodeStatus === "correct" ? C.green : decodeStatus === "wrong" ? C.red : C.gold, outline: "none" }}
              />
              <div onClick={submitDecode} style={{ fontFamily: font, fontSize: 8, padding: "9px 14px", background: C.green, color: "#000", border: "3px solid #000", borderRadius: 4, cursor: "pointer" }}>CHECK</div>
            </div>
          )}

          {/* Decode locked bits display */}
          {L.type === "decode" && (
            <div style={{ display: "flex", gap: 5, alignItems: "flex-end", flexWrap: "wrap", justifyContent: "center" }}>
              {Array.from({ length: numBits }).map((_, idx) => {
                const i = numBits - 1 - idx;
                const bitVal = (L.target >> i) & 1;
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ fontSize: 6, color: C.stone }}>{Math.pow(2, i)}</div>
                    <div style={{ width: 40, height: 40, border: "3px solid #000", borderRadius: 4, fontFamily: font, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", background: bitVal ? "#4c1d95" : C.bitOff, color: bitVal ? "#a78bfa" : "#6b7280", boxShadow: "inset 0 -3px 0 #3b0764" }}>
                      {bitVal}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bit toggles (encode/gate/timed) */}
          {L.type !== "decode" && (
            <>
              <div style={{ display: "flex", gap: 5, alignItems: "flex-end", flexWrap: "wrap", justifyContent: "center" }}>
                {Array.from({ length: numBits }).map((_, idx) => {
                  const i = numBits - 1 - idx;
                  const on = bits[i] === 1;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ fontSize: 6, color: C.stone }}>{Math.pow(2, i)}</div>
                      <div
                        onClick={() => toggleBit(i)}
                        style={{ width: 40, height: 40, border: "3px solid #000", borderRadius: 4, fontFamily: font, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: on ? C.bitOn : C.bitOff, color: on ? "#000" : "#6b7280", boxShadow: on ? `inset 0 -3px 0 #a16207, 0 0 10px rgba(250,204,21,0.3)` : "inset 0 -3px 0 #1f2937", transition: "all 0.1s", userSelect: "none", WebkitTapHighlightColor: "transparent" }}
                      >
                        {on ? 1 : 0}
                      </div>
                      <div style={{ fontSize: 6, color: C.goldDim, height: 10 }}>{on ? Math.pow(2, i) : ""}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9 }}>
                <span style={{ color: C.stone, fontSize: 7 }}>YOUR CODE =</span>
                <span style={{ fontSize: 16, color: bitSum === 0 ? C.white : isMatch ? C.green : C.red, transition: "color 0.2s" }}>{bitSum}</span>
              </div>
            </>
          )}

          {/* Teaching note */}
          <div style={{ fontSize: 7, color: "#818cf8", lineHeight: 1.8, textAlign: "center", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 4, padding: "6px 10px", width: "100%" }}>
            🧙 {formatText(L.teach)}
          </div>

          {/* Buttons (encode/gate/timed) */}
          {L.type !== "decode" && (
            <div style={{ display: "flex", gap: 10 }}>
              <div
                onClick={crossBridge}
                style={{ fontFamily: font, fontSize: 8, padding: "9px 14px", border: "3px solid #000", borderRadius: 4, cursor: isMatch ? "pointer" : "not-allowed", background: isMatch ? C.green : C.stone, color: "#000", boxShadow: isMatch ? "inset 0 -3px 0 #166534" : "inset 0 -3px 0 #374151", opacity: isMatch ? 1 : 0.6, transition: "all 0.15s", userSelect: "none", WebkitTapHighlightColor: "transparent" }}
              >
                ⚒ REPAIR & CROSS
              </div>
              <div
                onClick={() => { setBits(new Array(numBits).fill(0)); }}
                style={{ fontFamily: font, fontSize: 8, padding: "9px 14px", background: "#475569", color: C.white, border: "3px solid #000", borderRadius: 4, cursor: "pointer", boxShadow: "inset 0 -3px 0 #334155", userSelect: "none", WebkitTapHighlightColor: "transparent" }}
              >
                CLEAR
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%) scale(1)", padding: "14px 24px", border: "4px solid #000", borderRadius: 6, fontSize: 11, zIndex: 100, textAlign: "center", fontFamily: font, background: toastMsg.type === "success" ? "#166534" : "#7f1d1d", color: toastMsg.type === "success" ? C.green : C.red, pointerEvents: "none" }}>
          <div>{toastMsg.msg}</div>
          {toastMsg.sub && <div style={{ fontSize: 7, marginTop: 6, color: C.white, opacity: 0.8 }}>{toastMsg.sub}</div>}
        </div>
      )}
    </div>
  );
}
