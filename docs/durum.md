# Durum ve taşıma planı

Son güncelleme: 7 Kasım 2026.

## Neredeyiz

`/nutriclinic/` artık kademeli öneri sürümüdür: beslenme yolu, içerik sınıfına göre mama türü, günlük
miktar (mL, hız, öğün, gram), gerekli takviyeler ve eksik veri listesi. Önceki çalışma alanı
`/nutriclinic2/` adresinde aynen çalışır; kayıtlı hastalar oradadır.

Kullanıcı kararı (7 Kasım 2026): önceki sürümün bütün bilgi ve özellikleri yeni kademeli düzene taşınır.
Bilgi silinmez; etkileşim düzeni değişir, eskiden olmayan özellikler eklenir. Her parça ayrı yayınlanır;
her parça teste ve bağımsız denetime girer.

## Parçalar

| Parça | İçerik | Durum |
|---|---|---|
| 1. Ölçekler | NRS 2002, GLIM, ESPEN 2015, AND/ASPEN, EWGSOP2 (sarkopeni), EAT-10, FOIS, IDDSI, yutma güvenliği; alan yanı hata mesajları | 7 Kasım 2026'da yayınlandı (sürüm 1.1.0); 66 test; bağımsız denetimde 8 bulgu, 6'sı düzeltildi, 2'si gerekçeyle reddedildi |
| 2. Laboratuvar | 2a: değerler, birim seçimi, fosforla refeeding hipofosfatemisi, NLR, PNI, üre/kreatinin oranı. 2b: içe aktarma, referans aralıkları, SOFA-2, SAPS II | 2a 7 Kasım 2026'da yayınlandı (sürüm 1.2.0). 2b 7 Kasım 2026'da yayınlandı (sürüm 1.3.0, 78 test; Codex denetiminde 5 bulgu, hepsi düzeltildi): CSV/JSON/TXT içe aktarma, 11 test için yerel referans aralıkları, CRP oranı, SOFA-2, SAPS II. PDF okuma kullanıcı onayıyla 1.6.0'da eklendi |
| 3. Kayıtlı hastalar | Cihazda saklama; isteğe bağlı olarak sitede saklama (mevcut kayıt hizmeti; sunucu yapılandırması ve gizlilik metni değişir) | Kullanıcı kararı (7 Kasım gece): cihazda saklama olsun, isteyen sitede de saklasın (işaretlenen ek seçenek). 3a cihazda saklama kodlandı (sürüm 1.7.0, `web/cases.mjs`): açık vaka her değişiklikte bu tarayıcıya kaydedilir, en çok 50 vaka, "Vakalarım" listesi (vaka kodu, açma, silme), son vaka yalnız 12 saat içinde kendiliğinden açılır, örnek vaka saklanmaz, saklama kapatılınca vakalar silinir. 3b sitede saklama: kullanıcı kararı (7 Kasım gece) "1000 vaka dahi çok yer kaplamayacaksa sitede sakla, kişisel kodla şifreli" (bir vaka şifreli 2–7 KB, 1000 vaka birkaç MB): sürüm 1.8.0, `web/vault.mjs` + `server/nutriclinic_vault.py`; vakalar tarayıcıda kişisel kodla şifrelenir, sunucu yalnız şifreli metni tutar; ayrı Compose servisi `nutriclinic-vault`, nginx `/nutriclinic/api/vault/`. 7 Kasım gece yayınlandı (kurulum yedeği ~/backups/nutriclinic-vault-20261107T184210Z) ve canlıda sentetik veriyle denendi: yeni kod, gönderme, cihazı temizleyip kodla geri alma, silme, yanlış kod. Bağımsız güvenlik incelemesi 5 önemli, 3 küçük bulgu verdi; 1.8.1'de düzeltildi (silmeler kaybolmaz ve geri gelmez, indirme sırasında yapılan düzenleme ezilmez, temizlenen cihaza eşitleme yazmaz, işaretler 90 gün sayılır, boş hesaplar bir gün sonra sayılmaz, kimlikler tam eşleşir, kod saklanmaz, bağlanırken onay, istemci başına hız sınırı). Sunucu dışı yedeğe henüz dahil değil. Kullanıcı kararı (7 Kasım gece, ikinci): şifreli kasa yerine anonim kopya: her vakaya site kodu verilir, etiket cihazda kalır ve kod cihazda eşleşir; sitede yalnız klinik değerler (SQLite); kopyayı yalnız gönderen cihaz ve yönetici görür; yönetici şifreli /nutriclinic/yonetim/ sayfasında anonim görür; kutunun açıklaması tek cümle. Sürüm 1.9.0 |
| 4. Kanıt ve izlem | 4a: yazdırılabilir rapor (tarih, sürüm, girilen bilgiler), vakayı JSON dosyasına kaydetme ve açma, tablo CSV. 4b: verilen beslenme izlemi. 4c: kanıt kütüphanesi ve hekim seçimiyle karşılaştırma | 4a yayınlandı (sürüm 1.4.0). 4b 7 Kasım 2026'da yayınlandı (sürüm 1.5.0, 81 test; Codex denetiminde bir ifade bulgusu, düzeltildi): günlük verilen enerji/protein, o günün hedefi, yüzde, birikmiş fark, erken fazda aşırı beslenme işareti, vaka dosyasında saklanır. 4c (kanıt kütüphanesi, karar konuları) ve PDF okuma 1.6.0 olarak yüklendi ve sahnoroloji'de denendi (kullanıcı isteği: yerel önizleme yok). Codex denetiminde 15 bulgu, ikinci denetimde 13 bulgu daha; hepsi sürüm 1.6.1'de düzeltildi (86 test): sınır değerler (<, >) ve referans aralıkları değer sayılmaz, binlik ayırıcı reddedilir, nitelikli testler (direkt bilirubin, idrar kreatinini) ve üre/BUN karışık adlar okunmaz, birden çok sonuçta hekim seçer, karar konuları vaka dosyasında korunur, PDF okumada süre ve boyut sınırı var. Bağımsız iç inceleme (Codex hakkı bitince) 2 kritik, 2 önemli, 6 küçük bulgu verdi; 1.7.1'de düzeltildi (89 test): okunamayan ya da sınır değerli yeni sonuç eski değerin önceden seçilmesini engeller, birim önde olan düzende aralık ve eski sonuçlar değer sayılmaz, bütün tire biçimleri aralıktır, idrar/BOS/sıvı başlığı altındaki değerler serum sayılmaz, CSV'de ondalık virgül bölünmesi ve çift alan reddedilir |

