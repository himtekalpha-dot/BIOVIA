import * as THREE from 'three';
import { LAB_SPECIMENS_BY_ID } from '../data/labSpecimens';
import type { LabSpecimenId } from '../types/biovia';

export interface BuiltSpecimenScene {
  root: THREE.Group;
  partGroups: Map<string, THREE.Group>;
  interactables: THREE.Object3D[];
  animatedNodes: {
    kind: 'cell' | 'lungs' | 'heart';
    leftLung?: THREE.Group;
    rightLung?: THREE.Group;
    diaphragm?: THREE.Group;
    heartCore?: THREE.Group;
    floatingVesicles?: THREE.Object3D[];
  };
}

function registerPart(
  partGroups: Map<string, THREE.Group>,
  interactables: THREE.Object3D[],
  partId: string,
  group: THREE.Group,
  explodeOffset: readonly [number, number, number]
) {
  group.name = partId;
  group.userData.partId = partId;
  group.userData.basePosition = group.position.clone();
  group.userData.explodeOffset = new THREE.Vector3(
    explodeOffset[0],
    explodeOffset[1],
    explodeOffset[2]
  );

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.userData.partId = partId;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.layers.enable(1);
      interactables.push(mesh);

      const mat = mesh.material;
      if (mat instanceof THREE.MeshStandardMaterial) {
        mesh.userData.baseEmissiveHex = mat.emissive.getHex();
        mesh.userData.baseEmissiveIntensity = mat.emissiveIntensity;
      }
    }
  });

  partGroups.set(partId, group);
}

export function createSpecimenPedestal(
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): THREE.Group {
  const pedestal = new THREE.Group();
  pedestal.name = 'lab-pedestal';

  // Lathe optical microscope specimen base
  const lathePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(1.42, 0),
    new THREE.Vector2(1.38, 0.08),
    new THREE.Vector2(1.16, 0.14),
    new THREE.Vector2(0.92, 0.18),
    new THREE.Vector2(0.84, 0.25),
    new THREE.Vector2(0, 0.25),
  ];
  const baseGeo = new THREE.LatheGeometry(lathePoints, 48);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1c3149,
    roughness: 0.72,
    metalness: 0.15,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -1.25;
  baseMesh.receiveShadow = true;
  baseMesh.castShadow = !isSoftwareGl;
  pedestal.add(baseMesh);

  // Brushed anodized titanium rim collar
  const collarGeo = new THREE.TorusGeometry(0.95, 0.035, 16, 64);
  const collarMat = new THREE.MeshPhysicalMaterial({
    color: 0x52d4e2,
    roughness: 0.22,
    metalness: 0.88,
    clearcoat: 0.6,
  });
  const collarMesh = new THREE.Mesh(collarGeo, collarMat);
  collarMesh.rotation.x = Math.PI / 2;
  collarMesh.position.y = -1.04;
  pedestal.add(collarMesh);

  // Thin glowing specimen stage glass disc
  const discGeo = new THREE.CylinderGeometry(0.82, 0.82, 0.04, 48);
  const discMat = new THREE.MeshPhysicalMaterial({
    color: 0xb7f2f8,
    roughness: 0.1,
    metalness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.7,
    transparent: true,
    opacity: isSoftwareGl ? 0.35 : 0.92,
    ior: 1.48,
    depthWrite: false,
  });
  const discMesh = new THREE.Mesh(discGeo, discMat);
  discMesh.position.y = -0.99;
  discMesh.renderOrder = 1;
  pedestal.add(discMesh);

  // Contact shadow disc grounded just above floor (-1.25)
  const shadowGeo = new THREE.CircleGeometry(1.9, 48);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -1.235;
  pedestal.add(shadowMesh);

  return pedestal;
}

