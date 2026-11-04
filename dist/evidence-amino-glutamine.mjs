// 23 Ekim 2026: spesifik amino asit kanıtı, toplam protein hedefinden ayrılır.
// Bu kayıtlar klinik glutamin doz otomasyonu içermez.
export const glutamineEvidence = [
  {
    id: "iv-glutamine-meta-2026",
    title:
      "The effects of intravenous glutamine supplementation in critically ill patients: a systematic review and meta-analysis",
    year: 2026,
    kind: "İkincil kanıt: sistematik derleme ve meta-analiz",
    url: "https://pubmed.ncbi.nlm.nih.gov/42875940/",
    doi: "10.4266/acc.002132",
    access:
      "Özgün PubMed özet kaydı dizinde okundu; doğrudan açılış erişim hatası verdi",
    sampleSize: 1593,
    sampleNote:
      "10 RCT’nin toplamı; yeni 2026 randomizasyonu değildir. Yayın: 15 Ekim 2026.",
    design:
      "Erişkin IV glutamin RCT’lerinin random-effects meta-analizi; tarama Nisan 2025’e güncellendi.",
    population:
      "Heterojen kritik erişkinler; cerrahi/travma ve cerrahi dışı gruplar.",
    primaryOutcome:
      "Toplam mortalite RR 0,93 (%95 GA 0,77–1,13); toplam enfeksiyon RR 0,86 (0,63–1,18).",
    summary:
      "Rutin IV glutamin için sağkalım veya toplam enfeksiyon yararı gösterilmedi. Pnömoni ve ventilasyon süresindeki olumlu sinyaller az sayıda küçük çalışmaya dayanıyor.",
    application:
      "Ek IV amino asit, standart mama proteini ve enteral glutamin ayrı müdahaleler olarak kaydedilir; bu meta-analiz otomatik doz sağlamaz.",
    limitations:
      "2026 yayın tarihi, birincil deneylerin 2026’da yapıldığı anlamına gelmez. Doz, eşlik eden beslenme ve popülasyon heterojendir. Birincil çalışma yılları ve kombine IV+EN rejimlerin dahil edilmesi tam metinde doğrulanmalıdır.",
  },
  {
    id: "redoxs-glutamine-2013",
    title:
      "REDOXS: A Randomized Trial of Glutamine and Antioxidants in Critically Ill Patients",
    year: 2013,
    kind: "Birincil kanıt: büyük çok merkezli randomize çalışma",
    url: "https://www.oeaie.org/content/uploads/2014/08/Heyland2013_A-Randomized-Trial-of-Glutamine-and-Antioxidants.pdf",
    doi: "10.1056/NEJMoa1212722",
    access: "Özgün NEJM makalesinin açık PDF kopyası; tam metin",
    sampleSize: 1223,
    sampleNote: "40 YBÜ; Kanada, ABD ve Avrupa.",
    design:
      "Kör 2×2 faktöriyel RCT: glutamin, antioksidan, ikisi veya plasebo.",
    population:
      "Mekanik ventilasyon ve en az iki organ yetmezliği bulunan erişkinler; çoğunluğu şokta.",
    primaryOutcome:
      "28 günlük mortalite %32,4 ve %27,2; düzeltilmiş OR 1,28 (%95 GA 1,00–1,64; p=0,05). Önceden belirlenmiş anlamlılık sınırı p<0,044 idi.",
    summary:
      "İlk 24 saatte standart beslenmeden ayrı kombine IV 0,35 g/kg ideal ağırlık/gün glutamin + enteral 30 g/gün uygulandı. Hastane içi ve 6 aylık mortalite arttı.",
    application:
      "Organ yetmezliği/şokta ek glutamin için güvenlik uyarısını destekler. Verilen doz araştırma rejimidir; reçete önerisi değildir.",
    limitations:
      "Kombine IV+EN ve yüksek ek azot yükü, izole enteral takviye veya standart proteinli mamayla eşitlenmez. Yalnız sepsis hastalarında yapılmamıştır; birincil sonuç formel anlamlılık sınırına ulaşmamıştır.",
  },
  {
    id: "reenergize-glutamine-burns-2022",
    title:
      "RE-ENERGIZE: A Randomized Trial of Enteral Glutamine for Treatment of Burn Injuries",
    year: 2022,
    kind: "Birincil kanıt: büyük uluslararası randomize çalışma",
    url: "https://orbi.uliege.be/bitstream/2268/295097/1/Re-Energize%20%28NEJM%2022%29%20.pdf",
    doi: "10.1056/NEJMoa2203364",
    access: "Özgün NEJM makalesinin üniversite arşivindeki tam metni",
    sampleSize: 1200,
    sampleNote: "1209 randomize, 1200 analiz; 54 yanık ünitesi, 14 ülke.",
    design:
      "Çift kör plasebo kontrollü RCT; enteral glutamin 0,5 g/kg/gün ile izokalorik maltodekstrin.",
    population:
      "Deri grefti beklenen ağır yanıklı erişkinler; yaşa göre farklı yanık yüzey eşikleri.",
    primaryOutcome:
      "Canlı taburculuk süresi 40 ve 38 gün; subdistribution HR 0,91 (%95 GA 0,80–1,04; p=0,17).",
    summary:
      "Ek glutamin canlı taburculuğu hızlandırmadı. Altı aylık mortalite %17,2 ve %16,2; HR 1,06 (%95 GA 0,80–1,41).",
    application:
      "Yanık popülasyonunda biyolojik gerekçe veya eski küçük çalışmalar otomatik glutamin ekleme gerekçesi yapılmaz. Araştırma dozu reçete önerisi değildir.",
    limitations:
      "Sepsis/şok deneyi değildir. Renal disfonksiyon ve siroz dışlama nedenleriydi. Yavaş katılım nedeniyle çalışma sırasında örneklem ve birincil sonlanım değişti. İzole enteral rejim, REDOXS’un kombine rejiminden ayrılmalıdır.",
  },
  {
    id: "kspen-glutamine-guideline-2026",
    title:
      "Nutritional support for critically ill patients by the Korean Society for Parenteral and Enteral Nutrition—part II: a clinical practice guideline",
    year: 2026,
    kind: "Resmî ulusal kılavuz; glutamin önerisi uzman uzlaşısı",
    url: "https://e-acnm.org/journal/view.php?doi=10.15747/ACNM.26.0059",
    doi: "10.15747/ACNM.26.0059",
    access: "Resmî yayıncı tam metni",
    sampleSize: null,
    sampleNote:
      "Yeni hasta kohortu yok; glutamin R23 önerisinde %95 güçlü uzlaşı. Yayın: 31 Temmuz 2026.",
    design:
      "Sistematik literatür değerlendirmesi ve çok disiplinli uzman uzlaşısı.",
    population:
      "Kritik erişkinler; sepsis, organ disfonksiyonu ve diğer YBÜ alt grupları.",
    primaryOutcome:
      "R23: rutin ek enteral glutamin önerilmiyor. Bu bir klinik deney sonlanımı değildir.",
    summary:
      "Mortalite ve enfeksiyonlarda klinik olarak belirgin yarar yeterince gösterilmediğinden rutin enteral ek glutamin desteklenmiyor.",
    application:
      "Klinik durum, yol ve ek madde açıkça belirtilir. Standart formülün protein içeriği ayrı tutulur; otomatik glutamin takviyesi oluşturulmaz.",
    limitations:
      "Uzlaşı yüzdesi tedavi etki büyüklüğü veya yüksek kesinlikli RCT kanıtı değildir. Kore uygulama bağlamı gözetilir. Arginin, omega-3 ve glutamin içeren çok bileşenli ürünlerden glutaminin bağımsız etkisi çıkarılamaz.",
  },
];
