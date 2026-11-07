// Tests of the delivered-nutrition follow-up.
// SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import { followupSummary, checkFollowupValue } from '../web/followup.mjs';
import { recommend } from '../web/engine.mjs';

test('Follow-up values: ranges, whole days, numbers only; empty is not an error', () => {
  assert.equal(checkFollowupValue('day', '0').code, 'range');
  assert.equal(checkFollowupValue('day', '2.5').code, 'integer');
  assert.equal(checkFollowupValue('kcal', 'abc').code, 'nan');
  assert.equal(checkFollowupValue('protein', '600').code, 'range');
  assert.equal(checkFollowupValue('kcal', ''), null);
  assert.equal(checkFollowupValue('kcal', '1250,5'), null);
});

test('Follow-up summary: percentages, early overfeeding mark, cumulative balance; incomplete rows not counted', () => {
  const target = () => ({ kcal: 1200, protein: 80 });
  const s = followupSummary([
    { day: '3', kcal: '1000', protein: '60' },
    { day: '4', kcal: '1500', protein: '80' },
    { day: '5', kcal: '', protein: '70' },
    { day: 'x', kcal: '900', protein: '50' },
  ], target, { icu: true });
  assert.equal(s.counted, 2);
  assert.equal(Math.round(s.rows[0].pctKcal), 83);
  assert.equal(s.rows[0].over, false);
  assert.equal(s.rows[1].over, true);
  assert.equal(s.energyBalance, 100);
  assert.equal(s.proteinBalance, -20);
  assert.equal(s.rows[2].complete, false);
  assert.equal(s.rows[3].invalid, true);
  assert.equal(followupSummary([{ day: '9', kcal: '1500', protein: '80' }], target, { icu: true }).rows[0].over, false);
  assert.equal(followupSummary([{ day: '3', kcal: '1500', protein: '80' }], target, { icu: false }).rows[0].over, false);
  assert.equal(followupSummary([{ day: '3', kcal: '1000', protein: '60' }], () => null).counted, 0);
});

test('Past ICU day targets come from the engine with feeding taken as running', () => {
  const base = { setting: 'icu', age: 60, sex: 'male', heightCm: 175, weightKg: 75, icuDay: 5, swallow: 'unsafe', gi: 'ok', shock: 'none', kidney: 'normal' };
  const day4 = recommend({ ...base, icuDay: '4', feeding: 'ongoing' }).plan.today;
  const day2 = recommend({ ...base, icuDay: '2', feeding: 'ongoing' }).plan.today;
  assert.ok(day4.kcalTarget > day2.kcalTarget);
  assert.ok(day4.proteinTarget > 0);
});
