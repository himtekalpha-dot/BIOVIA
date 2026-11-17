import type { GameCatalogSpec, GameId } from '../types/biovia';

export const EDUCATIONAL_GAMES: GameCatalogSpec[] = [
  {
    id: 'imun-2d',
    format: '2d',
    title: 'Imun Defender: Lawan Kuman',
    shortTitle: 'Imun Defender',
    genreLabel: '2D Aksi & Pertahanan Imun',
    categoryLabel: 'Biologi Manusia · Sistem Imun',
    materialSlug: 'sistem-peredaran-darah',
    summary:
      'Kendalikan sel darah putih di dalam kapiler darah! Tembakkan antibodi dan aktifkan gelombang fagosit untuk menumpas bakteri kokus, virus kapsid, dan basil toksik.',
    controlsHint: 'WASD / Panah Gerak · Klik / Spasi Tembak · E Gelombang Fagosit · Esc Jeda',
    accentHex: '#16b3c6',
    estimatedMinutes: 3,
  },
  {
    id: 'pencernaan-2d',
    format: '2d',
    title: 'Nutrisi Pencernaan 2D',
    shortTitle: 'Nutrisi Pencernaan',
    genreLabel: '2D Strategi & Puzzle Enzim',
    categoryLabel: 'Biologi Manusia · Pencernaan',
    materialSlug: 'sistem-pencernaan-manusia',
    summary:
      'Susun strategi pelepasan enzim Amilase, Pepsin, Lipase, dan Probiotik pada saluran pencernaan 2D untuk memecah nutrisi sebelum bakteri pangan merusak mukosa.',
    controlsHint: 'Tombol 1–4 / Klik Pilih Enzim · Klik Zona Organ Pasang · H Petunjuk · Esc Jeda',
    accentHex: '#f59e0b',
    estimatedMinutes: 4,
  },
  {
    id: 'darah-3d',
    format: '3d',
    title: 'Ekspedisi Eritrosit 3D',
    shortTitle: 'Ekspedisi Eritrosit',
    genreLabel: '3D Terowongan Pembuluh Darah',
    categoryLabel: 'Biologi Manusia · Sirkulasi Darah',
    materialSlug: 'sistem-peredaran-darah',
    summary:
      'Menjadi sel darah merah di ruang 3D! Melaju melewati pembuluh arteri yang berdenyut, kumpulkan gelembung O₂ dan glukosa sambil menghindari plak kolesterol serta kuman.',
    controlsHint: 'WASD / Panah Kemudi · Spasi Dorongan O₂ · M Audio · Esc Jeda',
    accentHex: '#e84d5b',
    estimatedMinutes: 3,
  },
  {
    id: 'pencernaan-3d',
    format: '3d',
    title: 'Petualangan Saluran Pencernaan 3D',
    shortTitle: 'Saluran Pencernaan 3D',
    genreLabel: '3D Eksplorasi Kapsul Mikro',
    categoryLabel: 'Biologi Manusia · Organ Pencernaan',
    materialSlug: 'sistem-pencernaan-manusia',
    summary:
      'Kendarai kapsul mikro 3D melintasi kerongkongan, lambung asam, hingga usus halus bervili. Serap sari makanan dan netralkan gumpalan lemak dengan denyut enzim.',
    controlsHint: 'WASD / Panah Terbang · Spasi Pancar Enzim · M Audio · Esc Jeda',
    accentHex: '#18b878',
    estimatedMinutes: 4,
  },
];

export const EDUCATIONAL_GAMES_BY_ID: Record<GameId, GameCatalogSpec> = {
  'imun-2d': EDUCATIONAL_GAMES[0],
  'pencernaan-2d': EDUCATIONAL_GAMES[1],
  'darah-3d': EDUCATIONAL_GAMES[2],
  'pencernaan-3d': EDUCATIONAL_GAMES[3],
};
