import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EDUCATIONAL_GAMES_BY_ID } from '../../data/games';
import { createOrganicBumpTexture } from '../../lab3d/proceduralTextures';
import { disposeObjectHierarchy } from '../../lab3d/specimenBuilders';
import type { GameRunResult, GameShellState } from '../../types/biovia';
import { gameAudio } from '../../utils/gameAudio';
import {
  clampGameDeltaTime,
  computeBloodVesselCenterAt,
  computeGameXpReward,
} from '../../utils/gameLogic';
import { GameShellOverlay } from './GameShellOverlay';

interface Bloodstream3DGameProps {
  autostart: boolean;
  bestScore: number;
  onExitToHub: () => void;
  onOpenMaterialDetail: (slug: string) => void;
  onRunFinished: (result: GameRunResult) => void;
}

interface TunnelItem {
  id: number;
  kind: 'o2' | 'glucose' | 'plaque' | 'germ';
  zDist: number;
  offsetX: number;
  offsetY: number;
  collected: boolean;
  mesh: THREE.Group;
}

const TRACK_LENGTH = 160;
const VESSEL_RADIUS = 3.1;
const SAFE_STEER_RADIUS = 2.05;
const PARTICLE_COUNT = 36;

const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _dummy = new THREE.Object3D();

function detectSoftwareWebGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function buildPlayerErythrocyte(bumpTex: THREE.Texture): {
  group: THREE.Group;
  o2Core: THREE.Mesh;
} {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xe63b4c,
    roughness: 0.34,
    metalness: 0.04,
    clearcoat: 0.5,
    bumpMap: bumpTex,
    bumpScale: 0.02,
  });

  // Biconcave outer rim torus
  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.17, 16, 32), bodyMat);
  torus.rotation.x = Math.PI / 2;
  group.add(torus);

  // Inner depressed disc core
  const centerMat = new THREE.MeshStandardMaterial({
    color: 0xa11f2e,
    roughness: 0.5,
    metalness: 0.05,
  });
  const centerDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 24), centerMat);
  group.add(centerDisc);

  // Titanium Hemoglobin O2 Saddle Ring
  const saddle = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.032, 10, 24),
    new THREE.MeshStandardMaterial({ color: 0x7aeaf5, roughness: 0.2, metalness: 0.78 })
  );
  saddle.rotation.x = Math.PI / 2;
  saddle.position.y = 0.11;
  group.add(saddle);

  // Glowing carried O2 orb
  const o2Core = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x72f2ff,
      emissive: 0x1fcce0,
      emissiveIntensity: 0.75,
      roughness: 0.15,
    })
  );
  o2Core.position.y = 0.18;
  group.add(o2Core);

  return { group, o2Core };
}

function createTunnelItemMesh(kind: TunnelItem['kind']): THREE.Group {
  const g = new THREE.Group();
  if (kind === 'o2') {
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x6ef2ff,
        emissive: 0x1ebbd4,
        emissiveIntensity: 0.65,
        roughness: 0.12,
      })
    );
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.03, 10, 24),
      new THREE.MeshStandardMaterial({
        color: 0xdffbff,
        emissive: 0x45d8eb,
        emissiveIntensity: 0.5,
        roughness: 0.25,
      })
    );
    g.add(core, halo);
  } else if (kind === 'glucose') {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xb47b09,
        emissiveIntensity: 0.55,
        roughness: 0.22,
        metalness: 0.25,
      })
    );
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.025, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 })
    );
    collar.rotation.x = Math.PI / 2;
    g.add(gem, collar);
  } else if (kind === 'plaque') {
    // Composite 3-part cholesterol plaque mass
    const mat = new THREE.MeshStandardMaterial({
      color: 0xe3a239,
      roughness: 0.68,
      metalness: 0.05,
    });
    const m1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), mat);
    const m2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), mat);
    m2.position.set(0.24, 0.14, 0.08);
    const m3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), mat);
    m3.position.set(-0.22, -0.1, 0.12);
    g.add(m1, m2, m3);
  } else {
    // Composite 4-part thorny blood pathogen
    const germMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      emissive: 0x4c1d95,
      emissiveIntensity: 0.45,
      roughness: 0.35,
    });
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), germMat);
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0x9f1239,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });
    const s1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 8), spikeMat);
    s1.position.y = 0.38;
    const s2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 8), spikeMat);
    s2.position.set(0.36, 0, 0);
    s2.rotation.z = -Math.PI / 2;
    const s3 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 8), spikeMat);
    s3.position.set(-0.36, 0, 0);
    s3.rotation.z = Math.PI / 2;
    g.add(body, s1, s2, s3);
  }
  return g;
}

