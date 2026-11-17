import type {
  CatalogCardItem,
  DashboardCategoryItem,
  MaterialCategory,
  QuizEvaluationResult,
  QuizQuestion,
  SimComputedState,
  SimId,
  SimParams,
} from '../types/biovia';

export const VALID_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const MAX_DISPLAY_NAME_LENGTH = 100;
export const MAX_TITLE_LENGTH = 160;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_PHOTO_URL_LENGTH = 512;

export function toMaterialSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function filterCatalogMaterials(
  items: CatalogCardItem[],
  category: MaterialCategory | 'all',
  query: string
): CatalogCardItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    const haystack =
      `${item.title} ${item.keywords} ${item.summary} ${item.subjectLabel} ${item.level}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function filterDashboardCategories(
  categories: DashboardCategoryItem[],
  query: string
): DashboardCategoryItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('id');
  if (!normalizedQuery) return categories;
  return categories.filter((cat) => {
    const searchable =
      `${cat.searchKeywords} ${cat.title} ${cat.description} ${cat.visualLabel}`.toLocaleLowerCase(
        'id'
      );
    return searchable.includes(normalizedQuery);
  });
}

export function evaluateQuiz(
  questions: QuizQuestion[],
  answers: Record<number, number>
): QuizEvaluationResult {
  const totalQuestions = questions.length;
  if (totalQuestions === 0) {
    return {
      complete: true,
      score: 0,
      correctCount: 0,
      totalQuestions: 0,
      outcomes: [],
    };
  }

  for (let i = 0; i < totalQuestions; i++) {
    if (answers[i] === undefined || answers[i] === null) {
      return {
        complete: false,
        score: 0,
        correctCount: 0,
        totalQuestions,
        outcomes: [],
      };
    }
  }

  let correctCount = 0;
  const outcomes = questions.map((question, index) => {
    const selectedOption = answers[index];
    const isCorrect = selectedOption === question.answer;
    if (isCorrect) correctCount += 1;
    return {
      index,
      isCorrect,
      selectedOption,
      correctOption: question.answer,
      explanation: question.explanation,
    };
  });

  const score = Math.round((correctCount / totalQuestions) * 100);
  return {
    complete: true,
    score,
    correctCount,
    totalQuestions,
    outcomes,
  };
}

export function formatIndonesianDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function computeExplorerLevel(xp: number): number {
  const safeXp = Math.min(1000000, Math.max(0, Math.floor(xp)));
  return Math.min(100, Math.max(1, Math.floor(safeXp / 150) + 1));
}

export function sanitizeDisplayName(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return 'Penjelajah BIOVIA';
  return trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

export function sanitizeMaterialTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return 'Materi Biologi';
  return trimmed.slice(0, MAX_TITLE_LENGTH);
}

export function isValidFirestoreId(id: string): boolean {
  return id.length >= 1 && id.length <= 128 && VALID_ID_PATTERN.test(id);
}

export function calculateQuizRewardXp(score: number, isFirstCompletion: boolean): number {
  const safeScore = clampScore(score);
  const baseXp = Math.round(safeScore * 0.4);
  const completionBonus = isFirstCompletion && safeScore >= 60 ? 50 : 0;
  return baseXp + completionBonus;
}

export function clampExplodeAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function computeExplodedPosition(
  base: readonly [number, number, number],
  offset: readonly [number, number, number],
  explodeAmount: number
): [number, number, number] {
  const t = clampExplodeAmount(explodeAmount);
  return [
    base[0] + offset[0] * t,
    base[1] + offset[1] * t,
    base[2] + offset[2] * t,
  ];
}

export function getLabSpecimenById<T extends { id: string }>(
  specimens: T[],
  id: string
): T {
  return specimens.find((item) => item.id === id) ?? specimens[0];
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function evaluateSimulationState(simId: SimId, params: SimParams): SimComputedState {
  if (simId === 'fotosintesis') {
    const light = clamp01(params.paramA / 100);
    const co2 = clamp01((params.paramB - 100) / 900);
    const temp = params.paramC;

    const lightCurve = light === 0 ? 0 : (1.25 * light) / (0.25 + light);
    const co2Curve = 0.14 + 0.86 * ((1.28 * co2) / (0.28 + co2));
    const tempFactor = Math.exp(-Math.pow((temp - 27) / 13.5, 2));
    const rateNormalized = clamp01(Math.min(lightCurve, co2Curve) * tempFactor);
    const stressNormalized = clamp01((temp - 35) / 10);

    const statusBadge =
      temp >= 38
        ? 'Stres Termal'
        : params.paramA < 20
          ? 'Terbatas Cahaya'
          : params.paramB < 250
            ? 'Terbatas CO₂'
            : rateNormalized >= 0.65
              ? 'Optimal'
              : 'Aktif Sedang';

    const o2PerMin = Math.round(rateNormalized * 96);
    const glucoseMg = (rateNormalized * 18.4).toFixed(1);

    return {
      rateNormalized,
      stressNormalized,
      cellVolumeScale: 1,
      bpm: 72,
      statusBadge,
      metrics: [
        {
          label: 'Laju Fotosintesis',
          value: `${Math.round(rateNormalized * 100)}%`,
          tone: rateNormalized >= 0.6 ? 'green' : 'cyan',
        },
        {
          label: 'Gelembung O₂',
          value: `${o2PerMin} /mnt`,
          tone: 'cyan',
        },
        {
          label: 'Sintesis Glukosa',
          value: `${glucoseMg} mg/j`,
          tone: 'green',
        },
        {
          label: 'Status Enzim',
          value: statusBadge,
          tone: temp >= 38 ? 'rose' : rateNormalized >= 0.65 ? 'green' : 'amber',
        },
      ],
    };
  }

  if (simId === 'sirkulasi') {
    const activity = clamp01(params.paramA / 100);
    const elasticity = clamp01(params.paramB / 100);
    const spo2 = Math.min(100, Math.max(70, Math.round(params.paramC)));

    const bpm = Math.round(62 + activity * 112 + (1 - elasticity) * 14);
    const strokeMl = Math.round(64 + activity * 28 + elasticity * 18);
    const cardiacOutput = (bpm * strokeMl) / 1000;
    const systolic = Math.round(112 + activity * 52 + (1 - elasticity) * 24);
    const rateNormalized = clamp01((cardiacOutput - 4) / 14);
    const stressNormalized = clamp01((systolic - 155) / 40);

    const statusBadge =
      bpm >= 150 ? 'Beban Tinggi' : bpm >= 100 ? 'Aktif Aerobik' : 'Istirahat Normal';

    return {
      rateNormalized,
      stressNormalized,
      cellVolumeScale: 1,
      bpm,
      statusBadge,
      metrics: [
        {
          label: 'Detak Jantung',
          value: `${bpm} BPM`,
          tone: bpm >= 150 ? 'rose' : bpm >= 105 ? 'amber' : 'cyan',
        },
        {
          label: 'Curah Jantung',
          value: `${cardiacOutput.toFixed(1)} L/mnt`,
          tone: 'green',
        },
        {
          label: 'Tekanan Sistolik',
          value: `${systolic} mmHg`,
          tone: systolic >= 155 ? 'amber' : 'cyan',
        },
        {
          label: 'Saturasi O₂',
          value: `${spo2}%`,
          tone: spo2 < 92 ? 'rose' : 'green',
        },
      ],
    };
  }

  // Osmosis membran sel
  const solutePct = Math.min(100, Math.max(0, params.paramA));
  const perm = clamp01(params.paramB / 100);
  const tempFactor = 0.75 + clamp01((params.paramC - 10) / 30) * 0.45;
  const delta = 50 - solutePct;
  const cellVolumeScale = Number((1 + (delta / 50) * 0.28).toFixed(2));
  const osmoticPressure = Math.abs(delta) * 0.08 * tempFactor;
  const rateNormalized = clamp01((Math.abs(delta) / 50) * perm * (0.8 + 0.2 * tempFactor));
  const stressNormalized = clamp01(Math.abs(delta) / 50);

  const tonicity =
    solutePct < 38 ? 'Hipotonik' : solutePct > 62 ? 'Hipertonik' : 'Isotonik';
  const flowDirection =
    solutePct < 38 ? 'Masuk ke Sel' : solutePct > 62 ? 'Keluar dari Sel' : 'Seimbang';

  return {
    rateNormalized,
    stressNormalized,
    cellVolumeScale,
    bpm: 72,
    statusBadge: tonicity,
    metrics: [
      {
        label: 'Kondisi Larutan',
        value: tonicity,
        tone: tonicity === 'Isotonik' ? 'green' : tonicity === 'Hipotonik' ? 'cyan' : 'rose',
      },
      {
        label: 'Volume Sel',
        value: `${Math.round(cellVolumeScale * 100)}%`,
        tone: cellVolumeScale > 1.15 ? 'amber' : cellVolumeScale < 0.85 ? 'rose' : 'green',
      },
      {
        label: 'Aliran Air',
        value: flowDirection,
        tone: 'cyan',
      },
      {
        label: 'Tekanan Osmotik',
        value: `${osmoticPressure.toFixed(1)} atm`,
        tone: osmoticPressure > 2.2 ? 'amber' : 'green',
      },
    ],
  };
}
