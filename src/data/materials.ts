import type {
  CatalogCardItem,
  DashboardCategoryItem,
  MaterialDetail,
  QuizQuestion,
} from '../types/biovia';

export const DASHBOARD_CATEGORIES: DashboardCategoryItem[] = [
  {
    id: 'manusia',
    title: 'Biologi Manusia',
    description: 'Kenali organ dan sistem tubuh manusia.',
    countLabel: '12 TOPIK',
    visualLabel: 'HUMAN BIOLOGY',
    symbol: '♧',
    shapeSymbol: '♟',
    cardClass: 'human-card',
    visualClass: 'human-visual',
    orbClass: 'human-orb',
    shapeClass: 'human-shape',
    searchKeywords: 'manusia organ tubuh sistem pernapasan pencernaan jantung',
  },
  {
    id: 'hewan',
    title: 'Biologi Hewan',
    description: 'Pelajari keunikan struktur tubuh hewan.',
    countLabel: '08 TOPIK',
    visualLabel: 'ANIMAL BIOLOGY',
    symbol: '⌁',
    shapeSymbol: '♧',
    cardClass: 'animal-card',
    visualClass: 'animal-visual',
    orbClass: 'animal-orb',
    shapeClass: 'animal-shape',
    searchKeywords: 'hewan binatang ikan burung sistem organ',
  },
  {
    id: 'tumbuhan',
    title: 'Biologi Tumbuhan',
    description: 'Temukan rahasia pertumbuhan tumbuhan.',
    countLabel: '10 TOPIK',
    visualLabel: 'PLANT BIOLOGY',
    symbol: '❋',
    shapeSymbol: '❧',
    cardClass: 'plant-card',
    visualClass: 'plant-visual',
    orbClass: 'plant-orb',
    shapeClass: 'plant-shape',
    searchKeywords: 'tumbuhan tanaman akar batang daun bunga fotosintesis',
  },
  {
    id: 'sel',
    title: 'Sel & Mikroorganisme',
    description: 'Masuk ke dunia kecil penyusun kehidupan.',
    countLabel: '06 TOPIK',
    visualLabel: 'CELL & MICROBIOLOGY',
    symbol: '◎',
    shapeSymbol: '◉',
    cardClass: 'cell-card',
    visualClass: 'cell-visual',
    orbClass: 'cell-orb',
    shapeClass: 'cell-shape',
    searchKeywords: 'sel mikroorganisme bakteri amoeba organel',
  },
];

export const CATALOG_CARDS: CatalogCardItem[] = [
  {
    slug: 'sistem-pernapasan-manusia',
    category: 'manusia',
    title: 'Sistem Pernapasan Manusia',
    keywords: 'paru-paru hidung trakea bronkus alveolus oksigen karbon dioksida',
    emoji: '🫁',
    artClass: 'art-lungs',
    artLabel: 'HUMAN SYSTEM',
    subjectLabel: 'BIOLOGI MANUSIA',
    tagClass: 'tag-human',
    level: 'Kelas 8',
    summary: 'Telusuri perjalanan udara dan proses pertukaran gas di paru-paru.',
    duration: '12 menit',
  },
  {
    slug: 'sistem-peredaran-darah',
    category: 'manusia',
    title: 'Sistem Peredaran Darah',
    keywords: 'jantung darah pembuluh arteri vena kapiler',
    emoji: '❤️',
    artClass: 'art-heart',
    artLabel: 'HUMAN SYSTEM',
    subjectLabel: 'BIOLOGI MANUSIA',
    tagClass: 'tag-human',
    level: 'Kelas 8',
    summary: 'Kenali jantung, pembuluh darah, dan perjalanan darah ke seluruh tubuh.',
    duration: '15 menit',
  },
  {
    slug: 'sistem-pencernaan-manusia',
    category: 'manusia',
    title: 'Sistem Pencernaan Manusia',
    keywords: 'mulut kerongkongan lambung usus halus usus besar enzim',
    emoji: '🥣',
    artClass: 'art-digest',
    artLabel: 'HUMAN SYSTEM',
    subjectLabel: 'BIOLOGI MANUSIA',
    tagClass: 'tag-human',
    level: 'Kelas 8',
    summary: 'Ikuti proses makanan diolah menjadi zat gizi yang dibutuhkan tubuh.',
    duration: '14 menit',
  },
  {
    slug: 'sistem-ekskresi-manusia',
    category: 'manusia',
    title: 'Sistem Ekskresi Manusia',
    keywords: 'ginjal kulit paru-paru hati urine',
    emoji: '🫘',
    artClass: 'art-kidney',
    artLabel: 'HUMAN SYSTEM',
    subjectLabel: 'BIOLOGI MANUSIA',
    tagClass: 'tag-human',
    level: 'Kelas 8',
    summary: 'Pelajari cara tubuh membuang zat sisa melalui organ ekskresi.',
    duration: '11 menit',
  },
  {
    slug: 'sistem-pernapasan-ikan',
    category: 'hewan',
    title: 'Sistem Pernapasan Ikan',
    keywords: 'insang filamen lamela oksigen air',
    emoji: '🐟',
    artClass: 'art-fish',
    artLabel: 'ANIMAL BIOLOGY',
    subjectLabel: 'BIOLOGI HEWAN',
    tagClass: 'tag-animal',
    level: 'Kelas 8',
    summary: 'Temukan bagaimana insang membantu ikan mengambil oksigen dari air.',
    duration: '9 menit',
  },
  {
    slug: 'pencernaan-hewan-ruminansia',
    category: 'hewan',
    title: 'Pencernaan Hewan Ruminansia',
    keywords: 'sapi kambing rumen retikulum omasum abomasum',
    emoji: '🐄',
    artClass: 'art-cow',
    artLabel: 'ANIMAL BIOLOGY',
    subjectLabel: 'BIOLOGI HEWAN',
    tagClass: 'tag-animal',
    level: 'Kelas 8',
    summary: 'Pahami keunikan lambung berkompartemen pada sapi dan kambing.',
    duration: '13 menit',
  },
  {
    slug: 'rangka-dan-gerak-burung',
    category: 'hewan',
    title: 'Rangka dan Gerak Burung',
    keywords: 'burung tulang sayap otot terbang',
    emoji: '🕊️',
    artClass: 'art-bird',
    artLabel: 'ANIMAL BIOLOGY',
    subjectLabel: 'BIOLOGI HEWAN',
    tagClass: 'tag-animal',
    level: 'Kelas 8',
    summary: 'Kenali adaptasi tulang dan otot yang mendukung kemampuan terbang.',
    duration: '10 menit',
  },
  {
    slug: 'struktur-akar-dan-fungsinya',
    category: 'tumbuhan',
    title: 'Struktur Akar dan Fungsinya',
    keywords: 'akar rambut akar xilem floem penyerapan air',
    emoji: '🌱',
    artClass: 'art-roots',
    artLabel: 'PLANT BIOLOGY',
    subjectLabel: 'BIOLOGI TUMBUHAN',
    tagClass: 'tag-plant',
    level: 'Kelas 8',
    summary: 'Pelajari bagian akar dan perannya menyerap air serta mineral.',
    duration: '10 menit',
  },
  {
    slug: 'fotosintesis-pada-tumbuhan',
    category: 'tumbuhan',
    title: 'Fotosintesis pada Tumbuhan',
    keywords: 'klorofil kloroplas cahaya matahari karbon dioksida glukosa',
    emoji: '🍃',
    artClass: 'art-leaf',
    artLabel: 'PLANT BIOLOGY',
    subjectLabel: 'BIOLOGI TUMBUHAN',
    tagClass: 'tag-plant',
    level: 'Kelas 8',
    summary: 'Ungkap cara tumbuhan membuat makanan dengan bantuan cahaya.',
    duration: '12 menit',
  },
  {
    slug: 'transportasi-pada-tumbuhan',
    category: 'tumbuhan',
    title: 'Transportasi pada Tumbuhan',
    keywords: 'xilem floem air mineral hasil fotosintesis batang',
    emoji: '🌿',
    artClass: 'art-stem',
    artLabel: 'PLANT BIOLOGY',
    subjectLabel: 'BIOLOGI TUMBUHAN',
    tagClass: 'tag-plant',
    level: 'Kelas 8',
    summary: 'Ikuti perjalanan air dan hasil fotosintesis melalui jaringan pengangkut.',
    duration: '11 menit',
  },
  {
    slug: 'struktur-sel-hewan-dan-tumbuhan',
    category: 'sel',
    title: 'Struktur Sel Hewan dan Tumbuhan',
    keywords: 'membran sel inti nukleus sitoplasma mitokondria kloroplas',
    emoji: '🧫',
    artClass: 'art-cell',
    artLabel: 'CELL BIOLOGY',
    subjectLabel: 'SEL & MIKROORGANISME',
    tagClass: 'tag-cell',
    level: 'Kelas 7',
    summary: 'Jelajahi bagian-bagian sel dan fungsi setiap organelnya.',
    duration: '15 menit',
  },
  {
    slug: 'mengenal-bakteri',
    category: 'sel',
    title: 'Mengenal Bakteri',
    keywords: 'bakteri prokariotik dinding sel flagela mikroorganisme',
    emoji: '🦠',
    artClass: 'art-bacteria',
    artLabel: 'MICROBIOLOGY',
    subjectLabel: 'SEL & MIKROORGANISME',
    tagClass: 'tag-cell',
    level: 'Kelas 7',
    summary: 'Kenali organisme mikroskopis bersel satu dan perannya di alam.',
    duration: '9 menit',
  },
];

