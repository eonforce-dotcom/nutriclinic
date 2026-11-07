// Sources used by the rules. PMIDs and titles were checked with NCBI E-utilities on 2026-11-07;
// recommendation numbers and doses were read from the official full texts.
// SPDX-License-Identifier: AGPL-3.0-only
export const SOURCES = {
  'espen-icu-2023': {
    short: { tr: 'ESPEN 2023 · Yoğun bakım', en: 'ESPEN 2023 · ICU' },
    cite: 'Singer P, Blaser AR, Berger MM, et al. ESPEN practical and partially revised guideline: Clinical nutrition in the intensive care unit. Clin Nutr. 2023;42(9):1671-1689.',
    pmid: '37517372', doi: '10.1016/j.clnu.2023.07.011',
    used: { tr: 'Enerji (20–25 kcal/kg; ilk haftada <%70; kalorimetriyle 3. günden sonra %80–100), protein 1,3 g/kg, obezite, beslenme yolu ve zamanlama, glutamin, izlem.', en: 'Energy (20–25 kcal/kg; <70% in week 1; 80–100% of calorimetry after day 3), protein 1.3 g/kg, obesity, route and timing, glutamine, monitoring.' },
  },
  'espen-mn-2022': {
    short: { tr: 'ESPEN 2022 · Mikrobesin', en: 'ESPEN 2022 · Micronutrients' },
    cite: 'Berger MM, Shenkin A, Schweinlin A, et al. ESPEN micronutrient guideline. Clin Nutr. 2022;41(6):1357-1424.',
    pmid: '35365361', doi: '10.1016/j.clnu.2022.02.015',
    used: { tr: 'Tiamin dozları (R14.5–14.7, Tablo 8), çinko (R13.6), D vitamini (R24.5), 1500 kcal altındaki mamada mikrobesin.', en: 'Thiamine doses (R14.5–14.7, Table 8), zinc (R13.6), vitamin D (R24.5), micronutrients below 1500 kcal of formula.' },
  },
  'espen-kidney-2024': {
    short: { tr: 'ESPEN 2024 · Böbrek', en: 'ESPEN 2024 · Kidney' },
    cite: 'Sabatino A, Fiaccadori E, Barazzoni R, et al. ESPEN practical guideline on clinical nutrition in hospitalized patients with acute or chronic kidney disease. Clin Nutr. 2024;43(9):2238-2254.',
    pmid: '39178492', doi: '10.1016/j.clnu.2024.08.002',
    used: { tr: 'Böbrek durumuna ve KRT türüne göre protein (R18), referans kilo, mama seçimi (R25), ağızdan yetersizlikte EN (R5).', en: 'Protein by kidney status and KRT type (R18), reference weight, formula choice (R25), EN when oral intake is insufficient (R5).' },
  },
  'espen-polymorbid-2024': {
    short: { tr: 'ESPEN 2024 · Serviste polimorbid hasta', en: 'ESPEN 2024 · Polymorbid inpatients' },
    cite: 'Wunderle C, Gomes F, Schuetz P, et al. ESPEN practical guideline: Nutritional support for polymorbid medical inpatients. Clin Nutr. 2024;43(3):674-691.',
    pmid: '38309229', doi: '10.1016/j.clnu.2024.01.008',
    used: { tr: 'Servis enerjisi (27 kcal/kg; ağır zayıflıkta 30 kcal/kg), protein 1,2–1,5 g/kg, eGFR<30 için 0,8 g/kg, ONS, en az %75 hedef, bası yarası karışımı.', en: 'Ward energy (27 kcal/kg; 30 kcal/kg if severely underweight), protein 1.2–1.5 g/kg, 0.8 g/kg if eGFR <30, ONS, at least 75% of targets, pressure-ulcer mixture.' },
  },
  'espen-geriatrics-2022': {
    short: { tr: 'ESPEN 2022 · Geriatri', en: 'ESPEN 2022 · Geriatrics' },
    cite: 'Volkert D, Beck AM, Cederholm T, et al. ESPEN practical guideline: Clinical nutrition and hydration in geriatrics. Clin Nutr. 2022;41(4):958-989.',
    pmid: '35306388', doi: '10.1016/j.clnu.2022.01.024',
    used: { tr: 'ONS en az 400 kcal ve 30 g protein/gün (R26), yaşlıda lifli enteral ürün (R3), kıvam ayarlı zenginleştirilmiş diyet (R22).', en: 'ONS at least 400 kcal and 30 g protein/day (R26), fibre-containing enteral products in older people (R3), texture-modified enriched diet (R22).' },
  },
  'espen-hen-2022': {
    short: { tr: 'ESPEN 2022 · Evde enteral beslenme', en: 'ESPEN 2022 · Home enteral nutrition' },
    cite: 'Bischoff SC, Austin P, Boeykens K, et al. ESPEN practical guideline: Home enteral nutrition. Clin Nutr. 2022;41(2):468-488.',
    pmid: '35007816', doi: '10.1016/j.clnu.2021.10.018',
    used: { tr: 'Nazogastrik tüp 4–6 haftaya kadar, uzun sürede PEG (R6–R7), uygulama biçimi (R31), ishal ve kabızlıkta lifli mama (R40–R41), diyabet (R42).', en: 'Nasogastric tube up to 4–6 weeks, PEG for long term (R6–R7), delivery mode (R31), fibre in diarrhoea and constipation (R40–R41), diabetes (R42).' },
  },
  'espen-neurology-2018': {
    short: { tr: 'ESPEN 2018 · Nöroloji', en: 'ESPEN 2018 · Neurology' },
    cite: 'Burgos R, Bretón I, Cereda E, et al. ESPEN guideline clinical nutrition in neurology. Clin Nutr. 2018;37(1):354-396.',
    pmid: '29274834', doi: '10.1016/j.clnu.2017.09.003',
    used: { tr: 'İnmede disfaji: kıvam ayarı ve izlem (R58–R60), 72 saat içinde tüple beslenme (R63–R65), PEG zamanı (R66, R68).', en: 'Stroke dysphagia: texture modification and monitoring (R58–R60), tube feeding within 72 h (R63–R65), PEG timing (R66, R68).' },
  },
  'nice-cg32': {
    short: 'NICE CG32',
    cite: 'National Institute for Health and Care Excellence. Nutrition support for adults: oral nutrition support, enteral tube feeding and parenteral nutrition (CG32). 2006, updated 2017.',
    url: 'https://www.nice.org.uk/guidance/cg32/chapter/Recommendations',
    used: { tr: 'Refeeding risk ölçütleri (Kutu 1), başlangıç enerjisi ve tiamin, elektrolit, multivitamin (1.4.5, 1.4.8), servis için 25–35 kcal/kg ve 30–35 mL/kg sıvı (1.4.2).', en: 'Refeeding risk criteria (Box 1), starting energy, thiamine, electrolytes and multivitamins (1.4.5, 1.4.8), 25–35 kcal/kg and 30–35 mL/kg fluid on the ward (1.4.2).' },
  },
  'ardsnet-2000': {
    short: { tr: 'ARDSNet 2000 · öngörülen kilo', en: 'ARDSNet 2000 · predicted weight' },
    cite: 'Brower RG, Matthay MA, Morris A, et al.; Acute Respiratory Distress Syndrome Network. Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. N Engl J Med. 2000;342(18):1301-1308.',
    pmid: '10793162', doi: '10.1056/NEJM200005043421801',
    url: 'http://www.ardsnet.org/files/ventilator_protocol_2008-07.pdf',
    used: { tr: 'İdeal (öngörülen) kilo, ARDSNet protokol kartı: erkek 50 + 2,3 × (boy inç − 60), kadın 45,5 + 2,3 × (boy inç − 60); santimetreyle 0,91 × (boy − 152,4). En az BKİ 18,5 karşılığı.', en: 'Ideal (predicted) body weight, ARDSNet protocol card: men 50 + 2.3 × (height in inches − 60), women 45.5 + 2.3 × (height in inches − 60); in centimetres 0.91 × (height − 152.4). Floored at BMI 18.5.' },
  },
  'reenergize-2022': {
    short: 'RE-ENERGIZE 2022',
    cite: 'Heyland DK, Wibbenmeyer L, Pollack J, et al.; RE-ENERGIZE Trial Team. A Randomized Trial of Enteral Glutamine for Treatment of Burn Injuries. N Engl J Med. 2022;387(11):1001-1010.',
    pmid: '36082909', doi: '10.1056/NEJMoa2203364',
    used: { tr: 'Yanıkta enteral glutamin: en büyük RCT, yarar yok (öneri notu).', en: 'Enteral glutamine in burns: largest RCT, no benefit (recommendation note).' },
  },
  'violet-2019': {
    short: 'VIOLET 2019',
    cite: 'Ginde AA, Brower RG, Caterino JM, et al.; National Heart, Lung, and Blood Institute PETAL Clinical Trials Network. Early High-Dose Vitamin D3 for Critically Ill, Vitamin D-Deficient Patients. N Engl J Med. 2019;381(26):2529-2540.',
    pmid: '31826336', doi: '10.1056/NEJMoa1911124',
    used: { tr: 'Yoğun bakımda tek seferlik 540.000 IU D vitamini yarar göstermedi.', en: 'A single 540,000 IU vitamin D dose showed no benefit in the ICU.' },
  },
  'effort-protein-2023': {
    short: 'EFFORT Protein 2023',
    cite: 'Heyland DK, Patel J, Compher C, et al. The effect of higher protein dosing in critically ill patients with high nutritional risk (EFFORT Protein): an international, multicentre, pragmatic, registry-based randomised trial. Lancet. 2023;401(10376):568-576.',
    pmid: '36708732', doi: '10.1016/S0140-6736(22)02469-2',
    used: { tr: 'Yüksek protein yarar göstermedi; AKI’de zarar sinyali (1,3 g/kg üstüne çıkmama gerekçesi).', en: 'Higher protein showed no benefit; harm signal in AKI (reason not to exceed 1.3 g/kg routinely).' },
  },
  'precise-2024': {
    short: 'PRECISe 2024',
    cite: 'Bels JLM, Thiessen S, van Gassel RJJ, et al. Effect of high versus standard protein provision on functional recovery in people with critical illness (PRECISe): an investigator-initiated, double-blinded, multicentre, parallel-group, randomised controlled trial in Belgium and the Netherlands. Lancet. 2024;404(10453):659-669.',
    pmid: '39153816', doi: '10.1016/S0140-6736(24)01304-7',
    used: { tr: '2,0 ile 1,3 g/kg karşılaştırması: yüksek protein yaşam kalitesinde daha kötü.', en: '2.0 versus 1.3 g/kg: higher protein had worse quality-of-life scores.' },
  },
  'target-protein-2025': {
    short: 'TARGET Protein 2025',
    cite: 'Summers MJ, Chapple LS, Karahalios A, et al.; TARGET Protein Investigators. Augmented Enteral Protein During Critical Illness: The TARGET Protein Randomized Clinical Trial. JAMA. 2025;334(4):319-328.',
    pmid: '40495743', doi: '10.1001/jama.2025.9110',
    used: { tr: 'Artırılmış enteral protein üstünlük göstermedi.', en: 'Augmented enteral protein showed no superiority.' },
  },
};

export const PROTEIN_TRIALS = ['effort-protein-2023', 'precise-2024', 'target-protein-2025'];
