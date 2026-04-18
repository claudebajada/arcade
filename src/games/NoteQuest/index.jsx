import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const CHROMATIC_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const NOTE_FREQ = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25 };
const INTERVALS = { "Major 2nd": 2, "Major 3rd": 4, "Perfect 4th": 5, "Perfect 5th": 7, "Octave": 12 };
const CHORD_TYPES = { Major: [0, 4, 7], Minor: [0, 3, 7], Diminished: [0, 3, 6], Augmented: [0, 4, 8], "Major 7th": [0, 4, 7, 11], "Minor 7th": [0, 3, 7, 10], "Dominant 7th": [0, 4, 7, 10] };
const TIME_SIGS = [
  { top: 4, bottom: 4, name: "4/4 (Common Time)", desc: "4 quarter-note beats per measure" },
  { top: 3, bottom: 4, name: "3/4 (Waltz Time)", desc: "3 quarter-note beats per measure" },
  { top: 6, bottom: 8, name: "6/8 (Compound Duple)", desc: "6 eighth notes in 2 groups of 3" },
  { top: 2, bottom: 4, name: "2/4 (March Time)", desc: "2 quarter-note beats per measure" }
];
const KEY_SIGS = [
  { key: "C Major / A Minor", sharps: 0, flats: 0 },
  { key: "G Major / E Minor", sharps: 1, flats: 0, acc: ["F#"] },
  { key: "D Major / B Minor", sharps: 2, flats: 0, acc: ["F#", "C#"] },
  { key: "F Major / D Minor", sharps: 0, flats: 1, acc: ["Bb"] },
  { key: "Bb Major / G Minor", sharps: 0, flats: 2, acc: ["Bb", "Eb"] }
];
const MODES = [
  { name: "Ionian (Major)", pattern: [2, 2, 1, 2, 2, 2, 1], mood: "Often described as happy and bright" },
  { name: "Dorian", pattern: [2, 1, 2, 2, 2, 1, 2], mood: "Often described as jazzy and cool" },
  { name: "Phrygian", pattern: [1, 2, 2, 2, 1, 2, 2], mood: "Often described as Spanish or exotic" },
  { name: "Mixolydian", pattern: [2, 2, 1, 2, 2, 1, 2], mood: "Often described as bluesy" },
  { name: "Aeolian (Minor)", pattern: [2, 1, 2, 2, 1, 2, 2], mood: "Often described as sad or dark" }
];
const PROGRESSIONS = [
  { name: "I - IV - V - I", desc: "Classic pop/rock", chords: ["C", "F", "G", "C"] },
  { name: "I - V - vi - IV", desc: "Hit-song progression", chords: ["C", "G", "Am", "F"] },
  { name: "ii - V - I", desc: "Classic jazz", chords: ["Dm", "G", "C"] },
  { name: "I - vi - IV - V", desc: "50s doo-wop", chords: ["C", "Am", "F", "G"] }
];
const GUITAR_OPEN = ["E", "A", "D", "G", "B", "E"];
const GUITAR_OPEN_IDX = [4, 9, 2, 7, 11, 4];
const UKE_OPEN = ["G", "C", "E", "A"];
const UKE_OPEN_IDX = [7, 0, 4, 9];
function fretNote(oi, f) {
  return CHROMATIC[(oi + f) % 12];
}
const GUITAR_CHORDS = {
  C: { frets: [null, 3, 2, 0, 1, 0], fingers: "x32010", notes: "x-C-E-G-C-E" },
  G: { frets: [3, 2, 0, 0, 0, 3], fingers: "320003", notes: "G-B-D-G-B-G" },
  D: { frets: [null, null, 0, 2, 3, 2], fingers: "xx0232", notes: "x-x-D-A-D-F#" },
  Am: { frets: [null, 0, 2, 2, 1, 0], fingers: "x02210", notes: "x-A-E-A-C-E" },
  Em: { frets: [0, 2, 2, 0, 0, 0], fingers: "022000", notes: "E-B-E-G-B-E" },
  E: { frets: [0, 2, 2, 1, 0, 0], fingers: "022100", notes: "E-B-E-G#-B-E" }
};
const UKE_CHORDS = {
  C: { frets: [0, 0, 0, 3], notes: "G-C-E-C" },
  G: { frets: [0, 2, 3, 2], notes: "G-D-G-B" },
  Am: { frets: [2, 0, 0, 0], notes: "A-C-E-A" },
  F: { frets: [2, 0, 1, 0], notes: "A-C-F-A" },
  Dm: { frets: [2, 2, 1, 0], notes: "A-D-F-A" },
  G7: { frets: [0, 2, 1, 2], notes: "G-D-F-B" },
  C7: { frets: [0, 0, 0, 1], notes: "G-C-E-Bb" },
  Cmaj7: { frets: [0, 0, 0, 2], notes: "G-C-E-B" },
  Am7: { frets: [0, 0, 0, 0], notes: "G-C-E-A" }
};
function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function pick(a) {
  return a[Math.floor(Math.random() * a.length)];
}
function wrongOpts(c, pool, n = 3) {
  return shuffle(pool.filter((x) => x !== c)).slice(0, n);
}
function useAudio() {
  const ctxRef = useRef(null);
  const graphRef = useRef(null);
  const noiseRef = useRef(null);
  const impulseRef = useRef(null);
  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);
  const createImpulse = useCallback((ctx, seconds, decay) => {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (0.8 + Math.random() * 0.2);
      }
    }
    return impulse;
  }, []);
  const createNoiseBuffer = useCallback((ctx, seconds) => {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }, []);
  const ensureGraph = useCallback(() => {
    const c = getCtx();
    if (graphRef.current && graphRef.current.ctx === c) return graphRef.current;
    const dryIn = c.createGain();
    const wetIn = c.createGain();
    const convolver = c.createConvolver();
    if (!impulseRef.current) impulseRef.current = createImpulse(c, 1.9, 2.7);
    convolver.buffer = impulseRef.current;
    const wetTrim = c.createGain();
    wetTrim.gain.value = 0.22;
    const compressor = c.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 2.5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.22;
    const tilt = c.createBiquadFilter();
    tilt.type = "highshelf";
    tilt.frequency.value = 2400;
    tilt.gain.value = -2.5;
    const master = c.createGain();
    master.gain.value = 0.92;
    dryIn.connect(compressor);
    wetIn.connect(convolver);
    convolver.connect(wetTrim);
    wetTrim.connect(compressor);
    compressor.connect(tilt);
    tilt.connect(master);
    master.connect(c.destination);
    graphRef.current = { ctx: c, dryIn, wetIn };
    return graphRef.current;
  }, [createImpulse, getCtx]);
  const connectVoice = useCallback((ctx, source, dryLevel, wetLevel, panValue) => {
    const graph = ensureGraph();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const drySend = ctx.createGain();
    const wetSend = ctx.createGain();
    drySend.gain.value = dryLevel;
    wetSend.gain.value = wetLevel;
    if (pan) {
      pan.pan.value = panValue;
      source.connect(pan);
      pan.connect(drySend);
      pan.connect(wetSend);
    } else {
      source.connect(drySend);
      source.connect(wetSend);
    }
    drySend.connect(graph.dryIn);
    wetSend.connect(graph.wetIn);
    return { drySend, wetSend, pan };
  }, [ensureGraph]);
  const strikeNoise = useCallback((ctx, start, duration, brightness, level, dryLevel, wetLevel, panValue) => {
    if (!noiseRef.current) noiseRef.current = createNoiseBuffer(ctx, 0.09);
    const source = ctx.createBufferSource();
    source.buffer = noiseRef.current;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = brightness;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(level, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    connectVoice(ctx, gain, dryLevel, wetLevel, panValue);
    source.start(start);
    source.stop(start + duration + 0.02);
  }, [connectVoice, createNoiseBuffer]);
  const playVoice = useCallback((freq, duration, presetName) => {
    try {
      const c = getCtx();
      ensureGraph();
      const now = c.currentTime;
      const preset = presetName === "success" ? {
        attack: 0.005,
        decay: 0.22,
        sustain: 0.10,
        release: Math.max(0.24, duration * 0.9),
        filter: Math.min(5400, freq * 12),
        dry: 0.95,
        wet: 0.30,
        body: 0.44,
        noise: 0.015,
        partials: [
          { mult: 1, type: "sine", gain: 1, detune: -1.5 },
          { mult: 2, type: "triangle", gain: 0.24, detune: 1.5 },
          { mult: 3, type: "sine", gain: 0.11, detune: -2.2 },
          { mult: 4, type: "sine", gain: 0.05, detune: 2.6 }
        ]
      } : presetName === "fail" ? {
        attack: 0.004,
        decay: 0.12,
        sustain: 0.03,
        release: Math.max(0.18, duration * 0.55),
        filter: Math.min(1500, freq * 5.5),
        dry: 0.96,
        wet: 0.10,
        body: 0.32,
        noise: 0.008,
        partials: [
          { mult: 1, type: "triangle", gain: 1, detune: 0 },
          { mult: 1.5, type: "sine", gain: 0.10, detune: -2.5 },
          { mult: 2, type: "sine", gain: 0.05, detune: 1.4 }
        ]
      } : {
        attack: 0.007,
        decay: 0.24,
        sustain: 0.10,
        release: Math.max(0.30, duration * 0.85),
        filter: Math.min(4200, freq * 10),
        dry: 0.98,
        wet: 0.22,
        body: 0.42,
        noise: 0.018,
        partials: [
          { mult: 1, type: "sine", gain: 1, detune: -0.8 },
          { mult: 2, type: "triangle", gain: 0.22, detune: 1.4 },
          { mult: 3, type: "sine", gain: 0.10, detune: -1.8 },
          { mult: 4, type: "sine", gain: 0.04, detune: 2.2 }
        ]
      };
      const voiceGain = c.createGain();
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(preset.filter, now);
      filter.Q.value = 0.7;
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(preset.body, now + preset.attack);
      voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, preset.body * preset.sustain), now + preset.attack + preset.decay);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + preset.release);
      filter.connect(voiceGain);
      const panValue = presetName === "success" ? (Math.random() * 0.24 - 0.12) : (Math.random() * 0.12 - 0.06);
      connectVoice(c, voiceGain, preset.dry, preset.wet, panValue);
      preset.partials.forEach(function(partial) {
        const osc = c.createOscillator();
        const oscGain = c.createGain();
        osc.type = partial.type;
        osc.frequency.setValueAtTime(freq * partial.mult, now);
        osc.detune.setValueAtTime(partial.detune || 0, now);
        oscGain.gain.value = preset.body * partial.gain;
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start(now);
        osc.stop(now + duration + preset.release + 0.06);
      });
      if (presetName === "lesson" || presetName === "success") {
        strikeNoise(c, now, 0.03, Math.min(5200, freq * 14), preset.noise, preset.dry * 0.7, preset.wet * 1.4, panValue);
      }
    } catch (e) {
    }
  }, [connectVoice, ensureGraph, getCtx, strikeNoise]);
  const playNote = useCallback((freq, dur = 0.55, type = "triangle") => {
    const preset = type === "sine" ? "success" : type === "sawtooth" ? "fail" : "lesson";
    playVoice(freq, dur, preset);
  }, [playVoice]);
  const playSuccess = useCallback(() => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach(function(f, i) {
      setTimeout(function() { playVoice(f, 0.22 + i * 0.02, "success"); }, i * 95);
    });
    setTimeout(function() { playVoice(1318.51, 0.18, "success"); }, 320);
  }, [playVoice]);
  const playFail = useCallback(() => {
    [261.63, 220, 196].forEach(function(f, i) {
      setTimeout(function() { playVoice(f, 0.15, "fail"); }, i * 105);
    });
  }, [playVoice]);
  return { playNote, playSuccess, playFail };
}
function genGeneral(level, qi) {
  if (level === 0) {
    const pool2 = [
      () => {
        const n = pick(NOTE_NAMES);
        return { q: "What note is shown on the staff?", visual: "staff", staffNote: { name: n }, answer: n, options: shuffle([n, ...wrongOpts(n, NOTE_NAMES)]), hint: "Lines: E-G-B-D-F. Spaces: F-A-C-E.", noteToPlay: n + "4" };
      },
      () => {
        const durs = [["Whole Note", "4", "\u{1D15D}"], ["Half Note", "2", "\u{1D157}\u{1D165}"], ["Quarter Note", "1", "\u2669"], ["Eighth Note", "0.5", "\u266A"]];
        const d = pick(durs);
        return { q: "How many beats does a " + d[0] + " get in 4/4?", visual: "noteSymbol", symbol: d[2], answer: d[1], options: shuffle(durs.map((x) => x[1])), hint: "Whole=4, Half=2, Quarter=1, Eighth=0.5", explanation: "Each note type is half the duration of the one above: whole(4) > half(2) > quarter(1) > eighth(0.5)." };
      },
      () => {
        const durs = [["Whole Note", "\u{1D15D}"], ["Half Note", "\u{1D157}\u{1D165}"], ["Quarter Note", "\u2669"], ["Eighth Note", "\u266A"]];
        const d = pick(durs);
        return { q: "What type of note is this? " + d[1], visual: "noteSymbol", symbol: d[1], answer: d[0], options: shuffle(durs.map((x) => x[0])), hint: "Look at the note head and stem!" };
      },
      () => {
        const rests = [["Whole Rest", "4 beats of silence"], ["Half Rest", "2 beats of silence"], ["Quarter Rest", "1 beat of silence"]];
        const r = pick(rests);
        return { q: "A " + r[0] + " means...", visual: "none", answer: r[1], options: shuffle(rests.map((x) => x[1])), hint: "Rests mirror note values: whole=4, half=2, quarter=1." };
      },
      () => ({ q: "The lines of the treble clef spell...", visual: "none", answer: "E-G-B-D-F", options: shuffle(["E-G-B-D-F", "F-A-C-E", "G-B-D-F-A", "D-F-A-C-E"]), hint: "Every Good Boy Does Fine!" }),
      () => ({ q: "The spaces of the treble clef spell...", visual: "none", answer: "F-A-C-E", options: shuffle(["F-A-C-E", "E-G-B-D-F", "A-C-E-G", "G-B-D-F"]), hint: "The spaces spell FACE!" }),
      () => {
        const pairs = [["C", "D", 2], ["E", "F", 1], ["B", "C", 1], ["A", "B", 2], ["F", "G", 2]];
        const p = pick(pairs);
        const ans = p[2] === 1 ? "Half step" : "Whole step";
        return { q: "From " + p[0] + " to " + p[1] + " is a...", visual: "none", answer: ans, options: shuffle(["Half step", "Whole step"]), hint: "E-F and B-C are the only natural half steps.", explanation: "E-F and B-C have no black key between them = half steps. All other white key pairs have a black key between them = whole steps." };
      },
      () => {
        const sums = [{ q: "A half note + a quarter note = how many beats?", a: "3" }, { q: "Two quarter notes = how many beats?", a: "2" }, { q: "A whole note = how many quarter notes?", a: "4" }, { q: "Two half notes = how many beats?", a: "4" }];
        const s = pick(sums);
        return { q: s.q, visual: "none", answer: s.a, options: shuffle(["1", "2", "3", "4"]), hint: "Add up the beat values!" };
      },
      () => {
        const n1 = pick(NOTE_NAMES);
        const idx = NOTE_NAMES.indexOf(n1);
        const n2 = NOTE_NAMES[(idx + 1) % 7];
        return { q: "What note comes after " + n1 + " in the musical alphabet?", visual: "none", answer: n2, options: shuffle([n2, ...wrongOpts(n2, NOTE_NAMES)]), hint: "Musical alphabet: A-B-C-D-E-F-G, then repeats." };
      },
      () => ({ q: "How many notes are in the musical alphabet?", visual: "none", answer: "7", options: shuffle(["7", "8", "12", "26"]), hint: "A-B-C-D-E-F-G. Only 7 letter names!" })
    ];
    return pick(pool2)();
  }
  if (level === 1) {
    const pool2 = [
      () => {
        const ivs = ["Major 2nd", "Major 3rd", "Perfect 4th", "Perfect 5th", "Octave"];
        const iv = pick(ivs), sem = INTERVALS[iv];
        const ni = pick([0, 2, 4, 5, 7, 9, 11]);
        const r = CHROMATIC[ni], t = CHROMATIC[(ni + sem) % 12];
        return { q: "What interval is from " + r + " to " + t + "?", visual: "intervalPair", notes: [r, t], answer: iv, options: shuffle([iv, ...wrongOpts(iv, ivs)]), hint: iv + " = " + sem + " semitones.", explanation: "From " + r + " to " + t + " is " + sem + " semitones = " + iv + "." };
      },
      () => {
        const isMin = Math.random() > 0.5;
        const root2 = pick(["C", "D", "E", "F", "G", "A"]);
        const pat = isMin ? [2, 1, 2, 2, 1, 2, 2] : [2, 2, 1, 2, 2, 2, 1];
        const st = isMin ? "Minor" : "Major";
        const w = [isMin ? "Major" : "Minor", "Chromatic", "Pentatonic"];
        return { q: "Pattern " + pat.join("-") + " from " + root2 + " = which scale?", visual: "scalePattern", pattern: pat, answer: root2 + " " + st, options: shuffle([root2 + " " + st, ...w.map((x) => root2 + " " + x)]), hint: "Major: W-W-H-W-W-W-H. Minor: W-H-W-W-H-W-W.", explanation: "Major = Whole-Whole-Half-Whole-Whole-Whole-Half. Minor = Whole-Half-Whole-Whole-Half-Whole-Whole." };
      },
      () => {
        const n = pick(NOTE_NAMES), acc = pick(["sharp", "flat"]);
        const idx = CHROMATIC.indexOf(n);
        const pool3 = acc === "sharp" ? CHROMATIC : CHROMATIC_FLAT;
        const res = acc === "sharp" ? pool3[(idx + 1) % 12] : pool3[(idx - 1 + 12) % 12];
        return { q: "What note is " + n + " " + (acc === "sharp" ? "\u266F" : "\u266D") + "?", visual: "none", answer: res, options: shuffle([res, ...wrongOpts(res, pool3)]), hint: "Sharp = half step up. Flat = half step down.", explanation: n + " " + (acc === "sharp" ? "sharp = one semitone up" : "flat = one semitone down") + " = " + res + "." };
      },
      () => {
        const enh = [{ n: "C#", e: "Db" }, { n: "D#", e: "Eb" }, { n: "F#", e: "Gb" }, { n: "G#", e: "Ab" }, { n: "A#", e: "Bb" }];
        const p = pick(enh);
        const ask = Math.random() > 0.5;
        return { q: (ask ? p.n : p.e) + " is the same note as...?", visual: "none", answer: ask ? p.e : p.n, options: shuffle([ask ? p.e : p.n, ...wrongOpts(ask ? p.e : p.n, CHROMATIC)]), hint: "Enharmonic equivalents: same pitch, different name!" };
      },
      () => ({ q: "How many semitones in a whole step?", visual: "none", answer: "2", options: shuffle(["1", "2", "3", "4"]), hint: "A whole step = 2 half steps." }),
      () => ({ q: "How many notes in a chromatic scale?", visual: "none", answer: "12", options: shuffle(["7", "8", "10", "12"]), hint: "The chromatic scale includes every semitone." }),
      () => ({ q: "How many notes in a major or minor scale?", visual: "none", answer: "7", options: shuffle(["5", "6", "7", "8"]), hint: "Major and minor scales have 7 unique notes." }),
      () => {
        const degrees = [{ num: "1st", name: "Tonic" }, { num: "5th", name: "Dominant" }, { num: "4th", name: "Subdominant" }, { num: "7th", name: "Leading tone" }];
        const d = pick(degrees);
        return { q: "The " + d.num + " degree of a scale is called the...", visual: "none", answer: d.name, options: shuffle(degrees.map((x) => x.name)), hint: "Tonic=1st, Subdominant=4th, Dominant=5th." };
      }
    ];
    return pick(pool2)();
  }
  if (level === 2) {
    const pool2 = [
      () => {
        const ct = pick(["Major", "Minor", "Diminished"]);
        const root2 = pick(["C", "D", "E", "F", "G", "A"]);
        const ri = CHROMATIC.indexOf(root2);
        const cn = CHORD_TYPES[ct].map((i) => CHROMATIC[(ri + i) % 12]);
        const w = wrongOpts(ct, ["Major", "Minor", "Diminished", "Augmented"]);
        return { q: "The notes " + cn.join(" - ") + " form what chord type?", visual: "pianoChord", chordNotes: cn, answer: root2 + " " + ct, options: shuffle([root2 + " " + ct, ...w.map((x) => root2 + " " + x)]), hint: "Major=R+M3+P5. Minor=R+m3+P5.", explanation: "Major = root + major 3rd (4 semitones) + perfect 5th. Minor = root + minor 3rd (3 semitones) + perfect 5th." };
      },
      () => {
        const s = pick(TIME_SIGS);
        return { q: 'Which time signature: "' + s.desc + '"?', visual: "timeSig", timeSig: s, answer: s.name, options: shuffle(TIME_SIGS.map((x) => x.name)), hint: "Top = beats per measure." };
      },
      () => {
        const s = pick(KEY_SIGS);
        const label = s.sharps > 0 ? s.sharps + " sharp(s)" + (s.acc ? " (" + s.acc.join(", ") + ")" : "") : s.flats > 0 ? s.flats + " flat(s)" + (s.acc ? " (" + s.acc.join(", ") + ")" : "") : "No sharps or flats";
        return { q: "Key signature with " + label + " = ?", visual: "keySig", keySig: s, answer: s.key, options: shuffle([s.key, ...wrongOpts(s.key, KEY_SIGS.map((x) => x.key))]), hint: "Last sharp = half step below major key." };
      },
      () => ({ q: "What does a dot after a note do?", visual: "none", answer: "Adds half the note's value", options: shuffle(["Adds half the note's value", "Doubles it", "Makes it staccato", "Makes it louder"]), hint: "Dotted half note = 2 + 1 = 3 beats." }),
      () => ({ q: "What is a triad?", visual: "none", answer: "A 3-note chord built in thirds", options: shuffle(["A 3-note chord built in thirds", "Any 3 notes", "A chord with 3 sharps", "A 3-note scale"]), hint: "Tri = three. A true triad is built by stacking thirds.", explanation: "A triad stacks two thirds: root, 3rd, and 5th." }),
      () => ({ q: "What is syncopation?", visual: "none", answer: "Emphasizing off-beats or weak beats", options: shuffle(["Emphasizing off-beats or weak beats", "Playing very fast", "Changing key", "Skipping notes"]), hint: "Syncopation creates rhythmic surprise!" }),
      () => {
        const ct = pick(["Major", "Minor"]);
        const root2 = pick(["C", "D", "E", "F", "G", "A"]);
        const ri = CHROMATIC.indexOf(root2);
        const cn = CHORD_TYPES[ct].map((i) => CHROMATIC[(ri + i) % 12]);
        return { q: "What is the root note of " + cn.join(" - ") + "?", visual: "none", answer: root2, options: shuffle([root2, ...wrongOpts(root2, NOTE_NAMES)]), hint: "The root is the note the chord is built on." };
      },
      () => {
        const qs = [{ q: "In 4/4 time, how many quarter-note beats per measure?", a: "4" }, { q: "In 3/4 time, how many quarter-note beats per measure?", a: "3" }, { q: "In 6/8 time, eighth notes are grouped in sets of...", a: "3" }, { q: "In 2/4 time, how many quarter-note beats per measure?", a: "2" }];
        const q = pick(qs);
        return { q: q.q, visual: "none", answer: q.a, options: shuffle(["2", "3", "4", "6"]), hint: "Simple time: top = beats. Compound time (6/8): grouped in 3s." };
      }
    ];
    return pick(pool2)();
  }
  const pool = [
    () => {
      const p = pick(PROGRESSIONS);
      return { q: p.chords.join(" -> ") + " in C = which progression?", visual: "progression", progression: p, answer: p.name, options: shuffle([p.name, ...wrongOpts(p.name, PROGRESSIONS.map((x) => x.name))]), hint: p.desc };
    },
    () => {
      const ct = pick(["Major 7th", "Minor 7th", "Dominant 7th"]);
      const root2 = pick(["C", "G", "F"]);
      const ri = CHROMATIC.indexOf(root2);
      const cn = CHORD_TYPES[ct].map((i) => CHROMATIC[(ri + i) % 12]);
      const w = wrongOpts(ct, ["Major 7th", "Minor 7th", "Dominant 7th", "Diminished 7th"]);
      return { q: cn.join(" - ") + " = which 7th chord?", visual: "pianoChord", chordNotes: cn, answer: root2 + " " + ct, options: shuffle([root2 + " " + ct, ...w.map((x) => root2 + " " + x)]), hint: "Maj7=maj+M7. Dom7=maj+m7." };
    },
    () => {
      const pairs = [["C Major", "A Minor"], ["G Major", "E Minor"], ["D Major", "B Minor"], ["F Major", "D Minor"]];
      const pr = pick(pairs), askMaj = Math.random() > 0.5;
      const qk = askMaj ? pr[0] : pr[1], ak = askMaj ? pr[1] : pr[0];
      const wp = shuffle(pairs.filter((p) => p[0] !== pr[0])).slice(0, 3).map((p) => askMaj ? p[1] : p[0]);
      return { q: "Relative " + (askMaj ? "minor" : "major") + " of " + qk + "?", visual: "circleOfFifths", answer: ak, options: shuffle([ak, ...wp]), hint: "Relative major and minor share a key signature. The relative minor is 3 semitones below its major." };
    },
    () => ({ q: "What is a tritone?", visual: "none", answer: "An interval of 6 semitones", options: shuffle(["An interval of 6 semitones", "3 semitones", "A chord type", "A 3-note scale"]), hint: "The tritone divides the octave exactly in half." }),
    () => ({ q: "What is modulation?", visual: "none", answer: "Changing key within a piece", options: shuffle(["Changing key within a piece", "Playing louder", "Changing tempo", "Adding harmony"]), hint: "Songs often modulate up for the final chorus!" }),
    () => {
      const cads = [{ name: "Perfect (Authentic)", desc: "V -> I, sounds finished" }, { name: "Plagal", desc: "IV -> I, the Amen cadence" }, { name: "Half", desc: "Ends on V, sounds unfinished" }, { name: "Deceptive", desc: "V -> vi, surprising" }];
      const c = pick(cads);
      return { q: 'Which cadence: "' + c.desc + '"?', visual: "none", answer: c.name, options: shuffle(cads.map((x) => x.name)), hint: "Cadences are how phrases end." };
    },
    () => {
      const m = pick(MODES);
      return { q: 'Which mode is often described as "' + m.mood + '"?', visual: "none", answer: m.name, options: shuffle([m.name, ...wrongOpts(m.name, MODES.map((x) => x.name))]), hint: "Each mode has a unique emotional colour." };
    }
  ];
  return pick(pool)();
}
function genPiano(level, qi) {
  if (level === 0) {
    const pool2 = [
      () => {
        const n = pick(NOTE_NAMES);
        return { q: "What note is this key on the piano?", visual: "keyboard", highlightNotes: [n], answer: n, options: shuffle([n, ...wrongOpts(n, NOTE_NAMES)]), hint: "C is left of the 2 black keys. F is left of the 3 black keys." };
      },
      () => {
        const gs = [{ q: "How many black keys in the LEFT group?", a: "2", opts: ["1", "2", "3", "4"] }, { q: "How many black keys in the RIGHT group?", a: "3", opts: ["1", "2", "3", "4"] }, { q: "How many white keys in one octave?", a: "7", opts: ["5", "6", "7", "8"] }, { q: "How many black keys in one octave?", a: "5", opts: ["4", "5", "6", "7"] }, { q: "How many keys on a standard piano?", a: "88", opts: ["76", "85", "88", "92"] }];
        const g = pick(gs);
        return { q: g.q, visual: "keyboard", highlightNotes: [], answer: g.a, options: shuffle(g.opts), hint: "Black keys: groups of 2 and 3." };
      },
      () => {
        const ps = [["C", "D", "right"], ["D", "E", "right"], ["E", "F", "right"], ["F", "G", "right"], ["G", "A", "right"], ["A", "B", "right"], ["B", "A", "left"], ["D", "C", "left"]];
        const p = pick(ps);
        return { q: "What white key is to the " + p[2] + " of " + p[0] + "?", visual: "none", answer: p[1], options: shuffle([p[1], ...wrongOpts(p[1], NOTE_NAMES)]), hint: "White keys: C-D-E-F-G-A-B." };
      },
      () => ({ q: "The 2 black keys help you find which notes?", visual: "keyboard", highlightNotes: ["C#", "D#"], answer: "C, D, and E", options: shuffle(["C, D, and E", "F, G, A, and B", "A and B", "D and E"]), hint: "C is directly left of the 2 black keys." }),
      () => ({ q: "The 3 black keys help you find which notes?", visual: "keyboard", highlightNotes: ["F#", "G#", "A#"], answer: "F, G, A, and B", options: shuffle(["F, G, A, and B", "C, D, and E", "A, B, and C", "E, F, and G"]), hint: "F is directly left of the 3 black keys." }),
      () => ({ q: "Where is Middle C?", visual: "none", answer: "Near the center of the keyboard", options: shuffle(["Near the center of the keyboard", "The very first key", "The very last key", "The lowest C"]), hint: "Middle C sits between the bass and treble staves." })
    ];
    return pick(pool2)();
  }
  if (level === 1) {
    const pool2 = [
      () => {
        const bks = [{ between: "C and D", answer: "C# / Db" }, { between: "D and E", answer: "D# / Eb" }, { between: "F and G", answer: "F# / Gb" }, { between: "G and A", answer: "G# / Ab" }, { between: "A and B", answer: "A# / Bb" }];
        const bk = pick(bks);
        return { q: "What is the black key between " + bk.between + "?", visual: "none", answer: bk.answer, options: shuffle([bk.answer, ...wrongOpts(bk.answer, bks.map((x) => x.answer))]), hint: "Each black key has two names!" };
      },
      () => ({ q: "All white keys from C to C = which scale?", visual: "keyboard", highlightNotes: NOTE_NAMES, answer: "C Major", options: shuffle(["C Major", "C Minor", "C Chromatic", "C Pentatonic"]), hint: "C Major uses only white keys!" }),
      () => {
        const fs = [{ q: "What finger number is the thumb?", a: "1", opts: ["0", "1", "2", "5"] }, { q: "What finger number is the pinky?", a: "5", opts: ["3", "4", "5", "6"] }, { q: "What finger number is the middle finger?", a: "3", opts: ["2", "3", "4", "5"] }];
        const f = pick(fs);
        return { q: f.q, visual: "none", answer: f.a, options: shuffle(f.opts), hint: "1=thumb, 2=index, 3=middle, 4=ring, 5=pinky." };
      },
      () => {
        const pairs = [["E", "F"], ["B", "C"]];
        const p = pick(pairs);
        return { q: p[0] + " to " + p[1] + " is what kind of step?", visual: "none", answer: "Half step", options: shuffle(["Half step", "Whole step", "Two half steps", "An octave"]), hint: "E-F and B-C have no black key between them!" };
      },
      () => ({ q: "What is an octave on the piano?", visual: "none", answer: "From one note to the next note with the same name", options: shuffle(["From one note to the next note with the same name", "Any 8 notes", "8 chords", "A type of chord"]), hint: "Oct = 8. C to the next C is one octave.", explanation: "An octave goes from one note to the next note with the same name, such as C to the next C. On a piano that spans 12 semitones." }),
      () => {
        const n = pick(NOTE_NAMES);
        const idx = CHROMATIC.indexOf(n);
        const sharp = CHROMATIC[(idx + 1) % 12];
        return { q: n + " sharp is which note?", visual: "none", answer: sharp, options: shuffle([sharp, ...wrongOpts(sharp, CHROMATIC)]), hint: "Sharp = the very next semitone up." };
      },
      () => ({ q: "Which two pairs of white keys have NO black key between them?", visual: "none", answer: "E-F and B-C", options: shuffle(["E-F and B-C", "C-D and F-G", "A-B and D-E", "G-A and C-D"]), hint: "These are the natural half steps!" })
    ];
    return pick(pool2)();
  }
  if (level === 2) {
    const pool2 = [
      () => {
        const invs = [{ name: "Root position", chord: "C Major", notes: ["C", "E", "G"] }, { name: "1st inversion", chord: "C Major", notes: ["E", "G", "C"] }, { name: "2nd inversion", chord: "C Major", notes: ["G", "C", "E"] }, { name: "Root position", chord: "G Major", notes: ["G", "B", "D"] }, { name: "1st inversion", chord: "G Major", notes: ["B", "D", "G"] }, { name: "Root position", chord: "A Minor", notes: ["A", "C", "E"] }, { name: "1st inversion", chord: "A Minor", notes: ["C", "E", "A"] }, { name: "2nd inversion", chord: "F Major", notes: ["C", "F", "A"] }, { name: "Root position", chord: "D Minor", notes: ["D", "F", "A"] }];
        const inv = pick(invs);
        return { q: inv.chord + ": " + inv.notes.join("-") + " (bottom to top) = which inversion?", visual: "noteStack", stackNotes: inv.notes, answer: inv.name, options: shuffle(["Root position", "1st inversion", "2nd inversion"]), hint: "Root=root on bottom. 1st=3rd on bottom. 2nd=5th on bottom." };
      },
      () => {
        const bns = [{ line: "1st (bottom)", note: "G" }, { line: "2nd", note: "B" }, { line: "3rd", note: "D" }, { line: "4th", note: "F" }, { line: "5th (top)", note: "A" }];
        const bn = pick(bns);
        return { q: "Bass clef " + bn.line + " line = ?", visual: "bassClef", answer: bn.note, options: shuffle([bn.note, ...wrongOpts(bn.note, NOTE_NAMES)]), hint: "Good Boys Do Fine Always." };
      },
      () => {
        const bsps = [{ space: "1st (bottom)", note: "A" }, { space: "2nd", note: "C" }, { space: "3rd", note: "E" }, { space: "4th (top)", note: "G" }];
        const bs = pick(bsps);
        return { q: "Bass clef " + bs.space + " space = ?", visual: "bassClef", answer: bs.note, options: shuffle([bs.note, ...wrongOpts(bs.note, NOTE_NAMES)]), hint: "All Cows Eat Grass." };
      },
      () => {
        const qs = [{ q: "Which hand usually plays treble clef?", a: "Usually the right hand" }, { q: "Which hand usually plays bass clef?", a: "Usually the left hand" }, { q: "What does the sustain pedal do?", a: "Lets notes ring after release" }, { q: "What does the soft pedal do?", a: "Makes sound quieter and softer" }];
        const q = pick(qs);
        const opts = ["Usually the right hand", "Usually the left hand", "Lets notes ring after release", "Makes sound quieter and softer"];
        return { q: q.q, visual: "none", answer: q.a, options: shuffle(opts), hint: "On beginner piano pieces, treble is usually in the right hand and bass is usually in the left." };
      },
      () => ({ q: "What is sight-reading?", visual: "none", answer: "Playing music you haven't seen before", options: shuffle(["Playing music you haven't seen before", "Reading about music", "Playing from memory", "Playing by ear"]), hint: "A key skill for piano exams!" }),
      () => ({ q: "What is a ledger line?", visual: "none", answer: "A short line for notes above or below the staff", options: shuffle(["A short line for notes above or below the staff", "The top staff line", "A bar line", "A rest"]), hint: "Middle C uses a ledger line." })
    ];
    return pick(pool2)();
  }
  const pool = [
    () => {
      const vs = [{ q: "What is an arpeggio?", a: "Playing chord notes one at a time" }, { q: "What does staccato mean?", a: "Short, detached notes" }, { q: "What does legato mean?", a: "Smooth and connected notes" }, { q: "What is a fermata?", a: "Hold the note longer than written" }, { q: "What does D.C. al Fine mean?", a: "Go back to the beginning, play until Fine" }];
      const v = pick(vs);
      const allA = vs.map((x) => x.a);
      return { q: v.q, visual: "none", answer: v.a, options: shuffle([v.a, ...wrongOpts(v.a, allA)]), hint: "Important musical terms!" };
    },
    () => {
      const ds = [{ symbol: "pp", meaning: "Very soft" }, { symbol: "p", meaning: "Soft" }, { symbol: "mp", meaning: "Moderately soft" }, { symbol: "mf", meaning: "Moderately loud" }, { symbol: "f", meaning: "Loud" }, { symbol: "ff", meaning: "Very loud" }];
      const d = pick(ds);
      return { q: 'What does "' + d.symbol + '" mean?', visual: "none", answer: d.meaning, options: shuffle([d.meaning, ...wrongOpts(d.meaning, ds.map((x) => x.meaning))]), hint: "pp (softest) to ff (loudest)." };
    },
    () => {
      const tempos = [{ name: "Adagio", desc: "Slow" }, { name: "Andante", desc: "Walking pace" }, { name: "Allegro", desc: "Fast" }, { name: "Presto", desc: "Very fast" }, { name: "Moderato", desc: "Moderate speed" }, { name: "Largo", desc: "Very slow" }];
      const t = pick(tempos);
      return { q: '"' + t.name + '" means...', visual: "none", answer: t.desc, options: shuffle([t.desc, ...wrongOpts(t.desc, tempos.map((x) => x.desc))]), hint: "Italian tempo markings describe speed." };
    },
    () => ({ q: "What does crescendo mean?", visual: "none", answer: "Gradually get louder", options: shuffle(["Gradually get louder", "Get softer", "Get faster", "Get slower"]), hint: "Crescendo = growing. Diminuendo = shrinking." }),
    () => ({ q: "What does a tie between two notes do?", visual: "none", answer: "Connects them into one longer note", options: shuffle(["Connects them into one longer note", "Makes them staccato", "Changes pitch", "Adds a rest"]), hint: "Tied half + quarter = 3 beats." }),
    () => ({ q: "What is a repeat sign?", visual: "none", answer: "Play the section again", options: shuffle(["Play the section again", "Play louder", "Skip ahead", "Change key"]), hint: "Two dots and a double bar line mark repeats." })
  ];
  return pick(pool)();
}
function genGuitar(level, qi) {
  if (level === 0) {
    const pool2 = [
      () => ({ q: "Guitar strings from thickest to thinnest?", visual: "none", answer: "E-A-D-G-B-E", options: shuffle(["E-A-D-G-B-E", "E-B-G-D-A-E", "A-D-G-B-E-A", "E-A-D-G-C-E"]), hint: "Eddie Ate Dynamite, Good Bye Eddie!" }),
      () => {
        const s = pick([0, 1, 2, 3, 4, 5]);
        const names = ["6th (thickest)", "5th", "4th", "3rd", "2nd", "1st (thinnest)"];
        return { q: "What note does the open " + names[s] + " string play?", visual: "guitarStringsQuiz", highlightString: s, answer: GUITAR_OPEN[s], options: shuffle([GUITAR_OPEN[s], ...wrongOpts(GUITAR_OPEN[s], NOTE_NAMES)]), hint: "Eddie Ate Dynamite, Good Bye Eddie!" };
      },
      () => {
        const qs = [{ q: "How many strings on a standard guitar?", a: "6", opts: ["4", "5", "6", "8"] }, { q: "Each fret raises pitch by how much?", a: "One semitone", opts: ["One semitone", "One whole step", "One octave", "Two semitones"] }, { q: "Which is the lowest-sounding string?", a: "6th string", opts: ["6th string", "1st string", "5th string", "3rd string"] }, { q: "Which is the highest-sounding string?", a: "1st string", opts: ["1st string", "6th string", "2nd string", "3rd string"] }];
        const q = pick(qs);
        return { q: q.q, visual: "none", answer: q.a, options: shuffle(q.opts), hint: "6 strings: E-A-D-G-B-E." };
      },
      () => {
        const parts = [{ q: "What is the nut on a guitar?", a: "Piece at top of fretboard guiding strings" }, { q: "What are frets?", a: "Metal strips dividing the neck into semitones" }, { q: "What is the bridge?", a: "Piece on the body where strings are anchored" }, { q: "What is the sound hole for?", a: "Projects and amplifies the sound" }];
        const p = pick(parts);
        const allA = parts.map((x) => x.a);
        return { q: p.q, visual: "none", answer: p.a, options: shuffle([p.a, ...wrongOpts(p.a, allA)]), hint: "Learn the parts of your guitar!" };
      },
      () => ({ q: "What is standard tuning?", visual: "none", answer: "E-A-D-G-B-E", options: shuffle(["E-A-D-G-B-E", "D-A-D-G-B-E", "E-A-D-G-B-D", "D-G-D-G-B-D"]), hint: "The most common guitar tuning." }),
      () => {
        const s = pick([0, 1, 4, 5]);
        return { q: "Which string NUMBER is the " + GUITAR_OPEN[s] + " string" + (s === 0 ? " (thickest)" : s === 5 ? " (thinnest)" : "") + "?", visual: "none", answer: String(6 - s), options: shuffle([String(6 - s), ...wrongOpts(String(6 - s), ["1", "2", "3", "4", "5", "6"])]), hint: "Strings numbered 1 (thinnest) to 6 (thickest)." };
      }
    ];
    return pick(pool2)();
  }
  if (level === 1) {
    const pool2 = [
      () => {
        const cns = ["C", "G", "D", "Am", "Em", "E"];
        const cn = pick(cns);
        return { q: "What chord is shown in this diagram?", visual: "guitarChord", chordName: cn, answer: cn, options: shuffle([cn, ...wrongOpts(cn, cns)]), hint: "Notes: " + GUITAR_CHORDS[cn].notes };
      },
      () => {
        const s = pick([0, 1, 2, 3, 4, 5]);
        const f = pick([1, 2, 3, 4, 5]);
        const note = fretNote(GUITAR_OPEN_IDX[s], f);
        return { q: "Fret " + f + " on the " + GUITAR_OPEN[s] + " string = ?", visual: "fretboard", fretInfo: { string: s, fret: f }, answer: note, options: shuffle([note, ...wrongOpts(note, CHROMATIC)]), hint: "Start from open " + GUITAR_OPEN[s] + " and count up." };
      },
      () => {
        const qs = [{ q: "What is an open chord?", a: "Uses open (unfretted) strings" }, { q: "In tab, what does 0 mean?", a: "Play the open string" }, { q: "In tab, what do the 6 lines represent?", a: "The 6 guitar strings" }, { q: "Which tab line is the 1st (thinnest) string?", a: "The top line" }, { q: "What does x mean in tab?", a: "Mute or don't play that string" }];
        const q = pick(qs);
        const allA = qs.map((x) => x.a);
        return { q: q.q, visual: "none", answer: q.a, options: shuffle([q.a, ...wrongOpts(q.a, allA)]), hint: "Tab: lines = strings, numbers = frets." };
      },
      () => {
        const s = pick([0, 1, 2, 3, 4, 5]);
        const f = pick([2, 3, 5, 7]);
        const note = fretNote(GUITAR_OPEN_IDX[s], f);
        return { q: "What note is at fret " + f + " on string " + String(6 - s) + "?", visual: "fretboard", fretInfo: { string: s, fret: f }, answer: note, options: shuffle([note, ...wrongOpts(note, CHROMATIC)]), hint: "Each fret = 1 semitone up." };
      },
      () => ({ q: "What is strumming?", visual: "none", answer: "Brushing across multiple strings in one motion", options: shuffle(["Brushing across multiple strings in one motion", "Plucking one string", "Tapping the body", "Bending a string"]), hint: "Strumming can go down or up." }),
      () => ({ q: "What is a pick (plectrum)?", visual: "none", answer: "A small flat piece used to strike strings", options: shuffle(["A small flat piece used to strike strings", "A tuning tool", "A capo", "A chord type"]), hint: "Picks come in different thicknesses." })
    ];
    return pick(pool2)();
  }
  if (level === 2) {
    const pool2 = [
      () => {
        const qs = [{ q: "What is a barre chord?", a: "One finger presses all strings at a fret" }, { q: "A power chord has which intervals?", a: "Root and perfect 5th" }, { q: "What does x mean in a chord diagram?", a: "Don't play (mute) that string" }, { q: "What does o mean in a chord diagram?", a: "Play that string open" }];
        const q = pick(qs);
        const allA = qs.map((x) => x.a);
        return { q: q.q, visual: "none", answer: q.a, options: shuffle([q.a, ...wrongOpts(q.a, allA)]), hint: "Chord diagrams: x=mute, o=open." };
      },
      () => {
        const cf = pick([1, 2, 3, 4, 5]);
        const shape = pick(["C", "G", "D", "A", "E"]);
        const sr = CHROMATIC.indexOf(shape);
        const snd = CHROMATIC[(sr + cf) % 12];
        return { q: "Capo fret " + cf + ' + "' + shape + '" shape = ?', visual: "capo", capoFret: cf, shape, answer: snd, options: shuffle([snd, ...wrongOpts(snd, CHROMATIC)]), hint: "Count " + cf + " semitone(s) up from " + shape + "." };
      },
      () => {
        const rels = [[0, 5, "A"], [1, 5, "D"], [2, 5, "G"], [4, 5, "E"]];
        const r = pick(rels);
        return { q: "Fret 5 on " + GUITAR_OPEN[r[0]] + " string = same as open...?", visual: "none", answer: r[2] + " string", options: shuffle([r[2] + " string", ...wrongOpts(r[2] + " string", NOTE_NAMES.map((x) => x + " string"))]), hint: "Fret 5 usually matches the next open string." };
      },
      () => ({ q: "What does a capo do?", visual: "none", answer: "Raises pitch by barring a fret", options: shuffle(["Raises pitch by barring a fret", "Lowers pitch", "Changes tuning", "Mutes strings"]), hint: "A capo is like a permanent barre." }),
      () => {
        const cf = pick([1, 2, 3, 4, 5]);
        const shape = pick(["Am", "Em"]);
        const sr = CHROMATIC.indexOf(shape.replace("m", ""));
        const snd = CHROMATIC[(sr + cf) % 12] + "m";
        const all = CHROMATIC.map((n) => n + "m");
        return { q: "Capo fret " + cf + ' + "' + shape + '" shape = ?', visual: "capo", capoFret: cf, shape, answer: snd, options: shuffle([snd, ...wrongOpts(snd, all)]), hint: "Count " + cf + " semitone(s) up from " + shape.replace("m", "") + "." };
      },
      () => ({ q: "Why are barre chords useful?", visual: "none", answer: "Moveable - same shape works in any key", options: shuffle(["Moveable - same shape works in any key", "Easier than open chords", "Louder", "Use fewer fingers"]), hint: "Barre chords let you play in any key!" })
    ];
    return pick(pool2)();
  }
  const pool = [
    () => {
      const qs = [{ q: "In CAGED, what 5 shapes are used?", a: "C, A, G, E, D" }, { q: "What is alternate picking?", a: "Alternating down and upstrokes" }, { q: "What is a palm mute?", a: "Resting palm near bridge to dampen sound" }, { q: "What is a riff?", a: "A short, repeated musical phrase" }];
      const q = pick(qs);
      const allA = qs.map((x) => x.a);
      return { q: q.q, visual: "none", answer: q.a, options: shuffle([q.a, ...wrongOpts(q.a, allA)]), hint: "Advanced guitar techniques." };
    },
    () => {
      const qs = [{ q: "Fret 12 on any string produces?", a: "Same note, one octave higher" }, { q: "What is a hammer-on?", a: "Pressing a fret without picking" }, { q: "What is a pull-off?", a: "Lifting a finger to sound the note below" }, { q: "What is a slide?", a: "Moving a fretted finger along the neck" }, { q: "What are harmonics?", a: "Bell-like tones from lightly touching strings" }];
      const q = pick(qs);
      const allA = qs.map((x) => x.a);
      return { q: q.q, visual: "none", answer: q.a, options: shuffle([q.a, ...wrongOpts(q.a, allA)]), hint: "Legato techniques and fretboard tricks." };
    },
    () => {
      const cf = pick([2, 3, 4, 5, 7]);
      const shape = pick(["G", "C", "D", "A", "E"]);
      const sr = CHROMATIC.indexOf(shape);
      const snd = CHROMATIC[(sr + cf) % 12];
      return { q: "Capo fret " + cf + ', "' + shape + '" shape = what key?', visual: "capo", capoFret: cf, shape, answer: snd + " Major", options: shuffle([snd + " Major", ...wrongOpts(snd, CHROMATIC_FLAT).map((n) => n + " Major")]), hint: "Count " + cf + " semitones up from " + shape + "." };
    },
    () => ({ q: "What is fingerpicking?", visual: "none", answer: "Plucking individual strings with fingers", options: shuffle(["Plucking individual strings with fingers", "Using all fingers on one string", "Tapping the fretboard", "Barre chords"]), hint: "Lets you play melody and bass at once." }),
    () => ({ q: "What is Drop D tuning?", visual: "none", answer: "Lowering the 6th string from E to D", options: shuffle(["Lowering the 6th string from E to D", "Raising all strings", "Using only 5 strings", "A type of capo"]), hint: "Drop D = DADGBE. Popular in rock and metal." }),
    () => ({ q: "What is a chord inversion on guitar?", visual: "none", answer: "Playing the same chord with a different note as the lowest", options: shuffle(["Playing the same chord with a different note as the lowest", "Flipping the guitar", "Playing backwards", "Using a capo"]), hint: "C/E means C chord with E as the bass note." })
  ];
  return pick(pool)();
}
function genUkulele(level, qi) {
  if (level === 0) {
    const pool2 = [
      () => ({ q: "Ukulele strings (top to bottom)?", visual: "none", answer: "G-C-E-A", options: shuffle(["G-C-E-A", "A-E-C-G", "C-G-E-A", "E-A-C-G"]), hint: "Goats Can Eat Anything!" }),
      () => {
        const s = pick([0, 1, 2, 3]);
        const names = ["4th", "3rd", "2nd", "1st"];
        return { q: "What note does the open " + names[s] + " string play?", visual: "ukeStringsQuiz", highlightString: s, answer: UKE_OPEN[s], options: shuffle([UKE_OPEN[s], ...wrongOpts(UKE_OPEN[s], NOTE_NAMES)]), hint: "Goats Can Eat Anything!" };
      },
      () => {
        const qs = [{ q: "How many strings on a standard ukulele?", a: "4", opts: ["3", "4", "5", "6"] }, { q: "What is the smallest standard ukulele size?", a: "Soprano", opts: ["Soprano", "Concert", "Tenor", "Baritone"] }, { q: "Largest ukulele size?", a: "Baritone", opts: ["Soprano", "Concert", "Tenor", "Baritone"] }, { q: "Uke sizes smallest to largest?", a: "Soprano, Concert, Tenor, Baritone", opts: ["Soprano, Concert, Tenor, Baritone", "Concert, Soprano, Tenor, Baritone", "Tenor, Concert, Soprano, Baritone", "Baritone, Tenor, Concert, Soprano"] }];
        const q = pick(qs);
        return { q: q.q, visual: "none", answer: q.a, options: shuffle(q.opts), hint: "Soprano smallest, Baritone largest!" };
      },
      () => ({ q: "Which string is closest to the floor when playing?", visual: "none", answer: "1st string", options: shuffle(["1st string", "4th string (G)", "3rd string (C)", "2nd string (E)"]), hint: "Strings numbered from the bottom up." }),
      () => ({ q: "Ukulele strings are typically made from...", visual: "none", answer: "Nylon", options: shuffle(["Nylon", "Steel", "Copper", "Rubber"]), hint: "Nylon gives the uke its warm sound." }),
      () => ({ q: "What is standard ukulele tuning?", visual: "none", answer: "G-C-E-A", options: shuffle(["G-C-E-A", "E-A-D-G (like guitar)", "A-E-C-G", "C-F-A-D"]), hint: "Re-entrant = strings not low-to-high." })
    ];
    return pick(pool2)();
  }
  if (level === 1) {
    const pool2 = [
      () => {
        const cns = ["C", "G", "Am", "F", "Dm"];
        const cn = pick(cns);
        return { q: "What chord is shown in this diagram?", visual: "ukeChord", chordName: cn, answer: cn, options: shuffle([cn, ...wrongOpts(cn, cns)]), hint: "Notes: " + UKE_CHORDS[cn].notes };
      },
      () => {
        const s = pick([0, 1, 2, 3]);
        const f = pick([1, 2, 3]);
        const note = fretNote(UKE_OPEN_IDX[s], f);
        return { q: "Fret " + f + " on the " + UKE_OPEN[s] + " string = ?", visual: "none", answer: note, options: shuffle([note, ...wrongOpts(note, CHROMATIC)]), hint: "Count " + f + " semitone(s) up from " + UKE_OPEN[s] + "." };
      },
      () => ({ q: "What is special about the G string?", visual: "none", answer: "It's tuned higher than C and E", options: shuffle(["It's tuned higher than C and E", "Lowest-pitched string", "Always metal", "Optional"]), hint: "Re-entrant = strings not low-to-high!" }),
      () => ({ q: "Which ukulele chords need only one finger?", visual: "none", answer: "C and Am", options: shuffle(["C and Am", "G (3 fingers)", "Dm (3 fingers)", "F (2 fingers)"]), hint: "C and Am are often the easiest beginner chords." }),
      () => ({ q: "What direction is a downstrum?", visual: "none", answer: "Toward the floor", options: shuffle(["Toward the floor", "From A toward G", "Sideways", "Plucking one string"]), hint: "Down = toward the floor." }),
      () => ({ q: "What finger do most people strum with?", visual: "none", answer: "Index finger", options: shuffle(["Index finger", "Thumb", "Middle finger", "Pinky"]), hint: "Index finger brushes across near the sound hole." }),
      () => {
        const s = pick([0, 1, 2, 3]);
        const f = pick([3, 4, 5]);
        const note = fretNote(UKE_OPEN_IDX[s], f);
        return { q: "Fret " + f + " on the " + UKE_OPEN[s] + " string = ?", visual: "none", answer: note, options: shuffle([note, ...wrongOpts(note, CHROMATIC)]), hint: "Count " + f + " semitones up from " + UKE_OPEN[s] + "." };
      }
    ];
    return pick(pool2)();
  }
  if (level === 2) {
    const pool2 = [
      () => {
        const cf = pick([1, 2, 3, 4]);
        const shape = pick(["C", "G", "Am", "F"]);
        const sr = CHROMATIC.indexOf(shape.replace("m", ""));
        const snd = CHROMATIC_FLAT[(sr + cf) % 12];
        const isMin = shape.includes("m");
        const ans = snd + (isMin ? "m" : "");
        const all = CHROMATIC_FLAT.map((n) => n + (isMin ? "m" : ""));
        return { q: "Capo fret " + cf + ' + "' + shape + '" shape = ?', visual: "none", answer: ans, options: shuffle([ans, ...wrongOpts(ans, all)]), hint: "Count " + cf + " semitone(s) up." };
      },
      () => {
        const cns = ["C", "G", "Am", "F", "Dm", "G7"];
        const cn = pick(cns);
        return { q: "Identify the chord shown.", visual: "ukeChord", chordName: cn, answer: cn, options: shuffle([cn, ...wrongOpts(cn, cns)]), hint: "Notes: " + UKE_CHORDS[cn].notes };
      },
      () => {
        const qs = [{ q: "What is the island strum pattern?", a: "D-DU-UDU" }, { q: "What does D-DU-UDU mean?", a: "Down, Down-Up, Up-Down-Up" }];
        const q = pick(qs);
        const opts = ["D-DU-UDU", "All downstrokes", "D-U-D-U", "Down, Down-Up, Up-Down-Up"];
        return { q: q.q, visual: "none", answer: q.a, options: shuffle(opts), hint: "The most iconic uke rhythm!" };
      },
      () => ({ q: "What is a barre chord on ukulele?", visual: "none", answer: "One finger pressing all 4 strings at one fret", options: shuffle(["One finger pressing all 4 strings at one fret", "All open strings", "A chord with a capo", "Harmonics"]), hint: "Barre chords are moveable!" }),
      () => ({ q: "What does a capo do on ukulele?", visual: "none", answer: "Raises pitch by clamping across all strings", options: shuffle(["Raises pitch by clamping across all strings", "Lowers pitch", "Changes to guitar tuning", "Mutes strings"]), hint: "Play in different keys with same shapes!" }),
      () => {
        const cf = pick([2, 3, 4, 5]);
        const shape = pick(["C", "Am", "F"]);
        const sr = CHROMATIC.indexOf(shape.replace("m", ""));
        const snd = CHROMATIC_FLAT[(sr + cf) % 12];
        const isMin = shape.includes("m");
        const ans = snd + (isMin ? "m" : "");
        const all = CHROMATIC_FLAT.map((n) => n + (isMin ? "m" : ""));
        return { q: "Capo fret " + cf + ' + "' + shape + '" shape = ?', visual: "none", answer: ans, options: shuffle([ans, ...wrongOpts(ans, all)]), hint: "Count " + cf + " semitone(s) up." };
      }
    ];
    return pick(pool2)();
  }
  const pool = [
    () => {
      const c7s = [{ name: "Cmaj7", desc: "Like C but fret 2 on A" }, { name: "Am7", desc: "All open strings!" }, { name: "G7", desc: "Adds flat 7th to G" }, { name: "C7", desc: "Adds flat 7th to C" }];
      const ch = pick(c7s);
      return { q: "What chord is shown in this diagram?", visual: "ukeChord", chordName: ch.name, answer: ch.name, options: shuffle([ch.name, ...wrongOpts(ch.name, c7s.map((x) => x.name))]), hint: ch.desc };
    },
    () => {
      const qs = [{ q: "What is chord melody?", a: "Playing melody and chords simultaneously" }, { q: "What is a chunk?", a: "A percussive muted strum" }, { q: "What is fingerpicking on uke?", a: "Plucking strings with different fingers" }, { q: "What is a triplet strum?", a: "Three strums squeezed into one beat" }];
      const q = pick(qs);
      const allA = qs.map((x) => x.a);
      return { q: q.q, visual: "none", answer: q.a, options: shuffle([q.a, ...wrongOpts(q.a, allA)]), hint: "Advanced uke techniques!" };
    },
    () => {
      const ss = [{ shape: "Am barre at fret 2", answer: "Bm", hint: "A+2=B" }, { shape: "C barre at fret 2", answer: "D", hint: "C+2=D" }, { shape: "Am barre at fret 3", answer: "Cm", hint: "A+3=C" }, { shape: "C barre at fret 4", answer: "E", hint: "C+4=E" }, { shape: "Am barre at fret 5", answer: "Dm", hint: "A+5=D" }, { shape: "C barre at fret 5", answer: "F", hint: "C+5=F" }];
      const s = pick(ss);
      return { q: "Barre chord: " + s.shape + " = ?", visual: "none", answer: s.answer, options: shuffle([s.answer, ...wrongOpts(s.answer, ["Am", "Bm", "Cm", "Dm", "D", "E", "F", "G"])]), hint: s.hint };
    },
    () => ({ q: "What makes a 7th chord different from a triad?", visual: "none", answer: "It adds a 4th note - the 7th degree", options: shuffle(["It adds a 4th note - the 7th degree", "Uses 7 strings", "Played on fret 7", "Has 7 beats"]), hint: "Triads = 3 notes. 7th chords = 4 notes." }),
    () => ({ q: "What is a turnaround?", visual: "none", answer: "A chord sequence leading back to the start", options: shuffle(["A chord sequence leading back to the start", "Playing backwards", "A key change", "A tempo change"]), hint: "Turnarounds create smooth loops." }),
    () => ({ q: "A common uke strumming hand position is...", visual: "none", answer: "Over the spot where the neck meets the body", options: shuffle(["Over the spot where the neck meets the body", "Over the sound hole", "At the bridge", "At the nut"]), hint: "Many players strum near where the neck meets the body for a warm, clear tone." })
  ];
  return pick(pool)();
}
function generateQuestion(stream, level, qi) {
  var raw;
  if (stream === "general") raw = genGeneral(level, qi);
  else if (stream === "piano") raw = genPiano(level, qi);
  else if (stream === "guitar") raw = genGuitar(level, qi);
  else if (stream === "ukulele") raw = genUkulele(level, qi);
  else raw = genGeneral(level, qi);
  return Object.assign({ question: raw.q, visual: raw.visual || "none", answer: raw.answer, options: raw.options, hint: raw.hint || "" }, raw);
}
function StaffDisplay(props) {
  var note = props.note, width = props.width || 260, height = props.height || 140;
  var cr = useRef(null);
  useEffect(function() {
    var c = cr.current;
    if (!c) return;
    var ctx = c.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    c.width = width * dpr;
    c.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    var lg = 14, sy = 36;
    ctx.strokeStyle = "#e0d6f0";
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(28, sy + i * lg);
      ctx.lineTo(width - 16, sy + i * lg);
      ctx.stroke();
    }
    ctx.font = "48px serif";
    ctx.fillStyle = "#c9b8e8";
    ctx.fillText("\u{1D11E}", 30, sy + 4 * lg - 2);
    if (note) {
      var ns = { C: 10, D: 9, E: 8, F: 7, G: 6, A: 5, B: 4 };
      var steps = ns[note.name] || 6;
      var ny = sy + steps * (lg / 2);
      if (note.name === "C") {
        ctx.strokeStyle = "#e0d6f0";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(132, ny);
        ctx.lineTo(168, ny);
        ctx.stroke();
      }
      ctx.fillStyle = "#FFD166";
      ctx.beginPath();
      ctx.ellipse(150, ny, 10, 7, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FF9F1C";
      ctx.lineWidth = 2;
      ctx.stroke();
      var stemUp = steps >= 5;
      ctx.beginPath();
      if (stemUp) {
        ctx.moveTo(160, ny);
        ctx.lineTo(160, ny - 32);
      } else {
        ctx.moveTo(140, ny);
        ctx.lineTo(140, ny + 32);
      }
      ctx.strokeStyle = "#FFD166";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fillStyle = "#a89cc8";
    ctx.font = "10px monospace";
    ctx.fillText("Treble Clef", 85, height - 6);
  }, [note, width, height]);
  return /* @__PURE__ */ React.createElement("canvas", { ref: cr, style: { width, height, borderRadius: 10 } });
}
function PianoKB(props) {
  var hl = props.highlightNotes || [], width = props.width || 280, height = props.height || 90, hide = props.hideLabels;
  var wk = ["C", "D", "E", "F", "G", "A", "B"];
  var bk = { "C#": 0.65, "D#": 1.65, "F#": 3.65, "G#": 4.65, "A#": 5.65 };
  var kw = width / 7;
  return /* @__PURE__ */ React.createElement("div", { style: { position: "relative", width, height, margin: "0 auto" } }, wk.map(function(n, i) {
    var h = hl.includes(n);
    return /* @__PURE__ */ React.createElement("div", { key: n, style: { position: "absolute", left: i * kw, top: 0, width: kw - 2, height, background: h ? "#FFD166" : "#fff", border: "1px solid #ccc", borderRadius: "0 0 6px 6px", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 5, fontSize: 10, fontWeight: 700, color: h ? "#1a1a2e" : "#999" } }, hide ? "" : n);
  }), Object.entries(bk).map(function(entry) {
    var n = entry[0], p = entry[1], h = hl.includes(n);
    return /* @__PURE__ */ React.createElement("div", { key: n, style: { position: "absolute", left: p * kw, top: 0, width: kw * 0.6, height: height * 0.62, background: h ? "#FF6B6B" : "#1a1a2e", border: "1px solid #000", borderRadius: "0 0 4px 4px", zIndex: 2, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 3, fontSize: 8, fontWeight: 700, color: h ? "#fff" : "#666" } }, hide ? "" : n);
  }));
}
function ChordDiag(props) {
  var type = props.type, chordName = props.chordName, width = props.width || 140, height = props.height || 160;
  var isUke = type === "uke";
  var chData = isUke ? UKE_CHORDS[chordName] : GUITAR_CHORDS[chordName];
  var cr = useRef(null);
  useEffect(function() {
    var c = cr.current;
    if (!c || !chData) return;
    var ctx = c.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    c.width = width * dpr;
    c.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    var strings = isUke ? 4 : 6, frets = 4, sx = 22, sy = 28;
    var sg = (width - 44) / (strings - 1), fg = (height - 56) / frets;
    ctx.fillStyle = "#e0d6f0";
    ctx.fillRect(sx - 2, sy - 4, sg * (strings - 1) + 4, 4);
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1;
    for (var f = 0; f <= frets; f++) {
      ctx.beginPath();
      ctx.moveTo(sx, sy + f * fg);
      ctx.lineTo(sx + (strings - 1) * sg, sy + f * fg);
      ctx.stroke();
    }
    for (var s = 0; s < strings; s++) {
      ctx.beginPath();
      ctx.moveTo(sx + s * sg, sy);
      ctx.lineTo(sx + s * sg, sy + frets * fg);
      ctx.stroke();
    }
    chData.frets.forEach(function(fr, s2) {
      var x = sx + s2 * sg;
      if (fr === null) {
        ctx.fillStyle = "#FF6B6B";
        ctx.font = "13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("\u2715", x, sy - 8);
      } else if (fr === 0) {
        ctx.strokeStyle = "#4ECDC4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, sy - 8, 5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#FFD166";
        ctx.beginPath();
        ctx.arc(x, sy + (fr - 0.5) * fg, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    if (!props.hideLabel) {
      ctx.fillStyle = "#c9b8e8";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(chordName, width / 2, height - 4);
      ctx.fillStyle = "#888";
      ctx.font = "9px sans-serif";
      ctx.fillText(isUke ? "Ukulele" : "Guitar", width / 2, height - 17);
    } else {
      ctx.fillStyle = "#888";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("What chord?", width / 2, height - 4);
    }
  }, [chordName, chData, isUke, width, height]);
  return /* @__PURE__ */ React.createElement("canvas", { ref: cr, style: { width, height, borderRadius: 8 } });
}
function Visual(props) {
  var d = props.data;
  if (!d || d.visual === "none") return null;
  var v = d.visual;
  var box = { display: "flex", justifyContent: "center", alignItems: "center", minHeight: 60 };
  if (v === "staff" && d.staffNote) return /* @__PURE__ */ React.createElement("div", { style: box }, /* @__PURE__ */ React.createElement(StaffDisplay, { note: d.staffNote }));
  if (v === "noteSymbol") return /* @__PURE__ */ React.createElement("div", { style: Object.assign({}, box, { fontSize: 64, color: "#FFD166" }) }, d.symbol);
  if (v === "keyboard" && d.highlightNotes) return /* @__PURE__ */ React.createElement("div", { style: box }, /* @__PURE__ */ React.createElement(PianoKB, { highlightNotes: d.highlightNotes, hideLabels: true }));
  if (v === "pianoChord" && d.chordNotes) return /* @__PURE__ */ React.createElement("div", { style: box }, /* @__PURE__ */ React.createElement(PianoKB, { highlightNotes: d.chordNotes, hideLabels: true }));
  if (v === "noteStack" && d.stackNotes) return /* @__PURE__ */ React.createElement("div", { style: box }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column-reverse", gap: 4, alignItems: "center" } }, d.stackNotes.map(function(n, i) {
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { width: 52, height: 34, borderRadius: 8, background: i === 0 ? "linear-gradient(135deg,#FFD166,#FF9F1C)" : "linear-gradient(135deg,#4ECDC440,#4ECDC420)", border: i === 0 ? "2px solid #FFD166" : "2px solid #4ECDC4", display: "flex", alignItems: "center", justifyContent: "center", color: i === 0 ? "#1a1a2e" : "#4ECDC4", fontSize: 18, fontWeight: 700 } }, n);
  })), /* @__PURE__ */ React.createElement("div", { style: { color: "#888", fontSize: 9, marginTop: 6 } }, "Bottom note shown at bottom"));
  if (v === "guitarChord" && d.chordName) return /* @__PURE__ */ React.createElement("div", { style: box }, /* @__PURE__ */ React.createElement(ChordDiag, { type: "guitar", chordName: d.chordName, hideLabel: true }));
  if (v === "ukeChord" && d.chordName) return /* @__PURE__ */ React.createElement("div", { style: box }, /* @__PURE__ */ React.createElement(ChordDiag, { type: "uke", chordName: d.chordName, hideLabel: true }));
  if (v === "intervalPair" && d.notes) return /* @__PURE__ */ React.createElement("div", { style: Object.assign({}, box, { gap: 20 }) }, /* @__PURE__ */ React.createElement("div", { style: { width: 50, height: 50, borderRadius: 25, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, background: "#4ECDC430", color: "#4ECDC4", border: "2px solid #4ECDC4" } }, d.notes[0]), /* @__PURE__ */ React.createElement("div", { style: { color: "#666", fontSize: 24 } }, "\u2192"), /* @__PURE__ */ React.createElement("div", { style: { width: 50, height: 50, borderRadius: 25, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, background: "#FFD16630", color: "#FFD166", border: "2px solid #FFD166" } }, d.notes[1]));
  if (v === "scalePattern" && d.pattern) return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" } }, d.pattern.map(function(s, i) {
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { width: 32, height: 32, borderRadius: 7, background: s === 2 ? "#4ECDC425" : "#FF6B6B25", border: "2px solid " + (s === 2 ? "#4ECDC4" : "#FF6B6B"), display: "flex", alignItems: "center", justifyContent: "center", color: s === 2 ? "#4ECDC4" : "#FF6B6B", fontWeight: 700, fontSize: 14 } }, s === 2 ? "W" : "H");
  })), /* @__PURE__ */ React.createElement("div", { style: { color: "#888", fontSize: 10, marginTop: 6 } }, "W=Whole step H=Half step"));
  if (v === "timeSig" && d.timeSig) return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontSize: 38, fontWeight: 700, color: "#e0d6f0", lineHeight: 1 } }, /* @__PURE__ */ React.createElement("div", null, d.timeSig.top), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "3px solid #e0d6f0", width: 36, margin: "2px auto" } }), /* @__PURE__ */ React.createElement("div", null, d.timeSig.bottom));
  if (v === "keySig" && d.keySig) return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 38, color: "#FFD166", fontWeight: 700 } }, d.keySig.sharps > 0 ? "\u266F".repeat(d.keySig.sharps) : d.keySig.flats > 0 ? "\u266D".repeat(d.keySig.flats) : "\u266E"), d.keySig.acc && /* @__PURE__ */ React.createElement("div", { style: { color: "#a89cc8", fontSize: 12 } }, d.keySig.acc.join(", ")));
  if (v === "progression" && d.progression) return /* @__PURE__ */ React.createElement("div", { style: Object.assign({}, box, { gap: 6, flexWrap: "wrap" }) }, d.progression.chords.map(function(ch, i) {
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { padding: "8px 14px", borderRadius: 8, background: "#C77DFF20", border: "2px solid #C77DFF50", color: "#C77DFF", fontSize: 18, fontWeight: 700 } }, ch);
  }));
  if (v === "mode" && d.mode) return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 3, justifyContent: "center" } }, d.mode.pattern.map(function(s, i) {
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { width: 28, height: 28, borderRadius: 5, background: s === 2 ? "#C77DFF20" : "#4ECDC420", border: "2px solid " + (s === 2 ? "#C77DFF" : "#4ECDC4"), display: "flex", alignItems: "center", justifyContent: "center", color: s === 2 ? "#C77DFF" : "#4ECDC4", fontWeight: 700, fontSize: 12 } }, s);
  })), /* @__PURE__ */ React.createElement("div", { style: { color: "#a89cc8", fontSize: 11, fontStyle: "italic", marginTop: 6 } }, '"' + d.mode.mood + '"'));
  if (v === "circleOfFifths") return /* @__PURE__ */ React.createElement("div", { style: { width: 100, height: 100, borderRadius: 50, border: "3px solid #C77DFF40", background: "radial-gradient(circle,#C77DFF10,transparent)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#888" } }, "Circle of"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, color: "#C77DFF", fontWeight: 700 } }, "5ths"));
  if (v === "guitarStrings") return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, GUITAR_OPEN.map(function(n, i) {
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "3px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#888", fontSize: 10, width: 20 } }, 6 - i), /* @__PURE__ */ React.createElement("div", { style: { width: 160, height: i < 3 ? 3 : 2, background: d.highlightString === i ? "#FFD166" : "#a89cc8", borderRadius: 1 } }), /* @__PURE__ */ React.createElement("span", { style: { color: d.highlightString === i ? "#FFD166" : "#a89cc8", fontSize: 12, fontWeight: 700, width: 16 } }, n));
  }));
  if (v === "guitarStringsQuiz") return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, GUITAR_OPEN.map(function(n, i) {
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "3px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#888", fontSize: 10, width: 20 } }, 6 - i), /* @__PURE__ */ React.createElement("div", { style: { width: 160, height: i < 3 ? 3 : 2, background: d.highlightString === i ? "#FFD166" : "#a89cc8", borderRadius: 1 } }), /* @__PURE__ */ React.createElement("span", { style: { color: d.highlightString === i ? "#FFD166" : "#666", fontSize: 12, fontWeight: 700, width: 16 } }, d.highlightString === i ? "?" : ""));
  }));
  if (v === "ukeStrings") return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, UKE_OPEN.map(function(n, i) {
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "4px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#888", fontSize: 10, width: 20 } }, 4 - i), /* @__PURE__ */ React.createElement("div", { style: { width: 120, height: 2, background: d.highlightString === i ? "#FFD166" : "#a89cc8", borderRadius: 1 } }), /* @__PURE__ */ React.createElement("span", { style: { color: d.highlightString === i ? "#FFD166" : "#a89cc8", fontSize: 12, fontWeight: 700, width: 16 } }, n));
  }));
  if (v === "ukeStringsQuiz") return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, UKE_OPEN.map(function(n, i) {
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "4px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#888", fontSize: 10, width: 20 } }, 4 - i), /* @__PURE__ */ React.createElement("div", { style: { width: 120, height: 2, background: d.highlightString === i ? "#FFD166" : "#a89cc8", borderRadius: 1 } }), /* @__PURE__ */ React.createElement("span", { style: { color: d.highlightString === i ? "#FFD166" : "#666", fontSize: 12, fontWeight: 700, width: 16 } }, d.highlightString === i ? "?" : ""));
  }));
  if (v === "bassClef") return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32, color: "#c9b8e8", marginBottom: 4 } }, "\u{1D122}"), /* @__PURE__ */ React.createElement("div", { style: { color: "#a89cc8", fontSize: 11 } }, "Bass Clef"));
  if (v === "fretboard" && d.fretInfo) return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "inline-block", background: "#2a2020", borderRadius: 8, padding: "8px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#888", fontSize: 10, marginBottom: 4 } }, "String: ", GUITAR_OPEN[d.fretInfo.string], " | Fret: ", d.fretInfo.fret), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 2 } }, Array.from({ length: Math.max(6, d.fretInfo.fret + 2) }, function(_, f) {
    return f;
  }).map(function(f) {
    return /* @__PURE__ */ React.createElement("div", { key: f, style: { width: 28, height: 20, borderRight: f < 5 ? "2px solid #666" : "none", background: f === d.fretInfo.fret ? "#FFD166" : "transparent", borderRadius: f === d.fretInfo.fret ? 4 : 0, display: "flex", alignItems: "center", justifyContent: "center", color: f === d.fretInfo.fret ? "#1a1a2e" : "#555", fontSize: 9, fontWeight: 700 } }, f);
  }))));
  if (v === "capo") return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28, marginBottom: 4 } }, "\u{1F512}"), /* @__PURE__ */ React.createElement("div", { style: { color: "#FFD166", fontSize: 14, fontWeight: 700 } }, "Capo fret ", d.capoFret), /* @__PURE__ */ React.createElement("div", { style: { color: "#a89cc8", fontSize: 12 } }, 'Playing "', d.shape, '" shape'));
  return null;
}
var STREAMS = [
  { id: "general", name: "General", emoji: "\u{1F3BC}", color: "#9B5DE5", desc: "Universal music theory" },
  { id: "piano", name: "Piano", emoji: "\u{1F3B9}", color: "#F15BB5", desc: "Keyboard, inversions, bass clef" },
  { id: "guitar", name: "Guitar", emoji: "\u{1F3B8}", color: "#FEE440", desc: "Fretboard, tab, barre, capo" },
  { id: "ukulele", name: "Ukulele", emoji: "\u{1F3B5}", color: "#00BBF9", desc: "Chords, re-entrant tuning, strums" }
];
var LEVELS = [
  { name: "First Steps", emoji: "\u{1F31F}", color: "#4ECDC4", questions: 8 },
  { name: "Beginner", emoji: "\u{1F3B5}", color: "#FFD166", questions: 8 },
  { name: "Intermediate", emoji: "\u{1F525}", color: "#FF6B6B", questions: 8 },
  { name: "Advanced", emoji: "\u{1F3C6}", color: "#C77DFF", questions: 8 }
];

