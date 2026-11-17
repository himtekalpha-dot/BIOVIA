import * as THREE from 'three';
import type { SimComputedState, SimId, SimParams } from '../types/biovia';
import { createSpecimenPedestal } from './specimenBuilders';

export interface BuiltSimulationScene {
  simId: SimId;
  root: THREE.Group;
  update: (
    params: SimParams,
    computed: SimComputedState,
    dt: number,
    elapsed: number
  ) => void;
}

const _dummy = new THREE.Object3D();
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();
const _colorC = new THREE.Color();

function buildPhotosynthesisSimulation(
  bumpTex: THREE.Texture,
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): BuiltSimulationScene {
  const root = new THREE.Group();
  root.add(createSpecimenPedestal(contactShadowTex, isSoftwareGl));

  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, -0.05, 0);
  root.add(stageGroup);

  // Chloroplast outer cutaway bowl
  const outerGeo = new THREE.SphereGeometry(
    1.18,
    40,
    24,
    0,
    Math.PI * 2,
    Math.PI * 0.44,
    Math.PI * 0.56
  );
  const outerMat = new THREE.MeshPhysicalMaterial({
    color: 0x16784f,
    roughness: 0.36,
    metalness: 0.04,
    clearcoat: 0.65,
    bumpMap: bumpTex,
    bumpScale: 0.025,
    side: THREE.DoubleSide,
  });
  const outerShell = new THREE.Mesh(outerGeo, outerMat);
  outerShell.scale.set(1.22, 0.72, 0.94);
  outerShell.position.y = -0.1;
  outerShell.castShadow = !isSoftwareGl;
  outerShell.receiveShadow = true;
  stageGroup.add(outerShell);

  // Stroma fluid base disc
  const stromaGeo = new THREE.CylinderGeometry(1.3, 1.12, 0.14, 42);
  const stromaMat = new THREE.MeshPhysicalMaterial({
    color: 0x56d496,
    roughness: 0.24,
    metalness: 0.02,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const stromaMesh = new THREE.Mesh(stromaGeo, stromaMat);
  stromaMesh.scale.set(1.06, 1, 0.84);
  stromaMesh.position.y = -0.04;
  stageGroup.add(stromaMesh);

  // Grana stacks (4 stacks of thylakoid discs)
  const granaMat = new THREE.MeshStandardMaterial({
    color: 0x24c977,
    emissive: 0x117042,
    emissiveIntensity: 0.35,
    roughness: 0.32,
    bumpMap: bumpTex,
    bumpScale: 0.015,
  });

  const granaPositions: Array<[number, number, number]> = [
    [-0.68, 0.04, -0.22],
    [-0.14, 0.04, 0.32],
    [0.36, 0.04, -0.26],
    [0.72, 0.04, 0.18],
  ];

  const discGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.07, 24);
  const granaMeshes: THREE.Mesh[] = [];
  granaPositions.forEach(([gx, gy, gz], sIdx) => {
    const stackCount = sIdx % 2 === 0 ? 5 : 4;
    for (let i = 0; i < stackCount; i++) {
      const disc = new THREE.Mesh(discGeo, granaMat);
      disc.position.set(gx, gy + i * 0.088, gz);
      disc.castShadow = !isSoftwareGl;
      disc.receiveShadow = true;
      stageGroup.add(disc);
      granaMeshes.push(disc);
    }
  });

  // Connecting stroma lamellae bridges
  const lamellaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.68, 0.2, -0.22),
    new THREE.Vector3(-0.14, 0.22, 0.32),
    new THREE.Vector3(0.36, 0.2, -0.26),
    new THREE.Vector3(0.72, 0.18, 0.18),
  ]);
  const lamellaGeo = new THREE.TubeGeometry(lamellaCurve, 36, 0.032, 8, false);
  const lamellaMesh = new THREE.Mesh(lamellaGeo, granaMat);
  stageGroup.add(lamellaMesh);

  // Photonic light source ring + beam cone above chloroplast
  const lampRingGeo = new THREE.TorusGeometry(0.42, 0.035, 14, 36);
  const lampRingMat = new THREE.MeshStandardMaterial({
    color: 0xffdf7a,
    emissive: 0xffc947,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.6,
  });
  const lampRing = new THREE.Mesh(lampRingGeo, lampRingMat);
  lampRing.rotation.x = Math.PI / 2;
  lampRing.position.set(0, 1.58, 0);
  stageGroup.add(lampRing);

  const beamGeo = new THREE.ConeGeometry(1.18, 1.65, 32, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffe484,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beamMesh.position.set(0, 0.78, 0);
  stageGroup.add(beamMesh);

  // Instanced O2 bubbles rising from grana
  const O2_COUNT = 36;
  const o2Geo = new THREE.SphereGeometry(0.048, 12, 12);
  const o2Mat = new THREE.MeshPhysicalMaterial({
    color: 0x9cf7ff,
    emissive: 0x2fd6eb,
    emissiveIntensity: 0.5,
    roughness: 0.1,
    clearcoat: 0.9,
    transparent: true,
    opacity: 0.9,
  });
  const o2Instanced = new THREE.InstancedMesh(o2Geo, o2Mat, O2_COUNT);
  o2Instanced.frustumCulled = false;

  const o2Seeds = Array.from({ length: O2_COUNT }, (_, i) => {
    const gPos = granaPositions[i % granaPositions.length];
    return {
      baseX: gPos[0] + Math.sin(i * 2.1) * 0.16,
      baseZ: gPos[2] + Math.cos(i * 1.7) * 0.16,
      phase: i / O2_COUNT,
      wobbleFreq: 1.5 + (i % 5) * 0.35,
      size: 0.75 + (i % 4) * 0.2,
    };
  });
  o2Seeds.forEach((s, idx) => {
    _dummy.position.set(s.baseX, 0.25 + s.phase * 1.2, s.baseZ);
    _dummy.scale.setScalar(s.size);
    _dummy.updateMatrix();
    o2Instanced.setMatrixAt(idx, _dummy.matrix);
  });
  o2Instanced.instanceMatrix.needsUpdate = true;
  o2Instanced.computeBoundingSphere();
  stageGroup.add(o2Instanced);

  // Instanced CO2 molecules descending toward stroma
  const CO2_COUNT = 24;
  const co2Geo = new THREE.SphereGeometry(0.052, 10, 10);
  const co2Mat = new THREE.MeshStandardMaterial({
    color: 0xf7b944,
    emissive: 0xb67611,
    emissiveIntensity: 0.35,
    roughness: 0.28,
  });
  const co2Instanced = new THREE.InstancedMesh(co2Geo, co2Mat, CO2_COUNT);
  co2Instanced.frustumCulled = false;

  const co2Seeds = Array.from({ length: CO2_COUNT }, (_, i) => {
    const angle = (i / CO2_COUNT) * Math.PI * 2;
    const radius = 0.45 + ((i * 7) % 10) * 0.085;
    return {
      angle,
      radius,
      phase: (i * 0.19) % 1,
    };
  });
  co2Seeds.forEach((s, idx) => {
    _dummy.position.set(
      Math.cos(s.angle) * s.radius,
      1.35 - s.phase * 1.1,
      Math.sin(s.angle) * s.radius * 0.8
    );
    _dummy.scale.setScalar(1);
    _dummy.updateMatrix();
    co2Instanced.setMatrixAt(idx, _dummy.matrix);
  });
  co2Instanced.instanceMatrix.needsUpdate = true;
  co2Instanced.computeBoundingSphere();
  stageGroup.add(co2Instanced);

  let o2Clock = 0;
  let co2Clock = 0;

  return {
    simId: 'fotosintesis',
    root,
    update(params, computed, dt, elapsed) {
      const lightNorm = Math.min(1, Math.max(0, params.paramA / 100));
      const co2Norm = Math.min(1, Math.max(0.1, (params.paramB - 100) / 900));
      const rate = computed.rateNormalized;
      const stress = computed.stressNormalized;

      // Subtle chloroplast showcase motion
      stageGroup.rotation.y = Math.sin(elapsed * 0.25) * 0.16;

      // Photonic light beam intensity
      beamMat.opacity = lightNorm * 0.24;
      beamMesh.visible = lightNorm > 0.02;
      lampRingMat.emissiveIntensity = 0.15 + lightNorm * 1.3;

      // Chlorophyll health vs thermal stress color
      _colorA.setHex(0x1fb369);
      _colorB.setHex(0xc48b2b);
      granaMat.color.copy(_colorA).lerp(_colorB, stress * 0.85);
      granaMat.emissive.setHex(stress > 0.45 ? 0x6b3a10 : 0x0d5c35);
      granaMat.emissiveIntensity = 0.08 + rate * 0.32;

      // Gentle thylakoid breathing when rate is active
      granaMeshes.forEach((disc, idx) => {
        const pulse = 1 + Math.sin(elapsed * (2 + rate * 3) + idx * 0.5) * 0.025 * rate;
        disc.scale.set(pulse, 1, pulse);
      });

      // O2 bubbles rising speed proportional to photosynthesis rate
      o2Clock += dt * (0.08 + rate * 0.92);
      const visibleO2Ratio = rate;
      for (let i = 0; i < O2_COUNT; i++) {
        const seed = o2Seeds[i];
        const t = (seed.phase + o2Clock) % 1;
        const activeThreshold = i / O2_COUNT;
        const scale =
          activeThreshold <= visibleO2Ratio + 0.04
            ? seed.size * Math.sin(t * Math.PI) * (0.55 + rate * 0.6)
            : 0.001;
        _dummy.position.set(
          seed.baseX + Math.sin(elapsed * seed.wobbleFreq + i) * 0.06,
          0.22 + t * 1.32,
          seed.baseZ + Math.cos(elapsed * seed.wobbleFreq + i) * 0.06
        );
        _dummy.scale.setScalar(Math.max(0.001, scale));
        _dummy.updateMatrix();
        o2Instanced.setMatrixAt(i, _dummy.matrix);
      }
      o2Instanced.instanceMatrix.needsUpdate = true;

      // CO2 molecules flowing into stroma
      co2Clock += dt * (0.25 + rate * 0.45);
      const activeCo2Count = Math.max(3, Math.round(co2Norm * CO2_COUNT));
      for (let i = 0; i < CO2_COUNT; i++) {
        const seed = co2Seeds[i];
        const t = (seed.phase + co2Clock) % 1;
        const scale = i < activeCo2Count ? (1 - t * 0.45) * 0.95 : 0.001;
        const angle = seed.angle + elapsed * 0.35;
        const radial = seed.radius * (1 - t * 0.38);
        _dummy.position.set(
          Math.cos(angle) * radial,
          1.35 - t * 1.18,
          Math.sin(angle) * radial * 0.8
        );
        _dummy.scale.setScalar(scale);
        _dummy.updateMatrix();
        co2Instanced.setMatrixAt(i, _dummy.matrix);
      }
      co2Instanced.instanceMatrix.needsUpdate = true;
    },
  };
}

