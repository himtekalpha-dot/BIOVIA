export type MaterialCategory = 'manusia' | 'hewan' | 'tumbuhan' | 'sel';

export type ActivePage =
  | 'login'
  | 'dashboard'
  | 'jelajahi'
  | 'detail'
  | 'lab3d'
  | 'simulasi'
  | 'game';

export interface Lesson {
  title: string;
  paragraphs: string[];
  highlight: string;
}

export interface MaterialPart {
  name: string;
  description: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface MaterialDetail {
  title: string;
  category: string;
  emoji: string;
  duration: string;
  description: string;
  objectives: string[];
  lessons: Lesson[];
  parts: MaterialPart[];
  summary: string;
  quiz: QuizQuestion[];
}

export interface CatalogCardItem {
  slug: string;
  category: MaterialCategory;
  title: string;
  keywords: string;
  emoji: string;
  artClass: string;
  artLabel: string;
  subjectLabel: string;
  tagClass: string;
  level: string;
  summary: string;
  duration: string;
}

export interface DashboardCategoryItem {
  id: MaterialCategory;
  title: string;
  description: string;
  countLabel: string;
  visualLabel: string;
  symbol: string;
  shapeSymbol: string;
  cardClass: string;
  visualClass: string;
  orbClass: string;
  shapeClass: string;
  searchKeywords: string;
}

export interface QuizItemOutcome {
  index: number;
  isCorrect: boolean;
  selectedOption: number;
  correctOption: number;
  explanation: string;
}

export interface QuizEvaluationResult {
  complete: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  outcomes: QuizItemOutcome[];
}

export interface StudentProfileDoc {
  uid: string;
  displayName: string;
  xp: number;
  level: number;
  completedCount: number;
  dailyChallengeBestScore?: number;
}

export interface MaterialProgressDoc {
  userId: string;
  materialSlug: string;
  title: string;
  category: MaterialCategory;
  bestScore: number;
  lastScore: number;
  attempts: number;
  completed: boolean;
}

export interface QuizAttemptDoc {
  id: string;
  userId: string;
  materialSlug: string;
  materialTitle: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  createdAtLabel?: string;
}

export type LabSpecimenId = 'sel-hewan' | 'paru-paru' | 'jantung';

export type LabLightingPreset = 'mikroskop' | 'studio' | 'klinik';

export interface LabPartSpec {
  id: string;
  name: string;
  role: string;
  description: string;
  swatch: string;
  explodeOffset: [number, number, number];
}

export interface LabSpecimenSpec {
  id: LabSpecimenId;
  title: string;
  categoryLabel: string;
  materialSlug: string;
  summary: string;
  defaultCameraPos: [number, number, number];
  defaultTarget: [number, number, number];
  parts: LabPartSpec[];
}

export type SimId = 'fotosintesis' | 'sirkulasi' | 'osmosis';

export interface SimSliderDef {
  key: 'paramA' | 'paramB' | 'paramC';
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

export interface SimSpec {
  id: SimId;
  shortLabel: string;
  title: string;
  categoryLabel: string;
  materialSlug: string;
  summary: string;
  defaultCameraPos: [number, number, number];
  defaultTarget: [number, number, number];
  defaultParams: SimParams;
  sliders: SimSliderDef[];
}

export interface SimParams {
  paramA: number;
  paramB: number;
  paramC: number;
}

export interface SimMetricItem {
  label: string;
  value: string;
  tone: 'cyan' | 'green' | 'amber' | 'rose';
}

export interface SimComputedState {
  rateNormalized: number; // 0..1 primary intensity/flow multiplier
  stressNormalized: number; // 0..1 (e.g. thermal stress, hypertonic shrinkage)
  cellVolumeScale: number; // used by osmosis (0.68..1.28)
  bpm: number; // used by circulation (56..180)
  statusBadge: string;
  metrics: SimMetricItem[];
}

export type GameFormat = '2d' | '3d';

export type GameId = 'imun-2d' | 'pencernaan-2d' | 'darah-3d' | 'pencernaan-3d';

export type GameShellState = 'title' | 'playing' | 'paused' | 'gameover';

export interface GameCatalogSpec {
  id: GameId;
  format: GameFormat;
  title: string;
  shortTitle: string;
  genreLabel: string;
  categoryLabel: string;
  materialSlug: string;
  summary: string;
  controlsHint: string;
  accentHex: string;
  estimatedMinutes: number;
}

export interface GameRunResult {
  gameId: GameId;
  victory: boolean;
  score: number;
  elapsedSeconds: number;
  primaryStatLabel: string;
  primaryStatValue: string;
  secondaryStatLabel: string;
  secondaryStatValue: string;
  xpEarned: number;
}