const STORAGE_KEY = "notequest_progress_v5";
const BADGE_DEFS = [
  { id: "first_steps", emoji: "🌱", name: "First Steps", desc: "Complete your first level" },
  { id: "bright_spark", emoji: "✨", name: "Bright Spark", desc: "Get 4 answers right in one level" },
  { id: "hot_streak", emoji: "🔥", name: "Hot Streak", desc: "Reach a 5-answer streak" },
  { id: "on_fire", emoji: "🚀", name: "On Fire", desc: "Reach an 8-answer streak" },
  { id: "triple_star", emoji: "⭐", name: "Triple Star", desc: "Earn 3 stars in a level" },
  { id: "no_peeking", emoji: "🕶️", name: "No Peeking", desc: "Finish a perfect level without hints" },
  { id: "bounce_back", emoji: "🪄", name: "Bounce Back", desc: "Correctly answer 3 review questions in one level" },
  { id: "sound_sleuth", emoji: "🎧", name: "Sound Sleuth", desc: "Get 5 audio questions right in one level" },
  { id: "beat_the_clock", emoji: "⏱️", name: "Beat the Clock", desc: "Earn 3 stars in Challenge mode" }
];
const THEME_DEFS = [
  { id: "sunrise", name: "Sunrise", mascot: "🎵", bg: "linear-gradient(180deg, #fff7e8 0%, #ffeef8 45%, #edf8ff 100%)", card: "#ffffff", soft: "#fffdf8", border: "#c7bddf", ink: "#1a1a2e", muted: "#4f5565", accent: "#9B5DE5", accentSoft: "#f4edff" },
  { id: "ocean", name: "Ocean", mascot: "🐠", bg: "linear-gradient(180deg, #effcff 0%, #e8f4ff 45%, #edf0ff 100%)", card: "#ffffff", soft: "#f7fdff", border: "#b8d8ef", ink: "#10324d", muted: "#436072", accent: "#00a6c7", accentSoft: "#e8fbff" },
  { id: "jungle", name: "Jungle", mascot: "🦜", bg: "linear-gradient(180deg, #f4ffe8 0%, #f6fff2 45%, #fff7e8 100%)", card: "#ffffff", soft: "#fbfff6", border: "#c6d9a8", ink: "#1c3320", muted: "#546754", accent: "#4c9f38", accentSoft: "#eef9e9" },
  { id: "space", name: "Space", mascot: "🚀", bg: "linear-gradient(180deg, #12162b 0%, #1f2340 55%, #2e2551 100%)", card: "#ffffff", soft: "#f7f2ff", border: "#b9add8", ink: "#1a1a2e", muted: "#5a5f76", accent: "#8b5cf6", accentSoft: "#f2ebff" },
  { id: "eclipse", name: "Eclipse", secret: true, mascot: "🩸", bg: "radial-gradient(circle at 50% 18%, #7a0019 0%, #3a0011 24%, #12000a 44%, #05020a 78%, #000000 100%)", card: "#fff7fb", soft: "#fff1f7", border: "#7f102f", ink: "#210612", muted: "#6f3142", accent: "#d7264f", accentSoft: "#ffe1ea" }
];
const COLLECTIBLE_DEFS = [
  { id: "first_song", emoji: "🎶", name: "First Song", desc: "Complete any level" },
  { id: "general_scroll", emoji: "📜", name: "Theory Scroll", desc: "Finish a General level" },
  { id: "piano_key", emoji: "🎹", name: "Piano Key", desc: "Finish a Piano level" },
  { id: "guitar_pick", emoji: "🎸", name: "Golden Pick", desc: "Finish a Guitar level" },
  { id: "uke_shell", emoji: "🪕", name: "Uke Shell", desc: "Finish a Ukulele level" },
  { id: "gold_star", emoji: "🌟", name: "Gold Star", desc: "Earn a 3-star result" }
];
const MODE_DEFS = [
  { id: "learn", name: "Learn", emoji: "🧠", desc: "Gentle pace, free hints, friendly coach" },
  { id: "quiz", name: "Quiz", emoji: "🎯", desc: "Normal scoring, hints cost points" },
  { id: "challenge", name: "Challenge", emoji: "⚡", desc: "15-second timer, no hints, extra pressure" }
];
const h = React.createElement;

