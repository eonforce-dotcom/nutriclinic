import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG_DATE, FORMULAS, COVERAGE, productById} from '../web/formula-catalog.mjs';

test('catalog identity and provenance distinguish specific markets and package bases', () => {
  assert.equal(CATALOG_DATE, '2026-11-20');
  assert.equal(new Set(FORMULAS.map(p => p.id)).size, FORMULAS.length);
  assert.equal(new Set(FORMULAS.map(p => p.catalogId)).size, FORMULAS.length);
  for (const p of FORMULAS) {
    assert.ok(Number.isInteger(p.catalogId) && p.catalogId >= 1001);
    assert.ok(p.name && p.manufacturer && p.country && p.market && p.sku);
    assert.equal(new URL(p.sourceUrl).protocol, 'https:');
    assert.match(p.sourceSnapshotSha256, /^[a-f\d]{64}$/);
    assert.equal(p.checkedAt, CATALOG_DATE);
    assert.equal(p.requiresLabelConfirmation, true);
    assert.equal(p.labelVerified, false);
    assert.equal(p.patientSuitabilityConfirmed, false);
    assert.ok(p.warnings.length && p.warningsTr.length);
    assert.ok(p.oral || p.tube);
  }
  assert.equal(productById('resource-protein-tr-200').catalogId, 1001);
});

test('catalog lookup rejects malformed IDs and retains immutable product facts', () => {
  const p = productById(1001);
  assert.equal(productById('1001'), p);
  assert.equal(productById(p.id), p);
  for (const id of [null, {}, [], NaN, 1001.5, '1001junk', '1001.0', '01001', 'unknown']) assert.equal(productById(id), null);
  assert.ok(Object.isFrozen(FORMULAS) && Object.isFrozen(p) && Object.isFrozen(p.basis));
  assert.throws(() => { p.kcalPerMl = 9; }, TypeError);
});

test('all liquid compositions use the declared package basis without energy/protein dimensional drift', () => {
  for (const p of FORMULAS) {
    assert.ok(p.kcalPerMl > 0 && p.kcalPerMl < 4);
    assert.ok(p.proteinPer100 > 0 && p.proteinPer100 < 30);
    assert.ok(Math.abs(p.kcalPerMl * p.basis.volumeMl - p.basis.energyKcal) < 1e-8, p.id);
    assert.ok(Math.abs(p.proteinPer100 / 100 * p.basis.volumeMl - p.basis.proteinG) < 1e-8, p.id);
    assert.ok(p.waterPer100 === null || (Number.isFinite(p.waterPer100) && p.waterPer100 >= 0 && p.waterPer100 <= 100));
  }
});

test('Turkish Resource product variants retain exact strength, protein and package identities', () => {
  const protein = productById('resource-protein-tr-200');
  const fibre = productById('resource-20-fibre-tr-190');
  const dense = productById('resource-20-tr-200');
  assert.equal(protein.kcalPerMl, 1.25);
  assert.equal(protein.proteinPer100, 9.4);
  assert.equal(fibre.servingMl, 190);
  assert.equal(fibre.basis.energyKcal, 380);
  assert.equal(fibre.basis.proteinG, 17.1);
  assert.equal(dense.servingMl, 200);
  assert.equal(dense.basis.energyKcal, 400);
  assert.equal(dense.basis.proteinG, 18);
  assert.ok(protein.tube && protein.oral);
});

test('rounded marketing densities do not replace declared US package totals', () => {
  const ensure = productById('ensure-plus-us-237');
  const peptide = productById('kate-peptide15-vanilla-us-325');
  const nepro = productById('nepro-us-rth1000');
  assert.equal(ensure.kcalPerMl * 237, 350);
  assert.equal(ensure.basis.proteinG, 16);
  assert.notEqual(ensure.kcalPerMl, 1.5);
  assert.equal(peptide.kcalPerMl * 325, 500);
  assert.equal(peptide.basis.proteinG, 24);
  assert.notEqual(peptide.kcalPerMl, 1.5);
  assert.equal(nepro.kcalPerMl, 1.77);
  assert.equal(nepro.basis.energyKcal, 1770);
});

test('unknown water and unestablished tube use remain explicit, separate from verified values', () => {
  assert.equal(productById('resource-protein-tr-200').waterPer100, null);
  const glucerna = productById('glucerna-15-us-rth1000');
  assert.equal(glucerna.waterPer100, null);
  assert.equal(glucerna.waterGramsPer100Ml, 75.9);
  assert.equal(productById('jevity-15-us-rth1000').waterPer100, 76);
  assert.equal(productById('osmolite-12-us-rth1000').waterPer100, 82);
  assert.equal(productById('fresubin-2kcal-drink-global-200').tube, false);
  assert.equal(productById('fresubin-2kcal-drink-global-200').oral, true);
});

test('manual mixed-product example reports totals rather than asserting patient suitability', () => {
  const energy = productById('resource-energy-ch-200');
  const protein = productById('resource-protein-tr-200');
  assert.equal(energy.country, 'CH');
  assert.equal(protein.country, 'TR');
  assert.equal(energy.kcalPerMl * 1500 + protein.kcalPerMl * 500, 2890);
  assert.equal(energy.proteinPer100 * 15 + protein.proteinPer100 * 5, 131);
  assert.equal(energy.patientSuitabilityConfirmed, false);
  assert.equal(protein.patientSuitabilityConfirmed, false);
});

test('coverage does not claim all brands or silently fill unverified Turkish Resource Energy', () => {
  assert.equal(COVERAGE.complete, false);
  assert.equal(COVERAGE.allMarketProductsCovered, false);
  assert.equal(COVERAGE.latestWorldwideLabelsGuaranteed, false);
  assert.ok(COVERAGE.pendingCoverage.length);
  assert.ok(COVERAGE.nonCalculable.some(p => p.id === 'resource-energy-tr-pending'));
  assert.equal(productById('resource-energy-tr-pending'), null);
  assert.equal(FORMULAS.some(p => p.name.startsWith('Resource Energy') && p.country === 'TR'), false);
  assert.ok(COVERAGE.summary.en && COVERAGE.summary.tr);
});
