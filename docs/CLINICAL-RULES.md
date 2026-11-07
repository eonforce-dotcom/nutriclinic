# NutriClinic staged recommender — clinical rules

Version 1.9.1 · rules dated 2026-11-07 · Dr. Gökay Duman (Neurology)

NutriClinic supports clinical decisions and does not replace them. Every recommendation is reviewed at the bedside
together with its inputs and sources.

## What the tool answers

From whatever data are entered, NutriClinic gives:

- the feeding route;
- the formula class by content (no brands);
- the daily amount, with the pump rate or the number and size of feeds;
- protein-module and powder grams;
- the supplements that are indicated, with calculated doses.

It also gives a day-by-day progression table and the monitoring to do.

It never stops because data are missing. Instead it uses the most cautious documented assumption, says which one it
used, and lists the missing data, ordered by how much each would change the answer. While a field is empty, the
interface shows a short coloured sentence saying what entering it would add. Once data are entered, each assumption
is replaced by the entered value.

The calculation is blocked in three cases: an invalid (out-of-range) value, age under 18, and pregnancy. An invalid
value is shown under its own field with the accepted range; "Next" and "Show recommendation" stay on the card and go
to the first wrong field. The result page lists any remaining invalid field with a button that opens it. An invalid
product-label value is shown at the label field and is not used. Patient data never leave the page: nothing is
stored, logged or sent. A case can be saved to and opened from a JSON file on the device (only plain values with
simple keys are read back); the day-by-day table can be downloaded as CSV; the printed report opens every section and
adds the date, version, intended use and a summary of the entered values, product label included. Only case files
of format version 1 with a values object are opened; the care setting is always ICU or ward. Part 4a was audited
by Codex (GPT-6.1 Sol, high): 7 findings, all fixed.

## Sources

Doses and recommendation numbers were read from the official full texts. PMIDs, titles, authors and issues were
checked with NCBI E-utilities on 2026-11-07. The rules were audited twice by an independent model (Gemini, through
Antigravity), and the scales of version 1.1.0 once more (8 findings: 6 fixed; 2 declined because the ICFSR source is
already registered through its note and the ward protein target is already 1.2 g/kg). Each finding was checked against
the code and the full texts before it was fixed or declined.

