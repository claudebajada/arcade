import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

/*
 ╔══════════════════════════════════════════════════════════════╗
 ║  R E L A T I V I S T I C   R A C E R                       ║
 ║  A universe where light speed is only 100 mph.              ║
 ║  Demonstrates time dilation & Lorentz contraction.          ║
 ╚══════════════════════════════════════════════════════════════╝
*/

const C = 100;
const LANE_COUNT = 3;
const STAR_COUNT = 100;

const LEVELS = [
  {
    id: 1, name: "LOCAL ORBIT", distance: 2400, timeLimit: 50,
    briefing: [
      "PILOT, THIS IS DISPATCH.",
      "",
      "YOUR SISTER MARA IS STRANDED",
      "ON KEPLER STATION. LIFE SUPPORT",
      "IS FAILING. YOU'RE HER ONLY HOPE.",
      "",
      "BUT HERE'S THE CATCH:",
      "IN OUR UNIVERSE, LIGHT CRAWLS",
      "AT JUST 100 MPH.",
      "",
      "THE FASTER YOU FLY, THE SLOWER",
      "YOUR CLOCK TICKS COMPARED TO",
      "HERS. PUSH TOO HARD AND SHE'LL",
      "AGE PAST THE RESCUE WINDOW.",
      "",
      "FIRST LEG: LOCAL ORBIT.",
      "EASY RUN. LEARN THE SHIP.",
    ],
    obstacleRate: 2.5, chronotonChance: 0, boostChance: 0.4, crystalChance: 0.3,
    storyAfter: "LOCAL ORBIT CLEARED. MARA'S\nSIGNAL IS STILL STRONG.\nPUSHING TO THE HIGHWAY...",
  },
  {
    id: 2, name: "SOLAR HIGHWAY", distance: 4000, timeLimit: 60,
    briefing: [
      "LEG 2: SOLAR HIGHWAY.",
      "",
      "FASTER SPEEDS NEEDED NOW.",
      "YOU'LL START TO FEEL IT--",
      "THE ROAD CONTRACTS AHEAD OF YOU",
      "AS YOU APPROACH LIGHT SPEED.",
      "",
      "THAT'S LORENTZ CONTRACTION.",
      "SPACE ITSELF SQUEEZES IN YOUR",
      "DIRECTION OF TRAVEL.",
      "",
      "WATCH FOR CHRONOTON STORMS--",
      "THEY ADD TIME TO MARA'S CLOCK.",
      "",
      "COLLECT TIME CRYSTALS TO",
      "CLAW BACK PRECIOUS SECONDS.",
    ],
    obstacleRate: 2.0, chronotonChance: 0.2, boostChance: 0.3, crystalChance: 0.25,
    storyAfter: "HIGHWAY CLEAR. THE DILATION\nIS REAL NOW--YOUR CLOCK AND\nMARA'S ARE DIVERGING FAST...",
  },
  {
    id: 3, name: "DEEP SPACE", distance: 5500, timeLimit: 65,
    briefing: [
      "LEG 3: DEEP SPACE.",
      "",
      "YOU NEED 70+ MPH HERE.",
      "AT THAT SPEED, GAMMA HITS 1.4.",
      "FOR EVERY SECOND YOU EXPERIENCE,",
      "MARA EXPERIENCES 1.4 SECONDS.",
      "",
      "THE TWIN PARADOX IS REAL.",
      "YOU AND MARA STARTED THE SAME",
      "AGE. BY THE TIME YOU ARRIVE,",
      "SHE'LL HAVE LIVED MORE THAN YOU.",
      "",
      "DENSE ASTEROID FIELD AHEAD.",
      "HITTING DEBRIS COSTS SPEED",
      "AND ADDS TO MARA'S CLOCK.",
      "",
      "FLY PRECISE. FLY FAST.",
    ],
    obstacleRate: 1.4, chronotonChance: 0.25, boostChance: 0.25, crystalChance: 0.2,
    storyAfter: "ALMOST THERE. MARA'S VITALS\nARE DROPPING. ONE MORE LEG.\nYOU HAVE TO PUSH TO THE LIMIT.",
  },
  {
    id: 4, name: "THE LAST LIGHT", distance: 7000, timeLimit: 70,
    briefing: [
      "FINAL LEG: THE LAST LIGHT.",
      "",
      "KEPLER STATION IS CLOSE BUT",
      "YOU NEED NEAR-LIGHT-SPEED.",
      "",
      "ABOVE 90 MPH, GAMMA EXCEEDS 2.",
      "EVERY SECOND FOR YOU IS TWO",
      "SECONDS FOR MARA.",
      "",
      "THE UNIVERSE WILL WARP AROUND",
      "YOU. STARS WILL STREAK. SPACE",
      "WILL COMPRESS TO A TUNNEL.",
      "",
      "THIS IS WHAT EINSTEIN SAW.",
      "THIS IS WHAT RELATIVITY FEELS",
      "LIKE AT THE EDGE OF LIGHT.",
      "",
      "SAVE YOUR SISTER, PILOT.",
    ],
    obstacleRate: 1.1, chronotonChance: 0.3, boostChance: 0.2, crystalChance: 0.2,
    storyAfter: null,
  },
];

