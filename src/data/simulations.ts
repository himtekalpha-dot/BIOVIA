import type { SimId, SimSpec } from '../types/biovia';

export const SIMULATIONS: SimSpec[] = [
  {
    id: 'fotosintesis',
    shortLabel: 'Fotosintesis',
    title: 'Simulasi Fotosintesis Kloroplas',
    categoryLabel: 'Biologi Tumbuhan',
    materialSlug: 'fotosintesis-pada-tumbuhan',
    summary:
      'Amati pengaruh intensitas cahaya, kadar CO₂, dan suhu daun terhadap laju fotosintesis serta pelepasan gelembung oksigen (O₂) di dalam kloroplas.',
    defaultCameraPos: [4.25, 2.55, 5.15],
    defaultTarget: [-0.25, -0.45, 0],
    defaultParams: {
      paramA: 70, // Intensitas Cahaya (%)
      paramB: 450, // Kadar CO2 (ppm)
      paramC: 27, // Suhu Daun (°C)
    },
    sliders: [
      { key: 'paramA', label: 'Intensitas Cahaya', unit: '%', min: 0, max: 100, step: 5 },
      { key: 'paramB', label: 'Kadar CO₂', unit: 'ppm', min: 100, max: 1000, step: 50 },
      { key: 'paramC', label: 'Suhu Daun', unit: '°C', min: 5, max: 45, step: 1 },
    ],
  },
  {
    id: 'sirkulasi',
    shortLabel: 'Sirkulasi Darah',
    title: 'Simulasi Pompa Jantung & Sirkulasi',
    categoryLabel: 'Biologi Manusia',
    materialSlug: 'sistem-peredaran-darah',
    summary:
      'Simulasikan perubahan detak jantung (BPM), curah jantung, dan kecepatan aliran eritrosit pada sirkuit arteri-vena sesuai intensitas aktivitas fisik.',
    defaultCameraPos: [4.35, 2.55, 5.35],
    defaultTarget: [-0.25, -0.42, 0],
    defaultParams: {
      paramA: 25, // Intensitas Aktivitas (%)
      paramB: 75, // Elastisitas Pembuluh (%)
      paramC: 98, // Oksigenasi Paru (%)
    },
    sliders: [
      { key: 'paramA', label: 'Intensitas Aktivitas', unit: '%', min: 0, max: 100, step: 5 },
      { key: 'paramB', label: 'Elastisitas Pembuluh', unit: '%', min: 40, max: 100, step: 5 },
      { key: 'paramC', label: 'Oksigenasi Paru', unit: '%', min: 70, max: 100, step: 2 },
    ],
  },
  {
    id: 'osmosis',
    shortLabel: 'Osmosis Sel',
    title: 'Simulasi Osmosis Membran Sel',
    categoryLabel: 'Sel & Mikroorganisme',
    materialSlug: 'struktur-sel-hewan-dan-tumbuhan',
    summary:
      'Uji respons volume sel hewan saat direndam dalam larutan hipotonik, isotonik, hingga hipertonik serta amati pergerakan molekul air melewati membran.',
    defaultCameraPos: [4.25, 2.55, 5.15],
    defaultTarget: [-0.25, -0.45, 0],
    defaultParams: {
      paramA: 50, // Konsentrasi Terlarut Luar (%)
      paramB: 70, // Permeabilitas Membran (%)
      paramC: 25, // Suhu Larutan (°C)
    },
    sliders: [
      { key: 'paramA', label: 'Terlarut Eksternal', unit: '%', min: 0, max: 100, step: 5 },
      { key: 'paramB', label: 'Permeabilitas Membran', unit: '%', min: 20, max: 100, step: 5 },
      { key: 'paramC', label: 'Suhu Larutan', unit: '°C', min: 10, max: 40, step: 1 },
    ],
  },
];

export const SIMULATIONS_BY_ID: Record<SimId, SimSpec> = {
  fotosintesis: SIMULATIONS[0],
  sirkulasi: SIMULATIONS[1],
  osmosis: SIMULATIONS[2],
};
