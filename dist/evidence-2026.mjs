// 23 Ekim 2026'ya kadar yayımlanan özgün çalışmaların odaklı değerlendirmesi.
// Yeni randomizasyon, ikincil analiz ve gözlemsel tasarım birbirinden ayrılır.
export const evidence2026 = [
  {
    id: "deng-physiological-windows-2026",
    title:
      "Nutritional adequacy is associated with improved survival within specific physiological windows in critically ill patients",
    year: 2026,
    kind: "Özgün gözlemsel araştırma; bağımsız kohortla destekleme",
    url: "https://pubmed.ncbi.nlm.nih.gov/42562321/",
    doi: "10.1016/j.clnesp.2026.105009",
    access: "Tam metin · VETİS",
    accessNote:
      "26 Ekim 2026: yetkili ScienceDirect ana yöntem/sonuç, altı HTML tablo metni ve şekil açıklamaları yeniden incelendi. Şekil görüntüleri ve ek okunmadı; önceki VETİS erişim beyanından ayrı, yerelde izlenebilir incelemedir.",
    sampleSize: 5370,
    sampleNote:
      "MIMIC-IV: 5370; ilk hafta PN alanların dışlandığı ayrı NEED kohortu: 1322. Yeni randomizasyon değildir.",
    design:
      "MIMIC-IV’de günlük alım için marjinal yapısal Cox; NEED’de ilk hafta ortalama alımı ve başlangıç fizyolojisiyle Cox modeli. Gerçekleşen yeterlilik randomize değildir.",
    population:
      "Beslenme desteği alan ve YBÜ yatışı en az 7 gün olan erişkinler.",
    primaryOutcome:
      "MIMIC-IV’de 28 günlük mortalite: yeterli (%80–100) / düşük (<%80) enerji alımı HR 0,61 (%95 GA 0,50–0,74); bildirilen hedef-protein analizinde HR 0,51 (0,42–0,63). Protein kategorilerinin aynı biçimde kodlandığı doğrulanmadı.",
    summary:
      "Ayrı belirteç katmanları incelenmiştir; ortak bir AND-pencere modeli doğrulanmamıştır. Noradrenalin eşdeğeri (NEE) etkileşimi p<0,001 (enerji/protein); laktat p=0,052/0,003; protein-kreatinin p=0,467. Katman içi anlamlılık tedavi seçimini doğrulamaz.",
    application:
      "Günlük alım ile geriye dönük ilk hafta ortalaması ayrılır. Bu ilişkiler anabolik/katabolik tanı, beslemeye hazır olma veya otomatik enerji/protein dozu kuralı değildir.",
    limitations:
      "Her iki payda ideal ağırlıktır: 25 kcal/kg/gün ve 1,2 g protein/kg/gün; IBW denklemi belirtilmez. ≥7 günlük yatış seçimi, taburculukta sansürleme ve artık karıştırıcılık sürer. Kreatinin 5 mg/dL doğrulanmış eşik değildir; NEED Tablo 6’daki maruziyet etiketi/metin uyuşmazlığı korunur.",
  },
  {
    id: "need-age-heterogeneity-2026",
    title:
      "Association between age and outcomes of evidence-based feeding protocol versus usual care in critically ill patients",
    year: 2026,
    kind: "Çok merkezli küme randomize çalışmanın post hoc analizi",
    url: "https://link.springer.com/article/10.1186/s40560-026-00942-y",
    doi: "10.1186/s40560-026-00942-y",
    access: "Özgün tam metin",
    sampleSize: 2672,
    sampleNote:
      "88 Çin YBÜ’si. Ana NEED kohortu 2772; 100 hastanın 28 günlük takibi eksik.",
    design:
      "2018–2019 NEED verilerinde, ana protokolde önceden belirtilmemiş keşifsel yaş-etkileşimi analizi.",
    population:
      "Yeni YBÜ kabulü, organ yetmezliği, beklenen uzun yatış ve yakın zamanda oral alıma geçme olasılığı düşük erişkinler.",
    primaryOutcome:
      "28 günlük mortalite etkileşimi: her 10 yaş artışıyla müdahale HR oranı 1,28 (%95 GA 1,13–1,46). ≤65 yaş HR 0,64 (0,44–0,92); ≥76 yaş HR 1,29 (0,89–1,88).",
    summary:
      "Yapılandırılmış beslenme protokolüyle olağan bakım arasındaki ilişki yaşa göre değişti; ileri yaşta yarar gösterilmedi.",
    application:
      "Yaş, kırılganlık ve tolerans kişiselleştirmede kaydedilir. Yaş kesimleri hipotezdir; otomatik doz veya destekten mahrum bırakma kuralı değildir.",
    limitations:
      "Yeni 2026 randomizasyonu değildir. Çoklu keşifsel karşılaştırmalar, dengesiz takip kaybı, tedavi bileşenlerinin ayrılamaması ve dış doğrulama eksikliği sonuçları sınırlar.",
  },
  {
    id: "electrolyte-multicenter-cohort-2026",
    title:
      "Supplementation of calcium, magnesium, phosphate, and potassium in critically ill patients: A multicenter cohort study",
    year: 2026,
    kind: "Özgün büyük çok merkezli kohort",
    url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0349145",
    doi: "10.1371/journal.pone.0349145",
    access: "Özgün tam metin",
    sampleSize: 47988,
    sampleNote:
      "67 YBÜ, 52 ABD hastanesi; 167.621 elektrolit ölçümü bulunan hasta-günü.",
    design:
      "2022–2024 Premier veritabanında retrospektif çok düzeyli analiz; randomizasyon yok.",
    population:
      "Yetişkin YBÜ hastaları; böbrek yetmezliği, gebelikle ilişkili tanı ve kabulde intrakraniyal kanama dışlandı.",
    primaryOutcome:
      "Elektrolit replasmanında hastaneler arası değişkenlik: medyan göreli odds potasyum için 1,51 (%95 GA 1,48–1,55), magnezyum için 2,09 (1,99–2,19).",
    summary:
      "Hastaların %70,1’i replasman aldı. Potasyum replasmanının yaygınlaştığı düzeyler hastaneler arasında 3,3–3,9 mmol/L arasında değişti.",
    application:
      "Laboratuvar referansı ve kurum protokolü kaydedilir. Veri, tek evrensel replasman eşiği yerine izlenebilir yerel karar desteğini destekler.",
    limitations:
      "Mortaliteyi azaltan replasman dozunu test etmez; uygulama farkı etkinlik kanıtı değildir. İntrakraniyal kanama ve böbrek yetmezliğine doğrudan genellenmez; otomatik elektrolit reçetesi üretmez.",
  },
  {
    id: "fradkin-calorimetry-pmv-rct-2026",
    title:
      "Indirect calorimetry-guided nutrition during weaning from prolonged mechanical ventilation: a double-blind randomized controlled trial",
    year: 2026,
    kind: "Özgün randomize çalışma raporu; tek merkez",
    url: "https://link.springer.com/article/10.1186/s13054-026-06272-7",
    doi: "10.1186/s13054-026-06272-7",
    access: "Özgün tam metin",
    accessNote:
      "26 Ekim 2026: özgün ana yöntem/sonuç ve güncel resmî kayıt incelendi. Protokol kimliği bibliyografik olarak doğrulandı; özgün protokol/SAP, arşiv sürümleri, akış görüntüsü ve ek okunmadı. VETİS kullanılmadı.",
    sampleSize: 211,
    sampleNote:
      "211 ITT (111/100), 198 PP; planlanan 326 kişiye ulaşılamadı. Güncel kayıt 200 tahmini katılım verir; adlandırılan üç çekilme tüm PP farkı değildir.",
    design: "Tek merkez RCT; makale çift, güncel kayıt üçlü kör diye etiketler. Reçeteleyen diyetisyen kör değildir. İki kolda haftalık kalorimetri yapılmıştır.",
    population:
      "Ventilasyon ≥21 gün ve ≥6 saat/gün; stabil, vazopresörsüz erişkinler. İrreversibl nörodejenerasyon dışlanmıştır.",
    primaryOutcome:
      "Başarılı ayrılma: %58 ve %50; fark +8 yüzde puan (%95 GA −6 ila +21; p=0,33). 27/31 günlük medyanlar (p=0,58) yalnız başarılı ayrılan 118 kişinin özetidir, tüm ITT’nin süre sonucu değildir.",
    summary:
      "Kalorimetriyle enerji hedefi, Schofield tahmin denklemiyle belirlenen hedefle karşılaştırıldı. Birincil klinik sonuçlarda üstünlük gösterilmedi.",
    application:
      "Ölçülmüş enerji harcaması ve gerçek teslim edilen enerjinin ayrılması uygundur; ölçüme dayalı hedefin kesin ventilatörden ayrılma yararı olduğu söylenmez.",
    limitations:
      "İlk kamu kaydı katılım başladıktan sonradır. Kayıt birincil sonuçları 8 hafta, makale izlem sınırını 120 gün verir; sağkalım saatleri de farklıdır. PP enerji-açığı ilişkisi post hoc ve seçilmiştir; doz, metabolik sınıf veya eşdeğerlik doğrulamaz.",
  },
  {
    id: "summers-anabolic-resistance-rct-2026",
    title:
      "Increasing protein dose does not further augment muscle protein synthesis in critical illness: a randomized, controlled clinical trial",
    year: 2026,
    onlineDate: "2026-02-24",
    printDate: "2026-05",
    kind: "Küçük mekanistik randomize çalışma; tek merkez",
    url: "https://pubmed.ncbi.nlm.nih.gov/42085214/",
    doi: "10.1093/ajrccm/aamag086",
    access:
      "Özgün özet ve indekslenen yayıncı yöntem/sonuç bölümleri; kısmi erişim",
    accessNote:
      "Güncel PROMS kaydı okundu; doğrudan tam metin, ekler ve kayıt değişiklik geçmişi incelenmedi.",
    sampleSize: 20,
    sampleNote:
      "29 randomize, 21 tamamladı; 1 protokol ihlali dışlandı, 20 analiz (10/10). Güncel kayıt final-20 alanı randomizasyon paydası değildir.",
    design:
      "PROMS (ACTRN12620000776909): tek merkezli paralel mekanistik RCT; stabil izotop/kas biyopsisi, tam olgu analizi.",
    population:
      "Mekanik ventilasyon alan erişkin YBÜ; bir saatte intraduodenal 40 veya 20 g whey, altı saatlik izlem.",
    primaryOutcome:
      "Altı saatlik kas fraksiyonel sentez hızı: düzeltilmiş fark 0,007 %/saat (%95 GA −0,003 ila 0,016; p=0,152).",
    summary:
      "Daha yüksek amino asit erişilebilirliğine rağmen sentez hızında gruplar arası üstünlük gösterilmedi; eşdeğerlik kanıtlanmadı.",
    application:
      "Altı saatlik sentez hızı net kas/tüm vücut dengesi değildir; günlük bireysel doz veya otomatik protein artışı çıkarılmaz.",
    limitations:
      "Küçük, çoğunluğu erkek örneklem; kayıtlı tüm vücut dengesi/yıkımı analiz edilmedi. Önceden yayımlanmış SAP doğrulanmadı; günlük/uzun dönem klinik yarar belirlenmez.",
  },
];
