import type { LabSpecimenId, LabSpecimenSpec } from '../types/biovia';

export const LAB_SPECIMENS: LabSpecimenSpec[] = [
  {
    id: 'sel-hewan',
    title: 'Sel Hewan Eukariotik',
    categoryLabel: 'Sel & Mikroorganisme',
    materialSlug: 'struktur-sel-hewan-dan-tumbuhan',
    summary:
      'Model potongan sel eukariotik lengkap dengan inti sel, mitokondria penghasil ATP, retikulum endoplasma, badan Golgi, dan lisosom.',
    defaultCameraPos: [4.15, 2.55, 4.9],
    defaultTarget: [-0.24, -0.18, 0],
    parts: [
      {
        id: 'membran-sel',
        name: 'Membran Plasma',
        role: 'Pelindung & Pengatur Transportasi',
        description:
          'Lapisan fosfolipid ganda selektif permeabel yang melindungi isi sel serta mengatur keluar masuknya ion, nutrisi, dan zat sisa.',
        swatch: '#46c7d6',
        explodeOffset: [0, -0.35, 0],
      },
      {
        id: 'nukleus',
        name: 'Nukleus & Nukleolus',
        role: 'Pusat Kendali Genetik',
        description:
          'Menyimpan materi genetik DNA dalam bentuk kromatin serta nukleolus yang merakit subunit ribosom untuk sintesis protein.',
        swatch: '#6b5ce7',
        explodeOffset: [0, 0.95, 0],
      },
      {
        id: 'mitokondria',
        name: 'Mitokondria',
        role: 'Pembangkit Energi (ATP)',
        description:
          'Memiliki membran dalam berlipat (krista) tempat berlangsungnya respirasi seluler aerob untuk menghasilkan molekul energi ATP.',
        swatch: '#f07148',
        explodeOffset: [1.15, 0.45, 0.55],
      },
      {
        id: 'retikulum-endoplasma',
        name: 'Retikulum Endoplasma',
        role: 'Sintesis & Transportasi Protein',
        description:
          'Jaringan membran berlipat di sekitar nukleus; RE kasar bertabur ribosom untuk merakit protein, sedangkan RE halus mensintesis lipid.',
        swatch: '#27a3b8',
        explodeOffset: [-1.05, 0.5, 0.45],
      },
      {
        id: 'badan-golgi',
        name: 'Badan Golgi',
        role: 'Modifikasi & Pengemasan Molekul',
        description:
          'Tumpukan kantung pipih (sisterna) yang memodifikasi, menyortir, dan mengemas protein maupun lipid ke dalam vesikula sekresi.',
        swatch: '#e0a43b',
        explodeOffset: [-0.85, 0.4, -0.95],
      },
      {
        id: 'lisosom',
        name: 'Lisosom & Sentrosom',
        role: 'Pencernaan Intrasel & Pembelahan',
        description:
          'Lisosom mengandung enzim hidrolitik untuk mendaur ulang organel rusak, sementara sentrosom mengatur gelendong pembelahan sel.',
        swatch: '#2bb673',
        explodeOffset: [0.9, 0.35, -0.85],
      },
    ],
  },
  {
    id: 'paru-paru',
    title: 'Paru-paru & Alveolus',
    categoryLabel: 'Biologi Manusia',
    materialSlug: 'sistem-pernapasan-manusia',
    summary:
      'Anatomi sistem pernapasan manusia mencakup trakea bercincin tulang rawan, cabang bronkus, lobus paru-paru, hingga kantung alveolus dan diafragma.',
    defaultCameraPos: [3.9, 2.25, 5.1],
    defaultTarget: [-0.22, -0.08, 0],
    parts: [
      {
        id: 'trakea',
        name: 'Trakea & Cincin Kartilago',
        role: 'Saluran Napas Utama',
        description:
          'Pipa udara fleksibel yang diperkuat cincin tulang rawan berbentuk huruf C serta silia untuk menyaring debu sebelum masuk ke paru-paru.',
        swatch: '#6fc5dc',
        explodeOffset: [0, 0.95, 0],
      },
      {
        id: 'bronkus',
        name: 'Bronkus & Bronkiolus',
        role: 'Percabangan Aliran Udara',
        description:
          'Cabang utama trakea yang mengalirkan udara menuju paru-paru kanan dan kiri lalu bercabang halus menjadi bronkiolus.',
        swatch: '#3897b8',
        explodeOffset: [0, 0.35, 0.75],
      },
      {
        id: 'paru-kanan',
        name: 'Paru-paru Kanan (3 Lobus)',
        role: 'Organ Pernapasan Utama',
        description:
          'Terdiri atas tiga lobus (superior, medius, inferior) bertekstur spons elastis yang dilindungi oleh selaput ganda pleura.',
        swatch: '#e88b98',
        explodeOffset: [-1.15, 0.25, 0],
      },
      {
        id: 'paru-kiri',
        name: 'Paru-paru Kiri (2 Lobus)',
        role: 'Organ Pernapasan & Takik Jantung',
        description:
          'Memiliki dua lobus dengan ukuran sedikit lebih ramping untuk memberi ruang bagi posisi jantung di rongga dada sebelah kiri.',
        swatch: '#df7888',
        explodeOffset: [1.15, 0.25, 0],
      },
      {
        id: 'alveolus',
        name: 'Kantung Alveolus & Kapiler',
        role: 'Pusat Pertukaran Gas (Difusi)',
        description:
          'Sekumpulan kantung udara berdinding tipis satu lapis sel yang dikelilingi kapiler darah untuk difusi oksigen dan karbon dioksida.',
        swatch: '#ff7066',
        explodeOffset: [0.85, -0.15, 1.05],
      },
      {
        id: 'diafragma',
        name: 'Otot Diafragma',
        role: 'Penggerak Tekanan Pernapasan',
        description:
          'Sekat otot berkubah di dasar rongga dada yang berkontraksi datar saat inspirasi untuk memperbesar volume rongga toraks.',
        swatch: '#c85a6a',
        explodeOffset: [0, -0.75, 0],
      },
    ],
  },
  {
    id: 'jantung',
    title: 'Jantung Manusia',
    categoryLabel: 'Biologi Manusia',
    materialSlug: 'sistem-peredaran-darah',
    summary:
      'Model empat ruang jantung manusia beserta lengkung aorta, arteri pulmonalis, vena kava, dan pembuluh koroner dengan simulasi denyut fisiologis.',
    defaultCameraPos: [3.8, 2.25, 4.85],
    defaultTarget: [-0.22, -0.12, 0],
    parts: [
      {
        id: 'ventrikel-kiri',
        name: 'Ventrikel Kiri (Bilik Kiri)',
        role: 'Pemompa Darah ke Seluruh Tubuh',
        description:
          'Memiliki dinding otot miokardium paling tebal karena harus memompa darah kaya oksigen bertekanan tinggi ke seluruh tubuh melalui aorta.',
        swatch: '#c9384a',
        explodeOffset: [0.85, -0.2, 0.55],
      },
      {
        id: 'ventrikel-kanan',
        name: 'Ventrikel Kanan (Bilik Kanan)',
        role: 'Pemompa Darah ke Paru-paru',
        description:
          'Menerima darah rendah oksigen dari atrium kanan dan memompanya menuju paru-paru melalui arteri pulmonalis.',
        swatch: '#4a7bc2',
        explodeOffset: [-0.85, -0.2, 0.55],
      },
      {
        id: 'atrium',
        name: 'Atrium Kanan & Kiri (Serambi)',
        role: 'Ruang Penerima Darah',
        description:
          'Atrium kanan menerima darah vena dari seluruh tubuh, sedangkan atrium kiri menerima darah kaya oksigen dari vena pulmonalis paru-paru.',
        swatch: '#b8536a',
        explodeOffset: [0, 0.45, -0.75],
      },
      {
        id: 'aorta',
        name: 'Aorta & Lengkung Aorta',
        role: 'Arteri Terbesar Tubuh',
        description:
          'Pembuluh nadi elastis bertekanan tinggi yang menyalurkan darah beroksigen keluar dari ventrikel kiri menuju kepala, lengan, dan tubuh bagian bawah.',
        swatch: '#e04856',
        explodeOffset: [0.35, 1.0, 0.2],
      },
      {
        id: 'vena-pulmonal',
        name: 'Vena Kava & Arteri Pulmonalis',
        role: 'Jalur Sirkulasi Paru & Sistemik',
        description:
          'Vena kava mengembalikan darah miskin oksigen ke jantung, sementara arteri pulmonalis mengantarkannya ke paru-paru untuk pertukaran gas.',
        swatch: '#3a6eb5',
        explodeOffset: [-0.75, 0.9, -0.3],
      },
      {
        id: 'koroner',
        name: 'Pembuluh Darah Koroner',
        role: 'Suplai Nutrisi Otot Jantung',
        description:
          'Cabang pembuluh halus di permukaan miokardium yang memasok oksigen dan glukosa terus-menerus bagi otot jantung yang bekerja tanpa henti.',
        swatch: '#f26b5b',
        explodeOffset: [0, -0.1, 1.0],
      },
    ],
  },
];

export const LAB_SPECIMENS_BY_ID: Record<LabSpecimenId, LabSpecimenSpec> = {
  'sel-hewan': LAB_SPECIMENS[0],
  'paru-paru': LAB_SPECIMENS[1],
  jantung: LAB_SPECIMENS[2],
};
