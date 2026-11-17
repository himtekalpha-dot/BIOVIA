import { useEffect, useRef, useState } from 'react';
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
  computeDigestiveZoneIndex,
  computeGameXpReward,
} from '../../utils/gameLogic';
import { GameShellOverlay } from './GameShellOverlay';

interface Digestive3DGameProps {
  autostart: boolean;
  bestScore: number;
  onExitToHub: () => void;
  onOpenMaterialDetail: (slug: string) => void;
  onRunFinished: (result: GameRunResult) => void;
}

interface TractNode {
  id: number;
  kind: 'nutrient' | 'fat' | 'acid';
  zDist: number;
  offsetX: number;
  offsetY: number;
  cleared: boolean;
  mesh: THREE.Group;
}

const TRACT_LENGTH = 155;
const LUMEN_RADIUS = 3.35;
const SAFE_FLIGHT_RADIUS = 2.2;
const ZONE_NAMES = ['Lambung Asam', 'Usus Halus Bervili', 'Usus Besar'];

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

function buildMicroProbeCapsule(): {
  group: THREE.Group;
  pulseSphere: THREE.Mesh;
} {
  const group = new THREE.Group();

  // Primary hull cylinder + nose/tail domes (multi-part composite capsule)
  const emeraldMat = new THREE.MeshPhysicalMaterial({
    color: 0x16b877,
    roughness: 0.28,
    metalness: 0.18,
    clearcoat: 0.65,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.56, 24), emeraldMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  const glassDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshPhysicalMaterial({
      color: 0x7ef2ff,
      roughness: 0.12,
      metalness: 0.1,
      clearcoat: 0.85,
    })
  );
  glassDome.rotation.x = -Math.PI / 2;
  glassDome.position.z = -0.26;
  group.add(glassDome);

  // Rear titanium ion thruster collar
  const thrusterMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0e8ba0,
    emissiveIntensity: 0.75,
    roughness: 0.25,
    metalness: 0.75,
  });
  const thruster = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 12, 24), thrusterMat);
  thruster.position.z = 0.3;
  group.add(thruster);

  // Dual lateral enzyme emitter fins
  const podMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.35,
    metalness: 0.5,
  });
  const leftPod = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.28, 6, 12), podMat);
  leftPod.rotation.x = Math.PI / 2;
  leftPod.position.set(-0.34, 0, 0.04);
  const rightPod = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.28, 6, 12), podMat);
  rightPod.rotation.x = Math.PI / 2;
  rightPod.position.set(0.34, 0, 0.04);
  group.add(leftPod, rightPod);

  // Expanding Enzyme Pulse Wave Shell (hidden until fired)
  const pulseSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 16),
    new THREE.MeshBasicMaterial({
      color: 0x55f0a8,
      transparent: true,
      opacity: 0.32,
      wireframe: true,
      depthWrite: false,
    })
  );
  pulseSphere.visible = false;
  group.add(pulseSphere);

  return { group, pulseSphere };
}

function buildTractNodeMesh(kind: TractNode['kind']): THREE.Group {
  const g = new THREE.Group();
  if (kind === 'nutrient') {
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3, 1),
      new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x0f7a52,
        emissiveIntensity: 0.65,
        roughness: 0.18,
      })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.03, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0xa7f3d0, roughness: 0.25 })
    );
    g.add(orb, ring);
  } else if (kind === 'fat') {
    // Composite 3-part lipid globule cluster (neutralizable with Enzyme Blast!)
    const fatMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.42,
      metalness: 0.06,
    });
    const m1 = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), fatMat);
    const m2 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 12), fatMat);
    m2.position.set(0.25, 0.14, 0.05);
    const m3 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), fatMat);
    m3.position.set(-0.24, -0.1, 0.08);
    g.add(m1, m2, m3);
  } else {
    // Acid / toxin droplet with red warning telegraph ring
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 14),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0x9f1239,
        emissiveIntensity: 0.6,
        roughness: 0.28,
      })
    );
    const warnRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.035, 8, 24),
      new THREE.MeshStandardMaterial({
        color: 0xfda4af,
        emissive: 0xf43f5e,
        emissiveIntensity: 0.7,
      })
    );
    g.add(core, warnRing);
  }
  return g;
}

