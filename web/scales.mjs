// NutriClinic screening and assessment scales: pure functions on the normalised input and body metrics.
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Gökay Duman
//
// NRS 2002 (nrs2002-2003, espen-screening-2002) · GLIM (glim-2019) · ESPEN 2015 (espen-malnutrition-2015) ·
// AND/ASPEN (aspen-malnutrition-2012) · EWGSOP2 (ewgsop2-2019; female ASM index corrected to <5.5 kg/m²) ·
// EAT-10 (eat10-2008, eat10-tr-2016) · FOIS (fois-2005) · IDDSI (iddsi-2017).
// Thresholds are those of the original publications. A missing input never counts as normal: a result
// stays 'incomplete', or is reported as a lower bound, until the data allow a decision.
import { B } from './text.mjs';

const anyOf = (...v) => (v.some((x) => x === true) ? true : v.some((x) => x === null) ? null : false);
const allOf = (...v) => (v.every((x) => x === true) ? true : v.some((x) => x === false) ? false : null);
// Either measurement decides (EWGSOP2: grip or chair rise; ASM or ASM/height²; gait speed or SPPB).
const eitherKnown = (...v) => (v.includes(true) ? true : v.includes(false) ? false : null);

export const FOIS_TEXT = {
  1: B('Ağızdan hiçbir şey almıyor', 'Nothing by mouth'),
  2: B('Tüple besleniyor; ağızdan çok az ya da düzensiz deneme', 'Tube dependent; minimal or inconsistent oral attempts'),
  3: B('Tüple besleniyor; ağızdan düzenli yiyecek ya da sıvı da alıyor', 'Tube dependent with consistent oral intake of food or liquid'),
  4: B('Tamamen ağızdan, tek kıvamda', 'Total oral intake of a single consistency'),
  5: B('Tamamen ağızdan, birden çok kıvam; özel hazırlık gerekiyor', 'Total oral intake of several consistencies requiring special preparation'),
  6: B('Tamamen ağızdan, özel hazırlık yok; bazı yiyecek ya da sıvılardan kaçınıyor', 'Total oral intake without special preparation, avoiding specific foods or liquids'),
  7: B('Tamamen ağızdan, kısıtlama yok', 'Total oral intake without restrictions'),
};
export const IDDSI_FOOD = {
  3: B('Sıvılaştırılmış', 'Liquidised'), 4: B('Püre', 'Pureed'), 5: B('Kıyılmış ve nemli', 'Minced and moist'),
  6: B('Yumuşak, lokma boyutunda', 'Soft and bite-sized'), 7: B('Normal', 'Regular'),
};
export const IDDSI_DRINK = {
  0: B('İnce', 'Thin'), 1: B('Çok az koyu', 'Slightly thick'), 2: B('Az koyu', 'Mildly thick'),
  3: B('Orta koyu', 'Moderately thick'), 4: B('Çok koyu', 'Extremely thick'),
};

// ---------------------------------------------------------------------------------------------
// Swallowing: the most cautious of the entered findings. Ranking: unsafe < modified < safe.
// FOIS 1–3 tube dependent, 4–6 oral with restrictions, 7 unrestricted (fois-2005); any IDDSI level other
// than regular food with thin drinks means a texture-modified diet (iddsi-2017); impaired alertness and
// unsafe signs during swallowing mean no oral intake until assessed (ueg-esnm-2025).
const SWALLOW_RANK = { unsafe: 0, modified: 1, safe: 2 };
export function swallowStatus(p) {
  const found = [];
  if (p.swallow) found.push({ value: p.swallow, from: 'entered' });
  if (p.fois !== null) found.push({ value: p.fois <= 3 ? 'unsafe' : p.fois <= 6 ? 'modified' : 'safe', from: 'fois' });
  if ((p.iddsiFluid !== null && p.iddsiFluid >= 1) || (p.iddsiFood !== null && p.iddsiFood <= 6)) found.push({ value: 'modified', from: 'iddsi' });
  else if (p.iddsiFluid === 0 && p.iddsiFood === 7) found.push({ value: 'safe', from: 'iddsi' });
  if (p.impairedAlertness === true) found.push({ value: 'unsafe', from: 'alertness' });
  if (p.unsafeSigns === true) found.push({ value: 'unsafe', from: 'signs' });
  if (!found.length) return { value: null, from: null, conflict: false, found };
  const pick = found.reduce((a, b) => (SWALLOW_RANK[b.value] < SWALLOW_RANK[a.value] ? b : a));
  return { value: pick.value, from: pick.from, conflict: new Set(found.map((x) => x.value)).size > 1, found };
}