| Id | Source | PMID |
|---|---|---|
| ESPEN-ICU-2023 | Singer P, et al. ESPEN practical and partially revised guideline: Clinical nutrition in the ICU. Clin Nutr 2023;42:1671-1689 | 37517372 |
| ESPEN-MN-2022 | Berger MM, et al. ESPEN micronutrient guideline. Clin Nutr 2022;41:1357-1424 | 35365361 |
| ESPEN-KIDNEY-2024 | Sabatino A, et al. ESPEN practical guideline on clinical nutrition in hospitalized patients with acute or chronic kidney disease. Clin Nutr 2024;43:2238-2254 | 39178492 |
| ESPEN-POLY-2024 | Wunderle C, et al. ESPEN practical guideline: Nutritional support for polymorbid medical inpatients. Clin Nutr 2024;43:674-691 | 38309229 |
| ESPEN-GER-2022 | Volkert D, et al. ESPEN practical guideline: Clinical nutrition and hydration in geriatrics. Clin Nutr 2022;41:958-989 | 35306388 |
| ESPEN-HEN-2022 | Bischoff SC, et al. ESPEN practical guideline: Home enteral nutrition. Clin Nutr 2022;41:468-488 | 35007816 |
| ESPEN-NEURO-2018 | Burgos R, et al. ESPEN guideline clinical nutrition in neurology. Clin Nutr 2018;37:354-396 | 29274834 |
| NICE-CG32 | NICE. Nutrition support for adults (CG32), 2006, updated 2017 | official text |
| ARDSNET-2000 | Brower RG, et al. N Engl J Med 2000;342:1301-1308 (predicted body weight) | 10793162 |
| RE-ENERGIZE | Heyland DK, et al. N Engl J Med 2022;387:1001-1010 | 36082909 |
| VIOLET | Ginde AA, et al. N Engl J Med 2019;381:2529-2540 | 31826336 |
| EFFORT Protein | Heyland DK, et al. Lancet 2023;401:568-576 | 36708732 |
| PRECISe | Bels JLM, et al. Lancet 2024;404:659-669 | 39153816 |
| TARGET Protein | Summers MJ, et al. JAMA 2025;334:319-328 | 40495743 |
| NRS-2002 | Kondrup J, et al. Nutritional risk screening (NRS 2002). Clin Nutr 2003;22:321-336 | 12765673 |
| ESPEN-SCREEN-2002 | Kondrup J, et al. ESPEN guidelines for nutrition screening 2002. Clin Nutr 2003;22:415-421 | 12880610 |
| GLIM-2019 | Cederholm T, et al. GLIM criteria for the diagnosis of malnutrition. Clin Nutr 2019;38:1-9 | 30181091 |
| ESPEN-MALN-2015 | Cederholm T, et al. Diagnostic criteria for malnutrition — an ESPEN consensus statement. Clin Nutr 2015;34:335-340 | 25799486 |
| AND-ASPEN-2012 | White JV, et al. J Acad Nutr Diet 2012;112:730-738 | 22709779 |
| EWGSOP2 | Cruz-Jentoft AJ, et al. Sarcopenia: revised European consensus. Age Ageing 2019;48:16-31; correction 48:601 (PMID 31081853) | 30312372 |
| ICFSR-2018 | Dent E, et al. International clinical practice guidelines for sarcopenia. J Nutr Health Aging 2018;22:1148-1161 | 30498820 |
| EAT-10 | Belafsky PC, et al. Ann Otol Rhinol Laryngol 2008;117:919-924; Turkish form: Demir N, et al. Dysphagia 2016;31:644-649 (PMID 27405421) | 19140539 |
| FOIS | Crary MA, et al. Arch Phys Med Rehabil 2005;86:1516-1520 | 16084801 |
| IDDSI | Cichero JAY, et al. The IDDSI framework. Dysphagia 2017;32:293-314 | 27913916 |
| NLR-2001 | Zahorec R. Ratio of neutrophil to lymphocyte counts. Bratisl Lek Listy 2001;102:5-14 | 11723675 |
| PNI-1984 | Onodera T, et al. Prognostic nutritional index. Nihon Geka Gakkai Zasshi 1984;85:1001-1005 | 6438478 |
| UCR-2019 | Haines RW, et al. Elevated urea-to-creatinine ratio after major trauma. Intensive Care Med 2019;45:1718-1731 | 31531715 |
| UCR-CRRT-2025 | Markl-Le Levé A, et al. The urea-creatinine ratio is affected by CRRT. Diagnostics (Basel) 2025;15:1408 | 40506980 |
| SOFA-2-2025 | Ranzani OT, et al. Development and validation of the SOFA-2 score. JAMA 2025;334:2090-2103 | 41159833 |
| SAPS-II-1993 | Le Gall JR, et al. A new Simplified Acute Physiology Score (SAPS II). JAMA 1993;270:2957-2963 | 8254858 |
| UEG-ESNM-2025 | Mari A, et al. Esophageal and oropharyngeal dysphagia: UEG/ESNM recommendations. United European Gastroenterol J 2025;13:855-901 | 40543044 |

## Body weight

- **Ideal (predicted) weight.** Men 50 + 0.91 × (height − 152.4); women 45.5 + 0.91 × (height − 152.4); never
  below BMI 18.5 (ARDSNET-2000). If sex is unknown, the female formula is used, because it is lower.
- **Adjusted weight.** Ideal weight + 25% of the excess. In the ICU it is used above BMI 25 (ESPEN-ICU-2023 R52
  commentary: add 20–25% of the excess). On the ward it is used from BMI 30 (NICE-CG32 1.4.2).
- **Kidney failure (AKI or KRT).** Protein is calculated from the usual pre-illness weight. Without it, the tool uses
  the lower of the ideal and actual weights. The actual weight is not used because of oedema, and an emaciated patient
  is not dosed above their own weight (ESPEN-KIDNEY-2024 R18).
- **Supplement doses** (electrolytes, glutamine, erythromycin, fluid) use the same working weight: the adjusted
  weight in obesity and the actual weight otherwise.

## Energy

| Situation | Rule | Source |
|---|---|---|
| ICU without calorimetry | 25 kcal/kg (top of 20–25); in week 1, 65% of the estimate (below 70%); from day 8, 100% | ESPEN-ICU-2023 commentary, R19 |
| ICU with indirect calorimetry | at most 70% on days 1–3, then up to 100% of measured EE | ESPEN-ICU-2023 R15, R17, R18 |
| ICU progression | feeding days 1–5: 40, 50, 70, 85, 100% of full, never above the phase cap | ESPEN-ICU-2023 R8; NICE-CG32 1.4.5 |
| Controlled shock, or shock not entered | low-dose EN today: 20% of full | ESPEN-ICU-2023 R38, sepsis commentary |
| Ward | 27 kcal/kg; 30 kcal/kg actual weight if BMI < 16, reached slowly | ESPEN-POLY-2024 R9–R11; NICE-CG32 1.4.2 |
| High refeeding risk, or risk undetermined (unless already eating ≥ 50%) | start at 10 kcal/kg (5 if BMI < 14 or intake negligible for more than 15 days), reach the phase target by feeding day 5 | NICE-CG32 1.4.8 |
| Known low intake for more than 5 days, and ward PN | at most 50% for 2 days | NICE-CG32 1.4.5; ESPEN-ICU-2023 R8 |
| Refeeding hypophosphataemia during feeding | 48 hours at the starting level, then the ramp | ESPEN-ICU-2023 R56–R57 |
| Propofol and dextrose | subtracted from the formula: propofol 1.1 kcal/mL, dextrose 3.4 kcal/g | ESPEN-ICU-2023 |