export function Digestive3DGame({
  autostart,
  bestScore,
  onExitToHub,
  onOpenMaterialDetail,
  onRunFinished,
}: Digestive3DGameProps) {
  const spec = EDUCATIONAL_GAMES_BY_ID['pencernaan-3d'];
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [shellState, setShellState] = useState<GameShellState>(autostart ? 'playing' : 'title');
  const [hp, setHp] = useState(5);
  const [score, setScore] = useState(0);
  const [zoneName, setZoneName] = useState(ZONE_NAMES[0]);
  const [nutrientsCount, setNutrientsCount] = useState(0);
  const [pulseLabel, setPulseLabel] = useState('Siap (Spasi)');
  const [isMuted, setIsMuted] = useState(() => gameAudio.isMuted());
  const [runResult, setRunResult] = useState<GameRunResult | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const shellStateRef = useRef<GameShellState>(shellState);
  shellStateRef.current = shellState;

  const callbacksRef = useRef({ onRunFinished });
  callbacksRef.current = { onRunFinished };

  const gameApiRef = useRef<{
    resetSession: (next: GameShellState) => void;
    triggerEnzymePulse: () => void;
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
    scene.background = new THREE.Color(0x281812);
    scene.fog = new THREE.FogExp2(0x281812, 0.03);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(48, initialW / initialH, 0.1, 85);

    const hemiLight = new THREE.HemisphereLight(0xfef3c7, 0x3b1f16, 1.05);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.0);
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 1.05);
    rimLight.position.set(-4, 2, -5);
    scene.add(rimLight);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const bumpTex = createOrganicBumpTexture(maxAnisotropy);

    // Digestive lumen tunnel curve
    const curvePts: THREE.Vector3[] = [];
    for (let z = -6; z <= TRACT_LENGTH + 18; z += 4) {
      const c = computeBloodVesselCenterAt(z * 0.85);
      curvePts.push(new THREE.Vector3(c.x, c.y, -z));
    }
    const tractCurve = new THREE.CatmullRomCurve3(curvePts);
    const tractGeo = new THREE.TubeGeometry(tractCurve, 130, LUMEN_RADIUS, 20, false);
    const tractMat = new THREE.MeshStandardMaterial({
      color: 0x9b4d3b,
      roughness: 0.72,
      metalness: 0.04,
      bumpMap: bumpTex,
      bumpScale: 0.045,
      side: THREE.BackSide,
    });
    const tractMesh = new THREE.Mesh(tractGeo, tractMat);
    scene.add(tractMesh);

    // Instanced Villi projections lining Small Intestine walls (z: 50..112)
    const villusGeo = new THREE.CapsuleGeometry(0.14, 0.55, 6, 10);
    const villusMat = new THREE.MeshStandardMaterial({
      color: 0xd97d60,
      roughness: 0.52,
      bumpMap: bumpTex,
      bumpScale: 0.02,
    });
    const VILLI_COUNT = 54;
    const villiInstanced = new THREE.InstancedMesh(villusGeo, villusMat, VILLI_COUNT);
    villiInstanced.frustumCulled = false;
    for (let i = 0; i < VILLI_COUNT; i++) {
      const z = 50 + (i / VILLI_COUNT) * 62;
      const angle = i * 1.9;
      const center = computeBloodVesselCenterAt(z * 0.85);
      const wallR = LUMEN_RADIUS - 0.35;
      _dummy.position.set(center.x + Math.cos(angle) * wallR, center.y + Math.sin(angle) * wallR, -z);
      _dummy.lookAt(center.x, center.y, -z);
      _dummy.rotateX(Math.PI / 2);
      _dummy.scale.setScalar(0.85 + (i % 4) * 0.12);
      _dummy.updateMatrix();
      villiInstanced.setMatrixAt(i, _dummy.matrix);
    }
    villiInstanced.instanceMatrix.needsUpdate = true;
    villiInstanced.computeBoundingSphere();
    scene.add(villiInstanced);

    // Glowing Absorption Portal at end of digestive tract
    const goalCenter = computeBloodVesselCenterAt(TRACT_LENGTH * 0.85);
    const goalPortal = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.2, 16, 36),
      new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      })
    );
    goalPortal.position.set(goalCenter.x, goalCenter.y, -TRACT_LENGTH);
    scene.add(goalPortal);

    // Micro-Probe Capsule Hero
    const { group: capsuleGroup, pulseSphere } = buildMicroProbeCapsule();
    scene.add(capsuleGroup);

    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);
    const tractNodes: TractNode[] = [];

    const populateNodes = () => {
      while (nodesGroup.children.length > 0) {
        const child = nodesGroup.children[0];
        nodesGroup.remove(child);
        disposeObjectHierarchy(child);
      }
      tractNodes.length = 0;

      let seq = 1;
      for (let z = 18; z < TRACT_LENGTH - 6; z += 5.8) {
        const mod = seq % 5;
        const kind: TractNode['kind'] =
          mod === 0 || mod === 3 ? 'nutrient' : mod === 1 || mod === 4 ? 'fat' : 'acid';
        const angle = seq * 1.45;
        const rad = kind === 'nutrient' ? 0.95 : 1.05;
        const offsetX = Math.cos(angle) * rad;
        const offsetY = Math.sin(angle) * (rad * 0.72);
        const c = computeBloodVesselCenterAt(z * 0.85);
        const mesh = buildTractNodeMesh(kind);
        mesh.position.set(c.x + offsetX, c.y + offsetY, -z);
        nodesGroup.add(mesh);

        tractNodes.push({
          id: seq++,
          kind,
          zDist: z,
          offsetX,
          offsetY,
          cleared: false,
          mesh,
        });
      }
    };

    const heldKeys = new Set<string>();
    let touchSteerX = 0;
    let touchSteerY = 0;
    let bufferedPulse = false;

    let zProgress = 0;
    let localX = 0;
    let localY = 0;
    let vx = 0;
    let vy = 0;
    let hpVal = 5;
    let scoreVal = 0;
    let nutrientsAbsorbed = 0;
    let invulnTimer = 0;
    let pulseTimer = 0;
    let pulseCooldown = 0;
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
      nutrientsAbsorbed = 0;
      invulnTimer = 0.8;
      pulseTimer = 0;
      pulseCooldown = 0;
      hitstopTimer = 0;
      trauma = 0;
      elapsedTotal = 0;
      pendingEndTimer = -1;
      pendingVictory = false;
      snapCamera = true;
      heldKeys.clear();
      bufferedPulse = false;
      populateNodes();

      setHp(5);
      setScore(0);
      setZoneName(ZONE_NAMES[0]);
      setNutrientsCount(0);
      setPulseLabel('Siap (Spasi)');
      shellStateRef.current = nextState;
    };

    gameApiRef.current = {
      resetSession,
      triggerEnzymePulse: () => {
        bufferedPulse = true;
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
        bufferedPulse = true;
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
      const xpEarned = computeGameXpReward('pencernaan-3d', scoreVal, victory);
      const finalResult: GameRunResult = {
        gameId: 'pencernaan-3d',
        victory,
        score: Math.round(scoreVal),
        elapsedSeconds: Math.round(elapsedTotal),
        primaryStatLabel: 'NUTRISI DISERAP',
        primaryStatValue: `${nutrientsAbsorbed} Sari`,
        secondaryStatLabel: 'ZONA DICAPAI',
        secondaryStatValue: ZONE_NAMES[computeDigestiveZoneIndex(zProgress, TRACT_LENGTH)],
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

      for (let i = 0; i < tractNodes.length; i++) {
        if (!tractNodes[i].cleared) {
          tractNodes[i].mesh.rotation.y += dt * 1.9;
        }
      }
      goalPortal.rotation.z += dt * 1.3;

      if (shellStateRef.current === 'title') {
        const previewZ = 5 + Math.sin(nowSec * 0.45) * 3.5;
        const c = computeBloodVesselCenterAt(previewZ * 0.85);
        capsuleGroup.position.set(c.x, c.y - 0.1, -previewZ);
        capsuleGroup.rotation.set(0, Math.sin(nowSec * 0.65) * 0.16, Math.cos(nowSec * 0.65) * 0.08);
        camera.position.set(c.x + Math.sin(nowSec * 0.35) * 1.1, c.y + 0.9, -(previewZ - 4.7));
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
      pulseTimer = Math.max(0, pulseTimer - dt);
      pulseCooldown = Math.max(0, pulseCooldown - dt);

      if (bufferedPulse && pulseCooldown <= 0) {
        pulseTimer = 0.55;
        pulseCooldown = 2.8;
        trauma = Math.min(1, trauma + 0.16);
        gameAudio.playSkillWave();

        // Dissolve fat & acid clusters within 8.5 units ahead
        for (let i = 0; i < tractNodes.length; i++) {
          const n = tractNodes[i];
          if (!n.cleared && (n.kind === 'fat' || n.kind === 'acid')) {
            const dz = n.zDist - zProgress;
            if (dz >= -1.5 && dz <= 8.5) {
              n.cleared = true;
              n.mesh.visible = false;
              scoreVal += 150;
              hitstopTimer = 0.03;
            }
          }
        }
      }
      bufferedPulse = false;

      if (pulseTimer > 0) {
        const pProg = 1 - pulseTimer / 0.55;
        pulseSphere.visible = true;
        pulseSphere.scale.setScalar(0.6 + pProg * 3.8);
      } else {
        pulseSphere.visible = false;
      }

      let sx = touchSteerX;
      let sy = touchSteerY;
      if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) sx -= 1;
      if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) sx += 1;
      if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) sy += 1;
      if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) sy -= 1;

      vx += (sx * 4.5 - vx) * Math.min(1, 13 * dt);
      vy += (sy * 3.8 - vy) * Math.min(1, 13 * dt);
      localX += vx * dt;
      localY += vy * dt;

      const radial = Math.hypot(localX, localY);
      if (radial > SAFE_FLIGHT_RADIUS) {
        localX = (localX / radial) * SAFE_FLIGHT_RADIUS;
        localY = (localY / radial) * SAFE_FLIGHT_RADIUS;
      }

      const speed = 10.6;
      zProgress += speed * dt;
      scoreVal += speed * dt * 4;

      const c = computeBloodVesselCenterAt(zProgress * 0.85);
      const ahead = computeBloodVesselCenterAt((zProgress + 6) * 0.85);

      capsuleGroup.position.set(c.x + localX, c.y + localY, -zProgress);
      capsuleGroup.rotation.z = THREE.MathUtils.damp(capsuleGroup.rotation.z, -vx * 0.14, 9, dt);
      capsuleGroup.rotation.x = THREE.MathUtils.damp(capsuleGroup.rotation.x, vy * 0.1, 9, dt);
      capsuleGroup.visible = true;

      const shake = trauma * trauma * 0.28;
      _vecA.set(
        c.x + localX * 0.58 + (Math.random() - 0.5) * shake,
        c.y + localY * 0.5 + 0.72 + (Math.random() - 0.5) * shake,
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

      // Update tract wall hue smoothly across digestive zones
      const zIdx = computeDigestiveZoneIndex(zProgress, TRACT_LENGTH);
      tractMat.color.setHex(zIdx === 0 ? 0xa3473a : zIdx === 1 ? 0x996548 : 0x457d6e);

      for (let i = 0; i < tractNodes.length; i++) {
        const n = tractNodes[i];
        if (n.cleared) continue;
        if (Math.abs(n.zDist - zProgress) < 0.95) {
          const dist = Math.hypot(n.offsetX - localX, n.offsetY - localY);
          if (dist < 0.88) {
            n.cleared = true;
            n.mesh.visible = false;
            if (n.kind === 'nutrient') {
              nutrientsAbsorbed += 1;
              scoreVal += 130;
              gameAudio.playPickup();
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

      if (zProgress >= TRACT_LENGTH && pendingEndTimer < 0) {
        scoreVal += 450 + hpVal * 80;
        pendingVictory = true;
        pendingEndTimer = 0.4;
      }

      const nowMs = performance.now();
      if (nowMs - lastHudSyncMs >= 110) {
        lastHudSyncMs = nowMs;
        setHp(hpVal);
        setScore(Math.round(scoreVal));
        setNutrientsCount(nutrientsAbsorbed);
        setZoneName(ZONE_NAMES[zIdx]);
        setPulseLabel(pulseCooldown > 0.1 ? `${pulseCooldown.toFixed(1)}s` : 'Siap (Spasi)');
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
    <div className="game-viewport" data-game-id="pencernaan-3d">
      <div ref={mountRef} className="game-canvas-mount" data-testid="game-3d-pencernaan-canvas" />

      <GameShellOverlay
        spec={spec}
        shellState={shellState}
        hp={hp}
        maxHp={5}
        score={score}
        bestScore={bestScore}
        phaseLabel="ZONA ORGAN"
        phaseValue={zoneName}
        secondaryLabel="NUTRISI"
        secondaryValue={`${nutrientsCount} Sari`}
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
          <div className="game-2d-touch-pad" aria-label="Kontrol terbang 3D sentuh">
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
                gameApiRef.current?.triggerEnzymePulse();
              }}
            >
              <span>Pancar Enzim [Spasi]</span>
              <strong className="tabular-nums">{pulseLabel}</strong>
            </button>
          </div>
        </div>
      </GameShellOverlay>
    </div>
  );
}
