// Manufacturer nutrition facts reviewed 2026-11-20; not an automatic prescription.
// Exact source/package bases are retained. Unknown water remains null.
// Numeric catalog IDs are persistence identifiers: append new IDs; never renumber.
// No network access, third-party package, or patient data is used by this module.
export const CATALOG_DATE = '2026-11-20';

const immutable = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) immutable(child);
    Object.freeze(value);
  }
  return value;
};

export const FORMULAS = immutable([
  {
    "id": "resource-protein-tr-200",
    "catalogId": 1001,
    "name": "Resource Protein — Turkey, 200 mL",
    "manufacturer": "Nestlé Health Science",
    "country": "TR",
    "market": "TR",
    "route": "both",
    "oral": true,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.25,
    "proteinPer100": 9.4,
    "waterPer100": null,
    "basis": {
      "volumeMl": 200,
      "energyKcal": 250,
      "proteinG": 18.8
    },
    "servingMl": 200,
    "packSizesMl": [
      200
    ],
    "sku": "resource-protein-tr-200",
    "sourceUrl": "https://www.nestlehealthscience.com.tr/markalar/resource/resource-protein",
    "url": "https://www.nestlehealthscience.com.tr/markalar/resource/resource-protein",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "0a739fafae87abbdf037592900876954d785df6ab8926090c1bb664e3fea156f",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "flavours": [
      "vanilla",
      "strawberry",
      "apricot",
      "chocolate"
    ],
    "allergens": [
      "milk",
      "lactose"
    ],
    "flavourVariation": "Chocolate: K190 vs155mg/100mL;Cl65 vs100mg/100mL;osmolarity450 vs390mOsm/L. Exact flavour label controls."
  },
  {
    "id": "resource-20-tr-200",
    "catalogId": 1002,
    "name": "Resource 2.0 — Turkey, 200 mL",
    "manufacturer": "Nestlé Health Science",
    "country": "TR",
    "market": "TR",
    "route": "both",
    "oral": true,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 2.0,
    "proteinPer100": 9.0,
    "waterPer100": null,
    "basis": {
      "volumeMl": 200,
      "energyKcal": 400,
      "proteinG": 18
    },
    "servingMl": 200,
    "packSizesMl": [
      200
    ],
    "sku": "resource-20-tr-200",
    "sourceUrl": "https://www.nestlehealthscience.com.tr/markalar/resource/resource-2-0",
    "url": "https://www.nestlehealthscience.com.tr/markalar/resource/resource-2-0",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "39353cd5177935c7aba45dda873bb96b40bb1d94c114e6f9bf0607c1526775a1",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "flavours": [
      "apricot",
      "vanilla"
    ],
    "allergens": [
      "milk",
      "lactose"
    ],
    "manufacturerDailyDoseNotice": "TR page specifies supplementary200–400mL; sole-source no more than4x200mL unless clinician advises otherwise. Do not treat this as a patient prescription."
  },
  {
    "id": "resource-20-fibre-tr-190",
    "catalogId": 1003,
    "name": "Resource 2.0 Fibre — Turkey, 190 mL",
    "manufacturer": "Nestlé Health Science",
    "country": "TR",
    "market": "TR",
    "route": "both",
    "oral": true,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 2.0,
    "proteinPer100": 9.000000000000002,
    "waterPer100": null,
    "basis": {
      "volumeMl": 190,
      "energyKcal": 380,
      "proteinG": 17.1
    },
    "servingMl": 190,
    "packSizesMl": [
      190
    ],
    "sku": "resource-20-fibre-tr-190",
    "sourceUrl": "https://www.nestlehealthscience.com.tr/markalar/resource/resource-2-0-fibre",
    "url": "https://www.nestlehealthscience.com.tr/markalar/resource/resource-2-0-fibre",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "4427e0999b64fdc56bdfa292d2e902be654f870e095058ac1a8322c548038762",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "flavours": [
      "forest-fruits",
      "strawberry",
      "vanilla"
    ],
    "allergens": [
      "milk",
      "lactose"
    ],
    "variantWarning": "TR190mL tetra pack differs from200mL versions in other markets.",
    "fibreGPer100Ml": 2.5
  },
  {
    "id": "resource-diabet-tr-200",
    "catalogId": 1004,
    "name": "Resource Diabet — Turkey, 200 mL",
    "manufacturer": "Nestlé Health Science",
    "country": "TR",
    "market": "TR",
    "route": "both",
    "oral": true,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.0,
    "proteinPer100": 7.000000000000001,
    "waterPer100": null,
    "basis": {
      "volumeMl": 200,
      "energyKcal": 200,
      "proteinG": 14
    },
    "servingMl": 200,
    "packSizesMl": [
      200
    ],
    "sku": "resource-diabet-tr-200",
    "sourceUrl": "https://www.nestlehealthscience.com.tr/markalar/resource/resource-diabet",
    "url": "https://www.nestlehealthscience.com.tr/markalar/resource/resource-diabet",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "7e823257f4f4600d5b16c68c956600ab7b78932ec003f37c2a3ac6b0809c4913",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "flavours": [
      "vanilla",
      "strawberry",
      "coffee"
    ],
    "allergens": [
      "milk",
      "lactose",
      "soy"
    ],
    "indicationTag": "diabetes-specific reference; does not automatically replace ICU glycaemic management",
    "fibreGPer100Ml": 2
  },
  {
    "id": "nutrison-tr-500",
    "catalogId": 1005,
    "name": "Nutrison — Turkey, 500 mL",
    "manufacturer": "Nutricia / Danone",
    "country": "TR",
    "market": "TR",
    "route": "tube",
    "oral": false,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.0,
    "proteinPer100": 4.0,
    "waterPer100": null,
    "basis": {
      "volumeMl": 100,
      "energyKcal": 100,
      "proteinG": 4
    },
    "servingMl": 500,
    "packSizesMl": [
      500
    ],
    "sku": "nutrison-tr-500",
    "sourceUrl": "https://www.nutricia.com/tr-tr/urunlerimiz/nutrison",
    "url": "https://www.nutricia.com/tr-tr/urunlerimiz/nutrison",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "83ab44ef6fc7b8bf5022938602838841583a7082ade3395afb1e51eea24df381",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "allergens": [
      "milk",
      "soy",
      "fish-oil"
    ],
    "contraindications": [
      "galactosaemia"
    ]
  },
  {
    "id": "fortimel-energy-tr",
    "catalogId": 1006,
    "name": "Fortimel Energy — Turkey",
    "manufacturer": "Nutricia / Danone",
    "country": "TR",
    "market": "TR",
    "route": "oral",
    "oral": true,
    "tube": false,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.5,
    "proteinPer100": 5.9,
    "waterPer100": null,
    "basis": {
      "volumeMl": 100,
      "energyKcal": 150,
      "proteinG": 5.9
    },
    "servingMl": null,
    "packSizesMl": [],
    "sku": "fortimel-energy-tr",
    "sourceUrl": "https://www.nutricia.com/tr-tr/urunlerimiz/fortimel-energy",
    "url": "https://www.nutricia.com/tr-tr/urunlerimiz/fortimel-energy",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "6b60a2b1552f28de1646cebce63614485a3d9cd73683357c7c3dac2f1770acdf",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero.",
      "This record establishes oral use only; it does not establish tube compatibility."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir.",
      "Bu kayıt yalnız oral kullanımı destekler; tüple uygulama uygunluğunu göstermez."
    ],
    "flavours": [
      "banana",
      "strawberry",
      "chocolate"
    ],
    "allergens": [
      "milk",
      "soy"
    ],
    "flavourVariation": "Chocolate has0.3g fibre/100mL and450mOsm/L; banana/strawberry no declared fibre,455mOsm/L. Package volume not established by reviewedTRtext.",
    "contraindications": [
      "galactosaemia"
    ]
  },
  {
    "id": "resource-energy-ch-200",
    "catalogId": 1007,
    "name": "Resource Energy — Switzerland, 200 mL",
    "manufacturer": "Nestlé Health Science",
    "country": "CH",
    "market": "CH",
    "route": "oral",
    "oral": true,
    "tube": false,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.51,
    "proteinPer100": 5.6,
    "waterPer100": null,
    "basis": {
      "volumeMl": 200,
      "energyKcal": 302,
      "proteinG": 11.2
    },
    "servingMl": 200,
    "packSizesMl": [
      200
    ],
    "sku": "resource-energy-ch-200",
    "sourceUrl": "https://www.nestlehealthscience.ch/sites/default/files/2024-12/Resource_Energy_DE.pdf",
    "url": "https://www.nestlehealthscience.ch/sites/default/files/2024-12/Resource_Energy_DE.pdf",
    "checkedAt": "2026-11-20",
    "sourceDate": "2024-12 (URL folder; internal revision not established)",
    "sourceSnapshotSha256": "4b8830f18f0ec4627582d30522c35ff18165642a191d4c9c4fc56559d00ced67",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero.",
      "This record establishes oral use only; it does not establish tube compatibility."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir.",
      "Bu kayıt yalnız oral kullanımı destekler; tüple uygulama uygunluğunu göstermez."
    ],
    "allergens": [
      "milk",
      "soy"
    ],
    "variantWarning": "Swiss label151kcal/100mL; not silently interchangeable with generic1.5kcal/mL or unverifiedTRResourceEnergy.",
    "labelRevisionRecency": "Current accessible manufacturer sheet; newer revision not excluded."
  },
  {
    "id": "jevity-15-us-rth1000",
    "catalogId": 1008,
    "name": "Jevity 1.5 Cal — US, 1 L RTH",
    "manufacturer": "Abbott",
    "country": "US",
    "market": "US",
    "route": "tube",
    "oral": false,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.5,
    "proteinPer100": 6.38,
    "waterPer100": 76,
    "basis": {
      "volumeMl": 1000,
      "energyKcal": 1500,
      "proteinG": 63.8
    },
    "servingMl": 1000,
    "packSizesMl": [
      1000
    ],
    "sku": "62681",
    "sourceUrl": "https://www.abbottnutrition.com/our-products/jevity-1_5-cal",
    "url": "https://www.abbottnutrition.com/our-products/jevity-1_5-cal",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "bc7648f9f05a2aee3257dbdfc4dcabd78ed0b72d49fc86ae3cdddcf612cb4dfa",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın."
    ],
    "allergens": [
      "milk",
      "soy"
    ],
    "variantWarning": "1L RTH basis only;237mL carton and1.5L have separate declared rounded nutrient amounts."
  },
  {
    "id": "glucerna-15-us-rth1000",
    "catalogId": 1009,
    "name": "Glucerna 1.5 Cal — US, 1 L RTH",
    "manufacturer": "Abbott",
    "country": "US",
    "market": "US",
    "route": "both",
    "oral": true,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.5,
    "proteinPer100": 8.270000000000001,
    "waterPer100": null,
    "basis": {
      "volumeMl": 1000,
      "energyKcal": 1500,
      "proteinG": 82.7
    },
    "servingMl": 1000,
    "packSizesMl": [
      1000
    ],
    "sku": "glucerna-15-us-rth1000",
    "sourceUrl": "https://www.abbottnutrition.com/our-products/glucerna-1_5-cal",
    "url": "https://www.abbottnutrition.com/our-products/glucerna-1_5-cal",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "de310a4f1ab98f5967696a977063189565a85acf77110d1299f729f8340b16f5",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "indicationTag": "diabetes-specific reference",
    "waterGramsPer100Ml": 75.9,
    "waterUnitWarning": "Manufacturer water declaration is grams; no silent exactg→mL conversion."
  },
  {
    "id": "osmolite-12-us-rth1000",
    "catalogId": 1010,
    "name": "Osmolite 1.2 Cal — US, 1 L RTH",
    "manufacturer": "Abbott",
    "country": "US",
    "market": "US",
    "route": "tube",
    "oral": false,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.2,
    "proteinPer100": 5.55,
    "waterPer100": 82,
    "basis": {
      "volumeMl": 1000,
      "energyKcal": 1200,
      "proteinG": 55.5
    },
    "servingMl": 1000,
    "packSizesMl": [
      1000
    ],
    "sku": "62697",
    "sourceUrl": "https://www.abbottnutrition.com/our-products/osmolite-1_2-cal",
    "url": "https://www.abbottnutrition.com/our-products/osmolite-1_2-cal",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "0b3fc21cd43a084912dccfa3f42f2dd4ae6e0740ec25e6ce7d3e73cf012013b3",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın."
    ],
    "allergens": [
      "milk",
      "soy"
    ],
    "fibreGPer100Ml": 0,
    "oralUseConditional": "Manufacturer allows oral use for altered taste perception; not added as generaloral route."
  },
  {
    "id": "nepro-us-rth1000",
    "catalogId": 1011,
    "name": "Nepro with CARBSTEADY — US, 1 L RTH",
    "manufacturer": "Abbott",
    "country": "US",
    "market": "US",
    "route": "both",
    "oral": true,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.77,
    "proteinPer100": 8.1,
    "waterPer100": 72.7,
    "basis": {
      "volumeMl": 1000,
      "energyKcal": 1770,
      "proteinG": 81
    },
    "servingMl": 1000,
    "packSizesMl": [
      1000
    ],
    "sku": "62669",
    "sourceUrl": "https://www.abbottnutrition.com/our-products/nepro-with-carbsteady",
    "url": "https://www.abbottnutrition.com/our-products/nepro-with-carbsteady",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "f06009f940e58cfa20dc0ede5af55c8afa24aaba2468798cfc3653eef460259e",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın."
    ],
    "variantWarning": "Numeric1L label1770kcal is used; marketing says1.8Cal/mL and237mL serving says420kcal. Not silently interchangeable acrosspackagebasis.",
    "indicationTag": "dialysis / stage5 CKD; not genericpredialysisrenal formula"
  },
  {
    "id": "twocal-hn-us-rth1000",
    "catalogId": 1012,
    "name": "TwoCal HN — US, 1 L RTH",
    "manufacturer": "Abbott",
    "country": "US",
    "market": "US",
    "route": "both",
    "oral": true,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 2.0,
    "proteinPer100": 8.35,
    "waterPer100": 70,
    "basis": {
      "volumeMl": 1000,
      "energyKcal": 2000,
      "proteinG": 83.5
    },
    "servingMl": 1000,
    "packSizesMl": [
      1000
    ],
    "sku": "68048",
    "sourceUrl": "https://www.abbottnutrition.com/our-products/twocal-hn",
    "url": "https://www.abbottnutrition.com/our-products/twocal-hn",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "9c1b215c05c54d5fd363b5c21f6bb95db7dd752087f0e4d4dc24beb04e5ee37f",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın."
    ],
    "indicationTag": "energy/protein dense; fluidrestriction context requiresclinicianreview"
  },
  {
    "id": "ensure-plus-us-237",
    "catalogId": 1013,
    "name": "Ensure Plus Nutrition Shake — US, 237 mL",
    "manufacturer": "Abbott",
    "country": "US",
    "market": "US",
    "route": "oral",
    "oral": true,
    "tube": false,
    "complete": true,
    "soleSource": "interim-sole-source",
    "form": "liquid",
    "kcalPerMl": 1.4767932489451476,
    "proteinPer100": 6.751054852320674,
    "waterPer100": null,
    "basis": {
      "volumeMl": 237,
      "energyKcal": 350,
      "proteinG": 16
    },
    "servingMl": 237,
    "packSizesMl": [
      237
    ],
    "sku": "57263 vanilla bottle",
    "sourceUrl": "https://www.abbottnutrition.com/our-products/ensure-plus-nutrition-shake",
    "url": "https://www.abbottnutrition.com/our-products/ensure-plus-nutrition-shake",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "890cbf22699dd6a3e1ca1681d415df376a67274132c1c28023767b425604f423",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero.",
      "This record establishes oral use only; it does not establish tube compatibility."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir.",
      "Bu kayıt yalnız oral kullanımı destekler; tüple uygulama uygunluğunu göstermez."
    ],
    "variantWarning": "Use actual350kcal/237mL and16g/237mL labelbasis; generic1.5Cal/mL is rounded marketing density. Not Ensure Plus Therapeutic / HighProtein / TR220mL."
  },
  {
    "id": "nutrison-energy-uk-500",
    "catalogId": 1014,
    "name": "Nutrison Energy — UK, 500 mL",
    "manufacturer": "Nutricia / Danone",
    "country": "GB",
    "market": "GB",
    "route": "tube",
    "oral": false,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.5,
    "proteinPer100": 6.0,
    "waterPer100": null,
    "basis": {
      "volumeMl": 100,
      "energyKcal": 150,
      "proteinG": 6
    },
    "servingMl": 500,
    "packSizesMl": [
      500,
      1000,
      1500
    ],
    "sku": "nutrison-energy-uk-500",
    "sourceUrl": "https://www.nutricia.co.uk/hcp/products/nutrison-energy/",
    "url": "https://www.nutricia.co.uk/hcp/products/nutrison-energy/",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "e28279bfe317f8157bdb1a4c85fae291cba0ecc5fdea019d420de7536fa833ca",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "waterGramsPer100Ml": 78,
    "waterUnitWarning": "Source water is g/100mL, not a verified exactmL volume."
  },
  {
    "id": "nutrison-protein-advance-uk-500",
    "catalogId": 1015,
    "name": "Nutrison Protein Advance — UK, 500 mL",
    "manufacturer": "Nutricia / Danone",
    "country": "GB",
    "market": "GB",
    "route": "tube",
    "oral": false,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.28,
    "proteinPer100": 7.5,
    "waterPer100": null,
    "basis": {
      "volumeMl": 500,
      "energyKcal": 640,
      "proteinG": 37.5
    },
    "servingMl": 500,
    "packSizesMl": [
      500
    ],
    "sku": "nutrison-protein-advance-uk-500",
    "sourceUrl": "https://www.nutricia.co.uk/hcp/products/nutrison-protein-advance/",
    "url": "https://www.nutricia.co.uk/hcp/products/nutrison-protein-advance/",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "0cda1ee1840b4a09d5a6c54784e7669f836c40c46a205f1325117416b9cf2260",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "contraindications": [
      "galactosaemia",
      "need for fibre-free diet"
    ],
    "fibreGPer100Ml": 1.5,
    "waterGramsPer100Ml": 79,
    "waterUnitWarning": "Source water is g/100mL, not a verified exactmL volume."
  },
  {
    "id": "fortimel-advanced-pt-200",
    "catalogId": 1016,
    "name": "Fortimel Advanced — Portugal, 200 mL",
    "manufacturer": "Nutricia / Danone",
    "country": "PT",
    "market": "PT",
    "route": "oral",
    "oral": true,
    "tube": false,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.5,
    "proteinPer100": 10.4,
    "waterPer100": null,
    "basis": {
      "volumeMl": 200,
      "energyKcal": 300,
      "proteinG": 20.8
    },
    "servingMl": 200,
    "packSizesMl": [
      200
    ],
    "sku": "7094169 tropicalvanilla;7094177 wildstrawberry",
    "sourceUrl": "https://nutricia.pt/portfolio/fortimel-advanced/",
    "url": "https://nutricia.pt/portfolio/fortimel-advanced/",
    "checkedAt": "2026-11-20",
    "sourceDate": null,
    "sourceSnapshotSha256": "6c95404b8f743a0edcdaf15ab037edbf1613808fe61916514b22f7ef6fb2fb08",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero.",
      "This record establishes oral use only; it does not establish tube compatibility."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir.",
      "Bu kayıt yalnız oral kullanımı destekler; tüple uygulama uygunluğunu göstermez."
    ],
    "indicationTag": "DRM with muscleloss/sarcopenia; leucine/whey/vitaminD claim not automaticICU aminoaciddose"
  },
  {
    "id": "fresubin-2kcal-drink-global-200",
    "catalogId": 1017,
    "name": "Fresubin 2 KCAL Drink — Germany-issued global reference, 200 mL",
    "manufacturer": "Fresenius Kabi",
    "country": "GLOBAL-REFERENCE",
    "market": "GLOBAL-REFERENCE",
    "route": "oral",
    "oral": true,
    "tube": false,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 2.0,
    "proteinPer100": 10.0,
    "waterPer100": null,
    "basis": {
      "volumeMl": 200,
      "energyKcal": 400,
      "proteinG": 20
    },
    "servingMl": 200,
    "packSizesMl": [
      200
    ],
    "sku": "fresubin-2kcal-drink-global-200",
    "sourceUrl": "https://www.fresubin.com/content/dam/fresubin/global/content/documents/hcp-documents/sip-feeds/Fresubin_2kcal%28Fibre%29_Drink_FS_Aug2026.pdf.coredownload.inline.pdf",
    "url": "https://www.fresubin.com/content/dam/fresubin/global/content/documents/hcp-documents/sip-feeds/Fresubin_2kcal%28Fibre%29_Drink_FS_Aug2026.pdf.coredownload.inline.pdf",
    "checkedAt": "2026-11-20",
    "sourceDate": "2026-08",
    "sourceSnapshotSha256": "8d7e31f883ecc3e995a402bb402ff5bff581641eea2915dcd6062d65b22aed32",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero.",
      "This record establishes oral use only; it does not establish tube compatibility."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir.",
      "Bu kayıt yalnız oral kullanımı destekler; tüple uygulama uygunluğunu göstermez."
    ],
    "allergens": [
      "milk",
      "soy (flavour dependent)"
    ],
    "flavourVariation": "Water and micronutrients vary byflavour; exactcurrent bottle required.",
    "notFor": [
      "shock",
      "ileus",
      "acute GI bleeding",
      "galactosaemia"
    ],
    "fibreGPer100Ml": 0
  },
  {
    "id": "fresubin-2kcal-fibre-drink-global-200",
    "catalogId": 1018,
    "name": "Fresubin 2 KCAL FIBRE Drink — Germany-issued global reference, 200 mL",
    "manufacturer": "Fresenius Kabi",
    "country": "GLOBAL-REFERENCE",
    "market": "GLOBAL-REFERENCE",
    "route": "oral",
    "oral": true,
    "tube": false,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 2.0,
    "proteinPer100": 10.0,
    "waterPer100": null,
    "basis": {
      "volumeMl": 200,
      "energyKcal": 400,
      "proteinG": 20
    },
    "servingMl": 200,
    "packSizesMl": [
      200
    ],
    "sku": "fresubin-2kcal-fibre-drink-global-200",
    "sourceUrl": "https://www.fresubin.com/content/dam/fresubin/global/content/documents/hcp-documents/sip-feeds/Fresubin_2kcal%28Fibre%29_Drink_FS_Aug2026.pdf.coredownload.inline.pdf",
    "url": "https://www.fresubin.com/content/dam/fresubin/global/content/documents/hcp-documents/sip-feeds/Fresubin_2kcal%28Fibre%29_Drink_FS_Aug2026.pdf.coredownload.inline.pdf",
    "checkedAt": "2026-11-20",
    "sourceDate": "2026-08",
    "sourceSnapshotSha256": "8d7e31f883ecc3e995a402bb402ff5bff581641eea2915dcd6062d65b22aed32",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero.",
      "This record establishes oral use only; it does not establish tube compatibility."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir.",
      "Bu kayıt yalnız oral kullanımı destekler; tüple uygulama uygunluğunu göstermez."
    ],
    "allergens": [
      "milk",
      "soy/wheat (flavour dependent)"
    ],
    "notFor": [
      "shock",
      "ileus",
      "acute GI bleeding",
      "galactosaemia"
    ],
    "fibreGPer100MlRange": [
      1.5,
      1.6
    ]
  },
  {
    "id": "kate-standard14-plain-us-325",
    "catalogId": 1019,
    "name": "Kate Farms Standard 1.4 Plain — US, 325 mL",
    "manufacturer": "Kate Farms",
    "country": "US",
    "market": "US",
    "route": "both",
    "oral": true,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.4,
    "proteinPer100": 6.153846153846154,
    "waterPer100": null,
    "basis": {
      "volumeMl": 325,
      "energyKcal": 455,
      "proteinG": 20
    },
    "servingMl": 325,
    "packSizesMl": [
      325
    ],
    "sku": "UPC811112030010",
    "sourceUrl": "https://a.storyblok.com/f/291244382230735/885075/a244664335/kate_farms_standard_1-4_plain_-_product_detail_sheet.pdf",
    "url": "https://a.storyblok.com/f/291244382230735/885075/a244664335/kate_farms_standard_1-4_plain_-_product_detail_sheet.pdf",
    "checkedAt": "2026-11-20",
    "sourceDate": "2026-07",
    "sourceSnapshotSha256": "6ce43b22b1a70adb10b0f4ea79d6ee7159ec3406e9aff4e6922e565d18cb78ff",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "variantWarning": "Carton455kcal/20g per325mL; sheet1L reference1400kcal/62g roundsprotein differently. This record is325mL carton only.",
    "freeWaterPercent": 71,
    "waterUnitWarning": "Sheet gives free water71%; exact watermL not separately declared.",
    "visualTableChecked": true
  },
  {
    "id": "kate-standard10-vanilla-us-325",
    "catalogId": 1020,
    "name": "Kate Farms Standard 1.0 Vanilla — US, 325 mL",
    "manufacturer": "Kate Farms",
    "country": "US",
    "market": "US",
    "route": "both",
    "oral": true,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.0,
    "proteinPer100": 4.923076923076923,
    "waterPer100": null,
    "basis": {
      "volumeMl": 325,
      "energyKcal": 325,
      "proteinG": 16
    },
    "servingMl": 325,
    "packSizesMl": [
      325
    ],
    "sku": "UPC851823006638",
    "sourceUrl": "https://a.storyblok.com/f/291244382230735/1120874/6c50b1f1e4/kate_farms_standard_1-0_vanilla_-_product_detail_sheet.pdf",
    "url": "https://a.storyblok.com/f/291244382230735/1120874/6c50b1f1e4/kate_farms_standard_1-0_vanilla_-_product_detail_sheet.pdf",
    "checkedAt": "2026-11-20",
    "sourceDate": "2025-12",
    "sourceSnapshotSha256": "b98e707f9a2831c315ba26ba61d93a3e52fc9090f4d47c236effa4ae36dc52cc",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "variantWarning": "Carton16g/325mL; 1L reference49g roundsprotein differently.",
    "freeWaterPercent": 79,
    "waterUnitWarning": "Sheet gives free water79%; exact watermL not separately declared."
  },
  {
    "id": "kate-peptide15-vanilla-us-325",
    "catalogId": 1021,
    "name": "Kate Farms Peptide 1.5 Vanilla — US, 325 mL",
    "manufacturer": "Kate Farms",
    "country": "US",
    "market": "US",
    "route": "both",
    "oral": true,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.5384615384615385,
    "proteinPer100": 7.384615384615385,
    "waterPer100": null,
    "basis": {
      "volumeMl": 325,
      "energyKcal": 500,
      "proteinG": 24
    },
    "servingMl": 325,
    "packSizesMl": [
      325
    ],
    "sku": "UPC851823006478",
    "sourceUrl": "https://a.storyblok.com/f/291244382230735/885805/3d28334bed/kate_farms_peptide_1-5_vanilla_-_product_detail_sheet.pdf",
    "url": "https://a.storyblok.com/f/291244382230735/885805/3d28334bed/kate_farms_peptide_1-5_vanilla_-_product_detail_sheet.pdf",
    "checkedAt": "2026-11-20",
    "sourceDate": "2025-12",
    "sourceSnapshotSha256": "8e61d853725115d38dad60d1a7d50ce5eb7f25b07b2bf01ed540dd7dc29995f0",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "variantWarning": "Marketing1.5cal/mL; actual carton table500kcal/325mL=1.53846 and24gprotein. Preserve packagebasis; do not round to1.5 in arithmetic.",
    "freeWaterPercent": 70,
    "waterUnitWarning": "Sheet gives free water70%; exact watermL not separately declared.",
    "visualTableChecked": true
  },
  {
    "id": "kate-renal18-vanilla-us-250",
    "catalogId": 1022,
    "name": "Kate Farms Renal Support 1.8 Vanilla — US, 250 mL",
    "manufacturer": "Kate Farms",
    "country": "US",
    "market": "US",
    "route": "both",
    "oral": true,
    "tube": true,
    "complete": true,
    "soleSource": true,
    "form": "liquid",
    "kcalPerMl": 1.8,
    "proteinPer100": 8.0,
    "waterPer100": null,
    "basis": {
      "volumeMl": 250,
      "energyKcal": 450,
      "proteinG": 20
    },
    "servingMl": 250,
    "packSizesMl": [
      250
    ],
    "sku": "UPC811112030645",
    "sourceUrl": "https://a.storyblok.com/f/291244382230735/958759/bf12a5d612/kate_farms_renal_support_1-8_vanilla_-_product_detail_sheet.pdf",
    "url": "https://a.storyblok.com/f/291244382230735/958759/bf12a5d612/kate_farms_renal_support_1-8_vanilla_-_product_detail_sheet.pdf",
    "checkedAt": "2026-11-20",
    "sourceDate": "2026-07",
    "sourceSnapshotSha256": "11ff183a5997a4685ac91f317784f14f694eb463814f1f3c23cad07023cf606e",
    "requiresLabelConfirmation": true,
    "labelVerified": false,
    "patientSuitabilityConfirmed": false,
    "sourceStatus": "manufacturer-reference",
    "adult": true,
    "warnings": [
      "Verify the exact market, SKU, flavour, current container label, route and patient suitability before calculation.",
      "Do not increase volume to close protein deficit beyond the agreed energy/fluid/phase limits.",
      "Exact free-water volume is not established by this reference; enter and verify it from the current label if required. It is not zero."
    ],
    "warningsTr": [
      "Hesaplamadan önce ülke, ürün kodu, aroma, güncel ambalaj etiketi, uygulama yolu ve hastaya uygunluğu doğrulayın.",
      "Protein açığını kapatmak için kararlaştırılmış enerji, sıvı ve beslenme evresi sınırlarını aşacak hacim artışı yapmayın.",
      "Bu kaynakta kesin serbest su hacmi doğrulanmadı; gerekiyorsa güncel etiketten girip doğrulayın. Bilinmeyen su miktarı sıfır değildir."
    ],
    "indicationTag": "dialysis-specific reference; not generically predialysisrenal",
    "freeWaterPercent": 66,
    "waterUnitWarning": "Sheet gives free water66%; exact watermL not separately declared.",
    "visualTableChecked": true
  }
]);