Pump rates are rounded down on cautious days, so that a ceiling is never exceeded.

## Protein

| Situation | g/kg/day | Source |
|---|---|---|
| ICU, normal kidneys | 1.3 (obese: per adjusted weight) | ESPEN-ICU-2023 R22, R52 |
| ICU, kidney status not entered | 1.0 (cautious) | ESPEN-KIDNEY-2024 R18 |
| ICU, AKI without KRT | 1.0, up to 1.3 if tolerated | ESPEN-KIDNEY-2024 R18 |
| ICU, intermittent KRT | 1.3 (1.3–1.5) | ESPEN-KIDNEY-2024 R18 |
| ICU, continuous KRT | 1.5 (1.5–1.7) | ESPEN-KIDNEY-2024 R18 |
| ICU, major trauma, normal kidneys, from day 5 | 1.5 (1.5–2) | ESPEN-ICU-2023 trauma commentary |
| Ward, normal kidneys | 1.2 (1.2–1.5) | ESPEN-POLY-2024 R12 |
| Ward, kidney status not entered | 1.0 (cautious) | NICE-CG32 1.4.2 (0.8–1.5) |
| Ward, eGFR < 30 or AKI without KRT | 0.8 (0.8–1.0) | ESPEN-POLY-2024 R13; ESPEN-KIDNEY-2024 R18 |
| Ward, intermittent KRT | 1.2 | ESPEN-KIDNEY-2024 R18 |

Protein rises with energy and reaches its full target when energy reaches 65% (70% with calorimetry) of the full
estimate, in every phase (R22, "progressively"). Because of this, one formula class covers the first ICU week, and
protein never falls when the energy cap rises after the early phase. Routine doses above 1.3 g/kg are not used: EFFORT
Protein, PRECISe and TARGET Protein found no benefit, and EFFORT Protein found harm in AKI.

**Anabolic/catabolic state.** It is calculated from 24-hour urine urea nitrogen (UUN) and the protein received in the
same 24 hours.

- Nitrogen balance = protein/6.25 − (UUN + 4).
- If the balance is negative, kidneys are known to be normal, and in the ICU it is day 5 or later: protein is raised
  to replace the measured loss, (UUN + 4) × 6.25. The ceiling is 1.5 g/kg, or 2.0 g/kg in major trauma
  (ESPEN-ICU-2023 trauma commentary 1.5–2) and 2.0 g/kg of ideal weight in obesity (ESPEN-ICU-2023 R51–R52).
- The balance is not interpreted in kidney failure.

## Route

1. **Uncontrolled shock** (ICU or ward): neither EN nor PN today, so no feed is given for today.
   - Once resuscitated: start at a low dose (R38).
   - If the gut is also unusable, the restart plan is PN from ICU day 3, never enteral.
2. **Gut unusable** (obstruction, ischaemia, high-output fistula without distal access, abdominal compartment
   syndrome): PN.
   - ICU: from day 3–7. Severe malnutrition (NICE Box 1 single criteria, or BMI < 18.5 with > 10% loss) gets early
     progressive PN (R6, R7).
   - Ward: PN starts at 50% for 2 days.
3. **EN delayed**, in this order: active upper GI bleeding, uncontrolled life-threatening hypoxaemia, hypercapnia or
   acidosis, then gastric aspirate above 500 mL in 6 hours (R38).
   - A low-dose restart plan is given, with protein scaled to energy.
   - For a high residual only: IV erythromycin 3–7 mg/kg/day first, or metoclopramide 10 mg three times a day, then a
     post-pyloric tube (R11, R13, R14).
4. **Can eat** (normal or texture-modified diet, without very high aspiration risk): oral diet first (R3).
   - Oral intake is entered as a share of full needs.
   - In the ICU, ONS is sized for today's target.
   - ONS: the nearest whole number of servings. The minimum gives at least 400 kcal and 30 g protein
     (ESPEN-GER-2022 R26); the maximum is 3.
   - If intake plus 3 servings stays below 75% of the target (70% in kidney failure, ESPEN-KIDNEY-2024 R5), tube
     feeding covers the rest (R41; ESPEN-POLY-2024 R25).
   - With a refeeding risk, the cautious target is a ceiling: servings are rounded down, with no minimum.
   - A remaining protein gap of ≥ 5 g is covered with protein powder.