function buildAnimalCell(
  bumpTex: THREE.Texture,
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): BuiltSpecimenScene {
  const spec = LAB_SPECIMENS_BY_ID['sel-hewan'];
  const root = new THREE.Group();
  root.add(createSpecimenPedestal(contactShadowTex, isSoftwareGl));

  const partGroups = new Map<string, THREE.Group>();
  const interactables: THREE.Object3D[] = [];
  const floatingVesicles: THREE.Object3D[] = [];

  const offsetMap = new Map(spec.parts.map((p) => [p.id, p.explodeOffset]));

  // 1. Membran Plasma (Cutaway lower cradle + outer translucent upper lipid envelope)
  const membraneGroup = new THREE.Group();
  membraneGroup.position.set(0, 0.25, 0);

  const outerBowlGeo = new THREE.SphereGeometry(1.36, 40, 28, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58);
  const outerBowlMat = new THREE.MeshPhysicalMaterial({
    color: 0x20a4b8,
    roughness: 0.35,
    metalness: 0.05,
    clearcoat: 0.75,
    clearcoatRoughness: 0.2,
    bumpMap: bumpTex,
    bumpScale: 0.025,
    side: THREE.DoubleSide,
  });
  const outerBowl = new THREE.Mesh(outerBowlGeo, outerBowlMat);
  membraneGroup.add(outerBowl);

  const cytoDiscGeo = new THREE.CircleGeometry(1.31, 48);
  const cytoDiscMat = new THREE.MeshStandardMaterial({
    color: 0xb9edf2,
    roughness: 0.78,
    metalness: 0.02,
    bumpMap: bumpTex,
    bumpScale: 0.015,
  });
  const cytoDisc = new THREE.Mesh(cytoDiscGeo, cytoDiscMat);
  cytoDisc.rotation.x = -Math.PI / 2;
  cytoDisc.position.y = 0.33;
  membraneGroup.add(cytoDisc);

  const rimGeo = new THREE.TorusGeometry(1.32, 0.045, 16, 64);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x62e1eb,
    roughness: 0.25,
    metalness: 0.15,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.33;
  membraneGroup.add(rim);

  // Semi-transparent upper dome slice
  const upperDomeGeo = new THREE.SphereGeometry(
    1.36,
    36,
    20,
    Math.PI * 0.75,
    Math.PI * 1.15,
    0,
    Math.PI * 0.43
  );
  const upperDomeMat = new THREE.MeshPhysicalMaterial({
    color: 0x8be9f0,
    roughness: 0.12,
    metalness: 0.0,
    transmission: isSoftwareGl ? 0 : 0.72,
    transparent: true,
    opacity: isSoftwareGl ? 0.16 : 0.86,
    ior: 1.4,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const upperDome = new THREE.Mesh(upperDomeGeo, upperDomeMat);
  upperDome.renderOrder = 3;
  membraneGroup.add(upperDome);

  registerPart(
    partGroups,
    interactables,
    'membran-sel',
    membraneGroup,
    offsetMap.get('membran-sel') ?? [0, -0.35, 0]
  );
  root.add(membraneGroup);

  // 2. Nukleus & Nukleolus
  const nucleusGroup = new THREE.Group();
  nucleusGroup.position.set(0, 0.62, 0);

  const nucShellGeo = new THREE.SphereGeometry(0.46, 32, 24, 0, Math.PI * 1.45, 0, Math.PI);
  const nucShellMat = new THREE.MeshPhysicalMaterial({
    color: 0x5d4ce0,
    roughness: 0.42,
    metalness: 0.06,
    clearcoat: 0.45,
    bumpMap: bumpTex,
    bumpScale: 0.02,
    side: THREE.DoubleSide,
  });
  const nucShell = new THREE.Mesh(nucShellGeo, nucShellMat);
  nucShell.rotation.y = Math.PI * 0.6;
  nucleusGroup.add(nucShell);

  const nucleolusGeo = new THREE.SphereGeometry(0.18, 24, 24);
  const nucleolusMat = new THREE.MeshStandardMaterial({
    color: 0xb197fc,
    emissive: 0x2f1d7a,
    emissiveIntensity: 0.45,
    roughness: 0.22,
    metalness: 0.1,
  });
  const nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
  nucleusGroup.add(nucleolus);

  const dnaPoints = [
    new THREE.Vector3(-0.24, -0.1, 0.1),
    new THREE.Vector3(0.05, 0.22, 0.2),
    new THREE.Vector3(0.25, -0.05, -0.1),
    new THREE.Vector3(-0.1, -0.22, -0.2),
  ];
  const dnaCurve = new THREE.CatmullRomCurve3(dnaPoints, true);
  const dnaMesh = new THREE.Mesh(
    new THREE.TubeGeometry(dnaCurve, 40, 0.024, 8, true),
    new THREE.MeshStandardMaterial({ color: 0xe2d9ff, roughness: 0.3 })
  );
  nucleusGroup.add(dnaMesh);

  registerPart(
    partGroups,
    interactables,
    'nukleus',
    nucleusGroup,
    offsetMap.get('nukleus') ?? [0, 0.95, 0]
  );
  root.add(nucleusGroup);

  // 3. Mitokondria (2 composite capsules with internal cristae curves)
  const mitoGroup = new THREE.Group();
  mitoGroup.position.set(0.68, 0.6, 0.34);

  const buildSingleMito = (px: number, py: number, pz: number, rotZ: number, rotY: number) => {
    const sub = new THREE.Group();
    sub.position.set(px, py, pz);
    sub.rotation.set(0.25, rotY, rotZ);

    const outer = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.34, 8, 20),
      new THREE.MeshPhysicalMaterial({
        color: 0xe66541,
        roughness: 0.38,
        metalness: 0.04,
        clearcoat: 0.55,
      })
    );
    sub.add(outer);

    const cristaeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.05, -0.16, 0.09),
      new THREE.Vector3(0.06, -0.08, 0.11),
      new THREE.Vector3(-0.06, 0.0, 0.11),
      new THREE.Vector3(0.06, 0.08, 0.11),
      new THREE.Vector3(-0.04, 0.16, 0.09),
    ]);
    const cristae = new THREE.Mesh(
      new THREE.TubeGeometry(cristaeCurve, 28, 0.022, 8, false),
      new THREE.MeshStandardMaterial({ color: 0xffd185, roughness: 0.6 })
    );
    sub.add(cristae);
    return sub;
  };

  mitoGroup.add(buildSingleMito(0, 0, 0, 1.15, 0.4));
  mitoGroup.add(buildSingleMito(-0.18, 0.06, -0.78, 0.9, -0.8));

  registerPart(
    partGroups,
    interactables,
    'mitokondria',
    mitoGroup,
    offsetMap.get('mitokondria') ?? [1.15, 0.45, 0.55]
  );
  root.add(mitoGroup);

  // 4. Retikulum Endoplasma & Ribosom InstancedMesh
  const erGroup = new THREE.Group();
  erGroup.position.set(-0.56, 0.58, 0.25);

  const erMat = new THREE.MeshStandardMaterial({
    color: 0x1e9cb0,
    roughness: 0.65,
    metalness: 0.05,
  });
  for (let i = 0; i < 4; i++) {
    const foldCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.22 + i * 0.05, -0.06 + i * 0.05, -0.35),
      new THREE.Vector3(-0.02 + i * 0.04, 0.05 + i * 0.05, 0),
      new THREE.Vector3(-0.18 + i * 0.05, -0.04 + i * 0.05, 0.35),
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(foldCurve, 24, 0.042, 10, false), erMat);
    erGroup.add(tube);
  }

  // 28 ribosomes using InstancedMesh per threejs/SKILL.md rule!
  const riboCount = 28;
  const riboGeo = new THREE.SphereGeometry(0.022, 10, 10);
  const riboMat = new THREE.MeshStandardMaterial({ color: 0xf7e694, roughness: 0.4 });
  const riboInst = new THREE.InstancedMesh(riboGeo, riboMat, riboCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < riboCount; i++) {
    const t = i / riboCount;
    dummy.position.set(
      -0.18 + Math.sin(t * 14) * 0.14,
      -0.05 + (i % 4) * 0.055,
      -0.32 + t * 0.64
    );
    dummy.scale.setScalar(0.85 + (i % 3) * 0.15);
    dummy.updateMatrix();
    riboInst.setMatrixAt(i, dummy.matrix);
  }
  riboInst.instanceMatrix.needsUpdate = true;
  riboInst.computeBoundingSphere();
  erGroup.add(riboInst);

  registerPart(
    partGroups,
    interactables,
    'retikulum-endoplasma',
    erGroup,
    offsetMap.get('retikulum-endoplasma') ?? [-1.05, 0.5, 0.45]
  );
  root.add(erGroup);

  // 5. Badan Golgi (stacked curved cisternae + secretory vesicles)
  const golgiGroup = new THREE.Group();
  golgiGroup.position.set(-0.46, 0.56, -0.58);
  const golgiMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6a832,
    roughness: 0.34,
    metalness: 0.06,
    clearcoat: 0.4,
  });

  for (let i = 0; i < 4; i++) {
    const arc = new THREE.TorusGeometry(0.24 + i * 0.05, 0.032, 12, 24, Math.PI * 0.85);
    const sac = new THREE.Mesh(arc, golgiMat);
    sac.rotation.x = Math.PI / 2;
    sac.rotation.z = -Math.PI * 0.18;
    sac.position.y = i * 0.03;
    golgiGroup.add(sac);
  }
  for (let v = 0; v < 3; v++) {
    const vesicle = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 14), golgiMat);
    vesicle.position.set(0.26 - v * 0.12, 0.08 + v * 0.04, 0.18);
    golgiGroup.add(vesicle);
    floatingVesicles.push(vesicle);
  }

  registerPart(
    partGroups,
    interactables,
    'badan-golgi',
    golgiGroup,
    offsetMap.get('badan-golgi') ?? [-0.85, 0.4, -0.95]
  );
  root.add(golgiGroup);

  // 6. Lisosom & Sentrosom
  const lysoGroup = new THREE.Group();
  lysoGroup.position.set(0.45, 0.62, -0.55);

  const lysoMat = new THREE.MeshPhysicalMaterial({
    color: 0x2ec27e,
    roughness: 0.2,
    metalness: 0.04,
    clearcoat: 0.8,
  });
  const lysoPositions: Array<[number, number, number, number]> = [
    [0, 0, 0, 0.13],
    [0.24, 0.08, 0.22, 0.1],
    [-0.16, 0.1, 0.26, 0.09],
  ];
  for (const [lx, ly, lz, lr] of lysoPositions) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(lr, 20, 20), lysoMat);
    s.position.set(lx, ly, lz);
    lysoGroup.add(s);
    floatingVesicles.push(s);
  }

  // Perpendicular centriole barrels
  const centMat = new THREE.MeshStandardMaterial({ color: 0xf7b955, roughness: 0.55 });
  const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 9), centMat);
  c1.position.set(-0.18, -0.02, -0.18);
  const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 9), centMat);
  c2.position.set(-0.1, -0.02, -0.18);
  c2.rotation.z = Math.PI / 2;
  lysoGroup.add(c1, c2);

  registerPart(
    partGroups,
    interactables,
    'lisosom',
    lysoGroup,
    offsetMap.get('lisosom') ?? [0.9, 0.35, -0.85]
  );
  root.add(lysoGroup);

  return {
    root,
    partGroups,
    interactables,
    animatedNodes: { kind: 'cell', floatingVesicles },
  };
}

