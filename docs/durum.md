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
| 2. Laboratuvar | Değerler, CSV/PDF içe aktarma, referans aralıkları, NLR, PNI, üre/kreatinin, CRP oranı, SOFA-2, SAPS II; K/P/Mg değerleri refeeding hesabına girer | sırada |
| 3. Kayıtlı hastalar | Mevcut kayıt hizmetiyle kayıt; sunucu yapılandırması ve gizlilik metni değişir | sırada |
| 4. Kanıt ve izlem | Kanıt kütüphanesi, hekim seçimiyle karşılaştırma, verilen beslenme izlemi, JSON/CSV dışa aktarma, araştırma kaydı, PDF raporu | sırada |

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

## Sonraki adım

Parça 2: laboratuvar değerleri, içe aktarma, referans aralıkları ve türetilen göstergeler; K/P/Mg refeeding hesabına.