export const MATERIALS_DETAIL: Record<string, MaterialDetail> = {
  'sistem-pernapasan-manusia': {
    title: 'Sistem Pernapasan Manusia',
    category: 'BIOLOGI MANUSIA',
    emoji: '🫁',
    duration: '12 menit',
    description:
      'Pelajari bagaimana manusia mengambil oksigen dan mengeluarkan karbon dioksida melalui sistem pernapasan.',
    objectives: [
      'Menjelaskan pengertian sistem pernapasan manusia.',
      'Mengidentifikasi organ-organ pernapasan manusia.',
      'Menjelaskan fungsi setiap organ pernapasan.',
      'Memahami proses inspirasi dan ekspirasi.',
    ],
    lessons: [
      {
        title: '1. Pengertian Sistem Pernapasan',
        paragraphs: [
          'Sistem pernapasan merupakan sistem organ yang berfungsi untuk melakukan pertukaran gas antara tubuh dan lingkungan.',
          'Manusia membutuhkan oksigen untuk membantu proses pembentukan energi di dalam sel. Dalam proses tersebut, tubuh juga menghasilkan karbon dioksida yang harus dikeluarkan.',
        ],
        highlight:
          'Oksigen digunakan oleh sel untuk menghasilkan energi, sedangkan karbon dioksida merupakan salah satu zat sisa metabolisme.',
      },
      {
        title: '2. Organ-Organ Pernapasan',
        paragraphs: [
          'Sistem pernapasan manusia terdiri dari beberapa organ yang saling bekerja sama.',
          'Udara masuk melalui hidung, kemudian melewati faring, laring, trakea, bronkus, bronkiolus, hingga mencapai alveolus di dalam paru-paru.',
        ],
        highlight:
          'Alveolus merupakan tempat utama terjadinya pertukaran oksigen dan karbon dioksida.',
      },
      {
        title: '3. Mekanisme Pernapasan',
        paragraphs: [
          'Pernapasan manusia berlangsung melalui dua proses utama, yaitu inspirasi dan ekspirasi.',
          'Inspirasi merupakan proses masuknya udara ke paru-paru. Sebaliknya, ekspirasi merupakan proses keluarnya udara dari paru-paru.',
        ],
        highlight: 'Inspirasi = udara masuk. Ekspirasi = udara keluar.',
      },
      {
        title: '4. Pertukaran Gas',
        paragraphs: [
          'Di dalam alveolus, oksigen dari udara berdifusi menembus dinding alveolus menuju kapiler darah.',
          'Sebaliknya, karbon dioksida dari darah berpindah menuju alveolus untuk dikeluarkan saat ekspirasi.',
        ],
        highlight:
          'Pertukaran gas terjadi secara difusi berdasarkan perbedaan konsentrasi atau tekanan parsial gas.',
      },
    ],
    parts: [
      {
        name: 'Hidung',
        description: 'Menyaring, menghangatkan, dan melembapkan udara yang masuk.',
      },
      {
        name: 'Faring',
        description: 'Menjadi jalur penghubung dari rongga hidung menuju laring.',
      },
      {
        name: 'Laring',
        description: 'Mengandung pita suara dan menjadi jalur udara menuju trakea.',
      },
      {
        name: 'Trakea',
        description: 'Saluran udara yang dilapisi silia dan lendir untuk membantu menyaring partikel.',
      },
      {
        name: 'Bronkus',
        description: 'Cabang trakea yang menyalurkan udara menuju paru-paru.',
      },
      {
        name: 'Bronkiolus',
        description: 'Cabang kecil bronkus yang mengalirkan udara menuju alveolus.',
      },
      {
        name: 'Alveolus',
        description: 'Kantung udara kecil tempat pertukaran oksigen dan karbon dioksida.',
      },
      {
        name: 'Paru-paru',
        description: 'Organ utama sistem pernapasan yang menjadi tempat berlangsungnya pertukaran gas.',
      },
    ],
    summary:
      'Sistem pernapasan manusia merupakan sistem organ yang berfungsi mengambil oksigen dan mengeluarkan karbon dioksida. Udara melewati hidung, faring, laring, trakea, bronkus, bronkiolus, hingga alveolus. Di alveolus terjadi pertukaran gas antara udara dan darah.',
    quiz: [
      {
        question: 'Organ yang menjadi tempat utama pertukaran gas oksigen dan karbon dioksida adalah...',
        options: ['Trakea', 'Alveolus', 'Bronkus', 'Hidung'],
        answer: 1,
        explanation: 'Alveolus merupakan tempat pertukaran gas antara udara dan kapiler darah.',
      },
      {
        question: 'Proses masuknya udara ke dalam paru-paru disebut...',
        options: ['Ekspirasi', 'Difusi', 'Inspirasi', 'Transpirasi'],
        answer: 2,
        explanation: 'Inspirasi adalah proses masuknya udara ke dalam paru-paru.',
      },
      {
        question: 'Gas yang dibutuhkan tubuh dalam proses respirasi sel adalah...',
        options: ['Nitrogen', 'Karbon dioksida', 'Oksigen', 'Hidrogen'],
        answer: 2,
        explanation: 'Oksigen digunakan dalam respirasi sel untuk membantu menghasilkan energi.',
      },
    ],
  },

  'sistem-peredaran-darah': {
    title: 'Sistem Peredaran Darah',
    category: 'BIOLOGI MANUSIA',
    emoji: '❤️',
    duration: '15 menit',
    description: 'Kenali jantung, pembuluh darah, dan perjalanan darah ke seluruh tubuh.',
    objectives: [
      'Menjelaskan fungsi sistem peredaran darah.',
      'Mengidentifikasi bagian-bagian jantung.',
      'Membedakan pembuluh arteri, vena, dan kapiler.',
    ],
    lessons: [
      {
        title: '1. Pengertian Sistem Peredaran Darah',
        paragraphs: [
          'Sistem peredaran darah adalah sistem yang mengangkut darah ke seluruh bagian tubuh.',
          'Darah membawa oksigen, zat makanan, hormon, dan membantu mengangkut zat sisa metabolisme.',
        ],
        highlight: 'Jantung berfungsi sebagai pompa yang menggerakkan darah ke seluruh tubuh.',
      },
      {
        title: '2. Organ Peredaran Darah',
        paragraphs: [
          'Sistem peredaran darah manusia terdiri dari jantung, pembuluh darah, dan darah.',
          'Jantung memiliki empat ruang, yaitu serambi kanan, serambi kiri, bilik kanan, dan bilik kiri.',
        ],
        highlight: 'Jantung manusia memiliki empat ruang yang bekerja secara terkoordinasi.',
      },
      {
        title: '3. Jenis Pembuluh Darah',
        paragraphs: [
          'Arteri membawa darah keluar dari jantung, sedangkan vena membawa darah kembali menuju jantung.',
          'Kapiler merupakan pembuluh darah sangat kecil yang menjadi tempat pertukaran zat antara darah dan jaringan.',
        ],
        highlight: 'Arteri menjauhi jantung, vena menuju jantung.',
      },
    ],
    parts: [
      { name: 'Jantung', description: 'Memompa darah ke seluruh tubuh.' },
      { name: 'Arteri', description: 'Membawa darah keluar dari jantung.' },
      { name: 'Vena', description: 'Mengembalikan darah menuju jantung.' },
      { name: 'Kapiler', description: 'Tempat pertukaran gas dan zat makanan.' },
    ],
    summary:
      'Sistem peredaran darah mengangkut berbagai zat yang diperlukan tubuh. Jantung memompa darah melalui pembuluh arteri, vena, dan kapiler.',
    quiz: [
      {
        question: 'Organ utama yang memompa darah adalah...',
        options: ['Paru-paru', 'Jantung', 'Ginjal', 'Lambung'],
        answer: 1,
        explanation: 'Jantung berfungsi memompa darah ke seluruh tubuh.',
      },
      {
        question: 'Pembuluh yang membawa darah keluar dari jantung adalah...',
        options: ['Vena', 'Kapiler', 'Arteri', 'Venula'],
        answer: 2,
        explanation: 'Arteri membawa darah menjauhi jantung.',
      },
      {
        question: 'Berapa jumlah ruang jantung manusia?',
        options: ['Dua', 'Tiga', 'Empat', 'Lima'],
        answer: 2,
        explanation: 'Jantung manusia memiliki empat ruang.',
      },
    ],
  },

  'sistem-pencernaan-manusia': {
    title: 'Sistem Pencernaan Manusia',
    category: 'BIOLOGI MANUSIA',
    emoji: '🍎',
    duration: '14 menit',
    description:
      'Ikuti perjalanan makanan dan pelajari bagaimana tubuh mengolah makanan menjadi zat gizi.',
    objectives: [
      'Menjelaskan fungsi sistem pencernaan.',
      'Mengidentifikasi organ pencernaan.',
      'Memahami pencernaan mekanik dan kimiawi.',
    ],
    lessons: [
      {
        title: '1. Pengertian Pencernaan',
        paragraphs: [
          'Sistem pencernaan merupakan sistem organ yang bertugas mengolah makanan menjadi zat yang dapat diserap tubuh.',
          'Pencernaan berlangsung melalui proses mekanik dan kimiawi.',
        ],
        highlight:
          'Pencernaan mekanik menghancurkan makanan secara fisik, sedangkan pencernaan kimiawi melibatkan enzim.',
      },
      {
        title: '2. Jalur Pencernaan',
        paragraphs: [
          'Makanan masuk melalui mulut, kemudian melewati kerongkongan, lambung, usus halus, dan usus besar.',
          'Sisa makanan yang tidak tercerna akan dikeluarkan melalui anus.',
        ],
        highlight: 'Usus halus merupakan tempat utama penyerapan zat makanan.',
      },
    ],
    parts: [
      { name: 'Mulut', description: 'Mengunyah makanan dan mencampurnya dengan air liur.' },
      {
        name: 'Kerongkongan',
        description: 'Mengalirkan makanan menuju lambung melalui gerak peristaltik.',
      },
      { name: 'Lambung', description: 'Mengaduk makanan dan membantu pencernaan protein.' },
      {
        name: 'Usus Halus',
        description: 'Tempat utama pencernaan lanjutan dan penyerapan zat gizi.',
      },
      { name: 'Usus Besar', description: 'Menyerap air dan membentuk feses.' },
      { name: 'Anus', description: 'Tempat pengeluaran feses.' },
    ],
    summary:
      'Sistem pencernaan mengubah makanan menjadi zat gizi yang dapat diserap tubuh. Proses berlangsung melalui organ-organ pencernaan yang bekerja secara berurutan.',
    quiz: [
      {
        question: 'Tempat utama penyerapan zat makanan adalah...',
        options: ['Lambung', 'Usus halus', 'Kerongkongan', 'Mulut'],
        answer: 1,
        explanation: 'Usus halus memiliki struktur vili yang membantu penyerapan zat makanan.',
      },
      {
        question: 'Gerakan yang mendorong makanan di kerongkongan disebut...',
        options: ['Difusi', 'Osmosis', 'Peristaltik', 'Inspirasi'],
        answer: 2,
        explanation: 'Gerak peristaltik merupakan kontraksi otot saluran pencernaan.',
      },
      {
        question: 'Organ yang menyerap sebagian besar air dari sisa makanan adalah...',
        options: ['Usus besar', 'Lambung', 'Mulut', 'Pankreas'],
        answer: 0,
        explanation: 'Usus besar berperan menyerap air dan membentuk feses.',
      },
    ],
  },

  'sistem-ekskresi-manusia': {
    title: 'Sistem Ekskresi Manusia',
    category: 'BIOLOGI MANUSIA',
    emoji: '🫘',
    duration: '11 menit',
    description: 'Pelajari cara tubuh membuang zat sisa metabolisme melalui organ ekskresi.',
    objectives: [
      'Menjelaskan pengertian ekskresi.',
      'Mengidentifikasi organ ekskresi manusia.',
      'Menjelaskan proses pembentukan urine.',
    ],
    lessons: [
      {
        title: '1. Pengertian Ekskresi',
        paragraphs: [
          'Ekskresi adalah proses pengeluaran zat sisa metabolisme dari dalam tubuh.',
          'Proses ini membantu menjaga keseimbangan kondisi internal tubuh.',
        ],
        highlight: 'Ginjal merupakan organ utama dalam pembentukan urine.',
      },
      {
        title: '2. Proses Pembentukan Urine',
        paragraphs: [
          'Pembentukan urine berlangsung melalui filtrasi, reabsorpsi, dan sekresi.',
          'Urine yang terbentuk dialirkan menuju kandung kemih sebelum dikeluarkan.',
        ],
        highlight: 'Nefron merupakan unit struktural dan fungsional ginjal.',
      },
    ],
    parts: [
      { name: 'Ginjal', description: 'Menyaring darah dan membentuk urine.' },
      { name: 'Kulit', description: 'Mengeluarkan keringat.' },
      { name: 'Paru-paru', description: 'Mengeluarkan karbon dioksida dan uap air.' },
      { name: 'Hati', description: 'Membantu mengolah zat beracun dan menghasilkan urea.' },
    ],
    summary:
      'Sistem ekskresi berfungsi mengeluarkan zat sisa metabolisme. Organ yang terlibat antara lain ginjal, kulit, paru-paru, dan hati.',
    quiz: [
      {
        question: 'Organ utama pembentuk urine adalah...',
        options: ['Jantung', 'Ginjal', 'Paru-paru', 'Lambung'],
        answer: 1,
        explanation: 'Ginjal menyaring darah dan menghasilkan urine.',
      },
      {
        question: 'Unit fungsional ginjal disebut...',
        options: ['Alveolus', 'Nefron', 'Neuron', 'Vili'],
        answer: 1,
        explanation: 'Nefron merupakan unit fungsional ginjal.',
      },
      {
        question: 'Proses pengeluaran keringat dilakukan oleh...',
        options: ['Kulit', 'Jantung', 'Usus', 'Pankreas'],
        answer: 0,
        explanation: 'Kelenjar keringat pada kulit menghasilkan keringat.',
      },
    ],
  },

  'sistem-pernapasan-ikan': {
    title: 'Sistem Pernapasan Ikan',
    category: 'BIOLOGI HEWAN',
    emoji: '🐟',
    duration: '9 menit',
    description:
      'Temukan bagaimana ikan mengambil oksigen terlarut di dalam air menggunakan insang.',
    objectives: [
      'Menjelaskan fungsi insang.',
      'Mengidentifikasi bagian insang.',
      'Memahami proses pertukaran gas pada ikan.',
    ],
    lessons: [
      {
        title: '1. Pernapasan Ikan',
        paragraphs: [
          'Ikan bernapas menggunakan insang yang mampu mengambil oksigen terlarut di dalam air.',
          'Air masuk melalui mulut dan mengalir melewati lembaran insang.',
        ],
        highlight: 'Insang memungkinkan ikan mengambil oksigen dari lingkungan perairan.',
      },
      {
        title: '2. Pertukaran Gas',
        paragraphs: [
          'Pada insang terdapat filamen dan lamela yang memiliki banyak pembuluh kapiler.',
          'Oksigen berdifusi dari air menuju darah, sedangkan karbon dioksida berdifusi ke arah sebaliknya.',
        ],
        highlight: 'Luas permukaan insang membantu proses pertukaran gas.',
      },
    ],
    parts: [
      {
        name: 'Operkulum',
        description: 'Penutup insang pada sebagian besar ikan bertulang sejati.',
      },
      { name: 'Lengkung Insang', description: 'Struktur penopang filamen insang.' },
      { name: 'Filamen', description: 'Lembaran yang memperluas permukaan pertukaran gas.' },
      { name: 'Lamela', description: 'Tempat berlangsungnya pertukaran gas dengan darah.' },
    ],
    summary:
      'Ikan menggunakan insang untuk mengambil oksigen terlarut dalam air. Pertukaran gas berlangsung melalui permukaan filamen dan lamela insang.',
    quiz: [
      {
        question: 'Organ pernapasan utama ikan adalah...',
        options: ['Paru-paru', 'Insang', 'Kulit saja', 'Trakea'],
        answer: 1,
        explanation: 'Ikan umumnya menggunakan insang untuk pertukaran gas.',
      },
      {
        question: 'Oksigen yang digunakan ikan berasal dari...',
        options: ['Udara bebas', 'Tanah', 'Air', 'Makanan'],
        answer: 2,
        explanation: 'Insang mengambil oksigen yang terlarut dalam air.',
      },
      {
        question: 'Tempat pertukaran gas pada insang terdapat pada...',
        options: ['Lamela', 'Sirip', 'Ekor', 'Sisik'],
        answer: 0,
        explanation: 'Lamela memiliki permukaan tipis dan banyak kapiler.',
      },
    ],
  },

  'pencernaan-hewan-ruminansia': {
    title: 'Pencernaan Hewan Ruminansia',
    category: 'BIOLOGI HEWAN',
    emoji: '🐄',
    duration: '13 menit',
    description:
      'Pahami keunikan sistem pencernaan sapi dan kambing yang memiliki lambung berkompartemen.',
    objectives: [
      'Menjelaskan ciri hewan ruminansia.',
      'Menyebutkan bagian lambung ruminansia.',
      'Memahami proses memamah biak.',
    ],
    lessons: [
      {
        title: '1. Mengenal Ruminansia',
        paragraphs: [
          'Hewan ruminansia adalah hewan pemamah biak, misalnya sapi, kambing, dan domba.',
          'Hewan ini memiliki lambung dengan empat kompartemen.',
        ],
        highlight: 'Ruminansia memanfaatkan bantuan mikroorganisme untuk mencerna bahan tumbuhan.',
      },
      {
        title: '2. Proses Pencernaan',
        paragraphs: [
          'Makanan yang telah ditelan dapat dikembalikan ke mulut untuk dikunyah kembali.',
          'Proses ini membantu memperkecil ukuran makanan sebelum pencernaan berlanjut.',
        ],
        highlight: 'Proses mengunyah kembali makanan disebut memamah biak.',
      },
    ],
    parts: [
      { name: 'Rumen', description: 'Tempat fermentasi makanan dengan bantuan mikroorganisme.' },
      { name: 'Retikulum', description: 'Membantu pembentukan bolus untuk dimamah kembali.' },
      {
        name: 'Omasum',
        description: 'Membantu penyerapan air dan pengolahan partikel makanan.',
      },
      { name: 'Abomasum', description: 'Lambung sejati yang menghasilkan cairan pencernaan.' },
    ],
    summary:
      'Hewan ruminansia memiliki empat bagian lambung, yaitu rumen, retikulum, omasum, dan abomasum. Sistem ini membantu mencerna makanan berserat.',
    quiz: [
      {
        question: 'Hewan yang termasuk ruminansia adalah...',
        options: ['Ayam', 'Sapi', 'Kucing', 'Ikan'],
        answer: 1,
        explanation: 'Sapi merupakan salah satu contoh hewan ruminansia.',
      },
      {
        question: 'Tempat fermentasi utama makanan adalah...',
        options: ['Rumen', 'Abomasum', 'Usus besar', 'Kerongkongan'],
        answer: 0,
        explanation: 'Rumen menjadi tempat fermentasi dengan bantuan mikroorganisme.',
      },
      {
        question: 'Lambung sejati pada ruminansia adalah...',
        options: ['Retikulum', 'Omasum', 'Abomasum', 'Rumen'],
        answer: 2,
        explanation: 'Abomasum merupakan lambung sejati.',
      },
    ],
  },

  'rangka-dan-gerak-burung': {
    title: 'Rangka dan Gerak Burung',
    category: 'BIOLOGI HEWAN',
    emoji: '🦅',
    duration: '10 menit',
    description:
      'Kenali adaptasi tulang dan otot yang mendukung kemampuan burung untuk terbang.',
    objectives: [
      'Mengidentifikasi bagian rangka burung.',
      'Menjelaskan fungsi tulang dan otot.',
      'Memahami adaptasi tubuh burung untuk terbang.',
    ],
    lessons: [
      {
        title: '1. Struktur Rangka Burung',
        paragraphs: [
          'Burung memiliki rangka yang mendukung gerakan dan membantu mempertahankan bentuk tubuh.',
          'Pada banyak burung terbang, beberapa tulang memiliki struktur berongga yang membantu mengurangi massa tubuh.',
        ],
        highlight: 'Adaptasi rangka membantu burung bergerak secara efisien.',
      },
      {
        title: '2. Mekanisme Terbang',
        paragraphs: [
          'Gerakan sayap didukung oleh kerja otot dada dan struktur rangka.',
          'Bentuk sayap dan bulu juga membantu menghasilkan gaya aerodinamis.',
        ],
        highlight: 'Otot dada yang kuat berperan penting dalam gerakan sayap.',
      },
    ],
    parts: [
      { name: 'Tulang Sayap', description: 'Mendukung struktur dan gerakan sayap.' },
      {
        name: 'Tulang Dada',
        description: 'Pada banyak burung terbang memiliki lunas sebagai tempat melekatnya otot.',
      },
      { name: 'Otot Dada', description: 'Menggerakkan sayap saat terbang.' },
      {
        name: 'Bulu',
        description: 'Membantu menghasilkan gaya angkat dan mengendalikan arah.',
      },
    ],
    summary:
      'Rangka, otot dada, sayap, dan bulu bekerja sama mendukung kemampuan terbang burung.',
    quiz: [
      {
        question: 'Bagian yang berperan kuat dalam menggerakkan sayap adalah...',
        options: ['Otot dada', 'Lambung', 'Ginjal', 'Insang'],
        answer: 0,
        explanation: 'Otot dada membantu menghasilkan gerakan kepakan sayap.',
      },
      {
        question: 'Fungsi utama rangka adalah...',
        options: ['Mencerna makanan', 'Menopang tubuh', 'Menghasilkan urine', 'Menyaring darah'],
        answer: 1,
        explanation: 'Rangka menopang tubuh dan membantu pergerakan.',
      },
      {
        question: 'Struktur yang membantu burung menghasilkan gaya aerodinamis adalah...',
        options: ['Bulu dan sayap', 'Gigi', 'Insang', 'Sisik ikan'],
        answer: 0,
        explanation: 'Sayap dan bulu membantu burung menghasilkan gaya aerodinamis.',
      },
    ],
  },

  'struktur-akar-dan-fungsinya': {
    title: 'Struktur Akar dan Fungsinya',
    category: 'BIOLOGI TUMBUHAN',
    emoji: '🌱',
    duration: '10 menit',
    description: 'Pelajari bagian akar dan perannya dalam menyerap air serta mineral dari tanah.',
    objectives: [
      'Mengidentifikasi bagian-bagian akar.',
      'Menjelaskan fungsi akar.',
      'Memahami proses penyerapan air dan mineral.',
    ],
    lessons: [
      {
        title: '1. Pengertian Akar',
        paragraphs: [
          'Akar merupakan organ tumbuhan yang umumnya tumbuh di dalam tanah.',
          'Akar berfungsi menyerap air dan mineral, menopang tumbuhan, serta pada beberapa tumbuhan menyimpan cadangan makanan.',
        ],
        highlight: 'Rambut akar membantu memperluas permukaan penyerapan.',
      },
      {
        title: '2. Jaringan Akar',
        paragraphs: [
          'Akar memiliki jaringan epidermis, korteks, endodermis, dan silinder pusat.',
          'Di dalam silinder pusat terdapat jaringan pengangkut xilem dan floem.',
        ],
        highlight: 'Xilem mengangkut air dan mineral dari akar ke bagian tumbuhan lainnya.',
      },
    ],
    parts: [
      { name: 'Tudung Akar', description: 'Melindungi ujung akar saat menembus tanah.' },
      {
        name: 'Rambut Akar',
        description: 'Memperluas permukaan untuk menyerap air dan mineral.',
      },
      { name: 'Korteks', description: 'Menyimpan cadangan makanan dan menjadi jalur perpindahan zat.' },
      { name: 'Xilem', description: 'Mengangkut air dan mineral.' },
      { name: 'Floem', description: 'Mengangkut hasil fotosintesis.' },
    ],
    summary:
      'Akar berfungsi menyerap air dan mineral, menopang tumbuhan, serta menyimpan cadangan makanan pada jenis tumbuhan tertentu.',
    quiz: [
      {
        question: 'Bagian akar yang membantu penyerapan air adalah...',
        options: ['Bunga', 'Rambut akar', 'Buah', 'Daun'],
        answer: 1,
        explanation: 'Rambut akar memperluas permukaan penyerapan.',
      },
      {
        question: 'Jaringan yang mengangkut air adalah...',
        options: ['Floem', 'Xilem', 'Epidermis', 'Klorofil'],
        answer: 1,
        explanation: 'Xilem mengangkut air dan mineral.',
      },
      {
        question: 'Bagian yang melindungi ujung akar adalah...',
        options: ['Tudung akar', 'Bunga', 'Batang', 'Daun'],
        answer: 0,
        explanation: 'Tudung akar melindungi jaringan di ujung akar.',
      },
    ],
  },

  'fotosintesis-pada-tumbuhan': {
    title: 'Fotosintesis pada Tumbuhan',
    category: 'BIOLOGI TUMBUHAN',
    emoji: '🌿',
    duration: '12 menit',
    description: 'Ungkap bagaimana tumbuhan membuat makanan dengan bantuan cahaya matahari.',
    objectives: [
      'Menjelaskan pengertian fotosintesis.',
      'Mengidentifikasi bahan yang dibutuhkan dalam fotosintesis.',
      'Menjelaskan hasil fotosintesis.',
    ],
    lessons: [
      {
        title: '1. Pengertian Fotosintesis',
        paragraphs: [
          'Fotosintesis merupakan proses tumbuhan hijau mengubah energi cahaya menjadi energi kimia yang tersimpan dalam senyawa organik.',
          'Proses ini terutama berlangsung di kloroplas yang mengandung klorofil.',
        ],
        highlight: 'Fotosintesis memerlukan cahaya, air, dan karbon dioksida.',
      },
      {
        title: '2. Proses Fotosintesis',
        paragraphs: [
          'Air diserap akar dan diangkut menuju daun. Karbon dioksida masuk melalui stomata.',
          'Dengan bantuan energi cahaya, tumbuhan menghasilkan gula dan melepaskan oksigen.',
        ],
        highlight:
          'Secara sederhana: karbon dioksida + air + energi cahaya menghasilkan glukosa dan oksigen.',
      },
    ],
    parts: [
      { name: 'Daun', description: 'Tempat utama berlangsungnya fotosintesis.' },
      { name: 'Kloroplas', description: 'Organel tempat berlangsungnya fotosintesis.' },
      { name: 'Klorofil', description: 'Pigmen yang menyerap energi cahaya.' },
      { name: 'Stomata', description: 'Jalan pertukaran gas pada daun.' },
    ],
    summary:
      'Fotosintesis adalah proses tumbuhan menghasilkan senyawa organik dengan menggunakan energi cahaya, air, dan karbon dioksida. Proses ini menghasilkan oksigen.',
    quiz: [
      {
        question: 'Organel tempat berlangsungnya fotosintesis adalah...',
        options: ['Mitokondria', 'Kloroplas', 'Nukleus', 'Ribosom'],
        answer: 1,
        explanation: 'Fotosintesis berlangsung di kloroplas.',
      },
      {
        question: 'Pigmen yang menyerap energi cahaya adalah...',
        options: ['Hemoglobin', 'Klorofil', 'Melanin', 'Keratin'],
        answer: 1,
        explanation: 'Klorofil merupakan pigmen hijau yang menyerap cahaya.',
      },
      {
        question: 'Salah satu hasil fotosintesis adalah...',
        options: ['Oksigen', 'Urea', 'Asam lambung', 'Urine'],
        answer: 0,
        explanation: 'Fotosintesis menghasilkan gula dan oksigen.',
      },
    ],
  },

  'transportasi-pada-tumbuhan': {
    title: 'Transportasi pada Tumbuhan',
    category: 'BIOLOGI TUMBUHAN',
    emoji: '🌳',
    duration: '11 menit',
    description:
      'Ikuti perjalanan air, mineral, dan hasil fotosintesis melalui jaringan pengangkut tumbuhan.',
    objectives: [
      'Menjelaskan fungsi jaringan pengangkut.',
      'Membedakan xilem dan floem.',
      'Memahami proses pengangkutan zat pada tumbuhan.',
    ],
    lessons: [
      {
        title: '1. Jaringan Pengangkut',
        paragraphs: [
          'Tumbuhan memiliki jaringan pengangkut untuk mendistribusikan air, mineral, dan hasil fotosintesis.',
          'Dua jaringan pengangkut utama adalah xilem dan floem.',
        ],
        highlight: 'Xilem dan floem memiliki fungsi pengangkutan yang berbeda.',
      },
      {
        title: '2. Proses Pengangkutan',
        paragraphs: [
          'Air dan mineral diserap oleh akar lalu diangkut melalui xilem menuju daun.',
          'Hasil fotosintesis dari daun didistribusikan melalui floem menuju bagian tumbuhan yang membutuhkan atau menyimpannya.',
        ],
        highlight:
          'Xilem terutama mengangkut air dan mineral, sedangkan floem mengangkut hasil fotosintesis.',
      },
    ],
    parts: [
      { name: 'Akar', description: 'Menyerap air dan mineral dari tanah.' },
      { name: 'Xilem', description: 'Mengangkut air dan mineral dari akar.' },
      { name: 'Floem', description: 'Mengangkut hasil fotosintesis.' },
      { name: 'Daun', description: 'Tempat utama fotosintesis.' },
    ],
    summary:
      'Transportasi pada tumbuhan melibatkan jaringan xilem dan floem. Xilem mengangkut air dan mineral, sedangkan floem mendistribusikan hasil fotosintesis.',
    quiz: [
      {
        question: 'Jaringan pengangkut air pada tumbuhan adalah...',
        options: ['Floem', 'Xilem', 'Epidermis', 'Korteks'],
        answer: 1,
        explanation: 'Xilem mengangkut air dan mineral.',
      },
      {
        question: 'Jaringan yang mengangkut hasil fotosintesis adalah...',
        options: ['Floem', 'Xilem', 'Stomata', 'Rambut akar'],
        answer: 0,
        explanation: 'Floem mendistribusikan hasil fotosintesis.',
      },
      {
        question: 'Air dan mineral terutama diserap oleh...',
        options: ['Bunga', 'Buah', 'Akar', 'Biji'],
        answer: 2,
        explanation: 'Akar menyerap air dan mineral dari tanah.',
      },
    ],
  },

  'struktur-sel-hewan-dan-tumbuhan': {
    title: 'Struktur Sel Hewan dan Tumbuhan',
    category: 'SEL & MIKROORGANISME',
    emoji: '🔬',
    duration: '15 menit',
    description:
      'Jelajahi bagian-bagian sel hewan dan tumbuhan serta fungsi setiap organelnya.',
    objectives: [
      'Menjelaskan pengertian sel.',
      'Mengidentifikasi organel sel.',
      'Membedakan sel hewan dan sel tumbuhan.',
    ],
    lessons: [
      {
        title: '1. Pengertian Sel',
        paragraphs: [
          'Sel merupakan unit struktural dan fungsional terkecil penyusun makhluk hidup.',
          'Sel memiliki bagian-bagian yang bekerja sama untuk menjalankan aktivitas kehidupan.',
        ],
        highlight: 'Semua makhluk hidup tersusun atas satu sel atau lebih.',
      },
      {
        title: '2. Organel Sel',
        paragraphs: [
          'Sel memiliki berbagai organel, seperti membran sel, sitoplasma, inti sel, dan mitokondria.',
          'Sel tumbuhan juga memiliki dinding sel dan kloroplas.',
        ],
        highlight: 'Kloroplas berperan dalam fotosintesis pada sel tumbuhan.',
      },
    ],
    parts: [
      { name: 'Membran Sel', description: 'Mengatur keluar masuknya zat.' },
      { name: 'Nukleus', description: 'Menyimpan materi genetik dan mengatur aktivitas sel.' },
      { name: 'Sitoplasma', description: 'Tempat berbagai reaksi metabolisme berlangsung.' },
      { name: 'Mitokondria', description: 'Tempat utama respirasi sel dan pembentukan ATP.' },
      {
        name: 'Dinding Sel',
        description: 'Memberikan perlindungan dan bentuk pada sel tumbuhan.',
      },
      { name: 'Kloroplas', description: 'Tempat berlangsungnya fotosintesis.' },
    ],
    summary:
      'Sel adalah unit terkecil penyusun makhluk hidup. Sel hewan dan tumbuhan memiliki beberapa organel yang sama, tetapi sel tumbuhan memiliki dinding sel dan kloroplas.',
    quiz: [
      {
        question: 'Pusat pengendali aktivitas sel adalah...',
        options: ['Nukleus', 'Membran', 'Dinding sel', 'Vakuola'],
        answer: 0,
        explanation: 'Nukleus menyimpan materi genetik dan mengatur aktivitas sel.',
      },
      {
        question: 'Organel tempat fotosintesis adalah...',
        options: ['Mitokondria', 'Kloroplas', 'Ribosom', 'Lisosom'],
        answer: 1,
        explanation: 'Kloroplas mengandung klorofil dan menjadi tempat fotosintesis.',
      },
      {
        question: 'Struktur yang dimiliki sel tumbuhan tetapi tidak dimiliki sel hewan adalah...',
        options: ['Membran sel', 'Sitoplasma', 'Dinding sel', 'Nukleus'],
        answer: 2,
        explanation: 'Sel tumbuhan memiliki dinding sel.',
      },
    ],
  },

  'mengenal-bakteri': {
    title: 'Mengenal Bakteri',
    category: 'SEL & MIKROORGANISME',
    emoji: '🦠',
    duration: '9 menit',
    description: 'Kenali organisme mikroskopis bersel satu dan peranannya dalam kehidupan.',
    objectives: [
      'Menjelaskan karakteristik bakteri.',
      'Mengidentifikasi struktur dasar bakteri.',
      'Menjelaskan peran bakteri bagi kehidupan.',
    ],
    lessons: [
      {
        title: '1. Pengertian Bakteri',
        paragraphs: [
          'Bakteri merupakan organisme mikroskopis bersel satu yang termasuk kelompok prokariota.',
          'Bakteri tidak memiliki inti sel sejati yang dibungkus membran.',
        ],
        highlight: 'Bakteri merupakan organisme prokariotik.',
      },
      {
        title: '2. Bentuk dan Peranan Bakteri',
        paragraphs: [
          'Bakteri memiliki berbagai bentuk, seperti kokus (bulat), basil (batang), dan spiril (spiral).',
          'Sebagian bakteri bermanfaat, misalnya dalam fermentasi makanan, sedangkan sebagian lainnya dapat menyebabkan penyakit.',
        ],
        highlight: 'Tidak semua bakteri berbahaya bagi manusia.',
      },
    ],
    parts: [
      { name: 'Dinding Sel', description: 'Memberikan bentuk dan perlindungan.' },
      { name: 'Membran Plasma', description: 'Mengatur pertukaran zat.' },
      { name: 'Sitoplasma', description: 'Tempat berlangsungnya reaksi metabolisme.' },
      { name: 'Nukleoid', description: 'Wilayah tempat DNA utama bakteri berada.' },
      { name: 'Ribosom', description: 'Tempat sintesis protein.' },
      {
        name: 'Flagela',
        description: 'Membantu pergerakan pada bakteri yang memilikinya.',
      },
    ],
    summary:
      'Bakteri adalah organisme prokariotik bersel satu. Bakteri memiliki beragam bentuk dan peranan, baik yang menguntungkan maupun yang merugikan.',
    quiz: [
      {
        question: 'Bakteri termasuk organisme...',
        options: ['Eukariotik', 'Prokariotik', 'Multiseluler', 'Tidak bersel'],
        answer: 1,
        explanation: 'Bakteri merupakan organisme prokariotik.',
      },
      {
        question: 'Bentuk bakteri bulat disebut...',
        options: ['Basil', 'Spiril', 'Kokus', 'Hifa'],
        answer: 2,
        explanation: 'Kokus adalah bentuk bakteri bulat.',
      },
      {
        question: 'Struktur yang membantu pergerakan bakteri adalah...',
        options: ['Flagela', 'Nukleoid', 'Ribosom', 'Dinding sel'],
        answer: 0,
        explanation: 'Flagela membantu pergerakan pada bakteri yang memilikinya.',
      },
    ],
  },
};

