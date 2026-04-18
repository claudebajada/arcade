import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const CANVAS_W = 800;
const CANVAS_H = 600;

const COLORS = {
  bg: "#0a0a1a",
  deepSea: "#050510",
  neonPink: "#ff2d95",
  neonCyan: "#00f5d4",
  neonYellow: "#fee440",
  neonOrange: "#ff6b35",
  neonPurple: "#b537f2",
  neonGreen: "#39ff14",
  white: "#f0f0ff",
  dimWhite: "#4a4a6a",
};

const FRUIT_TYPES = [
  { name: "apple", color: "#ff2d55", size: 18, points: 10, emoji: "🍎" },
  { name: "banana", color: "#ffe135", size: 16, points: 15, emoji: "🍌" },
  { name: "grape", color: "#b537f2", size: 14, points: 20, emoji: "🍇" },
  { name: "orange", color: "#ff9500", size: 17, points: 12, emoji: "🍊" },
  { name: "watermelon", color: "#39ff14", size: 22, points: 25, emoji: "🍉" },
  { name: "cherry", color: "#ff2d95", size: 12, points: 30, emoji: "🍒" },
];

const POWERUP_TYPES = [
  { id: "shield", emoji: "🛡️", color: "#00f5d4", name: "SHIELD", desc: "Block 1 hit", duration: 600, minLevel: 1 },
  { id: "speed", emoji: "⚡", color: "#fee440", name: "SPEED BOOST", desc: "Swim faster", duration: 360, minLevel: 1 },
  { id: "magnet", emoji: "🧲", color: "#ff6b35", name: "MAGNET", desc: "Attract fruit", duration: 420, minLevel: 2 },
  { id: "double", emoji: "✨", color: "#ff2d95", name: "2X POINTS", desc: "Double score", duration: 480, minLevel: 2 },
  { id: "freeze", emoji: "❄️", color: "#88ccff", name: "FREEZE", desc: "Slow enemies", duration: 300, minLevel: 3 },
  { id: "rapidfire", emoji: "🔥", color: "#ff4400", name: "FRUIT STORM", desc: "Fruit rains fast", duration: 360, minLevel: 4 },
  { id: "ghost", emoji: "👻", color: "#c8b0ff", name: "GHOST", desc: "Pass through enemies", duration: 240, minLevel: 5 },
  { id: "extralife", emoji: "💖", color: "#ff69b4", name: "EXTRA LIFE", desc: "+1 life", duration: 0, minLevel: 3 },
];

const getTransformMaxRecharge = (level) => Math.min(60 + level * 15, 180); // 1s at lv1, scales up to 3s cap

const initState = () => ({
  player: { x: CANVAS_W / 2, y: CANVAS_H - 80, w: 50, h: 30, isFruit: false, fruitType: null },
  fruits: [],
  enemyFish: [],
  diver: null,
  bubbles: [],
  particles: [],
  powerups: [],
  activePowerups: [], // { type, timer }
  score: 0,
  level: 1,
  lives: 3,
  fruitsCollected: 0,
  fruitsToNextLevel: 10,
  gameState: "menu",
  combo: 0,
  comboTimer: 0,
  screenShake: 0,
  flashTimer: 0,
  flashColor: null,
  time: 0,
  highScore: 0,
  diverWarning: 0,
  transformRecharge: 0, // current recharge (counts UP to max)
  transformRechargeMax: getTransformMaxRecharge(1),
  transformReady: true,
  powerupSpawnTimer: 0,
  powerupNotification: null, // { text, color, timer }
  seaweed: Array.from({ length: 12 }, (_, i) => ({
    x: i * 70 + Math.random() * 30,
    h: 60 + Math.random() * 80,
    phase: Math.random() * Math.PI * 2,
    segments: 5 + Math.floor(Math.random() * 4),
  })),
});

