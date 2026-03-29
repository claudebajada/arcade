import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ═══════════════════════════════════════════════════════════
// QUESTION DATABASE (built once, outside component)
// ═══════════════════════════════════════════════════════════
const buildCategories = () => {
  const friends = [];
  const doubles = [];
  const bridging = [];
  const subtract = [];

  for (let i = 1; i < 10; i++) friends.push({ q: `${i} + ${10 - i}`, a: 10, hint: "Friends of 10" });
  for (let i = 1; i < 20; i++) friends.push({ q: `${i} + ${20 - i}`, a: 20, hint: "Friends of 20" });

  for (let i = 1; i <= 10; i++) {
    doubles.push({ q: `${i} + ${i}`, a: i + i, hint: "Double!" });
    if (i < 10) {
      doubles.push({ q: `${i} + ${i + 1}`, a: i + i + 1, hint: `Double ${i} and add 1` });
      doubles.push({ q: `${i + 1} + ${i}`, a: i + 1 + i, hint: `Double ${i} and add 1` });
    }
  }

  for (let i = 2; i <= 9; i++) {
    for (let j = 2; j <= 9; j++) {
      if (i + j > 10 && i !== j && Math.abs(i - j) > 1) {
        bridging.push({ q: `${i} + ${j}`, a: i + j, hint: "Make 10 first" });
      }
    }
  }

  for (let i = 11; i <= 20; i++) {
    for (let j = 2; j < i; j++) {
      subtract.push({ q: `${i} - ${j}`, a: i - j, hint: `Think addition: ${j} + ? = ${i}` });
    }
  }

  const mixed = [...friends, ...doubles, ...bridging, ...subtract];
  return { friends, doubles, bridging, subtract, mixed };
};

const CATS = buildCategories();
const HINT_DELAY_MS = 3000;
const ROSTER_KEY = "mathPractice_roster";
const FONT = "'Comic Sans MS', 'Chalkboard SE', 'Patrick Hand', sans-serif";

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
const storageKeyFor = (name) => "mathPractice_data_" + name.replace(/\s+/g, "_");

const loadRoster = () => {
  try { const s = localStorage.getItem(ROSTER_KEY); return s ? JSON.parse(s) : []; }
  catch { return []; }
};
const saveRoster = (list) => {
  try { localStorage.setItem(ROSTER_KEY, JSON.stringify(list)); } catch {}
};
const loadStudentData = (name) => {
  try { const s = localStorage.getItem(storageKeyFor(name)); return s ? JSON.parse(s) : {}; }
  catch { return {}; }
};
const saveStudentData = (name, data) => {
  try { localStorage.setItem(storageKeyFor(name), JSON.stringify(data)); } catch {}
};

const identifyCategory = (eq) => {
  if (eq.includes("-")) return "Subtraction";
  const parts = eq.split("+").map((s) => parseInt(s.trim()));
  if (parts.length === 2) {
    const [a, b] = parts;
    if (a + b === 10 || a + b === 20) return "Friends";
    if (a === b) return "Doubles";
    if (Math.abs(a - b) === 1) return "Near Doubles";
    if (a + b > 10) return "Bridging";
  }
  return "Mixed";
};

const getHeatLevel = (acc, avg) => {
  if (acc >= 80 && avg <= 3) return "green";
  if (acc < 50 || avg > 5) return "red";
  return "yellow";
};

const heatColors = {
  green: { bg: "#d4edda", color: "#155724" },
  yellow: { bg: "#fff3cd", color: "#856404" },
  red: { bg: "#f8d7da", color: "#721c24" },
  none: { bg: "#f0f0f0", color: "#aaa" },
};