export const DAILY_CHALLENGE_QUIZ: QuizQuestion[] = [
  {
    question: 'Organ yang menjadi tempat utama pertukaran gas oksigen dan karbon dioksida pada manusia adalah...',
    options: ['Trakea', 'Alveolus', 'Bronkus', 'Hidung'],
    answer: 1,
    explanation: 'Alveolus memiliki dinding tipis dan dikelilingi kapiler darah untuk pertukaran gas.',
  },
  {
    question: 'Pembuluh darah yang membawa darah keluar dari jantung disebut...',
    options: ['Vena', 'Kapiler', 'Arteri', 'Venula'],
    answer: 2,
    explanation: 'Arteri mengalirkan darah menjauhi jantung menuju organ atau paru-paru.',
  },
  {
    question: 'Organ pencernaan yang menjadi tempat utama penyerapan zat gizi adalah...',
    options: ['Lambung', 'Usus halus', 'Kerongkongan', 'Usus besar'],
    answer: 1,
    explanation: 'Usus halus dilengkapi vili yang memperluas permukaan penyerapan zat gizi.',
  },
  {
    question: 'Unit struktural dan fungsional penyaring darah pada ginjal disebut...',
    options: ['Alveolus', 'Nefron', 'Neuron', 'Vili'],
    answer: 1,
    explanation: 'Nefron menjalankan proses filtrasi, reabsorpsi, dan sekresi pada ginjal.',
  },
  {
    question: 'Organel pada sel tumbuhan yang berfungsi sebagai tempat fotosintesis adalah...',
    options: ['Mitokondria', 'Kloroplas', 'Nukleus', 'Ribosom'],
    answer: 1,
    explanation: 'Kloroplas mengandung pigmen klorofil untuk menangkap energi cahaya.',
  },
];
