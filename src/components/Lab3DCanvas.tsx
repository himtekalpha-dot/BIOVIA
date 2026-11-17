import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LAB_SPECIMENS_BY_ID } from '../data/labSpecimens';
import {
  createContactShadowTexture,
  createLabFloorTexture,
  createOrganicBumpTexture,
} from '../lab3d/proceduralTextures';
import {
  buildSpecimenById,
  disposeObjectHierarchy,
  type BuiltSpecimenScene,
} from '../lab3d/specimenBuilders';
import type { LabLightingPreset, LabSpecimenId } from '../types/biovia';

interface Lab3DCanvasProps {
  specimenId: LabSpecimenId;
  explodeAmount: number;
  selectedPartId: string | null;
  lightingPreset: LabLightingPreset;
  animateMotion: boolean;
  resetTrigger: number;
  onSelectPart: (partId: string | null) => void;
}

const _pointer = new THREE.Vector2();
const _targetPos = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _desiredCamTarget = new THREE.Vector3();

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

const LIGHTING_CONFIG: Record<
  LabLightingPreset,
  {
    bgHex: number;
    fogDensity: number;
    keyColor: number;
    keyIntensity: number;
    hemiSky: number;
    hemiGround: number;
    hemiIntensity: number;
    rimColor: number;
    rimIntensity: number;
    darkFloor: boolean;
  }
> = {
  mikroskop: {
    bgHex: 0x0d2138,
    fogDensity: 0.045,
    keyColor: 0xfff3de,
    keyIntensity: 2.2,
    hemiSky: 0x86e5f3,
    hemiGround: 0x0f253c,
    hemiIntensity: 0.95,
    rimColor: 0x35d6e8,
    rimIntensity: 1.25,
    darkFloor: true,
  },
  studio: {
    bgHex: 0xdce8f3,
    fogDensity: 0.036,
    keyColor: 0xfff6e6,
    keyIntensity: 2.35,
    hemiSky: 0xd2ecff,
    hemiGround: 0x5c778b,
    hemiIntensity: 1.05,
    rimColor: 0x54d5e4,
    rimIntensity: 0.85,
    darkFloor: false,
  },
  klinik: {
    bgHex: 0x162b40,
    fogDensity: 0.042,
    keyColor: 0xffffff,
    keyIntensity: 2.25,
    hemiSky: 0xbfe8ff,
    hemiGround: 0x193146,
    hemiIntensity: 1.0,
    rimColor: 0x45c8d8,
    rimIntensity: 1.1,
    darkFloor: true,
  },
};