// ---------------------------------------------------------------------------------------------
// NRS 2002 (nrs2002-2003 Table 1; espen-screening-2002). Total = nutrition (0–3) + disease (0–3) + 1 from
// age 70; ≥3 = at nutritional risk, otherwise rescreen weekly. The nutrition component is calculated from
// the data as a lower bound; a clinician-entered component is used unless the data show a higher one.
export function nrs2002(p, m, swallow = p.swallow) {
  const parts = [];
  let known = 0;
  let open = false;
  const wl = p.weightLossPct;
  const mo = p.lossMonths;
  // Weight loss >5% in 3 months (1), in 2 months (2), in 1 month or >15% in 3 months (3).
  if (wl === null) open = true;
  else if (wl > 5) {
    if (mo === null) open = true;
    else {
      const s = mo <= 1 || (wl > 15 && mo <= 3) ? 3 : mo <= 2 ? 2 : mo <= 3 ? 1 : 0;
      if (s) {
        known = Math.max(known, s);
        parts.push(B((f) => `kilo kaybı %${f(wl, 1)}, ${f(mo)} ayda → ${s}`, (f) => `weight loss ${f(wl, 1)}% in ${f(mo)} months → ${s}`));
      }
    }
  }
  // BMI 18.5–20.5 inclusive (2) or <18.5 (3), each together with an impaired general condition.
  const bmi = m.bmi;
  if (bmi === null) open = true;
  else if (bmi <= 20.5) {
    if (p.nrsImpaired === true) {
      const s = bmi < 18.5 ? 3 : 2;
      known = Math.max(known, s);
      parts.push(B((f) => `BKİ ${f(bmi, 1)} ve genel durum bozuk → ${s}`, (f) => `BMI ${f(bmi, 1)} with impaired general condition → ${s}`));
    } else if (p.nrsImpaired === null) open = true;
  }
  // Intake in the preceding week as a share of requirements: below 75% (1), 25–60% (2), 0–25% (3).
  // A week or more of little or no intake counts as 0–25%; otherwise the oral intake estimate is used.
  let intake = null;
  if (p.lowIntakeDays !== null && p.lowIntakeDays >= 7) intake = 0;
  else if (p.oralIntakePct !== null && (swallow === 'safe' || swallow === 'modified')) intake = p.oralIntakePct;
  if (intake === null) open = true;
  else {
    const s = intake <= 25 ? 3 : intake <= 60 ? 2 : intake < 75 ? 1 : 0;
    if (s) {
      known = Math.max(known, s);
      parts.push(p.lowIntakeDays !== null && p.lowIntakeDays >= 7
        ? B((f) => `${f(p.lowIntakeDays)} gündür çok az ya da hiç alım → ${s}`, (f) => `${f(p.lowIntakeDays)} days of little or no intake → ${s}`)
        : B((f) => `alım gereksinimin %${f(intake)}’i → ${s}`, (f) => `intake ${f(intake)}% of requirements → ${s}`));
    }
  }
  // Oedema can hide weight loss and raise the BMI: below 3 the component is only a lower bound.
  if (p.oedema === true && known < 3) open = true;
  const warnings = [];
  let nutrition = known;
  let nutritionFrom = 'data';
  if (p.nrsNutrition !== null) {
    open = false;
    if (p.nrsNutrition >= known) { nutrition = p.nrsNutrition; nutritionFrom = 'entered'; }
    else warnings.push(B(`NRS 2002 beslenme puanı ${p.nrsNutrition} girildi; girilen veriler en az ${known} gösteriyor, ${known} kullanıldı.`, `The NRS 2002 nutrition score was entered as ${p.nrsNutrition}, but the data show at least ${known}; ${known} is used.`));
  }
  const disease = p.nrsDisease;
  const agePoint = p.age !== null && p.age >= 70 ? 1 : 0;
  const score = nutrition + (disease ?? 0) + agePoint;
  const exact = !open && disease !== null && p.age !== null;
  const status = score >= 3 ? 'risk' : exact ? 'no_risk' : 'incomplete';
  return { id: 'nrs2002', status, score, exact, nutrition, nutritionFrom, nutritionOpen: open, disease, agePoint, ageKnown: p.age !== null, parts, warnings };
}