5. **Cannot eat, or swallowing not assessed**: enteral tube feeding.
   - ICU: early, gastric, continuous by pump (R4, R5, R9, R10).
   - Very high aspiration risk: post-pyloric (R12, R43).
   - Ward: continuous, or intermittent feeds (ESPEN-HEN-2022 R31). The volume is feeds × mL.
   - If tube feeding is expected beyond 4 weeks, a PEG is planned for the stable phase, with nasogastric feeding
     until then (ESPEN-HEN-2022 R6–R7; ESPEN-NEURO-2018 R65–R66).

## Formula class

The class is chosen by the protein density needed (ESPEN-KIDNEY-2024 R25). It is the most protein-dense class that
does not exceed the need by more than 10%:

| Class | Protein per 100 kcal |
|---|---|
| Very high protein | 8.0 g |
| High protein | 5.0 g |
| Standard | 4.0 g |
| Low protein and low electrolyte (2.0 kcal/mL) | 1.5 g |

A protein module covers the rest.

- Fluid restriction: energy-dense 1.5 kcal/mL, or the low-protein dense class if little protein is needed.
- Diarrhoea, constipation, or ward EN from age 65: fibre-containing formula (ESPEN-HEN-2022 R40–R41;
  ESPEN-GER-2022 R3; ESPEN-POLY-2024 R17).
- Dysphagia: texture-modified high-protein ONS.

Label values (liquid, or powder with its dilution) can be entered. Every amount is then recalculated, and any
protein over-delivery or non-nutritional calories above the target are shown as a warning.

## Supplements (only when indicated)

| Indication | Dose | Source |
|---|---|---|
| Suspected Wernicke encephalopathy | thiamine 500 mg × 3/day IV | ESPEN-MN-2022 Table 8 |
| High refeeding risk | thiamine 300 mg IV before feeding, then 200–300 mg/day IV for ≥ 3 days. If able to take tablets: 200–300 mg/day orally for 10 days + vitamin B co strong. K 2–4, PO₄ 0.3–0.6, Mg 0.2 (IV) / 0.4 (oral) mmol/kg/day unless levels are high; not automatic in impaired or unknown kidney function. Multivitamin/trace elements for 10 days | ESPEN-MN-2022 Table 8; NICE-CG32 1.4.8 |
| Risk of deficiency (alcohol, malnutrition, > 5 days of low intake, refeeding risk not excluded) | thiamine 100 mg × 3/day (IV in the ICU or without an oral route) | ESPEN-MN-2022 R14.5–R14.6, Table 8 |
| ICU admission, days 1–4 | thiamine 100 mg/day IV (100–300) for 3–4 days | ESPEN-MN-2022 R14.5 |
| Ward, reduced intake in recent days | thiamine 100 mg/day | ESPEN-MN-2022 R14.6 |
| Continuous KRT | thiamine 100 mg/day, continued after any higher short course | ESPEN-MN-2022 Table 8 |
| PN | daily IV multivitamins and trace elements | ESPEN-ICU-2023 R34 |
| EN below 1500 kcal/day | one complete multivitamin-mineral dose per day | ESPEN-MN-2022 |
| 25(OH)D < 20 ng/mL | ICU: no extra dose (dose and timing uncertain; a single ultra-high dose showed no benefit); feeding provides the standard content. Ward: vitamin D3 4000–5000 IU/day for 2 months, target 40–60 ng/mL (the ESPEN dose for recurrent deficiency) | ESPEN-ICU-2023 R36; ESPEN-MN-2022 R24.3–R24.5; VIOLET |
| Burns > 20% TBSA (ICU or ward) | zinc 30–35 mg/day IV for 2–3 weeks. In the ICU, with EN/oral feeding, up to day 15 and with normal kidneys: enteral glutamine 0.3–0.5 g/kg/day for 10–15 days (RE-ENERGIZE found no benefit; ESPEN kept the recommendation) | ESPEN-MN-2022 R13.6; ESPEN-ICU-2023 R26 |
| ICU major trauma (days 1–5, EN/oral, normal kidneys) | enteral glutamine 0.2–0.3 g/kg/day | ESPEN-ICU-2023 R27 |
| Ward pressure ulcer (normal kidneys) | arginine 14 g + glutamine 14 g + calcium HMB 2.4 g/day | ESPEN-POLY-2024 R16 |

Glutamine is never given to other ICU patients (R28), nor parenterally (R29). Leucine, BCAA and HMB have no
guideline indication in the ICU.

## Screening and assessment scales

The scales are entered on cards 2, 4 and 6. Their results are shown on the result page; the summary shows the
NRS 2002 score, GLIM malnutrition, sarcopenia and an abnormal EAT-10 as chips. Missing data never count as normal:
a scale stays incomplete, or its score is shown as a lower bound ("≥3"), until the data decide it.