function buildLungsSpecimen(
  bumpTex: THREE.Texture,
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): BuiltSpecimenScene {
  const spec = LAB_SPECIMENS_BY_ID['paru-paru'];
  const root = new THREE.Group();
  root.add(createSpecimenPedestal(contactShadowTex, isSoftwareGl));

  const partGroups = new Map<string, THREE.Group>();
  const interactables: THREE.Object3D[] = [];
  const offsetMap = new Map(spec.parts.map((p) => [p.id, p.explodeOffset]));

  // 1. Trakea & Cincin Kartilago
  const tracheaGroup = new THREE.Group();
  tracheaGroup.position.set(0, 0.95, 0);

  const tracheaTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.15, 1.05, 24),
    new THREE.MeshStandardMaterial({
      color: 0x82d2e3,
      roughness: 0.55,
      metalness: 0.05,
    })
  );
  tracheaGroup.add(tracheaTube);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xe3f6fa,
    roughness: 0.28,
    metalness: 0.08,
  });
  for (let i = 0; i < 8; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.024, 10, 24, Math.PI * 1.65), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = Math.PI * 0.68;
    ring.position.y = -0.38 + i * 0.11;
    tracheaGroup.add(ring);
  }
  registerPart(
    partGroups,
    interactables,
    'trakea',
    tracheaGroup,
    offsetMap.get('trakea') ?? [0, 0.95, 0]
  );
  root.add(tracheaGroup);

  // 2. Bronkus & Bronkiolus
  const bronchiGroup = new THREE.Group();
  bronchiGroup.position.set(0, 0.35, 0);
  const bronchusMat = new THREE.MeshStandardMaterial({
    color: 0x3b9ab8,
    roughness: 0.45,
    metalness: 0.08,
  });

  const branchCurves = [
    [new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(-0.38, -0.02, 0), new THREE.Vector3(-0.72, -0.28, 0.06)],
    [new THREE.Vector3(-0.4, -0.02, 0), new THREE.Vector3(-0.62, 0.22, -0.05)],
    [new THREE.Vector3(-0.55, -0.16, 0.02), new THREE.Vector3(-0.8, -0.58, -0.04)],
    [new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(0.38, -0.02, 0), new THREE.Vector3(0.7, -0.26, 0.06)],
    [new THREE.Vector3(0.4, -0.02, 0), new THREE.Vector3(0.6, 0.2, -0.05)],
    [new THREE.Vector3(0.55, -0.15, 0.02), new THREE.Vector3(0.76, -0.56, -0.04)],
  ];
  for (const pts of branchCurves) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, pts.length === 3 ? 0.075 : 0.045, 12, false),
      bronchusMat
    );
    bronchiGroup.add(tube);
  }
  registerPart(
    partGroups,
    interactables,
    'bronkus',
    bronchiGroup,
    offsetMap.get('bronkus') ?? [0, 0.35, 0.75]
  );
  root.add(bronchiGroup);

  // Helper to sculpt organic lung lobe shell via LatheGeometry
  const createLungShell = (scaleX: number, colorHex: number) => {
    const pts = [
      new THREE.Vector2(0, -0.78),
      new THREE.Vector2(0.58, -0.75),
      new THREE.Vector2(0.62, -0.32),
      new THREE.Vector2(0.54, 0.24),
      new THREE.Vector2(0.35, 0.62),
      new THREE.Vector2(0.12, 0.76),
      new THREE.Vector2(0, 0.78),
    ];
    const geo = new THREE.LatheGeometry(pts, 32);
    const mat = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      roughness: 0.42,
      metalness: 0.02,
      clearcoat: 0.65,
      bumpMap: bumpTex,
      bumpScale: 0.025,
      transmission: isSoftwareGl ? 0 : 0.55,
      transparent: true,
      opacity: isSoftwareGl ? 0.68 : 0.9,
      ior: 1.38,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(scaleX, 1, 0.72);
    mesh.renderOrder = 2;
    return mesh;
  };

  // 3. Paru-paru Kanan
  const rightLungGroup = new THREE.Group();
  rightLungGroup.position.set(-0.68, 0.14, 0);
  const rightShell = createLungShell(0.95, 0xe88a99);
  rightShell.rotation.z = -0.1;
  rightLungGroup.add(rightShell);
  registerPart(
    partGroups,
    interactables,
    'paru-kanan',
    rightLungGroup,
    offsetMap.get('paru-kanan') ?? [-1.15, 0.25, 0]
  );
  root.add(rightLungGroup);

  // 4. Paru-paru Kiri
  const leftLungGroup = new THREE.Group();
  leftLungGroup.position.set(0.68, 0.14, 0);
  const leftShell = createLungShell(0.86, 0xde7788);
  leftShell.rotation.z = 0.12;
  leftLungGroup.add(leftShell);
  registerPart(
    partGroups,
    interactables,
    'paru-kiri',
    leftLungGroup,
    offsetMap.get('paru-kiri') ?? [1.15, 0.25, 0]
  );
  root.add(leftLungGroup);

  // 5. Kantung Alveolus (magnified grape-cluster inset with capillary)
  const alveolusGroup = new THREE.Group();
  alveolusGroup.position.set(0.68, -0.18, 0.55);

  const alvMat = new THREE.MeshPhysicalMaterial({
    color: 0xff9f96,
    roughness: 0.3,
    metalness: 0.02,
    clearcoat: 0.6,
  });
  const offsets: Array<[number, number, number, number]> = [
    [0, 0, 0, 0.12],
    [0.13, 0.08, 0.04, 0.1],
    [-0.12, 0.06, 0.06, 0.1],
    [0.04, -0.12, 0.08, 0.105],
    [-0.08, -0.1, -0.05, 0.095],
    [0.1, -0.04, -0.09, 0.09],
  ];
  for (const [ax, ay, az, ar] of offsets) {
    const sac = new THREE.Mesh(new THREE.SphereGeometry(ar, 18, 18), alvMat);
    sac.position.set(ax, ay, az);
    alveolusGroup.add(sac);
  }
  const capCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, -0.12, 0.1),
    new THREE.Vector3(0, 0.14, 0.14),
    new THREE.Vector3(0.18, -0.06, 0.08),
  ]);
  const capillary = new THREE.Mesh(
    new THREE.TubeGeometry(capCurve, 24, 0.022, 8, false),
    new THREE.MeshStandardMaterial({ color: 0xd9383a, roughness: 0.45 })
  );
  alveolusGroup.add(capillary);

  registerPart(
    partGroups,
    interactables,
    'alveolus',
    alveolusGroup,
    offsetMap.get('alveolus') ?? [0.85, -0.15, 1.05]
  );
  root.add(alveolusGroup);

  // 6. Diafragma
  const diaphragmGroup = new THREE.Group();
  diaphragmGroup.position.set(0, -0.66, 0);
  const diaphGeo = new THREE.SphereGeometry(1.12, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.34);
  const diaphMat = new THREE.MeshStandardMaterial({
    color: 0xbf5162,
    roughness: 0.68,
    metalness: 0.04,
    bumpMap: bumpTex,
    bumpScale: 0.03,
    side: THREE.DoubleSide,
  });
  const diaphMesh = new THREE.Mesh(diaphGeo, diaphMat);
  diaphMesh.scale.set(1.08, 0.45, 0.68);
  diaphMesh.position.y = -0.24;
  diaphragmGroup.add(diaphMesh);

  registerPart(
    partGroups,
    interactables,
    'diafragma',
    diaphragmGroup,
    offsetMap.get('diafragma') ?? [0, -0.75, 0]
  );
  root.add(diaphragmGroup);

  return {
    root,
    partGroups,
    interactables,
    animatedNodes: {
      kind: 'lungs',
      leftLung: leftLungGroup,
      rightLung: rightLungGroup,
      diaphragm: diaphragmGroup,
    },
  };
}