// ---------------------------------------------------------------------------------------------
// GLIM (glim-2019): at least one phenotypic and one etiologic criterion. Phenotypic grades: 1 = stage 1
// (moderate), 2 = stage 2 (severe); null = unknown. Grades found with incomplete data are lower bounds.
export function glim(p, m, lowMassMeasured = null) {
  const oed = p.oedema === true;
  const age = p.age;
  const wl = p.weightLossPct;
  const mo = p.lossMonths;
  // Weight loss: within 6 months >5% (1) or >10% (2); beyond 6 months >10% (1) or >20% (2).
  let wlG = null;
  let wlExact = false;
  if (wl !== null) {
    if (wl <= 5) { wlG = 0; wlExact = true; }
    else if (mo !== null) { wlG = mo <= 6 ? (wl > 10 ? 2 : 1) : (wl > 20 ? 2 : wl > 10 ? 1 : 0); wlExact = true; }
    else if (wl > 20) { wlG = 2; wlExact = true; }
    else if (wl > 10) wlG = 1; // severe if within 6 months
  }
  // BMI: <20 (1) or <18.5 (2) below 70 years; <22 (1) or <20 (2) from 70 years.
  let bmiG = null;
  let bmiExact = false;
  const bmi = m.bmi;
  if (bmi !== null) {
    if (age !== null) {
      const old = age >= 70;
      bmiG = bmi < (old ? 20 : 18.5) ? 2 : bmi < (old ? 22 : 20) ? 1 : 0;
      bmiExact = true;
    } else if (bmi < 18.5) { bmiG = 2; bmiExact = true; }
    else if (bmi < 20) bmiG = 1; // severe from 70 years
    else if (bmi >= 22) { bmiG = 0; bmiExact = true; }
  }
  // Muscle mass: clinician grading, else the measured appendicular mass (EWGSOP2 cut-offs, ungraded).
  let muscleG = null;
  let muscleExact = false;
  let muscleFrom = null;
  if (p.glimMuscle) { muscleG = { normal: 0, moderate: 1, severe: 2 }[p.glimMuscle]; muscleExact = true; muscleFrom = 'entered'; }
  else if (lowMassMeasured === true) { muscleG = 1; muscleFrom = 'measured'; }
  else if (lowMassMeasured === false) { muscleG = 0; muscleExact = true; muscleFrom = 'measured'; }
  // Oedema hides weight loss and raises the BMI: "none" is not reassuring and the grades are lower bounds.
  if (oed) {
    if (wlG === 0) wlG = null; else wlExact = false;
    if (bmiG === 0) bmiG = null; else bmiExact = false;
  }
  const grades = [wlG, bmiG, muscleG];
  const phenotype = grades.some((g) => g !== null && g >= 1) ? true : grades.every((g) => g === 0) ? false : null;
  const stage = phenotype ? Math.max(...grades.filter((g) => g !== null)) : null;
  const stageExact = stage === 2 || [[wlG, wlExact], [bmiG, bmiExact], [muscleG, muscleExact]].every(([g, e]) => g !== null && e);
  // Etiology: reduced intake or assimilation (≤50% for >1 week, any reduction for >2 weeks, chronic GI
  // malabsorption); inflammation from acute disease or injury, or chronic disease.
  const intakeData = p.lowIntakeDays !== null && p.lowIntakeDays > 7 ? true : null;
  const intake = p.glimIntake ?? intakeData;
  const inflammationData = p.setting === 'icu' || (p.burnsTbsa ?? 0) > 0 || p.trauma === true ? true : null;
  const inflammation = p.glimInflammation ?? inflammationData;
  const etiology = anyOf(intake, inflammation);
  const status = phenotype === true && etiology === true ? 'met' : phenotype === false || etiology === false ? 'not_met' : 'incomplete';
  return {
    id: 'glim', status, stage: status === 'met' ? stage : null, stageExact, severe: status === 'met' && stage === 2, phenotype, etiology,
    criteria: {
      weightLoss: wlG, bmi: bmiG, muscle: muscleG, muscleFrom,
      intake, intakeFrom: p.glimIntake !== null ? 'entered' : intake ? 'data' : null,
      inflammation, inflammationFrom: p.glimInflammation !== null ? 'entered' : inflammation ? 'data' : null,
    },
  };
}