- **NRS 2002** (NRS-2002, ESPEN-SCREEN-2002). Nutrition score from the data, taking the highest that applies:
  weight loss >5% in 3 months (1), in 2 months (2), in 1 month or >15% in 3 months (3); BMI 18.5–20.5 inclusive (2)
  or <18.5 (3) with an impaired general condition; intake in the last week <75% (1), ≤60% (2), ≤25% (3), where a week
  or more of little or no intake counts as 0–25%. The clinician may enter the nutrition score; a lower entry than
  the data show is replaced, with a warning. Disease score 0–3 as in the original table; +1 from age 70. ≥3 = at
  nutritional risk; <3 = rescreen weekly.
- **GLIM** (GLIM-2019). Phenotype: weight loss >5% within 6 months or >10% beyond (stage 2: >10% / >20%); BMI <20
  below 70 years, <22 from 70 (stage 2: <18.5 / <20); reduced muscle mass (clinician grading, or a measured ASM
  below the EWGSOP2 cut-offs as a moderate deficit). Etiology: reduced intake or assimilation (by default after
  more than 7 days of little or no intake) or inflammation (by default in the ICU, with burns or major trauma).
  Both groups are needed; the stage comes from the phenotype.
- **ESPEN 2015** (ESPEN-MALN-2015) after positive screening: BMI <18.5, or weight loss (>10% at any time, >5% in
  3 months) with an age-specific low BMI or FFMI <15 (women) / <17 (men). A 5–10% loss over a period known to be
  longer than 3 months does not meet the loss criterion. While the screen is incomplete the result stays incomplete,
  and the page says when the criteria are already met.
- **AND/ASPEN** (AND-ASPEN-2012): at least two of six clinician-confirmed characteristics in a stated context; grip
  strength is not counted in the ICU. No automatic severity.
- **EWGSOP2** (EWGSOP2): low strength (grip <27 / <16 kg, five chair rises >15 s) = probable sarcopenia; with low
  muscle quantity (ASM <20 / <15 kg or ASM/height² <7.0 / <5.5 kg/m², the corrected female value) = sarcopenia; with
  low performance (gait speed ≤0.8 m/s or SPPB ≤8) = severe. In the ICU, or when acute illness, weakness, pain or
  sedation confound the tests, the result is for review only.
- **Swallowing.** The most cautious of: the swallowing question; FOIS 1–3 (tube), 4–6 (texture-modified), 7 (safe)
  (FOIS); IDDSI levels other than regular food with thin drinks (texture-modified) (IDDSI); impaired alertness or
  unsafe signs while swallowing (no oral intake) (UEG-ESNM-2025). Disagreeing findings give a warning. EAT-10 ≥3 is
  abnormal; it never clears oral feeding.

How the scales change the recommendation:

| Finding | Effect | Source |
|---|---|---|
| FOIS, IDDSI, impaired alertness, unsafe signs | set the swallowing status and with it the route | FOIS, IDDSI, UEG-ESNM-2025 |
| IDDSI drink level 0 | liquid high-protein ONS instead of a texture-modified ONS | IDDSI |
| IDDSI drink level ≥1 | all drinks, ONS included, thickened to that level; note on the flow test | IDDSI, ESPEN-NEURO-2018 |
| Ward, intake unknown, complete NRS 2002 <3, no malnutrition by GLIM, ESPEN 2015 or AND/ASPEN | no ONS; rescreen weekly | ESPEN-POLY-2024 R21, NRS-2002 |
| Ward, NRS 2002 ≥3 or GLIM met | ONS at least 400 kcal and 30 g protein when intake is unknown | ESPEN-POLY-2024 R21 |
| GLIM stage 2, ICU, gut unusable, day 1–2 | parenteral nutrition starts now, progressively | ESPEN-ICU-2023 R7 |
| Malnutrition by GLIM, ESPEN 2015 or AND/ASPEN | counts as malnutrition for thiamine, the vitamin D check and ward ONS | ESPEN-MN-2022, ESPEN-POLY-2024 R21 |
| ICU, gut unusable, day 1–2, GLIM stage 2 neither shown nor ruled out | high-impact request for weight loss, BMI or muscle mass | ESPEN-ICU-2023 R7 |
| Oedema ticked | "not met" weight- and BMI-based criteria become unknown | GLIM-2019, NICE-CG32 |
| Weight loss over more than 6 months | NICE weight-loss criteria become unknown (cautious start) | NICE-CG32 |
| Stroke, oral route, no swallowing screen | warning: screen before oral intake | ESPEN-NEURO-2018 R52 |
| EAT-10 ≥3 while swallowing is taken as safe | warning: clinical swallowing assessment, VFSS or FEES | EAT-10, UEG-ESNM-2025 |
| Ward sarcopenia (probable or confirmed) | note: resistance exercise, reach the protein target; no separate leucine or HMB dose | ICFSR-2018 |