export const COVERAGE = immutable({
  "scope": "Bounded adultoral/tubeformula manufacturerreferencecatalog, Turkey plus explicitinternationalmarketvariants. Not all products on the worldwide/Turkeymarket.",
  "reviewDate": "2026-11-20",
  "verifiedReferenceRecordCount": 22,
  "manufacturers": [
    "Nestlé Health Science",
    "Nutricia / Danone",
    "Abbott",
    "Fresenius Kabi",
    "Kate Farms"
  ],
  "registrySource": {
    "url": "https://titck.gov.tr/dinamikmodul/132",
    "publicationDate": "2026-09-30",
    "localFile": "formula-primary-sources/titck-market20260930-xlsx.xlsx",
    "caveat": "31sheetrows;newlicensedFSMPentries mainlysince2024, not a complete currentlegacymarket list. No nutritionalcomposition inferred fromlisting."
  },
  "allMarketProductsCovered": false,
  "latestWorldwideLabelsGuaranteed": false,
  "pendingCoverage": [
    {
      "family": "Resource Energy Turkey",
      "status": "officialTRdescriptionavailable-composition-not-exposed",
      "url": "https://www.nestlehealthscience.com.tr/markalar/resource/energy",
      "missing": [
        "TR-specificcurrentkcal/protein/water/route/SKU"
      ]
    },
    {
      "family": "Nestlé Isosource Turkey",
      "status": "TRfamilyURL403-no-bypass",
      "url": "https://www.nestlehealthscience.com.tr/markalar/isosource",
      "missing": [
        "currentTRvariantsandlabels"
      ]
    },
    {
      "family": "Nestlé Novasource / Peptamen / Impact / Compleat, international",
      "status": "family-discovery-only",
      "missing": [
        "exactcountry/SKU/currentcomposition",
        "indication-specificrouteandrestrictions"
      ]
    },
    {
      "family": "Abbott Ensure / Jevity / Glucerna / Osmolite Turkey",
      "status": "TR-specificofficialmanufacturerlabelnotestablished",
      "missing": [
        "currentTRproductvariantsandnutritiontables"
      ]
    },
    {
      "family": "Fresenius Turkey Fresubin / Diben / Survimed / Supportan",
      "status": "TR-specificofficialmanufacturerlabelnotestablished",
      "missing": [
        "currentTRproductvariantsandnutritiontables"
      ]
    },
    {
      "family": "Fresenius Diben / Survimed / FresubinHP / Renal / Hepa international",
      "status": "official2025overviewdownloadexceededearlier12MBbound-not-used;olderindividual2023sheetnotclaimedlatest",
      "missing": [
        "latestcompleteverifiableprimaryspecificsheet"
      ]
    },
    {
      "family": "Nutricia other Nutrison / Fortimel / Nutridrink variants",
      "status": "partiallydiscovered-countryvariantsnotexhaustive",
      "missing": [
        "exactcountry/SKU/completecurrentprimarytable"
      ]
    },
    {
      "family": "B.Braun Nutricomp / FunctionalFormularies / othermanufacturers / otherKateFarmsvariants",
      "status": "only partial discovery in this boundedbatch",
      "missing": [
        "marketavailability",
        "country-specific official current labels",
        "LiquidHope pouch volume varies340–355mL; no fixedmL assumption"
      ]
    },
    {
      "family": "Thickeners, modules, powders, spoonable and paediatric products",
      "status": "excludedfromliquidadultcatalogbatch",
      "missing": [
        "separateunitsanddilutionmodels;separatesafetyreview"
      ]
    }
  ],
  "complete": false,
  "globalMarketComplete": false,
  "latestGuaranteed": false,
  "recordCount": 22,
  "pendingProducts": [
    {
      "family": "Resource Energy Turkey",
      "status": "officialTRdescriptionavailable-composition-not-exposed",
      "url": "https://www.nestlehealthscience.com.tr/markalar/resource/energy",
      "missing": [
        "TR-specificcurrentkcal/protein/water/route/SKU"
      ]
    },
    {
      "family": "Nestlé Isosource Turkey",
      "status": "TRfamilyURL403-no-bypass",
      "url": "https://www.nestlehealthscience.com.tr/markalar/isosource",
      "missing": [
        "currentTRvariantsandlabels"
      ]
    },
    {
      "family": "Nestlé Novasource / Peptamen / Impact / Compleat, international",
      "status": "family-discovery-only",
      "missing": [
        "exactcountry/SKU/currentcomposition",
        "indication-specificrouteandrestrictions"
      ]
    },
    {
      "family": "Abbott Ensure / Jevity / Glucerna / Osmolite Turkey",
      "status": "TR-specificofficialmanufacturerlabelnotestablished",
      "missing": [
        "currentTRproductvariantsandnutritiontables"
      ]
    },
    {
      "family": "Fresenius Turkey Fresubin / Diben / Survimed / Supportan",
      "status": "TR-specificofficialmanufacturerlabelnotestablished",
      "missing": [
        "currentTRproductvariantsandnutritiontables"
      ]
    },
    {
      "family": "Fresenius Diben / Survimed / FresubinHP / Renal / Hepa international",
      "status": "official2025overviewdownloadexceededearlier12MBbound-not-used;olderindividual2023sheetnotclaimedlatest",
      "missing": [
        "latestcompleteverifiableprimaryspecificsheet"
      ]
    },
    {
      "family": "Nutricia other Nutrison / Fortimel / Nutridrink variants",
      "status": "partiallydiscovered-countryvariantsnotexhaustive",
      "missing": [
        "exactcountry/SKU/completecurrentprimarytable"
      ]
    },
    {
      "family": "B.Braun Nutricomp / FunctionalFormularies / othermanufacturers / otherKateFarmsvariants",
      "status": "only partial discovery in this boundedbatch",
      "missing": [
        "marketavailability",
        "country-specific official current labels",
        "LiquidHope pouch volume varies340–355mL; no fixedmL assumption"
      ]
    },
    {
      "family": "Thickeners, modules, powders, spoonable and paediatric products",
      "status": "excludedfromliquidadultcatalogbatch",
      "missing": [
        "separateunitsanddilutionmodels;separatesafetyreview"
      ]
    }
  ],
  "summary": {
    "en": "Manufacturer reference catalog with explicit market and package identities. It is not an exhaustive worldwide product list; current clinic labels must be checked.",
    "tr": "Ülke ve ambalaj kimliği belirtilen üretici kaynaklı katalog. Dünya pazarının eksiksiz listesi değildir; klinikte kullanılan güncel etiket doğrulanmalıdır."
  },
  "nonCalculable": [
    {
      "id": "resource-energy-tr-pending",
      "name": "Resource Energy — Turkey",
      "country": "TR",
      "url": "https://www.nestlehealthscience.com.tr/markalar/resource/energy",
      "reason": {
        "en": "Official Turkish page did not expose a current composition table. Swiss and generic values must not silently fill this record.",
        "tr": "Resmi Türkiye sayfasında güncel bileşim tablosu bulunamadı. İsviçre veya genel ürün değerleri bu kayda sessizce aktarılmaz."
      }
    }
  ],
  "sourceEvidence": "work/clinical-review-20261120/formula-catalog-evidence.json"
});

const byStringId = new Map(FORMULAS.map(product => [product.id, product]));
const byNumericId = new Map(FORMULAS.map(product => [product.catalogId, product]));

export function productById(id) {
  if (typeof id === 'number') return Number.isInteger(id) ? byNumericId.get(id) ?? null : null;
  if (typeof id !== 'string') return null;
  if (byStringId.has(id)) return byStringId.get(id);
  return /^[1-9]\d*$/.test(id) ? byNumericId.get(Number(id)) ?? null : null;
}
