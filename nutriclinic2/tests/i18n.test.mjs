import test from "node:test";
import assert from "node:assert/strict";
import { translate, getLocale, getNumberLocale } from "../dist/i18n.mjs";

test("English is the pre-initialization UI and number-formatting fallback", () => {
  assert.equal(getLocale(), "en");
  assert.equal(getNumberLocale(), "en-GB");
  assert.equal(
    translate("Nötrofil/lenfosit oranı (NLR)"),
    "Neutrophil-to-lymphocyte ratio (NLR)",
  );
});

test("clinical qualifications remain explicit in English", () => {
  assert.equal(
    translate("Katabolik/anabolik durum belirlenemedi"),
    "Catabolic/anabolic status could not be determined",
  );
  assert.equal(
    translate("Tahmini denge +4.75 g N/24 saat. Pozitif sonuç net kas anabolizmasını kanıtlamaz; ölçüm hataları ve ölçülmeyen kayıplar değerlendirilmelidir."),
    "Estimated balance +4.75 g N/24 hours. A positive result does not prove net muscle anabolism; measurement errors and unmeasured losses must be assessed.",
  );
  assert.equal(
    translate("Referanslar reçete değildir. Negatif azot dengesi veya düşük PNI otomatik protein artırma gerekçesi değildir."),
    "References are not prescriptions. Negative nitrogen balance or a low PNI is not a reason for automatic protein escalation.",
  );
});

test("evidence access labels preserve the extent and route of source access", () => {
  assert.equal(translate("Tam metin · VETİS"), "Full text · VETİS");
  assert.equal(
    translate("Özgün PubMed özeti; yayıncı tam metnine doğrudan erişim sağlanamadı"),
    "Original PubMed abstract; direct access to the publisher full text was unavailable",
  );
  assert.equal(
    translate("Yeni bağımsız randomizasyon değildir; post hoc analizdir. Enerji ve protein birlikte değişmiştir. Renal alt gruplarda fark bulunmaması eşdeğerliği kanıtlamaz. Tam metin bu erişimde incelenmedi."),
    "Not new independent randomization; this is a post hoc analysis. Energy and protein were changed together. Failure to find differences in renal subgroups does not establish equivalence. The full text was not reviewed in this access session.",
  );
});

test("joined clinical blockers and nested electrolyte reasons are translated completely", () => {
  assert.equal(
    translate("17 kontrol tamamlanmalı. Erişkin yaş bilinmiyor. Bakım ortamı seçilmeli."),
    "17 checks must be completed. Adult age is unknown. The care setting must be selected.",
  );
  assert.equal(
    translate("Girilen laboratuvar sonuçları henüz doğrulanmadı.; Fiili alım yüzdesi bilinmeli."),
    "The entered laboratory results have not yet been verified.; The actual intake percentage must be known.",
  );
  assert.equal(
    translate("Elektrolit güvenlik uyarısı: Fosfat <0,65 mmol/L; Potasyum <2,5 mmol/L; Magnezyum <0,5 mmol/L. Doğrulama ve klinik değerlendirme olmadan otomatik plan oluşturulmaz."),
    "Electrolyte safety alert: Phosphate <0.65 mmol/L; Potassium <2.5 mmol/L; Magnesium <0.5 mmol/L. An automatic plan is not generated without verification and clinical assessment.",
  );
  assert.equal(
    translate("Eksik değerlendirme: BKİ, ağırlık kaybı ve süresi, çok az/ihmal edilebilir alım günleri."),
    "Incomplete assessment: BMI, weight loss and its duration, days with very little/negligible intake.",
  );
});

test("GLIM candidate findings preserve the requirement for clinical confirmation", () => {
  assert.equal(
    translate("Yaşa göre düşük BKİ; GLIM ile uyumlu ağırlık kaybı; Azalmış kas kitlesi bildirimi. İnflamasyon/hastalık yükü klinik olarak doğrulandı; Azalmış alım/assimilasyon ölçütü klinik olarak doğrulandı. Tarama ve uzman klinik değerlendirmesi ile doğrulanır; yazılım tanı veya evre koymaz."),
    "Low BMI for age; Weight loss consistent with GLIM; Reported reduced muscle mass. Inflammation/disease burden was clinically confirmed; The reduced intake/assimilation criterion was clinically confirmed. Confirmation requires screening and specialist clinical assessment; the software does not diagnose or stage the condition.",
  );
});

test("calculation traces retain every entered value and resulting amount", () => {
  assert.equal(
    translate("Enerji açığı = max(0, 1875.5 − 312.25) = 1563.3 kcal/gün; istenen mama hacmi = açık / 1.7 = 919.6 mL/gün."),
    "Energy deficit = max(0, 1875.5 − 312.25) = 1563.3 kcal/day; requested formula volume = deficit / 1.7 = 919.6 mL/day.",
  );
  assert.equal(
    translate("Toplama: 2026-10-22T08:00:00+03:00 → 2026-10-23T08:00:00+03:00; 24 saat ve 1475.5 mL idrar. Gerçek protein aynı pencereyle eşleştiği onaylandı."),
    "Collection: 2026-10-22T08:00:00+03:00 → 2026-10-23T08:00:00+03:00; 24 hours and 1475.5 mL urine. Actual protein intake was confirmed to match the same window.",
  );
  assert.equal(
    translate("Ağırlık değişimi = (81.5 − 73.25) / 81.5 × 100 = %10.12; pozitif değer kaybı gösterir."),
    "Weight change = (81.5 − 73.25) / 81.5 × 100 = 10.12%; a positive value indicates weight loss.",
  );
});

test("Turkish selection returns the original clinical and evidence text exactly", () => {
  for (const value of [
    "  Albümin/prealbümin tek başına malnütrisyon, kas kitlesi veya anabolizma göstergesi değildir; inflamasyon ve sıvı dağılımından etkilenir.  ",
    "Elektrolit güvenlik uyarısı: Fosfat <0,65 mmol/L. Doğrulama ve klinik değerlendirme olmadan otomatik plan oluşturulmaz.",
    "Tam metin · VETİS",
  ]) {
    assert.equal(translate(value, "tr"), value);
  }
});

test("arbitrary formula names, source labels, identifiers, and URLs remain unchanged", () => {
  assert.equal(
    translate("Mama/etiket kaydı: Özel  ürün α. Kaynak: lot  A-01."),
    "Formula/label record: Özel  ürün α. Source: lot  A-01.",
  );
  assert.equal(
    translate("Mama/etiket kaydı: Tam metin. Kaynak: Resmî tam metin."),
    "Formula/label record: Tam metin. Source: Resmî tam metin.",
  );
  const name = "Özel ürün α 1.5, seri 2026/10; Lot-A";
  const source = "https://example.org/ürün?etiket=tr&lot=007#tablo-2";
  assert.equal(
    translate(`Mama/etiket kaydı: ${name}. Kaynak: ${source}.`),
    `Formula/label record: ${name}. Source: ${source}.`,
  );
  for (const value of ["Hasta-ÖZEL-0042", source, "Farklı marka 2.4 g/100 mL"]) {
    assert.equal(translate(value), value);
  }
});