## Laboratory values

Entered on card 7 in the laboratory's own unit and converted from molar masses: phosphorus 30.97 g/mol (1 mg/dL =
0.3229 mmol/L), magnesium 24.305 g/mol (1 mg/dL = 0.4114 mmol/L), creatinine (1 mg/dL = 88.42 µmol/L), urea
(1 mmol/L = 6.006 mg/dL; urea = BUN × 2.144), lactate (1 mmol/L = 9.008 mg/dL), albumin g/dL × 10 = g/L, CRP
mg/dL × 10 = mg/L, cells/µL ÷ 1000 = 10⁹/L, 25(OH)D nmol/L ÷ 2.496 = ng/mL. Errors give the accepted range in the
entered unit.

| Finding | Effect | Source |
|---|---|---|
| Feeding running and phosphate <0.65 mmol/L, or a fall >0.16 mmol/L from the value before feeding | refeeding hypophosphataemia: energy held for 48 hours, then increased | ESPEN-ICU-2023 R57 |
| Feeding not started; potassium, phosphate or magnesium below the laboratory's own lower limit, or phosphate <0.65 mmol/L | low pre-feeding level: NICE major criterion, refeeding risk high (a "No" answer is overruled with a warning) | NICE-CG32 |
| Feeding not started; all three above their lower limits and the question unanswered | the "low before feeding" criterion is absent | NICE-CG32 |
| Feeding not started; a value entered without its lower limit | not judged; listed as missing data (high impact while the question is unanswered) | NICE-CG32 |
| Feeding running; potassium or magnesium below the lower limit | note: replace per local protocol, monitor closely | NICE-CG32 |
| CRP (any unit) on the ward >100 mg/L | note on the reduced response to nutritional support | ESPEN-POLY-2024 |
| 25(OH)D (ng/mL or nmol/L) | vitamin D recommendation as before | ESPEN-MN-2022 |

Shown for context only, never changing a dose: NLR (NLR-2001); PNI = albumin (g/L) + 5 × lymphocytes (10⁹/L), equal
to Onodera's 10 × albumin (g/dL) + 0.005 × lymphocytes/mm³ (PNI-1984); urea/creatinine ratio in mg/dL:mg/dL
(UCR-CRRT-2025, high group ≥75) and mmol/L:mmol/L (UCR-2019), with a warning that continuous KRT lowers it and that
kidney failure distorts it. No population reference interval is prefilled: the lower limits are those of the
clinician's laboratory, entered in the unit of the value. The laboratory part was audited by an independent model
(Gemini, through Antigravity): 8 findings, all fixed (lower limits instead of the 0.65 mmol/L threshold before
feeding, warnings when an answer is overruled, findings recorded even when the box was ticked, sources per finding,
an exact 0.16 mmol/L fall not counted as more than 0.16, an unknown unit message, the three PNI categories).

### Reference intervals, import and ICU severity

- **Reference intervals.** The laboratory's own lower and upper limits can be entered for eleven tests, in the unit
  of the value. They mark low and high values on the result page, give the CRP / upper-limit ratio, and (K, P, Mg
  lower limits) decide the low pre-feeding level. No population interval is ever assumed. A lower limit above the
  upper limit is shown as an error and the pair is not used.
- **Import.** A CSV (comma, semicolon or tab, detected outside quotes; header with test, value and unit, optionally
  date; Turkish headers accepted; two columns with the same meaning or rows wider than the header are reported) or
  JSON file is read on the device, never sent. A row without a unit is not imported. Test names are matched in Turkish and English (for
  example fosfor, potasyum, BUN, nötrofil#); units are mapped to the unit lists; dates as YYYY-MM-DD or DD.MM.YYYY.
  Rows are previewed with their problems; the latest valid row of each test is preselected; only chosen rows are
  written into the fields; when the laboratory's limits are already entered for a test, the imported value is
  converted into their unit so they keep their meaning. A TXT file is shown for reading. PDF is not read (it would need a new library; the
  clinician decides).
- **SOFA-2** (SOFA-2-2025, Table 2 of the corrected publisher text, as in the previous version): brain (GCS with
  delirium), respiratory (PaO2/FiO2 with advanced support or ECMO), cardiovascular (norepinephrine + epinephrine dose,
  other vasopressor, mechanical support, MAP), liver (bilirubin), kidney (kidney replacement from the kidney answer;
  creatinine with urine output), haemostasis (platelets). The total is given only when all six components are
  known; it is shown only when a SOFA-2 input was entered.
- **SAPS II** (SAPS-II-1993): the clinician's recorded total from the original form; not recalculated.
- Both are severity context and never change a nutrition dose.
- Part 2b was audited by an independent model (Codex, GPT-6.1 Sol, high reasoning) while the Gemini and Antigravity
  Claude quotas were exhausted: 5 findings, all fixed.

## Follow-up: delivered nutrition

On the result page the clinician enters, per day, the total energy and protein delivered (formula, ONS, oral intake,
PN, propofol and dextrose included). Each complete row is compared with that day's target: for an ICU day the engine
recalculates the target with the current inputs and feeding taken as running; on the ward the full target is used.
The table gives the percentage achieved and the cumulative energy and protein difference. In the first ICU week
energy more than 10% above the day's target is marked, with the ESPEN-ICU-2023 early-phase limit (below 70% of the
estimate; not above 70% of measured expenditure for the first 3 days). Missing values are never zero; nothing
changes a dose. Rows are saved in the case file. Part 4b was audited by Codex (GPT-6.1 Sol, high): one wording
finding, fixed.

