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
  // Screening and assessment scales (scales.mjs). PMIDs checked with PubMed on 2026-11-07.
  'nrs2002-2003': {
    short: 'NRS 2002',
    cite: 'Kondrup J, Rasmussen HH, Hamberg O, Stanga Z; Ad Hoc ESPEN Working Group. Nutritional risk screening (NRS 2002): a new method based on an analysis of controlled clinical trials. Clin Nutr. 2003;22(3):321-336.',
    pmid: '12765673', doi: '10.1016/s0261-5614(02)00214-5',
    used: { tr: 'NRS 2002 puanı: beslenme bozukluğu (0–3) + hastalık şiddeti (0–3) + 70 yaştan itibaren 1; ≥3 beslenme riski, <3 haftalık yeniden tarama.', en: 'NRS 2002 score: impaired nutritional status (0–3) + disease severity (0–3) + 1 from age 70; ≥3 nutritional risk, <3 weekly rescreening.' },
  },
  'espen-screening-2002': {
    short: { tr: 'ESPEN 2002 · Tarama', en: 'ESPEN 2002 · Screening' },
    cite: 'Kondrup J, Allison SP, Elia M, Vellas B, Plauth M. ESPEN guidelines for nutrition screening 2002. Clin Nutr. 2003;22(4):415-421.',
    pmid: '12880610', doi: '10.1016/s0261-5614(03)00098-0',
    used: { tr: 'Hastanede NRS 2002 ile tarama ve puanların tanımı.', en: 'Hospital screening with NRS 2002 and the definitions of its scores.' },
  },
  'glim-2019': {
    short: 'GLIM 2019',
    cite: 'Cederholm T, Jensen GL, Correia MITD, et al. GLIM criteria for the diagnosis of malnutrition — A consensus report from the global clinical nutrition community. Clin Nutr. 2019;38(1):1-9.',
    pmid: '30181091', doi: '10.1016/j.clnu.2018.08.002',
    used: { tr: 'Malnütrisyon tanısı (en az bir fenotipik ve bir etiyolojik ölçüt) ve evresi (evre 1 orta, evre 2 ağır); ağır malnütrisyonda erken parenteral beslenme.', en: 'Malnutrition diagnosis (at least one phenotypic and one etiologic criterion) and stage (stage 1 moderate, stage 2 severe); early parenteral nutrition in severe malnutrition.' },
  },
  'espen-malnutrition-2015': {
    short: { tr: 'ESPEN 2015 · Malnütrisyon tanısı', en: 'ESPEN 2015 · Malnutrition diagnosis' },
    cite: 'Cederholm T, Bosaeus I, Barazzoni R, et al. Diagnostic criteria for malnutrition — An ESPEN Consensus Statement. Clin Nutr. 2015;34(3):335-340.',
    pmid: '25799486', doi: '10.1016/j.clnu.2015.03.001',
    used: { tr: 'BKİ <18,5 ya da istemsiz kilo kaybı ile yaşa göre düşük BKİ veya cinsiyete göre düşük yağsız kütle indeksi.', en: 'BMI <18.5, or unintentional weight loss with an age-specific low BMI or a sex-specific low fat-free mass index.' },
  },
  'aspen-malnutrition-2012': {
    short: 'AND/ASPEN 2012',
    cite: 'White JV, Guenter P, Jensen G, Malone A, Schofield M; Academy Malnutrition Work Group; A.S.P.E.N. Malnutrition Task Force; A.S.P.E.N. Board of Directors. Consensus statement of the Academy of Nutrition and Dietetics/American Society for Parenteral and Enteral Nutrition: characteristics recommended for the identification and documentation of adult malnutrition (undernutrition). J Acad Nutr Diet. 2012;112(5):730-738.',
    pmid: '22709779', doi: '10.1016/j.jand.2012.03.012',
    used: { tr: 'Altı klinik özellikten en az ikisi (bağlam: akut hastalık, kronik hastalık, sosyal/çevresel); yoğun bakımda kavrama gücü sayılmaz.', en: 'At least two of six clinical characteristics (context: acute illness, chronic illness, social/environmental); grip strength is not counted in the ICU.' },
  },
  'ewgsop2-2019': {
    short: 'EWGSOP2 2019',
    cite: 'Cruz-Jentoft AJ, Bahat G, Bauer J, et al. Sarcopenia: revised European consensus on definition and diagnosis. Age Ageing. 2019;48(1):16-31. Correction: Age Ageing. 2019;48(4):601 (PMID 31081853).',
    pmid: '30312372', doi: '10.1093/ageing/afy169',
    used: { tr: 'Kas gücü (kavrama <27/<16 kg, 5 sandalye kalkışı >15 sn), kas miktarı (ASM <20/<15 kg; ASM/boy² <7,0/<5,5 kg/m², düzeltilmiş kadın eşiği) ve performans (yürüme hızı ≤0,8 m/sn, SPPB ≤8).', en: 'Muscle strength (grip <27/<16 kg, five chair rises >15 s), muscle quantity (ASM <20/<15 kg; ASM/height² <7.0/<5.5 kg/m², corrected female cut-off) and performance (gait speed ≤0.8 m/s, SPPB ≤8).' },
  },
  'icfsr-2018': {
    short: { tr: 'ICFSR 2018 · Sarkopeni', en: 'ICFSR 2018 · Sarcopenia' },
    cite: 'Dent E, Morley JE, Cruz-Jentoft AJ, et al. International Clinical Practice Guidelines for Sarcopenia (ICFSR): Screening, Diagnosis and Management. J Nutr Health Aging. 2018;22(10):1148-1161.',
    pmid: '30498820', doi: '10.1007/s12603-018-1139-9',
    used: { tr: 'Sarkopenide direnç egzersizi (güçlü öneri), protein desteği ya da proteinden zengin diyet (koşullu öneri); D vitamini için öneri yok.', en: 'In sarcopenia resistance exercise (strong), protein supplementation or a protein-rich diet (conditional); no recommendation for vitamin D.' },
  },
  'eat10-2008': {
    short: 'EAT-10',
    cite: 'Belafsky PC, Mouadeb DA, Rees CJ, et al. Validity and reliability of the Eating Assessment Tool (EAT-10). Ann Otol Rhinol Laryngol. 2008;117(12):919-924.',
    pmid: '19140539', doi: '10.1177/000348940811701210',
    used: { tr: 'EAT-10 toplam puanı ≥3 anormal kabul edilir.', en: 'An EAT-10 total of 3 or more is abnormal.' },
  },
  'eat10-tr-2016': {
    short: { tr: 'EAT-10 Türkçe', en: 'EAT-10 Turkish' },
    cite: 'Demir N, Serel Arslan S, İnal Ö, Karaduman AA. Reliability and Validity of the Turkish Eating Assessment Tool (T-EAT-10). Dysphagia. 2016;31(5):644-649.',
    pmid: '27405421', doi: '10.1007/s00455-016-9723-9',
    used: { tr: 'Türkçe formun geçerliliği ve güvenilirliği; anket maddeleri bu sayfada çoğaltılmaz.', en: 'Validity and reliability of the Turkish form; the questionnaire items are not reproduced here.' },
  },
  'fois-2005': {
    short: 'FOIS',
    cite: 'Crary MA, Mann GD, Groher ME. Initial psychometric assessment of a functional oral intake scale for dysphagia in stroke patients. Arch Phys Med Rehabil. 2005;86(8):1516-1520.',
    pmid: '16084801', doi: '10.1016/j.apmr.2004.11.049',
    used: { tr: 'Yedi düzeyli işlevsel ağızdan alım ölçeği: 1–3 tüple beslenme, 4–6 kısıtlamalı ağızdan, 7 kısıtlamasız.', en: 'Seven-level functional oral intake scale: 1–3 tube dependent, 4–6 oral with restrictions, 7 unrestricted.' },
  },
  'iddsi-2017': {
    short: 'IDDSI',
    cite: 'Cichero JAY, Lam P, Steele CM, et al. Development of International Terminology and Definitions for Texture-Modified Foods and Thickened Fluids Used in Dysphagia Management: The IDDSI Framework. Dysphagia. 2017;32(2):293-314.',
    pmid: '27913916', doi: '10.1007/s00455-016-9758-y', url: 'https://www.iddsi.org/resources/framework-documents',
    used: { tr: 'Yiyecek (3–7) ve içecek (0–4) kıvam düzeyleri; ONS ve sıvıların kıvamı.', en: 'Food (3–7) and drink (0–4) texture levels; thickness of ONS and drinks.' },
  },
  // Laboratory indices (labs.mjs): context only, no dose change.
  'nlr-2001': {
    short: 'NLR',
    cite: 'Zahorec R. Ratio of neutrophil to lymphocyte counts — rapid and simple parameter of systemic inflammation and stress in critically ill. Bratisl Lek Listy. 2001;102(1):5-14.',
    pmid: '11723675',
    used: { tr: 'Nötrofil/lenfosit oranı: sistemik inflamasyon ve stres göstergesi (bilgi amaçlı).', en: 'Neutrophil-to-lymphocyte ratio: a marker of systemic inflammation and stress (context only).' },
  },
  'pni-1984': {
    short: 'PNI (Onodera 1984)',
    cite: 'Onodera T, Goseki N, Kosaki G. Prognostic nutritional index in gastrointestinal surgery of malnourished cancer patients. Nihon Geka Gakkai Zasshi. 1984;85(9):1001-1005.',
    pmid: '6438478',
    used: { tr: 'PNI = 10 × albümin (g/dL) + 0,005 × lenfosit (/mm³); özgün çalışmada cerrahi risk göstergesi. Albümin malnütrisyon ölçütü değildir.', en: 'PNI = 10 × albumin (g/dL) + 0.005 × lymphocytes (/mm³); a surgical risk index in the original study. Albumin is not a malnutrition criterion.' },
  },
  'ucr-trauma-2019': {
    short: { tr: 'Üre/kreatinin · Haines 2019', en: 'Urea/creatinine · Haines 2019' },
    cite: 'Haines RW, Zolfaghari P, Wan Y, Pearse RM, Puthucheary Z, Prowle JR. Elevated urea-to-creatinine ratio provides a biochemical signature of muscle catabolism and persistent critical illness after major trauma. Intensive Care Med. 2019;45(12):1718-1731.',
    pmid: '31531715', doi: '10.1007/s00134-019-05760-5',
    used: { tr: 'Molar üre/kreatinin oranının artışı travma sonrası uzamış kritik hastalıkta kas yıkımıyla ilişkili bulundu (araştırma belirteci).', en: 'A rising molar urea/creatinine ratio accompanied muscle wasting in persistent critical illness after trauma (research marker).' },
  },
  'ucr-crrt-2025': {
    short: { tr: 'Üre/kreatinin · CRRT 2025', en: 'Urea/creatinine · CRRT 2025' },
    cite: 'Markl-Le Levé A, Hillinger P, Woyke S, et al. The Urea-Creatinine Ratio as Marker of Catabolism Is Affected by Continuous Renal Replacement Therapy. Diagnostics (Basel). 2025;15(11):1408.',
    pmid: '40506980', doi: '10.3390/diagnostics15111408',
    used: { tr: 'Sürekli böbrek replasman tedavisi üre/kreatinin oranını düşürür; çalışmada yüksek grup ≥75 (mg/dL:mg/dL).', en: 'Continuous kidney replacement therapy lowers the urea/creatinine ratio; the study\'s high group was ≥75 (mg/dL:mg/dL).' },
  },
  'ueg-esnm-2025': {
    short: { tr: 'UEG/ESNM 2025 · Disfaji', en: 'UEG/ESNM 2025 · Dysphagia' },
    cite: 'Mari A, Calabrese F, Pasta A, et al. Esophageal and Oropharyngeal Dysphagia: Clinical Recommendations From the United European Gastroenterology and European Society for Neurogastroenterology and Motility. United European Gastroenterol J. 2025;13(6):855-901.',
    pmid: '40543044', doi: '10.1002/ueg2.70062',
    used: { tr: 'Orofaringeal disfajide enstrümantal değerlendirme (VFSS, FEES) ve yutma terapisi.', en: 'Instrumental assessment (VFSS, FEES) and swallowing therapy in oropharyngeal dysphagia.' },
  },
};

export const PROTEIN_TRIALS = ['effort-protein-2023', 'precise-2024', 'target-protein-2025'];