// ---------------------------------------------------------------------------------------------
// ESPEN 2015 (espen-malnutrition-2015), after positive screening: BMI <18.5, or unintentional weight loss
// (>10% at any time, or >5% over 3 months) together with an age-specific low BMI or a sex-specific low FFMI.
export function espen2015(p, m, nrs) {
  const unreliable = (x) => (p.oedema === true && x === false ? null : x);
  const bmi = m.bmi;
  const ffmi = p.ffmKg !== null && p.heightCm ? p.ffmKg / (p.heightCm / 100) ** 2 : null;
  const lowBmi = unreliable(bmi === null ? null : bmi < 18.5);
  const lowBmiAge = unreliable(bmi === null || p.age === null ? null : bmi < (p.age >= 70 ? 22 : 20));
  const lowFfmi = unreliable(ffmi === null || !p.sex ? null : ffmi < (p.sex === 'male' ? 17 : 15));
  const wl = p.weightLossPct;
  const mo = p.lossMonths;
  const loss = unreliable(wl === null ? null : wl > 10 ? true : wl <= 5 ? false : mo === null ? null : mo <= 3);
  const met = anyOf(lowBmi, allOf(loss, anyOf(lowBmiAge, lowFfmi)));
  const screen = nrs.status === 'risk' ? true : nrs.status === 'no_risk' ? false : null;
  // The diagnosis is made only after a positive screen: with an incomplete screen the result stays incomplete.
  const status = screen === false ? 'not_applicable' : screen === null ? 'incomplete' : met === true ? 'met' : met === false ? 'not_met' : 'incomplete';
  return { id: 'espen2015', status, screen, criteriaMet: met, option: lowBmi === true ? 1 : met === true ? 2 : null, ffmi, values: { lowBmi, lowBmiAge, lowFfmi, loss } };
}

// ---------------------------------------------------------------------------------------------
// AND/ASPEN (aspen-malnutrition-2012): at least two of six clinician-confirmed characteristics in a
// stated context. Grip strength is not counted in the ICU. No automatic severity.
const ASPEN_KEYS = ['aspenIntake', 'aspenWeight', 'aspenMuscle', 'aspenFat', 'aspenFluid', 'aspenGrip'];
export function aspen(p) {
  const keys = ASPEN_KEYS.filter((k) => !(k === 'aspenGrip' && p.setting === 'icu'));
  const count = keys.filter((k) => p[k] === true).length;
  const unknown = keys.filter((k) => p[k] === null).length;
  const entered = p.aspenContext !== null || keys.some((k) => p[k] !== null);
  const status = !p.aspenContext ? 'incomplete' : count >= 2 ? 'met' : unknown ? 'incomplete' : 'not_met';
  return { id: 'aspen', status, entered, context: p.aspenContext, count, unknown, total: keys.length, gripExcluded: p.setting === 'icu' };
}