## Evidence library and decision topics

The previous workspace's focused evidence library (65 sources, literature cut-off 26 October 2026; not a systematic
review) and its four decision topics (ICU protein, refeeding approaches, glutamine, leucine/BCAA/HMB) open from the
page footer. Each topic compares guideline references with what the trials actually tested; the physician's choice
is saved in the case file and listed in the report. A choice that is not offered for the current care setting (for
example a ward-only approach after the setting is changed to ICU) is marked in the report for reassessment and is
not saved; a choice can be cleared; choices in a case file that this version does not know are not taken, and the
user is told. Nothing in the library is an executable dose rule.

## PDF laboratory reports

A laboratory PDF is read on the device with PDF.js 6.2.108 (the copy reviewed for the previous version: registry
signature and SHA-512 verified, patched for GHSA-hq66-cqwq-w95j, no OSV advisory on 7 November 2026; no scripting or
network). Reading stops at 50 pages, 400 000 characters of text, 200 000 text pieces or 60 seconds, and when another
file or case is opened. Each line is read from the left as "<test> <value> <unit>"; the unit may also stand just
before the value, and a second test may follow right after the first one's unit and reference range. Test names need
three or more letters. Only result flags (H, L, *, ↑, ↓), dates and times, and specimen words (serum, plazma, kan …)
may stand between the name, the value and the unit; any other word ends the line, so a qualified test such as
"Bilirubin direkt", "Kreatinin (idrar)" or "Kreatinin kinaz" is never read as the plain test, and a censored result
("<0,5", "≥ 200") or a reference range is never taken as a value. Every row shows its report line and page and goes
through the same unit and range checks as a CSV row. A test whose result cannot be read - a censored value ("<0,5",
"> 6,5"), a comment ("hemolizli", "çalışılmadı"), only a reference range (any dash form, "to", "ile"), several numbers
after a unit written first, or nothing - still gives a row that cannot be imported, so an older result of the same
test is never preselected in its place. Under a heading that names another specimen (idrar, BOS, periton, plevra,
dren sıvısı …) results are not taken as serum values until a blood heading (serum, kan, biyokimya, hemogram …).
Single-letter specimen marks (S, P) count only in brackets. A name that mixes urea and BUN ("Üre (BUN)") is not read, because
BUN is converted (× 2.144). A part of a line that is not one of these tests (the left column of a two-column report) is
passed over without importing anything, so a test right after it can still be read. One row per test is preselected
only when it is unambiguous (a single result, identical results, or a single latest-dated result) and the test has no
recognised but unusable row; when the text has more than 300 results or 20 000 lines nothing is preselected. Otherwise
the clinician chooses, and only one value per test can be imported. A comparator in a CSV row's test name or value
("CRP <", "<0,5") is reported as a censored value and not imported; a row with more cells than the header, a value
split by an unquoted decimal comma in a comma-separated file, or (in JSON) two fields of the same meaning is refused,
and blocks preselection of its test. A slash date is read day-first only when the day is above 12; otherwise it counts
as undated. Numbers are plain decimals ("0x7D0" or "1e3" are not read). A scanned PDF without text cannot be read.

## Number entry

A thousands separator is not read, because it would be taken as a decimal point and give a value a thousand times too
small. In fields that accept values of 1000 or more, "1.800" or "2,000" is refused with a request to write 1800; counts
per µL are whole numbers and take no separator at all ("250.000 /µL" → 250000).

## Cases on this device

With device storage on (the default), the open case is saved in this browser shortly after each change and when the
page is left; nothing is sent. At most 200 cases are kept. "My cases" lists each case's code (the page asks for a case
code, never a name or ID number), a short summary and the last change, and opens, renames or deletes it. The last case
reopens by itself only within 12 hours of its last change, with a notice and a button to start a new case, so the next
user of a shared computer does not open it unknowingly; older cases stay in the list. The example case is never kept. A
case file (JSON) opened on the page becomes a case on this device, and a saved case file carries the case code. Turning
device storage off deletes the cases from this device after confirmation. In a private window or with blocked site
data nothing can be kept, and the page says so.