function isPlaceholderName(name) {
  var n = String(name || "").trim();
  return !n || /^kid\s+\d+$/i.test(n) || /^learner\s+\d+$/i.test(n);
}
function sanitizeProfileName(name) {
  var n = String(name || "").trim();
  return isPlaceholderName(n) ? "" : n;
}
function displayProfileName(profile, fallback) {
  var n = profile && profile.name || "";
  return sanitizeProfileName(n) || fallback || "Tap to name learner";
}

function makeDefaultProgress(name) {
  return { name: sanitizeProfileName(name), totalStars: 0, bestStreak: 0, sessionsCompleted: 0, theme: "sunrise", badges: {}, levelStats: {}, collectibles: {}, challengeWins: 0 };
}
function normalizeProfile(profile, fallbackName) {
  return Object.assign(makeDefaultProgress(fallbackName), profile || {}, {
    name: sanitizeProfileName(profile && profile.name || fallbackName || ""),
    badges: Object.assign({}, profile && profile.badges || {}),
    levelStats: Object.assign({}, profile && profile.levelStats || {}),
    collectibles: Object.assign({}, profile && profile.collectibles || {})
  });
}
function makeDefaultSessionStore() {
  return {
    activeProfileId: "learner-1",
    profiles: {
      "learner-1": makeDefaultProgress("")
    }
  };
}
function loadSessionStore() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.profiles) {
        var ids = Object.keys(parsed.profiles || {});
        if (!ids.length) return makeDefaultSessionStore();
        var profiles = {};
        ids.forEach(function(id, idx) {
          var incoming = parsed.profiles[id];
          profiles[id] = normalizeProfile(incoming, incoming && incoming.name || "");
        });
        var active = parsed.activeProfileId && profiles[parsed.activeProfileId] ? parsed.activeProfileId : ids[0];
        return { activeProfileId: active, profiles: profiles };
      }
    }
    var legacyRaw = localStorage.getItem("notequest_progress_v4");
    if (legacyRaw) {
      var legacy = JSON.parse(legacyRaw);
      return {
        activeProfileId: "learner-1",
        profiles: {
          "learner-1": normalizeProfile(legacy, legacy && legacy.name || "")
        }
      };
    }
    return makeDefaultSessionStore();
  } catch (e) {
    return makeDefaultSessionStore();
  }
}
function persistSessionStore(sessionStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionStore));
  } catch (e) {}
}
function buildProfileId(name, profiles) {
  var base = String(name || "kid").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "kid";
  var candidate = base;
  var n = 2;
  while (profiles && profiles[candidate]) {
    candidate = base + "-" + n;
    n += 1;
  }
  return candidate;
}
function levelProgressKey(stream, level, mode) {
  return stream + "::" + level + "::" + (mode || "quiz");
}
function explainQuestion(q) {
  if (q && q.explanation) return q.explanation;
  if (q && q.hint) return q.hint;
  if (q && typeof q.answer !== "undefined") return "The correct answer is " + q.answer + ".";
  return "Nicely done.";
}
function cloneQuestion(q) {
  return JSON.parse(JSON.stringify(q));
}
function badgeById(id) {
  return BADGE_DEFS.find(function(b) { return b.id === id; });
}
function collectibleById(id) {
  return COLLECTIBLE_DEFS.find(function(c) { return c.id === id; });
}
function themeById(id) {
  return THEME_DEFS.find(function(t) { return t.id === id; }) || THEME_DEFS[0];
}
function countBadges(profile) {
  return Object.keys(profile && profile.badges || {}).length;
}
function countCollectibles(profile) {
  return Object.keys(profile && profile.collectibles || {}).length;
}
function isEclipseRevealed(profile) {
  return THEME_DEFS.filter(function(t) { return t.id !== "eclipse"; }).every(function(t) { return isThemeUnlocked(t, profile); });
}
function themeRequirementParts(theme, profile) {
  var stars = profile && profile.totalStars || 0;
  var badges = countBadges(profile);
  var collectibles = countCollectibles(profile);
  var challengeWins = profile && profile.challengeWins || 0;
  if (!theme || theme.id === "sunrise") return [];
  if (theme.id === "ocean") return [
    { ok: stars >= 12, text: "12⭐" }
  ];
  if (theme.id === "jungle") return [
    { ok: stars >= 24, text: "24⭐" },
    { ok: collectibles >= 2, text: "2 collectibles" }
  ];
  if (theme.id === "space") return [
    { ok: stars >= 42, text: "42⭐" },
    { ok: badges >= 6, text: "6 badges" },
    { ok: challengeWins >= 3, text: "3 challenge wins" }
  ];
  if (theme.id === "eclipse") return [
    { ok: stars >= 60, text: "60⭐" },
    { ok: badges >= 8, text: "8 badges" },
    { ok: collectibles >= COLLECTIBLE_DEFS.length, text: "all collectibles" },
    { ok: challengeWins >= 5, text: "5 challenge wins" }
  ];
  return [];
}
function themeRequirementText(theme, profile) {
  var parts = themeRequirementParts(theme, profile);
  if (!parts.length) return "Ready now";
  return parts.map(function(p) { return (p.ok ? "✓ " : "") + p.text; }).join(" • ");
}
function isThemeUnlocked(theme, profile) {
  return themeRequirementParts(theme, profile).every(function(p) { return p.ok; });
}
function unlockedThemesForProfile(profile) {
  return THEME_DEFS.filter(function(t) { return isThemeUnlocked(t, profile); }).map(function(t) { return t.id; });
}
function visibleThemesForProfile(profile) {
  return THEME_DEFS.filter(function(t) { return t.id !== "eclipse" || isEclipseRevealed(profile); });
}
function modeById(id) {
  return MODE_DEFS.find(function(m) { return m.id === id; }) || MODE_DEFS[1];
}
function audioQuestionFor(stream, level) {
  var note = pick(NOTE_NAMES);
  var label = stream === "piano" ? "Which piano note did you hear?" : "Which note did you hear?";
  return {
    question: label,
    visual: "none",
    answer: note,
    options: shuffle([note].concat(wrongOpts(note, NOTE_NAMES))),
    hint: "Play it again and listen for whether it sounds higher or lower than the others you know.",
    explanation: note + " was played.",
    noteToPlay: note + "4",
    isAudioQuestion: true
  };
}
function maybeAudioizeQuestion(stream, level, qi, mode, q) {
  if (!(stream === "general" || stream === "piano")) return q;
  var chance = mode === "challenge" ? 0.3 : mode === "learn" ? 0.22 : 0.18;
  if (Math.random() < chance) return audioQuestionFor(stream, level);
  return q;
}
function getStreamCollectibleId(stream) {
  if (stream === "general") return "general_scroll";
  if (stream === "piano") return "piano_key";
  if (stream === "guitar") return "guitar_pick";
  if (stream === "ukulele") return "uke_shell";
  return null;
}
function aggregateStreamStats(levelStats) {
  return STREAMS.map(function(st) {
    var keys = Object.keys(levelStats || {}).filter(function(key) { return key.indexOf(st.id + "::") === 0; });
    var plays = keys.reduce(function(sum, key) { return sum + ((levelStats[key] && levelStats[key].plays) || 0); }, 0);
    var stars = keys.reduce(function(sum, key) { return sum + ((levelStats[key] && levelStats[key].bestStars) || 0); }, 0);
    var bestScore = keys.reduce(function(best, key) { return Math.max(best, (levelStats[key] && levelStats[key].bestScore) || 0); }, 0);
    return { stream: st, plays: plays, stars: stars, bestScore: bestScore };
  });
}
function statCard(label, value, color, small) {
  return h("div", null,
    h("div", { style: { fontSize: small ? 24 : 28, fontWeight: 700, color: color } }, value),
    h("div", { style: { color: small || color === "#ffffff" ? "inherit" : "#4f5565", fontSize: 11, opacity: 0.9 } }, label)
  );
}
function mascotBubble(theme, title, message) {
  return h("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
        background: theme.accentSoft,
        border: "2px solid " + theme.border,
        borderRadius: 20,
        padding: "14px 16px",
        marginBottom: 14,
        boxShadow: "0 8px 18px rgba(44,39,78,0.07)"
      }
    },
    h("div", {
      style: {
        width: 48,
        height: 48,
        borderRadius: 16,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        flexShrink: 0
      }
    }, theme.mascot),
    h("div", { style: { flex: 1 } },
      h("div", { style: { color: theme.ink, fontSize: 14, fontWeight: 700, marginBottom: 4 } }, title),
      h("div", { style: { color: theme.muted, fontSize: 12, lineHeight: 1.55 } }, message)
    )
  );
}
function chipButton(text, active, onClick, activeColor) {
  return h("div", {
    onClick: onClick,
    style: {
      padding: "10px 14px",
      borderRadius: 999,
      cursor: "pointer",
      border: "2px solid " + (active ? activeColor : "#d7c7f1"),
      background: active ? activeColor : "#ffffff",
      color: active ? "#ffffff" : "#1a1a2e",
      fontSize: 12,
      fontWeight: 700,
      boxShadow: active ? "0 10px 18px rgba(44,39,78,0.12)" : "none"
    }
  }, text);
}

