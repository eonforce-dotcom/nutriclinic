/**
 * NutriKlinik: deterministic adult clinical decision-support calculations.
 * All numerical inputs use the units documented in the UI. Missing is not zero.
 * This module never infers a prescription or diagnoses an anabolic state.
 */
export const VERSION = "0.1.1";

const round = (value, digits = 2) => Number(value.toFixed(digits));
const known = (value, allowed) => allowed.includes(value);
const present = (value) =>
  value !== null && value !== undefined && value !== "";
const nonempty = (value) =>
  typeof value === "string" && value.trim().length > 0;
const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
  );
};
// Parse ISO wall times without consulting the execution host's timezone.
// Two unzoned datetime-local values are compared as wall times; zoned values
// are compared as instants. Mixing these bases is rejected for a collection.
const parseDateTime = (value) => {
  if (typeof value !== "string") return null;
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/.exec(
      value,
    );
  if (!match || !validDate(match[1])) return null;
  const [year, month, day] = match[1].split("-").map(Number);
  const hour = Number(match[2]),
    minute = Number(match[3]),
    second = Number(match[4] || 0);
  if (hour > 23 || minute > 59 || second > 59) return null;
  const zone = match[6] || "";
  let offset = 0;
  if (zone && zone !== "Z") {
    const zoneHour = Number(zone.slice(1, 3)),
      zoneMinute = Number(zone.slice(4, 6));
    if (
      zoneHour > 14 ||
      zoneMinute > 59 ||
      (zoneHour === 14 && zoneMinute !== 0)
    )
      return null;
    offset = (zoneHour * 60 + zoneMinute) * (zone[0] === "-" ? -1 : 1);
  }
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(
    hour,
    minute,
    second,
    Number((match[5] || "").padEnd(3, "0")),
  );
  return {
    time: date.getTime() - offset * 60000,
    zoned: Boolean(zone),
    date: match[1],
  };
};