## Parça 1: ölçekler öneriyi nasıl değiştirir

- FOIS, IDDSI, uyanıklık bozukluğu ve yutma sırasında güvensizlik bulgusu yutma durumunu belirler.
  Bilgiler çelişirse en temkinli olan kullanılır ve uyarı verilir.
- IDDSI sıvı düzeyi ONS türünü seçer: ince sıvı güvenliyse sıvı ONS, değilse kıvamlı ONS ve
  kıvam artırıcı.
- Serviste NRS 2002 tamamlanmış ve 3'ün altındaysa, alım bilinmese de ONS önerilmez; haftalık tarama
  önerilir. Risk varsa ya da tarama eksikse önceki temkinli davranış sürer.
- GLIM evre 2 (ağır malnütrisyon), sindirim kanalı kullanılamayan yoğun bakım hastasında parenteral
  beslenmeyi erkene alır (ESPEN 2023 R7).
- Ödem ya da sıvı yükü işaretlenirse kilo ve BKİ'ye dayanan "karşılanmadı" sonuçları güvence sayılmaz:
  bilinmiyor olarak kalır.
- Kilo kaybı 6 aydan uzun sürede olduysa NICE refeeding kilo kaybı ölçütü uygulanamaz; bilinmiyor
  sayılır.
- EWGSOP2 sarkopenisinde doz değişmez; direnç egzersizi ve protein hedefine ulaşma notu verilir.
  Lösin ve HMB için ayrı doz önerilmez.

## Hata mesajları (kullanıcı isteği, 7 Kasım 2026)

