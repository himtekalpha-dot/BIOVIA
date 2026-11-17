import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQuizRewardXp,
  clampExplodeAmount,
  clampScore,
  computeExplodedPosition,
  computeExplorerLevel,
  evaluateQuiz,
  evaluateSimulationState,
  filterCatalogMaterials,
  filterDashboardCategories,
  formatIndonesianDate,
  getLabSpecimenById,
  isValidFirestoreId,
  sanitizeDisplayName,
  toMaterialSlug,
} from './bioviaLogic';
import { CATALOG_CARDS, DASHBOARD_CATEGORIES, MATERIALS_DETAIL } from '../data/materials';
import { LAB_SPECIMENS } from '../data/labSpecimens';
import { SIMULATIONS } from '../data/simulations';

test('toMaterialSlug converts material titles to exact URL slugs matching detail database keys', () => {
  for (const card of CATALOG_CARDS) {
    const slug = toMaterialSlug(card.title);
    assert.equal(slug, card.slug);
    assert.ok(MATERIALS_DETAIL[slug], `Expected detail material for slug: ${slug}`);
  }
});

test('filterCatalogMaterials filters by category and search query accurately', () => {
  assert.equal(filterCatalogMaterials(CATALOG_CARDS, 'all', '').length, 12);
  assert.equal(filterCatalogMaterials(CATALOG_CARDS, 'manusia', '').length, 4);
  assert.equal(filterCatalogMaterials(CATALOG_CARDS, 'hewan', '').length, 3);
  assert.equal(filterCatalogMaterials(CATALOG_CARDS, 'tumbuhan', '').length, 3);
  assert.equal(filterCatalogMaterials(CATALOG_CARDS, 'sel', '').length, 2);

  const fishResults = filterCatalogMaterials(CATALOG_CARDS, 'all', 'insang');
  assert.equal(fishResults.length, 1);
  assert.equal(fishResults[0].slug, 'sistem-pernapasan-ikan');

  const emptyResults = filterCatalogMaterials(CATALOG_CARDS, 'tumbuhan', 'jantung');
  assert.equal(emptyResults.length, 0);
});

test('filterDashboardCategories filters dashboard category cards', () => {
  assert.equal(filterDashboardCategories(DASHBOARD_CATEGORIES, '').length, 4);
  const plantMatches = filterDashboardCategories(DASHBOARD_CATEGORIES, 'fotosintesis');
  assert.equal(plantMatches.length, 1);
  assert.equal(plantMatches[0].id, 'tumbuhan');
});

test('evaluateQuiz validates incomplete answers and computes accurate scores', () => {
  const quiz = MATERIALS_DETAIL['sistem-pernapasan-manusia'].quiz;

  const incomplete = evaluateQuiz(quiz, { 0: 1, 1: 2 });
  assert.equal(incomplete.complete, false);

  const perfect = evaluateQuiz(quiz, { 0: 1, 1: 2, 2: 2 });
  assert.equal(perfect.complete, true);
  assert.equal(perfect.score, 100);
  assert.equal(perfect.correctCount, 3);
  assert.equal(perfect.outcomes.every((o) => o.isCorrect), true);

  const partial = evaluateQuiz(quiz, { 0: 0, 1: 2, 2: 1 });
  assert.equal(partial.complete, true);
  assert.equal(partial.score, 33);
  assert.equal(partial.correctCount, 1);
  assert.equal(partial.outcomes[0].isCorrect, false);
  assert.equal(partial.outcomes[1].isCorrect, true);
  assert.equal(partial.outcomes[2].isCorrect, false);
});

test('formatIndonesianDate formats a date in Indonesian locale', () => {
  const formatted = formatIndonesianDate(new Date('2026-11-16T12:00:00Z'));
  assert.ok(formatted.includes('2026'));
  assert.ok(formatted.length > 8);
});