// ═══════════════════ COMPONENT ═══════════════════
export default function RelativisticRacer() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const touchRef = useRef({ left: false, right: false, gas: false, brake: false });
  const frameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const audioCtxRef = useRef(null);
  const musicRef = useRef(null);
  const fontLoadedRef = useRef(false);

  // ═══ DEVICE DETECTION ═══
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth < 900;
  });

  useEffect(() => {
    const check = () => {
      const mobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth < 900;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [phase, setPhase] = useState("title");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [totalShipTime, setTotalShipTime] = useState(0);
  const [totalSpecTime, setTotalSpecTime] = useState(0);
  const phaseRef = useRef("title");
  const levelRef = useRef(0);
  const briefingRef = useRef({ line: 0, char: 0, timer: null, done: false });
  const isMobileRef = useRef(isMobile);
  const [, bump] = useState(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { levelRef.current = currentLevel; }, [currentLevel]);
  useEffect(() => { isMobileRef.current = isMobile; }, [isMobile]);

  // ═══════════════ FONT ═══════════════
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`;
    document.head.appendChild(s);
    const ch = setInterval(() => {
      if (document.fonts.check("12px 'Press Start 2P'")) { fontLoadedRef.current = true; clearInterval(ch); }
    }, 100);
    return () => { document.head.removeChild(s); clearInterval(ch); };
  }, []);

  const F = useCallback(() => fontLoadedRef.current ? "'Press Start 2P'" : "'Courier New', monospace", []);

  // ═══════════════ AUDIO ═══════════════
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const startMusic = useCallback((tempo = 180) => {
    if (musicRef.current) { clearInterval(musicRef.current); musicRef.current = null; }
    const ctx = getAudioCtx();
    const melody = [330,330,392,440,392,330,294,262,294,330,294,262,220,262,294,330,349,392,440,494,440,392,349,330,294,330,392,330,294,262,294,330];
    const bass = [131,131,165,165,175,175,131,131,147,147,165,165,110,110,147,147,175,175,220,220,196,196,175,175,147,147,196,196,131,131,147,147];
    let step = 0;
    const st = 60 / tempo / 2;
    const pn = (freq, dur, type, vol, det = 0) => {
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = freq; o.detune.value = det;
        g.gain.setValueAtTime(vol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + dur);
      } catch(e){}
    };
    const pd = (type) => {
      try {
        if (type === 'k') {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(150, ctx.currentTime);
          o.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.12);
          g.gain.setValueAtTime(0.3, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          o.connect(g); g.connect(ctx.destination);
          o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.15);
        } else {
          const len = type === 's' ? 0.05 : 0.02;
          const vol = type === 's' ? 0.18 : 0.08;
          const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (type === 's' ? 0.2 : 0.08);
          const n = ctx.createBufferSource(); n.buffer = buf;
          const g = ctx.createGain();
          g.gain.setValueAtTime(vol, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + len);
          n.connect(g); g.connect(ctx.destination); n.start(ctx.currentTime);
        }
      } catch(e){}
    };
    musicRef.current = setInterval(() => {
      const i = step % melody.length;
      pn(melody[i], st * 0.8, 'square', 0.055, 5);
      pn(bass[i], st * 0.9, 'sawtooth', 0.07);
      if (step % 2 === 0) pn(melody[i] * 2, st * 0.3, 'square', 0.025);
      if (step % 4 === 0) pd('k');
      if (step % 4 === 2) pd('s');
      if (step % 2 === 0) pd('h');
      step++;
    }, st * 1000);
  }, [getAudioCtx]);

  const stopMusic = useCallback(() => {
    if (musicRef.current) { clearInterval(musicRef.current); musicRef.current = null; }
  }, []);

  const playSfx = useCallback((type) => {
    try {
      const ctx = getAudioCtx();
      const pn = (freq, dur, w, vol, delay = 0) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = w; o.frequency.value = freq;
        g.gain.setValueAtTime(vol, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + delay); o.stop(ctx.currentTime + delay + dur);
      };
      if (type === 'hit') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(250, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3);
      } else if (type === 'boost') {
        [600,800,1000].forEach((f,i) => pn(f, 0.1, 'square', 0.07, i*0.05));
      } else if (type === 'crystal') {
        [1200,1500,1800,2100].forEach((f,i) => pn(f, 0.18, 'sine', 0.08, i*0.06));
      } else if (type === 'chronoton') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(80, ctx.currentTime);
        o.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.4);
        g.gain.setValueAtTime(0.18, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.45);
      } else if (type === 'win') {
        [523,659,784,1047].forEach((f,i) => pn(f, 0.3, 'square', 0.09, i*0.14));
      } else if (type === 'fail') {
        [300,250,200,150].forEach((f,i) => pn(f, 0.22, 'square', 0.1, i*0.18));
      } else if (type === 'type') {
        pn(800 + Math.random()*400, 0.025, 'square', 0.025);
      }
    } catch(e){}
  }, [getAudioCtx]);

  // ═══════════════ GAME INIT ═══════════════
  const initLevel = useCallback((lvlIndex) => {
    const lvl = LEVELS[lvlIndex];
    const stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({ x: Math.random(), y: Math.random(), z: Math.random()*3+0.5, br: Math.random()*0.5+0.5 });
    }
    gameRef.current = {
      speed: 0, lane: 1, laneX: 1,
      dist: 0, shipClock: 0, specClock: 0,
      gam: 1, topSpeed: 0, peakGamma: 1,
      stars, obstacles: [], obsTimer: 0, roadOff: 0,
      shakeX: 0, shakeY: 0, shakeDur: 0, hitCD: 0,
      warnFlash: 0, particles: [], popups: [],
      crystals: 0, boosts: 0, hits: 0,
      finished: false, lvl,
      warpI: 0, flashA: 0, flashC: '#fff',
    };
  }, []);

  const gammaFn = (v) => 1 / Math.sqrt(Math.max(0.0001, 1 - (v*v)/(C*C)));

  // ═══════════════ KEYBOARD INPUT (Desktop only) ═══════════════
  useEffect(() => {
    const dn = (e) => {
      keysRef.current[e.key] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  // ═══════════════ CANVAS SIZING ═══════════════
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current; if (!c) return;
      const mobile = isMobileRef.current;
      // Desktop: fill viewport. Mobile: leave room for touch controls.
      c.width = Math.min(window.innerWidth, 960);
      c.height = mobile
        ? Math.min(window.innerHeight - 140, 520)
        : Math.min(window.innerHeight - 10, 720);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [isMobile]);

  // ═══════════════ PHASE TRANSITIONS ═══════════════
  const startBriefing = useCallback((lvlIdx) => {
    const br = briefingRef.current;
    if (br.timer) clearInterval(br.timer);
    br.line = 0; br.char = 0; br.done = false;
    const lines = LEVELS[lvlIdx].briefing;
    br.timer = setInterval(() => {
      if (br.line >= lines.length) { br.done = true; clearInterval(br.timer); br.timer = null; bump(n=>n+1); return; }
      const line = lines[br.line];
      if (br.char < line.length) {
        if (line[br.char] !== ' ') playSfx('type');
        br.char++;
      } else { br.line++; br.char = 0; }
      bump(n => n + 1);
    }, 30);
  }, [playSfx]);

  const goBriefing = useCallback((lvl) => {
    setCurrentLevel(lvl); levelRef.current = lvl;
    startBriefing(lvl);
    setPhase('briefing'); phaseRef.current = 'briefing';
  }, [startBriefing]);

  const goPlaying = useCallback(() => {
    initLevel(levelRef.current);
    startMusic(180 + levelRef.current * 12);
    setPhase('playing'); phaseRef.current = 'playing';
  }, [initLevel, startMusic]);

  const goLevelComplete = useCallback(() => {
    stopMusic(); playSfx('win');
    const g = gameRef.current;
    setTotalShipTime(p => p + g.shipClock);
    setTotalSpecTime(p => p + g.specClock);
    setPhase('levelcomplete'); phaseRef.current = 'levelcomplete';
  }, [stopMusic, playSfx]);

  const goGameOver = useCallback(() => { stopMusic(); playSfx('fail'); setPhase('gameover'); phaseRef.current = 'gameover'; }, [stopMusic, playSfx]);
  const goWin = useCallback(() => { playSfx('win'); setPhase('wingame'); phaseRef.current = 'wingame'; }, [playSfx]);

  const handleAction = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'title') { getAudioCtx(); setTotalShipTime(0); setTotalSpecTime(0); goBriefing(0); }
    else if (p === 'briefing') {
      const br = briefingRef.current;
      if (!br.done) { if (br.timer) clearInterval(br.timer); br.timer = null; br.line = LEVELS[levelRef.current].briefing.length; br.char = 0; br.done = true; bump(n=>n+1); }
      else goPlaying();
    }
    else if (p === 'levelcomplete') {
      const next = levelRef.current + 1;
      if (next >= LEVELS.length) goWin();
      else goBriefing(next);
    }
    else if (p === 'gameover') { setTotalShipTime(0); setTotalSpecTime(0); goBriefing(levelRef.current); }
    else if (p === 'wingame') { setTotalShipTime(0); setTotalSpecTime(0); goBriefing(0); }
  }, [getAudioCtx, goBriefing, goPlaying, goWin]);

  // Keyboard advance (desktop)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && phaseRef.current !== 'playing') { e.preventDefault(); handleAction(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleAction]);

  // ═══════════════ MAIN GAME LOOP ═══════════════
  const gameLoop = useCallback((timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) { frameRef.current = requestAnimationFrame(gameLoop); return; }
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const rawDt = lastTimeRef.current ? (timestamp - lastTimeRef.current)/1000 : 0.016;
    const dt = Math.min(rawDt, 0.05);
    lastTimeRef.current = timestamp;
    const font = F();
    const t = timestamp / 1000;
    const p = phaseRef.current;
    const mobile = isMobileRef.current;

    ctx.fillStyle = '#07000e'; ctx.fillRect(0,0,W,H);

    // ── Helpers ──
    const drawStars = () => {
      for (let i = 0; i < 55; i++) {
        const sx = (Math.sin(i*73.7+t*0.1)*0.5+0.5)*W;
        const sy = (Math.cos(i*41.3+t*0.05)*0.5+0.5)*H*0.7;
        const br = Math.sin(t*1.5+i*0.8)*0.3+0.7;
        ctx.fillStyle = `rgba(200,210,255,${br*0.45})`;
        ctx.fillRect(sx,sy,1.5,1.5);
      }
    };
    const drawCRT = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let y = 0; y < H; y += 3) ctx.fillRect(0,y,W,1);
      const v = ctx.createRadialGradient(W/2,H/2,W*0.25,W/2,H/2,W*0.7);
      v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.45)');
      ctx.fillStyle = v; ctx.fillRect(0,0,W,H);
    };
    const drawBlink = (text, y, color = '#ffff00') => {
      if (Math.floor(t*2.5)%2===0) {
        const s = Math.max(7,Math.min(W/52,12));
        ctx.font = `${s}px ${font}`; ctx.textAlign = 'center';
        ctx.shadowColor = color; ctx.shadowBlur = 8;
        ctx.fillStyle = color; ctx.fillText(text, W/2, y);
        ctx.shadowBlur = 0;
      }
    };

    // ═══ TITLE ═══
    if (p === 'title') {
      drawStars();
      const ng = ctx.createRadialGradient(W*0.35,H*0.35,0,W*0.35,H*0.35,W*0.45);
      ng.addColorStop(0,`rgba(80,0,120,${0.08+Math.sin(t*0.5)*0.04})`); ng.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = ng; ctx.fillRect(0,0,W,H);

      const ts = Math.min(W/14,36);
      ctx.textAlign = 'center';
      ctx.font = `${ts}px ${font}`;
      ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 30;
      ctx.fillStyle = '#ff00aa'; ctx.fillText('RELATIVISTIC', W/2, H*0.16);
      ctx.shadowColor = '#00eeff'; ctx.fillStyle = '#00eeff'; ctx.fillText('RACER', W/2, H*0.16+ts+8);
      ctx.shadowBlur = 0;

      ctx.font = `${Math.max(6,ts/4.5)}px ${font}`; ctx.fillStyle = '#ff6699';
      ctx.fillText('A UNIVERSE WHERE LIGHT SPEED = 100 MPH', W/2, H*0.16+ts*2+16);

      // Story box
      const bx = (W-Math.min(W*0.84,600))/2, bw = Math.min(W*0.84,600), by = H*0.36;
      ctx.fillStyle = 'rgba(10,0,25,0.8)'; ctx.strokeStyle = '#331155'; ctx.lineWidth = 2;
      ctx.fillRect(bx,by,bw,H*0.36); ctx.strokeRect(bx,by,bw,H*0.36);

      const ls = Math.max(6, Math.min(W/64, 9));
      ctx.font = `${ls}px ${font}`; ctx.textAlign = 'center';
      const teaser = [
        {t:'YOUR SISTER MARA IS STRANDED', c:'#cc88ff'},
        {t:'ON A DYING SPACE STATION.', c:'#8888aa'},
        {t:'', c:'#000'},
        {t:'FLY FAST TO REACH HER--BUT THE', c:'#cc88ff'},
        {t:'FASTER YOU GO, THE MORE TIME', c:'#8888aa'},
        {t:'PASSES ON HER END.', c:'#8888aa'},
        {t:'', c:'#000'},
        {t:'ASTEROIDS  -- DODGE THEM', c:'#ff6666'},
        {t:'SPEED GATES -- BOOST YOUR SHIP', c:'#00ff88'},
        {t:'TIME CRYSTALS -- SAVE MARA TIME', c:'#cc88ff'},
        {t:'CHRONOTON STORMS -- COST MARA TIME', c:'#ffaa44'},
      ];
      teaser.forEach((l,i) => { ctx.fillStyle = l.c; ctx.fillText(l.t, W/2, by+16+i*(ls+4.5)); });

      // Device-specific prompt
      const prompt = mobile ? 'TAP ANYWHERE TO BEGIN' : 'PRESS SPACE TO BEGIN';
      drawBlink(prompt, H*0.82);

      // Device-specific control hint
      ctx.font = `${Math.max(5,ls-2)}px ${font}`; ctx.fillStyle = '#333'; ctx.textAlign = 'center';
      const hint = mobile ? 'LANE BUTTONS ON LEFT  |  GAS & BRAKE ON RIGHT' : 'ARROW KEYS: ↑ GAS  ↓ BRAKE  ← → LANES  (ALSO WASD)';
      ctx.fillText(hint, W/2, H*0.90);

      drawCRT();
      frameRef.current = requestAnimationFrame(gameLoop); return;
    }

    // ═══ BRIEFING ═══
    if (p === 'briefing') {
      drawStars();
      const lvl = LEVELS[levelRef.current];
      const br = briefingRef.current;

      const hs = Math.max(9,Math.min(W/32,16));
      ctx.font = `${hs}px ${font}`; ctx.textAlign = 'center';
      ctx.shadowColor = '#00eeff'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#00eeff'; ctx.fillText(`LEG ${lvl.id}: ${lvl.name}`, W/2, H*0.08);
      ctx.shadowBlur = 0;

      ctx.font = `${Math.max(5,hs/2.8)}px ${font}`; ctx.fillStyle = '#556';
      ctx.fillText(`DIST: ${lvl.distance}m  |  MARA'S LIMIT: ${lvl.timeLimit}s`, W/2, H*0.14);

      const bx = (W-Math.min(W*0.85,620))/2, bw = Math.min(W*0.85,620), by = H*0.2, bh = H*0.58;
      ctx.fillStyle = 'rgba(0,6,0,0.85)'; ctx.strokeStyle = '#0a3a0a'; ctx.lineWidth = 2;
      ctx.fillRect(bx,by,bw,bh); ctx.strokeRect(bx,by,bw,bh);

      const ls = Math.max(6,Math.min(W/58,10));
      ctx.font = `${ls}px ${font}`; ctx.textAlign = 'left';
      const lines = lvl.briefing;
      const maxVis = Math.floor(bh/(ls+6))-1;
      const startL = Math.max(0, br.line - maxVis + 1);

      for (let i = startL; i <= Math.min(br.line, lines.length-1); i++) {
        const line = lines[i];
        let txt = (i < br.line) ? line : line.substring(0, Math.min(br.char, line.length));
        if (line.includes('CATCH') || line.includes('PARADOX') || line.includes('EINSTEIN') || line.includes('CONTRACTION') || line.includes('LORENTZ'))
          ctx.fillStyle = '#ffaa44';
        else if (line.startsWith('WATCH') || line.startsWith('COLLECT') || line.startsWith('DENSE') || line.startsWith('SAVE') || line.startsWith('HITTING'))
          ctx.fillStyle = '#ff6688';
        else ctx.fillStyle = '#33ff33';
        const yP = by+16+(i-startL)*(ls+6);
        if (yP < by+bh-8) ctx.fillText(txt, bx+14, yP);
      }
      if (!br.done && br.line < lines.length && Math.floor(t*3)%2===0) {
        const curText = lines[br.line]?.substring(0, br.char) || '';
        const cx = bx+14+ctx.measureText(curText).width;
        const curY = by+16+(br.line-startL)*(ls+6);
        ctx.fillStyle = '#33ff33'; ctx.fillRect(cx+2, curY-ls+2, ls*0.7, ls);
      }

      if (br.done) drawBlink(mobile ? 'TAP TO LAUNCH' : 'PRESS SPACE TO LAUNCH', H*0.88, '#33ff33');
      else drawBlink(mobile ? 'TAP TO SKIP' : 'SPACE TO SKIP', H*0.88, '#335533');

      drawCRT();
      frameRef.current = requestAnimationFrame(gameLoop); return;
    }

    // ═══ LEVEL COMPLETE ═══
    if (p === 'levelcomplete') {
      drawStars();
      const g = gameRef.current; const lvl = LEVELS[levelRef.current];
      const hs = Math.max(9,Math.min(W/28,20));
      ctx.textAlign = 'center'; ctx.font = `${hs}px ${font}`;
      ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#00ff88'; ctx.fillText('LEG COMPLETE', W/2, H*0.1);
      ctx.shadowBlur = 0;

      const ss = Math.max(6,hs/2.8);
      ctx.font = `${ss}px ${font}`;
      [
        ['YOUR TIME', `${g.shipClock.toFixed(1)}s`],
        ["MARA'S TIME", `${g.specClock.toFixed(1)}s`],
        ['DILATION RATIO', `${(g.specClock/Math.max(g.shipClock,0.1)).toFixed(2)}x`],
        ['TOP SPEED', `${g.topSpeed.toFixed(1)} mph`],
        ['PEAK GAMMA', `${g.peakGamma.toFixed(2)}`],
        ['CRYSTALS', `${g.crystals}`],
        ['MAX CONTRACTION', `${((1-1/Math.max(g.peakGamma,1))*100).toFixed(1)}%`],
      ].forEach(([l,v],i) => {
        const y = H*0.2+i*(ss+9);
        ctx.fillStyle = '#667'; ctx.textAlign = 'right'; ctx.fillText(l, W/2-10, y);
        ctx.fillStyle = '#ffcc00'; ctx.textAlign = 'left'; ctx.fillText(v, W/2+10, y);
      });

      if (lvl.storyAfter) {
        ctx.textAlign = 'center'; ctx.font = `${Math.max(6,ss*0.9)}px ${font}`; ctx.fillStyle = '#aa88ff';
        lvl.storyAfter.split('\n').forEach((l,i) => ctx.fillText(l, W/2, H*0.7+i*(ss+5)));
      }
      drawBlink(mobile ? 'TAP TO CONTINUE' : 'PRESS SPACE TO CONTINUE', H*0.88);
      drawCRT();
      frameRef.current = requestAnimationFrame(gameLoop); return;
    }

    // ═══ GAME OVER ═══
    if (p === 'gameover') {
      drawStars();
      const g = gameRef.current;
      const hs = Math.max(9,Math.min(W/24,24));
      ctx.textAlign = 'center'; ctx.font = `${hs}px ${font}`;
      ctx.shadowColor = '#ff0044'; ctx.shadowBlur = 25;
      ctx.fillStyle = '#ff0044'; ctx.fillText('SIGNAL LOST', W/2, H*0.12);
      ctx.shadowBlur = 0;
      const ss = Math.max(6,hs/3.2);
      ctx.font = `${ss}px ${font}`;
      [
        {t:"MARA'S CLOCK RAN OUT.", c:'#cc6688'},
        {t:"", c:'#000'},
        {t:"TIME DILATION PUSHED HER CLOCK", c:'#887799'},
        {t:"PAST THE RESCUE WINDOW WHILE", c:'#887799'},
        {t:"YOUR OWN CLOCK BARELY MOVED.", c:'#887799'},
        {t:"", c:'#000'},
        {t:`YOUR TIME: ${g.shipClock.toFixed(1)}s`, c:'#fff'},
        {t:`HER TIME:  ${g.specClock.toFixed(1)}s`, c:'#fff'},
        {t:`DILATION:  ${(g.specClock/Math.max(g.shipClock,0.1)).toFixed(2)}x`, c:'#fff'},
        {t:"", c:'#000'},
        {t:"THE LESSON: SPEED HAS A COST.", c:'#ffaa44'},
        {t:"THE FASTER YOU MOVE THROUGH SPACE", c:'#ffaa44'},
        {t:"THE SLOWER YOU MOVE THROUGH TIME", c:'#ffaa44'},
        {t:"RELATIVE TO THOSE LEFT BEHIND.", c:'#ffaa44'},
      ].forEach((l,i) => { ctx.fillStyle = l.c; ctx.fillText(l.t, W/2, H*0.22+i*(ss+5)); });
      drawBlink(mobile ? 'TAP TO RETRY' : 'PRESS SPACE TO RETRY', H*0.92);
      drawCRT();
      frameRef.current = requestAnimationFrame(gameLoop); return;
    }

    // ═══ WIN GAME ═══
    if (p === 'wingame') {
      drawStars();
      const hs = Math.max(9,Math.min(W/22,26));
      ctx.textAlign = 'center'; ctx.font = `${hs}px ${font}`;
      ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 30;
      ctx.fillStyle = '#00ffcc'; ctx.fillText('MARA IS SAFE', W/2, H*0.1);
      ctx.shadowBlur = 0;
      const ss = Math.max(6,hs/3.2);
      ctx.font = `${ss}px ${font}`;
      [
        {t:"YOU REACHED KEPLER STATION.", c:'#99bbaa'},
        {t:"THE RESCUE WAS A SUCCESS.", c:'#99bbaa'},
        {t:"", c:'#000'},
        {t:"BUT WHEN YOU STEP OFF YOUR SHIP,", c:'#99bbaa'},
        {t:"MARA LOOKS... OLDER THAN YOU", c:'#aaccbb'},
        {t:"REMEMBER. NOT BY MUCH. BUT ENOUGH.", c:'#aaccbb'},
        {t:"", c:'#000'},
        {t:"THAT'S THE TWIN PARADOX.", c:'#ffcc44'},
        {t:"YOU BOTH STARTED THE SAME AGE.", c:'#ffcc44'},
        {t:"NOW SHE'S LIVED MORE THAN YOU.", c:'#ffcc44'},
        {t:"", c:'#000'},
        {t:`TOTAL YOUR TIME:  ${totalShipTime.toFixed(1)}s`, c:'#fff'},
        {t:`TOTAL HER TIME:   ${totalSpecTime.toFixed(1)}s`, c:'#fff'},
        {t:`SHE AGED ${(totalSpecTime-totalShipTime).toFixed(1)}s MORE THAN YOU`, c:'#ff88aa'},
      ].forEach((l,i) => { ctx.fillStyle = l.c; ctx.fillText(l.t, W/2, H*0.2+i*(ss+5)); });
      drawBlink(mobile ? 'TAP TO PLAY AGAIN' : 'PRESS SPACE TO PLAY AGAIN', H*0.92);
      drawCRT();
      frameRef.current = requestAnimationFrame(gameLoop); return;
    }

    // ═══════════════════════════════════════
    // ═══ PLAYING ═════════════════════════
    // ═══════════════════════════════════════
    const g = gameRef.current;
    if (!g) { frameRef.current = requestAnimationFrame(gameLoop); return; }
    const lvl = g.lvl;

    // ── Input: Desktop reads keys, Mobile reads touch. No overlap. ──
    const k = keysRef.current;
    const tc = touchRef.current;
    let gasOn, brakeOn, leftOn, rightOn;
    if (mobile) {
      // Mobile: touch controls ONLY
      gasOn = tc.gas;
      brakeOn = tc.brake;
      leftOn = tc.left;
      rightOn = tc.right;
    } else {
      // Desktop: keyboard ONLY (arrows or WASD)
      gasOn = k['ArrowUp'] || k['w'] || k['W'];
      brakeOn = k['ArrowDown'] || k['s'] || k['S'];
      leftOn = k['ArrowLeft'] || k['a'] || k['A'];
      rightOn = k['ArrowRight'] || k['d'] || k['D'];
    }

    // Speed
    if (gasOn) { const f = 1-(g.speed/C)**2; g.speed += 42*f*f*dt; }
    else if (brakeOn) g.speed -= 50*dt;
    else g.speed -= 12*dt;
    g.speed = Math.max(0, Math.min(g.speed, C*0.9999));

    g.gam = gammaFn(g.speed);
    g.topSpeed = Math.max(g.topSpeed, g.speed);
    g.peakGamma = Math.max(g.peakGamma, g.gam);

    // Lanes
    if (leftOn && g.lane > 0 && Math.abs(g.laneX-g.lane) < 0.15) g.lane--;
    if (rightOn && g.lane < LANE_COUNT-1 && Math.abs(g.laneX-g.lane) < 0.15) g.lane++;
    g.laneX += (g.lane-g.laneX)*Math.min(1, dt*12);

    // Distance & Time
    g.dist += g.speed*dt*2.5;
    g.shipClock += dt;
    g.specClock += dt*g.gam;

    g.warpI += ((g.speed/C)-g.warpI)*dt*3;
    g.flashA = Math.max(0, g.flashA-dt*4);

    // Win check — use screen-space so finish triggers when you visually cross
    const winPLeft = lvl.distance - g.dist;
    if (winPLeft > 0 && winPLeft < 1400 && !g.finished) {
      const winApp = winPLeft / g.gam;
      const winFT = 1 - winApp / 1400;
      if (winFT > 0) {
        const winPT = winFT * winFT;
        const finishY = H * 0.36 + (H * 0.96 - H * 0.36) * winPT;
        if (finishY >= H * 0.75) { g.finished = true; goLevelComplete(); }
      }
    }
    if (g.dist >= lvl.distance && !g.finished) { g.finished = true; goLevelComplete(); }
    if (g.specClock >= lvl.timeLimit && !g.finished) { g.finished = true; goGameOver(); }
    if (g.specClock > lvl.timeLimit*0.75) g.warnFlash += dt*4;

    if (g.shakeDur > 0) { g.shakeDur -= dt; g.shakeX = (Math.random()-0.5)*10; g.shakeY = (Math.random()-0.5)*10; }
    else { g.shakeX = 0; g.shakeY = 0; }
    if (g.hitCD > 0) g.hitCD -= dt;

    // Spawn
    g.obsTimer += dt;
    const spInt = lvl.obstacleRate / (1+g.speed/C*0.5);
    if (g.obsTimer > spInt) {
      g.obsTimer = 0;
      const lane = Math.floor(Math.random()*LANE_COUNT);
      const roll = Math.random();
      let type;
      if (roll < lvl.crystalChance) type = 'crystal';
      else if (roll < lvl.crystalChance+lvl.boostChance) type = 'boost';
      else if (roll < lvl.crystalChance+lvl.boostChance+lvl.chronotonChance) type = 'chronoton';
      else type = 'asteroid';
      g.obstacles.push({ lane, dist: g.dist+900+Math.random()*300, type, got: false });
    }

    // Collisions — use screen-space Y so hits match visuals at any gamma
    const colHY = H * 0.36, colRB = H * 0.96, colShipY = H * 0.77;
    g.obstacles = g.obstacles.filter(obs => {
      const rel = obs.dist - g.dist;
      const app = rel / g.gam; // contracted (apparent) distance
      if (app < -80 || rel < -200) return false; // cleanup passed obstacles
      if (app < 0 || app > 1100) return true; // off-screen, skip collision
      const oT = (1 - app / 1100) ** 2;
      const obsY = colHY + (colRB - colHY) * oT; // obstacle screen Y
      if (Math.abs(obsY - colShipY) < 22 && Math.abs(obs.lane - g.laneX) < 0.55 && !obs.got && g.hitCD <= 0) {
        obs.got = true;
        if (obs.type === 'asteroid') {
          g.speed *= 0.35; g.specClock += 3; g.shakeDur = 0.5; g.hitCD = 0.8;
          g.flashA = 0.4; g.flashC = '#ff2200'; g.hits++;
          playSfx('hit');
          g.popups.push({text:'HULL HIT  -SPEED  +3s MARA', x:W/2, y:H*0.48, life:1.8, color:'#ff4444'});
        } else if (obs.type === 'boost') {
          g.speed = Math.min(g.speed+15, C*0.98);
          g.flashA = 0.25; g.flashC = '#00ffaa'; g.boosts++;
          playSfx('boost');
          g.popups.push({text:'SPEED GATE  +15 MPH', x:W/2, y:H*0.48, life:1.2, color:'#00ffaa'});
        } else if (obs.type === 'crystal') {
          g.specClock = Math.max(0, g.specClock-4);
          g.flashA = 0.25; g.flashC = '#cc88ff'; g.crystals++;
          playSfx('crystal');
          g.popups.push({text:"TIME CRYSTAL  -4s MARA", x:W/2, y:H*0.48, life:1.5, color:'#cc88ff'});
        } else if (obs.type === 'chronoton') {
          g.specClock += 6; g.speed *= 0.7; g.shakeDur = 0.4; g.hitCD = 0.5;
          g.flashA = 0.3; g.flashC = '#ffaa00';
          playSfx('chronoton');
          g.popups.push({text:"CHRONOTON  +6s MARA", x:W/2, y:H*0.48, life:1.5, color:'#ffaa00'});
        }
      }
      return true;
    });

    // Particles
    if (g.speed > C*0.35) {
      const sx = W/2+(g.laneX-1)*(W*0.15);
      g.particles.push({ x:sx+(Math.random()-0.5)*14, y:H*0.76, vx:(Math.random()-0.5)*70, vy:50+Math.random()*70, life:0.35, max:0.35 });
    }
    g.particles = g.particles.filter(pp => { pp.x+=pp.vx*dt; pp.y+=pp.vy*dt; pp.life-=dt; return pp.life>0; });
    g.popups = g.popups.filter(pp => { pp.y-=dt*25; pp.life-=dt; return pp.life>0; });
    g.roadOff = (g.roadOff+g.speed*dt*6)%40;

    // ══════════ RENDER ══════════
    ctx.save();
    ctx.translate(g.shakeX, g.shakeY);
    const sr = g.warpI;

    // Sky
    const skyG = ctx.createLinearGradient(0,0,0,H*0.5);
    skyG.addColorStop(0, `rgb(${7+Math.floor(sr*15)},${Math.floor(sr*20)},${14+Math.floor(sr*60)})`);
    skyG.addColorStop(1, `rgb(${15+Math.floor(sr*10)},${5+Math.floor(sr*15)},${30+Math.floor(sr*50)})`);
    ctx.fillStyle = skyG; ctx.fillRect(0,0,W,H);

    // Stars w/ aberration
    g.stars.forEach(s => {
      const ab = 1+sr*0.7;
      const sx = (s.x-0.5)*W/ab+W/2;
      const sy = s.y*H*0.45/ab;
      const sl = sr*18*s.z;
      if (sl > 1.5) {
        ctx.strokeStyle = `hsla(${200+sr*60},80%,80%,${s.br*0.4})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx,sy+sl); ctx.stroke();
      }
      ctx.fillStyle = `rgba(200,210,255,${s.br*0.6})`; ctx.fillRect(sx,sy,1.5,1.5);
    });

    // Warp tunnel
    if (sr > 0.65) {
      const ta = (sr-0.65)/0.35*0.2;
      const tG = ctx.createRadialGradient(W/2,H*0.38,10,W/2,H*0.38,W*0.55);
      tG.addColorStop(0,'rgba(0,0,0,0)'); tG.addColorStop(0.6,`rgba(60,0,120,${ta})`); tG.addColorStop(1,`rgba(0,200,255,${ta*0.5})`);
      ctx.fillStyle = tG; ctx.fillRect(0,0,W,H);
    }

    // Road
    const hY = H*0.36, rB = H*0.96;
    const rTW = Math.max(20, 80/g.gam), rBW = W*0.52;

    const rG = ctx.createLinearGradient(0,hY,0,rB);
    rG.addColorStop(0,'#12122a'); rG.addColorStop(1,'#1e1e38');
    ctx.fillStyle = rG;
    ctx.beginPath(); ctx.moveTo(W/2-rTW/2,hY); ctx.lineTo(W/2+rTW/2,hY); ctx.lineTo(W/2+rBW/2,rB); ctx.lineTo(W/2-rBW/2,rB); ctx.closePath(); ctx.fill();

    const ec = sr>0.85 ? `hsl(${(t*120)%360},100%,60%)` : '#ff00cc';
    ctx.shadowColor = ec; ctx.shadowBlur = sr>0.6?10:5;
    ctx.strokeStyle = ec; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W/2-rTW/2,hY); ctx.lineTo(W/2-rBW/2,rB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2+rTW/2,hY); ctx.lineTo(W/2+rBW/2,rB); ctx.stroke();
    ctx.shadowBlur = 0;

    // Lane dashes
    for (let m = 0; m < 22; m++) {
      const raw = (m*40-g.roadOff)/880;
      if (raw < 0||raw > 1) continue;
      const pT = raw*raw;
      const y = hY+(rB-hY)*pT;
      const rW = rTW+(rBW-rTW)*pT;
      for (let l = 1; l < LANE_COUNT; l++) {
        const lx = W/2-rW/2+(rW/LANE_COUNT)*l;
        ctx.fillStyle = `rgba(255,255,100,${pT*0.4})`;
        ctx.fillRect(lx-Math.max(1,2*pT), y, Math.max(1,3*pT), Math.max(1,5*pT));
      }
    }

    // Finish
    const pLeft = lvl.distance-g.dist;
    if (pLeft > 0 && pLeft < 1400) {
      const appD = pLeft/g.gam;
      const fT = 1-appD/1400;
      if (fT > 0 && fT < 1) {
        const pT = fT*fT;
        const fy = hY+(rB-hY)*pT;
        const rW = rTW+(rBW-rTW)*pT;
        const fH = Math.max(2,16*pT);
        const sq = 8, sqW = rW/sq;
        for (let s = 0; s < sq; s++) {
          ctx.fillStyle = s%2===0?'#fff':'#000'; ctx.fillRect(W/2-rW/2+s*sqW,fy-fH,sqW+0.5,fH/2);
          ctx.fillStyle = s%2===0?'#000':'#fff'; ctx.fillRect(W/2-rW/2+s*sqW,fy-fH/2,sqW+0.5,fH/2);
        }
        if (pT > 0.06) {
          ctx.font = `${Math.max(5,Math.floor(11*pT))}px ${font}`; ctx.fillStyle = '#ffff00';
          ctx.textAlign = 'center'; ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 5;
          ctx.fillText('KEPLER STATION', W/2, fy-fH-4); ctx.shadowBlur = 0;
        }
      }
    }

    // Obstacles
    g.obstacles.forEach(obs => {
      const rel = obs.dist-g.dist;
      const app = rel/g.gam;
      if (app < 0||app > 1100) return;
      const oT = (1-app/1100)**2;
      const oy = hY+(rB-hY)*oT;
      const rW = rTW+(rBW-rTW)*oT;
      const lW = rW/LANE_COUNT;
      const ox = W/2-rW/2+lW*obs.lane+lW/2;
      const sz = Math.max(3,22*oT);
      if (obs.got) ctx.globalAlpha = 0.12;

      if (obs.type === 'asteroid') {
        ctx.fillStyle = '#884444';
        ctx.beginPath();
        ctx.moveTo(ox,oy-sz); ctx.lineTo(ox+sz*0.6,oy-sz*0.3); ctx.lineTo(ox+sz*0.5,oy+sz*0.2);
        ctx.lineTo(ox-sz*0.4,oy+sz*0.3); ctx.lineTo(ox-sz*0.6,oy-sz*0.2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#bb6666'; ctx.fillRect(ox-sz*0.2,oy-sz*0.6,sz*0.3,sz*0.25);
      } else if (obs.type === 'boost') {
        ctx.fillStyle = '#00ff88'; ctx.shadowColor = '#00ff88'; ctx.shadowBlur = sz*0.3;
        ctx.fillRect(ox-sz*0.8,oy-sz,Math.max(2,3*oT),sz);
        ctx.fillRect(ox+sz*0.6,oy-sz,Math.max(2,3*oT),sz);
        ctx.fillStyle = `rgba(0,255,136,${0.3+Math.sin(t*8)*0.15})`;
        ctx.fillRect(ox-sz*0.7,oy-sz*0.7,sz*1.4,Math.max(1,2*oT));
        ctx.shadowBlur = 0;
      } else if (obs.type === 'crystal') {
        const cw = sz*0.5*Math.abs(Math.cos(t*3));
        ctx.fillStyle = '#cc88ff'; ctx.shadowColor = '#cc88ff'; ctx.shadowBlur = sz*0.4;
        ctx.beginPath(); ctx.moveTo(ox,oy-sz*0.8); ctx.lineTo(ox+cw,oy-sz*0.3); ctx.lineTo(ox,oy+sz*0.2); ctx.lineTo(ox-cw,oy-sz*0.3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#eeccff';
        ctx.beginPath(); ctx.moveTo(ox,oy-sz*0.65); ctx.lineTo(ox+cw*0.35,oy-sz*0.3); ctx.lineTo(ox,oy); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'chronoton') {
        ctx.fillStyle = `rgba(255,170,0,${0.25+Math.sin(t*5)*0.12})`;
        ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = sz*0.4;
        ctx.beginPath(); ctx.arc(ox,oy-sz*0.4,sz*0.65,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#ffdd44'; ctx.lineWidth = Math.max(1,1.5*oT);
        ctx.beginPath(); ctx.arc(ox,oy-sz*0.4,sz*0.35,0,Math.PI*2); ctx.stroke();
        const ha = t*4;
        ctx.beginPath(); ctx.moveTo(ox,oy-sz*0.4); ctx.lineTo(ox+Math.cos(ha)*sz*0.22,oy-sz*0.4+Math.sin(ha)*sz*0.22); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    });

    // Ship
    const shipX = W/2+(g.laneX-1)*(rBW/LANE_COUNT);
    const shipY = H*0.77;
    const sW = 30, sH = 42;
    const shipFlash = g.hitCD > 0 && Math.floor(t*1000/70)%2;
    if (!shipFlash) {
      ctx.fillStyle = '#00bbee';
      ctx.beginPath(); ctx.moveTo(shipX,shipY-sH/2); ctx.lineTo(shipX+sW/2,shipY+sH/3); ctx.lineTo(shipX+sW/4,shipY+sH/2); ctx.lineTo(shipX-sW/4,shipY+sH/2); ctx.lineTo(shipX-sW/2,shipY+sH/3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#004466';
      ctx.beginPath(); ctx.moveTo(shipX,shipY-sH/2+5); ctx.lineTo(shipX+sW/5,shipY-sH/8); ctx.lineTo(shipX-sW/5,shipY-sH/8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0099cc';
      ctx.fillRect(shipX-sW*0.82,shipY+sH*0.05,sW*0.36,sH*0.22);
      ctx.fillRect(shipX+sW*0.46,shipY+sH*0.05,sW*0.36,sH*0.22);
      const gI = Math.min(g.speed/C,1);
      ctx.fillStyle = `rgba(255,${Math.floor(180-gI*150)},0,${0.5+gI*0.5})`;
      ctx.fillRect(shipX-sW/4,shipY+sH/2,sW/2,3+gI*12);
      if (gasOn) { ctx.fillStyle = '#ffff00'; ctx.fillRect(shipX-2.5,shipY+sH/2+3,5,3+Math.random()*gI*8); }
    }

    // Particles
    g.particles.forEach(pp => {
      ctx.fillStyle = `rgba(0,170,255,${(pp.life/pp.max)*0.5})`; ctx.fillRect(pp.x,pp.y,2,2);
    });

    // Popups
    g.popups.forEach(pp => {
      ctx.font = `${Math.max(6,8)}px ${font}`; ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1,pp.life*1.5); ctx.fillStyle = pp.color;
      ctx.fillText(pp.text, pp.x, pp.y);
    });
    ctx.globalAlpha = 1;

    // Flash
    if (g.flashA > 0) { ctx.globalAlpha = g.flashA*0.25; ctx.fillStyle = g.flashC; ctx.fillRect(0,0,W,H); ctx.globalAlpha = 1; }

    // Compression vignette
    if (sr > 0.3) {
      const ca = (sr-0.3)*0.25;
      ctx.fillStyle = `rgba(80,0,200,${ca})`;
      ctx.fillRect(0,0,W*ca*0.3,H); ctx.fillRect(W*(1-ca*0.3),0,W*ca*0.3,H);
    }

    // Warning
    if (g.specClock > lvl.timeLimit*0.75) {
      ctx.fillStyle = `rgba(255,0,0,${Math.sin(g.warnFlash*3)*0.05+0.025})`; ctx.fillRect(0,0,W,H);
    }

    // ═══ HUD ═══
    const hs = Math.max(6,Math.min(W/62,10));

    // Left panel
    ctx.fillStyle = 'rgba(5,2,15,0.75)'; ctx.fillRect(6,6,210,162);
    ctx.strokeStyle = '#222244'; ctx.lineWidth = 1; ctx.strokeRect(6,6,210,162);
    ctx.textAlign = 'left'; ctx.font = `${hs}px ${font}`;

    ctx.fillStyle = '#00ffcc'; ctx.fillText('SPEED', 14, 22);
    ctx.fillStyle = g.speed>C*0.9?'#ff3333':'#fff';
    ctx.font = `${hs+1}px ${font}`; ctx.fillText(`${g.speed.toFixed(1)} mph`, 14, 36);

    ctx.fillStyle = '#111'; ctx.fillRect(14,42,185,7);
    ctx.fillStyle = sr>0.9?'#ff0044':sr>0.7?'#ffaa00':'#00ff88';
    ctx.fillRect(14,42,185*sr,7);

    ctx.font = `${hs}px ${font}`; ctx.fillStyle = '#ff88ff';
    ctx.fillText(`\u03B3 = ${g.gam.toFixed(3)}`, 14, 62);

    ctx.fillStyle = '#00bbff'; ctx.fillText('YOUR CLOCK', 14, 78);
    ctx.fillStyle = '#fff'; ctx.fillText(`${g.shipClock.toFixed(1)}s`, 14, 91);

    ctx.fillStyle = '#ffaa44'; ctx.fillText("MARA'S CLOCK", 14, 106);
    ctx.fillStyle = (g.specClock>lvl.timeLimit*0.75 && Math.floor(t*4)%2) ? '#ff0000' : '#fff';
    ctx.fillText(`${g.specClock.toFixed(1)} / ${lvl.timeLimit}s`, 14, 119);

    ctx.fillStyle = '#111'; ctx.fillRect(14,125,185,5);
    const mR = Math.min(g.specClock/lvl.timeLimit,1);
    ctx.fillStyle = mR>0.9?'#ff0044':mR>0.75?'#ffaa00':'#00ff88';
    ctx.fillRect(14,125,185*mR,5);

    ctx.font = `${Math.max(5,hs-2)}px ${font}`; ctx.fillStyle = '#555';
    ctx.fillText(`1s yours = ${g.gam.toFixed(2)}s hers`, 14, 146);
    ctx.fillStyle = '#444'; ctx.fillText(`crystals: ${g.crystals}`, 14, 160);

    // Right panel
    ctx.fillStyle = 'rgba(5,2,15,0.75)'; ctx.fillRect(W-218,6,212,112);
    ctx.strokeStyle = '#222244'; ctx.strokeRect(W-218,6,212,112);
    const rx = W-210;
    ctx.font = `${hs}px ${font}`; ctx.textAlign = 'left';

    ctx.fillStyle = '#88ff88'; ctx.fillText('REAL DIST LEFT', rx, 22);
    ctx.fillStyle = '#fff'; ctx.fillText(`${Math.max(0,pLeft).toFixed(0)} m`, rx, 35);

    ctx.fillStyle = '#ff88ff'; ctx.fillText('YOU SEE (CONTRACTED)', rx, 50);
    const contracted = Math.max(0,pLeft/g.gam);
    ctx.fillStyle = '#fff'; ctx.fillText(`${contracted.toFixed(0)} m`, rx, 63);

    const maxB = 175;
    ctx.fillStyle = '#88ff88'; ctx.fillRect(rx,70,Math.min(1,Math.max(0,pLeft)/lvl.distance)*maxB,4);
    ctx.fillStyle = '#ff88ff'; ctx.fillRect(rx,78,Math.min(1,contracted/lvl.distance)*maxB,4);
    ctx.font = `${Math.max(4,hs-3)}px ${font}`; ctx.fillStyle = '#444';
    ctx.fillText('REAL',rx+maxB+3,74); ctx.fillText('SEEN',rx+maxB+3,82);

    const prog = Math.min(g.dist/lvl.distance,1);
    ctx.fillStyle = '#111'; ctx.fillRect(rx,90,maxB,6);
    ctx.fillStyle = '#00ffcc'; ctx.fillRect(rx,90,maxB*prog,6);
    ctx.font = `${hs}px ${font}`; ctx.fillStyle = '#00ffcc';
    ctx.fillText(`${(prog*100).toFixed(0)}%`, rx+maxB+5, 97);

    // Level label
    ctx.font = `${Math.max(5,hs-1)}px ${font}`; ctx.textAlign = 'center';
    ctx.fillStyle = '#333355'; ctx.fillText(`LEG ${lvl.id}: ${lvl.name}`, W/2, 16);

    // Desktop: subtle control reminder (first few seconds)
    if (!mobile && g.shipClock < 5) {
      const remAlpha = Math.max(0, 1 - g.shipClock / 5);
      ctx.globalAlpha = remAlpha * 0.6;
      ctx.font = `${Math.max(5,7)}px ${font}`; ctx.textAlign = 'center';
      ctx.fillStyle = '#555';
      ctx.fillText('↑ GAS   ↓ BRAKE   ← → LANES', W/2, H - 12);
      ctx.globalAlpha = 1;
    }

    drawCRT();
    ctx.restore();
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [gammaFn, playSfx, goLevelComplete, goGameOver, F, stopMusic, totalShipTime, totalSpecTime, isMobile]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); stopMusic(); };
  }, [gameLoop, stopMusic]);

  // ═══════════════ TOUCH HANDLERS (Mobile only) ═══════════════
  const tS = useCallback((action) => (e) => {
    e.preventDefault();
    if (phaseRef.current !== 'playing') { handleAction(); return; }
    touchRef.current[action] = true;
  }, [handleAction]);

  const tE = useCallback((action) => (e) => {
    e.preventDefault();
    touchRef.current[action] = false;
  }, []);

  // ═══════════════ RENDER ═══════════════
  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    userSelect: 'none', touchAction: 'none', WebkitTouchCallout: 'none',
    fontFamily: "'Press Start 2P', monospace", fontWeight: 'bold',
  };

  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: '#07000e',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div onClick={() => navigate("/")} style={{position:"absolute",top:12,left:16,color:"#4a4a6a",fontSize:12,cursor:"pointer",zIndex:10,padding:"6px 12px",borderRadius:6,background:"#0a0c2080",border:"1px solid #1a1a3a",fontFamily:"'Courier New', monospace",letterSpacing:2}}>← ARCADE</div>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', maxWidth: '100%', imageRendering: 'pixelated', cursor: isMobile ? 'default' : 'none' }}
        onClick={() => { if (phaseRef.current !== 'playing') handleAction(); }}
      />

      {/* ═══ MOBILE TOUCH CONTROLS (hidden on desktop) ═══ */}
      {isMobile && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', maxWidth: 960, padding: '6px 12px', boxSizing: 'border-box',
          background: 'rgba(5,2,15,0.9)', borderTop: '1px solid #1a1a2e',
        }}>
          {/* LEFT SIDE: Lane change buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div
              onTouchStart={tS('left')} onTouchEnd={tE('left')}
              style={{
                ...btnBase, width: 72, height: 72, borderRadius: 14,
                background: 'rgba(255,136,255,0.08)', border: '2px solid rgba(255,136,255,0.3)',
                color: '#ff88ff', fontSize: 28,
              }}
            >◄</div>
            <div
              onTouchStart={tS('right')} onTouchEnd={tE('right')}
              style={{
                ...btnBase, width: 72, height: 72, borderRadius: 14,
                background: 'rgba(255,136,255,0.08)', border: '2px solid rgba(255,136,255,0.3)',
                color: '#ff88ff', fontSize: 28,
              }}
            >►</div>
          </div>

          {/* CENTER: Label */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: '#333', fontSize: 7, fontFamily: "'Press Start 2P', monospace",
            textAlign: 'center',
          }}>
            <span style={{ color: '#ff88ff44' }}>LANES</span>
            <span style={{ color: '#222' }}>c = {C} mph</span>
            <span style={{ color: '#00ff8844' }}>THRUST</span>
          </div>

          {/* RIGHT SIDE: Gas + Brake */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            <div
              onTouchStart={tS('gas')} onTouchEnd={tE('gas')}
              style={{
                ...btnBase, width: 84, height: 84, borderRadius: '50%',
                background: 'rgba(0,255,136,0.06)', border: '3px solid rgba(0,255,136,0.35)',
                color: '#00ff88', fontSize: 10,
              }}
            >GAS</div>
            <div
              onTouchStart={tS('brake')} onTouchEnd={tE('brake')}
              style={{
                ...btnBase, width: 72, height: 38, borderRadius: 10,
                background: 'rgba(255,68,68,0.06)', border: '2px solid rgba(255,68,68,0.3)',
                color: '#ff4444', fontSize: 8,
              }}
            >BRAKE</div>
          </div>
        </div>
      )}
    </div>
  );
}