export function Lab3DCanvas({
  specimenId,
  explodeAmount,
  selectedPartId,
  lightingPreset,
  animateMotion,
  resetTrigger,
  onSelectPart,
}: Lab3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const propsRef = useRef({
    specimenId,
    explodeAmount,
    selectedPartId,
    lightingPreset,
    animateMotion,
    onSelectPart,
  });
  propsRef.current = {
    specimenId,
    explodeAmount,
    selectedPartId,
    lightingPreset,
    animateMotion,
    onSelectPart,
  };

  const controllerApiRef = useRef<{
    applySpecimen: (id: LabSpecimenId) => void;
    applyLighting: (preset: LabLightingPreset) => void;
    applyHighlight: (partId: string | null) => void;
    triggerCameraReset: (id: LabSpecimenId) => void;
    wakeLoop: () => void;
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
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initialW = Math.max(300, container.clientWidth || 800);
    const initialH = Math.max(260, container.clientHeight || 520);
    renderer.setSize(initialW, initialH);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const initialLight = LIGHTING_CONFIG[propsRef.current.lightingPreset];
    scene.background = new THREE.Color(initialLight.bgHex);
    scene.fog = new THREE.FogExp2(initialLight.bgHex, initialLight.fogDensity);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, initialW / initialH, 0.1, 60);
    const initialSpec = LAB_SPECIMENS_BY_ID[propsRef.current.specimenId];
    camera.position.set(...initialSpec.defaultCameraPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 2.35;
    controls.maxDistance = 9.5;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(...initialSpec.defaultTarget);
    controls.update();

    // 3-point laboratory studio lighting rig
    const hemiLight = new THREE.HemisphereLight(
      initialLight.hemiSky,
      initialLight.hemiGround,
      initialLight.hemiIntensity
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(initialLight.keyColor, initialLight.keyIntensity);
    keyLight.position.set(4.5, 6.2, 4.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 18;
    keyLight.shadow.camera.left = -3.8;
    keyLight.shadow.camera.right = 3.8;
    keyLight.shadow.camera.top = 3.8;
    keyLight.shadow.camera.bottom = -3.8;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(initialLight.rimColor, initialLight.rimIntensity);
    rimLight.position.set(-4.2, 3.0, -4.5);
    scene.add(rimLight);

    // Grounded lab calibration floor
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const bumpTex = createOrganicBumpTexture(maxAnisotropy);
    const contactShadowTex = createContactShadowTexture();
    let floorDarkTex = createLabFloorTexture(maxAnisotropy, true);
    let floorLightTex = createLabFloorTexture(maxAnisotropy, false);

    const floorGeo = new THREE.CircleGeometry(18, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: initialLight.darkFloor ? floorDarkTex : floorLightTex,
      roughness: 0.88,
      metalness: 0.08,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -1.25;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);

    let activeSpecimen: BuiltSpecimenScene | null = null;
    let currentExplode = propsRef.current.explodeAmount;
    let camTransitionActive = false;
    let motionElapsed = 0;
    let lastTickMs = performance.now();
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let loopRunning = false;
    let disposed = false;

    const applyHighlight = (partId: string | null) => {
      if (!activeSpecimen) return;
      activeSpecimen.partGroups.forEach((group, key) => {
        const isSelected = Boolean(partId && key === partId);
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mat = mesh.material;
            if (mat instanceof THREE.MeshStandardMaterial) {
              if (isSelected) {
                mat.emissive.setHex(0x168ea6);
                mat.emissiveIntensity = 0.48;
              } else {
                const origHex =
                  typeof mesh.userData.baseEmissiveHex === 'number'
                    ? mesh.userData.baseEmissiveHex
                    : 0x000000;
                const origIntensity =
                  typeof mesh.userData.baseEmissiveIntensity === 'number'
                    ? mesh.userData.baseEmissiveIntensity
                    : 0;
                mat.emissive.setHex(origHex);
                mat.emissiveIntensity = origIntensity;
              }
            }
          }
        });
      });
    };

    const applySpecimen = (id: LabSpecimenId) => {
      if (activeSpecimen) {
        scene.remove(activeSpecimen.root);
        disposeObjectHierarchy(activeSpecimen.root);
        activeSpecimen = null;
      }

      activeSpecimen = buildSpecimenById(id, bumpTex, contactShadowTex, isSoftwareGl);
      scene.add(activeSpecimen.root);
      currentExplode = propsRef.current.explodeAmount;

      activeSpecimen.partGroups.forEach((group) => {
        const base = group.userData.basePosition as THREE.Vector3;
        const offset = group.userData.explodeOffset as THREE.Vector3;
        group.position.copy(base).addScaledVector(offset, currentExplode);
      });

      applyHighlight(propsRef.current.selectedPartId);
      const spec = LAB_SPECIMENS_BY_ID[id];
      _desiredCamPos.set(...spec.defaultCameraPos);
      _desiredCamTarget.set(...spec.defaultTarget);
      camTransitionActive = true;
    };

    const applyLighting = (preset: LabLightingPreset) => {
      const cfg = LIGHTING_CONFIG[preset];
      (scene.background as THREE.Color).setHex(cfg.bgHex);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(cfg.bgHex);
        scene.fog.density = cfg.fogDensity;
      }
      keyLight.color.setHex(cfg.keyColor);
      keyLight.intensity = cfg.keyIntensity;
      hemiLight.color.setHex(cfg.hemiSky);
      hemiLight.groundColor.setHex(cfg.hemiGround);
      hemiLight.intensity = cfg.hemiIntensity;
      rimLight.color.setHex(cfg.rimColor);
      rimLight.intensity = cfg.rimIntensity;
      floorMat.map = cfg.darkFloor ? floorDarkTex : floorLightTex;
      floorMat.needsUpdate = true;
    };

    const stepSimulation = (delta: number) => {
      const targetExplode = propsRef.current.explodeAmount;
      currentExplode = THREE.MathUtils.damp(currentExplode, targetExplode, 7.5, delta);

      if (activeSpecimen) {
        activeSpecimen.partGroups.forEach((group) => {
          const base = group.userData.basePosition as THREE.Vector3;
          const offset = group.userData.explodeOffset as THREE.Vector3;
          _targetPos.copy(base).addScaledVector(offset, currentExplode);
          group.position.copy(_targetPos);
        });

        if (propsRef.current.animateMotion) {
          motionElapsed += delta;
          activeSpecimen.root.rotation.y += delta * 0.28;

          const nodes = activeSpecimen.animatedNodes;
          if (nodes.kind === 'lungs') {
            const breath = 1 + Math.sin(motionElapsed * 2.2) * 0.045;
            nodes.leftLung?.scale.set(breath, 1 + (breath - 1) * 0.5, breath);
            nodes.rightLung?.scale.set(breath, 1 + (breath - 1) * 0.5, breath);
            if (nodes.diaphragm) {
              nodes.diaphragm.position.y = -0.66 - Math.sin(motionElapsed * 2.2) * 0.04;
            }
          } else if (nodes.kind === 'heart' && nodes.heartCore) {
            const beatPhase = (motionElapsed * 1.35) % 1;
            const systole =
              beatPhase < 0.22
                ? Math.sin((beatPhase / 0.22) * Math.PI) * 0.055
                : beatPhase < 0.42
                  ? Math.sin(((beatPhase - 0.22) / 0.2) * Math.PI) * 0.03
                  : 0;
            const s = 1 + systole;
            nodes.heartCore.scale.set(s, 1 - systole * 0.35, s);
          } else if (nodes.kind === 'cell' && nodes.floatingVesicles) {
            nodes.floatingVesicles.forEach((vesicle, idx) => {
              vesicle.position.y += Math.sin(motionElapsed * 2.4 + idx * 1.4) * 0.0007;
            });
          }
        }
      }

      if (camTransitionActive) {
        const alpha = 1 - Math.exp(-7 * delta);
        camera.position.lerp(_desiredCamPos, alpha);
        controls.target.lerp(_desiredCamTarget, alpha);
        if (
          camera.position.distanceTo(_desiredCamPos) < 0.015 &&
          controls.target.distanceTo(_desiredCamTarget) < 0.015
        ) {
          camera.position.copy(_desiredCamPos);
          controls.target.copy(_desiredCamTarget);
          camTransitionActive = false;
        }
      }
    };

    const hasActiveTransition = () =>
      propsRef.current.animateMotion ||
      camTransitionActive ||
      Math.abs(currentExplode - propsRef.current.explodeAmount) > 0.002;

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
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      loopRunning = true;

      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const delta = Math.min(0.08, Math.max(0.001, (now - lastTickMs) / 1000));
        lastTickMs = now;

        stepSimulation(delta);
        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          loopRunning = false;
          if (!disposed && (renderDirty || hasActiveTransition())) {
            requestRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      });
    };

    const wakeLoop = () => {
      lastTickMs = performance.now();
      if (!loopRunning) {
        requestRender();
      } else {
        renderDirty = true;
      }
    };

    applySpecimen(propsRef.current.specimenId);
    camTransitionActive = false;
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    controllerApiRef.current = {
      applySpecimen: (id) => {
        applySpecimen(id);
        wakeLoop();
      },
      applyLighting: (preset) => {
        applyLighting(preset);
        wakeLoop();
      },
      applyHighlight: (partId) => {
        applyHighlight(partId);
        wakeLoop();
      },
      triggerCameraReset: (id) => {
        const spec = LAB_SPECIMENS_BY_ID[id];
        _desiredCamPos.set(...spec.defaultCameraPos);
        _desiredCamTarget.set(...spec.defaultTarget);
        camTransitionActive = true;
        if (activeSpecimen) {
          activeSpecimen.root.rotation.y = 0;
        }
        wakeLoop();
      },
      wakeLoop,
    };

    const onControlsStart = () => {
      camTransitionActive = false;
    };
    const onControlsChange = () => {
      requestRender();
    };
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('change', onControlsChange);

    // Click vs orbit-drag detection + throttled hover cursor
    let downX = 0;
    let downY = 0;
    let lastHoverMs = 0;

    const updatePointer = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (ev: PointerEvent) => {
      downX = ev.clientX;
      downY = ev.clientY;
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!activeSpecimen) return;
      const now = performance.now();
      if (now - lastHoverMs < 60) return;
      lastHoverMs = now;
      updatePointer(ev);
      raycaster.setFromCamera(_pointer, camera);
      const hits = raycaster.intersectObjects(activeSpecimen.interactables, false);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    const onPointerUp = (ev: PointerEvent) => {
      if (!activeSpecimen) return;
      const dist = Math.hypot(ev.clientX - downX, ev.clientY - downY);
      if (dist > 6) return;

      updatePointer(ev);
      raycaster.setFromCamera(_pointer, camera);
      const hits = raycaster.intersectObjects(activeSpecimen.interactables, false);
      if (hits.length > 0) {
        const hitPart = hits[0].object.userData.partId;
        if (typeof hitPart === 'string') {
          propsRef.current.onSelectPart(hitPart);
        }
      }
    };

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setWebglUnavailable(true);
    };

    const onContextRestored = () => {
      setWebglUnavailable(false);
      wakeLoop();
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || disposed) return;
      const w = Math.max(260, Math.floor(entry.contentRect.width));
      const h = Math.max(240, Math.floor(entry.contentRect.height));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    resizeObserver.observe(container);

    // Initial render
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      if (activeSpecimen) {
        disposeObjectHierarchy(activeSpecimen.root);
      }
      floorGeo.dispose();
      floorMat.dispose();
      floorDarkTex.dispose();
      floorLightTex.dispose();
      bumpTex.dispose();
      contactShadowTex.dispose();
      envTarget.dispose();
      renderer.dispose();
      controllerApiRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerApiRef.current?.applySpecimen(specimenId);
  }, [specimenId]);

  useEffect(() => {
    controllerApiRef.current?.applyLighting(lightingPreset);
  }, [lightingPreset]);

  useEffect(() => {
    controllerApiRef.current?.applyHighlight(selectedPartId);
  }, [selectedPartId]);

  useEffect(() => {
    controllerApiRef.current?.wakeLoop();
  }, [explodeAmount, animateMotion]);

  useEffect(() => {
    if (resetTrigger > 0) {
      controllerApiRef.current?.triggerCameraReset(specimenId);
    }
  }, [resetTrigger, specimenId]);

  if (webglUnavailable) {
    return (
      <div className="lab3d-fallback" role="region" aria-label="Fallback Laboratorium 3D">
        <div className="lab3d-fallback-card">
          <span className="lab3d-fallback-icon">🔬</span>
          <h3>Mode Pratinjau Laboratorium 3D</h3>
          <p>
            Konteks WebGL tidak tersedia pada perangkat atau sesi browser ini. Kamu masih dapat
            memilih bagian organ di bawah untuk membaca fungsi biologisnya atau membuka materi
            lengkap.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className="lab3d-canvas-host" data-testid="lab3d-canvas" />;
}