test('sanitization, ID validation, and XP/level calculations obey blueprint boundaries', () => {
  assert.equal(clampScore(140), 100);
  assert.equal(clampScore(-10), 0);
  assert.equal(clampScore(66.6), 67);

  assert.equal(computeExplorerLevel(0), 1);
  assert.equal(computeExplorerLevel(150), 2);
  assert.equal(computeExplorerLevel(450), 4);

  assert.equal(sanitizeDisplayName(''), 'Penjelajah BIOVIA');
  assert.equal(sanitizeDisplayName('a'.repeat(150)).length, 100);

  assert.equal(isValidFirestoreId('sistem-pernapasan-manusia'), true);
  assert.equal(isValidFirestoreId('bad/id'), false);
  assert.equal(isValidFirestoreId(''), false);

  assert.equal(calculateQuizRewardXp(100, true), 90);
  assert.equal(calculateQuizRewardXp(100, false), 40);
  assert.equal(calculateQuizRewardXp(33, true), 13);
});

test('3D lab specimen metadata and exploded-view kinematics behave deterministically', () => {
  assert.equal(LAB_SPECIMENS.length, 3);
  for (const spec of LAB_SPECIMENS) {
    assert.ok(
      MATERIALS_DETAIL[spec.materialSlug],
      `Expected material detail for specimen ${spec.id}: ${spec.materialSlug}`
    );
    assert.ok(spec.parts.length >= 5);
  }

  assert.equal(clampExplodeAmount(-0.5), 0);
  assert.equal(clampExplodeAmount(1.8), 1);
  assert.equal(clampExplodeAmount(0.45), 0.45);

  assert.deepEqual(computeExplodedPosition([0, 1, 0], [1, 2, -1], 0.5), [0.5, 2, -0.5]);
  assert.deepEqual(computeExplodedPosition([0, 1, 0], [1, 2, -1], 2), [1, 3, -1]);

  assert.equal(getLabSpecimenById(LAB_SPECIMENS, 'jantung').id, 'jantung');
  assert.equal(getLabSpecimenById(LAB_SPECIMENS, 'unknown').id, 'sel-hewan');
});

test('interactive simulation metadata and physiological models behave deterministically', () => {
  assert.equal(SIMULATIONS.length, 3);
  for (const sim of SIMULATIONS) {
    assert.ok(
      MATERIALS_DETAIL[sim.materialSlug],
      `Expected material detail for simulation ${sim.id}: ${sim.materialSlug}`
    );
    assert.equal(sim.sliders.length, 3);
  }

  // Photosynthesis: dark => 0 rate; optimal light + CO2 + 27°C > thermal stress 43°C
  const darkPhoto = evaluateSimulationState('fotosintesis', { paramA: 0, paramB: 500, paramC: 27 });
  assert.equal(darkPhoto.rateNormalized, 0);
  assert.equal(darkPhoto.statusBadge, 'Terbatas Cahaya');

  const optimalPhoto = evaluateSimulationState('fotosintesis', { paramA: 85, paramB: 700, paramC: 27 });
  const hotPhoto = evaluateSimulationState('fotosintesis', { paramA: 85, paramB: 700, paramC: 43 });
  assert.ok(optimalPhoto.rateNormalized > hotPhoto.rateNormalized);
  assert.equal(hotPhoto.statusBadge, 'Stres Termal');

  // Circulation: sprint > rest BPM
  const restCirc = evaluateSimulationState('sirkulasi', { paramA: 0, paramB: 80, paramC: 98 });
  const sprintCirc = evaluateSimulationState('sirkulasi', { paramA: 90, paramB: 80, paramC: 98 });
  assert.ok(sprintCirc.bpm > restCirc.bpm);
  assert.ok(sprintCirc.rateNormalized > restCirc.rateNormalized);

  // Osmosis: hypotonic swells (>1.0), isotonic stays 1.0, hypertonic shrinks (<1.0)
  const hypo = evaluateSimulationState('osmosis', { paramA: 10, paramB: 70, paramC: 25 });
  const iso = evaluateSimulationState('osmosis', { paramA: 50, paramB: 70, paramC: 25 });
  const hyper = evaluateSimulationState('osmosis', { paramA: 90, paramB: 70, paramC: 25 });
  assert.equal(hypo.statusBadge, 'Hipotonik');
  assert.ok(hypo.cellVolumeScale > 1);
  assert.equal(iso.statusBadge, 'Isotonik');
  assert.equal(iso.cellVolumeScale, 1);
  assert.equal(hyper.statusBadge, 'Hipertonik');
  assert.ok(hyper.cellVolumeScale < 1);
});