function renderArcadeBackButton(navigate) {
  return h("div", {
    onClick: function() { navigate("/"); },
    style: {
      position: "fixed",
      top: 12,
      left: 16,
      color: "#4a4a6a",
      fontSize: 12,
      cursor: "pointer",
      zIndex: 40,
      padding: "6px 12px",
      borderRadius: 6,
      background: "#ffffffd9",
      border: "1px solid #d9d0ee",
      fontFamily: "'Courier New', monospace",
      letterSpacing: 2,
      boxShadow: "0 6px 14px rgba(44,39,78,0.10)",
      userSelect: "none"
    }
  }, "← ARCADE");
}

export default function NoteQuest() {
  const navigate = useNavigate();
  var audio = useAudio();
  var s = useState("menu"), screen = s[0], setScreen = s[1];
  var s2 = useState("quiz"), mode = s2[0], setMode = s2[1];
  var s3 = useState(null), stream = s3[0], setStream = s3[1];
  var s4 = useState(null), level = s4[0], setLevel = s4[1];
  var s5 = useState(0), currentQ = s5[0], setCurrentQ = s5[1];
  var s6 = useState(0), score = s6[0], setScore = s6[1];
  var s7 = useState(0), streak = s7[0], setStreak = s7[1];
  var s8 = useState(0), bestStreak = s8[0], setBestStreak = s8[1];
  var s9 = useState(null), question = s9[0], setQuestion = s9[1];
  var s10 = useState(null), selected = s10[0], setSelected = s10[1];
  var s11 = useState(false), showHint = s11[0], setShowHint = s11[1];
  var s12 = useState(false), answered = s12[0], setAnswered = s12[1];
  var s13 = useState([]), answers = s13[0], setAnswers = s13[1];
  var s14 = useState(function() { return loadSessionStore(); }), sessionStore = s14[0], setSessionStore = s14[1];
  var s15 = useState(null), feedback = s15[0], setFeedback = s15[1];
  var s16 = useState(null), burst = s16[0], setBurst = s16[1];
  var s17 = useState(0), hintsUsed = s17[0], setHintsUsed = s17[1];
  var s18 = useState({ badges: [], collectibles: [], themes: [] }), unlocks = s18[0], setUnlocks = s18[1];
  var s19 = useState(null), milestone = s19[0], setMilestone = s19[1];
  var s20 = useState(15), timeLeft = s20[0], setTimeLeft = s20[1];
  var askedRef = useRef([]);
  var reviewQueueRef = useRef([]);
  var resultsSavedRef = useRef(false);
  var activeProfileId = sessionStore && sessionStore.activeProfileId || "learner-1";
  var allProfiles = sessionStore && sessionStore.profiles || { "learner-1": makeDefaultProgress("") };
  var profile = allProfiles[activeProfileId] || makeDefaultProgress("");

  function updateProfile(updater) {
    setSessionStore(function(prev) {
      var baseStore = prev && prev.profiles ? prev : makeDefaultSessionStore();
      var currentId = baseStore.activeProfileId || Object.keys(baseStore.profiles || {})[0] || "learner-1";
      var currentProfile = baseStore.profiles && baseStore.profiles[currentId] ? baseStore.profiles[currentId] : makeDefaultProgress("");
      var nextProfile = typeof updater === "function" ? updater(currentProfile) : updater;
      return {
        activeProfileId: currentId,
        profiles: Object.assign({}, baseStore.profiles || {}, (function() { var out = {}; out[currentId] = normalizeProfile(nextProfile, currentProfile.name || ""); return out; })())
      };
    });
  }
  function switchProfile(profileId) {
    if (!profileId || !allProfiles[profileId]) return;
    setSessionStore(function(prev) {
      return Object.assign({}, prev, { activeProfileId: profileId });
    });
    setUnlocks({ badges: [], collectibles: [], themes: [] });
  }
  function renameProfile(profileId) {
    var current = allProfiles && allProfiles[profileId] ? allProfiles[profileId] : makeDefaultProgress("");
    var rawName = window.prompt("Edit learner name", sanitizeProfileName(current.name || ""));
    if (rawName === null) return;
    var name = sanitizeProfileName(rawName);
    setSessionStore(function(prev) {
      var baseStore = prev && prev.profiles ? prev : makeDefaultSessionStore();
      var existing = baseStore.profiles && baseStore.profiles[profileId] ? baseStore.profiles[profileId] : makeDefaultProgress("");
      var nextProfiles = Object.assign({}, baseStore.profiles || {});
      nextProfiles[profileId] = normalizeProfile(Object.assign({}, existing, { name: name }), name);
      return Object.assign({}, baseStore, { profiles: nextProfiles });
    });
  }
  function addProfile() {
    var rawName = window.prompt("Name for this learner? You can edit it later.", "");
    if (rawName === null) return;
    var name = sanitizeProfileName(rawName);
    setSessionStore(function(prev) {
      var baseStore = prev && prev.profiles ? prev : makeDefaultSessionStore();
      var id = buildProfileId(name || "learner", baseStore.profiles || {});
      return {
        activeProfileId: id,
        profiles: Object.assign({}, baseStore.profiles || {}, (function() { var out = {}; out[id] = makeDefaultProgress(name); return out; })())
      };
    });
    setUnlocks({ badges: [], collectibles: [], themes: [] });
    setScreen("menu");
  }
  function learnerSwitcherCard() {
    return h("div", { style: { background: cardBg, borderRadius: 24, padding: "18px 18px", width: "100%", marginTop: 14, border: "2px solid " + border, boxShadow: "0 8px 18px rgba(44,39,78,0.08)" } },
      h("div", { style: { color: ink, fontSize: 16, fontWeight: 700, marginBottom: 10 } }, "Learners on this device"),
      h("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
        Object.keys(allProfiles || {}).map(function(pid) {
          var p = allProfiles[pid] || makeDefaultProgress("");
          var active = pid === activeProfileId;
          return h("div", {
            key: pid,
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 18,
              border: "2px solid " + (active ? theme.accent : border),
              background: active ? theme.accentSoft : "#ffffff",
              boxShadow: active ? "0 8px 16px rgba(44,39,78,0.08)" : "none"
            }
          },
            h("div", {
              onClick: function() { switchProfile(pid); },
              style: { flex: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, minWidth: 0 }
            },
              h("div", { style: { fontSize: 18, flexShrink: 0 } }, active ? "✅" : "👤"),
              h("div", { style: { minWidth: 0 } },
                h("div", { style: { color: ink, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, displayProfileName(p)),
                h("div", { style: { color: muted, fontSize: 10, marginTop: 2 } }, active ? "Active learner" : "Tap to switch")
              )
            ),
            h("div", {
              onClick: function(ev) { ev.stopPropagation(); renameProfile(pid); },
              style: {
                padding: "8px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: "2px solid " + border,
                background: "#ffffff",
                color: ink,
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0
              }
            }, isPlaceholderName(p.name) ? "✏️ Name" : "✏️ Edit")
          );
        }),
        h("div", {
          onClick: addProfile,
          style: {
            padding: "12px 14px",
            borderRadius: 18,
            cursor: "pointer",
            border: "2px dashed " + theme.accent,
            background: "#ffffff",
            color: theme.accent,
            fontSize: 12,
            fontWeight: 700,
            textAlign: "center"
          }
        }, "＋ Add learner")
      ),
      h("div", { style: { color: muted, fontSize: 12, marginTop: 8, lineHeight: 1.5 } }, "Each learner keeps separate stars, badges, themes, collectibles, and dashboard stats. Names can be edited any time.")
    );
  }

  useEffect(function() {
    var style = document.createElement("style");
    style.textContent = 'html,body,#root{margin:0;padding:0;min-height:100%;}'      + 'body{background:linear-gradient(180deg,#fff9ef 0%,#fef6ff 45%,#eef9ff 100%);}'      + '*{box-sizing:border-box;}'      + 'body::before{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 12% 18%, rgba(255, 209, 102, 0.24) 0 44px, transparent 45px),radial-gradient(circle at 85% 14%, rgba(199, 125, 255, 0.18) 0 58px, transparent 59px),radial-gradient(circle at 78% 80%, rgba(78, 205, 196, 0.18) 0 52px, transparent 53px),radial-gradient(circle at 20% 78%, rgba(255, 107, 107, 0.14) 0 38px, transparent 39px);z-index:0;}'      + '#root{position:relative;z-index:1;}'      + '@import url("https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap");'
      + '@keyframes nqb{0%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}70%{transform:translateY(-6px)}}'
      + '@keyframes nqp{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}'
      + '@keyframes nqs{0%{transform:translateY(18px);opacity:0}100%{transform:translateY(0);opacity:1}}'
      + '@keyframes nqpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}'
      + '@keyframes nqshake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}'
      + '@keyframes nqsparkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.55;transform:scale(1.22)}}'
      + '@keyframes nqfloat{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-8px) rotate(5deg)}75%{transform:translateY(-10px) rotate(-3deg)}}'
      + '@keyframes nqburst{0%{opacity:0;transform:translate(0,0) scale(0.4) rotate(0deg)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.2) rotate(180deg)}}';
    document.head.appendChild(style);
    return function() { document.head.removeChild(style); };
  }, []);
  useEffect(function() { persistSessionStore(sessionStore); }, [sessionStore]);

  var totalQ = level !== null ? LEVELS[level].questions : 0;
  var unlockedThemes = unlockedThemesForProfile(profile);
  var effectiveThemeId = unlockedThemes.indexOf(profile.theme || "sunrise") !== -1 ? (profile.theme || "sunrise") : "sunrise";
  var theme = themeById(effectiveThemeId);
  var bg = theme.bg;
  var cardBg = theme.card;
  var softCard = theme.soft;
  var border = theme.border;
  var ink = theme.ink;
  var muted = theme.muted;
  var fn = "'Fredoka',sans-serif";

  function starsFor(list, total) {
    if (!total) return 0;
    var correct = list.filter(function(a) { return a.correct; }).length;
    var pct = correct / total;
    return pct >= 1 ? 3 : pct >= 0.75 ? 2 : pct >= 0.5 ? 1 : 0;
  }
  function getStars() { return starsFor(answers, totalQ); }
  function triggerFeedback(kind, message) {
    setFeedback({ kind: kind, message: message, token: Date.now() });
    if (kind === "correct") {
      var token = Date.now();
      setBurst(token);
      setTimeout(function() {
        setBurst(function(cur) { return cur === token ? null : cur; });
      }, 900);
    }
  }
  function maybeMilestone(nextStreak) {
    if (nextStreak === 3) setMilestone({ emoji: "🔥", text: "Hot streak! 3 in a row" });
    else if (nextStreak === 5) setMilestone({ emoji: "🚀", text: "On fire! 5 in a row" });
    else if (nextStreak > 5 && nextStreak % 5 === 0) setMilestone({ emoji: "🌟", text: "" + nextStreak + " in a row!" });
    else setMilestone(null);
  }
  function playQuestionAudio() {
    if (question && question.noteToPlay && NOTE_FREQ[question.noteToPlay]) {
      audio.playNote(NOTE_FREQ[question.noteToPlay], 0.9, "triangle");
    }
  }
  function loadQ(st4, lv, qi) {
    var q = null;
    var dueIndex = reviewQueueRef.current.findIndex(function(item) { return item.due <= qi; });
    if (dueIndex !== -1) {
      q = Object.assign({}, reviewQueueRef.current.splice(dueIndex, 1)[0].q, { isReview: true });
    } else {
      q = maybeAudioizeQuestion(st4, lv, qi, mode, generateQuestion(st4, lv, qi));
      var attempts = 0;
      var qid = q.question + "|" + q.answer;
      while (askedRef.current.indexOf(qid) !== -1 && attempts < 20) {
        q = maybeAudioizeQuestion(st4, lv, qi, mode, generateQuestion(st4, lv, qi));
        qid = q.question + "|" + q.answer;
        attempts++;
      }
      askedRef.current.push(qid);
    }
    setQuestion(q);
    setSelected(null);
    setShowHint(false);
    setAnswered(false);
    setFeedback(null);
    setMilestone(null);
    setTimeLeft(15);
    if (q.noteToPlay && NOTE_FREQ[q.noteToPlay]) {
      setTimeout(function() { audio.playNote(NOTE_FREQ[q.noteToPlay], 0.9, "triangle"); }, 280);
    }
  }
  function startGame(lv) {
    askedRef.current = [];
    reviewQueueRef.current = [];
    resultsSavedRef.current = false;
    setLevel(lv);
    setCurrentQ(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswers([]);
    setHintsUsed(0);
    setUnlocks({ badges: [], collectibles: [], themes: [] });
    setFeedback(null);
    setBurst(null);
    setMilestone(null);
    setScreen("gameplay");
    loadQ(stream, lv, 0);
  }
  function revealHint() {
    if (showHint || answered || mode === "challenge") return;
    setShowHint(true);
    setHintsUsed(function(h) { return h + 1; });
  }
  function queueReviewIfNeeded() {
    var qid = question.question + "|" + question.answer;
    if (!reviewQueueRef.current.some(function(item) { return item.q.question + "|" + item.q.answer === qid; })) {
      reviewQueueRef.current.push({ due: currentQ + 2 + Math.floor(Math.random() * 3), q: cloneQuestion(question) });
    }
  }
  function recordAnswer(correct, option, timeout) {
    var explanation = explainQuestion(question);
    var audioCorrect = question.isAudioQuestion && correct;
    if (correct) {
      var baseGain = mode === "learn" ? 8 : mode === "challenge" ? 14 + Math.max(0, timeLeft - 3) : (showHint ? 5 : 10);
      var gain = baseGain + streak * 2;
      var nextStreak = streak + 1;
      setScore(function(sv) { return sv + gain; });
      setStreak(nextStreak);
      setBestStreak(function(b) { return Math.max(b, nextStreak); });
      maybeMilestone(nextStreak);
      triggerFeedback("correct", pick(["Nice one! 🎉", "Brilliant! ⭐", "You got it! 🌟", "Lovely work! 🎵"]));
      audio.playSuccess();
    } else {
      setStreak(0);
      setMilestone(null);
      triggerFeedback("wrong", timeout ? "Time's up. That one escaped." : pick(["Almost. Let's pin it down.", "Close. The note goblin nearly had you.", "Not quite. One more go soon."]));
      audio.playFail();
      queueReviewIfNeeded();
    }
    setAnswers(function(prev) {
      return prev.concat([{
        question: question.question,
        correct: correct,
        answer: question.answer,
        selected: option,
        explanation: explanation,
        usedHint: showHint,
        isReview: !!question.isReview,
        isAudioQuestion: !!question.isAudioQuestion,
        timedOut: !!timeout
      }]);
    });
  }
  function handleAnswer(option) {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    recordAnswer(option === question.answer, option, false);
  }
  function handleTimeout() {
    if (answered) return;
    setSelected(null);
    setAnswered(true);
    recordAnswer(false, "(timed out)", true);
  }
  function nextQ() {
    var nq = currentQ + 1;
    if (nq >= totalQ) {
      setScreen("results");
    } else {
      setCurrentQ(nq);
      loadQ(stream, level, nq);
    }
  }

  useEffect(function() {
    if (screen !== "gameplay" || mode !== "challenge" || answered || !question) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    var t = setTimeout(function() { setTimeLeft(function(v) { return v - 1; }); }, 1000);
    return function() { clearTimeout(t); };
  }, [screen, mode, answered, timeLeft, question]);

  useEffect(function() {
    if (screen !== "results" || resultsSavedRef.current || stream === null || level === null) return;
    resultsSavedRef.current = true;
    var stars2 = starsFor(answers, totalQ);
    var correctCount2 = answers.filter(function(a) { return a.correct; }).length;
    var levelKey = levelProgressKey(stream, level, mode);
    var newBadges = [];
    var newCollectibles = [];
    var newThemes = [];
    updateProfile(function(prev) {
      var next = JSON.parse(JSON.stringify(prev || makeDefaultProgress()));
      next.badges = next.badges || {};
      next.levelStats = next.levelStats || {};
      next.collectibles = next.collectibles || {};
      var existing = next.levelStats[levelKey] || { bestStars: 0, bestScore: 0, bestCorrect: 0, plays: 0 };
      var previousStars = next.totalStars || 0;
      var starGain = Math.max(0, stars2 - (existing.bestStars || 0));
      next.totalStars = previousStars + starGain;
      next.bestStreak = Math.max(next.bestStreak || 0, bestStreak);
      next.sessionsCompleted = (next.sessionsCompleted || 0) + 1;
      if (mode === "challenge" && stars2 >= 2) next.challengeWins = (next.challengeWins || 0) + 1;
      next.levelStats[levelKey] = {
        bestStars: Math.max(existing.bestStars || 0, stars2),
        bestScore: Math.max(existing.bestScore || 0, score),
        bestCorrect: Math.max(existing.bestCorrect || 0, correctCount2),
        plays: (existing.plays || 0) + 1,
        lastPlayed: Date.now(),
        lastMode: mode
      };
      function awardBadge(id, condition) {
        if (condition && !next.badges[id]) {
          next.badges[id] = true;
          var b = badgeById(id);
          if (b) newBadges.push(b);
        }
      }
      function awardCollectible(id, condition) {
        if (id && condition && !next.collectibles[id]) {
          next.collectibles[id] = true;
          var c = collectibleById(id);
          if (c) newCollectibles.push(c);
        }
      }
      awardBadge("first_steps", (next.sessionsCompleted || 0) >= 1);
      awardBadge("bright_spark", correctCount2 >= 4);
      awardBadge("hot_streak", bestStreak >= 5);
      awardBadge("on_fire", bestStreak >= 8);
      awardBadge("triple_star", stars2 === 3);
      awardBadge("no_peeking", mode !== "challenge" && hintsUsed === 0 && correctCount2 === totalQ);
      awardBadge("bounce_back", answers.filter(function(a) { return a.isReview && a.correct; }).length >= 3);
      awardBadge("sound_sleuth", answers.filter(function(a) { return a.isAudioQuestion && a.correct; }).length >= 5);
      awardBadge("beat_the_clock", mode === "challenge" && stars2 >= 3);

      awardCollectible("first_song", true);
      awardCollectible(getStreamCollectibleId(stream), true);
      awardCollectible("gold_star", stars2 === 3);

      var beforeProfile = Object.assign({}, next, { totalStars: previousStars });
      var beforeThemes = unlockedThemesForProfile(beforeProfile);
      var afterThemes = unlockedThemesForProfile(next);
      newThemes = afterThemes.filter(function(id) { return beforeThemes.indexOf(id) === -1; }).map(themeById);
      if (afterThemes.indexOf(next.theme) === -1) next.theme = "sunrise";
      return next;
    });
    setUnlocks({ badges: newBadges, collectibles: newCollectibles, themes: newThemes });
  }, [screen, stream, level, mode, answers, totalQ, score, bestStreak, hintsUsed]);

  useEffect(function() {
    if (screen !== "gameplay" || !question) return;
    function handler(e) {
      var idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx <= 8 && idx < question.options.length && !answered) handleAnswer(question.options[idx]);
      if (e.key === "Enter" && answered) nextQ();
      if ((e.key === "h" || e.key === "H") && !answered && mode !== "challenge") revealHint();
      if ((e.key === "p" || e.key === "P") && question.noteToPlay) playQuestionAudio();
    }
    window.addEventListener("keydown", handler);
    return function() { window.removeEventListener("keydown", handler); };
  });

  function mascotMessage() {
    if (screen === "menu") return { title: "Meet your guide", text: "Pick a mode, pick a path, and we shall proceed with musical mischief." };
    if (screen === "levelSelect") return { title: "Choose a level", text: "First Steps is gentle. Advanced is less gentle, but still technically polite." };
    if (screen === "results") return { title: "Round wrap-up", text: "Review what stuck, what wobbled, and which treasures were collected along the way." };
    if (screen === "gameplay" && question) {
      if (mode === "challenge" && !answered) return { title: "Challenge mode", text: "The timer is not your enemy, but it is absolutely not your friend." };
      if (question.isAudioQuestion && !answered) return { title: "Listening ears on", text: "Tap the replay button if you want the note again. No shame in a second listen." };
      if (!answered && mode === "learn") return { title: "Learn mode", text: "Use hints freely. This is practice, not a tribunal." };
      if (answered) return { title: "Quick debrief", text: "Read the explanation before moving on. Tiny pauses do useful work." };
    }
    return { title: "Onward", text: "Steady hands, bright ears, and minimal panic." };
  }

  function renderAnswerOption(opt, i, isCorrect, isWrongChosen) {
    var activeBg = isCorrect ? "#6BCB77" : isWrongChosen ? "#FF6B6B" : "#ffffff";
    var activeBorder = isCorrect ? "#43a952" : isWrongChosen ? "#d44f4f" : border;
    var activeColor = isCorrect ? "#1a1a2e" : isWrongChosen ? "#ffffff" : ink;
    return h("div", {
      key: opt + "::" + i,
      onClick: function() { return handleAnswer(opt); },
      style: {
        padding: "18px 18px",
        borderRadius: 20,
        cursor: answered ? "default" : "pointer",
        background: activeBg,
        color: activeColor,
        border: "2px solid " + activeBorder,
        boxShadow: "0 8px 18px rgba(44,39,78,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        transform: isCorrect ? "scale(1.01)" : "none",
        animation: isWrongChosen ? "nqshake 0.4s ease" : isCorrect ? "nqpulse 0.35s ease" : "none"
      }
    },
      h("div", {
        style: {
          width: 34,
          height: 34,
          borderRadius: 999,
          background: answered ? "rgba(255,255,255,0.28)" : theme.accentSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0
        }
      }, String(i + 1)),
      h("div", { style: { flex: 1, fontSize: 18, fontWeight: 700, lineHeight: 1.4 } }, opt)
    );
  }

  var mascot = mascotMessage();
  var totalBadges = Object.keys(profile.badges || {}).length;
  var totalStarsAll = profile.totalStars || 0;
  var streamStats = aggregateStreamStats(profile.levelStats || {});
  var unlockedCollectibles = COLLECTIBLE_DEFS.filter(function(c) { return profile.collectibles && profile.collectibles[c.id]; });

  if (screen === "menu") {
    return h("div", { style: { minHeight: "100vh", background: bg, fontFamily: fn, overflow: "auto", color: ink } },
      renderArcadeBackButton(navigate),
      h("div", { style: { maxWidth: 560, margin: "0 auto", padding: "28px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center" } },
        h("div", { style: { animation: "nqb 0.8s ease", marginBottom: 8, textAlign: "center" } },
          h("div", { style: { fontSize: 66, marginBottom: 8, filter: "drop-shadow(0 6px 10px rgba(255,209,102,0.25))" } }, "🎶"),
          h("h1", { style: { fontSize: 46, fontWeight: 700, margin: 0, letterSpacing: 1, color: ink } }, "NOTE QUEST"),
          h("p", { style: { color: muted, margin: "4px 0 0", fontSize: 14, letterSpacing: 0.5 } }, "Learn music theory the fun way"),
          h("div", { style: { marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" } },
            h("div", { style: { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, background: "rgba(255,255,255,0.9)", border: "2px solid " + border, color: ink, fontSize: 12, fontWeight: 700 } }, "👤 " + displayProfileName(profile)),
            h("div", {
              onClick: function() { renameProfile(activeProfileId); },
              style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 999, background: "#ffffff", border: "2px solid " + border, color: ink, fontSize: 12, fontWeight: 700, cursor: "pointer" }
            }, isPlaceholderName(profile.name) ? "✏️ Name learner" : "✏️ Rename")
          )
        ),
        mascotBubble(theme, mascot.title, mascot.text),
        h("div", { style: { background: cardBg, borderRadius: 24, padding: "18px 18px", width: "100%", border: "2px solid " + border, boxShadow: "0 10px 24px rgba(44,39,78,0.10)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" } },
          statCard("Total stars", "⭐ " + totalStarsAll, "#7a5a00"),
          statCard("Best streak", "🔥 " + (profile.bestStreak || 0), "#b42323"),
          statCard("Sessions", "🎵 " + (profile.sessionsCompleted || 0), "#6f42c1")
        ),
        learnerSwitcherCard(),
        h("div", { style: { background: cardBg, borderRadius: 24, padding: "18px 18px", width: "100%", marginTop: 14, border: "2px solid " + border, boxShadow: "0 8px 18px rgba(44,39,78,0.08)" } },
          h("div", { style: { color: ink, fontSize: 16, fontWeight: 700, marginBottom: 10 } }, "Choose a mode"),
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr", gap: 10 } },
            MODE_DEFS.map(function(md) {
              var active = mode === md.id;
              return h("div", {
                key: md.id,
                onClick: function() { setMode(md.id); },
                style: {
                  padding: "14px 16px",
                  borderRadius: 18,
                  cursor: "pointer",
                  border: "2px solid " + (active ? theme.accent : border),
                  background: active ? theme.accentSoft : softCard,
                  boxShadow: active ? "0 10px 18px rgba(44,39,78,0.08)" : "none"
                }
              },
                h("div", { style: { color: active ? theme.accent : ink, fontSize: 16, fontWeight: 700 } }, md.emoji + " " + md.name),
                h("div", { style: { color: muted, fontSize: 12, marginTop: 4 } }, md.desc)
              );
            })
          )
        ),
        h("div", { style: { background: cardBg, borderRadius: 24, padding: "18px 18px", width: "100%", marginTop: 14, border: "2px solid " + border, boxShadow: "0 8px 18px rgba(44,39,78,0.08)" } },
          h("div", { style: { color: ink, fontSize: 16, fontWeight: 700, marginBottom: 6 } }, "Theme room"),
          h("div", { style: { color: muted, fontSize: 12, marginBottom: 10, lineHeight: 1.5 } }, "Collect stars, badges, collectibles and challenge wins to open more looks. Pick any unlocked theme to change the feel of the game."),
          h("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
            visibleThemesForProfile(profile).map(function(th) {
              var unlocked = unlockedThemes.indexOf(th.id) !== -1;
              var active = effectiveThemeId === th.id;
              return h("div", {
                key: th.id,
                onClick: function() { if (unlocked) updateProfile(function(prev) { return Object.assign({}, prev, { theme: th.id }); }); },
                style: {
                  minWidth: 156,
                  maxWidth: 220,
                  padding: "12px 14px",
                  borderRadius: 18,
                  cursor: unlocked ? "pointer" : "default",
                  border: "2px solid " + (active ? theme.accent : border),
                  background: unlocked ? (active ? theme.accentSoft : "#ffffff") : "#f1f1f1",
                  color: unlocked ? ink : "#888888",
                  fontSize: 12,
                  fontWeight: 700,
                  opacity: unlocked ? 1 : 0.82,
                  boxShadow: unlocked && active ? "0 8px 18px rgba(44,39,78,0.10)" : "none"
                }
              },
                h("div", { style: { marginBottom: 4 } }, (unlocked ? "" : "🔒 ") + th.name),
                h("div", { style: { fontSize: 11, fontWeight: 600, lineHeight: 1.4, color: unlocked ? muted : "#7a7a7a" } }, unlocked ? "Unlocked" : themeRequirementText(th, profile))
              );
            })
          )
        ),
        h("div", { style: { background: cardBg, borderRadius: 28, padding: "24px 22px", marginTop: 16, width: "100%", border: "2px solid " + border, animation: "nqs 0.5s ease", boxShadow: "0 12px 24px rgba(44,39,78,0.12)" } },
          h("h2", { style: { color: ink, fontSize: 17, margin: "0 0 14px", textAlign: "center" } }, "Choose Your Path"),
          h("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
            STREAMS.map(function(st4) {
              var stat = streamStats.find(function(ss) { return ss.stream.id === st4.id; }) || { plays: 0, stars: 0, bestScore: 0 };
              return h("div", {
                key: st4.id,
                onClick: function() { setStream(st4.id); setScreen("levelSelect"); },
                style: {
                  padding: "20px 22px",
                  borderRadius: 22,
                  cursor: "pointer",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,255,0.98))",
                  border: "2px solid " + st4.color + "55",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  boxShadow: "0 10px 24px rgba(147,112,219,0.10)"
                }
              },
                h("div", { style: { fontSize: 36, width: 58, height: 58, borderRadius: 18, background: st4.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, st4.emoji),
                h("div", { style: { flex: 1 } },
                  h("div", { style: { color: st4.color, fontSize: 18, fontWeight: 700 } }, st4.name),
                  h("div", { style: { color: muted, fontSize: 11, marginTop: 2 } }, st4.desc),
                  h("div", { style: { color: "#6b6780", fontSize: 10, marginTop: 5 } }, stat.plays ? "Played " + stat.plays + "× • ⭐ " + stat.stars + " collected • best score " + stat.bestScore : "Fresh path. No dust yet.")
                ),
                h("div", { style: { color: st4.color, fontSize: 20 } }, "→")
              );
            })
          )
        ),
        h("div", { style: { width: "100%", marginTop: 14 } },
          h("div", {
            style: { padding: "14px 16px", borderRadius: 18, background: cardBg, border: "2px solid " + border, color: muted, fontSize: 12, lineHeight: 1.5 }
          }, "Desktop: 1-4 to answer, H for hint, P to replay sound, Enter to continue.")
        ),
        h("div", { style: { background: cardBg, borderRadius: 20, padding: "14px 16px", marginTop: 14, width: "100%", border: "2px solid " + border } },
          h("div", { style: { color: ink, fontSize: 14, fontWeight: 700, marginBottom: 8 } }, "Collectible shelf"),
          unlockedCollectibles.length
            ? h("div", { style: { display: "flex", flexWrap: "wrap", gap: 10 } },
                unlockedCollectibles.map(function(c) {
                  return h("div", {
                    key: c.id,
                    style: { padding: "10px 12px", borderRadius: 16, background: theme.accentSoft, border: "2px solid " + border, color: ink, fontSize: 12, fontWeight: 700 }
                  }, c.emoji + " " + c.name);
                })
              )
            : h("div", { style: { color: muted, fontSize: 12 } }, "No collectibles yet. This shelf is currently all ambition.")
        )
      )
    );
  }

  if (screen === "levelSelect") {
    var st = STREAMS.find(function(item) { return item.id === stream; });
    var currentMode = modeById(mode);
    return h("div", { style: { minHeight: "100vh", background: bg, fontFamily: fn, overflow: "auto", color: ink } },
      h("div", {
        onClick: function() { setScreen("menu"); },
        style: { position: "fixed", top: 12, left: 16, color: theme.accent, fontSize: 12, cursor: "pointer", zIndex: 40, padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.92)", border: "2px solid " + border, fontFamily: "'Courier New',monospace", letterSpacing: 2 }
      }, "← BACK"),
      h("div", { style: { maxWidth: 500, margin: "0 auto", padding: "60px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center" } },
        mascotBubble(theme, mascot.title, mascot.text),
        h("div", { style: { fontSize: 32, marginBottom: 4 } }, st.emoji),
        h("h2", { style: { color: st.color, fontSize: 22, fontWeight: 700, margin: "0 0 4px" } }, st.name),
        h("p", { style: { color: muted, fontSize: 12, margin: "0 0 10px" } }, st.desc),
        h("div", { style: { marginBottom: 18, padding: "8px 12px", borderRadius: 999, background: theme.accentSoft, border: "2px solid " + border, color: ink, fontSize: 12, fontWeight: 700 } }, currentMode.emoji + " " + currentMode.name + " mode"),
        h("div", { style: { display: "flex", flexDirection: "column", gap: 12, width: "100%" } },
          LEVELS.map(function(lvl3, i) {
            var stat = profile.levelStats[levelProgressKey(stream, i, mode)] || { bestStars: 0, plays: 0 };
            return h("div", {
              key: i,
              onClick: function() { startGame(i); },
              style: { background: cardBg, borderRadius: 18, padding: "18px", border: "2px solid " + lvl3.color + "55", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 16px rgba(44,39,78,0.08)" }
            },
              h("div", { style: { width: 60, height: 60, borderRadius: 18, background: lvl3.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 } }, lvl3.emoji),
              h("div", { style: { flex: 1 } },
                h("div", { style: { color: lvl3.color, fontSize: 18, fontWeight: 700 } }, lvl3.name),
                h("div", { style: { color: muted, fontSize: 11, marginTop: 4 } },
                  stat.plays ? "Best: " + "⭐".repeat(stat.bestStars || 0).padEnd(3, "☆") + " • Played " + stat.plays + " time" + (stat.plays === 1 ? "" : "s") : lvl3.questions + " questions waiting politely"
                )
              ),
              h("div", { style: { color: lvl3.color, fontSize: 20 } }, "→")
            );
          })
        )
      )
    );
  }

  if (screen === "gameplay" && question) {
    var lvl = LEVELS[level];
    var st2 = STREAMS.find(function(item) { return item.id === stream; });
    var progress = (currentQ + (answered ? 1 : 0)) / totalQ * 100;
    var isCorrect = selected === question.answer;
    var lastAnswer = answers.length ? answers[answers.length - 1] : null;
    var confettiPieces = ["⭐", "🎵", "✨", "🎶", "💫", "🌟", "🎼", "🎹", "🎸", "🪄", "🎷", "🥁"];
    return h("div", { style: { minHeight: "100vh", background: bg, fontFamily: fn, overflow: "auto", color: ink } },
      renderArcadeBackButton(navigate),
      h("div", { style: { maxWidth: 520, margin: "0 auto", padding: "16px 16px 34px", position: "relative" } },
        mascotBubble(theme, mascot.title, mascot.text),
        h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 } },
          h("div", {
            onClick: function() { setScreen("levelSelect"); },
            style: { color: theme.accent, fontSize: 11, cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.95)", border: "2px solid " + border, fontFamily: "'Courier New',monospace" }
          }, "← Quit"),
          h("div", { style: { color: st2.color, fontSize: 11, fontWeight: 700 } }, st2.emoji + " " + st2.name + " • " + lvl.name),
          h("div", { style: { color: "#7a5a00", fontSize: 18, fontWeight: 700 } }, "⭐ " + score, streak > 1 ? h("span", { style: { color: "#b42323", marginLeft: 8, fontSize: 14 } }, "🔥", streak) : null)
        ),
        mode === "challenge" ? h("div", { style: { background: timeLeft <= 5 ? "#ffe2e0" : theme.accentSoft, borderRadius: 16, border: "2px solid " + (timeLeft <= 5 ? "#e35d5d" : border), padding: "10px 14px", marginBottom: 12, textAlign: "center", fontWeight: 700, color: ink } }, "⏱️ " + timeLeft + " seconds left") : null,
        burst ? h("div", { style: { position: "absolute", left: 0, right: 0, top: 110, height: 120, pointerEvents: "none", overflow: "hidden" } },
          confettiPieces.map(function(piece, i) {
            return h("div", {
              key: i,
              style: {
                position: "absolute",
                left: (12 + i * 7) % 92 + "%",
                top: 20 + i % 3 * 8,
                fontSize: 20 + i % 5 * 3,
                animation: "nqburst 0.9s ease forwards",
                "--dx": (i % 2 === 0 ? 1 : -1) * (20 + i * 3) + "px",
                "--dy": (40 + (i % 4) * 16) + "px"
              }
            }, piece);
          })
        ) : null,
        h("div", { style: { padding: "0 4px", marginTop: 6 } },
          h("div", { style: { height: 12, borderRadius: 6, background: "#d8d8e6", overflow: "hidden" } },
            h("div", { style: { height: "100%", borderRadius: 6, background: "linear-gradient(90deg," + lvl.color + "," + lvl.color + "cc)", width: progress + "%", transition: "width 0.5s ease" } })
          ),
          h("div", { style: { display: "flex", justifyContent: "space-between", color: muted, fontSize: 11, fontWeight: 700, marginTop: 4 } },
            h("span", null, lvl.emoji + " " + lvl.name),
            h("span", null, (currentQ + 1) + "/" + totalQ)
          )
        ),
        h("div", { style: { background: cardBg, borderRadius: 20, padding: "20px 18px", border: "2px solid " + border, marginTop: 16, marginBottom: 14, boxShadow: "0 4px 10px rgba(44,39,78,0.06)" } },
          h("p", { style: { color: ink, fontSize: 21, fontWeight: 700, margin: 0, textAlign: "center", lineHeight: 1.55 } }, question.question)
        ),
        question.visual !== "none" ? h("div", { style: { background: "#ffffff", borderRadius: 18, padding: 18, border: "2px solid " + border, marginBottom: 14, boxShadow: "0 4px 10px rgba(44,39,78,0.06)" } }, h(Visual, { data: question })) : null,
        (question.isAudioQuestion || question.noteToPlay) ? h("div", { style: { textAlign: "center", marginBottom: 14 } },
          h("div", {
            onClick: playQuestionAudio,
            style: {
              cursor: "pointer",
              display: "inline-block",
              color: ink,
              fontSize: 14,
              fontWeight: 700,
              padding: "12px 22px",
              background: "#dff8f5",
              borderRadius: 14,
              border: "2px solid #2aa79f",
              boxShadow: "0 8px 18px rgba(42,167,159,0.12)"
            }
          }, "🔊 Play sound again")
        ) : null,
        !showHint && !answered && mode !== "challenge" ? h("div", { style: { textAlign: "center", marginBottom: 20 } },
          h("div", {
            onClick: revealHint,
            style: { cursor: "pointer", display: "inline-block", color: "#5f4700", fontSize: 14, fontWeight: 700, padding: "12px 22px", background: "#ffe58f", borderRadius: 14, border: "2px solid #c99700", boxShadow: "0 8px 18px rgba(201,151,0,0.16)" }
          }, "💡 Hint" + (mode === "quiz" ? " (-5 pts)" : ""))
        ) : null,
        showHint && !answered ? h("div", { style: { background: "#fff0a8", borderRadius: 12, padding: "12px 16px", marginBottom: 20, border: "2px solid #c99700", boxShadow: "0 6px 12px rgba(201, 151, 0, 0.12)" } },
          h("p", { style: { color: "#5f4700", fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.5 } }, "💡 ", question.hint)
        ) : null,
        question.isReview ? h("div", { style: { background: "#e7f6ff", borderRadius: 14, padding: "10px 14px", border: "2px solid #7ac7f3", marginBottom: 12, color: ink, fontSize: 13, fontWeight: 700, textAlign: "center" } }, "🪄 Review question. This one came back for a second go.") : null,
        milestone ? h("div", { style: { background: "#fff0c2", borderRadius: 14, padding: "10px 14px", border: "2px solid #d39a00", marginBottom: 12, color: ink, fontSize: 14, fontWeight: 700, textAlign: "center", animation: "nqpulse 0.6s ease" } }, milestone.emoji + " " + milestone.text) : null,
        h("div", { style: { display: "flex", flexDirection: "column", gap: 18, marginTop: 10 } },
          question.options.map(function(opt, i) {
            var correctOpt = answered && opt === question.answer;
            var wrongChosen = answered && selected === opt && opt !== question.answer;
            return renderAnswerOption(opt, i, correctOpt, wrongChosen);
          })
        ),
        answered && lastAnswer ? h("div", { style: { marginTop: 18, animation: "nqs 0.3s ease" } },
          h("div", { style: { textAlign: "center", padding: "14px 16px", borderRadius: 14, background: isCorrect ? "#dff8f5" : "#ffe2e0", border: "2px solid " + (isCorrect ? "#2aa79f" : "#e35d5d"), marginBottom: 12, boxShadow: "0 8px 18px rgba(44,39,78,0.08)" } },
            h("div", { style: { fontSize: 24, fontWeight: 700, color: isCorrect ? "#146c67" : "#b42323" } }, feedback ? feedback.message : isCorrect ? "Nice one!" : "Almost."),
            h("div", { style: { color: muted, fontSize: 12, marginTop: 4 } },
              isCorrect
                ? (mode === "learn" ? "+8 points and no punishment for curiosity." : mode === "challenge" ? "Timer bonus included. Very dramatic." : (showHint ? "+5 points" : "+10 points") + (streak ? " plus streak bonus" : ""))
                : (lastAnswer.timedOut ? "The timer pounced. This one will come back soon." : "This one will pop back soon for a second try.")
            )
          ),
          h("div", { style: { background: cardBg, borderRadius: 16, padding: "14px 16px", border: "2px solid " + border, marginBottom: 12, boxShadow: "0 6px 14px rgba(44,39,78,0.06)" } },
            h("div", { style: { color: ink, fontSize: 14, fontWeight: 700, marginBottom: 6 } }, "✅ Correct answer: " + question.answer),
            h("div", { style: { color: muted, fontSize: 13, lineHeight: 1.5 } }, lastAnswer.explanation)
          ),
          h("div", {
            onClick: nextQ,
            style: { padding: "20px 36px", borderRadius: 50, textAlign: "center", background: "linear-gradient(135deg,#FFD166,#FF9F1C)", color: ink, fontSize: 20, fontWeight: 700, cursor: "pointer", fontFamily: fn, boxShadow: "0 12px 24px rgba(255, 159, 28, 0.24)" }
          }, currentQ + 1 >= totalQ ? "See Results 🏆" : "Next Question →")
        ) : null
      )
    );
  }

  if (screen === "results") {
    var stars = getStars();
    var correctCount = answers.filter(function(a) { return a.correct; }).length;
    var lvl2 = LEVELS[level];
    var st3 = STREAMS.find(function(item) { return item.id === stream; });
    var enc = stars === 3 ? "🌟 Music Master!" : stars === 2 ? "🎉 Amazing work!" : stars === 1 ? "👍 Good start!" : "💪 Keep going!";
    var reviewWins = answers.filter(function(a) { return a.isReview && a.correct; }).length;
    return h("div", { style: { minHeight: "100vh", background: bg, fontFamily: fn, overflow: "auto", color: ink } },
      h("div", {
        onClick: function() { setScreen("menu"); },
        style: { position: "fixed", top: 12, left: 16, color: theme.accent, fontSize: 12, cursor: "pointer", zIndex: 40, padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.92)", border: "2px solid " + border, fontFamily: "'Courier New',monospace", letterSpacing: 2 }
      }, "← HOME"),
      h("div", { style: { maxWidth: 500, margin: "0 auto", padding: "60px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center" } },
        mascotBubble(theme, mascot.title, mascot.text),
        h("h2", { style: { color: ink, fontSize: 24, fontWeight: 700, margin: "0 0 4px", animation: "nqb 0.8s ease" } }, "Level Complete!"),
        h("p", { style: { color: st3.color, fontSize: 13, margin: "0 0 16px" } }, st3.emoji + " " + st3.name + " — " + lvl2.emoji + " " + lvl2.name + " • " + modeById(mode).name + " mode"),
        h("div", { style: { display: "flex", gap: 10, marginBottom: 16, animation: "nqp 0.5s ease" } },
          [1, 2, 3].map(function(i) {
            return h("div", { key: i, style: { fontSize: 60, filter: i <= stars ? "none" : "grayscale(1) opacity(0.3)", animation: i <= stars ? "nqsparkle 1.5s ease " + i * 0.2 + "s infinite" : "none" } }, "⭐");
          })
        ),
        h("div", { style: { background: cardBg, borderRadius: 16, padding: 18, width: "100%", border: "2px solid " + border, marginBottom: 14, boxShadow: "0 4px 10px rgba(44,39,78,0.06)" } },
          h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" } },
            statCard("Points", String(score), "#7a5a00", true),
            statCard("Correct", correctCount + "/" + totalQ, "#146c67", true),
            statCard("Best streak", "🔥" + bestStreak, "#b42323", true)
          )
        ),
        h("div", { style: { background: "linear-gradient(135deg,#fff4c4,#f2e4ff)", borderRadius: 14, padding: "14px 18px", width: "100%", border: "2px solid #e8cf6b", marginBottom: 14, textAlign: "center" } },
          h("p", { style: { color: ink, fontSize: 15, fontWeight: 700, margin: 0 } }, enc),
          h("p", { style: { color: muted, fontSize: 12, margin: "6px 0 0" } },
            reviewWins ? "You also cleaned up " + reviewWins + " review question" + (reviewWins === 1 ? "" : "s") + "." : "No review questions corrected this time, which is perfectly fine."
          )
        ),
        unlocks.badges.length ? h("div", { style: { background: cardBg, borderRadius: 16, padding: "14px 16px", width: "100%", border: "2px solid #d9c9f5", marginBottom: 14, boxShadow: "0 4px 10px rgba(44,39,78,0.06)" } },
          h("div", { style: { color: ink, fontSize: 14, fontWeight: 700, marginBottom: 10 } }, "New badges"),
          h("div", { style: { display: "flex", flexWrap: "wrap", gap: 10 } },
            unlocks.badges.map(function(b) {
              return h("div", { key: b.id, style: { padding: "10px 12px", borderRadius: 16, background: "#f6f0ff", border: "2px solid #d9c9f5", color: ink, fontSize: 12, fontWeight: 700 } }, b.emoji + " " + b.name);
            })
          )
        ) : null,
        (unlocks.collectibles.length || unlocks.themes.length) ? h("div", { style: { background: cardBg, borderRadius: 16, padding: "14px 16px", width: "100%", border: "2px solid " + border, marginBottom: 14, boxShadow: "0 4px 10px rgba(44,39,78,0.06)" } },
          h("div", { style: { color: ink, fontSize: 14, fontWeight: 700, marginBottom: 10 } }, "New loot"),
          unlocks.collectibles.length ? h("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: unlocks.themes.length ? 10 : 0 } },
            unlocks.collectibles.map(function(c) {
              return h("div", { key: c.id, style: { padding: "10px 12px", borderRadius: 16, background: "#fff9dd", border: "2px solid #e5cf7d", color: ink, fontSize: 12, fontWeight: 700 } }, c.emoji + " " + c.name);
            })
          ) : null,
          unlocks.themes.length ? h("div", { style: { display: "flex", flexWrap: "wrap", gap: 10 } },
            unlocks.themes.map(function(t) {
              return h("div", { key: t.id, style: { padding: "10px 12px", borderRadius: 16, background: theme.accentSoft, border: "2px solid " + border, color: ink, fontSize: 12, fontWeight: 700 } }, "🎨 " + t.name + " theme unlocked");
            })
          ) : null
        ) : null,
        h("div", { style: { background: cardBg, borderRadius: 16, padding: 14, width: "100%", border: "2px solid " + border, marginBottom: 18, boxShadow: "0 4px 10px rgba(44,39,78,0.06)" } },
          h("h3", { style: { color: ink, fontSize: 14, margin: "0 0 10px" } }, "Review"),
          h("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
            answers.map(function(a, i) {
              return h("div", { key: i, style: { display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 10, background: a.correct ? "#f1fcfa" : "#fff4f3", border: "2px solid " + (a.correct ? "#cdeee9" : "#ffd2cf") } },
                h("span", { style: { fontSize: 13, flexShrink: 0 } }, a.correct ? "✅" : "❌"),
                h("div", { style: { flex: 1 } },
                  h("div", { style: { color: ink, fontSize: 12, lineHeight: 1.4, fontWeight: 600 } }, a.question),
                  h("div", { style: { color: muted, fontSize: 11, marginTop: 4 } }, "Answer: " + a.answer + (a.isReview ? " • Review question" : "") + (a.isAudioQuestion ? " • Audio" : "")),
                  h("div", { style: { color: "#6b6780", fontSize: 11, marginTop: 3 } }, a.explanation)
                )
              );
            })
          )
        ),
        h("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" } },
          h("div", {
            onClick: function() { startGame(level); },
            style: { padding: "12px 24px", borderRadius: 50, cursor: "pointer", background: "#FFD166", color: ink, border: "2px solid #d39a00", fontSize: 16, fontWeight: 700, fontFamily: fn, boxShadow: "0 8px 16px rgba(211,154,0,0.20)" }
          }, "🔄 Try Again"),
          h("div", {
            onClick: function() { setScreen("levelSelect"); },
            style: { padding: "12px 24px", borderRadius: 50, cursor: "pointer", background: "#ffffff", border: "2px solid " + st3.color, color: ink, fontSize: 14, fontWeight: 700, fontFamily: fn }
          }, "📚 Other Levels"),
          h("div", {
            onClick: function() { setScreen("menu"); },
            style: { padding: "12px 24px", borderRadius: 50, cursor: "pointer", background: "#ffffff", border: "2px solid " + theme.accent, color: ink, fontSize: 14, fontWeight: 700, fontFamily: fn }
          }, "🎼 All Streams")
        )
      )
    );
  }

  return h("div", { style: { minHeight: "100vh", background: bg } });
}