const parseCSVLine = (line) => {
  const result = []; let current = ""; let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) { result.push(current); current = ""; }
    else current += ch;
  }
  result.push(current);
  return result;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const downloadCSV = (rows, filename) => {
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const computeOverallStats = (data) => {
  let totalAsked = 0, totalFirst = 0, totalTime = 0;
  const catTimes = {};
  for (const eq in data) {
    const d = data[eq];
    totalAsked += d.timesAsked;
    totalFirst += d.firstTrySuccesses;
    totalTime += d.totalTime;
    const cat = identifyCategory(eq);
    if (!catTimes[cat]) catTimes[cat] = { time: 0, count: 0 };
    catTimes[cat].time += d.totalTime;
    catTimes[cat].count += d.timesAsked;
  }
  const accuracy = totalAsked > 0 ? Math.round((totalFirst / totalAsked) * 100) : 0;
  const avgTime = totalAsked > 0 ? parseFloat((totalTime / totalAsked).toFixed(1)) : 0;
  let slowestCat = "", slowestAvg = 0;
  for (const cat in catTimes) {
    const avg = catTimes[cat].time / catTimes[cat].count;
    if (avg > slowestAvg) { slowestAvg = avg; slowestCat = cat; }
  }
  return { totalAsked, accuracy, avgTime, slowestCat };
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════
export default function MathPracticeRoom() {
  const navigate = useNavigate();

  // ─── Screens ───
  const [screen, setScreen] = useState("students"); // students | game | results | report

  // ─── Student state ───
  const [students, setStudents] = useState(loadRoster);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [newName, setNewName] = useState("");

  // ─── Game state ───
  const [mode, setModeState] = useState("mixed");
  const [card, setCard] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState({ text: "", color: "" });
  const [hint, setHint] = useState("");
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState([]);
  const [inputDisabled, setInputDisabled] = useState(false);

  // ─── Timer state ───
  const [timedMode, setTimedMode] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState("");
  const [timerPct, setTimerPct] = useState(100);
  const [timerColor, setTimerColor] = useState("#28a745");
  const [challengeScore, setChallengeScore] = useState({ correct: 0, total: 0, duration: 60 });
  const [lastDuration, setLastDuration] = useState(60);

  // ─── Report state ───
  const [reportTab, setReportTab] = useState(null); // null=overview, __heatmap__, or student name

  // ─── Toast ───
  const [toast, setToast] = useState("");

  // ─── Refs for mutable game state ───
  const sessionDataRef = useRef({});
  const attemptsRef = useRef(0);
  const startTimeRef = useRef(0);
  const hintTimerRef = useRef(null);
  const timedRef = useRef({ active: false, start: 0, duration: 60, correct: 0, total: 0 });
  const timerIntervalRef = useRef(null);
  const answerInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mistakesRef = useRef([]);
  const modeRef = useRef("mixed");
  const cardRef = useRef(null);
  const currentStudentRef = useRef(null);
  const studentsRef = useRef(students);

  // Keep refs in sync
  useEffect(() => { studentsRef.current = students; }, [students]);
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { currentStudentRef.current = currentStudent; }, [currentStudent]);

  // ─── Load Google Font ───
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ─── Toast auto-hide ───
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── Alt+R for teacher dashboard ───
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        openReport();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ─── Cleanup timer on unmount ───
  useEffect(() => {
    return () => {
      clearInterval(timerIntervalRef.current);
      clearTimeout(hintTimerRef.current);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════════════════════
  const showToast = useCallback((msg) => setToast(msg), []);

  // ═══════════════════════════════════════════════════════════
  // STUDENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  const addStudent = useCallback(() => {
    let name = newName.trim();
    if (!name) return;
    name = name.charAt(0).toUpperCase() + name.slice(1);
    if (studentsRef.current.includes(name)) { showToast(`${name} already exists!`); return; }
    const updated = [...studentsRef.current, name];
    setStudents(updated);
    saveRoster(updated);
    setNewName("");
    showToast(`${name} added!`);
  }, [newName, showToast]);

  const removeStudent = useCallback((name) => {
    if (!window.confirm(`Remove ${name} and all their data?`)) return;
    const updated = studentsRef.current.filter((n) => n !== name);
    setStudents(updated);
    saveRoster(updated);
    try { localStorage.removeItem(storageKeyFor(name)); } catch {}
    showToast(`${name} removed`);
  }, [showToast]);

  const selectStudent = useCallback((name) => {
    setCurrentStudent(name);
    currentStudentRef.current = name;
    sessionDataRef.current = loadStudentData(name);
    setMistakes([]);
    mistakesRef.current = [];
    setStreak(0);
    setModeState("mixed");
    modeRef.current = "mixed";
    setTimedMode(false);
    clearInterval(timerIntervalRef.current);
    timedRef.current.active = false;
    setScreen("game");
    // Load first card after render
    setTimeout(() => loadNextCard("mixed"), 50);
  }, []);

  const switchStudent = useCallback(() => {
    if (timedRef.current.active) stopTimerFn();
    if (currentStudentRef.current) saveStudentData(currentStudentRef.current, sessionDataRef.current);
    setCurrentStudent(null);
    setScreen("students");
  }, []);

  // ═══════════════════════════════════════════════════════════
  // GAME LOGIC
  // ═══════════════════════════════════════════════════════════
  const loadNextCard = useCallback((forceMode) => {
    const m = forceMode || modeRef.current;
    const list = m === "mistakes" ? mistakesRef.current : CATS[m];
    if (!list || list.length === 0) {
      if (m === "mistakes") {
        setFeedback({ text: "All mistakes cleared!", color: "#28a745" });
        setTimeout(() => {
          setModeState("mixed");
          modeRef.current = "mixed";
          loadNextCard("mixed");
        }, 1500);
        return;
      }
      return;
    }
    const c = list[Math.floor(Math.random() * list.length)];
    setCard(c);
    cardRef.current = c;
    setAnswer("");
    setInputDisabled(false);
    setFeedback({ text: "", color: "" });
    setHint("");
    attemptsRef.current = 0;
    startTimeRef.current = Date.now();

    clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHint(c.hint), HINT_DELAY_MS);

    setTimeout(() => { if (answerInputRef.current) answerInputRef.current.focus(); }, 100);
  }, []);

  const setMode = useCallback((m) => {
    if (timedRef.current.active) stopTimerFn();
    setTimedMode(false);
    if (m === "mistakes" && mistakesRef.current.length === 0) {
      setFeedback({ text: "No mistakes to review yet!", color: "#0066cc" });
      setTimeout(() => setFeedback({ text: "", color: "" }), 1500);
      return;
    }
    setModeState(m);
    modeRef.current = m;
    setStreak(0);
    setScreen("game");
    loadNextCard(m);
  }, [loadNextCard]);

  const handleAnswer = useCallback((val) => {
    setAnswer(val);
    const c = cardRef.current;
    if (!c) return;
    const numVal = parseInt(val);
    const expectedStr = c.a.toString();

    if (numVal === c.a) {
      setInputDisabled(true);
      setFeedback({ text: "⭐ Great job! ⭐", color: "#28a745" });
      setStreak((s) => s + 1);
      attemptsRef.current++;

      const timeTaken = (Date.now() - startTimeRef.current) / 1000;
      const sd = sessionDataRef.current;
      if (!sd[c.q]) sd[c.q] = { timesAsked: 0, totalTime: 0, firstTrySuccesses: 0 };
      sd[c.q].timesAsked++;
      sd[c.q].totalTime += timeTaken;
      if (attemptsRef.current === 1) sd[c.q].firstTrySuccesses++;
      if (currentStudentRef.current) saveStudentData(currentStudentRef.current, sd);

      if (timedRef.current.active) { timedRef.current.correct++; timedRef.current.total++; }

      if (modeRef.current === "mistakes") {
        const updated = mistakesRef.current.filter((m) => m.q !== c.q);
        setMistakes(updated);
        mistakesRef.current = updated;
      }

      clearTimeout(hintTimerRef.current);
      setTimeout(() => loadNextCard(), 800);

    } else if (val.length >= expectedStr.length) {
      setFeedback({ text: "Try again!", color: "#dc3545" });
      setStreak(0);
      attemptsRef.current++;

      if (timedRef.current.active) timedRef.current.total++;

      clearTimeout(hintTimerRef.current);
      setHint(c.hint);

      if (modeRef.current !== "mistakes" && !mistakesRef.current.some((m) => m.q === c.q)) {
        const updated = [...mistakesRef.current, c];
        setMistakes(updated);
        mistakesRef.current = updated;
      }

      setTimeout(() => {
        setAnswer("");
        setFeedback({ text: "", color: "" });
      }, 600);
    }
  }, [loadNextCard]);

  // ═══════════════════════════════════════════════════════════
  // TIMED CHALLENGE
  // ═══════════════════════════════════════════════════════════
  const stopTimerFn = useCallback(() => {
    timedRef.current.active = false;
    clearInterval(timerIntervalRef.current);
    setTimedMode(false);
  }, []);

  const startTimedChallenge = useCallback((seconds) => {
    if (timedRef.current.active) stopTimerFn();

    setLastDuration(seconds);
    timedRef.current = { active: true, start: Date.now(), duration: seconds, correct: 0, total: 0 };
    setTimedMode(true);
    setTimerPct(100);
    setTimerDisplay(seconds === 60 ? "1:00" : "2:00");
    setTimerColor("#28a745");
    setModeState("mixed");
    modeRef.current = "mixed";
    setStreak(0);
    setScreen("game");
    loadNextCard("mixed");

    timerIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - timedRef.current.start) / 1000;
      const remaining = Math.max(0, timedRef.current.duration - elapsed);
      const mins = Math.floor(remaining / 60);
      const secs = Math.floor(remaining % 60);
      setTimerDisplay(`${mins}:${secs.toString().padStart(2, "0")}`);

      const pct = (remaining / timedRef.current.duration) * 100;
      setTimerPct(pct);
      setTimerColor(pct < 20 ? "#dc3545" : pct < 50 ? "#ff8c00" : "#28a745");

      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current);
        timedRef.current.active = false;
        setTimedMode(false);
        setInputDisabled(true);
        setChallengeScore({
          correct: timedRef.current.correct,
          total: timedRef.current.total,
          duration: timedRef.current.duration,
        });
        setScreen("results");
      }
    }, 250);
  }, [loadNextCard, stopTimerFn]);

  // ═══════════════════════════════════════════════════════════
  // REPORT
  // ═══════════════════════════════════════════════════════════
  const openReport = useCallback((defaultTab = null) => {
    if (currentStudentRef.current) saveStudentData(currentStudentRef.current, sessionDataRef.current);
    if (timedRef.current.active) stopTimerFn();
    setReportTab(defaultTab);
    setScreen("report");
  }, [stopTimerFn]);

  // ─── CSV Export/Import ───
  const exportCSV = useCallback(() => {
    const name = reportTab && reportTab !== "__heatmap__" ? reportTab : currentStudent;
    if (!name) { showToast("Select a student tab first"); return; }
    const data = loadStudentData(name);
    const rows = [["Student", "Equation", "TimesAsked", "TotalTime", "FirstTrySuccesses"]];
    for (const eq in data) {
      const d = data[eq];
      rows.push([`"${name}"`, `"${eq}"`, d.timesAsked, d.totalTime.toFixed(2), d.firstTrySuccesses]);
    }
    if (rows.length === 1) { showToast("No data to export"); return; }
    downloadCSV(rows, `math-practice-${name}-${todayStr()}.csv`);
    showToast("CSV exported!");
  }, [reportTab, currentStudent, showToast]);

  const exportAllCSV = useCallback(() => {
    const rows = [["Student", "Equation", "TimesAsked", "TotalTime", "FirstTrySuccesses"]];
    studentsRef.current.forEach((name) => {
      const data = loadStudentData(name);
      for (const eq in data) {
        const d = data[eq];
        rows.push([`"${name}"`, `"${eq}"`, d.timesAsked, d.totalTime.toFixed(2), d.firstTrySuccesses]);
      }
    });
    if (rows.length === 1) { showToast("No data to export"); return; }
    downloadCSV(rows, `math-practice-all-${todayStr()}.csv`);
    showToast("CSV exported!");
  }, [showToast]);

  const importCSV = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.trim().split("\n");
      const imported = {};
      let updatedStudents = [...studentsRef.current];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        let name, eq, timesAsked, totalTime, firstTry;
        if (cols.length >= 5) {
          name = cols[0].replace(/"/g, "").trim();
          eq = cols[1].replace(/"/g, "").trim();
          timesAsked = parseInt(cols[2]); totalTime = parseFloat(cols[3]); firstTry = parseInt(cols[4]);
        } else if (cols.length >= 4) {
          name = currentStudentRef.current || "Unknown";
          eq = cols[0].replace(/"/g, "").trim();
          timesAsked = parseInt(cols[1]); totalTime = parseFloat(cols[2]); firstTry = parseInt(cols[3]);
        } else continue;
        if (!eq || isNaN(timesAsked)) continue;
        if (!updatedStudents.includes(name)) updatedStudents.push(name);
        if (!imported[name]) imported[name] = loadStudentData(name);
        if (imported[name][eq]) {
          imported[name][eq].timesAsked += timesAsked;
          imported[name][eq].totalTime += totalTime;
          imported[name][eq].firstTrySuccesses += firstTry;
        } else {
          imported[name][eq] = { timesAsked, totalTime, firstTrySuccesses: firstTry };
        }
      }
      setStudents(updatedStudents);
      saveRoster(updatedStudents);
      for (const name in imported) saveStudentData(name, imported[name]);
      if (currentStudentRef.current && imported[currentStudentRef.current]) {
        sessionDataRef.current = loadStudentData(currentStudentRef.current);
      }
      showToast(`Imported data for ${Object.keys(imported).length} student(s)`);
      e.target.value = "";
    };
    reader.readAsText(file);
  }, [showToast]);

  // ═══════════════════════════════════════════════════════════
  // STYLES
  // ═══════════════════════════════════════════════════════════
  const S = useMemo(() => ({
    wrap: { minHeight: "100vh", background: "#f4f7f6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: 10 },
    backBtn: { position: "absolute", top: 12, left: 16, color: "#4a4a6a", fontSize: 12, cursor: "pointer", zIndex: 10, padding: "6px 12px", borderRadius: 6, background: "#0a0c2080", border: "1px solid #1a1a3a", fontFamily: "'Courier New', monospace", letterSpacing: 2 },
    card: { background: "white", padding: 40, borderRadius: 20, boxShadow: "0 8px 16px rgba(0,0,0,0.1)", textAlign: "center", width: "90%", maxWidth: 500 },
    h1: { color: "#333", marginTop: 0, fontSize: 28, fontFamily: FONT },
    equation: { fontSize: 70, color: "#333", margin: "20px 0", minHeight: 80, fontWeight: "bold", fontFamily: FONT },
    input: { fontSize: 50, width: 140, textAlign: "center", padding: 10, border: "4px solid #b3d9ff", borderRadius: 15, color: "#0066cc", fontFamily: FONT, outline: "none" },
    hint: { fontSize: 20, color: "#ff8c00", fontWeight: "bold", height: 25, fontFamily: FONT },
    stats: { fontSize: 20, color: "#666", marginBottom: 10 },
    btn: (active, borderColor = "#0066cc", activeColor = "#0066cc", textColor = "#0066cc") => ({
      background: active ? activeColor : "#fff", color: active ? "white" : textColor,
      border: `2px solid ${borderColor}`, padding: "10px 15px", fontSize: 16, borderRadius: 8,
      cursor: "pointer", fontWeight: "bold", fontFamily: FONT, transition: "0.2s",
    }),
    menu: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginBottom: 15, maxWidth: 700 },
    playerBar: { fontSize: 16, color: "#666", marginBottom: 8, fontFamily: FONT },
    switchBtn: { fontSize: 12, padding: "4px 10px", marginLeft: 8, borderRadius: 5, border: "1px solid #ccc", background: "#f9f9f9", cursor: "pointer", color: "#666", fontFamily: FONT },
    studentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, margin: "20px 0" },
    studentBtn: { background: "#e6f2ff", color: "#0066cc", border: "2px solid #b3d9ff", padding: "16px 10px", borderRadius: 12, fontSize: 18, cursor: "pointer", fontWeight: "bold", fontFamily: FONT, textAlign: "center", wordBreak: "break-word" },
    addArea: { marginTop: 15, display: "flex", gap: 8, justifyContent: "center" },
    nameInput: { padding: 10, border: "2px solid #ccc", borderRadius: 8, fontSize: 16, width: 180, fontFamily: FONT, outline: "none" },
    bigScore: { fontSize: 80, color: "#0066cc", fontWeight: "bold", margin: "15px 0", fontFamily: FONT },
    scoreDetail: { fontSize: 18, color: "#666", margin: "5px 0" },
    timerText: (color) => ({ fontSize: 22, color, fontWeight: "bold", marginBottom: 5, fontFamily: FONT }),
    timerBarWrap: { width: "100%", height: 12, background: "#eee", borderRadius: 6, marginBottom: 10, overflow: "hidden" },
    timerBar: (pct) => ({ height: "100%", background: "linear-gradient(90deg, #28a745, #ffc107, #dc3545)", borderRadius: 6, transition: "width 0.5s linear", width: `${pct}%` }),
    reportWrap: { background: "white", padding: 30, borderRadius: 15, boxShadow: "0 8px 16px rgba(0,0,0,0.2)", width: "90%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", textAlign: "left", fontFamily: FONT },
    reportTabs: { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 15 },
    reportTab: (active) => ({ padding: "8px 16px", border: `2px solid #0066cc`, borderRadius: 6, background: active ? "#0066cc" : "#fff", color: active ? "white" : "#0066cc", cursor: "pointer", fontWeight: "bold", fontSize: 14, fontFamily: FONT }),
    table: { width: "100%", borderCollapse: "collapse", marginTop: 15, fontFamily: FONT },
    th: { border: "1px solid #ddd", padding: 10, textAlign: "center", fontSize: 14, background: "#0066cc", color: "white" },
    td: (extra = {}) => ({ border: "1px solid #ddd", padding: 10, textAlign: "center", fontSize: 14, ...extra }),
    exportBtn: { background: "#28a745", color: "white", border: "none", padding: "10px 20px", borderRadius: 5, cursor: "pointer", fontFamily: FONT, fontSize: 14 },
    closeBtn: { background: "#333", color: "white", border: "none", padding: "10px 20px", borderRadius: 5, cursor: "pointer", fontFamily: FONT, fontSize: 14 },
    reportActions: { display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" },
    toast: (visible) => ({ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#333", color: "white", padding: "12px 24px", borderRadius: 8, fontSize: 14, opacity: visible ? 1 : 0, transition: "opacity 0.3s", pointerEvents: "none", zIndex: 100, fontFamily: FONT }),
    legendWrap: { display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 4, marginBottom: 8 },
    legendItem: (bg) => ({ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }),
    legendSwatch: (bg) => ({ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: bg }),
    removable: { display: "inline-flex", alignItems: "center", gap: 5, background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 6, padding: "6px 10px", fontSize: 14 },
    removeX: { color: "#dc3545", cursor: "pointer", fontWeight: "bold", fontSize: 16, border: "none", background: "none", padding: "2px 5px" },
  }), []);

  // ═══════════════════════════════════════════════════════════
  // RENDER: STUDENT SELECT
  // ═══════════════════════════════════════════════════════════
  const renderStudentScreen = () => (
    <div style={S.card}>
      <h1 style={S.h1}>Who's Practising? 🧠</h1>
      <div style={S.studentGrid}>
        {students.map((name) => (
          <div key={name} style={S.studentBtn} onClick={() => selectStudent(name)}>{name}</div>
        ))}
      </div>
      <div style={S.addArea}>
        <input style={S.nameInput} value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a name..." maxLength={20}
          onKeyDown={(e) => { if (e.key === "Enter") addStudent(); }} />
        <div style={S.btn(false)} onClick={addStudent}>+ Add</div>
      </div>
      <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid #eee" }}>
        <span onClick={() => openReport("__guide__")}
          style={{ fontSize: 12, color: "#aaa", cursor: "pointer", fontFamily: FONT }}>
          Teachers & Instructors →
        </span>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER: GAME
  // ═══════════════════════════════════════════════════════════
  const modes = [
    { id: "friends", label: "Friends of 10/20" },
    { id: "doubles", label: "Doubles & Near" },
    { id: "bridging", label: "Bridging 10" },
    { id: "subtract", label: "Subtraction" },
    { id: "mixed", label: "All Mix" },
  ];

  const renderGame = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <div style={S.playerBar}>
        Playing as: <span style={{ fontWeight: "bold", color: "#0066cc" }}>{currentStudent}</span>
        <span style={S.switchBtn} onClick={switchStudent}>Switch</span>
      </div>

      <div style={S.menu}>
        {modes.map((m) => (
          <div key={m.id} style={S.btn(mode === m.id && !timedMode)} onClick={() => setMode(m.id)}>{m.label}</div>
        ))}
        <div style={S.btn(mode === "mistakes" && !timedMode, "#dc3545", "#dc3545", "#dc3545")}
          onClick={() => setMode("mistakes")}>
          Review Mistakes ({mistakes.length})
        </div>
        <div style={S.btn(timedMode && lastDuration === 60, "#ff8c00", "#ff8c00", "#ff8c00")}
          onClick={() => startTimedChallenge(60)}>⏱ 1 Min</div>
        <div style={S.btn(timedMode && lastDuration === 120, "#ff8c00", "#ff8c00", "#ff8c00")}
          onClick={() => startTimedChallenge(120)}>⏱ 2 Min</div>
      </div>

      <div style={S.card}>
        <h1 style={S.h1}>Practice Room 🧠</h1>
        {timedMode && (
          <>
            <div style={S.timerText(timerColor)}>{timerDisplay}</div>
            <div style={S.timerBarWrap}><div style={S.timerBar(timerPct)} /></div>
          </>
        )}
        <div style={S.stats}>Streak: {streak}</div>
        <div style={S.hint}>{hint}</div>
        <div style={S.equation}>{card ? card.q : "Ready?"}</div>
        <input ref={answerInputRef} type="number" inputMode="numeric" autoComplete="off"
          style={S.input} placeholder="?" value={answer} disabled={inputDisabled}
          onChange={(e) => handleAnswer(e.target.value)} />
        <div style={{ fontSize: 26, height: 40, marginTop: 20, fontWeight: "bold", color: feedback.color, fontFamily: FONT }}>
          {feedback.text}
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER: CHALLENGE RESULTS
  // ═══════════════════════════════════════════════════════════
  const renderResults = () => {
    const acc = challengeScore.total > 0 ? Math.round((challengeScore.correct / challengeScore.total) * 100) : 0;
    const avgT = challengeScore.correct > 0 ? (challengeScore.duration / challengeScore.correct).toFixed(1) : "—";
    return (
      <div style={S.card}>
        <h2 style={{ ...S.h1, fontSize: 24 }}>⏱ Time's Up!</h2>
        <div style={S.bigScore}>{challengeScore.correct}</div>
        <div style={S.scoreDetail}>questions answered correctly</div>
        <div style={S.scoreDetail}>Accuracy: {acc}% ({challengeScore.correct}/{challengeScore.total})</div>
        <div style={S.scoreDetail}>Average: {avgT}s per correct answer</div>
        <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
          <div style={S.btn(false)} onClick={() => startTimedChallenge(lastDuration)}>Try Again</div>
          <div style={S.btn(false)} onClick={() => { setScreen("game"); setMode("mixed"); }}>Back to Practice</div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: TEACHER DASHBOARD
  // ═══════════════════════════════════════════════════════════
  const catNames = ["Friends", "Doubles", "Near Doubles", "Bridging", "Subtraction"];

  const renderOverviewTable = () => {
    const rows = students.map((name) => ({ name, ...computeOverallStats(loadStudentData(name)) }))
      .sort((a, b) => b.totalAsked - a.totalAsked);
    return (
      <>
        <p style={{ textAlign: "center", color: "#666", margin: "5px 0" }}>Summary across all students — sorted by total questions answered.</p>
        <table style={S.table}>
          <thead><tr>{["Student", "Total Answered", "Instant Recall %", "Avg Time", "Slowest Category"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={5} style={S.td()}>No students added yet.</td></tr> :
              rows.map((r) => (
                <tr key={r.name}>
                  <td style={S.td({ fontWeight: "bold", textAlign: "left", paddingLeft: 15 })}>{r.name}</td>
                  <td style={S.td()}>{r.totalAsked}</td>
                  <td style={S.td()}>{r.accuracy}%</td>
                  <td style={S.td({ color: r.avgTime > 4 ? "#dc3545" : r.avgTime <= 2 && r.avgTime > 0 ? "#28a745" : undefined, fontWeight: r.avgTime > 4 || (r.avgTime <= 2 && r.avgTime > 0) ? "bold" : undefined })}>
                    {r.avgTime > 0 ? `${r.avgTime}s` : "—"}
                  </td>
                  <td style={S.td()}>{r.slowestCat || "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </>
    );
  };

  const renderHeatmap = () => {
    return (
      <>
        <p style={{ textAlign: "center", color: "#666", margin: "5px 0" }}>Category mastery across all students — based on accuracy and speed.</p>
        <div style={S.legendWrap}>
          {[["#d4edda", "Mastered (≥80%, ≤3s)"], ["#fff3cd", "Developing (≥50%)"], ["#f8d7da", "Needs Work (<50% or >5s)"], ["#f0f0f0", "No Data"]].map(([bg, label]) => (
            <span key={label} style={S.legendItem(bg)}><span style={S.legendSwatch(bg)} /> {label}</span>
          ))}
        </div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Student</th>{catNames.map((c) => <th key={c} style={S.th}>{c}</th>)}<th style={S.th}>Overall</th></tr></thead>
          <tbody>
            {students.length === 0 ? <tr><td colSpan={catNames.length + 2} style={S.td()}>No students added yet.</td></tr> :
              students.map((name) => {
                const data = loadStudentData(name);
                const cs = {}; let tA = 0, tF = 0, tT = 0;
                for (const eq in data) {
                  const d = data[eq]; const cat = identifyCategory(eq);
                  if (!cs[cat]) cs[cat] = { asked: 0, first: 0, time: 0 };
                  cs[cat].asked += d.timesAsked; cs[cat].first += d.firstTrySuccesses; cs[cat].time += d.totalTime;
                  tA += d.timesAsked; tF += d.firstTrySuccesses; tT += d.totalTime;
                }
                return (
                  <tr key={name}>
                    <td style={S.td({ fontWeight: "bold", textAlign: "left", paddingLeft: 15 })}>{name}</td>
                    {catNames.map((cat) => {
                      const s = cs[cat];
                      if (!s || s.asked === 0) return <td key={cat} style={S.td({ background: heatColors.none.bg, color: heatColors.none.color })}>—</td>;
                      const acc = Math.round((s.first / s.asked) * 100);
                      const avg = s.time / s.asked;
                      const h = heatColors[getHeatLevel(acc, avg)];
                      return <td key={cat} style={S.td({ background: h.bg, color: h.color })}>{acc}%<br /><span style={{ fontSize: 11 }}>{avg.toFixed(1)}s</span></td>;
                    })}
                    <td style={S.td(tA === 0 ? { background: heatColors.none.bg, color: heatColors.none.color } : (() => { const a = Math.round((tF / tA) * 100); const t = tT / tA; const h = heatColors[getHeatLevel(a, t)]; return { background: h.bg, color: h.color }; })())}>
                      {tA === 0 ? "—" : <><strong>{Math.round((tF / tA) * 100)}%</strong><br /><span style={{ fontSize: 11 }}>{(tT / tA).toFixed(1)}s</span></>}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </>
    );
  };

  const renderStudentReport = (name) => {
    const data = loadStudentData(name);
    const rows = Object.keys(data).map((eq) => {
      const d = data[eq];
      return { equation: eq, category: identifyCategory(eq), timesAsked: d.timesAsked, avgTime: parseFloat((d.totalTime / d.timesAsked).toFixed(2)), accuracy: Math.round((d.firstTrySuccesses / d.timesAsked) * 100) };
    }).sort((a, b) => b.avgTime - a.avgTime);
    return (
      <>
        <p style={{ textAlign: "center", color: "#666", margin: "5px 0" }}>{name}'s equations — sorted by slowest reaction time.</p>
        <table style={S.table}>
          <thead><tr>{["Equation", "Category", "Times Asked", "Avg Time", "Instant Recall %"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={5} style={S.td()}>No data yet — play some rounds!</td></tr> :
              rows.map((r) => (
                <tr key={r.equation}>
                  <td style={S.td({ fontWeight: "bold", fontSize: 16 })}>{r.equation}</td>
                  <td style={S.td()}>{r.category}</td>
                  <td style={S.td()}>{r.timesAsked}</td>
                  <td style={S.td({ color: r.avgTime > 4 ? "#dc3545" : r.avgTime <= 2 ? "#28a745" : undefined, fontWeight: r.avgTime > 4 || r.avgTime <= 2 ? "bold" : undefined })}>
                    {r.avgTime}s
                  </td>
                  <td style={S.td()}>{r.accuracy}%</td>
                </tr>
              ))}
          </tbody>
        </table>
      </>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: TEACHER GUIDE (in-app)
  // ═══════════════════════════════════════════════════════════
  const guideSection = (title, children) => (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ color: "#0066cc", fontSize: 18, marginBottom: 8, fontFamily: FONT }}>{title}</h3>
      {children}
    </div>
  );

  const guidePara = (text) => <p style={{ color: "#444", lineHeight: 1.6, margin: "8px 0", fontSize: 14 }}>{text}</p>;

  const guideNote = (title, text, color = "#0066cc", bg = "#e6f2ff") => (
    <div style={{ background: bg, borderLeft: `4px solid ${color}`, padding: "12px 16px", borderRadius: "0 8px 8px 0", margin: "12px 0" }}>
      <strong style={{ color, fontSize: 14 }}>{title}</strong>
      <p style={{ color: "#444", fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>{text}</p>
    </div>
  );

  const guideTable = (headers, rows) => (
    <table style={{ ...S.table, marginTop: 8, marginBottom: 12 }}>
      <thead><tr>{headers.map((h) => <th key={h} style={{ ...S.th, fontSize: 13, padding: 8 }}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => (
        <tr key={i}>{row.map((cell, j) => <td key={j} style={S.td({ fontSize: 13, padding: 8, textAlign: j === 0 ? "left" : "center", fontWeight: j === 0 ? "bold" : "normal" })}>{cell}</td>)}</tr>
      ))}</tbody>
    </table>
  );

  const renderGuide = () => (
    <div style={{ fontSize: 14, lineHeight: 1.6 }}>

      {guideSection("Getting Started", <>
        {guidePara("Math Practice Room helps students build mental math fluency through timed practice across key strategies. There's no login or account setup needed.")}
        {guidePara("1. Students see a \"Who's Practising?\" screen when they open the app. Add each student's name using the text field — names are saved automatically.")}
        {guidePara("2. Students tap their name to start. When they're done, they press \"Switch\" to go back for the next student.")}
        {guidePara("3. That's it. No accounts, no passwords.")}
      </>)}

      {guideSection("Practice Categories", <>
        {guideTable(["Button", "What It Practises"], [
          ["Friends of 10/20", "Number bonds (e.g. 3 + 7 = 10, 14 + 6 = 20)"],
          ["Doubles & Near", "Double facts and near doubles (e.g. 6 + 6, 6 + 7)"],
          ["Bridging 10", "Addition crossing the 10 boundary (e.g. 8 + 5)"],
          ["Subtraction", "Within 20, framed as inverse addition"],
          ["All Mix", "Random mix of all categories"],
          ["Review Mistakes", "Replays only equations the student got wrong"],
        ])}
      </>)}

      {guideSection("Timed Challenges", <>
        {guidePara("The orange ⏱ 1 Min and ⏱ 2 Min buttons start a countdown challenge. Students answer as many mixed questions as possible before time runs out. At the end they see their score, accuracy, and average speed. Works well as a daily \"mad minute\" warm-up.")}
      </>)}

      {guideSection("Hints", <>
        {guidePara("Each question has a strategy hint (e.g. \"Make 10 first\"). The hint is hidden for the first 3 seconds to encourage recall. If the student answers incorrectly, the hint appears immediately to teach the strategy.")}
      </>)}

      {guideSection("Opening This Dashboard", <>
        {guideNote("Keyboard shortcut: Alt + R (Windows) or Option + R (Mac)",
          "This is the only way to access the dashboard. Students won't stumble onto it accidentally.")}
      </>)}

      {guideSection("Dashboard Tabs Explained", <>
        {guidePara("Class Overview — Shows every student's total questions answered, instant recall rate, average speed, and weakest category. Sorted by total practice volume.")}
        {guidePara("Mastery Heatmap — A colour-coded grid of every student vs. every category. At a glance you can see who needs help where.")}
        {guideTable(["Colour", "Meaning", "Criteria"], [
          ["🟢 Green", "Mastered", "80%+ accuracy AND under 3 seconds"],
          ["🟡 Yellow", "Developing", "50–80% accuracy, moderate speed"],
          ["🔴 Red", "Needs Work", "Below 50% accuracy OR over 5 seconds"],
          ["⚪ Grey", "No Data", "Student hasn't tried this category yet"],
        ])}
        {guidePara("Student tabs — Click any student's name to see their equation-by-equation breakdown, sorted by slowest reaction time. The equations at the top are what they struggle with most.")}
      </>)}

      {guideSection("What is \"Instant Recall %\"?", <>
        {guidePara("Each time an equation appears, it's pass/fail — the student either gets it right on their first attempt or they don't. The percentage tracks how often they nail it first time across all encounters with that equation.")}
        {guidePara("Example: if \"8 + 5\" has appeared 10 times and was answered correctly first try 7 times, that's 70%. This metric gets more reliable the more a student practises — if an equation has only come up once or twice, the number won't tell you much yet.")}
      </>)}

      {guideSection("How Data Is Saved", <>
        {guidePara("All data is stored in your browser's localStorage. This is a small database built into every web browser that keeps data on the specific device and browser you're using.")}
        {guideNote("Key things to know", 
          "• Data stays on the device — it doesn't sync to the cloud or other devices.\n• Data stays in the browser — Chrome and Edge have separate data stores.\n• Every correct answer auto-saves — there's no save button.\n• Closing the tab or restarting doesn't lose data.\n• Rebuilding or updating the server does NOT affect data — it lives in the browser, not on the server.")}
        {guideNote("⚠ What WILL delete data", 
          "Clearing browser data/cache/cookies erases everything. If your school IT runs automated cleanups, localStorage may be wiped. Incognito/private browsing doesn't save data. A student using a different device or browser starts fresh.",
          "#dc3545", "#fff0f0")}
      </>)}

      {guideSection("Backing Up Your Data", <>
        {guidePara("Because localStorage can be cleared, regular CSV exports are your safety net.")}
        {guidePara("To export: Open this dashboard → click \"Export All Students\" → save the downloaded file to your cloud drive or USB.")}
        {guidePara("To restore: Open this dashboard → click \"Load CSV\" → select your backup file. The app will recreate all student profiles and merge the data.")}
        {guideNote("💡 Recommended", "Export a CSV every Friday afternoon. It takes 10 seconds and means you never lose more than a week of data.")}
      </>)}

      {guideSection("Classroom Tips", <>
        {guidePara("Shared computers (younger years): Have students select their name when they sit down and press \"Switch\" when done. All data stays on one device — one export captures everyone.")}
        {guidePara("Individual machines (older years): Each device only has one student's data. Collect CSVs via a shared network folder or email, then import them all into one device for a unified class view.")}
        {guidePara("Daily warm-up: Students open the app, tap their name, do a 1-minute timed challenge. Takes about 2 minutes total including transitions.")}
        {guidePara("Use the heatmap for grouping: Check it weekly. Students who are red in the same category can work together with manipulatives. Green students move to extension. Makes group formation a 30-second task.")}
        {guidePara("Review Mistakes mode: Encourage students to hit this before switching out. It replays only their errors from this session — a lightweight form of spaced repetition.")}
      </>)}

      {guideSection("Quick Reference", <>
        {guideTable(["Action", "How"], [
          ["Open this dashboard", "Alt + R (Windows) / Option + R (Mac)"],
          ["Add a student", "Type name on start screen → press + Add"],
          ["Remove a student", "Dashboard → Manage Students → click ✕"],
          ["Start timed challenge", "Click ⏱ 1 Min or ⏱ 2 Min"],
          ["Export all data", "Dashboard → Export All Students"],
          ["Export one student", "Dashboard → click student tab → Export This Student"],
          ["Restore from backup", "Dashboard → Load CSV → select file"],
          ["Switch students", "Click \"Switch\" next to the student name"],
        ])}
      </>)}
    </div>
  );

  const renderReport = () => (
    <div style={S.reportWrap}>
      <h2 style={{ ...S.h1, textAlign: "center" }}>📊 Teacher Dashboard</h2>
      <div style={S.reportTabs}>
        <div style={S.reportTab(reportTab === null)} onClick={() => setReportTab(null)}>Class Overview</div>
        <div style={S.reportTab(reportTab === "__heatmap__")} onClick={() => setReportTab("__heatmap__")}>🟢 Mastery Heatmap</div>
        {students.map((name) => (
          <div key={name} style={S.reportTab(reportTab === name)} onClick={() => setReportTab(name)}>{name}</div>
        ))}
        <div style={{ ...S.reportTab(reportTab === "__guide__"), borderColor: "#ff8c00", color: reportTab === "__guide__" ? "white" : "#ff8c00", background: reportTab === "__guide__" ? "#ff8c00" : "#fff" }} onClick={() => setReportTab("__guide__")}>📖 Guide</div>
      </div>

      {reportTab === null && renderOverviewTable()}
      {reportTab === "__heatmap__" && renderHeatmap()}
      {reportTab === "__guide__" && renderGuide()}
      {reportTab && reportTab !== "__heatmap__" && reportTab !== "__guide__" && renderStudentReport(reportTab)}

      <div style={{ marginTop: 20, paddingTop: 15, borderTop: "2px solid #eee" }}>
        <h3 style={{ textAlign: "center", color: "#666" }}>Manage Students</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {students.map((name) => (
            <span key={name} style={S.removable}>
              {name} <span style={S.removeX} onClick={() => removeStudent(name)} title="Remove">✕</span>
            </span>
          ))}
        </div>
      </div>

      <div style={S.reportActions}>
        <div style={S.exportBtn} onClick={exportCSV}>💾 Export This Student</div>
        <div style={S.exportBtn} onClick={exportAllCSV}>💾 Export All Students</div>
        <div style={S.exportBtn} onClick={() => fileInputRef.current?.click()}>📂 Load CSV</div>
        <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={importCSV} />
        <div style={S.closeBtn} onClick={() => setScreen(currentStudent ? "game" : "students")}>Close & Return</div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={S.wrap}>
      <div onClick={() => navigate("/")} style={S.backBtn}>← ARCADE</div>

      {screen === "students" && renderStudentScreen()}
      {screen === "game" && renderGame()}
      {screen === "results" && renderResults()}
      {screen === "report" && renderReport()}

      <div style={S.toast(!!toast)}>{toast}</div>
    </div>
  );
}
