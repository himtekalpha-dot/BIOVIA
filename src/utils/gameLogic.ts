import type { GameId } from '../types/biovia';

export type EnzymeKind = 'amilase' | 'pepsin' | 'lipase' | 'probiotik';
export type BolusKind = 'karbohidrat' | 'protein' | 'lemak' | 'kuman';
export type OrganZoneId = 'mulut' | 'lambung' | 'usus-halus' | 'usus-besar';

export interface EnzymeMeta {
  id: EnzymeKind;
  name: string;
  hotkey: string;
  targetBolus: BolusKind;
  idealZone: OrganZoneId;
  color: string;
  hint: string;
}

export const DIGESTIVE_ENZYMES: EnzymeMeta[] = [
  {
    id: 'amilase',
    name: 'Amilase',
    hotkey: '1',
    targetBolus: 'karbohidrat',
    idealZone: 'mulut',
    color: '#38bdf8',
    hint: 'Memecah amilum/karbohidrat menjadi maltosa mulai di Mulut.',
  },
  {
    id: 'pepsin',
    name: 'Pepsin + HCl',
    hotkey: '2',
    targetBolus: 'protein',
    idealZone: 'lambung',
    color: '#fb923c',
    hint: 'Memecah protein menjadi pepton di suasana asam Lambung.',
  },
  {
    id: 'lipase',
    name: 'Lipase + Empedu',
    hotkey: '3',
    targetBolus: 'lemak',
    idealZone: 'usus-halus',
    color: '#facc15',
    hint: 'Mengemulsi dan memecah lemak menjadi asam lemak di Usus Halus.',
  },
  {
    id: 'probiotik',
    name: 'Flora Probiotik',
    hotkey: '4',
    targetBolus: 'kuman',
    idealZone: 'usus-besar',
    color: '#34d399',
    hint: 'Menekan bakteri patogen berbahaya di sepanjang Usus Besar.',
  },
];

export function clampGameDeltaTime(rawSeconds: number): number {
  if (!Number.isFinite(rawSeconds) || rawSeconds <= 0) return 0.016;
  return Math.min(0.05, rawSeconds);
}

export interface ImmuneWaveConfig {
  wave: number;
  totalEnemies: number;
  spawnIntervalSec: number;
  enemySpeedScale: number;
  unlockedTypes: Array<'kokus' | 'virus' | 'basil'>;
}

export function computeImmuneWaveConfig(wave: number): ImmuneWaveConfig {
  const w = Math.max(1, Math.min(3, Math.floor(wave)));
  if (w === 1) {
    return {
      wave: 1,
      totalEnemies: 10,
      spawnIntervalSec: 1.25,
      enemySpeedScale: 1,
      unlockedTypes: ['kokus', 'virus'],
    };
  }
  if (w === 2) {
    return {
      wave: 2,
      totalEnemies: 15,
      spawnIntervalSec: 1.0,
      enemySpeedScale: 1.16,
      unlockedTypes: ['kokus', 'virus', 'basil'],
    };
  }
  return {
    wave: 3,
    totalEnemies: 20,
    spawnIntervalSec: 0.82,
    enemySpeedScale: 1.32,
    unlockedTypes: ['kokus', 'virus', 'basil'],
  };
}

export interface EnzymeEvaluationResult {
  matched: boolean;
  bonusZone: boolean;
  points: number;
  feedback: string;
}

export function evaluateEnzymeMatch(
  enzyme: EnzymeKind,
  bolus: BolusKind,
  zone: OrganZoneId
): EnzymeEvaluationResult {
  const meta = DIGESTIVE_ENZYMES.find((e) => e.id === enzyme);
  if (!meta) {
    return { matched: false, bonusZone: false, points: 0, feedback: 'Enzim tidak dikenal.' };
  }

  if (meta.targetBolus !== bolus) {
    return {
      matched: false,
      bonusZone: false,
      points: 0,
      feedback: `${meta.name} tidak cocok untuk ${bolus}. ${meta.hint}`,
    };
  }

  const bonusZone = meta.idealZone === zone;
  const points = bonusZone ? 160 : 100;
  return {
    matched: true,
    bonusZone,
    points,
    feedback: bonusZone
      ? `Sempurna! ${meta.name} aktif optimal di zona ideal (+${points}).`
      : `Berhasil! ${meta.name} memecah ${bolus} (+${points}).`,
  };
}

export function computeGameXpReward(
  _gameId: GameId,
  score: number,
  victory: boolean
): number {
  const clampedScore = Math.max(0, Math.min(10000, Math.round(score)));
  const base = Math.round(clampedScore / 35);
  return Math.min(160, Math.max(15, base + (victory ? 45 : 10)));
}

export function computeBloodVesselCenterAt(zDist: number): { x: number; y: number } {
  // Smooth continuous sinusoidal arterial centerline used for both tunnel framing and collision checks
  const x = Math.sin(zDist * 0.085) * 2.4 + Math.cos(zDist * 0.035) * 1.1;
  const y = Math.cos(zDist * 0.065) * 1.25;
  return { x, y };
}

export function computeDigestiveZoneIndex(progressZ: number, totalLength: number): 0 | 1 | 2 {
  const ratio = Math.max(0, Math.min(1, progressZ / Math.max(1, totalLength)));
  if (ratio < 0.34) return 0; // Lambung Asam
  if (ratio < 0.72) return 1; // Usus Halus Bervili
  return 2; // Penyerapan Usus Besar
}
