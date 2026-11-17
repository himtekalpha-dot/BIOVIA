import { useCallback, useEffect, useRef, useState } from 'react';
import { EDUCATIONAL_GAMES_BY_ID } from '../../data/games';
import type { GameRunResult, GameShellState } from '../../types/biovia';
import { gameAudio } from '../../utils/gameAudio';
import {
  clampGameDeltaTime,
  computeGameXpReward,
  computeImmuneWaveConfig,
} from '../../utils/gameLogic';
import { GameShellOverlay } from './GameShellOverlay';

interface ImmuneDefense2DGameProps {
  autostart: boolean;
  bestScore: number;
  onExitToHub: () => void;
  onOpenMaterialDetail: (slug: string) => void;
  onRunFinished: (result: GameRunResult) => void;
}

type EnemyKind = 'kokus' | 'virus' | 'basil';

interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  flashTimer: number;
  stateTimer: number;
  phase: 'seek' | 'windup' | 'dash' | 'ko';
  dashVx: number;
  dashVy: number;
}

interface BulletEntity {
  active: boolean;
  fromPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
}

interface PickupEntity {
  active: boolean;
  kind: 'vitamin' | 'boost';
  x: number;
  y: number;
  life: number;
}

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
}

interface BgCell {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
}

const WORLD_W = 1000;
const WORLD_H = 620;
const PARTICLE_POOL_SIZE = 120;
const BULLET_POOL_SIZE = 80;

