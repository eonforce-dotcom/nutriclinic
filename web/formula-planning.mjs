// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
// Pure arithmetic over caller-supplied, source-verified exact-SKU label facts.
// The caller derives eligibility and phase goals from the clinical assessment.
// This module never derives a clinical target, increases its protein ceiling,
// authorizes a feeding route, or instructs physical mixing of products.

export const FORMULA_PLANNING_VERSION = '1.0.0';
const EPS = 1e-8;
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const finite = v => typeof v === 'number' && Number.isFinite(v);
const nonnegative = v => finite(v) && v >= 0;
const identity = v => typeof v === 'string' && v.trim() ? v.trim()
  : typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? String(v) : null;
const issue = (code, field) => ({code, field});
const floor10 = v => Math.floor(Math.max(0, v) / 10 + 1e-10) * 10;
const exceeds = (value, limit) => value > limit + EPS * Math.max(1, Math.abs(limit));

function readTargets(value) {
  const targets = object(value) ? value : {};
  const errors = [];
  for (const key of ['energyKcal', 'proteinG', 'otherEnergyKcal', 'otherProteinG', 'maxProteinG']) {
    if (!nonnegative(targets[key])) errors.push(issue('invalid-target', `targets.${key}`));
  }
  const maxFormulaMl = targets.maxFormulaMl === undefined ? null : targets.maxFormulaMl;
  if (maxFormulaMl !== null && !nonnegative(maxFormulaMl)) errors.push(issue('invalid-target', 'targets.maxFormulaMl'));
  if (!errors.length && targets.maxProteinG < targets.proteinG) errors.push(issue('protein-goal-above-ceiling', 'targets.maxProteinG'));
  return {targets:{energyKcal:targets.energyKcal, proteinG:targets.proteinG,
    otherEnergyKcal:targets.otherEnergyKcal, otherProteinG:targets.otherProteinG,
    maxProteinG:targets.maxProteinG, maxFormulaMl}, errors};
}

function readSafety(value) {
  const safety = object(value) ? value : {};
  const errors = [], warnings = [];
  // Eligibility is derived by the parent, never a blanket checkbox. Per the
  // product policy, unknown clinical facts retain a conditional calculation;
  // its assumptions must accompany the number. A known restriction differs
  // from a missing fact and still prevents an automatic product selection.
  if (safety.clinicianEligibilityConfirmed === false) errors.push(issue('eligibility-not-established', 'safety.clinicianEligibilityConfirmed'));
  else if (safety.clinicianEligibilityConfirmed === undefined || safety.clinicianEligibilityConfirmed === null)
    warnings.push(issue('conditional-eligibility-assumption', 'safety.clinicianEligibilityConfirmed'));
  else if (safety.clinicianEligibilityConfirmed !== true) errors.push(issue('invalid-safety-value', 'safety.clinicianEligibilityConfirmed'));
  if (!['tube', 'oral'].includes(safety.route)) errors.push(issue('route-not-established', 'safety.route'));
  for (const field of ['refeedingRisk', 'shock', 'intolerance', 'contraindication']) {
    if (field === 'refeedingRisk' && safety[field] === true && safety.allowManagedRefeeding === true)
      warnings.push(issue('managed-refeeding-phase-targets', 'safety.refeedingRisk'));
    else if (safety[field] === true) errors.push(issue('safety-restriction', `safety.${field}`));
    else if (safety[field] === undefined || safety[field] === null) warnings.push(issue('conditional-safety-assumption', `safety.${field}`));
    else if (safety[field] !== false) errors.push(issue('invalid-safety-value', `safety.${field}`));
  }
  if (Array.isArray(safety.assumptions)) for (const detail of safety.assumptions) {
    if (typeof detail === 'string' && detail.trim()) warnings.push({...issue('parent-conditional-assumption', 'safety.assumptions'),detail});
  }
  return {safety, errors, warnings};
}

function readProduct(value, field) {
  const errors = [];
  if (!object(value)) return {product:null, id:null, errors:[issue('missing-product', field)]};
  const id = identity(value.id ?? value.sku);
  if (id === null) errors.push(issue('missing-exact-sku', `${field}.id`));
  if (!finite(value.kcalPerMl) || value.kcalPerMl <= 0) errors.push(issue('invalid-product-energy', `${field}.kcalPerMl`));
  if (!nonnegative(value.proteinPer100)) errors.push(issue('invalid-product-protein', `${field}.proteinPer100`));
  if (finite(value.kcalPerMl) && finite(value.proteinPer100) && value.proteinPer100*4 > value.kcalPerMl*100+Math.max(1,value.kcalPerMl*5)) errors.push(issue('incompatible-protein-energy-label', field));
  // Missing water remains unknown. It is never borrowed from a generic class.
  const water = value.waterPer100 === undefined ? null : value.waterPer100;
  if (water !== null && (!nonnegative(water) || water > 100)) errors.push(issue('invalid-product-water', `${field}.waterPer100`));
  if (!['enteral', 'oral', 'both'].includes(value.route)) errors.push(issue('invalid-product-route', `${field}.route`));
  if (typeof value.tube !== 'boolean') errors.push(issue('unknown-product-tube-suitability', `${field}.tube`));
  if (typeof value.complete !== 'boolean') errors.push(issue('unknown-product-completeness', `${field}.complete`));
  return {id, product:{...value, id, waterPer100:water}, errors};
}