## Cases on the site (optional)

"Also keep cases on the site" under My cases is off until the clinician ticks it; its one-line note says that cases
are then anonymised and kept in the site's database. Unticked, cases stay on the device only. When ticked, each case is
sent anonymised under a random case code such as NC-7K3P-Q2M9: only the answers to the form's questions shown for the
case (numbers as typed, the chosen answers, ticks, laboratory units), the age as a band (under 18, 18-19, five-year
bands from 20 to 89, 90 or over; the bands start at the ages the rules use: 18, 65 and 70), the product label values,
the follow-up and the chosen evidence options. The label and anything else stay on the device, which keeps the whole
case and shows the code next to the case and in the report, so the clinician sees the real patient. The site refuses
any other value - a value must be a number of at most six digits before and four after the decimal mark, true/false,
one of the application's own answer words (a fixed list, checked against the form by a test) or a laboratory unit - so
no name, ID number, telephone number, e-mail address or date can be stored; a plain age sent by a page opened before
1.9.1 is kept as its band, and copies stored by 1.9.0 were scrubbed in the same way. A device identifies its copies with a random token kept in the browser (the site stores only its SHA-256):
only that device and the administrator can see a copy. The administrator sees every copy on a separate page behind
the site's password, anonymised: the day of saving only, listed by day and case code, and nothing about the sending
device; the targets shown there use the middle of the age band. Strictly, the copies are pseudonymised: the device that sent a copy can match its code
to its own case. Each change is sent shortly afterwards; deleting a case on the device deletes its copy; unticking
stops sending at once and deletes all copies of the device - when the site cannot be reached, the device keeps trying
until they are deleted and the page says so; after that the site refuses the device's token, so a sending still under
way stores nothing. At most 200 cases (2 MB) per device and 5000 devices; a device's first copy counts against a daily
limit of new devices per internet address (30; an IPv6 address by its /64 network; the address is kept hashed with a
salt that exists only in the service's memory and changes every day, for that day only); requests are rate-limited
per client; writing stops while the server has less than 5 GB free.

## Notes shown when relevant

- Diabetes.
- Stroke (tube within 72 hours, PEG timing).
- Diarrhoea and constipation.
- Dysphagia (IDDSI level by the swallowing assessment).
- Post-pyloric access.
- Lipid-free PN when propofol lipid is high.
- Ward CRP above 100 mg/L: no response to nutritional support in the EFFORT secondary analysis (ESPEN-POLY-2024).

## Monitoring shown

- **Glucose:** at start and at least every 4 hours for 2 days; insulin above 10 mmol/L (R53–R54).
- **K, Mg and phosphate:** daily in week 1. Refeeding hypophosphataemia means phosphate < 0.65 mmol/L or a drop of
  more than 0.16. Then measure 2–3 times a day, replace, and restrict energy for 48 hours (R55–R57).
- **Extreme refeeding risk:** cardiac rhythm monitoring (NICE-CG32 1.4.8).
- **Dysphagia:** fluid and food intake monitoring (ESPEN-NEURO-2018 R60).

## Tests

`tests/scales.test.mjs` checks the scales and their effect on the recommendation in 21 tests (NRS 2002 scoring and
lower bounds, GLIM stages and age-specific BMI, ESPEN 2015 options, AND/ASPEN in the ICU, EWGSOP2 cut-offs including
the corrected female ASM index, EAT-10, swallowing from FOIS and IDDSI, ONS choice by IDDSI, ONS by nutritional risk,
early PN in severe malnutrition, oedema, loss duration, stroke screening, sarcopenia note, sources, and the audit
fixes).

`tests/labs.test.mjs` checks unit conversions, errors in the entered unit, NLR, PNI, the urea/creatinine ratio,
phosphate rules, lower limits, import, reference flags, SOFA-2, the audit fixes and their effect on the plan (12 tests).

`tests/engine.test.mjs` checks the rules against 45 hand-calculated cases, covering:

- ICU: standard, with calorimetry, obese, CRRT, AKI;
- refeeding: high and extreme risk, undetermined risk, refeeding while eating;
- ward: ONS and supplemental tube feeding;
- burns and trauma;
- PN timing;
- shock and delays, including shock with an unusable gut and shock on the ward;
- missing and invalid data;
- catabolism;
- Wernicke;
- propofol;
- vitamin D;
- dysphagia;
- label and powder;
- kidney-unknown defaults;
- the low-protein class;
- the pressure-ulcer mixture;
- aspiration;
- hypophosphataemia;
- PEG planning;
- CRP;
- that every cited source exists.