function buildCirculationSimulation(
  bumpTex: THREE.Texture,
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): BuiltSimulationScene {
  const root = new THREE.Group();
  root.add(createSpecimenPedestal(contactShadowTex, isSoftwareGl));

  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, 0.14, 0);
  root.add(stageGroup);

  // Composite Cardiac Pump Core
  const heartCore = new THREE.Group();
  stageGroup.add(heartCore);

  const muscleMat = new THREE.MeshPhysicalMaterial({
    color: 0xc23445,
    roughness: 0.36,
    metalness: 0.04,
    clearcoat: 0.45,
    bumpMap: bumpTex,
    bumpScale: 0.025,
  });

  const leftVent = new THREE.Mesh(new THREE.SphereGeometry(0.48, 28, 24), muscleMat);
  leftVent.scale.set(0.86, 1.32, 0.84);
  leftVent.position.set(0.14, -0.22, 0.03);
  leftVent.rotation.z = 0.28;
  leftVent.castShadow = !isSoftwareGl;
  heartCore.add(leftVent);

  const rightVent = new THREE.Mesh(new THREE.SphereGeometry(0.42, 26, 22), muscleMat);
  rightVent.scale.set(0.88, 1.24, 0.82);
  rightVent.position.set(-0.2, -0.18, 0.09);
  rightVent.rotation.z = 0.18;
  rightVent.castShadow = !isSoftwareGl;
  heartCore.add(rightVent);

  const atriumMat = new THREE.MeshStandardMaterial({
    color: 0xa12639,
    roughness: 0.42,
    bumpMap: bumpTex,
    bumpScale: 0.02,
  });
  const leftAtrium = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 18), atriumMat);
  leftAtrium.position.set(0.28, 0.28, -0.05);
  const rightAtrium = new THREE.Mesh(new THREE.SphereGeometry(0.27, 22, 18), atriumMat);
  rightAtrium.position.set(-0.34, 0.25, 0.04);
  heartCore.add(leftAtrium, rightAtrium);

  // Aortic arch on top of heart
  const aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, 0.28, 0.02),
    new THREE.Vector3(0.12, 0.72, 0.04),
    new THREE.Vector3(0.32, 0.82, -0.08),
    new THREE.Vector3(0.4, 0.42, -0.2),
  ]);
  const aortaMat = new THREE.MeshPhysicalMaterial({
    color: 0xe84d5b,
    roughness: 0.28,
    clearcoat: 0.45,
  });
  const aortaMesh = new THREE.Mesh(
    new THREE.TubeGeometry(aortaCurve, 26, 0.11, 14, false),
    aortaMat
  );
  heartCore.add(aortaMesh);

  // Closed systemic (arterial) & pulmonary (venous) translucent glass vascular loops
  const arterialCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0.35, 0.45, -0.14),
      new THREE.Vector3(1.25, 0.62, 0.24),
      new THREE.Vector3(1.52, -0.05, 0.12),
      new THREE.Vector3(1.08, -0.72, -0.16),
      new THREE.Vector3(0.12, -0.62, -0.12),
      new THREE.Vector3(-0.28, -0.12, 0.08),
    ],
    true
  );

  const venousCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.32, 0.3, 0.08),
      new THREE.Vector3(-1.22, 0.6, 0.22),
      new THREE.Vector3(-1.5, -0.04, 0.08),
      new THREE.Vector3(-1.08, -0.7, -0.18),
      new THREE.Vector3(-0.1, -0.58, -0.1),
      new THREE.Vector3(0.24, 0.12, -0.02),
    ],
    true
  );

  const arterialTubeMat = new THREE.MeshPhysicalMaterial({
    color: 0xf06572,
    roughness: 0.18,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const venousTubeMat = new THREE.MeshPhysicalMaterial({
    color: 0x599be8,
    roughness: 0.18,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });

  const arterialTube = new THREE.Mesh(
    new THREE.TubeGeometry(arterialCurve, 64, 0.115, 14, true),
    arterialTubeMat
  );
  const venousTube = new THREE.Mesh(
    new THREE.TubeGeometry(venousCurve, 64, 0.115, 14, true),
    venousTubeMat
  );
  stageGroup.add(arterialTube, venousTube);

  // Micro-capillary junction rings at outer loop ends
  const capRingGeo = new THREE.TorusGeometry(0.145, 0.024, 12, 24);
  const capRingMat = new THREE.MeshStandardMaterial({
    color: 0x62d9e8,
    emissive: 0x168096,
    emissiveIntensity: 0.45,
    roughness: 0.25,
  });
  const rightCapRing = new THREE.Mesh(capRingGeo, capRingMat);
  rightCapRing.position.set(1.52, -0.05, 0.12);
  rightCapRing.rotation.x = Math.PI / 2;
  const leftCapRing = new THREE.Mesh(capRingGeo, capRingMat);
  leftCapRing.position.set(-1.5, -0.04, 0.08);
  leftCapRing.rotation.x = Math.PI / 2;
  stageGroup.add(rightCapRing, leftCapRing);

  // Instanced Erythrocytes (Red Blood Cells) flowing along both loops
  const RBC_COUNT = 48;
  const rbcGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.024, 14);
  const rbcMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.05,
  });
  const rbcInstanced = new THREE.InstancedMesh(rbcGeo, rbcMat, RBC_COUNT);
  rbcInstanced.frustumCulled = false;

  for (let i = 0; i < RBC_COUNT; i++) {
    const isArterial = i % 2 === 0;
    const curve = isArterial ? arterialCurve : venousCurve;
    const t = (Math.floor(i / 2) / (RBC_COUNT / 2)) % 1;
    curve.getPointAt(t, _vecA);
    _dummy.position.copy(_vecA);
    _dummy.scale.setScalar(1);
    _dummy.updateMatrix();
    rbcInstanced.setMatrixAt(i, _dummy.matrix);
    _colorA.setHex(isArterial ? 0xff4959 : 0x6d61c7);
    rbcInstanced.setColorAt(i, _colorA);
  }
  rbcInstanced.instanceMatrix.needsUpdate = true;
  if (rbcInstanced.instanceColor) {
    rbcInstanced.instanceColor.needsUpdate = true;
  }
  rbcInstanced.computeBoundingSphere();
  stageGroup.add(rbcInstanced);

  let flowPhase = 0;
  let beatClock = 0;

  return {
    simId: 'sirkulasi',
    root,
    update(params, computed, dt, elapsed) {
      const bpm = computed.bpm;
      const elasticityNorm = Math.min(1, Math.max(0.4, params.paramB / 100));
      const spo2Norm = Math.min(1, Math.max(0, (params.paramC - 70) / 30));

      stageGroup.rotation.y = Math.sin(elapsed * 0.22) * 0.14;

      // Exact physiological BPM cardiac systole/diastole beat
      beatClock += dt * (bpm / 60);
      const beatFrac = beatClock % 1;
      const systole =
        beatFrac < 0.22
          ? Math.sin((beatFrac / 0.22) * Math.PI) * 0.09
          : beatFrac < 0.4
            ? Math.sin(((beatFrac - 0.22) / 0.18) * Math.PI) * 0.045
            : 0;
      const heartScale = 1 + systole;
      heartCore.scale.set(heartScale, 1 - systole * 0.35, heartScale);

      // Arterial tube distension reacts with elasticity + systole pulse
      const vesselDistension = 1 + systole * (0.4 + elasticityNorm * 0.65);
      arterialTube.scale.set(vesselDistension, 1, vesselDistension);
      venousTube.scale.set(1 + systole * 0.25, 1, 1 + systole * 0.25);

      // Erythrocyte orbital flow speed proportional to BPM
      flowPhase = (flowPhase + dt * (0.14 + (bpm / 180) * 0.36)) % 1;

      _colorA.setHex(0x6357bf); // deoxygenated blue-violet
      _colorB.setHex(0xff4254); // fully oxygenated scarlet
      _colorC.copy(_colorA).lerp(_colorB, 0.35 + spo2Norm * 0.65);

      for (let i = 0; i < RBC_COUNT; i++) {
        const isArterial = i % 2 === 0;
        const curve = isArterial ? arterialCurve : venousCurve;
        const baseT = Math.floor(i / 2) / (RBC_COUNT / 2);
        const t = (baseT + flowPhase) % 1;

        curve.getPointAt(t, _vecA);
        curve.getTangentAt(t, _vecB);

        _dummy.position.copy(_vecA);
        _dummy.lookAt(_vecA.x + _vecB.x, _vecA.y + _vecB.y, _vecA.z + _vecB.z);
        _dummy.rotateX(Math.PI / 2);
        _dummy.scale.setScalar(1);
        _dummy.updateMatrix();
        rbcInstanced.setMatrixAt(i, _dummy.matrix);

        // Oxygenation gradient across capillary transition
        const oxyBlend = isArterial
          ? 0.9 - Math.max(0, t - 0.45) * 0.75
          : 0.2 + Math.max(0, t - 0.45) * 0.75;
        _colorB.copy(_colorA).lerp(_colorC, Math.min(1, Math.max(0, oxyBlend)));
        rbcInstanced.setColorAt(i, _colorB);
      }
      rbcInstanced.instanceMatrix.needsUpdate = true;
      if (rbcInstanced.instanceColor) {
        rbcInstanced.instanceColor.needsUpdate = true;
      }
    },
  };
}

