import test from 'node:test';
import assert from 'node:assert/strict';
import { EDUCATIONAL_GAMES } from '../data/games';
import { MATERIALS_DETAIL } from '../data/materials';
import {
  clampGameDeltaTime,
  computeBloodVesselCenterAt,
  computeDigestiveZoneIndex,
  computeGameXpReward,
  computeImmuneWaveConfig,
  evaluateEnzymeMatch,
} from './gameLogic';

test('educational games catalog offers both 2D and 3D formats with valid material slugs', () => {
  const formats2d = EDUCATIONAL_GAMES.filter((g) => g.format === '2d');
  const formats3d = EDUCATIONAL_GAMES.filter((g) => g.format === '3d');
  assert.equal(formats2d.length, 2);
  assert.equal(formats3d.length, 2);

  for (const game of EDUCATIONAL_GAMES) {
    assert.ok(
      MATERIALS_DETAIL[game.materialSlug],
      `Game ${game.id} links missing material ${game.materialSlug}`
    );
  }
});

test('game delta time clamps frame spikes cleanly', () => {
  assert.equal(clampGameDeltaTime(0.016), 0.016);
  assert.equal(clampGameDeltaTime(0.5), 0.05);
  assert.equal(clampGameDeltaTime(-1), 0.016);
  assert.equal(clampGameDeltaTime(Number.NaN), 0.016);
});

test('immune defender waves escalate enemy counts, speed, and unlock basil chargers', () => {
  const w1 = computeImmuneWaveConfig(1);
  const w2 = computeImmuneWaveConfig(2);
  const w3 = computeImmuneWaveConfig(3);

  assert.equal(w1.unlockedTypes.includes('basil'), false);
  assert.equal(w2.unlockedTypes.includes('basil'), true);
  assert.ok(w3.totalEnemies > w2.totalEnemies && w2.totalEnemies > w1.totalEnemies);
  assert.ok(w3.enemySpeedScale > w1.enemySpeedScale);
});

test('digestive enzyme matching awards bonus points at ideal organ zones', () => {
  const ideal = evaluateEnzymeMatch('amilase', 'karbohidrat', 'mulut');
  const nonIdeal = evaluateEnzymeMatch('amilase', 'karbohidrat', 'lambung');
  const wrong = evaluateEnzymeMatch('pepsin', 'lemak', 'lambung');

  assert.equal(ideal.matched, true);
  assert.equal(ideal.bonusZone, true);
  assert.ok(ideal.points > nonIdeal.points);
  assert.equal(nonIdeal.matched, true);
  assert.equal(nonIdeal.bonusZone, false);
  assert.equal(wrong.matched, false);
  assert.equal(wrong.points, 0);
});

test('3D vessel centerline, digestive zone progression, and XP calculation remain bounded', () => {
  const c0 = computeBloodVesselCenterAt(0);
  assert.equal(Number.isFinite(c0.x), true);
  assert.equal(Number.isFinite(c0.y), true);

  assert.equal(computeDigestiveZoneIndex(10, 120), 0);
  assert.equal(computeDigestiveZoneIndex(60, 120), 1);
  assert.equal(computeDigestiveZoneIndex(110, 120), 2);

  const winXp = computeGameXpReward('darah-3d', 1500, true);
  const lossXp = computeGameXpReward('darah-3d', 200, false);
  assert.ok(winXp > lossXp);
  assert.ok(winXp <= 160 && lossXp >= 15);
});