export default function FishForFruit() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const gameRef = useRef(initState());
  const keysRef = useRef({});
  const animRef = useRef(null);
  const lastTimeRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);
  const isMobileRef = useRef(false);
  const joystickRef = useRef({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 });
  const joystickTouchIdRef = useRef(null);

  const spawnFruit = useCallback((game) => {
    const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    game.fruits.push({
      x: 40 + Math.random() * (CANVAS_W - 80),
      y: -30,
      type,
      speed: (1.5 + game.level * 0.3) * (0.8 + Math.random() * 0.4),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 1 + Math.random() * 2,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.1,
      scale: 1,
      glow: 0,
    });
  }, []);

  const spawnEnemyFish = useCallback((game) => {
    const fromLeft = Math.random() > 0.5;
    const size = 20 + Math.random() * 25;
    const species = Math.floor(Math.random() * 4);
    game.enemyFish.push({
      x: fromLeft ? -50 : CANVAS_W + 50,
      y: 100 + Math.random() * (CANVAS_H - 250),
      dir: fromLeft ? 1 : -1,
      speed: (1 + game.level * 0.2 + Math.random() * 1.5),
      size,
      species,
      wobble: Math.random() * Math.PI * 2,
      chasing: false,
      colors: [
        ["#ff6b35", "#ff2d55"],
        ["#b537f2", "#ff2d95"],
        ["#00f5d4", "#39ff14"],
        ["#fee440", "#ff9500"],
      ][species],
      jawAngle: 0,
      jawDir: 1,
    });
  }, []);

  const spawnDiver = useCallback((game) => {
    if (game.diver) return;
    const fromLeft = Math.random() > 0.5;
    game.diver = {
      x: fromLeft ? -80 : CANVAS_W + 80,
      y: 80 + Math.random() * 200,
      dir: fromLeft ? 1 : -1,
      speed: 0.8 + game.level * 0.15,
      armAngle: 0,
      legAngle: 0,
      netExtend: 0,
      chasing: false,
      flashlight: 0,
    };
    game.diverWarning = 120;
  }, []);

  const spawnPowerup = useCallback((game) => {
    const eligible = POWERUP_TYPES.filter((p) => p.minLevel <= game.level);
    if (eligible.length === 0) return;
    // Weight rarer powerups lower
    const weights = eligible.map((p) => p.minLevel <= game.level - 2 ? 3 : p.minLevel <= game.level - 1 ? 2 : 1);
    const totalW = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalW;
    let type = eligible[0];
    for (let i = 0; i < eligible.length; i++) {
      r -= weights[i];
      if (r <= 0) { type = eligible[i]; break; }
    }
    game.powerups.push({
      x: 40 + Math.random() * (CANVAS_W - 80),
      y: -20,
      type,
      speed: 0.6 + Math.random() * 0.5,
      wobble: Math.random() * Math.PI * 2,
      life: 600 + Math.random() * 300, // despawn timer
      pulse: 0,
    });
  }, []);

  const hasPowerup = useCallback((game, id) => {
    return game.activePowerups.some((ap) => ap.type.id === id && ap.timer > 0);
  }, []);

  const addParticles = useCallback((x, y, color, count = 8) => {
    const game = gameRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      game.particles.push({
        x, y,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3),
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        color,
        size: 3 + Math.random() * 5,
        type: Math.random() > 0.5 ? "circle" : "star",
      });
    }
  }, []);

  const addBubble = useCallback((x, y) => {
    const game = gameRef.current;
    game.bubbles.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      size: 2 + Math.random() * 6,
      speed: 0.5 + Math.random() * 1.5,
      wobble: Math.random() * Math.PI * 2,
      life: 1,
    });
  }, []);

  const drawFish = useCallback((ctx, x, y, w, h, dir, time, colors, jawAngle = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir || 1, 1);

    const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, w * 0.6);
    bodyGrad.addColorStop(0, colors[0]);
    bodyGrad.addColorStop(1, colors[1] || colors[0]);

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Glow
    ctx.shadowColor = colors[0];
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = colors[0] + "60";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tail
    const tailWag = Math.sin(time * 8) * 0.3;
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, 0);
    ctx.lineTo(-w * 0.75 + Math.sin(time * 6) * 5, -h * 0.4);
    ctx.lineTo(-w * 0.75 + Math.sin(time * 6) * 5, h * 0.4);
    ctx.closePath();
    ctx.fillStyle = colors[1] || colors[0];
    ctx.fill();

    // Top fin
    ctx.beginPath();
    ctx.moveTo(-w * 0.1, -h * 0.45);
    ctx.quadraticCurveTo(w * 0.05, -h * 0.8 + Math.sin(time * 5) * 3, w * 0.2, -h * 0.4);
    ctx.fillStyle = colors[0] + "aa";
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(w * 0.15, -h * 0.1, h * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.18, -h * 0.1, h * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.2, -h * 0.13, h * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    // Mouth / jaw
    if (jawAngle > 0) {
      ctx.beginPath();
      ctx.moveTo(w * 0.35, 0);
      ctx.lineTo(w * 0.5, h * 0.15 * jawAngle);
      ctx.lineTo(w * 0.2, h * 0.1 * jawAngle);
      ctx.closePath();
      ctx.fillStyle = "#ff0040";
      ctx.fill();
    }

    // Scales pattern
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(-w * 0.1 + i * w * 0.1, Math.sin(i) * h * 0.1, h * 0.12, 0, Math.PI * 2);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }, []);

  const drawPlayerFruit = useCallback((ctx, x, y, fruitType, time) => {
    ctx.save();
    ctx.translate(x, y);

    const bob = Math.sin(time * 3) * 3;
    const pulse = 1 + Math.sin(time * 6) * 0.05;
    ctx.translate(0, bob);
    ctx.scale(pulse, pulse);

    // Glow aura
    const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
    glow.addColorStop(0, fruitType.color + "60");
    glow.addColorStop(1, fruitType.color + "00");
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Ring
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.strokeStyle = fruitType.color + "80";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -time * 30;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `${fruitType.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fruitType.emoji, 0, 2);

    ctx.restore();
  }, []);

  const drawDiver = useCallback((ctx, diver, time) => {
    ctx.save();
    ctx.translate(diver.x, diver.y);
    ctx.scale(diver.dir, 1);

    const legSwing = Math.sin(time * 4) * 0.4;
    const armSwing = Math.sin(time * 3) * 0.3;

    // Flashlight beam
    if (diver.flashlight > 0) {
      ctx.globalAlpha = diver.flashlight * 0.15;
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(120, -40);
      ctx.lineTo(120, 40);
      ctx.closePath();
      ctx.fillStyle = "#ffe066";
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Legs with flippers
    ctx.save();
    ctx.translate(0, 25);
    ctx.rotate(legSwing);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(-4, 0, 8, 25);
    ctx.fillStyle = "#00f5d4";
    ctx.beginPath();
    ctx.ellipse(0, 28, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(0, 25);
    ctx.rotate(-legSwing);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(-4, 0, 8, 25);
    ctx.fillStyle = "#00f5d4";
    ctx.beginPath();
    ctx.ellipse(0, 28, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body (wetsuit)
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.roundRect(-15, -25, 30, 55, 8);
    ctx.fill();

    // Wetsuit stripe
    ctx.strokeStyle = COLORS.neonCyan + "60";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(0, 30);
    ctx.stroke();

    // Arms
    ctx.save();
    ctx.translate(15, -10);
    ctx.rotate(armSwing + (diver.netExtend > 0 ? -0.5 : 0));
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, -3, 22, 6);
    // Net
    if (diver.netExtend > 0) {
      ctx.strokeStyle = "#aaa";
      ctx.lineWidth = 1;
      const ne = diver.netExtend;
      ctx.beginPath();
      ctx.arc(22 + ne * 15, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(22 + ne * 15, 0);
        ctx.lineTo(22 + ne * 15 + Math.cos(i) * 20, Math.sin(i) * 20);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Head / mask
    ctx.fillStyle = "#2d2d4e";
    ctx.beginPath();
    ctx.arc(0, -32, 14, 0, Math.PI * 2);
    ctx.fill();

    // Mask visor
    ctx.fillStyle = "#00f5d4";
    ctx.shadowColor = "#00f5d4";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(5, -34, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snorkel / tank
    ctx.fillStyle = "#666";
    ctx.fillRect(-8, -48, 5, 16);
    ctx.fillStyle = COLORS.neonOrange;
    ctx.beginPath();
    ctx.arc(-5, -50, 5, 0, Math.PI * 2);
    ctx.fill();

    // Bubbles from snorkel
    ctx.fillStyle = "#fff3";
    for (let i = 0; i < 3; i++) {
      const bx = -5 + Math.sin(time * 2 + i * 2) * 8;
      const by = -55 - i * 10 - (time * 20 % 30);
      ctx.beginPath();
      ctx.arc(bx, by, 2 + i, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, []);

  const update = useCallback((dt) => {
    const game = gameRef.current;
    if (game.gameState !== "playing") return;

    const keys = keysRef.current;
    game.time += dt;
    const t = game.time;

    // Recharge bar
    if (!game.transformReady) {
      game.transformRecharge += dt * 60;
      if (game.transformRecharge >= game.transformRechargeMax) {
        game.transformRecharge = game.transformRechargeMax;
        game.transformReady = true;
      }
    }
    if (game.comboTimer > 0) {
      game.comboTimer -= dt * 60;
      if (game.comboTimer <= 0) game.combo = 0;
    }
    if (game.screenShake > 0) game.screenShake -= dt * 60;
    if (game.flashTimer > 0) game.flashTimer -= dt * 60;
    if (game.diverWarning > 0) game.diverWarning -= dt * 60;
    if (game.powerupNotification) {
      game.powerupNotification.timer -= dt * 60;
      if (game.powerupNotification.timer <= 0) game.powerupNotification = null;
    }

    // Active powerup timers
    game.activePowerups = game.activePowerups.filter((ap) => {
      ap.timer -= dt * 60;
      return ap.timer > 0;
    });

    // Powerup spawn timer
    game.powerupSpawnTimer -= dt * 60;
    if (game.powerupSpawnTimer <= 0) {
      spawnPowerup(game);
      game.powerupSpawnTimer = 300 + Math.random() * 400 - game.level * 15; // faster spawns at higher levels
    }

    // Player movement
    const p = game.player;
    const speedBoost = hasPowerup(game, "speed") ? 1.7 : 1;
    const speed = (p.isFruit ? 3 : 5) * speedBoost;
    if (keys["ArrowLeft"] || keys["a"]) p.x -= speed;
    if (keys["ArrowRight"] || keys["d"]) p.x += speed;
    if (keys["ArrowUp"] || keys["w"]) p.y -= speed;
    if (keys["ArrowDown"] || keys["s"]) p.y += speed;
    p.x = Math.max(25, Math.min(CANVAS_W - 25, p.x));
    p.y = Math.max(25, Math.min(CANVAS_H - 25, p.y));

    // Spawn fruits when player is fruit
    const fruitSpawnRate = hasPowerup(game, "rapidfire") ? 0.08 + game.level * 0.015 : 0.03 + game.level * 0.008;
    if (p.isFruit && Math.random() < fruitSpawnRate) {
      spawnFruit(game);
    }

    // Update fruits
    const hasMagnet = hasPowerup(game, "magnet");
    const hasDouble = hasPowerup(game, "double");
    game.fruits = game.fruits.filter((f) => {
      f.y += f.speed;
      f.wobble += f.wobbleSpeed * dt;
      f.x += Math.sin(f.wobble) * 0.5;
      f.rotation += f.rotSpeed;

      // Magnet: attract fruit toward fish player
      if (!p.isFruit && hasMagnet) {
        const mdx = p.x - f.x;
        const mdy = p.y - f.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 150 && mdist > 5) {
          f.x += (mdx / mdist) * 3;
          f.y += (mdy / mdist) * 3;
        }
      }

      // Collect fruit — fish eats the fruit!
      if (!p.isFruit) {
        const dx = f.x - p.x;
        const dy = f.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 35) {
          game.combo++;
          game.comboTimer = 90;
          const multiplier = Math.min(game.combo, 10);
          const pointsMult = hasDouble ? 2 : 1;
          game.score += f.type.points * multiplier * pointsMult;
          game.fruitsCollected++;
          game.screenShake = 5;
          game.flashTimer = 8;
          game.flashColor = f.type.color;
          addParticles(f.x, f.y, f.type.color, 12);
          for (let i = 0; i < 4; i++) addBubble(f.x, f.y);

          if (game.fruitsCollected >= game.fruitsToNextLevel) {
            game.level++;
            game.fruitsCollected = 0;
            game.fruitsToNextLevel = Math.floor(10 + game.level * 5);
            game.transformRechargeMax = getTransformMaxRecharge(game.level);
            game.flashTimer = 20;
            game.flashColor = COLORS.neonCyan;
            game.screenShake = 15;
            addParticles(CANVAS_W / 2, CANVAS_H / 2, COLORS.neonCyan, 30);
          }
          return false;
        }
      }
      return f.y < CANVAS_H + 40;
    });

    // Enemy fish
    if (Math.random() < 0.005 + game.level * 0.003) {
      spawnEnemyFish(game);
    }

    const isFrozen = hasPowerup(game, "freeze");
    const isGhost = hasPowerup(game, "ghost");

    game.enemyFish = game.enemyFish.filter((ef) => {
      const speedMod = isFrozen ? 0.3 : 1;
      // Chase player if player is fruit
      if (p.isFruit && !isGhost) {
        const dx = p.x - ef.x;
        const dy = p.y - ef.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        ef.chasing = dist < 300;
        if (ef.chasing) {
          const angle = Math.atan2(dy, dx);
          ef.x += Math.cos(angle) * ef.speed * 1.5 * speedMod;
          ef.y += Math.sin(angle) * ef.speed * 1.5 * speedMod;
          ef.dir = dx > 0 ? 1 : -1;
          ef.jawAngle = Math.min(1, ef.jawAngle + 0.05);
        } else {
          ef.x += ef.dir * ef.speed * speedMod;
          ef.jawAngle = Math.max(0, ef.jawAngle - 0.03);
        }
      } else {
        ef.x += ef.dir * ef.speed * speedMod;
        ef.chasing = false;
        ef.jawAngle = Math.max(0, ef.jawAngle - 0.03);
      }
      ef.wobble += dt * 3;

      // Collision with player when player is fruit
      if (p.isFruit && !isGhost) {
        const dx = ef.x - p.x;
        const dy = ef.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < ef.size + 15) {
          // Shield absorbs the hit
          const shieldIdx = game.activePowerups.findIndex((ap) => ap.type.id === "shield" && ap.timer > 0);
          if (shieldIdx >= 0) {
            game.activePowerups.splice(shieldIdx, 1);
            game.screenShake = 10;
            game.flashTimer = 10;
            game.flashColor = COLORS.neonCyan;
            addParticles(p.x, p.y, COLORS.neonCyan, 15);
            game.powerupNotification = { text: "SHIELD BLOCKED!", color: COLORS.neonCyan, timer: 90 };
            return false;
          }
          game.lives--;
          game.screenShake = 20;
          game.flashTimer = 15;
          game.flashColor = "#ff0000";
          addParticles(p.x, p.y, "#ff0000", 20);
          p.isFruit = false;
          p.fruitType = null;
          game.transformReady = false;
          game.transformRecharge = 0;
          game.combo = 0;
          if (game.lives <= 0) {
            game.gameState = "gameOver";
            game.highScore = Math.max(game.highScore, game.score);
          }
          return false;
        }
      }

      return ef.x > -100 && ef.x < CANVAS_W + 100;
    });

    // Diver
    if (!game.diver && game.level >= 2 && Math.random() < 0.002 + game.level * 0.001) {
      spawnDiver(game);
    }

    if (game.diver) {
      const d = game.diver;
      const diverSpeedMod = isFrozen ? 0.3 : 1;
      if (!p.isFruit && !isGhost) {
        // Chase fish player
        const dx = p.x - d.x;
        const dy = p.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        d.chasing = dist < 350;
        if (d.chasing) {
          const angle = Math.atan2(dy, dx);
          d.x += Math.cos(angle) * d.speed * diverSpeedMod;
          d.y += Math.sin(angle) * d.speed * diverSpeedMod;
          d.dir = dx > 0 ? 1 : -1;
          d.netExtend = Math.min(1, d.netExtend + 0.02);
          d.flashlight = Math.min(1, d.flashlight + 0.02);
        } else {
          d.x += d.dir * d.speed * 0.5 * diverSpeedMod;
          d.netExtend = Math.max(0, d.netExtend - 0.03);
          d.flashlight = Math.max(0, d.flashlight - 0.01);
        }
        d.armAngle = Math.sin(t * 3) * 0.3;
        d.legAngle = Math.sin(t * 4) * 0.4;

        // Catch collision
        if (dist < 40) {
          const shieldIdx = game.activePowerups.findIndex((ap) => ap.type.id === "shield" && ap.timer > 0);
          if (shieldIdx >= 0) {
            game.activePowerups.splice(shieldIdx, 1);
            game.screenShake = 10;
            game.flashTimer = 10;
            game.flashColor = COLORS.neonCyan;
            addParticles(p.x, p.y, COLORS.neonCyan, 15);
            game.powerupNotification = { text: "SHIELD BLOCKED!", color: COLORS.neonCyan, timer: 90 };
            game.diver = null;
          } else {
            game.lives--;
            game.screenShake = 25;
            game.flashTimer = 20;
            game.flashColor = "#ff0000";
            addParticles(p.x, p.y, "#ff0000", 25);
            game.transformReady = false;
            game.transformRecharge = 0;
            game.diver = null;
            game.combo = 0;
            if (game.lives <= 0) {
              game.gameState = "gameOver";
              game.highScore = Math.max(game.highScore, game.score);
            }
          }
        }
      } else {
        // Idle patrol when player is fruit or ghost
        d.x += d.dir * d.speed * 0.3 * diverSpeedMod;
        d.chasing = false;
        d.netExtend = Math.max(0, d.netExtend - 0.02);
        d.flashlight = Math.max(0, d.flashlight - 0.02);
      }

      if (game.diver && (d.x < -120 || d.x > CANVAS_W + 120)) {
        game.diver = null;
      }
    }

    // Powerups - update and collect
    game.powerups = game.powerups.filter((pu) => {
      pu.y += pu.speed;
      pu.wobble += 0.05;
      pu.pulse += 0.08;
      pu.life -= 1;
      pu.x += Math.sin(pu.wobble) * 0.8;

      // Collect powerup (works in both forms)
      const dx = pu.x - p.x;
      const dy = pu.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        if (pu.type.id === "extralife") {
          game.lives = Math.min(game.lives + 1, 5);
        } else {
          // Remove existing of same type, apply fresh
          game.activePowerups = game.activePowerups.filter((ap) => ap.type.id !== pu.type.id);
          game.activePowerups.push({ type: pu.type, timer: pu.type.duration });
        }
        game.powerupNotification = { text: pu.type.name + "!", color: pu.type.color, timer: 120 };
        game.screenShake = 8;
        game.flashTimer = 12;
        game.flashColor = pu.type.color;
        addParticles(pu.x, pu.y, pu.type.color, 18);
        for (let i = 0; i < 5; i++) addBubble(pu.x, pu.y);
        return false;
      }

      return pu.y < CANVAS_H + 30 && pu.life > 0;
    });

    // Bubbles
    if (Math.random() < 0.1) addBubble(Math.random() * CANVAS_W, CANVAS_H + 10);
    game.bubbles = game.bubbles.filter((b) => {
      b.y -= b.speed;
      b.x += Math.sin(b.wobble + t * 2) * 0.3;
      b.life -= 0.003;
      return b.life > 0 && b.y > -20;
    });

    // Particles
    game.particles = game.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= p.decay;
      return p.life > 0;
    });
  }, [spawnFruit, spawnEnemyFish, spawnDiver, spawnPowerup, hasPowerup, addParticles, addBubble]);

  const render = useCallback((ctx) => {
    const game = gameRef.current;
    const t = game.time;

    // Screen shake
    ctx.save();
    if (game.screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * game.screenShake * 2,
        (Math.random() - 0.5) * game.screenShake * 2
      );
    }

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bgGrad.addColorStop(0, "#0a0e2a");
    bgGrad.addColorStop(0.3, "#050818");
    bgGrad.addColorStop(0.7, "#020510");
    bgGrad.addColorStop(1, "#000208");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Animated light rays from top
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 5; i++) {
      const rx = CANVAS_W * 0.2 + i * CANVAS_W * 0.15 + Math.sin(t * 0.3 + i) * 30;
      ctx.beginPath();
      ctx.moveTo(rx - 20, 0);
      ctx.lineTo(rx - 60, CANVAS_H);
      ctx.lineTo(rx + 60, CANVAS_H);
      ctx.lineTo(rx + 20, 0);
      ctx.closePath();
      ctx.fillStyle = "#4488ff";
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Sea floor
    ctx.fillStyle = "#0a0f20";
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_H);
    for (let x = 0; x <= CANVAS_W; x += 20) {
      ctx.lineTo(x, CANVAS_H - 15 + Math.sin(x * 0.03 + t * 0.5) * 8);
    }
    ctx.lineTo(CANVAS_W, CANVAS_H);
    ctx.fill();

    // Seaweed
    game.seaweed.forEach((sw) => {
      ctx.beginPath();
      ctx.moveTo(sw.x, CANVAS_H - 10);
      for (let s = 0; s < sw.segments; s++) {
        const frac = s / sw.segments;
        const sway = Math.sin(t * 1.5 + sw.phase + frac * 2) * (15 * frac);
        const sy = CANVAS_H - 10 - frac * sw.h;
        ctx.quadraticCurveTo(sw.x + sway - 5, sy + 5, sw.x + sway, sy);
      }
      ctx.strokeStyle = "#0f4a2a";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = "#1a8a4a40";
      ctx.lineWidth = 8;
      ctx.stroke();
    });

    // Bubbles
    game.bubbles.forEach((b) => {
      ctx.globalAlpha = b.life * 0.4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Fruits
    game.fruits.forEach((f) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);

      // Glow
      ctx.shadowColor = f.type.color;
      ctx.shadowBlur = 12;

      ctx.font = `${f.type.size * 1.5}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(f.type.emoji, 0, 0);

      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Powerups floating
    game.powerups.forEach((pu) => {
      ctx.save();
      ctx.translate(pu.x, pu.y);

      // Outer glow ring
      const pulseR = 20 + Math.sin(pu.pulse) * 4;
      ctx.beginPath();
      ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = pu.type.color + "80";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.lineDashOffset = -pu.pulse * 10;
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner glow
      const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 18);
      glow.addColorStop(0, pu.type.color + "50");
      glow.addColorStop(1, pu.type.color + "00");
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Emoji
      ctx.font = "22px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = pu.type.color;
      ctx.shadowBlur = 15;
      ctx.fillText(pu.type.emoji, 0, 1);
      ctx.shadowBlur = 0;

      // Despawn flash when low life
      if (pu.life < 120) {
        ctx.globalAlpha = Math.sin(pu.pulse * 5) * 0.5 + 0.5;
      }

      ctx.restore();
    });

    // Enemy fish
    game.enemyFish.forEach((ef) => {
      const wobbleY = Math.sin(ef.wobble) * 3;
      // Freeze tint
      if (hasPowerup(game, "freeze")) {
        ctx.globalAlpha = 0.6;
      }
      drawFish(ctx, ef.x, ef.y + wobbleY, ef.size * 2, ef.size, ef.dir, t, ef.colors, ef.jawAngle);
      ctx.globalAlpha = 1;

      if (hasPowerup(game, "freeze")) {
        ctx.beginPath();
        ctx.arc(ef.x, ef.y + wobbleY, ef.size + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "#88ccff60";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (ef.chasing) {
        ctx.globalAlpha = 0.3 + Math.sin(t * 10) * 0.2;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y + wobbleY, ef.size + 5, 0, Math.PI * 2);
        ctx.strokeStyle = "#ff0040";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Diver
    if (game.diver) {
      if (hasPowerup(game, "freeze")) ctx.globalAlpha = 0.6;
      drawDiver(ctx, game.diver, t);
      ctx.globalAlpha = 1;
    }

    // Player
    const p = game.player;
    const isGhostActive = hasPowerup(game, "ghost");
    const isShieldActive = hasPowerup(game, "shield");
    if (isGhostActive) ctx.globalAlpha = 0.45;
    if (p.isFruit && p.fruitType) {
      drawPlayerFruit(ctx, p.x, p.y, p.fruitType, t);
    } else {
      const dir = keysRef.current["ArrowLeft"] || keysRef.current["a"] ? -1 : 1;
      drawFish(ctx, p.x, p.y, p.w, p.h, dir, t, [COLORS.neonCyan, COLORS.neonGreen]);

      // Player fish crown / special marking
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(dir, 1);
      ctx.fillStyle = COLORS.neonYellow;
      ctx.shadowColor = COLORS.neonYellow;
      ctx.shadowBlur = 6;
      const crownY = -p.h * 0.6;
      ctx.beginPath();
      ctx.moveTo(-8, crownY);
      ctx.lineTo(-6, crownY - 8);
      ctx.lineTo(-2, crownY - 3);
      ctx.lineTo(2, crownY - 10);
      ctx.lineTo(6, crownY - 3);
      ctx.lineTo(8, crownY - 7);
      ctx.lineTo(10, crownY);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Shield visual around player
    if (isShieldActive) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 28, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.neonCyan + "90";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = COLORS.neonCyan;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Hexagonal shimmer
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 2;
        const hx = p.x + Math.cos(a) * 30;
        const hy = p.y + Math.sin(a) * 30;
        ctx.moveTo(hx, hy);
        ctx.arc(hx, hy, 2, 0, Math.PI * 2);
      }
      ctx.fillStyle = COLORS.neonCyan + "60";
      ctx.fill();
    }

    // Ghost visual
    if (isGhostActive) {
      ctx.globalAlpha = 0.15 + Math.sin(t * 5) * 0.1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 32, 0, Math.PI * 2);
      ctx.fillStyle = "#c8b0ff";
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Particles
    game.particles.forEach((pt) => {
      ctx.globalAlpha = pt.life;
      if (pt.type === "star") {
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.life * 5);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const r = pt.size * pt.life;
          ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          const inner = angle + Math.PI / 5;
          ctx.lineTo(Math.cos(inner) * r * 0.4, Math.sin(inner) * r * 0.4);
        }
        ctx.closePath();
        ctx.fillStyle = pt.color;
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    // Flash effect
    if (game.flashTimer > 0 && game.flashColor) {
      ctx.globalAlpha = game.flashTimer / 20 * 0.15;
      ctx.fillStyle = game.flashColor;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
    }

    // Diver warning
    if (game.diverWarning > 0) {
      ctx.globalAlpha = (Math.sin(t * 15) * 0.5 + 0.5) * (game.diverWarning / 120);
      ctx.fillStyle = "#ff000030";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = (game.diverWarning / 120);
      ctx.font = "bold 24px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff4444";
      ctx.shadowColor = "#ff0000";
      ctx.shadowBlur = 20;
      ctx.fillText("⚠ DIVER APPROACHING ⚠", CANVAS_W / 2, 60);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Scanlines
    ctx.globalAlpha = 0.03;
    for (let y = 0; y < CANVAS_H; y += 3) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, y, CANVAS_W, 1);
    }
    ctx.globalAlpha = 1;

    // Vignette
    const vigGrad = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.3, CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.7);
    vigGrad.addColorStop(0, "transparent");
    vigGrad.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.restore();

    // --- HUD ---
    // Score
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.dimWhite;
    ctx.fillText("SCORE", 20, 28);
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillStyle = COLORS.neonYellow;
    ctx.shadowColor = COLORS.neonYellow;
    ctx.shadowBlur = 8;
    ctx.fillText(game.score.toString().padStart(8, "0"), 20, 56);
    ctx.shadowBlur = 0;

    // Level
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = COLORS.dimWhite;
    ctx.textAlign = "center";
    ctx.fillText("LEVEL", CANVAS_W / 2, 28);
    ctx.font = "bold 24px 'Courier New', monospace";
    ctx.fillStyle = COLORS.neonCyan;
    ctx.shadowColor = COLORS.neonCyan;
    ctx.shadowBlur = 8;
    ctx.fillText(game.level.toString(), CANVAS_W / 2, 52);
    ctx.shadowBlur = 0;

    // Progress bar
    const progW = 120;
    const progH = 6;
    const progX = CANVAS_W / 2 - progW / 2;
    ctx.fillStyle = "#1a1a3a";
    ctx.fillRect(progX, 60, progW, progH);
    const progFill = game.fruitsCollected / game.fruitsToNextLevel;
    ctx.fillStyle = COLORS.neonCyan;
    ctx.shadowColor = COLORS.neonCyan;
    ctx.shadowBlur = 5;
    ctx.fillRect(progX, 60, progW * progFill, progH);
    ctx.shadowBlur = 0;

    // Lives
    ctx.textAlign = "right";
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = COLORS.dimWhite;
    ctx.fillText("LIVES", CANVAS_W - 20, 28);
    for (let i = 0; i < game.lives; i++) {
      ctx.font = "20px serif";
      ctx.fillText("🐟", CANVAS_W - 20 - i * 28, 52);
    }

    // Combo
    if (game.combo > 1) {
      ctx.textAlign = "center";
      ctx.font = "bold 18px 'Courier New', monospace";
      ctx.fillStyle = COLORS.neonPink;
      ctx.shadowColor = COLORS.neonPink;
      ctx.shadowBlur = 10;
      ctx.fillText(`COMBO x${game.combo}`, CANVAS_W / 2, CANVAS_H - 30);
      ctx.shadowBlur = 0;
    }

    // Transform RECHARGE BAR
    const rcBarW = 140;
    const rcBarH = 10;
    const rcBarX = CANVAS_W / 2 - rcBarW / 2;
    const rcBarY = CANVAS_H - 52;
    const rcFill = game.transformReady ? 1 : game.transformRecharge / game.transformRechargeMax;
    const rcColor = game.transformReady ? (game.player.isFruit ? COLORS.neonCyan : COLORS.neonOrange) : "#ff4466";

    // Bar background
    ctx.fillStyle = "#0a0a20";
    ctx.beginPath();
    ctx.roundRect(rcBarX - 1, rcBarY - 1, rcBarW + 2, rcBarH + 2, 4);
    ctx.fill();
    ctx.strokeStyle = "#2a2a4a";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bar fill
    ctx.fillStyle = rcColor;
    ctx.shadowColor = rcColor;
    ctx.shadowBlur = game.transformReady ? 10 : 0;
    ctx.beginPath();
    ctx.roundRect(rcBarX, rcBarY, rcBarW * rcFill, rcBarH, 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label
    ctx.textAlign = "center";
    ctx.font = "bold 9px 'Courier New', monospace";
    ctx.fillStyle = game.transformReady ? rcColor : "#666";
    const rcLabel = game.transformReady
      ? (game.player.isFruit ? "⚡ READY — BECOME FISH" : "⚡ READY — BECOME FRUIT")
      : `RECHARGING ${Math.ceil((game.transformRechargeMax - game.transformRecharge) / 60)}s`;
    ctx.fillText(rcLabel, CANVAS_W / 2, rcBarY - 4);

    // Transform state indicator
    const stateText = game.player.isFruit
      ? "🍎 FRUIT MODE — SPAWNING FRUIT!"
      : "🐟 FISH MODE — EAT THE FRUIT!";
    ctx.font = "bold 12px 'Courier New', monospace";
    ctx.fillStyle = game.player.isFruit ? COLORS.neonOrange : COLORS.neonGreen;
    ctx.globalAlpha = 0.7 + Math.sin(t * 4) * 0.3;
    ctx.fillText(stateText, CANVAS_W / 2, CANVAS_H - 12);
    ctx.globalAlpha = 1;

    // Active powerups display (bottom-left)
    if (game.activePowerups.length > 0) {
      game.activePowerups.forEach((ap, i) => {
        const apx = 20 + i * 42;
        const apy = CANVAS_H - 30;
        const pct = ap.timer / ap.type.duration;

        // Background circle
        ctx.beginPath();
        ctx.arc(apx + 14, apy, 14, 0, Math.PI * 2);
        ctx.fillStyle = "#0a0a2080";
        ctx.fill();

        // Timer arc
        ctx.beginPath();
        ctx.arc(apx + 14, apy, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.strokeStyle = ap.type.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = ap.type.color;
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Emoji
        ctx.font = "14px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ap.type.emoji, apx + 14, apy + 1);

        // Flash when about to expire
        if (ap.timer < 90) {
          ctx.globalAlpha = Math.sin(t * 12) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(apx + 14, apy, 16, 0, Math.PI * 2);
          ctx.strokeStyle = "#ff0040";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });
      ctx.textBaseline = "alphabetic";
    }

    // Powerup notification popup
    if (game.powerupNotification) {
      const n = game.powerupNotification;
      const nAlpha = Math.min(1, n.timer / 30);
      const nY = CANVAS_H / 2 - 60 - (120 - n.timer) * 0.3;
      ctx.globalAlpha = nAlpha;
      ctx.textAlign = "center";
      ctx.font = "bold 22px 'Courier New', monospace";
      ctx.fillStyle = n.color;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 20;
      ctx.fillText(n.text, CANVAS_W / 2, nY);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }, [drawFish, drawDiver, drawPlayerFruit, hasPowerup]);

  const renderMenu = useCallback((ctx) => {
    const t = gameRef.current.time;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bgGrad.addColorStop(0, "#0a0e2a");
    bgGrad.addColorStop(1, "#000208");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Animated bg fish
    for (let i = 0; i < 8; i++) {
      const fx = ((t * 30 * (0.5 + i * 0.2) + i * 120) % (CANVAS_W + 100)) - 50;
      const fy = 80 + i * 65;
      ctx.globalAlpha = 0.15;
      drawFish(ctx, fx, fy, 30 + i * 5, 15 + i * 2, 1, t, [COLORS.neonCyan, COLORS.neonPurple]);
    }
    ctx.globalAlpha = 1;

    // Title
    ctx.textAlign = "center";
    ctx.font = "bold 56px 'Courier New', monospace";
    const titleY = 180 + Math.sin(t * 2) * 8;

    // Title glow
    ctx.shadowColor = COLORS.neonCyan;
    ctx.shadowBlur = 30;
    ctx.fillStyle = COLORS.neonCyan;
    ctx.fillText("FISH", CANVAS_W / 2 - 80, titleY);
    ctx.shadowColor = COLORS.neonPink;
    ctx.fillStyle = COLORS.neonPink;
    ctx.fillText("for", CANVAS_W / 2 + 10, titleY);
    ctx.shadowColor = COLORS.neonYellow;
    ctx.fillStyle = COLORS.neonYellow;
    ctx.fillText("FRUIT", CANVAS_W / 2 + 120, titleY);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = "16px 'Courier New', monospace";
    ctx.fillStyle = COLORS.dimWhite;
    ctx.fillText("a deeply peculiar underwater experience", CANVAS_W / 2, titleY + 40);

    // Instructions
    const instrY = 300;
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = COLORS.neonGreen;
    ctx.fillText("HOW TO PLAY", CANVAS_W / 2, instrY);

    ctx.font = "13px 'Courier New', monospace";
    ctx.fillStyle = COLORS.white;
    const mob = isMobileRef.current;
    const lines = mob ? [
      "Use the joystick (left) to swim",
      "Tap TRANSFORM to switch fish ↔ fruit",
      "As a fruit: fruit rains down from above",
      "As a fish: eat the fruit for points!",
      "Enemy fish attack you while you're a fruit",
      "The diver hunts you while you're a fish",
    ] : [
      "Arrow keys or WASD to swim",
      "SPACE to transform between fish ↔ fruit",
      "As a fruit: fruit rains down from above",
      "As a fish: eat the fruit for points!",
      "Enemy fish attack you while you're a fruit",
      "The diver hunts you while you're a fish",
    ];
    lines.forEach((line, i) => {
      ctx.fillStyle = i % 2 === 0 ? "#8888bb" : "#7777aa";
      ctx.fillText(line, CANVAS_W / 2, instrY + 28 + i * 22);
    });

    // Start prompt
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.fillStyle = COLORS.neonCyan;
    ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.4;
    ctx.shadowColor = COLORS.neonCyan;
    ctx.shadowBlur = 15;
    ctx.fillText(mob ? "[ TAP TO DIVE IN ]" : "[ PRESS ENTER TO DIVE IN ]", CANVAS_W / 2, 510);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Decorative emojis
    ctx.font = "40px serif";
    ctx.fillText("🐟", 100 + Math.sin(t * 1.5) * 20, 520 + Math.cos(t * 2) * 10);
    ctx.fillText("🍎", CANVAS_W - 100 + Math.cos(t * 1.8) * 20, 520 + Math.sin(t * 1.5) * 10);

    // Scanlines
    ctx.globalAlpha = 0.03;
    for (let y = 0; y < CANVAS_H; y += 3) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, y, CANVAS_W, 1);
    }
    ctx.globalAlpha = 1;
  }, [drawFish]);

  const renderGameOver = useCallback((ctx) => {
    const game = gameRef.current;
    const t = game.time;

    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = "center";

    // Glitch effect text
    ctx.font = "bold 60px 'Courier New', monospace";
    ctx.fillStyle = COLORS.neonPink;
    ctx.shadowColor = COLORS.neonPink;
    ctx.shadowBlur = 25;
    ctx.fillText("GAME OVER", CANVAS_W / 2, 200);
    // Glitch copy
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = COLORS.neonCyan;
    ctx.fillText("GAME OVER", CANVAS_W / 2 + Math.sin(t * 20) * 3, 200 + Math.cos(t * 15) * 2);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.fillStyle = COLORS.dimWhite;
    ctx.fillText("FINAL SCORE", CANVAS_W / 2, 270);

    ctx.font = "bold 40px 'Courier New', monospace";
    ctx.fillStyle = COLORS.neonYellow;
    ctx.shadowColor = COLORS.neonYellow;
    ctx.shadowBlur = 15;
    ctx.fillText(game.score.toString().padStart(8, "0"), CANVAS_W / 2, 320);
    ctx.shadowBlur = 0;

    ctx.font = "14px 'Courier New', monospace";
    ctx.fillStyle = COLORS.dimWhite;
    ctx.fillText(`REACHED LEVEL ${game.level}`, CANVAS_W / 2, 360);

    if (game.score >= game.highScore && game.highScore > 0) {
      ctx.font = "bold 18px 'Courier New', monospace";
      ctx.fillStyle = COLORS.neonGreen;
      ctx.shadowColor = COLORS.neonGreen;
      ctx.shadowBlur = 10;
      ctx.fillText("★ NEW HIGH SCORE ★", CANVAS_W / 2, 400);
      ctx.shadowBlur = 0;
    }

    ctx.font = "bold 18px 'Courier New', monospace";
    ctx.fillStyle = COLORS.neonCyan;
    ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.4;
    ctx.fillText(isMobileRef.current ? "[ TAP TO TRY AGAIN ]" : "[ PRESS ENTER TO TRY AGAIN ]", CANVAS_W / 2, 470);
    ctx.globalAlpha = 1;
  }, []);

  const gameLoop = useCallback((timestamp) => {
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;
    gameRef.current.time += dt * 0.5;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const game = gameRef.current;

    if (game.gameState === "menu") {
      renderMenu(ctx);
    } else if (game.gameState === "playing") {
      update(dt);
      render(ctx);
    } else if (game.gameState === "gameOver") {
      render(ctx);
      renderGameOver(ctx);
    }

    animRef.current = requestAnimationFrame(gameLoop);
  }, [update, render, renderMenu, renderGameOver]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameLoop]);

  const doStart = useCallback(() => {
    const game = gameRef.current;
    if (game.gameState === "menu") {
      game.gameState = "playing";
    } else if (game.gameState === "gameOver") {
      const hs = game.highScore;
      Object.assign(game, initState());
      game.highScore = hs;
      game.gameState = "playing";
    }
  }, []);

  const doTransform = useCallback(() => {
    const game = gameRef.current;
    if (game.gameState !== "playing") return;
    if (game.transformReady) {
      if (!game.player.isFruit) {
        game.player.isFruit = true;
        game.player.fruitType = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
        addParticles(game.player.x, game.player.y, game.player.fruitType.color, 15);
        for (let i = 0; i < 6; i++) addBubble(game.player.x, game.player.y);
      } else {
        addParticles(game.player.x, game.player.y, COLORS.neonCyan, 15);
        game.player.isFruit = false;
        game.player.fruitType = null;
      }
      game.transformReady = false;
      game.transformRecharge = 0;
      game.transformRechargeMax = getTransformMaxRecharge(game.level);
    }
  }, [addParticles, addBubble]);

  // Mobile detection
  useEffect(() => {
    const check = () => {
      const mobile = "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 900;
      setIsMobile(mobile);
      isMobileRef.current = mobile;
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Touch joystick handling
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e) => {
      for (const touch of e.changedTouches) {
        const x = touch.clientX;
        const w = window.innerWidth;
        // Left half = joystick
        if (x < w / 2 && joystickTouchIdRef.current === null) {
          joystickTouchIdRef.current = touch.identifier;
          joystickRef.current = { active: true, startX: touch.clientX, startY: touch.clientY, dx: 0, dy: 0 };
        }
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouchIdRef.current) {
          const j = joystickRef.current;
          const dx = touch.clientX - j.startX;
          const dy = touch.clientY - j.startY;
          const maxR = 50;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxR) {
            j.dx = (dx / dist) * maxR;
            j.dy = (dy / dist) * maxR;
          } else {
            j.dx = dx;
            j.dy = dy;
          }
          // Map joystick to keys
          const deadzone = 12;
          keysRef.current["ArrowLeft"] = j.dx < -deadzone;
          keysRef.current["ArrowRight"] = j.dx > deadzone;
          keysRef.current["ArrowUp"] = j.dy < -deadzone;
          keysRef.current["ArrowDown"] = j.dy > deadzone;
        }
      }
    };

    const handleTouchEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouchIdRef.current) {
          joystickTouchIdRef.current = null;
          joystickRef.current = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };
          keysRef.current["ArrowLeft"] = false;
          keysRef.current["ArrowRight"] = false;
          keysRef.current["ArrowUp"] = false;
          keysRef.current["ArrowDown"] = false;
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
    document.addEventListener("touchcancel", handleTouchEnd, { passive: false });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isMobile]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;
      if (e.key === "Enter") doStart();
      if (e.key === " ") {
        e.preventDefault();
        doTransform();
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [doStart, doTransform]);

  const joystick = joystickRef.current;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#020208",
        fontFamily: "'Courier New', monospace",
        overflow: "hidden",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Back to gallery */}
      <div
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: 12,
          left: 16,
          color: "#fff",
          fontSize: 13,
          cursor: "pointer",
          zIndex: 10,
          padding: "8px 14px",
          borderRadius: 20,
          background: "rgba(0,0,0,0.4)",
          border: "2px solid rgba(255,255,255,0.3)",
          fontFamily: "'Nunito', 'Baloo 2', sans-serif",
          fontWeight: 700,
          userSelect: "none",
        }}
      >
        ← ARCADE
      </div>
      <div
        style={{
          position: "relative",
          border: "2px solid #1a1a3a",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: `0 0 40px ${COLORS.neonCyan}20, 0 0 80px ${COLORS.neonPink}10, inset 0 0 60px rgba(0,0,0,0.5)`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            display: "block",
            imageRendering: "auto",
            maxWidth: "100vw",
            maxHeight: isMobile ? "55vh" : "85vh",
          }}
          tabIndex={0}
          onTouchEnd={(e) => {
            const game = gameRef.current;
            if (game.gameState === "menu" || game.gameState === "gameOver") {
              e.preventDefault();
              doStart();
            }
          }}
        />
      </div>

      {!isMobile && (
        <div
          style={{
            marginTop: 12,
            color: COLORS.dimWhite,
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          fish for fruit — a game about identity crisis in the deep
        </div>
      )}

      {isMobile && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            maxWidth: 500,
            padding: "16px 24px",
            boxSizing: "border-box",
            marginTop: 8,
          }}
        >
          {/* Joystick zone */}
          <div
            style={{
              position: "relative",
              width: 130,
              height: 130,
              borderRadius: "50%",
              background: "radial-gradient(circle, #0f1530 0%, #080c1e 100%)",
              border: `2px solid ${COLORS.neonCyan}40`,
              boxShadow: `0 0 20px ${COLORS.neonCyan}15, inset 0 0 20px ${COLORS.neonCyan}08`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {/* Direction arrows */}
            <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", color: COLORS.neonCyan + "60", fontSize: 18 }}>▲</div>
            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", color: COLORS.neonCyan + "60", fontSize: 18 }}>▼</div>
            <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.neonCyan + "60", fontSize: 18 }}>◀</div>
            <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: COLORS.neonCyan + "60", fontSize: 18 }}>▶</div>
            {/* Joystick nub */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: `radial-gradient(circle at 40% 35%, ${COLORS.neonCyan}50, ${COLORS.neonCyan}20)`,
                border: `2px solid ${COLORS.neonCyan}80`,
                boxShadow: `0 0 12px ${COLORS.neonCyan}40`,
                transform: `translate(${joystick.dx * 0.6}px, ${joystick.dy * 0.6}px)`,
                transition: joystick.active ? "none" : "transform 0.2s ease-out",
              }}
            />
            <div style={{
              position: "absolute",
              bottom: -20,
              left: "50%",
              transform: "translateX(-50%)",
              color: COLORS.dimWhite,
              fontSize: 9,
              letterSpacing: 2,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              swim
            </div>
          </div>

          {/* Transform button */}
          <div
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              doTransform();
            }}
            style={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: gameRef.current.player.isFruit
                ? `radial-gradient(circle at 40% 35%, ${COLORS.neonOrange}30, ${COLORS.neonPink}15)`
                : `radial-gradient(circle at 40% 35%, ${COLORS.neonPurple}30, ${COLORS.neonPink}15)`,
              border: `2px solid ${gameRef.current.player.isFruit ? COLORS.neonOrange : COLORS.neonPurple}80`,
              boxShadow: `0 0 25px ${gameRef.current.player.isFruit ? COLORS.neonOrange : COLORS.neonPurple}30`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <div style={{ fontSize: 32, lineHeight: 1 }}>
              {gameRef.current.player.isFruit ? "🐟" : "🍎"}
            </div>
            <div style={{
              color: gameRef.current.player.isFruit ? COLORS.neonOrange : COLORS.neonPurple,
              fontSize: 9,
              letterSpacing: 1,
              marginTop: 4,
              fontWeight: "bold",
              textTransform: "uppercase",
            }}>
              Transform
            </div>
            <div style={{
              position: "absolute",
              bottom: -20,
              left: "50%",
              transform: "translateX(-50)",
              color: COLORS.dimWhite,
              fontSize: 9,
              letterSpacing: 2,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              {gameRef.current.player.isFruit ? "→ fish" : "→ fruit"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