function buildOsmosisSimulation(
  bumpTex: THREE.Texture,
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): BuiltSimulationScene {
  const root = new THREE.Group();
  root.add(createSpecimenPedestal(contactShadowTex, isSoftwareGl));

  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, -0.02, 0);
  root.add(stageGroup);

  // Outer transparent beaker / chamber rim
  const beakerGeo = new THREE.CylinderGeometry(1.52, 1.46, 1.56, 48, 1, true);
  const beakerMat = new THREE.MeshPhysicalMaterial({
    color: 0xa4e9f5,
    roughness: 0.12,
    metalness: 0.05,
    transparent: true,
    opacity: isSoftwareGl ? 0.16 : 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beakerMesh = new THREE.Mesh(beakerGeo, beakerMat);
  beakerMesh.position.y = -0.14;
  stageGroup.add(beakerMesh);

  // Beaker top stainless ring
  const rimGeo = new THREE.TorusGeometry(1.52, 0.03, 12, 48);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x89dceb,
    roughness: 0.25,
    metalness: 0.75,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = 0.64;
  stageGroup.add(rimMesh);

  // Dynamic animal cell inside the aqueous bath
  const cellGroup = new THREE.Group();
  cellGroup.position.set(0, -0.02, 0);
  stageGroup.add(cellGroup);

  const membraneGeo = new THREE.SphereGeometry(0.76, 36, 28);
  const membraneMat = new THREE.MeshPhysicalMaterial({
    color: 0x2ecad6,
    roughness: 0.26,
    metalness: 0.04,
    clearcoat: 0.7,
    bumpMap: bumpTex,
    bumpScale: 0.022,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });
  const membraneMesh = new THREE.Mesh(membraneGeo, membraneMat);
  membraneMesh.renderOrder = 2;
  cellGroup.add(membraneMesh);

  // Inner nucleus + organelles visible inside translucent plasma membrane
  const nucleusMat = new THREE.MeshStandardMaterial({
    color: 0x7e66e8,
    roughness: 0.34,
    bumpMap: bumpTex,
    bumpScale: 0.02,
  });
  const nucleusMesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 20), nucleusMat);
  cellGroup.add(nucleusMesh);

  const nucleolusMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf4b63d, roughness: 0.3 })
  );
  nucleolusMesh.position.set(0.08, 0.06, 0.08);
  cellGroup.add(nucleolusMesh);

  // 6 Aquaporin channel proteins embedded on the cell equator
  const channelGeo = new THREE.TorusGeometry(0.08, 0.028, 10, 20);
  const channelMat = new THREE.MeshStandardMaterial({
    color: 0x3ef09d,
    emissive: 0x157a4e,
    emissiveIntensity: 0.45,
    roughness: 0.28,
  });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const channel = new THREE.Mesh(channelGeo, channelMat);
    channel.position.set(Math.cos(angle) * 0.75, 0, Math.sin(angle) * 0.75);
    channel.lookAt(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
    cellGroup.add(channel);
  }

  // Instanced H2O molecules moving across the cell membrane
  const WATER_COUNT = 36;
  const waterGeo = new THREE.SphereGeometry(0.044, 10, 10);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x62e8ff,
    emissive: 0x159cb8,
    emissiveIntensity: 0.55,
    roughness: 0.16,
  });
  const waterInstanced = new THREE.InstancedMesh(waterGeo, waterMat, WATER_COUNT);
  waterInstanced.frustumCulled = false;

  const waterSeeds = Array.from({ length: WATER_COUNT }, (_, i) => ({
    angle: (i / WATER_COUNT) * Math.PI * 2,
    elev: Math.sin(i * 1.9) * 0.46,
    phase: (i * 0.17) % 1,
  }));
  waterSeeds.forEach((s, idx) => {
    const r = 0.52 + s.phase * 0.72;
    _dummy.position.set(Math.cos(s.angle) * r, s.elev, Math.sin(s.angle) * r);
    _dummy.scale.setScalar(1);
    _dummy.updateMatrix();
    waterInstanced.setMatrixAt(idx, _dummy.matrix);
  });
  waterInstanced.instanceMatrix.needsUpdate = true;
  waterInstanced.computeBoundingSphere();
  stageGroup.add(waterInstanced);

  // Instanced extracellular solute ions (Na+/Cl-)
  const SOLUTE_COUNT = 30;
  const soluteGeo = new THREE.SphereGeometry(0.054, 10, 10);
  const soluteMat = new THREE.MeshStandardMaterial({
    color: 0xffba49,
    emissive: 0x996011,
    emissiveIntensity: 0.35,
    roughness: 0.26,
  });
  const soluteInstanced = new THREE.InstancedMesh(soluteGeo, soluteMat, SOLUTE_COUNT);
  soluteInstanced.frustumCulled = false;

  const soluteSeeds = Array.from({ length: SOLUTE_COUNT }, (_, i) => ({
    angle: (i / SOLUTE_COUNT) * Math.PI * 2 + 0.25,
    radius: 1.0 + (i % 4) * 0.1,
    yBase: -0.58 + (i % 7) * 0.18,
    speed: 0.25 + (i % 3) * 0.12,
  }));
  soluteSeeds.forEach((s, idx) => {
    _dummy.position.set(Math.cos(s.angle) * s.radius, s.yBase, Math.sin(s.angle) * s.radius);
    _dummy.scale.setScalar(1);
    _dummy.updateMatrix();
    soluteInstanced.setMatrixAt(idx, _dummy.matrix);
  });
  soluteInstanced.instanceMatrix.needsUpdate = true;
  soluteInstanced.computeBoundingSphere();
  stageGroup.add(soluteInstanced);

  let currentScale = 1;
  let waterClock = 0;

  return {
    simId: 'osmosis',
    root,
    update(params, computed, dt, elapsed) {
      const solutePct = Math.min(100, Math.max(0, params.paramA));
      const permNorm = Math.min(1, Math.max(0.2, params.paramB / 100));
      const tempNorm = Math.min(1, Math.max(0, (params.paramC - 10) / 30));

      stageGroup.rotation.y = Math.sin(elapsed * 0.22) * 0.16;

      // Smooth damped volume scaling (hipotonic swelling vs hypertonic crenation)
      currentScale = THREE.MathUtils.damp(currentScale, computed.cellVolumeScale, 4.5, dt);

      // Slight membrane ripple when hypertonically shrunken or hypotonically tense
      const crenationSquish =
        solutePct > 65 ? Math.sin(elapsed * 4.5) * 0.035 : Math.sin(elapsed * 2.2) * 0.012;
      cellGroup.scale.set(
        currentScale + crenationSquish,
        currentScale - crenationSquish * 0.6,
        currentScale + crenationSquish
      );

      // Color shift: hypotonic bright cyan -> isotonic teal -> hypertonic amber-coral tint
      if (solutePct < 38) {
        _colorA.setHex(0x2ecad6);
        _colorB.setHex(0x52ebff);
        membraneMat.color.copy(_colorA).lerp(_colorB, (38 - solutePct) / 38);
      } else if (solutePct > 62) {
        _colorA.setHex(0x2ecad6);
        _colorB.setHex(0xe57a67);
        membraneMat.color.copy(_colorA).lerp(_colorB, (solutePct - 62) / 38);
      } else {
        membraneMat.color.setHex(0x2ecad6);
      }

      // Aquaporin openness & H2O direction across membrane
      const tonicDelta = 50 - solutePct; // positive => water flows INTO cell
      const flowSpeed = (0.18 + Math.abs(tonicDelta / 50) * 0.85) * permNorm * (0.7 + tempNorm * 0.5);
      waterClock += dt * flowSpeed;

      for (let i = 0; i < WATER_COUNT; i++) {
        const s = waterSeeds[i];
        let t = (s.phase + waterClock) % 1;
        if (tonicDelta > 4) {
          // Net flow inward
          t = 1 - t;
        } else if (Math.abs(tonicDelta) <= 4) {
          // Balanced bidirectional exchange
          t = i % 2 === 0 ? t : 1 - t;
        }
        const r = 0.42 * currentScale + t * 0.92;
        const a = s.angle + elapsed * 0.25;
        _dummy.position.set(
          Math.cos(a) * r,
          s.elev + Math.sin(elapsed * 2 + i) * 0.04,
          Math.sin(a) * r
        );
        _dummy.scale.setScalar(0.65 + Math.sin(t * Math.PI) * 0.55);
        _dummy.updateMatrix();
        waterInstanced.setMatrixAt(i, _dummy.matrix);
      }
      waterInstanced.instanceMatrix.needsUpdate = true;

      // Solute particle concentration visually scales with Terlarut Eksternal
      const activeSolute = Math.max(2, Math.round((solutePct / 100) * SOLUTE_COUNT));
      for (let i = 0; i < SOLUTE_COUNT; i++) {
        const s = soluteSeeds[i];
        const a = s.angle + elapsed * s.speed * (0.6 + tempNorm * 0.8);
        const y = s.yBase + Math.sin(elapsed * 1.6 + i) * 0.08;
        const r = Math.max(0.88 * currentScale + 0.14, s.radius);
        _dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        _dummy.scale.setScalar(i < activeSolute ? 1 : 0.001);
        _dummy.updateMatrix();
        soluteInstanced.setMatrixAt(i, _dummy.matrix);
      }
      soluteInstanced.instanceMatrix.needsUpdate = true;
    },
  };
}

export function buildSimulationById(
  simId: SimId,
  bumpTex: THREE.Texture,
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): BuiltSimulationScene {
  switch (simId) {
    case 'sirkulasi':
      return buildCirculationSimulation(bumpTex, contactShadowTex, isSoftwareGl);
    case 'osmosis':
      return buildOsmosisSimulation(bumpTex, contactShadowTex, isSoftwareGl);
    case 'fotosintesis':
    default:
      return buildPhotosynthesisSimulation(bumpTex, contactShadowTex, isSoftwareGl);
  }
}