export function evaluate(input = {}) {
  const d = input && typeof input === "object" ? input : {};
  const trace = [];
  const blockers = [];
  const invalid = [];
  const addBlock = (message) => {
    if (!blockers.includes(message)) blockers.push(message);
  };
  const malformedInputErrors =
    d.inputErrors !== undefined &&
    (!Array.isArray(d.inputErrors) ||
      Array.from(d.inputErrors).some((key) => !nonempty(key)));
  const inputErrorFields = new Set(
    Array.isArray(d.inputErrors)
      ? d.inputErrors.filter(nonempty).map((key) => key.trim())
      : [],
  );
  const inputsValid = (...keys) =>
    !malformedInputErrors && keys.every((key) => !inputErrorFields.has(key));
  if (malformedInputErrors || inputErrorFields.size) {
    const names = !malformedInputErrors
      ? [...inputErrorFields].join(", ")
      : "girdi doğrulaması";
    addBlock(
      `Geçersiz biçim veya kabul aralığı dışındaki girdi düzeltilmeli: ${names}.`,
    );
  }
  const num = (key, min = 0, max = Infinity, inclusive = true) => {
    const value = d[key];
    if (!present(value)) return null;
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      (inclusive ? value < min : value <= min) ||
      value > max
    ) {
      invalid.push(key);
      return null;
    }
    return value;
  };

  const age = num("age", 0, 130, false);
  const height = num("height", 0, 300, false);
  const weight = num("weight", 0, 600, false);
  const usualWeight = num("usualWeight", 0, 600, false);
  const lossMonths = num("lossMonths", 0, 120, false);
  const albumin = num("albumin", 0, 100);
  const neutrophils = num("neutrophils", 0, 200);
  const lymphocytes = num("lymphocytes", 0, 200);
  const crp = num("crp", 0, 2000);
  const phosphate = num("phosphate", 0, 20);
  const potassium = num("potassium", 0, 20);
  const magnesium = num("magnesium", 0, 20);
  const uun = num("uun", 0, 200);
  const actualProtein = num("actualProtein", 0, 1000);
  const usualIntake = num("usualIntake", 0, 200);
  const reducedDays = num("reducedDays", 0, 3650);
  const negligibleDays = num("negligibleDays", 0, 3650);
  const measuredEE = num("measuredEE", 0, 15000, false);
  const kcalTarget = num("kcalTarget", 0, 15000, false);
  const proteinTarget = num("proteinTarget", 0, 1000, false);
  const otherKcal = num("otherKcal", 0, 15000);
  const otherProtein = num("otherProtein", 0, 1000);
  const formulaEnergy = num("formulaEnergy", 0, 5, false);
  const formulaProtein = num("formulaProtein", 0, 100, false);
  const formulaWater = num("formulaWater", 0, 100, false);
  const formulaVolumeLimit = num("formulaVolumeLimit", 0, 10000, false);
  const hours = num("hours", 1, 24);
  const servingVolume = num("servingVolume", 0, Infinity, false);
  const urineVolume = num("urineVolume", 0, Infinity, false);
  const labDateValid = validDate(d.labDate);
  const visitDateValid = validDate(d.visitDate);
  const uunDateValid = validDate(d.uunDate);
  const labAfterVisit =
    labDateValid && visitDateValid && d.labDate > d.visitDate;
  const collectionStart = parseDateTime(d.collectionStart);
  const collectionEnd = parseDateTime(d.collectionEnd);
  if (present(d.labDate) && !labDateValid) invalid.push("labDate");
  if (present(d.visitDate) && !visitDateValid) invalid.push("visitDate");
  if (present(d.uunDate) && !uunDateValid) invalid.push("uunDate");
  if (present(d.collectionStart) && !collectionStart)
    invalid.push("collectionStart");
  if (present(d.collectionEnd) && !collectionEnd) invalid.push("collectionEnd");
  const collectionDuration =
    collectionStart &&
    collectionEnd &&
    collectionStart.zoned === collectionEnd.zoned
      ? (collectionEnd.time - collectionStart.time) / 3600000
      : null;
  const collectionWindowValid =
    collectionDuration !== null &&
    Math.abs(collectionDuration - 24) <= 0.1 + 1e-9;
  // Assessment has a calendar date, not a timezone or time of day. Compare the
  // written ISO day of a collection end (including zoned values), never a day
  // converted through UTC or the host timezone. Duration still uses instants.
  const collectionAfterVisit =
    collectionEnd && visitDateValid && collectionEnd.date > d.visitDate;
  const uunAfterVisit =
    uunDateValid && visitDateValid && d.uunDate > d.visitDate;
  const uunCollectionMismatch =
    uunDateValid && collectionEnd && d.uunDate !== collectionEnd.date;
  const nitrogenDatesValid =
    uunDateValid &&
    collectionEnd &&
    !collectionAfterVisit &&
    !uunAfterVisit &&
    !uunCollectionMismatch;
  const hasLabs = [
    albumin,
    neutrophils,
    lymphocytes,
    crp,
    phosphate,
    potassium,
    magnesium,
    uun,
  ].some((v) => v !== null);
  const labReady =
    d.labsConfirmed === true &&
    labDateValid &&
    visitDateValid &&
    !labAfterVisit &&
    inputsValid("age", "labDate", "visitDate");
  const nlrInputsValid = inputsValid("neutrophils", "lymphocytes");
  const pniInputsValid = inputsValid("albumin", "lymphocytes");
  const nitrogenInputsValid = inputsValid(
    "uunDate", "uun", "actualProtein", "collectionStart", "collectionEnd", "urineVolume", "renal", "extraLosses",
  );

  const adult = age !== null && age >= 18;
  const bmiRaw =
    height !== null && weight !== null ? weight / (height / 100) ** 2 : null;
  const bmi = bmiRaw === null ? null : round(bmiRaw);
  // Positive = weight loss; a negative result explicitly represents weight gain.
  const lossRaw =
    usualWeight !== null && weight !== null
      ? ((usualWeight - weight) / usualWeight) * 100
      : null;
  const weightLoss = lossRaw === null ? null : round(lossRaw);
  if (bmi !== null)
    trace.push(`BKİ = ${weight} / (${height} / 100)² = ${bmi} kg/m².`);
  if (weightLoss !== null)
    trace.push(
      `Ağırlık değişimi = (${usualWeight} − ${weight}) / ${usualWeight} × 100 = %${weightLoss}; pozitif değer kaybı gösterir.`,
    );

  const indices = { nlr: null, pni: null, nitrogen: null };
  if (labReady && adult) {
    if (nlrInputsValid && neutrophils !== null && lymphocytes !== null && lymphocytes > 0) {
      indices.nlr = {
        value: round(neutrophils / lymphocytes),
        title: "Nötrofil/lenfosit oranı (NLR)",
        detail:
          "Yardımcı inflamasyon göstergesidir; katabolizma/anabolizma veya mama seçimi için doğrulanmış evrensel eşik değildir.",
      };
      trace.push(`NLR = ${neutrophils} / ${lymphocytes}.`);
    }
    if (pniInputsValid && albumin !== null && lymphocytes !== null) {
      indices.pni = {
        value: round(albumin + 5 * lymphocytes),
        title: "Prognostik nütrisyonel indeks (PNI)",
        detail:
          "Albümin (g/L) + 5 × lenfosit (10⁹/L). Prognostik yardımcı indekstir; malnütrisyon, kas kitlesi veya net protein anabolizması tanısı koymaz.",
      };
      trace.push(`PNI = ${albumin} + 5 × ${lymphocytes}.`);
    }
    if (
      uun !== null &&
      actualProtein !== null &&
      nitrogenInputsValid &&
      nitrogenDatesValid &&
      d.collectionComplete === true &&
      d.collectionMatched === true &&
      collectionWindowValid &&
      urineVolume !== null &&
      d.renal === "none" &&
      d.extraLosses === false
    ) {
      const nitrogenValue = actualProtein / 6.25 - (uun + 4);
      indices.nitrogen = {
        value: round(nitrogenValue),
        title: "Tahmini azot dengesi (g N/24 saat)",
        detail:
          "Aynı tam 24 saatte gerçek protein / 6,25 − (UUN + 4). Ek kayıp olmadığı ve böbrek işlevinin uygun olduğu varsayımıyla yaklaşık hesap; net kas anabolizmasını kanıtlamaz.",
      };
      trace.push(
        `Tahmini azot dengesi = ${actualProtein} / 6,25 − (${uun} + 4) = ${indices.nitrogen.value} g N/24 saat.`,
      );
      trace.push(
        `Toplama: ${d.collectionStart} → ${d.collectionEnd}; ${round(collectionDuration, 3)} saat ve ${urineVolume} mL idrar. Gerçek protein aynı pencereyle eşleştiği onaylandı.`,
      );
      trace.push(
        "UUN tarihi toplama bitişinin yazılı ISO günüyle eşleşir. Değerlendirmede saat bilgisi olmadığından tarih kontrolü saat dilimi dönüşümü yapılmadan yazılı günlere göre yapılır.",
      );
    } else if (uun !== null || actualProtein !== null) {
      trace.push(
        "Azot dengesi hesaplanmadı: toplama bitiş günüyle eşleşen geçerli UUN tarihi, değerlendirme gününü aşmayan toplama bitişi, geçerli başlangıç/bitiş, 24±0,1 saat, pozitif idrar hacmi, tam ve eşleşen toplama, geçerli gerçek protein alımı, böbrek hastalığı/KRT olmaması ve ek kayıp olmaması birlikte doğrulanmalıdır.",
      );
      if (!uunDateValid)
        trace.push(
          "Azot dengesi için geçerli YYYY-MM-DD UUN örnek/toplama bitiş tarihi gerekli; bu tarih kan örneği tarihinden ayrı doğrulanmalıdır.",
        );
    }
  } else if (
    [albumin, neutrophils, lymphocytes, crp, uun, actualProtein].some(
      (v) => v !== null,
    )
  ) {
    trace.push(
      "Laboratuvar indeksleri hesaplanmadı: yetişkinlik, geçerli YYYY-MM-DD örnek ve değerlendirme tarihleri, laboratuvar doğrulaması ve ilgili girdilerin geçerliliği gereklidir; örnek tarihi değerlendirme tarihinden ileri olamaz.",
    );
  }
  if (
    !inputsValid(
      "age", "labDate", "visitDate", "albumin", "neutrophils", "lymphocytes",
      "uunDate", "uun", "actualProtein", "collectionStart", "collectionEnd", "urineVolume",
    )
  )
    trace.push(
      "Geçersiz olarak işaretlenmiş girdilere bağlı laboratuvar indeksleri hesaplanmadı.",
    );
  if (lymphocytes === 0)
    trace.push(
      "Lenfosit sıfır: NLR sıfıra bölme nedeniyle hesaplanamaz. PNI tek başına klinik tanı değildir.",
    );
  if (albumin !== null)
    trace.push(
      "Albümin/prealbümin tek başına malnütrisyon, kas kitlesi veya anabolizma göstergesi değildir; inflamasyon ve sıvı dağılımından etkilenir.",
    );

  const nitrogenValue = indices.nitrogen?.value;
  const metabolic =
    nitrogenValue === undefined
      ? {
          title: "Katabolik/anabolik durum belirlenemedi",
          detail:
            "Kan indeksleri tek başına bu durumu tayin etmez. Klinik evre, gerçek alım, kas/işlev izlemi ve uygun koşullarda azot dengesi birlikte değerlendirilmelidir.",
        }
      : nitrogenValue < 0
        ? {
            title: "Negatif azot dengesiyle uyumlu",
            detail: `Tahmini denge ${nitrogenValue} g N/24 saat. Bu yaklaşık ölçüm katabolik yük veya yetersiz alımla uyumlu olabilir; nedeni ayırmaz ve otomatik protein artırma talimatı değildir.`,
          }
        : nitrogenValue > 0
          ? {
              title: "Pozitif tahmini azot dengesi",
              detail: `Tahmini denge +${nitrogenValue} g N/24 saat. Pozitif sonuç net kas anabolizmasını kanıtlamaz; ölçüm hataları ve ölçülmeyen kayıplar değerlendirilmelidir.`,
            }
          : {
              title: "Sıfıra yakın tahmini azot dengesi",
              detail:
                "Hesaplanan değer 0 g N/24 saat. Ölçüm belirsizliği nedeniyle kesin metabolik denge veya anabolizma tanısı konulamaz.",
            };

  const phenotype = [];
  if (adult && bmiRaw !== null && bmiRaw < (age < 70 ? 20 : 22))
    phenotype.push("Yaşa göre düşük BKİ");
  if (
    lossRaw !== null &&
    lossMonths !== null &&
    ((lossMonths <= 6 && lossRaw > 5) || (lossMonths > 6 && lossRaw > 10))
  )
    phenotype.push("GLIM ile uyumlu ağırlık kaybı");
  if (d.muscle === "low") phenotype.push("Azalmış kas kitlesi bildirimi");
  const etiology = [];
  if (d.inflammation === "yes")
    etiology.push("İnflamasyon/hastalık yükü klinik olarak doğrulandı");
  if (d.intakeCriterion === "yes")
    etiology.push("Azalmış alım/assimilasyon ölçütü klinik olarak doğrulandı");
  let glim;
  if (!adult) {
    glim = {
      title: "Erişkin GLIM değerlendirmesi yapılamadı",
      detail: "Yaş doğrulanmalı; bu modül yalnız 18 yaş ve üzeri içindir.",
    };
  } else if (phenotype.length && etiology.length) {
    glim = {
      title:
        d.screenPositive === true
          ? "GLIM değerlendirmesine aday bulgular"
          : "GLIM ile uyumlu aday bulgular; tarama doğrulanmalı",
      detail: `${phenotype.join("; ")}. ${etiology.join("; ")}. Tarama ve uzman klinik değerlendirmesi ile doğrulanır; yazılım tanı veya evre koymaz.`,
    };
  } else {
    glim = {
      title: phenotype.length
        ? "Fenotipik aday bulgu; etiyolojik ölçüt tamamlanmalı"
        : "GLIM adaylığı için değerlendirme tamamlanmalı",
      detail: `${phenotype.length ? phenotype.join("; ") + ". " : ""}Bir fenotipik ve bir etiyolojik ölçüt birlikte gerekir. Normal BKİ veya tek normal laboratuvar sonucu malnütrisyonu dışlamaz; kas kitlesi, istemsiz kayıp, alım ve inflamasyon değerlendirilmelidir.`,
    };
  }
  trace.push(
    "GLIM eşikleri erişkin referans popülasyonuna aittir; etnik kökene göre yerel eşikler ve uzman değerlendirmesi gerekir.",
  );

  // NICE CG32: one major or two minor criteria. Only negligibleDays denotes
  // little/no intake. A general reduction (reducedDays) is not equivalent.
  const major = [];
  const minor = [];
  const missingRisk = [];
  if (bmiRaw === null) missingRisk.push("BKİ");
  else {
    if (bmiRaw < 16) major.push("BKİ <16 kg/m²");
    if (bmiRaw < 18.5) minor.push("BKİ <18,5 kg/m²");
  }
  if (lossRaw === null || lossMonths === null)
    missingRisk.push("ağırlık kaybı ve süresi");
  else if (lossMonths >= 3 && lossMonths <= 6) {
    if (lossRaw > 15) major.push("3–6 ayda >%15 istemsiz ağırlık kaybı");
    if (lossRaw > 10) minor.push("3–6 ayda >%10 istemsiz ağırlık kaybı");
  } else if (lossRaw > 10) {
    // A rapid loss or an unmatched longer period cannot be reassuring.
    missingRisk.push(
      "belirgin kaybın son 3–6 ayla eşleşen klinik değerlendirmesi",
    );
  }
  if (negligibleDays === null)
    missingRisk.push("çok az/ihmal edilebilir alım günleri");
  const intakeDays = negligibleDays;
  if (intakeDays !== null && intakeDays > 10)
    major.push("10 günden uzun çok az/ihmal edilebilir alım");
  if (intakeDays !== null && intakeDays > 5)
    minor.push("5 günden uzun çok az/ihmal edilebilir alım");
  if (d.electrolytes === "low")
    major.push("Beslenme öncesi düşük K/Mg/P bildirimi");
  else if (d.electrolytes !== "normal")
    missingRisk.push("beslenme öncesi elektrolit durumu");
  if (d.refeedingHistory === "yes")
    minor.push("Alkol veya NICE ilişkili ilaç öyküsü bildirimi");
  else if (d.refeedingHistory !== "no")
    missingRisk.push("alkol ve NICE ilişkili ilaç öyküsü");
  const lowElectrolyteScreen = [];
  const highElectrolyteScreen = [];
  if (phosphate !== null && phosphate < 0.8)
    lowElectrolyteScreen.push(`Fosfat ${phosphate} <0,8 mmol/L`);
  if (potassium !== null && potassium < 3.5)
    lowElectrolyteScreen.push(`Potasyum ${potassium} <3,5 mmol/L`);
  if (magnesium !== null && magnesium < 0.7)
    lowElectrolyteScreen.push(`Magnezyum ${magnesium} <0,7 mmol/L`);
  if (phosphate !== null && phosphate > 1.5)
    highElectrolyteScreen.push(`Fosfat ${phosphate} >1,5 mmol/L`);
  if (potassium !== null && potassium > 5.5)
    highElectrolyteScreen.push(`Potasyum ${potassium} >5,5 mmol/L`);
  if (magnesium !== null && magnesium > 1.1)
    highElectrolyteScreen.push(`Magnezyum ${magnesium} >1,1 mmol/L`);
  const electrolyteWarnings = [];
  if (phosphate !== null && phosphate < 0.65)
    electrolyteWarnings.push("Fosfat <0,65 mmol/L");
  if (potassium !== null && potassium < 2.5)
    electrolyteWarnings.push("Potasyum <2,5 mmol/L");
  if (magnesium !== null && magnesium < 0.5)
    electrolyteWarnings.push("Magnezyum <0,5 mmol/L");
  if (electrolyteWarnings.length)
    major.push(
      ...electrolyteWarnings.map(
        (x) => `${x}: beslenme öncesi elektrolit güvenlik uyarısı`,
      ),
    );
  if (lowElectrolyteScreen.length && d.electrolytes !== "low")
    missingRisk.push(
      "sayısal düşük elektrolit ön kontrolü ile seçilen elektrolit durumu uyumsuz; lokal referans doğrulanmalı",
    );
  if (highElectrolyteScreen.length)
    missingRisk.push(
      "elektrolit üst ön kontrol aralığı dışında; özel değerlendirme gerekli",
    );
  if (lowElectrolyteScreen.length || highElectrolyteScreen.length)
    trace.push(
      "Elektrolit sayısal kontrolleri standart ön kontrol eşikleridir; evrensel laboratuvar normu veya şiddet sınıflaması değildir. Lokal referans, örnek zamanı, birim ve klinik durum doğrulanmalıdır.",
    );
  let refeeding;
  if (major.length || minor.length >= 2) {
    refeeding = {
      level: "high",
      reasons: [
        ...major,
        ...minor,
        ...(missingRisk.length
          ? [`Eksik değerlendirme: ${missingRisk.join(", ")}.`]
          : []),
      ],
    };
  } else if (!adult || missingRisk.length) {
    refeeding = {
      level: "unknown",
      reasons: [
        ...minor,
        !adult ? "Erişkin yaş doğrulanmadı." : null,
        ...missingRisk.map((x) => `Eksik: ${x}.`),
      ].filter(Boolean),
    };
  } else {
    refeeding = {
      level: "low",
      reasons: [
        ...minor,
        "Girilen verilerle NICE yüksek risk ölçütleri karşılanmadı; bu ifade refeeding riskini sıfırlamaz.",
      ],
    };
  }
  trace.push(
    "NICE yüksek risk taraması: bir büyük veya iki küçük ölçüt. Yalnız ihmal edilebilir/çok az alım günleri kullanılır; genel azalmış alım süresi (reducedDays) bu ölçütle eşit değildir. Öykü alanı alkol, insülin, kemoterapi, antasit ve diüretikleri kapsar.",
  );
  if (usualIntake === null)
    trace.push(
      "Fiili oral alım yüzdesi bilinmiyor; beslenme açığı klinik olarak doğrulanmalıdır.",
    );

  const reference = {
    energy:
      d.context === "icu"
        ? "ESPEN 2023: indirekt kalorimetri tercih edilir. Erken akut fazda ≤%70 ölçülen enerji harcaması; 3. günden sonra klinik toleransla %80–100. Tahmin denklemi kullanılıyorsa ilk hafta <%70 tahmini ihtiyaç. Otomatik hedef hesaplanmaz."
        : "Servis hastasında enerji hedefi klinik değerlendirme ile hekim/diyetisyen tarafından belirlenir. Ölçülmüş harcama varsa değerlendirmeye eklenir; otomatik hedef hesaplanmaz.",
    protein:
      d.context === "icu"
        ? "ESPEN 2023: protein kademeli yaklaşık 1,3 g/kg/gün düzeyine ilerletilebilir. EFFORT 2023, PRECISe 2024 ve TARGET Protein 2025 rutin erken yüksek proteinin yararını göstermedi; AKI ve diğer özel durumlarda bireysel değerlendirme gerekir."
        : "Protein hedefi tanı, klinik evre, böbrek işlevi, kas kaybı ve gerçek alımla birlikte hekim/diyetisyen tarafından belirlenir.",
    notes: [
      "Referanslar reçete değildir. Negatif azot dengesi veya düşük PNI otomatik protein artırma gerekçesi değildir.",
      "Refeeding protokolleri farklılık gösterir (NICE, ASPEN 2020, AuSPEN 2025); yüksek/belirsiz riskte kurum protokolü ve klinik değerlendirme gerekir.",
      "Hacim yalnız doğrulanmış hekim enerji hedefindeki açığa göre hesaplanır; protein açığı ayrı raporlanır.",
    ],
  };
  if (measuredEE !== null)
    reference.notes.push(
      `Girilen ölçülmüş enerji harcaması: ${measuredEE} kcal/gün. Ölçümün geçerliliği ve güncelliği klinik olarak doğrulanmalıdır.`,
    );

  if (!adult)
    addBlock(
      age === null
        ? "Erişkin yaş bilinmiyor."
        : "Bu modül yalnız 18 yaş ve üzeri için kullanılabilir.",
    );
  if (!visitDateValid)
    addBlock("Geçerli YYYY-MM-DD değerlendirme tarihi gerekli.");
  if (!known(d.context, ["icu", "ward"])) addBlock("Bakım ortamı seçilmeli.");
  if (d.context === "icu" && !known(d.phase, ["early", "late", "recovery"]))
    addBlock("YBÜ klinik evresi hekim tarafından belirlenmeli.");
  if (height === null || weight === null)
    addBlock("Boy ve güncel ağırlık bilinmeli.");
  if (d.fluidWeight !== "reliable")
    addBlock("Doz ağırlığı/sıvı durumu güvenilir olarak doğrulanmalı.");
  if (bmiRaw !== null && bmiRaw >= 30)
    addBlock(
      "Obezitede ölçüm ve uygun doz ağırlığıyla özel değerlendirme gerekir; otomatik plan kapalı.",
    );
  if (d.renal !== "none")
    addBlock(
      d.renal === "" || !known(d.renal, ["none", "aki", "ckd", "rrt"])
        ? "Böbrek işlevi/KRT durumu bilinmiyor."
        : "AKI/CKD/KRT için bireysel klinik plan gerekir; otomatik plan kapalı.",
    );
  if (d.hemodynamics !== "stable")
    addBlock(
      d.hemodynamics === "unstable"
        ? "Hemodinamik instabilite: beslenme yolu ve zamanlaması hekim tarafından değerlendirilmelidir."
        : "Hemodinamik stabilite bilinmiyor.",
    );
  if (d.gi !== "functional")
    addBlock(
      d.gi === "contraindicated"
        ? "Gastrointestinal kontrendikasyon bildirildi; otomatik enteral/oral plan kapalı."
        : "Gastrointestinal uygunluk bilinmiyor.",
    );
  if (!known(d.route, ["oral", "tube"])) addBlock("Beslenme yolu seçilmeli.");
  if (d.route === "oral" && d.swallow !== "safe")
    addBlock(
      d.swallow === "unsafe"
        ? "Güvenli yutma yok; oral mama planı oluşturulamaz."
        : "Oral plan için güvenli yutma doğrulanmalı.",
    );
  if (d.pregnant !== "no")
    addBlock(
      d.pregnant === "yes"
        ? "Gebelikte özel değerlendirme gerekir; otomatik plan kapalı."
        : "Gebelik durumu bilinmiyor.",
    );
  if (refeeding.level !== "low")
    addBlock(
      refeeding.level === "high"
        ? "Refeeding riski yüksek: kurum protokolü ve klinik değerlendirme gerekir."
        : "Refeeding riski eksik veriler nedeniyle belirlenemedi.",
    );
  if (electrolyteWarnings.length)
    addBlock(
      `Elektrolit güvenlik uyarısı: ${electrolyteWarnings.join("; ")}. Doğrulama ve klinik değerlendirme olmadan otomatik plan oluşturulmaz.`,
    );
  if (lowElectrolyteScreen.length || highElectrolyteScreen.length)
    addBlock(
      `Elektrolit ön kontrol aralığı dışında: ${[...lowElectrolyteScreen, ...highElectrolyteScreen].join("; ")}. Standart ön kontrol eşikleri; lokal referans doğrula, özel değerlendirme gerekir.`,
    );
  if (hasLabs && d.labsConfirmed !== true)
    addBlock("Girilen laboratuvar sonuçları henüz doğrulanmadı.");
  if (hasLabs && !labDateValid)
    addBlock(
      "Girilen laboratuvar sonuçları için geçerli YYYY-MM-DD örnek tarihi gerekli.",
    );
  if (hasLabs && labAfterVisit)
    addBlock(
      "Laboratuvar örnek tarihi değerlendirme tarihinden sonra; gelecek örnek değerlendirmeye dahil edilemez.",
    );
  if (collectionAfterVisit)
    addBlock(
      "İdrar toplama bitiş tarihi değerlendirme tarihinden sonra; gelecek toplama değerlendirmeye dahil edilemez.",
    );
  if (uunAfterVisit)
    addBlock(
      "UUN örnek/toplama bitiş tarihi değerlendirme tarihinden sonra; gelecek örnek değerlendirmeye dahil edilemez.",
    );
  if (uunCollectionMismatch)
    addBlock(
      "UUN örnek/toplama bitiş tarihi idrar toplama bitişinin yazılı ISO günüyle eşleşmiyor; kaynak ve toplama penceresi uzlaştırılmalıdır.",
    );
  if (
    (d.collectionComplete === true || d.collectionMatched === true) &&
    (!collectionWindowValid || urineVolume === null)
  )
    addBlock(
      "Toplama onayı ile başlangıç/bitiş veya idrar hacmi uyumsuz: 24±0,1 saatlik geçerli pencere ve pozitif hacim gerekli.",
    );
  if (usualIntake === null) addBlock("Fiili alım yüzdesi bilinmeli.");
  if (kcalTarget === null || proteinTarget === null)
    addBlock(
      "Hekim tarafından belirlenmiş enerji ve protein hedeflerinin ikisi de girilmeli.",
    );
  if (otherKcal === null || otherProtein === null)
    addBlock(
      "Diğer kaynaklardan gelen enerji ve protein açıkça girilmeli; yoksa 0 yazılmalı.",
    );
  if (d.formulaVerified !== true)
    addBlock("Mamanın güncel etiket bileşimi ve birimleri doğrulanmalı.");
  if (!nonempty(d.formulaName) || !nonempty(d.formulaSource))
    addBlock("Mama adı ve doğrulanabilir ürün/etiket kaynağı boş olamaz.");
  if (
    [formulaEnergy, formulaProtein, formulaWater, formulaVolumeLimit].some(
      (v) => v === null,
    )
  )
    addBlock(
      "Mamanın enerji, protein, serbest su ve günlük hacim sınırı eksiksiz girilmeli.",
    );
  if (d.route === "tube" && hours === null)
    addBlock(
      "Tüple uygulama için 1–24 saat arasında günlük uygulama süresi gerekli.",
    );
  if (d.route === "oral" && servingVolume === null)
    addBlock("Oral uygulama için pozitif porsiyon hacmi gerekli.");
  if (d.clinicianConfirmed !== true)
    addBlock("Hekim hedefleri ve klinik uygunluk onayı gerekli.");
  if (invalid.length)
    addBlock(
      `Geçersiz değer veya birim olasılığı: ${[...new Set(invalid)].join(", ")}.`,
    );

  let plan = null;
  if (!blockers.length) {
    const energyNeeded = Math.max(0, kcalTarget - otherKcal);
    const requestedVolume = energyNeeded / formulaEnergy;
    // Round volume downward to 0.1 mL so neither an energy-derived amount
    // nor a fractional volume cap can be exceeded by display rounding.
    const volumeRaw =
      Math.floor(Math.min(requestedVolume, formulaVolumeLimit) * 10) / 10;
    const formulaKcal = volumeRaw * formulaEnergy;
    const formulaGrams = (volumeRaw * formulaProtein) / 100;
    const energy = formulaKcal + otherKcal;
    const protein = formulaGrams + otherProtein;
    plan = {
      volume: round(volumeRaw, 1),
      rate: d.route === "tube" ? round(volumeRaw / hours, 1) : 0,
      energy: round(energy, 1),
      protein: round(protein, 1),
      water: round((volumeRaw * formulaWater) / 100, 1),
      energyGap: round(Math.max(0, kcalTarget - energy), 1),
      proteinGap: round(Math.max(0, proteinTarget - protein), 1),
    };
    trace.push(
      `Enerji açığı = max(0, ${kcalTarget} − ${otherKcal}) = ${round(energyNeeded, 1)} kcal/gün; istenen mama hacmi = açık / ${formulaEnergy} = ${round(requestedVolume, 1)} mL/gün.`,
    );
    trace.push(
      "Mama hacmi sınırı aşmamak için 0,1 mL basamağına aşağı yuvarlanır; enerji/protein/su toplamları bu hacimden hesaplanır.",
    );
    if (requestedVolume > formulaVolumeLimit)
      trace.push(
        `Hacim ${formulaVolumeLimit} mL/gün sınırında tutuldu; kalan enerji açığı kapatılmış sayılmaz.`,
      );
    trace.push(
      `Mama: ${round(formulaKcal, 1)} kcal + ${round(formulaGrams, 1)} g protein. Diğer kaynaklar: ${otherKcal} kcal + ${otherProtein} g protein. Toplam: ${plan.energy} kcal ve ${plan.protein} g protein/gün.`,
    );
    trace.push(
      `Mama/etiket kaydı: ${d.formulaName.trim()}. Kaynak: ${d.formulaSource.trim()}.`,
    );
    if (d.route === "tube")
      trace.push(
        `Uygulama: ${plan.volume} mL / ${hours} saat = yaklaşık ${plan.rate} mL/saat. Yuvarlanmış hız yerine nihai pompa ayarı klinik olarak doğrulanmalıdır.`,
      );
    else
      trace.push(
        `Oral uygulama: ${plan.volume} mL/gün, girilen porsiyon hacmi ${servingVolume} mL. Porsiyon sayısı ve toleransı klinik olarak düzenlenir; pompa hızı hesaplanmaz.`,
      );
    trace.push(
      `Serbest su yalnız mamadan ${plan.water} mL/gün; yıkama suyu, IV/oral sıvılar ve diğer kaynakların suyu dahil değildir.`,
    );
    if (plan.proteinGap > 0)
      trace.push(
        `Protein hedefinden ${plan.proteinGap} g/gün eksik; hacim veya ek protein otomatik artırılmadı.`,
      );
    if (protein > proteinTarget)
      trace.push(
        `Protein hedefi ${round(protein - proteinTarget, 1)} g/gün aşılıyor; mama/hedef uyumu klinik olarak yeniden değerlendirilmelidir.`,
      );
    if (otherKcal > kcalTarget)
      trace.push(
        `Diğer kaynaklar enerji hedefini ${round(otherKcal - kcalTarget, 1)} kcal/gün aşıyor; önerilen ek mama hacmi 0 mL.`,
      );
    trace.push(
      "Bu çıktı hekim hedeflerine dayalı taslak hacim hesabıdır; ürün seçimi, reçete ve uygulama kararı klinisyene aittir.",
    );
  }
  return {
    bmi,
    weightLoss,
    indices,
    metabolic,
    glim,
    refeeding,
    blockers,
    reference,
    plan,
    trace,
  };
}