function suitability(product, route, field) {
  const errors = [];
  if (!product.complete) errors.push(issue('not-a-complete-formula', `${field}.complete`));
  if (route === 'tube' && (!product.tube || product.route === 'oral')) errors.push(issue('product-not-suitable-for-tube', `${field}.route`));
  if (route === 'oral' && product.route === 'enteral') errors.push(issue('product-not-suitable-for-oral', `${field}.route`));
  return errors;
}

/**
 * rows:[{product:{id,kcalPerMl,proteinPer100,waterPer100:null|number,
 * route:'enteral'|'oral'|'both',tube:boolean,complete:boolean,...provenance},volumeMl}]
 * targets:{energyKcal,proteinG,otherEnergyKcal,otherProteinG,maxProteinG,maxFormulaMl:null|number}
 * safety:{clinicianEligibilityConfirmed,route:'tube'|'oral',refeedingRisk,shock,intolerance,contraindication,
 *         allowManagedRefeeding?:boolean,assumptions?:string[]}
 *
 * Numeric inputs must be actual finite numbers. Values are not coerced and
 * duplicate exact-SKU rows are rejected to avoid counting the same entry twice.
 * Arithmetic validity is separate from suitability, clinical eligibility and
 * target/volume constraints. Totals remain available for documenting a manual
 * arithmetic review even when the result must not be used as an automatic plan.
 * Missing safety facts produce conditional results with their warning codes.
 * Known refeeding risk is allowed only if the caller explicitly confirms that
 * the supplied phase goals already use the risk-specific protocol/cap. This
 * comparison of formula composition does not authorize starting/advancing EN.
 */
