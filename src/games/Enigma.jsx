import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ---------- Enigma core ----------
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ROTORS = {
  I:   { wiring: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", notch: "Q" },
  II:  { wiring: "AJDKSIRUXBLHWTMCQGZNPYFVOE", notch: "E" },
  III: { wiring: "BDFHJLCPRTXVZNYEIWGAKMUSQO", notch: "V" },
};
const REFLECTOR_B = "YRUHQSLDPXNGOKMIEBFZCWVJAT";
const idx = (c) => c.charCodeAt(0) - 65;
const chr = (i) => ALPHABET[((i % 26) + 26) % 26];

function parsePlugboard(str) {
  const map = {};
  const accepted = [];
  const rejected = [];
  const lonely = [];
  const groups = (str || "").toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  for (const g of groups) {
    let i = 0;
    while (i + 1 < g.length) {
      const pair = g[i] + g[i + 1];
      i += 2;
      if (accepted.length >= 13) { rejected.push(pair); continue; }
      if (pair[0] === pair[1]) { rejected.push(pair); continue; }
      if (map[pair[0]] || map[pair[1]]) { rejected.push(pair); continue; }
      map[pair[0]] = pair[1];
      map[pair[1]] = pair[0];
      accepted.push(pair);
    }
    if (i < g.length) lonely.push(g[i]);
  }
  return { map, accepted, rejected, lonely };
}

function stepMachine(pos) {
  const rNotch = pos.R === idx(ROTORS.III.notch);
  const mNotch = pos.M === idx(ROTORS.II.notch);
  const next = { ...pos };
  if (mNotch) {
    next.M = (next.M + 1) % 26;
    next.L = (next.L + 1) % 26;
  } else if (rNotch) {
    next.M = (next.M + 1) % 26;
  }
  next.R = (next.R + 1) % 26;
  return next;
}

function fwdRotor(c, rotor, pos) {
  const i = (idx(c) + pos + 26) % 26;
  return chr(idx(rotor.wiring[i]) - pos);
}
function revRotor(c, rotor, pos) {
  const i = (idx(c) + pos + 26) % 26;
  return chr(rotor.wiring.indexOf(ALPHABET[i]) - pos);
}

function encryptLetter(c, posIn, plugMap) {
  const pos = stepMachine(posIn);
  const path = [c];
  const plug = (x) => plugMap[x] || x;
  let x = plug(c); path.push(x);
  x = fwdRotor(x, ROTORS.III, pos.R); path.push(x);
  x = fwdRotor(x, ROTORS.II,  pos.M); path.push(x);
  x = fwdRotor(x, ROTORS.I,   pos.L); path.push(x);
  x = REFLECTOR_B[idx(x)]; path.push(x);
  x = revRotor(x, ROTORS.I,   pos.L); path.push(x);
  x = revRotor(x, ROTORS.II,  pos.M); path.push(x);
  x = revRotor(x, ROTORS.III, pos.R); path.push(x);
  x = plug(x); path.push(x);
  return { output: x, path, pos };
}

function encryptStringPure(str, positions, plugStr) {
  const plugMap = parsePlugboard(plugStr).map;
  let pos = { L: positions[0], M: positions[1], R: positions[2] };
  let out = "";
  for (const c of str.toUpperCase()) {
    if (/[A-Z]/.test(c)) {
      const r = encryptLetter(c, pos, plugMap);
      pos = r.pos;
      out += r.output;
    }
  }
  return out;
}

const CHALLENGES = [
  { icon: "🏴‍☠️", name: "The Pirate's Map", hint: "Where did Captain Redbeard hide it?",
    positions: [0, 0, 0], plugboard: "", plaintext: "THEGOLDISBURIEDUNDERTHEBIGOAKTREE" },
  { icon: "🚀", name: "Mission Control", hint: "An astronaut's secret announcement",
    positions: [5, 14, 23], plugboard: "AB CD", plaintext: "WEFOUNDLIFEONMARS" },
  { icon: "🎂", name: "Surprise Party", hint: "Don't let the birthday kid see this!",
    positions: [2, 0, 19], plugboard: "HE LP", plaintext: "MEETATFIVEINTHEPARK" },
];

function groupFive(s) { return s.replace(/(.{5})/g, "$1 ").trim(); }

// ---------- styling helpers ----------
const C = {
  paper: "#f1e3c4", paperLight: "#fffbe8", ink: "#1d1a14",
  brass: "#c08a3e", brassDeep: "#8a5d1f", brassLight: "#e6b566",
  crimson: "#a1331f", bg1: "#0e1a1c", bg2: "#1a2a2c",
  glow: "#ffc94a", glowHot: "#ffe48a",
};
const FONT_DISPLAY = "'Rye', 'Georgia', serif";
const FONT_BODY = "'Special Elite', 'Courier New', monospace";
const FONT_MONO = "'Major Mono Display', 'Courier New', monospace";

const STAGE_LABELS = [
  "KEY", "PLUG", "R3", "R2", "R1", "MIRROR", "R1", "R2", "R3", "PLUG", "LIGHT",
];

export default function Enigma() {
  const navigate = useNavigate();

  // load fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Rye&family=Special+Elite&family=Major+Mono+Display&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const [mode, setMode] = useState("encode"); // encode | decode
  const [pos, setPos] = useState({ L: 0, M: 0, R: 0 });
  const [startPos, setStartPos] = useState(null);
  const [plugRaw, setPlugRaw] = useState("");
  const plugResult = useMemo(() => parsePlugboard(plugRaw), [plugRaw]);
  const [inText, setInText] = useState("");
  const [outText, setOutText] = useState("");
  const [path, setPath] = useState(Array(11).fill("·"));
  const [lit, setLit] = useState(null);
  const [lastInput, setLastInput] = useState(null);

  // decode-specific
  const [decL, setDecL] = useState("A");
  const [decM, setDecM] = useState("A");
  const [decR, setDecR] = useState("A");
  const [decPlug, setDecPlug] = useState("");
  const [decCipher, setDecCipher] = useState("");
  const [decOut, setDecOut] = useState("");
  const [decRunning, setDecRunning] = useState(false);

  // mission / modal / toast
  const [toast, setToast] = useState("");
  const [showModal, setShowModal] = useState(false);
  const showToastMsg = (msg) => { setToast(msg); setTimeout(() => setToast(""), 1800); };
  const missionPos = startPos || pos;
  const missionCode = groupFive(outText);
  const missionPlug = plugResult.accepted.join(" ") || "(none)";
  const missionText =
    "★ ENIGMA MISSION ★\n" +
    "Rotor I (Left)   : " + chr(missionPos.L) + "\n" +
    "Rotor II (Mid)   : " + chr(missionPos.M) + "\n" +
    "Rotor III (Right): " + chr(missionPos.R) + "\n" +
    "Plugboard        : " + missionPlug + "\n" +
    "Secret Code      : " + (missionCode || "(empty)");

  const copyMission = async () => {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(missionText);
        ok = true;
      }
    } catch (e) { ok = false; }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = missionText;
      ta.style.position = "fixed"; ta.style.top = "-9999px";
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }
    showToastMsg(ok ? "✓ Copied to clipboard!" : "⚠ Try a screenshot!");
  };

  const resetMessage = useCallback(() => {
    setInText(""); setOutText(""); setStartPos(null);
    setPath(Array(11).fill("·")); setLit(null); setLastInput(null);
  }, []);

  const handleLetter = useCallback((letter) => {
    letter = letter.toUpperCase();
    if (!/[A-Z]/.test(letter)) return;
    setPos((prev) => {
      if (!startPos) setStartPos(prev);
      const { output, path: p, pos: newPos } = encryptLetter(letter, prev, plugResult.map);
      setInText((t) => t + letter);
      setOutText((t) => t + output);
      setPath(p);
      setLit(output);
      setLastInput(letter);
      setTimeout(() => setLit(null), 500);
      return newPos;
    });
  }, [startPos, plugResult.map]);

  // physical keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && showModal) { setShowModal(false); return; }
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (mode !== "encode") return;
      const k = e.key.toUpperCase();
      if (/^[A-Z]$/.test(k)) { e.preventDefault(); handleLetter(k); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleLetter, mode, showModal]);

  // decode runner
  useEffect(() => {
    if (!decRunning) return;
    const cipher = decCipher.toUpperCase().replace(/[^A-Z]/g, "");
    let i = 0;
    let runPos = { L: idx(decL || "A"), M: idx(decM || "A"), R: idx(decR || "A") };
    const plugMap = parsePlugboard(decPlug).map;
    setDecOut("");
    setPos(runPos);
    const tick = () => {
      if (i >= cipher.length) { setDecRunning(false); return; }
      const c = cipher[i++];
      const { output, path: p, pos: np } = encryptLetter(c, runPos, plugMap);
      runPos = np;
      setPos(np);
      setPath(p);
      setLit(output);
      setLastInput(c);
      setDecOut((prev) => prev + output);
      setTimeout(() => setLit(null), 250);
      if (decRunning) setTimeout(tick, 360);
    };
    tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decRunning]);

  const rotorStep = (slot, delta) => {
    if (inText !== "") resetMessage();
    setPos((p) => ({ ...p, [slot]: (p[slot] + delta + 26) % 26 }));
  };

  // ---------- layout ----------
  const ROW1 = "QWERTZUIO".split("");
  const ROW2 = "ASDFGHJK".split("");
  const ROW3 = "PYXCVBNML".split("");

  const panelStyle = {
    background: C.paper, border: `1px solid ${C.brassDeep}`, borderRadius: 4,
    padding: "20px 18px", marginBottom: 18,
    boxShadow: `inset 0 0 60px rgba(138,93,31,.18), 0 6px 0 rgba(0,0,0,.35), 0 18px 40px rgba(0,0,0,.45)`,
    position: "relative",
  };
  const panelH2 = {
    fontFamily: FONT_DISPLAY, margin: "0 0 14px", fontSize: 18,
    letterSpacing: 2, textAlign: "center", color: C.ink,
    borderBottom: `2px dashed ${C.brassDeep}`, paddingBottom: 8,
  };

  const rotorBox = (slot, label, pin) => (
    <div style={{
      background: `linear-gradient(180deg,#2a2218,#0e0a06 50%,#2a2218)`,
      border: `2px solid ${C.brassDeep}`, borderRadius: 8, padding: "8px 6px",
      textAlign: "center", boxShadow: "inset 0 0 14px rgba(0,0,0,.7)",
    }}>
      <div style={{ color: C.brassLight, fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }}>{label}</div>
      <div style={{ color: C.paper, fontSize: 8, opacity: .55, marginBottom: 4 }}>{pin}</div>
      <div style={{
        background: "#000", border: `1px solid ${C.brass}`, borderRadius: 4,
        padding: "4px 0", margin: "4px 2px", fontFamily: FONT_MONO,
        boxShadow: "inset 0 0 10px rgba(255,201,74,.4), inset 0 0 30px rgba(0,0,0,.9)",
      }}>
        <div style={{ fontSize: 11, color: C.glow, opacity: .35 }}>{chr(pos[slot] + 1)}</div>
        <div style={{ fontSize: 26, fontWeight: "bold", color: C.glowHot, textShadow: `0 0 10px ${C.glow}` }}>{chr(pos[slot])}</div>
        <div style={{ fontSize: 11, color: C.glow, opacity: .35 }}>{chr(pos[slot] - 1)}</div>
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
        {[-1, 1].map((d) => (
          <button key={d} onClick={() => rotorStep(slot, d)} style={{
            flex: 1, background: `linear-gradient(180deg,${C.brassLight},${C.brassDeep})`,
            color: "#1a0f00", border: "1px solid #3a2208", borderRadius: 3,
            padding: "3px 0", fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)",
          }}>{d === -1 ? "▼" : "▲"}</button>
        ))}
      </div>
    </div>
  );

  const tabBtn = (id, label) => (
    <button key={id} onClick={() => { setMode(id); setDecRunning(false); resetMessage(); }} style={{
      background: mode === id
        ? `linear-gradient(180deg,${C.brassLight},${C.brassDeep})`
        : "linear-gradient(180deg,#2a1d10,#1a1208)",
      color: mode === id ? "#1a0f00" : C.brassLight,
      border: `2px solid ${mode === id ? C.brassLight : C.brassDeep}`,
      borderRadius: 4, padding: "9px 16px", fontFamily: FONT_DISPLAY,
      fontSize: 12, letterSpacing: 2, cursor: "pointer",
      boxShadow: mode === id ? "0 3px 0 #000" : "0 3px 0 rgba(0,0,0,.5)",
    }}>{label}</button>
  );

  const pipe = (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
      {STAGE_LABELS.map((lbl, i) => (
        <div key={i} style={{ flex: "1 1 auto", minWidth: 50, textAlign: "center" }}>
          <div style={{
            width: 38, height: 38, margin: "0 auto", borderRadius: "50%",
            background: (path[i] !== "·" && inText + decOut)
              ? `radial-gradient(circle at 35% 30%,#fffbe6,${C.glow} 55%,#c97a00)`
              : `radial-gradient(circle at 35% 30%,#fff8e0,#e6d3a8 60%,#6b4818)`,
            border: `2px solid ${C.brassDeep}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FONT_MONO, fontSize: 16, color: C.ink,
            boxShadow: (path[i] !== "·")
              ? `0 0 14px ${C.glow}, inset 0 -3px 6px rgba(0,0,0,.2)`
              : "inset 0 -3px 6px rgba(0,0,0,.3)",
            transition: "all .25s",
          }}>{path[i]}</div>
          <div style={{ fontSize: 8, marginTop: 3, letterSpacing: .5, color: "#3a3326", textTransform: "uppercase" }}>{lbl}</div>
        </div>
      ))}
    </div>
  );

  const board = (letters, factory) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "5px 0" }}>
      {letters.map((l) => factory(l))}
    </div>
  );

  const lamp = (l) => (
    <div key={l} style={{
      width: 34, height: 34, borderRadius: "50%",
      background: lit === l
        ? `radial-gradient(circle at 35% 30%,#fffbe6,${C.glow} 50%,#d18000 90%)`
        : `radial-gradient(circle at 35% 30%,#6a5230,#2a1d0a 70%,#000)`,
      border: `2px solid ${lit === l ? C.glow : "#4a3010"}`,
      color: lit === l ? "#2a1500" : "#5a4a28",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT_MONO, fontSize: 14,
      boxShadow: lit === l ? `0 0 18px ${C.glow}, 0 0 36px rgba(255,201,74,.7)` : "inset 0 -2px 4px rgba(0,0,0,.7)",
      transition: "all .15s",
    }}>{l}</div>
  );

  const key = (l) => (
    <button key={l} onClick={() => mode === "encode" && handleLetter(l)} disabled={mode !== "encode"} style={{
      width: 38, height: 38, borderRadius: "50%",
      background: "linear-gradient(180deg,#3a2a18 0%,#1a1208 60%,#2a1d10 100%)",
      border: `2px solid ${C.brass}`, color: mode === "encode" ? C.paper : "#7a6a48",
      fontFamily: FONT_MONO, fontSize: 15, cursor: mode === "encode" ? "pointer" : "not-allowed",
      boxShadow: "inset 0 1px 2px rgba(255,201,74,.25), inset 0 -3px 4px rgba(0,0,0,.6), 0 3px 0 #000",
      opacity: mode === "encode" ? 1 : 0.55,
      touchAction: "manipulation",
    }}>{l}</button>
  );

  const tapeSlot = (label, value) => (
    <div style={{
      flex: 1, minWidth: 140, background: C.paperLight, border: `1px dashed ${C.brassDeep}`,
      borderRadius: 4, padding: "10px 12px", minHeight: 50, fontFamily: FONT_MONO,
      fontSize: 14, letterSpacing: 3, color: C.ink, wordBreak: "break-all",
    }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 9, letterSpacing: 2, color: C.crimson, marginBottom: 4 }}>{label}</div>
      {value || "—"}
    </div>
  );

  const plugStatus = (() => {
    const { accepted: ac, rejected: rj, lonely: lo } = plugResult;
    if (ac.length === 0 && rj.length === 0 && lo.length === 0)
      return { msg: "Type letter pairs (real machine used 10).", color: "#3a3326" };
    if (lo.length || rj.length) {
      const parts = [];
      if (ac.length) parts.push(`✓ ${ac.length} pair${ac.length === 1 ? "" : "s"}`);
      if (lo.length) parts.push(`⚠ lonely: ${lo.join(" ")} (need a partner!)`);
      if (rj.length) parts.push(`⚠ ignored: ${rj.join(" ")}`);
      return { msg: parts.join(" · "), color: "#a1331f" };
    }
    if (ac.length === 10) return { msg: "✓ 10 pairs — just like the real WWII Enigma! 🎖", color: "#6e5520" };
    return { msg: `✓ ${ac.length} pair${ac.length === 1 ? "" : "s"} connected`, color: "#2a6a3a" };
  })();

  // ---------- render ----------
  return (
    <div style={{
      minHeight: "100vh", position: "relative",
      background: `radial-gradient(ellipse at 20% 0%, #20393b 0%, transparent 55%),
                   radial-gradient(ellipse at 80% 100%, #2a1a14 0%, transparent 55%),
                   linear-gradient(160deg, ${C.bg1}, ${C.bg2})`,
      backgroundAttachment: "fixed",
      fontFamily: FONT_BODY, color: C.ink, padding: "60px 12px 40px",
    }}>
      {/* Back button */}
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

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 18, color: C.paper }}>
          <div style={{
            display: "inline-block", border: `2px solid ${C.crimson}`, color: C.crimson,
            padding: "3px 12px", transform: "rotate(-3deg)", fontFamily: FONT_DISPLAY,
            letterSpacing: 2, fontSize: 11, marginBottom: 10,
          }}>★ TOP SECRET ★</div>
          <h1 style={{
            fontFamily: FONT_DISPLAY, fontSize: "clamp(34px,7vw,60px)", margin: 0,
            letterSpacing: 4, color: C.paper,
            textShadow: `2px 2px 0 ${C.brassDeep}, 4px 4px 0 rgba(0,0,0,.5), 0 0 30px rgba(255,201,74,.15)`,
          }}>ENIGMA</h1>
          <div style={{ color: C.brassLight, letterSpacing: 2, fontSize: 11, marginTop: 6, opacity: .8 }}>
            A SECRET CODE MACHINE FOR YOUNG CRYPTOGRAPHERS
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {tabBtn("encode", "✉ ENCODE")}
            {tabBtn("decode", "🔓 DECODE")}
            {tabBtn("challenges", "★ CHALLENGES")}
            {tabBtn("learn", "📖 HOW IT WORKS")}
          </div>
        </div>

        {/* Settings panel (both modes) */}
        {mode === "encode" && (
          <div style={panelStyle}>
            <h2 style={panelH2}>STEP 1 · SET UP YOUR MACHINE</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              {rotorBox("L", "LEFT", "Rotor I")}
              {rotorBox("M", "MIDDLE", "Rotor II")}
              {rotorBox("R", "RIGHT", "Rotor III")}
            </div>
            <div style={{ background: "#1a1208", border: `2px solid ${C.brassDeep}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.brassLight, marginBottom: 6 }}>★ PLUGBOARD — LETTER PAIRS ★</div>
              <input value={plugRaw}
                onChange={(e) => { if (inText) resetMessage(); setPlugRaw(e.target.value); }}
                maxLength={60} placeholder="AB CD EF" spellCheck={false}
                style={{
                  width: "100%", background: "#000", border: `1px solid ${C.brass}`, color: C.glow,
                  padding: "8px 10px", fontFamily: FONT_MONO, fontSize: 15, letterSpacing: 3,
                  borderRadius: 4, outline: "none", textTransform: "uppercase", boxSizing: "border-box",
                }}/>
              <div style={{
                fontSize: 10, marginTop: 6, padding: "5px 8px", borderRadius: 3,
                borderLeft: `3px solid ${plugStatus.color}`, color: C.paperLight, opacity: .85,
                background: "rgba(255,201,74,.08)",
              }}>{plugStatus.msg}</div>
            </div>
          </div>
        )}

        {mode === "decode" && (
          <div style={panelStyle}>
            <h2 style={panelH2}>📨 A SECRET MESSAGE!</h2>
            <p style={{ textAlign: "center", fontSize: 11, fontStyle: "italic", opacity: .75, margin: "0 0 14px" }}>
              Enter your friend's settings, paste the code, press DECODE.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[["L", decL, setDecL], ["M", decM, setDecM], ["R", decR, setDecR]].map(([slot, val, set]) => (
                <div key={slot} style={{
                  background: "linear-gradient(180deg,#2a2218,#0e0a06 50%,#2a2218)",
                  border: `2px solid ${C.brassDeep}`, borderRadius: 8, padding: "8px 6px", textAlign: "center",
                }}>
                  <div style={{ color: C.brassLight, fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }}>ROTOR {slot}</div>
                  <input value={val} maxLength={1}
                    onChange={(e) => set(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1) || "A")}
                    style={{
                      width: "100%", background: "#000", border: `1px solid ${C.brass}`,
                      color: C.glowHot, textAlign: "center", fontFamily: FONT_MONO, fontSize: 28,
                      padding: "6px 0", borderRadius: 4, textTransform: "uppercase", outline: "none",
                      boxSizing: "border-box", textShadow: `0 0 10px ${C.glow}`,
                    }}/>
                </div>
              ))}
            </div>
            <input value={decPlug} onChange={(e) => setDecPlug(e.target.value)}
              maxLength={60} placeholder="PLUGBOARD: AB CD (or empty)" spellCheck={false}
              style={{
                width: "100%", background: "#000", border: `1px solid ${C.brass}`, color: C.glow,
                padding: "8px 10px", fontFamily: FONT_MONO, fontSize: 14, letterSpacing: 3,
                borderRadius: 4, outline: "none", textTransform: "uppercase", boxSizing: "border-box",
                marginBottom: 12,
              }}/>
            <textarea value={decCipher} onChange={(e) => setDecCipher(e.target.value)}
              placeholder="Paste the secret code here..."
              style={{
                width: "100%", minHeight: 60, background: C.paperLight,
                border: `1px dashed ${C.brassDeep}`, borderRadius: 4, padding: 10,
                fontFamily: FONT_MONO, fontSize: 14, letterSpacing: 3, color: C.ink,
                textTransform: "uppercase", boxSizing: "border-box", resize: "vertical",
                outline: "none",
              }}/>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
              <button onClick={() => { setDecOut(""); setDecRunning(true); }} disabled={decRunning} style={{
                background: `linear-gradient(180deg,${C.brassLight},${C.brassDeep})`,
                color: "#1a0f00", border: "1px solid #3a2208", borderRadius: 4,
                padding: "10px 22px", fontFamily: FONT_DISPLAY, fontSize: 14, letterSpacing: 2,
                cursor: "pointer",
              }}>▶ DECODE!</button>
              <button onClick={() => { setDecRunning(false); setDecOut(""); setDecCipher(""); setPath(Array(11).fill("·")); }} style={{
                background: "linear-gradient(180deg,#c75440,#6e1f10)",
                color: C.paperLight, border: "1px solid #3a0f08", borderRadius: 4,
                padding: "10px 22px", fontFamily: FONT_DISPLAY, fontSize: 14, letterSpacing: 2,
                cursor: "pointer",
              }}>⟲ CLEAR</button>
            </div>
            <div style={{
              marginTop: 14, background: C.paperLight, border: `2px solid ${C.brass}`, borderRadius: 4,
              padding: 12, minHeight: 50, fontFamily: FONT_MONO, fontSize: 16, letterSpacing: 3,
              color: C.ink, wordBreak: "break-all",
            }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 2, color: C.crimson, marginBottom: 4 }}>
                📜 DECODED MESSAGE
              </div>
              {decOut || "—"}
            </div>
          </div>
        )}

        {/* X-Ray */}
        {(mode === "encode" || mode === "decode") && (
        <div style={panelStyle}>
          <h2 style={panelH2}>INSIDE THE MACHINE</h2>
          {pipe}
          {lastInput && (
            <div style={{
              textAlign: "center", marginTop: 12, padding: "10px 12px",
              background: C.paperLight, border: `1px dashed ${C.brassDeep}`, borderRadius: 4,
              fontFamily: FONT_DISPLAY, fontSize: 15, color: C.crimson, letterSpacing: 1,
            }}>
              Your <span style={{ background: "rgba(0,0,0,.07)", padding: "1px 9px", borderRadius: 3, color: C.ink }}>{lastInput}</span>
              {" "}becomes{" "}
              <span style={{ background: C.glow, padding: "1px 9px", borderRadius: 3, color: "#5a2800", boxShadow: `0 0 12px ${C.glow}` }}>{path[path.length - 1]}</span>!
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
            {tapeSlot("MESSAGE TYPED", mode === "encode" ? inText : decCipher.toUpperCase().replace(/[^A-Z]/g, ""))}
            {tapeSlot("SECRET CODE", mode === "encode" ? outText : decOut)}
          </div>
        </div>

        {/* Boards */}
        <div style={{
          ...panelStyle,
          background: "linear-gradient(180deg,#2a1d10,#1a1208)",
          border: `2px solid ${C.brassDeep}`,
        }}>
          <h2 style={{ ...panelH2, color: C.brassLight, borderBottomColor: C.brass }}>
            {mode === "encode" ? "STEP 2 · TYPE YOUR MESSAGE" : "WATCH THE MACHINE WORK"}
          </h2>
          {mode === "encode" && (
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              background: "linear-gradient(180deg,rgba(255,201,74,.14),rgba(255,201,74,.06))",
              border: `1px solid ${C.brass}`, borderLeft: `4px solid ${C.glow}`,
              borderRadius: 4, padding: "10px 12px", marginBottom: 14, color: C.paper, fontSize: 12,
            }}>
              <span style={{ fontSize: 20 }}>💡</span>
              <div>
                <b style={{ color: C.glowHot }}>No spacebar!</b> The real 1930s Enigma had only 26 letter keys.
                Type <b style={{
                  background: C.glow, color: "#2a1500", padding: "1px 8px", borderRadius: 3,
                  fontFamily: FONT_MONO, boxShadow: `0 0 10px rgba(255,201,74,.5)`,
                }}>X</b> for a space: HELLO WORLD → HELLOXWORLD.
              </div>
            </div>
          )}
          <div style={{ color: C.brassLight, textAlign: "center", fontSize: 10, letterSpacing: 2, margin: "6px 0", opacity: .8 }}>
            💡 LAMPBOARD — the secret letter lights up
          </div>
          {board(ROW1, lamp)}
          <div style={{ padding: "0 20px" }}>{board(ROW2, lamp)}</div>
          <div style={{ padding: "0 8px" }}>{board(ROW3, lamp)}</div>
          <div style={{ color: C.brassLight, textAlign: "center", fontSize: 10, letterSpacing: 2, margin: "14px 0 6px", opacity: .8 }}>
            ⌨ KEYBOARD — tap a letter (or use your own!)
          </div>
          {board(ROW1, key)}
          <div style={{ padding: "0 20px" }}>{board(ROW2, key)}</div>
          <div style={{ padding: "0 8px" }}>{board(ROW3, key)}</div>
        </div>
        )}

        {/* Mission Card (encode only) */}
        {mode === "encode" && (
          <div style={panelStyle}>
            <h2 style={panelH2}>STEP 3 · SEND IT TO A FRIEND</h2>
            <p style={{ textAlign: "center", fontSize: 11, fontStyle: "italic", opacity: .75, margin: "0 0 12px" }}>
              Hand this to your spy friend so they can decode your message!
            </p>
            <div style={{
              background: `repeating-linear-gradient(0deg,transparent 0 24px,rgba(138,93,31,.12) 24px 25px), ${C.paperLight}`,
              border: `1px solid ${C.brassDeep}`, borderRadius: 4, padding: "18px 20px",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -14, right: 24,
                background: C.crimson, color: C.paperLight,
                width: 32, height: 32, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, boxShadow: "0 2px 6px rgba(0,0,0,.4)",
              }}>★</div>
              {[
                ["ROTOR I (L):", chr(missionPos.L)],
                ["ROTOR II (M):", chr(missionPos.M)],
                ["ROTOR III (R):", chr(missionPos.R)],
                ["PLUGBOARD:", missionPlug],
                ["SECRET CODE:", missionCode || "(type a message)"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, color: C.crimson, letterSpacing: 2, minWidth: 120 }}>{k}</div>
                  <div style={{
                    fontFamily: FONT_MONO, fontSize: 15, color: C.ink, letterSpacing: 2,
                    wordBreak: "break-all",
                    opacity: (v === "(none)" || v === "(type a message)") ? 0.4 : 1,
                    fontStyle: (v === "(none)" || v === "(type a message)") ? "italic" : "normal",
                  }}>{v}</div>
                </div>
              ))}
              <div style={{ textAlign: "right", marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button onClick={copyMission} style={{
                  background: `linear-gradient(180deg,${C.brassLight},${C.brassDeep})`,
                  color: "#1a0f00", border: "1px solid #3a2208", borderRadius: 4,
                  padding: "8px 16px", fontFamily: FONT_DISPLAY, fontSize: 12, letterSpacing: 1.5,
                  cursor: "pointer",
                }}>📋 COPY</button>
                <button onClick={() => setShowModal(true)} style={{
                  background: `linear-gradient(180deg,${C.brassLight},${C.brassDeep})`,
                  color: "#1a0f00", border: "1px solid #3a2208", borderRadius: 4,
                  padding: "8px 16px", fontFamily: FONT_DISPLAY, fontSize: 12, letterSpacing: 1.5,
                  cursor: "pointer",
                }}>🖨 SPY NOTE</button>
              </div>
            </div>
          </div>
        )}

        {/* Challenges */}
        {mode === "challenges" && (
          <div style={panelStyle}>
            <h2 style={panelH2}>★ CODEBREAKER CHALLENGES ★</h2>
            <p style={{ textAlign: "center", fontSize: 11, fontStyle: "italic", opacity: .75, margin: "0 0 16px" }}>
              Three secret messages are waiting. Pick one and crack the code!
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              {CHALLENGES.map((ch, i) => {
                const cipher = encryptStringPure(ch.plaintext, ch.positions, ch.plugboard);
                return (
                  <div key={ch.name} style={{
                    background: `repeating-linear-gradient(0deg,transparent 0 22px,rgba(138,93,31,.1) 22px 23px), ${C.paperLight}`,
                    border: `1px solid ${C.brassDeep}`, borderRadius: 4, padding: 14,
                    boxShadow: "0 4px 0 rgba(0,0,0,.2), 0 10px 20px rgba(0,0,0,.3)",
                    transform: `rotate(${[-1.2, 0.8, -0.5][i] || 0}deg)`,
                    display: "flex", flexDirection: "column",
                  }}>
                    <div style={{ fontSize: 30, textAlign: "center" }}>{ch.icon}</div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, textAlign: "center", color: C.crimson, margin: "4px 0" }}>{ch.name}</div>
                    <div style={{ textAlign: "center", fontSize: 11, fontStyle: "italic", opacity: .7, marginBottom: 8 }}>{ch.hint}</div>
                    <div style={{ fontSize: 10, fontFamily: FONT_BODY, color: "#3a3326", marginBottom: 3 }}>
                      <b style={{ color: C.crimson, fontFamily: FONT_DISPLAY }}>ROTORS:</b> {chr(ch.positions[0])} {chr(ch.positions[1])} {chr(ch.positions[2])}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: FONT_BODY, color: "#3a3326", marginBottom: 6 }}>
                      <b style={{ color: C.crimson, fontFamily: FONT_DISPLAY }}>PLUG:</b> {ch.plugboard || "(none)"}
                    </div>
                    <div style={{
                      background: "#000", color: C.glow, fontFamily: FONT_MONO, fontSize: 12,
                      letterSpacing: 2, padding: 8, borderRadius: 3, textAlign: "center",
                      wordBreak: "break-all", marginBottom: 10,
                      boxShadow: "inset 0 0 10px rgba(255,201,74,.3)",
                    }}>{groupFive(cipher)}</div>
                    <button onClick={() => {
                      setDecL(chr(ch.positions[0]));
                      setDecM(chr(ch.positions[1]));
                      setDecR(chr(ch.positions[2]));
                      setDecPlug(ch.plugboard);
                      setDecCipher(groupFive(cipher));
                      setMode("decode");
                    }} style={{
                      marginTop: "auto",
                      background: `linear-gradient(180deg,${C.brassLight},${C.brassDeep})`,
                      color: "#1a0f00", border: "1px solid #3a2208", borderRadius: 3,
                      padding: 8, fontFamily: FONT_DISPLAY, fontSize: 11, cursor: "pointer",
                    }}>▶ TRY IN DECODER</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Learn */}
        {mode === "learn" && (
          <div style={panelStyle}>
            <h2 style={panelH2}>📖 HOW DOES IT WORK?</h2>
            <p style={{ textAlign: "center", fontSize: 11, fontStyle: "italic", opacity: .75, margin: "0 0 16px" }}>
              A friendly tour of the most famous secret-code machine ever built.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
              {[
                { icon: "🎡", title: "The Three Rotors", body: (
                  <>
                    <p>Inside each rotor is a tangle of wires that scramble letters into different letters. The signal zips through all three rotors in a row, getting scrambled <b>three times</b>!</p>
                    <p>Every time you press a key, the <b>right</b> rotor clicks one notch forward. After 26 clicks the <b>middle</b> rotor ticks. After 26 middle ticks, the <b>left</b> rotor ticks.</p>
                    <p>That means typing the same letter over and over gives you different code letters every time!</p>
                  </>
                )},
                { icon: "🔌", title: "The Plugboard Swap", body: (
                  <>
                    <p>On the front of the real Enigma, soldiers used short cables to connect pairs of letters. If <b>A</b> and <b>B</b> were plugged together, pressing A would secretly become B before going into the rotors.</p>
                    <p>The real WWII machine used exactly <b>10 cables</b> — you can use up to <b>13 pairs</b> here, and each letter can only be part of one pair.</p>
                    <p>The swap happens <b>twice</b> — once going in, once coming out.</p>
                  </>
                )},
                { icon: "🪞", title: "The Mirror at the Back", body: (
                  <>
                    <p>At the back sits the <b>reflector</b> — a clever mirror that bounces the signal back through all three rotors a <b>second time</b>, on a different path!</p>
                    <p>Strange side effect: a letter <b>can never become itself</b>. A never becomes A.</p>
                    <p>That seemed clever at the time... but codebreakers later used this rule to help crack Enigma!</p>
                  </>
                )},
                { icon: "🔄", title: "The Magic Trick", body: (
                  <>
                    <p>If you encode <b>HELLO</b> with rotors at A-A-A, you might get <b>MFNCZ</b>. Hand that to a friend whose machine is also at A-A-A — they type it, and out comes <b>HELLO</b> again!</p>
                    <p>The path is <b>symmetric</b>: if A turns into M, then M turns into A. Same machine, same settings, same magic.</p>
                  </>
                )},
                { icon: "␣", title: "Where's the Spacebar?", body: (
                  <>
                    <p><b>There's no spacebar!</b> The real Enigma had only 26 letter keys — no spaces, no numbers, no punctuation.</p>
                    <p><b>Why?</b> Every key sent electricity through the rotors to light a bulb. Adding a space would have meant wiring a 27th letter through every rotor — and engineers didn't bother.</p>
                    <p>German operators typed <b>X</b> for a space, and spelled out numbers as words (3 = DREI).</p>
                  </>
                )},
                { icon: "📜", title: "A Real Wartime Secret", body: (
                  <>
                    <p>Enigma was used by the German military in <b>World War II</b>. They believed it was unbreakable — over <b>158 quintillion</b> possible settings!</p>
                    <p>But it was broken. Polish mathematicians cracked early versions, then Alan Turing's team at <b>Bletchley Park</b> built code-cracking machines called <i>bombes</i>. Historians believe their work shortened the war by two years.</p>
                  </>
                )},
              ].map((card) => (
                <div key={card.title} style={{
                  background: `repeating-linear-gradient(0deg,transparent 0 24px,rgba(138,93,31,.08) 24px 25px), ${C.paperLight}`,
                  border: `1px solid ${C.brassDeep}`, borderRadius: 4, padding: "18px 20px",
                  boxShadow: "0 4px 0 rgba(0,0,0,.18), 0 10px 18px rgba(0,0,0,.25)",
                }}>
                  <div style={{ fontSize: 32, textAlign: "center", marginBottom: 4 }}>{card.icon}</div>
                  <div style={{
                    fontFamily: FONT_DISPLAY, fontSize: 16, textAlign: "center",
                    color: C.crimson, letterSpacing: 1.5, margin: "0 0 10px",
                    borderBottom: `1px dashed ${C.brassDeep}`, paddingBottom: 6,
                  }}>{card.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: "#3a3326" }}>
                    {card.body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", color: C.brassLight, opacity: .55, fontSize: 10, letterSpacing: 2, marginTop: 18 }}>
          INSPIRED BY THE 1930s ENIGMA I
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)",
          background: C.ink, color: C.glow, border: `2px solid ${C.brass}`,
          padding: "12px 24px", borderRadius: 4,
          fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: 2,
          boxShadow: `0 8px 24px rgba(0,0,0,.6), 0 0 20px rgba(255,201,74,.3)`,
          zIndex: 9999,
        }}>{toast}</div>
      )}

      {/* Spy Note Modal */}
      {showModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          padding: "20px 14px", zIndex: 10000, overflowY: "auto",
        }}>
          <div style={{
            background: "#fdfaed", color: "#1a1a1a", maxWidth: 460, width: "100%",
            padding: "28px 30px 22px", border: "3px double #1a1a1a",
            boxShadow: "0 20px 60px rgba(0,0,0,.7)",
            fontFamily: FONT_BODY, position: "relative", margin: "auto",
          }}>
            <button onClick={() => setShowModal(false)} style={{
              position: "absolute", top: 8, left: 10, background: "none", border: "none",
              fontSize: 22, cursor: "pointer", color: "#555", lineHeight: 1,
            }}>✕</button>
            <div style={{
              display: "inline-block", border: "2px solid #8a1010", color: "#8a1010",
              padding: "3px 12px", fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 2,
              transform: "rotate(-3deg)", position: "absolute", top: 14, right: 14, background: "#fdfaed",
            }}>★ TOP SECRET ★</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, letterSpacing: 4, textAlign: "center", margin: "8px 0 2px" }}>
              ENIGMA MISSION
            </h2>
            <div style={{ textAlign: "center", letterSpacing: 3, fontSize: 10, marginBottom: 18, color: "#666" }}>
              — FOR YOUR EYES ONLY —
            </div>
            <div style={{ border: "1px dashed #1a1a1a", padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, letterSpacing: 2, color: "#8a1010", marginBottom: 8, textAlign: "center" }}>
                🔧 MACHINE SETTINGS
              </div>
              {[
                ["Rotor I (Left)", chr(missionPos.L)],
                ["Rotor II (Middle)", chr(missionPos.M)],
                ["Rotor III (Right)", chr(missionPos.R)],
                ["Plugboard", missionPlug],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 4px", borderBottom: "1px dotted #aaa", fontSize: 13 }}>
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1 }}>{k}</span>
                  <span style={{ fontFamily: "'Courier New',monospace", fontSize: 16, fontWeight: "bold", letterSpacing: 3 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ border: "1px dashed #1a1a1a", padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, letterSpacing: 2, color: "#8a1010", marginBottom: 8, textAlign: "center" }}>
                📨 SECRET CODE
              </div>
              <div style={{
                fontFamily: "'Courier New',monospace", fontSize: 15, letterSpacing: 3,
                textAlign: "center", padding: "12px 6px",
                background: "#f5f3e4", border: "1px solid #1a1a1a",
                wordBreak: "break-all", lineHeight: 1.7,
              }}>{missionCode || "(type a message first!)"}</div>
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.6, padding: "10px 12px", background: "#f9f7e0", borderLeft: "3px solid #8a1010", marginBottom: 14 }}>
              <b>HOW TO READ THIS:</b><br />
              1. Open the Enigma machine.<br />
              2. Click <b>🔓 DECODE</b>.<br />
              3. Type the rotor letters into the three boxes.<br />
              4. Type the plugboard pairs (if any).<br />
              5. Paste the secret code and press <b>▶ DECODE!</b><br />
              <i>Tip: an X in the message means a space.</i>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", paddingTop: 8, borderTop: "1px dashed #aaa" }}>
              <button onClick={() => { try { window.print(); } catch (e) { showToastMsg("⚠ Printing blocked — screenshot!"); } }} style={{
                background: "#1a1a1a", color: "#fdfaed", border: "none", padding: "9px 16px",
                fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 1.5, cursor: "pointer", borderRadius: 3,
              }}>🖨 PRINT</button>
              <button onClick={copyMission} style={{
                background: "#1a1a1a", color: "#fdfaed", border: "none", padding: "9px 16px",
                fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 1.5, cursor: "pointer", borderRadius: 3,
              }}>📋 COPY TEXT</button>
              <button onClick={() => setShowModal(false)} style={{
                background: "#1a1a1a", color: "#fdfaed", border: "none", padding: "9px 16px",
                fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 1.5, cursor: "pointer", borderRadius: 3,
              }}>CLOSE</button>
            </div>
            <div style={{ fontSize: 10, color: "#666", textAlign: "center", marginTop: 10, fontStyle: "italic" }}>
              Can't print? Take a screenshot and share it!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