export function ImmuneDefense2DGame({
  autostart,
  bestScore,
  onExitToHub,
  onOpenMaterialDetail,
  onRunFinished,
}: ImmuneDefense2DGameProps) {
  const spec = EDUCATIONAL_GAMES_BY_ID['imun-2d'];
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [shellState, setShellState] = useState<GameShellState>(autostart ? 'playing' : 'title');
  const [hp, setHp] = useState(5);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [kills, setKills] = useState(0);
  const [waveCooldownLabel, setWaveCooldownLabel] = useState('Siap');
  const [isMuted, setIsMuted] = useState(() => gameAudio.isMuted());
  const [runResult, setRunResult] = useState<GameRunResult | null>(null);

  const shellStateRef = useRef<GameShellState>(shellState);
  shellStateRef.current = shellState;

  const callbacksRef = useRef({ onRunFinished });
  callbacksRef.current = { onRunFinished };

  const gameApiRef = useRef<{
    resetSession: (nextState: GameShellState) => void;
    triggerPhagocyteSkill: () => void;
    triggerShoot: () => void;
    setTouchMove: (dx: number, dy: number) => void;
  } | null>(null);

  const handleStart = useCallback(() => {
    setRunResult(null);
    gameApiRef.current?.resetSession('playing');
    setShellState('playing');
    gameAudio.playPickup();
  }, []);

  const handleRestart = useCallback(() => {
    setRunResult(null);
    gameApiRef.current?.resetSession('playing');
    setShellState('playing');
    gameAudio.playPickup();
  }, []);

  const handleReturnTitle = useCallback(() => {
    setRunResult(null);
    gameApiRef.current?.resetSession('title');
    setShellState('title');
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = gameAudio.toggleMute();
    setIsMuted(next);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let viewW = Math.max(320, container.clientWidth || WORLD_W);
    let viewH = Math.max(320, container.clientHeight || WORLD_H);
    let worldScale = 1;
    let worldOffX = 0;
    let worldOffY = 0;
    let needsPausedRedraw = true;

    const syncCanvasSize = (w: number, h: number) => {
      viewW = Math.max(320, Math.floor(w));
      viewH = Math.max(320, Math.floor(h));
      canvas.width = viewW;
      canvas.height = viewH;
      worldScale = Math.min(viewW / WORLD_W, viewH / WORLD_H);
      worldOffX = (viewW - WORLD_W * worldScale) * 0.5;
      worldOffY = (viewH - WORLD_H * worldScale) * 0.5;
      needsPausedRedraw = true;
    };
    syncCanvasSize(viewW, viewH);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      syncCanvasSize(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(container);

    // Input hub separating continuous held intents & edge-triggered actions
    const heldKeys = new Set<string>();
    let pointerWorldX = WORLD_W * 0.65;
    let pointerWorldY = WORLD_H * 0.5;
    let mouseDown = false;
    let touchDx = 0;
    let touchDy = 0;
    let bufferedShoot = false;
    let bufferedSkill = false;

    const particles: ParticleSlot[] = Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 3,
      life: 0,
      maxLife: 1,
      color: '#5ce6f5',
    }));
    let particleCursor = 0;

    const bullets: BulletEntity[] = Array.from({ length: BULLET_POOL_SIZE }, () => ({
      active: false,
      fromPlayer: true,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 5,
      life: 0,
    }));

    const pickups: PickupEntity[] = [];

    const bgCells: BgCell[] = Array.from({ length: 22 }, (_, i) => ({
      x: (i / 22) * WORLD_W,
      y: 45 + ((i * 83) % (WORLD_H - 90)),
      r: 14 + (i % 4) * 5,
      speed: 24 + (i % 5) * 9,
      phase: i * 0.7,
    }));

    // Live simulation state (mutated inside animation loop, throttled HUD sync)
    let player = {
      x: WORLD_W * 0.3,
      y: WORLD_H * 0.5,
      vx: 0,
      vy: 0,
      aimX: 1,
      aimY: 0,
      hp: 5,
      maxHp: 5,
      invuln: 0,
      fireCooldown: 0,
      skillCooldown: 0,
      boostTimer: 0,
      squashX: 1,
      squashY: 1,
      pulseWaveTimer: 0,
    };

    let enemies: EnemyEntity[] = [];
    let nextEnemyId = 1;
    let curWave = 1;
    let spawnedInWave = 0;
    let killsTotal = 0;
    let scoreVal = 0;
    let elapsedTotal = 0;
    let spawnTimer = 0.8;
    let hitstopTimer = 0;
    let trauma = 0;
    let pendingEndTimer = -1;
    let pendingVictory = false;
    let lastHudSyncMs = 0;

    const spawnParticles = (x: number, y: number, color: string, count: number, speedMax = 190) => {
      for (let i = 0; i < count; i++) {
        const slot = particles[particleCursor];
        particleCursor = (particleCursor + 1) % PARTICLE_POOL_SIZE;
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const spd = 45 + Math.random() * speedMax;
        slot.active = true;
        slot.x = x;
        slot.y = y;
        slot.vx = Math.cos(angle) * spd;
        slot.vy = Math.sin(angle) * spd;
        slot.radius = 2.5 + Math.random() * 3.5;
        slot.maxLife = 0.28 + Math.random() * 0.25;
        slot.life = slot.maxLife;
        slot.color = color;
      }
    };

    const spawnBullet = (fromPlayer: boolean, x: number, y: number, vx: number, vy: number, radius: number) => {
      for (let i = 0; i < bullets.length; i++) {
        if (!bullets[i].active) {
          bullets[i].active = true;
          bullets[i].fromPlayer = fromPlayer;
          bullets[i].x = x;
          bullets[i].y = y;
          bullets[i].vx = vx;
          bullets[i].vy = vy;
          bullets[i].radius = radius;
          bullets[i].life = 2.2;
          return;
        }
      }
    };

    const spawnEnemy = () => {
      const cfg = computeImmuneWaveConfig(curWave);
      const kind = cfg.unlockedTypes[spawnedInWave % cfg.unlockedTypes.length];
      spawnedInWave += 1;

      const edge = spawnedInWave % 4;
      let sx = WORLD_W - 24;
      let sy = 60 + Math.random() * (WORLD_H - 120);
      if (edge === 1) {
        sx = 24;
      } else if (edge === 2) {
        sx = 80 + Math.random() * (WORLD_W - 160);
        sy = 24;
      } else if (edge === 3) {
        sx = 80 + Math.random() * (WORLD_W - 160);
        sy = WORLD_H - 24;
      }

      const hpVal = kind === 'basil' ? 3 : kind === 'virus' ? 2 : 1;
      const rad = kind === 'basil' ? 21 : kind === 'virus' ? 18 : 16;

      enemies.push({
        id: nextEnemyId++,
        kind,
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        radius: rad,
        hp: hpVal,
        maxHp: hpVal,
        flashTimer: 0,
        stateTimer: 1.0 + Math.random() * 0.8,
        phase: 'seek',
        dashVx: 0,
        dashVy: 0,
      });
    };

    const firePlayerShot = () => {
      if (player.fireCooldown > 0) return;
      const speed = 560;
      const spreadCount = player.boostTimer > 0 ? 3 : 1;
      const baseAngle = Math.atan2(player.aimY, player.aimX);
      for (let i = 0; i < spreadCount; i++) {
        const offset = spreadCount === 3 ? (i - 1) * 0.17 : 0;
        const a = baseAngle + offset;
        spawnBullet(
          true,
          player.x + Math.cos(a) * 22,
          player.y + Math.sin(a) * 22,
          Math.cos(a) * speed,
          Math.sin(a) * speed,
          6
        );
      }
      player.fireCooldown = player.boostTimer > 0 ? 0.14 : 0.2;
      player.squashX = 1.18;
      player.squashY = 0.84;
      spawnParticles(player.x + player.aimX * 22, player.y + player.aimY * 22, '#7ff2ff', 4, 90);
      gameAudio.playShoot();
    };

    const activatePhagocyteWave = () => {
      if (player.skillCooldown > 0) return;
      player.skillCooldown = 6;
      player.pulseWaveTimer = 0.45;
      trauma = Math.min(1, trauma + 0.35);
      gameAudio.playSkillWave();
      spawnParticles(player.x, player.y, '#5ee7f5', 18, 220);

      enemies.forEach((en) => {
        if (en.phase === 'ko') return;
        const dist = Math.hypot(en.x - player.x, en.y - player.y);
        if (dist <= 215) {
          en.hp -= 2;
          en.flashTimer = 0.08;
          const nx = (en.x - player.x) / Math.max(1, dist);
          const ny = (en.y - player.y) / Math.max(1, dist);
          en.x += nx * 36;
          en.y += ny * 36;
          if (en.hp <= 0) {
            en.phase = 'ko';
            en.stateTimer = 0.3;
            killsTotal += 1;
            scoreVal += en.kind === 'basil' ? 140 : en.kind === 'virus' ? 110 : 80;
            spawnParticles(en.x, en.y, '#ff8a95', 12, 180);
          }
        }
      });
    };

    const resetSession = (nextState: GameShellState) => {
      player = {
        x: WORLD_W * 0.3,
        y: WORLD_H * 0.5,
        vx: 0,
        vy: 0,
        aimX: 1,
        aimY: 0,
        hp: 5,
        maxHp: 5,
        invuln: 1.0,
        fireCooldown: 0,
        skillCooldown: 0,
        boostTimer: 0,
        squashX: 1,
        squashY: 1,
        pulseWaveTimer: 0,
      };
      enemies = [];
      pickups.length = 0;
      bullets.forEach((b) => {
        b.active = false;
      });
      particles.forEach((p) => {
        p.active = false;
      });
      curWave = 1;
      spawnedInWave = 0;
      killsTotal = 0;
      scoreVal = 0;
      elapsedTotal = 0;
      spawnTimer = 0.6;
      hitstopTimer = 0;
      trauma = 0;
      pendingEndTimer = -1;
      pendingVictory = false;
      heldKeys.clear();
      mouseDown = false;
      bufferedShoot = false;
      bufferedSkill = false;

      if (nextState === 'title') {
        // Ambient showcase pathogens drifting on Title backdrop
        for (let i = 0; i < 6; i++) {
          enemies.push({
            id: nextEnemyId++,
            kind: i % 3 === 0 ? 'basil' : i % 2 === 0 ? 'virus' : 'kokus',
            x: WORLD_W * 0.56 + (i % 3) * 115,
            y: 120 + (i % 2) * 280 + (i * 23) % 80,
            vx: -25,
            vy: Math.sin(i) * 18,
            radius: 18,
            hp: 2,
            maxHp: 2,
            flashTimer: 0,
            stateTimer: 1,
            phase: 'seek',
            dashVx: 0,
            dashVy: 0,
          });
        }
      }

      setHp(5);
      setScore(0);
      setWave(1);
      setKills(0);
      setWaveCooldownLabel('Siap (E)');
    };

    gameApiRef.current = {
      resetSession,
      triggerPhagocyteSkill: () => {
        bufferedSkill = true;
      },
      triggerShoot: () => {
        bufferedShoot = true;
      },
      setTouchMove: (dx, dy) => {
        touchDx = dx;
        touchDy = dy;
      },
    };

    resetSession(shellStateRef.current);

    const screenToWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const px = ((clientX - rect.left) / Math.max(1, rect.width)) * viewW;
      const py = ((clientY - rect.top) / Math.max(1, rect.height)) * viewH;
      pointerWorldX = (px - worldOffX) / Math.max(0.01, worldScale);
      pointerWorldY = (py - worldOffY) / Math.max(0.01, worldScale);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code) && shellStateRef.current === 'playing') {
        e.preventDefault();
      }
      heldKeys.add(code);
      if (shellStateRef.current === 'playing') {
        if (code === 'Space') bufferedShoot = true;
        if (code === 'KeyE') bufferedSkill = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
    };

    const onWindowBlur = () => {
      heldKeys.clear();
      mouseDown = false;
      touchDx = 0;
      touchDy = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      screenToWorld(e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (shellStateRef.current !== 'playing') return;
      screenToWorld(e.clientX, e.clientY);
      mouseDown = true;
      bufferedShoot = true;
    };

    const onPointerUp = () => {
      mouseDown = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    let lastMs = performance.now();
    let frameId = 0;
    let disposed = false;

    const finishRun = (victory: boolean) => {
      const xpEarned = computeGameXpReward('imun-2d', scoreVal, victory);
      const finalResult: GameRunResult = {
        gameId: 'imun-2d',
        victory,
        score: Math.round(scoreVal),
        elapsedSeconds: Math.round(elapsedTotal),
        primaryStatLabel: 'GELOMBANG',
        primaryStatValue: `${curWave}/3`,
        secondaryStatLabel: 'KUMAN DITUMPAS',
        secondaryStatValue: `${killsTotal}`,
        xpEarned,
      };
      setRunResult(finalResult);
      setShellState('gameover');
      callbacksRef.current.onRunFinished(finalResult);
      if (victory) gameAudio.playVictory();
      else gameAudio.playDefeat();
    };

    const step = (rawDt: number) => {
      const dt = clampGameDeltaTime(rawDt);

      // Background erythrocytes always drift gently (even on title screen)
      for (let i = 0; i < bgCells.length; i++) {
        bgCells[i].x -= bgCells[i].speed * dt;
        bgCells[i].phase += dt * 1.4;
        if (bgCells[i].x < -40) bgCells[i].x = WORLD_W + 40;
      }

      if (shellStateRef.current === 'title') {
        player.y = WORLD_H * 0.5 + Math.sin(performance.now() * 0.002) * 14;
        for (let i = 0; i < enemies.length; i++) {
          const en = enemies[i];
          en.x += en.vx * dt;
          en.y += Math.sin(performance.now() * 0.002 + i) * 18 * dt;
          if (en.x < -30) en.x = WORLD_W + 30;
        }
        return;
      }

      if (shellStateRef.current !== 'playing') return;

      trauma = Math.max(0, trauma - dt * 2.2);
      if (hitstopTimer > 0) {
        hitstopTimer -= dt;
        return;
      }

      elapsedTotal += dt;

      if (pendingEndTimer >= 0) {
        pendingEndTimer -= dt;
        if (pendingEndTimer <= 0) {
          pendingEndTimer = -1;
          finishRun(pendingVictory);
        }
        return;
      }

      // Movement vector
      let mx = touchDx;
      let my = touchDy;
      if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) mx -= 1;
      if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) mx += 1;
      if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) my -= 1;
      if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) my += 1;
      const mLen = Math.hypot(mx, my);
      if (mLen > 1) {
        mx /= mLen;
        my /= mLen;
      }

      const moveSpeed = player.boostTimer > 0 ? 345 : 285;
      player.vx = moveSpeed * mx;
      player.vy = moveSpeed * my;
      player.x = Math.min(WORLD_W - 28, Math.max(28, player.x + player.vx * dt));
      player.y = Math.min(WORLD_H - 36, Math.max(36, player.y + player.vy * dt));

      // Aim toward mouse cursor if moved, else facing direction
      const adx = pointerWorldX - player.x;
      const ady = pointerWorldY - player.y;
      const aLen = Math.hypot(adx, ady);
      if (aLen > 8) {
        player.aimX = adx / aLen;
        player.aimY = ady / aLen;
      } else if (mLen > 0.1) {
        player.aimX = mx;
        player.aimY = my;
      }

      player.invuln = Math.max(0, player.invuln - dt);
      player.fireCooldown = Math.max(0, player.fireCooldown - dt);
      player.skillCooldown = Math.max(0, player.skillCooldown - dt);
      player.boostTimer = Math.max(0, player.boostTimer - dt);
      player.pulseWaveTimer = Math.max(0, player.pulseWaveTimer - dt);
      player.squashX += (1 - player.squashX) * Math.min(1, dt * 14);
      player.squashY += (1 - player.squashY) * Math.min(1, dt * 14);

      if (bufferedShoot || mouseDown) {
        firePlayerShot();
        bufferedShoot = false;
      }
      if (bufferedSkill) {
        activatePhagocyteWave();
        bufferedSkill = false;
      }

      // Wave spawning
      const waveCfg = computeImmuneWaveConfig(curWave);
      spawnTimer -= dt;
      if (spawnedInWave < waveCfg.totalEnemies && spawnTimer <= 0) {
        spawnEnemy();
        spawnTimer = waveCfg.spawnIntervalSec;
      }

      // Update bullets
      for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i];
        if (!b.active) continue;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (b.life <= 0 || b.x < -20 || b.x > WORLD_W + 20 || b.y < -20 || b.y > WORLD_H + 20) {
          b.active = false;
          continue;
        }
        if (b.fromPlayer) {
          for (let j = 0; j < enemies.length; j++) {
            const en = enemies[j];
            if (en.phase === 'ko') continue;
            if (Math.hypot(b.x - en.x, b.y - en.y) <= b.radius + en.radius) {
              b.active = false;
              en.hp -= 1;
              en.flashTimer = 0.06;
              if (en.hp <= 0) {
                en.phase = 'ko';
                en.stateTimer = 0.28;
                hitstopTimer = 0.035;
                trauma = Math.min(1, trauma + 0.18);
                killsTotal += 1;
                scoreVal += en.kind === 'basil' ? 140 : en.kind === 'virus' ? 110 : 80;
                spawnParticles(en.x, en.y, '#7ff2ff', 14, 175);
                gameAudio.playHit();
                if (killsTotal % 7 === 0) {
                  pickups.push({
                    active: true,
                    kind: killsTotal % 14 === 0 ? 'vitamin' : 'boost',
                    x: en.x,
                    y: en.y,
                    life: 10,
                  });
                }
              } else {
                spawnParticles(b.x, b.y, '#ffffff', 5, 90);
                gameAudio.playHit();
              }
              break;
            }
          }
        } else if (player.invuln <= 0) {
          if (Math.hypot(b.x - player.x, b.y - player.y) <= b.radius + 18) {
            b.active = false;
            player.hp = Math.max(0, player.hp - 1);
            player.invuln = 1.05;
            trauma = Math.min(1, trauma + 0.45);
            hitstopTimer = 0.05;
            spawnParticles(player.x, player.y, '#ff6b7a', 14, 180);
            gameAudio.playHurt();
            if (player.hp <= 0) {
              pendingVictory = false;
              pendingEndTimer = 0.45;
            }
          }
        }
      }

      // Update enemies (3 distinct movement & telegraph policies)
      for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        en.flashTimer = Math.max(0, en.flashTimer - dt);

        if (en.phase === 'ko') {
          en.stateTimer -= dt;
          if (en.stateTimer <= 0) {
            enemies.splice(i, 1);
          }
          continue;
        }

        const dx = player.x - en.x;
        const dy = player.y - en.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const nx = dx / dist;
        const ny = dy / dist;

        if (en.kind === 'kokus') {
          // Swarmer policy: sinusoidal flank approach
          const sway = Math.sin(elapsedTotal * 3.8 + en.id) * 38;
          const spd = 112 * waveCfg.enemySpeedScale;
          en.x += (nx * spd - ny * sway) * dt;
          en.y += (ny * spd + nx * sway) * dt;
        } else if (en.kind === 'virus') {
          // Ranged kiter policy: stays at 220-290px, windup telegraph -> shoot RNA spore
          const spd = 92 * waveCfg.enemySpeedScale;
          if (dist > 290) {
            en.x += nx * spd * dt;
            en.y += ny * spd * dt;
          } else if (dist < 185) {
            en.x -= nx * spd * 0.75 * dt;
            en.y -= ny * spd * 0.75 * dt;
          } else {
            en.x += -ny * spd * 0.65 * dt;
            en.y += nx * spd * 0.65 * dt;
          }
          en.stateTimer -= dt;
          if (en.phase === 'seek' && en.stateTimer <= 0) {
            en.phase = 'windup';
            en.stateTimer = 0.5; // Visible 0.5s telegraph
          } else if (en.phase === 'windup' && en.stateTimer <= 0) {
            spawnBullet(false, en.x, en.y, nx * 265, ny * 265, 6);
            en.phase = 'seek';
            en.stateTimer = 2.1;
          }
        } else {
          // Basil charger policy: seek -> 0.55s aim line telegraph -> high-speed lunge
          if (en.phase === 'seek') {
            const spd = 85 * waveCfg.enemySpeedScale;
            en.x += nx * spd * dt;
            en.y += ny * spd * dt;
            en.stateTimer -= dt;
            if (dist < 320 && en.stateTimer <= 0) {
              en.phase = 'windup';
              en.stateTimer = 0.55;
              en.dashVx = nx * 385;
              en.dashVy = ny * 385;
            }
          } else if (en.phase === 'windup') {
            en.stateTimer -= dt;
            if (en.stateTimer <= 0) {
              en.phase = 'dash';
              en.stateTimer = 0.45;
            }
          } else if (en.phase === 'dash') {
            en.x += en.dashVx * dt;
            en.y += en.dashVy * dt;
            en.stateTimer -= dt;
            if (en.stateTimer <= 0) {
              en.phase = 'seek';
              en.stateTimer = 1.6;
            }
          }
        }

        en.x = Math.min(WORLD_W - 20, Math.max(20, en.x));
        en.y = Math.min(WORLD_H - 20, Math.max(20, en.y));

        // Player contact damage
        if (player.invuln <= 0 && dist <= en.radius + 18) {
          player.hp = Math.max(0, player.hp - 1);
          player.invuln = 1.1;
          trauma = Math.min(1, trauma + 0.45);
          hitstopTimer = 0.05;
          spawnParticles(player.x, player.y, '#ff6b7a', 14, 180);
          gameAudio.playHurt();
          en.x -= nx * 38;
          en.y -= ny * 38;
          if (player.hp <= 0) {
            pendingVictory = false;
            pendingEndTimer = 0.45;
          }
        }
      }

      // Update pickups
      for (let i = pickups.length - 1; i >= 0; i--) {
        const pk = pickups[i];
        pk.life -= dt;
        if (pk.life <= 0) {
          pickups.splice(i, 1);
          continue;
        }
        if (Math.hypot(pk.x - player.x, pk.y - player.y) <= 30) {
          if (pk.kind === 'vitamin') {
            player.hp = Math.min(player.maxHp, player.hp + 1);
          } else {
            player.boostTimer = 6;
          }
          scoreVal += 75;
          spawnParticles(pk.x, pk.y, '#55e59d', 10, 120);
          gameAudio.playPickup();
          pickups.splice(i, 1);
        }
      }

      // Update pooled particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p.active) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life -= dt;
        if (p.life <= 0) p.active = false;
      }

      // Wave progression check
      const activeEnemies = enemies.filter((e) => e.phase !== 'ko').length;
      if (spawnedInWave >= waveCfg.totalEnemies && activeEnemies === 0 && pendingEndTimer < 0) {
        if (curWave < 3) {
          curWave += 1;
          spawnedInWave = 0;
          spawnTimer = 1.2;
          scoreVal += 250;
          gameAudio.playPickup();
        } else {
          scoreVal += 400 + player.hp * 60;
          pendingVictory = true;
          pendingEndTimer = 0.45;
        }
      }

      // Throttle React HUD updates (<= 10Hz)
      const nowMs = performance.now();
      if (nowMs - lastHudSyncMs >= 110) {
        lastHudSyncMs = nowMs;
        setHp(player.hp);
        setScore(scoreVal);
        setWave(curWave);
        setKills(killsTotal);
        setWaveCooldownLabel(
          player.skillCooldown > 0.1
            ? `${player.skillCooldown.toFixed(1)}s`
            : 'Siap (E)'
        );
      }
    };

    const draw = () => {
      ctx.save();

      // Full-viewport deep capillary bloodstream backdrop (1:1 aspect, zero stretching)
      const grad = ctx.createLinearGradient(0, 0, 0, viewH);
      grad.addColorStop(0, '#2b0915');
      grad.addColorStop(0.5, '#461124');
      grad.addColorStop(1, '#290814');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, viewW, viewH);

      // Transform into uniform scaled WORLD_W x WORLD_H space
      ctx.translate(worldOffX, worldOffY);
      ctx.scale(worldScale, worldScale);

      // Decaying trauma*trauma camera shake
      const shakeMag = trauma * trauma * 11;
      if (shakeMag > 0.2) {
        ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
      }

      // Vessel wall ridges top & bottom
      ctx.fillStyle = '#5c1830';
      ctx.fillRect(-100, 0, WORLD_W + 200, 18);
      ctx.fillRect(-100, WORLD_H - 18, WORLD_W + 200, 18);

      // Drifting background erythrocytes
      for (let i = 0; i < bgCells.length; i++) {
        const c = bgCells[i];
        ctx.save();
        ctx.translate(c.x, c.y + Math.sin(c.phase) * 6);
        ctx.globalAlpha = 0.26;
        ctx.fillStyle = '#e84d5b';
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r, c.r * 0.72, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8b1e2e';
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r * 0.45, c.r * 0.3, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Phagocyte pulse ring
      if (player.pulseWaveTimer > 0) {
        const prog = 1 - player.pulseWaveTimer / 0.45;
        ctx.strokeStyle = `rgba(94, 231, 245, ${1 - prog})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 24 + prog * 195, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Pickups
      pickups.forEach((pk) => {
        ctx.save();
        ctx.translate(pk.x, pk.y);
        ctx.fillStyle = pk.kind === 'vitamin' ? '#34d399' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#062638';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pk.kind === 'vitamin' ? '+' : '⚡', 0, 1);
        ctx.restore();
      });

      // Enemies
      enemies.forEach((en) => {
        ctx.save();
        ctx.translate(en.x, en.y);
        if (en.phase === 'ko') {
          const s = Math.max(0.05, en.stateTimer / 0.28);
          ctx.globalAlpha = s;
          ctx.scale(s, s);
        }

        // Telegraph lines / rings
        if (en.phase === 'windup' && en.kind === 'basil') {
          ctx.strokeStyle = 'rgba(255, 90, 105, 0.72)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([7, 5]);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(en.dashVx * 0.45, en.dashVy * 0.45);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (en.phase === 'windup' && en.kind === 'virus') {
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, en.radius + 8, 0, Math.PI * 2);
          ctx.stroke();
        }

        const isFlash = en.flashTimer > 0;
        if (en.kind === 'kokus') {
          ctx.fillStyle = isFlash ? '#ffffff' : '#a855f7';
          ctx.beginPath();
          ctx.arc(0, 0, en.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f3e8ff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (en.kind === 'virus') {
          ctx.fillStyle = isFlash ? '#ffffff' : '#ec4899';
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const a = (s / 6) * Math.PI * 2;
            const px = Math.cos(a) * en.radius;
            const py = Math.sin(a) * en.radius;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fbcfe8';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          const rot = Math.atan2(player.y - en.y, player.x - en.x);
          ctx.rotate(rot);
          ctx.fillStyle = isFlash ? '#ffffff' : '#f59e0b';
          ctx.beginPath();
          ctx.roundRect(-en.radius, -en.radius * 0.58, en.radius * 2, en.radius * 1.16, 10);
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      });

      // Bullets
      for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i];
        if (!b.active) continue;
        ctx.fillStyle = b.fromPlayer ? '#5ee7f5' : '#ff6b7a';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Player Macrophage (White Blood Cell)
      ctx.save();
      ctx.translate(player.x, player.y);
      if (player.invuln > 0 && Math.floor(player.invuln * 14) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      ctx.rotate(Math.atan2(player.aimY, player.aimX));
      ctx.scale(player.squashX, player.squashY);

      ctx.fillStyle = '#e0f9fc';
      ctx.beginPath();
      ctx.arc(0, 0, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = player.boostTimer > 0 ? '#34d399' : '#22d3ee';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Inner macrophage lobed nucleus
      ctx.fillStyle = '#0e7490';
      ctx.beginPath();
      ctx.arc(-4, -3, 7, 0, Math.PI * 2);
      ctx.arc(2, 4, 6, 0, Math.PI * 2);
      ctx.fill();

      // Antibody emitter tip
      ctx.fillStyle = '#5ee7f5';
      ctx.fillRect(15, -4, 10, 8);
      ctx.restore();

      // Pooled particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p.active) continue;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const loop = () => {
      if (disposed) return;
      const now = performance.now();
      const rawDt = (now - lastMs) / 1000;
      lastMs = now;
      if (shellStateRef.current === 'paused') {
        if (needsPausedRedraw) {
          draw();
          needsPausedRedraw = false;
        }
      } else {
        needsPausedRedraw = true;
        step(rawDt);
        draw();
      }
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      gameApiRef.current = null;
    };
  }, []);

  return (
    <div className="game-viewport" data-game-id="imun-2d">
      <div ref={mountRef} className="game-canvas-mount" data-testid="game-2d-canvas" />

      <GameShellOverlay
        spec={spec}
        shellState={shellState}
        hp={hp}
        maxHp={5}
        score={score}
        bestScore={bestScore}
        phaseLabel="GELOMBANG"
        phaseValue={`${wave}/3`}
        secondaryLabel="FAGOSIT [E]"
        secondaryValue={waveCooldownLabel}
        isMuted={isMuted}
        runResult={runResult}
        onStart={handleStart}
        onResume={() => setShellState('playing')}
        onPause={() => setShellState('paused')}
        onRestart={handleRestart}
        onReturnTitle={handleReturnTitle}
        onExitToHub={onExitToHub}
        onToggleMute={handleToggleMute}
        onOpenMaterialDetail={onOpenMaterialDetail}
      >
        {/* Bottom-right tactile skill/shoot cluster + touch directional pad on touch screens */}
        <div className="game-hud-cluster bottom-right">
          <div className="game-2d-touch-pad" aria-label="Kontrol gerak sentuh">
            <button
              type="button"
              className="game-touch-btn"
              onPointerDown={() => gameApiRef.current?.setTouchMove(0, -1)}
              onPointerUp={() => gameApiRef.current?.setTouchMove(0, 0)}
              onPointerLeave={() => gameApiRef.current?.setTouchMove(0, 0)}
              aria-label="Gerak atas"
            >
              ▲
            </button>
            <div className="game-2d-touch-mid">
              <button
                type="button"
                className="game-touch-btn"
                onPointerDown={() => gameApiRef.current?.setTouchMove(-1, 0)}
                onPointerUp={() => gameApiRef.current?.setTouchMove(0, 0)}
                onPointerLeave={() => gameApiRef.current?.setTouchMove(0, 0)}
                aria-label="Gerak kiri"
              >
                ◀
              </button>
              <button
                type="button"
                className="game-touch-btn"
                onPointerDown={() => gameApiRef.current?.setTouchMove(1, 0)}
                onPointerUp={() => gameApiRef.current?.setTouchMove(0, 0)}
                onPointerLeave={() => gameApiRef.current?.setTouchMove(0, 0)}
                aria-label="Gerak kanan"
              >
                ▶
              </button>
            </div>
            <button
              type="button"
              className="game-touch-btn"
              onPointerDown={() => gameApiRef.current?.setTouchMove(0, 1)}
              onPointerUp={() => gameApiRef.current?.setTouchMove(0, 0)}
              onPointerLeave={() => gameApiRef.current?.setTouchMove(0, 0)}
              aria-label="Gerak bawah"
            >
              ▼
            </button>
          </div>

          <div className="game-action-dock">
            <button
              type="button"
              className="game-skill-btn"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                gameApiRef.current?.triggerPhagocyteSkill();
              }}
            >
              <span>Fagosit [E]</span>
              <strong className="tabular-nums">{waveCooldownLabel}</strong>
            </button>
            <button
              type="button"
              className="game-skill-btn primary"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                gameApiRef.current?.triggerShoot();
              }}
            >
              <span>Antibodi [Spasi]</span>
              <strong className="tabular-nums">{kills} Kuman</strong>
            </button>
          </div>
        </div>
      </GameShellOverlay>
    </div>
  );
}