// ---------------------------------------------------------------------------------------------
// EWGSOP2 (ewgsop2-2019): low strength (grip <27 kg men, <16 kg women; five chair rises >15 s) = probable
// sarcopenia; with low muscle quantity (ASM <20/<15 kg or ASM/height² <7.0/<5.5 kg/m²) = sarcopenia; with
// low performance (gait speed ≤0.8 m/s or SPPB ≤8) = severe. In the ICU, or when acute illness, neurological
// weakness, pain or sedation confound the tests, the result is for review only.
export function ewgsop2(p) {
  const male = p.sex === 'male';
  const sexKnown = p.sex !== null;
  const lowGrip = p.gripKg === null || !sexKnown ? null : p.gripKg < (male ? 27 : 16);
  const lowChair = p.chairRiseS === null ? null : p.chairRiseS > 15;
  const lowStrength = eitherKnown(lowGrip, lowChair);
  const asmIndex = p.asmKg !== null && p.heightCm ? p.asmKg / (p.heightCm / 100) ** 2 : null;
  const massReliable = p.oedema !== true && sexKnown;
  const lowAbs = massReliable && p.asmKg !== null ? p.asmKg < (male ? 20 : 15) : null;
  const lowIdx = massReliable && asmIndex !== null ? asmIndex < (male ? 7.0 : 5.5) : null;
  const lowMass = eitherKnown(lowAbs, lowIdx);
  const lowGait = p.gaitSpeed === null ? null : p.gaitSpeed <= 0.8;
  const lowSppb = p.sppb === null ? null : p.sppb <= 8;
  const lowPerformance = eitherKnown(lowGait, lowSppb);
  const entered = [p.gripKg, p.chairRiseS, p.asmKg, p.gaitSpeed, p.sppb].some((x) => x !== null);
  const confounded = p.setting === 'icu' || p.sarcopeniaConfounded === true;
  let status = 'incomplete';
  if (entered && confounded) status = 'review';
  else if (lowStrength === false) status = 'not_met';
  else if (lowStrength === true) status = lowMass === true ? 'met' : lowMass === false ? 'review' : 'probable';
  return {
    id: 'ewgsop2', status, entered, confounded, severe: status === 'met' && lowPerformance === true,
    lowStrength, lowMass, lowPerformance, asmIndex, sexKnown, massReliable,
    values: { lowGrip, lowChair, lowAbs, lowIdx, lowGait, lowSppb },
  };
}

// ---------------------------------------------------------------------------------------------
// EAT-10 (eat10-2008): total ≥3 is abnormal. A symptom score: a low score does not exclude silent
// aspiration and does not clear oral feeding; self-report is unreliable with impaired alertness.
export function eat10(p) {
  if (p.eat10 === null) return { id: 'eat10', status: 'incomplete', score: null, entered: false, abnormal: null, unreliable: false };
  const unreliable = p.impairedAlertness === true;
  const abnormal = p.eat10 >= 3;
  return { id: 'eat10', status: unreliable ? 'review' : abnormal ? 'met' : 'not_met', score: p.eat10, entered: true, abnormal, unreliable };
}

export function evaluateScales(p, m, swallow) {
  const sarcopenia = ewgsop2(p);
  const nrs = nrs2002(p, m, swallow?.value ?? p.swallow);
  const glimResult = glim(p, m, sarcopenia.lowMass);
  const espen = espen2015(p, m, nrs);
  const aspenResult = aspen(p);
  return {
    nrs,
    glim: glimResult,
    espen2015: espen,
    aspen: aspenResult,
    // Malnutrition by any of the diagnostic sets (GLIM, ESPEN 2015, AND/ASPEN).
    malnutrition: glimResult.status === 'met' || espen.status === 'met' || aspenResult.status === 'met',
    ewgsop2: sarcopenia,
    eat10: eat10(p),
    fois: p.fois,
    iddsi: { food: p.iddsiFood, fluid: p.iddsiFluid },
    swallow,
    assessment: p.swallowAssessment,
  };
}