export function Bloodstream3DGame({
  autostart,
  bestScore,
  onExitToHub,
  onOpenMaterialDetail,
  onRunFinished,
}: Bloodstream3DGameProps) {
  const spec = EDUCATIONAL_GAMES_BY_ID['darah-3d'];
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [shellState, setShellState] = useState<GameShellState>(autostart ? 'playing' : 'title');
  const [hp, setHp] = useState(5);
  const [score, setScore] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [o2Count, setO2Count] = useState(0);
  const [boostLabel, setBoostLabel] = useState('Siap (Spasi)');
  const [isMuted, setIsMuted] = useState(() => gameAudio.isMuted());
  const [runResult, setRunResult] = useState<GameRunResult | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const shellStateRef = useRef<GameShellState>(shellState);
  shellStateRef.current = shellState;

  const callbacksRef = useRef({ onRunFinished });
  callbacksRef.current = { onRunFinished };

  const gameApiRef = useRef<{
    resetSession: (next: GameShellState) => void;
    triggerBoost: () => void;
    setTouchSteer: (dx: number, dy: number) => void;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGl();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

    const initialW = Math.max(300, container.clientWidth || 900);
    const initialH = Math.max(260, container.clientHeight || 560);
    renderer.setSize(initialW, initialH);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a0914);
    scene.fog = new THREE.FogExp2(0x2a0914, 0.032);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(50, initialW / initialH, 0.1, 85);

    const hemiLight = new THREE.HemisphereLight(0xffb3c1, 0x3b0d1b, 1.05);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.1);
    keyLight.position.set(3, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x52e0f0, 1.0);
    rimLight.position.set(-4, -2, -6);
    scene.add(rimLight);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const bumpTex = createOrganicBumpTexture(maxAnisotropy);

    // Build continuous curved arterial lumen tunnel
    const centerlinePoints: THREE.Vector3[] = [];
    for (let z = -6; z <= TRACK_LENGTH + 18; z += 4) {
      const c = computeBloodVesselCenterAt(z);
      centerlinePoints.push(new THREE.Vector3(c.x, c.y, -z));
    }
    const vesselCurve = new THREE.CatmullRomCurve3(centerlinePoints);
    const tunnelGeo = new THREE.TubeGeometry(vesselCurve, 130, VESSEL_RADIUS, 20, false);
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x7c182c,
      roughness: 0.62,
      metalness: 0.08,
      bumpMap: bumpTex,
      bumpScale: 0.04,
      side: THREE.BackSide,
    });
    const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    scene.add(tunnelMesh);

    // Distance landmark vessel rings every 16m
    const ringGeo = new THREE.TorusGeometry(VESSEL_RADIUS - 0.14, 0.07, 10, 28);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xce3d52,
      emissive: 0x5c1120,
      emissiveIntensity: 0.4,
      roughness: 0.35,
    });
    for (let z = 14; z < TRACK_LENGTH; z += 16) {
      const c = computeBloodVesselCenterAt(z);
      const next = computeBloodVesselCenterAt(z + 0.5);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(c.x, c.y, -z);
      ring.lookAt(next.x, next.y, -(z + 0.5));
      scene.add(ring);
    }

    // Destination Oxygen Capillary Portal at end of track
    const endCenter = computeBloodVesselCenterAt(TRACK_LENGTH);
    const goalRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.18, 16, 36),
      new THREE.MeshStandardMaterial({
        color: 0x5ef0ff,
        emissive: 0x16b8cc,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      })
    );
    goalRing.position.set(endCenter.x, endCenter.y, -TRACK_LENGTH);
    scene.add(goalRing);

    // Instanced ambient plasma platelets drifting along the bloodstream
    const ambientGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const ambientMat = new THREE.MeshStandardMaterial({
      color: 0xffb7c5,
      emissive: 0x802438,
      emissiveIntensity: 0.3,
      roughness: 0.4,
    });
    const ambientCount = 42;
    const ambientInstanced = new THREE.InstancedMesh(ambientGeo, ambientMat, ambientCount);
    ambientInstanced.frustumCulled = false;
    const ambientSeeds = Array.from({ length: ambientCount }, (_, i) => ({
      z: (i / ambientCount) * TRACK_LENGTH,
      angle: i * 1.4,
      rad: 1.4 + (i % 3) * 0.45,
    }));
    ambientSeeds.forEach((s, idx) => {
      const c = computeBloodVesselCenterAt(s.z);
      _dummy.position.set(c.x + Math.cos(s.angle) * s.rad, c.y + Math.sin(s.angle) * s.rad, -s.z);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      ambientInstanced.setMatrixAt(idx, _dummy.matrix);
    });
    ambientInstanced.instanceMatrix.needsUpdate = true;
    ambientInstanced.computeBoundingSphere();
    scene.add(ambientInstanced);

    // Build Hero Player Erythrocyte
    const { group: playerGroup, o2Core } = buildPlayerErythrocyte(bumpTex);
    scene.add(playerGroup);

    // Spawn Collectibles & Hazards cleanly spaced along z >= 18
    const itemsGroup = new THREE.Group();
    scene.add(itemsGroup);
    const tunnelItems: TunnelItem[] = [];

    const populateItems = () => {
      while (itemsGroup.children.length > 0) {
        const child = itemsGroup.children[0];
        itemsGroup.remove(child);
        disposeObjectHierarchy(child);
      }
      tunnelItems.length = 0;

      let idSeq = 1;
      for (let z = 18; z < TRACK_LENGTH - 6; z += 5.5) {
        const patternIdx = idSeq % 5;
        const kind: TunnelItem['kind'] =
          patternIdx === 0 || patternIdx === 2
            ? 'o2'
            : patternIdx === 3
              ? 'glucose'
              : patternIdx === 1
                ? 'plaque'
                : 'germ';
        const angle = idSeq * 1.65;
        const rad = kind === 'o2' || kind === 'glucose' ? 0.85 : 1.05;
        const offsetX = Math.cos(angle) * rad;
        const offsetY = Math.sin(angle) * (rad * 0.72);
        const center = computeBloodVesselCenterAt(z);
        const mesh = createTunnelItemMesh(kind);
        mesh.position.set(center.x + offsetX, center.y + offsetY, -z);
        itemsGroup.add(mesh);

        tunnelItems.push({
          id: idSeq++,
          kind,
          zDist: z,
          offsetX,
          offsetY,
          collected: false,
          mesh,
        });
      }
    };

    // Mutable simulation state
    const heldKeys = new Set<string>();
    let touchSteerX = 0;
    let touchSteerY = 0;
    let bufferedBoost = false;

    let zProgress = 0;
    let localX = 0;
    let localY = 0;
    let vx = 0;
    let vy = 0;
    let hpVal = 5;
    let scoreVal = 0;
    let o2Collected = 0;
    let invulnTimer = 0;
    let boostTimer = 0;
    let boostCooldown = 0;
    let hitstopTimer = 0;
    let trauma = 0;
    let elapsedTotal = 0;
    let pendingEndTimer = -1;
    let pendingVictory = false;
    let lastHudSyncMs = 0;
    let snapCamera = true;

    const resetSession = (nextState: GameShellState) => {
      zProgress = 0;
      localX = 0;
      localY = 0;
      vx = 0;
      vy = 0;
      hpVal = 5;
      scoreVal = 0;
      o2Collected = 0;
      invulnTimer = 0.8;
      boostTimer = 0;
      boostCooldown = 0;
      hitstopTimer = 0;
      trauma = 0;
      elapsedTotal = 0;
      pendingEndTimer = -1;
      pendingVictory = false;
      snapCamera = true;
      heldKeys.clear();
      bufferedBoost = false;
      populateItems();

      setHp(5);
      setScore(0);
      setProgressPct(0);
      setO2Count(0);
      setBoostLabel('Siap (Spasi)');
      shellStateRef.current = nextState;
    };

    gameApiRef.current = {
      resetSession,
      triggerBoost: () => {
        bufferedBoost = true;
      },
      setTouchSteer: (dx, dy) => {
        touchSteerX = dx;
        touchSteerY = dy;
      },
    };

    resetSession(shellStateRef.current);

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && shellStateRef.current === 'playing') {
        e.preventDefault();
      }
      heldKeys.add(e.code);
      if (shellStateRef.current === 'playing' && e.code === 'Space') {
        bufferedBoost = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => heldKeys.delete(e.code);
    const onBlur = () => {
      heldKeys.clear();
      touchSteerX = 0;
      touchSteerY = 0;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setWebglUnavailable(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || disposed) return;
      const w = Math.max(260, Math.floor(entry.contentRect.width));
      const h = Math.max(240, Math.floor(entry.contentRect.height));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    let lastMs = performance.now();
    let frameId = 0;
    let disposed = false;

    const finishRun = (victory: boolean) => {
      const xpEarned = computeGameXpReward('darah-3d', scoreVal, victory);
      const finalResult: GameRunResult = {
        gameId: 'darah-3d',
        victory,
        score: Math.round(scoreVal),
        elapsedSeconds: Math.round(elapsedTotal),
        primaryStatLabel: 'OKSIGEN (O₂)',
        primaryStatValue: `${o2Collected} Tabung`,
        secondaryStatLabel: 'JARAK KAPILER',
        secondaryStatValue: `${Math.min(100, Math.round((zProgress / TRACK_LENGTH) * 100))}%`,
        xpEarned,
      };
      setRunResult(finalResult);
      setShellState('gameover');
      callbacksRef.current.onRunFinished(finalResult);
      if (victory) gameAudio.playVictory();
      else gameAudio.playDefeat();
    };

    const afterDraw = (cb: () => void) => {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const st = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const stepSimulation = (rawDt: number, nowSec: number) => {
      const dt = clampGameDeltaTime(rawDt);

      // Rotate collectibles gently
      for (let i = 0; i < tunnelItems.length; i++) {
        if (!tunnelItems[i].collected) {
          tunnelItems[i].mesh.rotation.y += dt * 2.1;
        }
      }
      goalRing.rotation.z += dt * 1.4;

      // Title screen live world camera tour
      if (shellStateRef.current === 'title') {
        const previewZ = 4 + Math.sin(nowSec * 0.45) * 3;
        const c = computeBloodVesselCenterAt(previewZ);
        playerGroup.position.set(c.x, c.y - 0.15, -previewZ);
        playerGroup.rotation.set(0, Math.sin(nowSec * 0.6) * 0.2, Math.cos(nowSec * 0.6) * 0.1);
        camera.position.set(c.x + Math.sin(nowSec * 0.4) * 1.2, c.y + 0.85, -(previewZ - 4.8));
        camera.lookAt(c.x, c.y, -(previewZ + 7));
        return;
      }

      if (shellStateRef.current !== 'playing') return;

      trauma = Math.max(0, trauma - dt * 2.4);
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

      invulnTimer = Math.max(0, invulnTimer - dt);
      boostTimer = Math.max(0, boostTimer - dt);
      boostCooldown = Math.max(0, boostCooldown - dt);

      if (bufferedBoost && boostCooldown <= 0) {
        boostTimer = 1.6;
        boostCooldown = 4.2;
        trauma = Math.min(1, trauma + 0.15);
        gameAudio.playSkillWave();
      }
      bufferedBoost = false;

      // Steer inside blood vessel lumen
      let sx = touchSteerX;
      let sy = touchSteerY;
      if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) sx -= 1;
      if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) sx += 1;
      if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) sy += 1;
      if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) sy -= 1;

      const steerAccel = 14;
      vx += (sx * 4.4 - vx) * Math.min(1, steerAccel * dt);
      vy += (sy * 3.8 - vy) * Math.min(1, steerAccel * dt);
      localX += vx * dt;
      localY += vy * dt;

      const radial = Math.hypot(localX, localY);
      if (radial > SAFE_STEER_RADIUS) {
        localX = (localX / radial) * SAFE_STEER_RADIUS;
        localY = (localY / radial) * SAFE_STEER_RADIUS;
      }

      // Forward blood flow velocity
      const forwardSpeed = boostTimer > 0 ? 18.5 : 11.2;
      zProgress += forwardSpeed * dt;
      scoreVal += forwardSpeed * dt * 4.5;

      const center = computeBloodVesselCenterAt(zProgress);
      const ahead = computeBloodVesselCenterAt(zProgress + 6);

      playerGroup.position.set(center.x + localX, center.y + localY, -zProgress);
      playerGroup.rotation.z = THREE.MathUtils.damp(playerGroup.rotation.z, -vx * 0.14, 9, dt);
      playerGroup.rotation.x = THREE.MathUtils.damp(playerGroup.rotation.x, vy * 0.1, 9, dt);

      // Visual O2 orb glow scales with collected O2 (never hide hero model)
      o2Core.scale.setScalar(1 + Math.min(0.65, o2Collected * 0.05));
      playerGroup.visible = true;

      // Smooth damped follow camera + FOV speed kick + trauma shake
      const desiredFov = boostTimer > 0 ? 59 : 50;
      camera.fov = THREE.MathUtils.damp(camera.fov, desiredFov, 7, dt);
      camera.updateProjectionMatrix();

      const shake = trauma * trauma * 0.28;
      _vecA.set(
        center.x + localX * 0.58 + (Math.random() - 0.5) * shake,
        center.y + localY * 0.5 + 0.72 + (Math.random() - 0.5) * shake,
        -(zProgress - 3.6)
      );
      if (snapCamera) {
        camera.position.copy(_vecA);
        snapCamera = false;
      } else {
        camera.position.lerp(_vecA, 1 - Math.exp(-9 * dt));
      }
      _vecB.set(ahead.x + localX * 0.3, ahead.y + localY * 0.3, -(zProgress + 6.5));
      camera.lookAt(_vecB);

      // Collision checks along tunnel items
      for (let i = 0; i < tunnelItems.length; i++) {
        const item = tunnelItems[i];
        if (item.collected) continue;
        if (Math.abs(item.zDist - zProgress) < 0.95) {
          const dist = Math.hypot(item.offsetX - localX, item.offsetY - localY);
          if (dist < 0.85) {
            item.collected = true;
            item.mesh.visible = false;
            if (item.kind === 'o2') {
              o2Collected += 1;
              scoreVal += 120;
              gameAudio.playPickup();
            } else if (item.kind === 'glucose') {
              scoreVal += 180;
              boostTimer = Math.max(boostTimer, 1.2);
              gameAudio.playPickup();
            } else if (boostTimer > 0) {
              // O2 boost shield smashes plaque/germ harmlessly
              scoreVal += 140;
              hitstopTimer = 0.035;
              trauma = Math.min(1, trauma + 0.25);
              gameAudio.playHit();
            } else if (invulnTimer <= 0) {
              hpVal = Math.max(0, hpVal - 1);
              invulnTimer = 1.1;
              hitstopTimer = 0.05;
              trauma = Math.min(1, trauma + 0.55);
              gameAudio.playHurt();
              if (hpVal <= 0) {
                pendingVictory = false;
                pendingEndTimer = 0.45;
              }
            }
          }
        }
      }

      // Check finish line
      if (zProgress >= TRACK_LENGTH && pendingEndTimer < 0) {
        scoreVal += 450 + hpVal * 80;
        pendingVictory = true;
        pendingEndTimer = 0.4;
      }

      // Throttled HUD sync
      const nowMs = performance.now();
      if (nowMs - lastHudSyncMs >= 110) {
        lastHudSyncMs = nowMs;
        setHp(hpVal);
        setScore(Math.round(scoreVal));
        setO2Count(o2Collected);
        setProgressPct(Math.min(100, Math.round((zProgress / TRACK_LENGTH) * 100)));
        setBoostLabel(
          boostTimer > 0
            ? 'Aktif!'
            : boostCooldown > 0.1
              ? `${boostCooldown.toFixed(1)}s`
              : 'Siap (Spasi)'
        );
      }
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const rawDt = (now - lastMs) / 1000;
      lastMs = now;

      stepSimulation(rawDt, now / 1000);
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

      disposeObjectHierarchy(scene);
      bumpTex.dispose();
      envTarget.dispose();
      renderer.dispose();
      gameApiRef.current = null;
    };
  }, []);

  if (webglUnavailable) {
    return (
      <div className="lab3d-fallback">
        <div className="lab3d-fallback-card">
          <h3>Mode WebGL Tidak Tersedia</h3>
          <p>Konteks WebGL 3D tidak dapat diinisialisasi pada perangkat ini.</p>
          <br />
          <button type="button" className="game-cta-ghost" onClick={onExitToHub}>
            ← Kembali ke Daftar Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-viewport" data-game-id="darah-3d">
      <div ref={mountRef} className="game-canvas-mount" data-testid="game-3d-darah-canvas" />

      <GameShellOverlay
        spec={spec}
        shellState={shellState}
        hp={hp}
        maxHp={5}
        score={score}
        bestScore={bestScore}
        phaseLabel="JARAK KAPILER"
        phaseValue={`${progressPct}%`}
        secondaryLabel="OKSIGEN"
        secondaryValue={`${o2Count} O₂`}
        isMuted={isMuted}
        runResult={runResult}
        onStart={() => {
          setRunResult(null);
          gameApiRef.current?.resetSession('playing');
          setShellState('playing');
          gameAudio.playPickup();
        }}
        onResume={() => setShellState('playing')}
        onPause={() => setShellState('paused')}
        onRestart={() => {
          setRunResult(null);
          gameApiRef.current?.resetSession('playing');
          setShellState('playing');
          gameAudio.playPickup();
        }}
        onReturnTitle={() => {
          setRunResult(null);
          gameApiRef.current?.resetSession('title');
          setShellState('title');
        }}
        onExitToHub={onExitToHub}
        onToggleMute={() => setIsMuted(gameAudio.toggleMute())}
        onOpenMaterialDetail={onOpenMaterialDetail}
      >
        <div className="game-hud-cluster bottom-right">
          <div className="game-2d-touch-pad" aria-label="Kontrol kemudi 3D sentuh">
            <button
              type="button"
              className="game-touch-btn"
              onPointerDown={() => gameApiRef.current?.setTouchSteer(0, 1)}
              onPointerUp={() => gameApiRef.current?.setTouchSteer(0, 0)}
              onPointerLeave={() => gameApiRef.current?.setTouchSteer(0, 0)}
              aria-label="Naik"
            >
              ▲
            </button>
            <div className="game-2d-touch-mid">
              <button
                type="button"
                className="game-touch-btn"
                onPointerDown={() => gameApiRef.current?.setTouchSteer(-1, 0)}
                onPointerUp={() => gameApiRef.current?.setTouchSteer(0, 0)}
                onPointerLeave={() => gameApiRef.current?.setTouchSteer(0, 0)}
                aria-label="Kiri"
              >
                ◀
              </button>
              <button
                type="button"
                className="game-touch-btn"
                onPointerDown={() => gameApiRef.current?.setTouchSteer(1, 0)}
                onPointerUp={() => gameApiRef.current?.setTouchSteer(0, 0)}
                onPointerLeave={() => gameApiRef.current?.setTouchSteer(0, 0)}
                aria-label="Kanan"
              >
                ▶
              </button>
            </div>
            <button
              type="button"
              className="game-touch-btn"
              onPointerDown={() => gameApiRef.current?.setTouchSteer(0, -1)}
              onPointerUp={() => gameApiRef.current?.setTouchSteer(0, 0)}
              onPointerLeave={() => gameApiRef.current?.setTouchSteer(0, 0)}
              aria-label="Turun"
            >
              ▼
            </button>
          </div>

          <div className="game-action-dock">
            <button
              type="button"
              className="game-skill-btn primary"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                gameApiRef.current?.triggerBoost();
              }}
            >
              <span>Dorongan O₂ [Spasi]</span>
              <strong className="tabular-nums">{boostLabel}</strong>
            </button>
          </div>
        </div>
      </GameShellOverlay>
    </div>
  );
}
