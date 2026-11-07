# NutriClinic staged recommender — clinical rules

Version 1.0.0 · rules dated 2026-11-07 · Dr. Gökay Duman (Neurology)

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

The calculation is blocked in three cases: an invalid (out-of-range) value, age under 18, and pregnancy. Patient
data never leave the page: nothing is stored, logged or sent.

## Sources

Doses and recommendation numbers were read from the official full texts. PMIDs, titles, authors and issues were
checked with NCBI E-utilities on 2026-11-07. The rules were audited twice by an independent model (Gemini, through
Antigravity). Each finding was checked against the code and the full texts before it was fixed.

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

Protein rises with energy and reaches its full target when energy reaches the phase cap (R22, "progressively").
Because of this, one formula class covers the first ICU week. Routine doses above 1.3 g/kg are not used: EFFORT
Protein, PRECISe and TARGET Protein found no benefit, and EFFORT Protein found harm in AKI.

**Anabolic/catabolic state.** It is calculated from 24-hour urine urea nitrogen (UUN) and the protein received in the
same 24 hours.

- Nitrogen balance = protein/6.25 − (UUN + 4).
- If the balance is negative, kidneys are known to be normal, and in the ICU it is day 5 or later: protein is raised
  to replace the measured loss, (UUN + 4) × 6.25. The ceiling is 1.5 g/kg, or 2.0 g/kg of ideal weight in obesity
  (ESPEN-ICU-2023 R51–R52).
- The balance is not interpreted in kidney failure.

## Route

1. **Uncontrolled shock**: neither EN nor PN. Start at a low dose once resuscitated (R38).
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
| Burns > 20% TBSA | zinc 30–35 mg/day IV for 2–3 weeks. In the ICU, with EN/oral feeding, up to day 15 and with normal kidneys: enteral glutamine 0.3–0.5 g/kg/day for 10–15 days (RE-ENERGIZE found no benefit; ESPEN kept the recommendation) | ESPEN-MN-2022 R13.6; ESPEN-ICU-2023 R26 |
| ICU major trauma (days 1–5, EN/oral, normal kidneys) | enteral glutamine 0.2–0.3 g/kg/day | ESPEN-ICU-2023 R27 |
| Ward pressure ulcer (normal kidneys) | arginine 14 g + glutamine 14 g + calcium HMB 2.4 g/day | ESPEN-POLY-2024 R16 |

Glutamine is never given to other ICU patients (R28), nor parenterally (R29). Leucine, BCAA and HMB have no
guideline indication in the ICU.

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

`tests/engine.test.mjs` checks the rules against 42 hand-calculated cases, covering:

- ICU: standard, with calorimetry, obese, CRRT, AKI;
- refeeding: high and extreme risk, undetermined risk, refeeding while eating;
- ward: ONS and supplemental tube feeding;
- burns and trauma;
- PN timing;
- shock and delays;
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