export function evaluateFormulaRecipe(input = {}) {
  const data = object(input) ? input : {};
  const {targets, errors:targetErrors} = readTargets(data.targets);
  const {safety, errors:safetyErrors, warnings:safetyWarnings} = readSafety(data.safety);
  const arithmeticErrors = [], productErrors = [], rows = [], ids = new Set();
  if (!Array.isArray(data.rows) || data.rows.length === 0) arithmeticErrors.push(issue('empty-recipe', 'rows'));
  if (Array.isArray(data.rows)) {
    for (let i = 0; i < data.rows.length; i += 1) {
      const row = data.rows[i], field = `rows.${i}`;
      if (!object(row)) { arithmeticErrors.push(issue('invalid-recipe-row', field)); continue; }
      const parsed = readProduct(row.product, `${field}.product`);
      arithmeticErrors.push(...parsed.errors);
      if (!nonnegative(row.volumeMl) || row.volumeMl > 10000) arithmeticErrors.push(issue('invalid-volume', `${field}.volumeMl`));
      if (parsed.id !== null && ids.has(parsed.id)) arithmeticErrors.push(issue('duplicate-product', `${field}.product.id`));
      if (parsed.id !== null) ids.add(parsed.id);
      if (parsed.errors.length || !nonnegative(row.volumeMl) || row.volumeMl > 10000) continue;
      const p = parsed.product, volume = row.volumeMl;
      productErrors.push(...suitability(p, safety.route, `${field}.product`));
      rows.push({productId:parsed.id, product:p, volumeMl:volume,
        energyKcal:volume * p.kcalPerMl, proteinG:volume * p.proteinPer100 / 100,
        waterMl:volume === 0 ? 0 : p.waterPer100 === null ? null : volume * p.waterPer100 / 100,
        provenance:p.provenance ?? p.source ?? null});
    }
  }
  const arithmeticValid = arithmeticErrors.length === 0;
  let totals = null, gaps = null, excess = null;
  const constraints = [];
  if (arithmeticValid) {
    const sum = key => rows.reduce((n, r) => n + r[key], 0);
    totals = {formulaVolumeMl:sum('volumeMl'), formulaEnergyKcal:sum('energyKcal'), formulaProteinG:sum('proteinG'),
      formulaWaterMl:rows.some(r => r.waterMl === null) ? null : sum('waterMl'), energyKcal:null, proteinG:null};
    if (!targetErrors.length) {
      totals.energyKcal = totals.formulaEnergyKcal + targets.otherEnergyKcal;
      totals.proteinG = totals.formulaProteinG + targets.otherProteinG;
      gaps = {energyKcal:Math.max(0, targets.energyKcal - totals.energyKcal), proteinG:Math.max(0, targets.proteinG - totals.proteinG)};
      excess = {energyKcal:Math.max(0, totals.energyKcal - targets.energyKcal), proteinG:Math.max(0, totals.proteinG - targets.maxProteinG),
        volumeMl:targets.maxFormulaMl === null ? null : Math.max(0, totals.formulaVolumeMl - targets.maxFormulaMl)};
      if (exceeds(totals.energyKcal, targets.energyKcal)) constraints.push(issue('phase-energy-ceiling-exceeded', 'totals.energyKcal'));
      if (exceeds(totals.proteinG, targets.maxProteinG)) constraints.push(issue('protein-ceiling-exceeded', 'totals.proteinG'));
      if (targets.maxFormulaMl !== null && exceeds(totals.formulaVolumeMl, targets.maxFormulaMl)) constraints.push(issue('formula-volume-ceiling-exceeded', 'totals.formulaVolumeMl'));
    }
    if (![totals.formulaVolumeMl, totals.formulaEnergyKcal, totals.formulaProteinG].every(finite)
      || (totals.formulaWaterMl !== null && !finite(totals.formulaWaterMl))
      || (totals.energyKcal !== null && !finite(totals.energyKcal)) || (totals.proteinG !== null && !finite(totals.proteinG))) {
      arithmeticErrors.push(issue('arithmetic-overflow', 'totals')); totals = null; gaps = null; excess = null;
    }
  }
  const allErrors = [...arithmeticErrors, ...targetErrors, ...constraints, ...safetyErrors, ...productErrors];
  return {version:FORMULA_PLANNING_VERSION, valid:allErrors.length === 0,
    arithmeticValid:arithmeticErrors.length === 0, targetInputValid:targetErrors.length === 0,
    withinConstraints:arithmeticErrors.length === 0 && targetErrors.length === 0 && constraints.length === 0,
    automationAllowed:allErrors.length === 0, errors:allErrors, arithmeticErrors, safetyErrors:[...safetyErrors,...productErrors],
    constraintErrors:constraints, targets, rows, totals, gaps, excess,
    conditional:safetyWarnings.length > 0,
    warnings:[...safetyWarnings,...(totals?.formulaWaterMl === null ? [issue('formula-water-unknown', 'totals.formulaWaterMl')] : [])],
    administration:'Daily amounts of separately administered products; physical mixing compatibility is not established.'};
}

/**
 * Rank complete exact-SKU formulas using only the explicit supplied phase goals.
 * Single products use the largest volume within energy/protein/volume ceilings.
 * Pairs solve the two simultaneous energy/protein equations, then round each
 * volume DOWN to10mL and re-evaluate every ceiling. Negative/singular solutions
 * are excluded. The score measures normalized remaining energy+protein gaps;
 * it is not a comparative efficacy score or a universal best-brand claim.
 */
