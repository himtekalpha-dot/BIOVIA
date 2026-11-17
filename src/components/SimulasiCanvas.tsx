import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SIMULATIONS_BY_ID } from '../data/simulations';
import {
  createContactShadowTexture,
  createLabFloorTexture,
  createOrganicBumpTexture,
} from '../lab3d/proceduralTextures';
import {
  buildSimulationById,
  type BuiltSimulationScene,
} from '../lab3d/simulationBuilders';
import { disposeObjectHierarchy } from '../lab3d/specimenBuilders';
import type {
  LabLightingPreset,
  SimComputedState,
  SimId,
  SimParams,
} from '../types/biovia';

interface SimulasiCanvasProps {
  simId: SimId;
  params: SimParams;
  computedState: SimComputedState;
  isPlaying: boolean;
  speedMultiplier: number;
  lightingPreset: LabLightingPreset;
  resetCamTrigger: number;
}

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

export function SimulasiCanvas({
  simId,
  params,
  computedState,
  isPlaying,
  speedMultiplier,
  lightingPreset,
  resetCamTrigger,
}: SimulasiCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const propsRef = useRef({
    simId,
    params,
    computedState,
    isPlaying,
    speedMultiplier,
    lightingPreset,
  });
  propsRef.current = {
    simId,
    params,
    computedState,
    isPlaying,
    speedMultiplier,
    lightingPreset,
  };

  const controllerApiRef = useRef<{
    applySimulation: (id: SimId) => void;
    applyLighting: (preset: LabLightingPreset) => void;
    triggerCameraReset: (id: SimId) => void;
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
    const initialSpec = SIMULATIONS_BY_ID[propsRef.current.simId];
    camera.position.set(...initialSpec.defaultCameraPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 2.4;
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

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const bumpTex = createOrganicBumpTexture(maxAnisotropy);
    const contactShadowTex = createContactShadowTexture();
    const floorDarkTex = createLabFloorTexture(maxAnisotropy, true);
    const floorLightTex = createLabFloorTexture(maxAnisotropy, false);

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

    let activeSim: BuiltSimulationScene | null = null;
    let camTransitionActive = false;
    let simElapsed = 0;
    let lastTickMs = performance.now();
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let loopRunning = false;
    let disposed = false;

    const applySimulation = (id: SimId) => {
      if (activeSim) {
        scene.remove(activeSim.root);
        disposeObjectHierarchy(activeSim.root);
        activeSim = null;
      }

      simElapsed = 0;
      activeSim = buildSimulationById(id, bumpTex, contactShadowTex, isSoftwareGl);
      scene.add(activeSim.root);
      activeSim.update(
        propsRef.current.params,
        propsRef.current.computedState,
        0.016,
        0
      );

      const spec = SIMULATIONS_BY_ID[id];
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

    const stepSimulation = (rawDelta: number) => {
      const { params: curParams, computedState: curState, isPlaying: playing, speedMultiplier: spd } =
        propsRef.current;

      if (activeSim) {
        const dt = playing ? rawDelta * spd : 0.001;
        if (playing) {
          simElapsed += dt;
        }
        activeSim.update(curParams, curState, dt, simElapsed);
      }

      if (camTransitionActive) {
        const alpha = 1 - Math.exp(-7 * rawDelta);
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

    const hasActiveLoop = () => propsRef.current.isPlaying || camTransitionActive;

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
          if (!disposed && (renderDirty || hasActiveLoop())) {
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

    applySimulation(propsRef.current.simId);
    camTransitionActive = false;
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    controllerApiRef.current = {
      applySimulation: (id) => {
        applySimulation(id);
        wakeLoop();
      },
      applyLighting: (preset) => {
        applyLighting(preset);
        wakeLoop();
      },
      triggerCameraReset: (id) => {
        const spec = SIMULATIONS_BY_ID[id];
        _desiredCamPos.set(...spec.defaultCameraPos);
        _desiredCamTarget.set(...spec.defaultTarget);
        camTransitionActive = true;
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

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setWebglUnavailable(true);
    };
    const onContextRestored = () => {
      setWebglUnavailable(false);
      wakeLoop();
    };
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

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      if (activeSim) {
        disposeObjectHierarchy(activeSim.root);
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
    controllerApiRef.current?.applySimulation(simId);
  }, [simId]);

  useEffect(() => {
    controllerApiRef.current?.applyLighting(lightingPreset);
  }, [lightingPreset]);

  useEffect(() => {
    controllerApiRef.current?.wakeLoop();
  }, [params, computedState, isPlaying, speedMultiplier]);

  useEffect(() => {
    if (resetCamTrigger > 0) {
      controllerApiRef.current?.triggerCameraReset(simId);
    }
  }, [resetCamTrigger, simId]);

  if (webglUnavailable) {
    return (
      <div className="lab3d-fallback" role="region" aria-label="Fallback Simulasi 3D">
        <div className="lab3d-fallback-card">
          <span className="lab3d-fallback-icon">⌁</span>
          <h3>Mode Pratinjau Simulasi Biologi</h3>
          <p>
            Konteks WebGL tidak tersedia pada sesi browser ini. Kamu tetap dapat mengatur parameter
            eksperimen di bawah untuk melihat hasil perhitungan telemetri secara langsung.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className="lab3d-canvas-host" data-testid="simulasi-canvas" />;
}