Geçersiz değer alanın hemen altında, kabul edilen aralık ve girilen değerle yazılır (örnek: "100–230 cm arasında
olmalı; girilen 1700"). "Devam" ve "Öneriyi göster" kartta kalır ve ilk hatalı alana gider; sayfa tepeye atmaz.
Sonuç sayfasında kalan hatalı alanlar adım numarasıyla listelenir, "Düzelt" düğmesi alanı açar. Etikete girilen
geçersiz değer alanın altında gösterilir ve kullanılmaz; öneri durmaz.

## Parça 1 denetimi

Bağımsız denetim Antigravity üzerinden Gemini ile yapıldı (ilk koşu takıldı; değişen bölümlerle yeniden gönderildi).
Düzeltilenler: ESPEN 2015'te 3 aydan uzun sürdüğü bilinen %5–10 kayıp ölçütü karşılamaz; ESPEN 2015 tanısı pozitif
taramayı bekler; NRS 2002'de BKİ 20,5 dahil; GLIM, ESPEN 2015 ya da AND/ASPEN malnütrisyonu tiamin, D vitamini ve
serviste ONS kararında sayılır; sindirim kanalı kullanılamayan yoğun bakım hastasında GLIM evre 2 gösterilmedikçe ya
da dışlanmadıkça veri istenir; inmede yutma taraması girilmemişse eksik veri önemi "yüksek". Reddedilenler: ICFSR
kaynağı zaten notla kaydediliyor; serviste protein hedefi zaten 1,2 g/kg (1,2–1,5).

## Açık kararlar (kullanıcıya soruldu)

- PDF'ten değer okuma: kullanıcı onayladı (7 Kasım): incelenmiş PDF.js 6.2.108 eklendi. Daha yeni 6.5.438 var
  (1 Kasım); geçiş ayrı inceleme ister.
- Parça 3, kayıtlı hastalar: kullanıcı önce "şimdilik sunucuya eklenmesin" dedi (7 Kasım), sonra (7 Kasım gece)
  "cihazda saklama olsun. veriler istenirse sitede de saklanabilsin öyle bir extra seçenek de koy, isteyen onu
  işaretler" dedi.
- Onay beklenirken parça 4'ün sunucu gerektirmeyen kısımları (kanıt kütüphanesi, izlem, dışa aktarma, yazdırılabilir
  rapor) yapılabilir.

## Parça 2 planı: laboratuvar (iki adımda yayın)

Eski sürümde 10 test vardı: laktat, kreatinin, albümin, nötrofil, lenfosit, CRP, potasyum, fosfat, magnezyum, UUN.
Ayrıca CSV/JSON/PDF/TXT içe aktarma, yerel referans aralıkları, NLR, PNI, üre/kreatinin oranı (UCR), CRP/üst sınır
oranı, SOFA-2 ve SAPS II.

**2a — değerler ve öneriye etkisi**
- Yeni 7. kart "Laboratuvar"; D vitamini ve CRP buraya taşınır.
- Birim seçimi: Türkiye'de fosfor, magnezyum, kreatinin, üre mg/dL; albümin g/dL; CRP mg/L ya da mg/dL. Motor
  mmol/L, g/L, mg/dL (kreatinin, üre) ve mg/L ile hesaplar; dönüşüm molar kütleden (P 30,97; Mg 24,305;
  kreatinin 88,4; üre 6,006; BUN × 2,14).
- Fosfat, beslenme öncesi ve şimdiki değer girilirse refeeding hipofosfatemisi kendiliğinden belirlenir
  (<0,65 mmol/L ya da >0,16 mmol/L düşüş; ESPEN 2023 R57).
- K/P/Mg ve laboratuvarın alt sınırı girilirse "beslenme öncesi düşük mü" sorusu kendiliğinden yanıtlanır.
  Popülasyon varsayılanı konmaz (eski sürümdeki karar). Beslenme öncesi fosfor <0,65 mmol/L her laboratuvarda
  düşük sayılır; alt sınırı girilmemiş değer eksik veri olarak istenir (denetim bulgusu: 0,65 eşiği beslenme
  sırasındaki düşüş içindir).
- Sonuçta "Laboratuvar göstergeleri": NLR, PNI (Onodera 1984, PMID 6438478), UCR (araştırma belirteci; CRRT
  düşürür, PMID 40506980), CRP/üst sınır. Doz değiştirmez.

**2b — içe aktarma ve skorlar**
- CSV/JSON (test, value, unit, date) ve TXT içe aktarma: önizleme, seçerek aktarma, cihazda okunur.
- PDF metni okuma eski sürümde PDF.js ile yapılıyordu. Yeni sürüme eklemek bağımlılık değişikliği: önce
  kullanıcıya sorulur (onaylandı; incelenmiş PDF.js 6.2.108, sürüm 1.6.0).
- Yerel referans aralıkları (oturum boyunca).
- SOFA-2 (Ranzani 2025, PMID 41159833) bileşenleri ve SAPS II kaydedilmiş toplamı (Le Gall 1993, PMID 8254858).