function buildHeartSpecimen(
  bumpTex: THREE.Texture,
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): BuiltSpecimenScene {
  const spec = LAB_SPECIMENS_BY_ID.jantung;
  const root = new THREE.Group();
  root.add(createSpecimenPedestal(contactShadowTex, isSoftwareGl));

  const heartCore = new THREE.Group();
  root.add(heartCore);

  const partGroups = new Map<string, THREE.Group>();
  const interactables: THREE.Object3D[] = [];
  const offsetMap = new Map(spec.parts.map((p) => [p.id, p.explodeOffset]));

  // 1. Ventrikel Kiri (thick conical apex muscle)
  const lvGroup = new THREE.Group();
  lvGroup.position.set(0.24, -0.02, 0.02);
  const lvGeo = new THREE.SphereGeometry(0.62, 32, 24);
  const lvMesh = new THREE.Mesh(
    lvGeo,
    new THREE.MeshPhysicalMaterial({
      color: 0xc23244,
      roughness: 0.45,
      metalness: 0.03,
      clearcoat: 0.5,
      bumpMap: bumpTex,
      bumpScale: 0.03,
    })
  );
  lvMesh.scale.set(0.88, 1.32, 0.85);
  lvMesh.rotation.z = -0.24;
  lvGroup.add(lvMesh);
  registerPart(
    partGroups,
    interactables,
    'ventrikel-kiri',
    lvGroup,
    offsetMap.get('ventrikel-kiri') ?? [0.85, -0.2, 0.55]
  );
  heartCore.add(lvGroup);

  // 2. Ventrikel Kanan
  const rvGroup = new THREE.Group();
  rvGroup.position.set(-0.28, 0.02, 0.08);
  const rvMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.54, 30, 22),
    new THREE.MeshPhysicalMaterial({
      color: 0xb03a52,
      roughness: 0.5,
      metalness: 0.03,
      clearcoat: 0.42,
      bumpMap: bumpTex,
      bumpScale: 0.025,
    })
  );
  rvMesh.scale.set(0.85, 1.18, 0.82);
  rvMesh.rotation.z = 0.14;
  rvGroup.add(rvMesh);
  registerPart(
    partGroups,
    interactables,
    'ventrikel-kanan',
    rvGroup,
    offsetMap.get('ventrikel-kanan') ?? [-0.85, -0.2, 0.55]
  );
  heartCore.add(rvGroup);

  // 3. Atrium Kanan & Kiri
  const atriumGroup = new THREE.Group();
  atriumGroup.position.set(0, 0.62, -0.08);
  const atriumMat = new THREE.MeshStandardMaterial({
    color: 0x9e3b54,
    roughness: 0.58,
    metalness: 0.04,
    bumpMap: bumpTex,
    bumpScale: 0.02,
  });
  const rightAtrium = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 20), atriumMat);
  rightAtrium.position.set(-0.34, 0, 0.04);
  const leftAtrium = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 20), atriumMat);
  leftAtrium.position.set(0.32, 0.04, -0.04);
  atriumGroup.add(rightAtrium, leftAtrium);
  registerPart(
    partGroups,
    interactables,
    'atrium',
    atriumGroup,
    offsetMap.get('atrium') ?? [0, 0.45, -0.75]
  );
  heartCore.add(atriumGroup);

  // 4. Aorta & Lengkung Aorta + 3 carotid/subclavian branches
  const aortaGroup = new THREE.Group();
  aortaGroup.position.set(0.05, 0.52, 0);
  const aortaMat = new THREE.MeshPhysicalMaterial({
    color: 0xdf4250,
    roughness: 0.32,
    metalness: 0.04,
    clearcoat: 0.65,
  });
  const aortaArchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.02, -0.15, 0.05),
    new THREE.Vector3(0.06, 0.48, 0.05),
    new THREE.Vector3(-0.12, 0.72, -0.08),
    new THREE.Vector3(-0.24, 0.48, -0.28),
    new THREE.Vector3(-0.2, -0.2, -0.34),
  ]);
  aortaGroup.add(new THREE.Mesh(new THREE.TubeGeometry(aortaArchCurve, 36, 0.14, 16, false), aortaMat));

  for (const bx of [-0.14, -0.02, 0.1]) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.052, 0.34, 14),
      aortaMat
    );
    branch.position.set(bx, 0.86, -0.02);
    aortaGroup.add(branch);
  }
  registerPart(
    partGroups,
    interactables,
    'aorta',
    aortaGroup,
    offsetMap.get('aorta') ?? [0.35, 1.0, 0.2]
  );
  heartCore.add(aortaGroup);

  // 5. Vena Kava & Arteri Pulmonalis
  const venaGroup = new THREE.Group();
  venaGroup.position.set(-0.25, 0.48, 0.14);
  const blueMat = new THREE.MeshPhysicalMaterial({
    color: 0x3b6cb5,
    roughness: 0.36,
    metalness: 0.06,
    clearcoat: 0.5,
  });

  const pulmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, -0.1, 0.14),
    new THREE.Vector3(0.18, 0.38, 0.06),
    new THREE.Vector3(0.55, 0.48, -0.12),
  ]);
  venaGroup.add(new THREE.Mesh(new THREE.TubeGeometry(pulmCurve, 28, 0.105, 14, false), blueMat));

  const svcMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.75, 16), blueMat);
  svcMesh.position.set(-0.24, 0.45, -0.18);
  venaGroup.add(svcMesh);

  registerPart(
    partGroups,
    interactables,
    'vena-pulmonal',
    venaGroup,
    offsetMap.get('vena-pulmonal') ?? [-0.75, 0.9, -0.3]
  );
  heartCore.add(venaGroup);

  // 6. Pembuluh Darah Koroner
  const coronaryGroup = new THREE.Group();
  coronaryGroup.position.set(0, 0, 0.45);
  const corMat = new THREE.MeshStandardMaterial({
    color: 0xff6b5c,
    roughness: 0.28,
    metalness: 0.05,
  });
  const cor1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 0.38, 0.04),
    new THREE.Vector3(-0.04, 0.1, 0.14),
    new THREE.Vector3(0.1, -0.22, 0.08),
    new THREE.Vector3(0.16, -0.52, -0.06),
  ]);
  const cor2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.02, 0.18, 0.12),
    new THREE.Vector3(-0.28, 0.02, 0.08),
    new THREE.Vector3(-0.4, -0.26, -0.02),
  ]);
  coronaryGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(cor1, 24, 0.026, 8, false), corMat),
    new THREE.Mesh(new THREE.TubeGeometry(cor2, 20, 0.02, 8, false), corMat)
  );
  registerPart(
    partGroups,
    interactables,
    'koroner',
    coronaryGroup,
    offsetMap.get('koroner') ?? [0, -0.1, 1.0]
  );
  heartCore.add(coronaryGroup);

  return {
    root,
    partGroups,
    interactables,
    animatedNodes: { kind: 'heart', heartCore },
  };
}

export function buildSpecimenById(
  specimenId: LabSpecimenId,
  bumpTex: THREE.Texture,
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean
): BuiltSpecimenScene {
  switch (specimenId) {
    case 'paru-paru':
      return buildLungsSpecimen(bumpTex, contactShadowTex, isSoftwareGl);
    case 'jantung':
      return buildHeartSpecimen(bumpTex, contactShadowTex, isSoftwareGl);
    case 'sel-hewan':
    default:
      return buildAnimalCell(bumpTex, contactShadowTex, isSoftwareGl);
  }
}

export function disposeObjectHierarchy(group: THREE.Object3D): void {
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material?.dispose();
      }
    }
  });
}