export function suggestFormulaPlans(input = {}) {
  const data = object(input) ? input : {};
  const {targets, errors:targetErrors} = readTargets(data.targets);
  const {safety, errors:safetyErrors, warnings:safetyWarnings} = readSafety(data.safety);
  const errors = [...targetErrors, ...safetyErrors], excluded = [], candidates = [];
  if (!Array.isArray(data.products) || data.products.length === 0) errors.push(issue('empty-product-catalog', 'products'));
  const maxResults = data.maxResults === undefined ? 5 : data.maxResults;
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 20) errors.push(issue('invalid-result-limit', 'maxResults'));
  const criteria = {targets, safetyKnownEligible:safetyErrors.length === 0 && safetyWarnings.length === 0,
    conditional:safetyWarnings.length > 0, conditions:safetyWarnings, volumeStepMl:10,
    ranking:'Smallest sum of normalized remaining energy and protein gaps; ties favour a single product, then lower total formula volume, then stable exact-SKU order.',
    scope:'Nutritional fit to the supplied phase goals and label facts, not clinical superiority. Products are administered separately.'};
  const fail = () => ({version:FORMULA_PLANNING_VERSION, automationAllowed:false, conditional:safetyWarnings.length > 0,
    warnings:safetyWarnings, errors, criteria, candidates:[], selectedDefault:null, excluded});
  if (errors.length) return fail();
  if (exceeds(targets.otherEnergyKcal, targets.energyKcal)) errors.push(issue('other-energy-already-exceeds-ceiling', 'targets.otherEnergyKcal'));
  if (exceeds(targets.otherProteinG, targets.maxProteinG)) errors.push(issue('other-protein-already-exceeds-ceiling', 'targets.otherProteinG'));
  if (errors.length) return fail();
  const energyNeed = Math.max(0, targets.energyKcal - targets.otherEnergyKcal);
  const proteinNeed = Math.max(0, targets.proteinG - targets.otherProteinG);
  const proteinBudget = Math.max(0, targets.maxProteinG - targets.otherProteinG);
  const ids = new Set(), products = [];
  for (let i = 0; i < data.products.length; i += 1) {
    const {product, id, errors:bad} = readProduct(data.products[i], `products.${i}`);
    const reasons = [...bad];
    if (id !== null && ids.has(id)) reasons.push(issue('duplicate-product', `products.${i}.id`));
    if (id !== null) ids.add(id);
    if (!bad.length) reasons.push(...suitability(product, safety.route, `products.${i}`));
    if (reasons.length) excluded.push({productId:id, reasons}); else products.push(product);
  }
  // Duplicate catalog identities are ambiguous. They cannot silently become two
  // ingredients or count as two independent alternatives.
  if (excluded.some(p => p.reasons.some(r => r.code === 'duplicate-product'))) {
    errors.push(issue('duplicate-product-catalog', 'products')); return fail();
  }
  products.sort((a,b) => a.id.localeCompare(b.id, 'en'));
  const addCandidate = (type, recipe, exactSolution = null) => {
    const rows = recipe.filter(r => r.volumeMl > 0);
    if (!rows.length || rows.some(r => r.volumeMl > 10000)) return;
    const result = evaluateFormulaRecipe({rows, targets, safety});
    if (!result.automationAllowed) return;
    const key = result.rows.map(r => `${r.productId}:${r.volumeMl}`).join('|');
    if (candidates.some(c => c.key === key)) return;
    const score = (energyNeed ? result.gaps.energyKcal / energyNeed : 0) + (proteinNeed ? result.gaps.proteinG / proteinNeed : 0);
    candidates.push({type:rows.length === 1 ? 'single' : type, key, score, exactSolution,
      rows:result.rows, totals:result.totals, gaps:result.gaps, warnings:result.warnings, conditional:result.conditional, automationAllowed:true});
  };
  for (const p of products) {
    const pPerMl = p.proteinPer100 / 100;
    const limit = Math.min(energyNeed / p.kcalPerMl, pPerMl > 0 ? proteinBudget / pPerMl : Infinity,
      targets.maxFormulaMl ?? Infinity, 10000);
    addCandidate('single', [{product:p,volumeMl:floor10(limit)}]);
  }
  for (let i = 0; i < products.length; i += 1) for (let j = i + 1; j < products.length; j += 1) {
    const a = products[i], b = products[j], pa = a.proteinPer100 / 100, pb = b.proteinPer100 / 100;
    if (a.market && b.market && a.market !== b.market) continue; // compare international alternatives; do not silently mix country labels
    const det = a.kcalPerMl * pb - b.kcalPerMl * pa;
    const scale = Math.max(Math.abs(a.kcalPerMl * pb), Math.abs(b.kcalPerMl * pa));
    if (scale === 0 || Math.abs(det) <= 1e-10 * scale) { excluded.push({productIds:[a.id,b.id], reasons:[issue('singular-pair', 'pair')]}); continue; }
    const va = (energyNeed * pb - b.kcalPerMl * proteinNeed) / det;
    const vb = (a.kcalPerMl * proteinNeed - energyNeed * pa) / det;
    if (!finite(va) || !finite(vb) || va < -EPS || vb < -EPS) { excluded.push({productIds:[a.id,b.id], reasons:[issue('negative-or-nonfinite-pair-solution', 'pair')]}); continue; }
    addCandidate('pair', [{product:a,volumeMl:floor10(va)}, {product:b,volumeMl:floor10(vb)}], {productIds:[a.id,b.id], volumeMl:[Math.max(0,va),Math.max(0,vb)]});
  }
  candidates.sort((a,b) => Math.abs(a.score-b.score) > 1e-12 ? a.score-b.score
    : a.rows.length-b.rows.length || a.totals.formulaVolumeMl-b.totals.formulaVolumeMl || a.key.localeCompare(b.key,'en'));
  const selected = candidates.slice(0,maxResults);
  return {version:FORMULA_PLANNING_VERSION, automationAllowed:true, conditional:safetyWarnings.length > 0,
    warnings:safetyWarnings, errors:[], criteria,
    candidates:selected, selectedDefault:selected[0] ?? null, excluded,
    noCandidateReason:selected.length ? null : energyNeed === 0 ? 'no-formula-energy-budget' : 'no-feasible-rounded-complete-formula'};
}
