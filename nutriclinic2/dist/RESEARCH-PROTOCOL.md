# NutriClinic için araştırma ve doğrulama protokolü taslağı

**Sürüm:** 0.3.1 · **Tarih:** 24 Ekim 2026 · **Durum:** Araştırma taslağı; yürütülmüş çalışma veya klinik validasyon raporu değildir.

0.3.1 tarih/kaynak izi ve metabolik doğrulama aşamaları METABOLIC-METHODS-AND-VALIDATION.md belgesindedir. Ayrı UUN tarihi, gelecekteki dönemlerin dışlanması, ilgili girdi hataları ve böbrek/önemli bağırsak kaybı çelişkilerinin ana yorum/izlemde baskılanması teknik kurallardır. Bunların test edilmesi klinik geçerlik sayılmaz. Yeni Eylül2026 UCR kaynağı özgün indekslenen özet düzeyindedir; bireysel doz kuralına çevrilmez.

Bu belge, yetişkin YBÜ ve servis hastalarında beslenme verilerini düzenleyen ve hekimin belirlediği hedeflere göre program hesaplayan yazılımın nasıl değerlendirilebileceğini önerir. Buradaki yöntem, eşik ve sonlanımlar araştırma ekibinin ve biyoistatistikçinin değerlendirmesiyle önceden kesinleştirilmelidir. Bir yayını referans göstermek, o yayının kullanılan yazılımı doğruladığı anlamına gelmez. Önerilen ilk sürüm bir katabolizma/anabolizma tanı testi veya otomatik beslenme reçeteleyicisi olarak değerlendirilmemelidir.

## 1. Amaçların ayrılması

İlk amaç, **yazılım doğrulaması**dır: hastaya ait veri, birim, zaman ve program hesaplarının tanımlanan kurala uygun işlenmesi. İkinci amaç, ileride araştırılabilecek **klinik geçerlik**tir: göstergelerin gerçekten hangi fizyolojik durumu veya hasta sonucunu temsil ettiği. Üçüncü amaç, ancak uygun karşılaştırmalı tasarımla araştırılabilecek **klinik yarar**dır: yazılım kullanımının hasta bakımını veya sonuçlarını iyileştirip iyileştirmediği. Aritmetik doğruluğun gösterilmesi diğer iki amacı karşılamaz.

İlk sürümde enerji ve protein hedefini hekim girer. Yazılım, kullanılan ağırlığın türünü ve tarihini, hedef birimini, uygulama yolunu, mevcut beslenme katkılarını ve ürün bileşimini görünür kılar. Kılavuz aralığı yalnız bağlam sunar. Erken YBÜ fazı, böbrek replasman tedavisi, yeniden besleme riski, yutma güvenliği veya gerekli veri eksikliği gibi koşullar, otomatik hedef üretimini engelleyen klinisyen değerlendirme nedenleri olarak ele alınmalıdır. Bu engellerin etkinliği ayrıca test edilmelidir.

## 2. Popülasyonlar ve gözlem birimi

İki ayrı kohort planlanmalıdır: yetişkin YBÜ hastaları ve yetişkin servis hastaları. Aynı modelin iki grupta eşit geçerli olduğu varsayılmamalıdır. YBÜ'de akut hastalık fazı, mekanik ventilasyon ve organ destekleri; serviste nörolojik tanı, disfaji, hareketlilik ve rehabilitasyon durumu kaydedilmelidir. İnme, nöromüsküler hastalık, Parkinson hastalığı ve diğer tanılar yeterli örnek varsa önceden belirlenmiş alt gruplardır; küçük alt gruplardan kesin sonuç çıkarılmamalıdır.

Ardışık uygun hastaların alınacağı prospektif gözlemsel tasarım önerilir. Seçilme/dışlanma nedenleri akış şemasında raporlanmalıdır. Gebelik, 18 yaş altı, yoğun yanık veya farklı metabolik yönetim gerektiren popülasyonlar amaçlanan kapsam dışında ise protokolde açıkça yazılmalıdır. Karşılaştırmalı müdahale araştırması yapılmadıkça tedavi hedefleri araştırma ekibi tarafından değiştirilmez.

Hasta ana gözlem birimidir; hasta-gün veya değerlendirme ziyaretleri bunun içinde tekrarlı ölçümlerdir. Aynı kişinin yeniden yatışları güvenli araştırma kimliğiyle ilişkilendirilmeli, bağımsız hasta gibi sayılmamalıdır. YBÜ'den servise geçiş, ölüm ve taburculuk zamanları ayrıca kaydedilmelidir.

## 3. Yazılımın teknik doğrulanması

Önce dondurulmuş sürüm üzerinde sentetik ve kimliksiz test örnekleri kullanılmalıdır. İkinci bir klinisyen veya bağımsız hesap tablosu beklenen sonuçları üretmelidir. Birim dönüşümleri, ondalık virgül, sıfır/boş değer ayrımı, tarih uyuşmazlığı, klinik açıdan olanaksız değerler, güncel olmayan tetkik ve aynı laboratuvar sonucunun çift yüklenmesi sınanmalıdır.

Hesaplanan günlük hacim, saatlik hız, enerji, protein, serbest su ve eksik/fazla hedef katkısı bağımsız yöntemle karşılaştırılmalıdır. Reçete edilen ve gerçekten uygulanan miktar ayrılmalıdır. Beslenmeye ara verilen süreler ve oral/enteral/parenteral diğer kaynakların etkisi test edilmelidir. Enerjiye göre seçilen bir ürünün proteini otomatik olarak karşıladığı varsayılmamalıdır.

Yüklenen laboratuvar raporunda kaynak değer, birim ve örnek zamanı hesap öncesinde kullanıcıya doğrulatılmalıdır. OCR veya metin çıkarımı uygulanırsa parametre bazında doğruluk, birim hatası ve klinik açıdan önemli atlama oranı ayrı raporlanmalıdır. Beklenmeyen dosya biçimleri, bozuk dosya, aşırı dosya boyutu ve dosya içinden gelen komut benzeri metinler uygulamanın klinik kurallarını değiştirmemelidir.

Başarı ölçütleri ve kabul toleransları testten önce yazılmalıdır. Kritik engelin atlanması gibi olaylar için yalnız genel ortalama doğruluk verilmesi yeterli değildir. Teknik test sonucu ile klinik değerlendirme sonucu ayrı sürümlenmeli ve raporlanmalıdır.

## 4. Katabolizma/anabolizma ve referans ölçüm sorunu

Rutin kan paneliyle bütün vücut protein anabolizmasını doğrudan ölçen, bu kullanım için doğrulanmış tek bir altın standart kabul edilmemelidir. Albümin, prealbümin, CRP, üre ve kas ölçümleri farklı süreçleri yansıtır; beslenme, inflamasyon, sıvı dengesi ve organ işlevleri birbirine karışabilir. Bu nedenle çalışma çıktısı başlangıçta “katabolik/anabolik tanı” yerine ölçülen göstergeler, sınırlılıklar ve veri yeterliliği olmalıdır.

Azot dengesi araştırmada yardımcı bir referans olabilir; kusursuz altın standart değildir. Sık kullanılan yaklaşık denklem `alınan protein (g/gün) / 6.25 − [24 saatlik idrar üre azotu, UUN (g N/gün) + 4]` biçimindedir. Sabit 4 g düzeltmesi, idrar dışı ve üre dışı kayıplara ilişkin kaba varsayımdır; kişiye özgü ölçüm değildir. Toplam idrar azotu ölçümü ile UUN birbirinin yerine yazılamaz. “Üre” ile “üre azotu”, g/L ile g/24 saat ve toplanan hacim de ayrı alanlar olmalıdır.

Eksik 24 saatlik idrar, tahmin edilen protein alımı, değişen üre havuzu, akut böbrek hasarı, KRT ile azot kaybı, dren/fistül/ishal kayıpları ve kararlı olmayan metabolik durum hesabı etkileyebilir. Pozitif hesaplanan denge kas yapımını, negatif denge de yalnız yetersiz mama verildiğini kanıtlamaz. Yüksek protein alımıyla azot dengesinin değişmesi, hasta sonuçlarının iyileştiği anlamına gelmez. Böbrek fonksiyonu ve protein metabolizması etkileşimi [ESPEN 2024 böbrek kılavuzunda](https://doi.org/10.1016/j.clnu.2024.08.002) ele alınmaktadır.

Azot dengesi kullanılacaksa örnek toplama kalitesi, hesapta kullanılan gerçek alım ve bütün kayıp varsayımları saklanmalı; güvenilir ölçüm alt grubuyla duyarlılık analizi planlanmalıdır. Olanak varsa bağımsız uzman değerlendirmesi ve seri kas/fonksiyon ölçümleriyle birlikte incelenmelidir. Aynı kan indekslerinden oluşturulan uzman etiketini aynı indekslerle tahmin etmek, bağımsız fizyolojik doğrulama olarak sunulmamalıdır. Daha doğrudan metabolik araştırma alt çalışması düşünülecekse yöntem, uzman metabolizma laboratuvarı tarafından ayrıca belirlenmelidir.

## 5. Prospektif gözlemsel çalışma akışı

1. Etik ve kurum izinleri, veri sözlüğü, analiz planı ve sürüm dondurması tamamlanır.
2. Başlangıç değerlendirmesi ve takip pencereleri önceden belirlenir. Örnek alınma zamanı ile raporun sisteme giriş zamanı birlikte tutulur.
3. Hekim ve diyetisyen rutin kararı, yazılım çıktısı görülmeden kaydedilir. Sessiz çalışma döneminde çıktı bakım kararını değiştirmez; klinik uyum ve kullanılabilirlik araştırılır.
4. Takipte gerçek enerji/protein alımı, besleme kesintileri, tolerans, sıvı dengesi, P/K/Mg/glukoz, böbrek desteği ve uygun fonksiyon ölçümleri toplanır. Ölçüm sıklığı klinik gereksinime göre yürütülür; yalnız araştırma için ek işlem etik protokolde tanımlanır.
5. Bağımsız değerlendirmeciler, önceden tanımlanan ölçütlerle kritik uyuşmazlıkları sınıflandırır. Değerlendirmeciler arası uyum ve anlaşmazlık çözümü raporlanır.

Bu tasarım yazılım kaynaklı yarar veya zarar konusunda nedensel etkiyi göstermez. Yazılımın daha sonra bakımda kullanılması planlanırsa insan faktörleri, uygulama güvenliği ve uygun karşılaştırmalı etki tasarımı ayrı bir sonraki aşamadır.

## 6. Sonlanımların ve analizlerin önkaydı

Yazılım doğrulamasında birincil sonlanım, örneğin **önceden tanımlanmış klinik açıdan önemli hesap veya güvenlik kuralı hatası içeren değerlendirmelerin oranı** olabilir. “Klinik açıdan önemli” tanımı, payda ve hata önem dereceleri çalışma başlamadan kesinleştirilmelidir. Güven aralıkları ve hasta başına kümelenme dikkate alınmalıdır.

Klinik gözlemsel çalışmada birincil soru farklı olmalıdır. Bağımsız, yeterince güvenilir referans varsa belirli zaman noktasındaki uyum/kalibrasyon; yoksa fizyolojik ve fonksiyonel ölçümlerle ilişkiler keşifsel olarak adlandırılmalıdır. Kas veya fonksiyon ölçüm yöntemini, değerlendiriciyi, zaman penceresini ve sedasyon/işbirliği gibi ölçülebilirlik koşullarını önceden seçmek gerekir. Beslenme yeterliliği bir süreç ölçütüdür; tek başına hasta yararı sayılmamalıdır.

Sekonder ölçütler, klinisyenler arası uyum, veri düzeltme ihtiyacı, gerçek alım–hekim hedefi farkı, intolerans ve seçilmiş fonksiyon ölçümleri olabilir. Mortalite, yatış süresi ve enfeksiyon gibi sonuçlar uygun biçimde tanımlanmalı; yeterli tasarım ve örneklem yoksa keşifsel kalmalıdır. Çoklu karşılaştırmalar, alt gruplar, güven aralıkları ve klinik anlamlılık yaklaşımı önceden yazılmalıdır.

Çalışma sorusu, dahil etme ölçütleri, sonlanımlar, analiz planı, yazılım sürümü ve sapma bildirim yöntemi veri sonuçları görülmeden uygun kayıt sisteminde kaydedilmelidir. Yapılacak modelleme ve raporlama için [TRIPOD+AI 2024](https://doi.org/10.1136/bmj-2023-078378) kullanılabilir; bu bir ürün onayı değildir.

## 7. Tekrarlı ölçümler ve veri sızıntısı

Aynı hastanın farklı günleri eğitim ve doğrulama kümelerine rastgele dağıtılmamalıdır. Hastanın bütün yatışları aynı grupta tutulmalı; iç doğrulamada hasta düzeyinde yeniden örnekleme veya grup bazlı katlama kullanılmalıdır. Zaman içi genellenebilirlik için daha sonraki dönem; mümkünse ayrıca başka kurum verisi üzerinde, algoritma değiştirilmeden değerlendirme planlanmalıdır. Küçük veri setini yalnız rastgele ikiye bölmek güvenilir dış doğrulama yerine geçmez.

Her tahmin için bilgi kesim zamanı tanımlanmalıdır. O andan sonra çıkan laboratuvarlar, sonradan düzeltilen tanılar veya ileride oluşan sonuçlar girdi olarak kullanılamaz. Standardizasyon, değişken seçimi, eksik veri işlemleri ve eşik seçimi yalnız geliştirme verisinde yapılmalı; katlamalı analizde her eğitim katlamasının içinde yeniden kurulmalıdır. Dış doğrulama verisi eşik ayarlamak için kullanılırsa artık bağımsız test sayılmaz.

Tekrarlı sonuçlarda karma etkili model, GEE veya uygun başka yaklaşım istatistikçi tarafından seçilmelidir. Güven aralıkları hasta düzeyindeki bağımlılığı yansıtmalıdır. Ölüm/taburculuk nedeniyle takip kesilmesi ve servis geçişi sıradan rastgele kayıp gibi kabul edilmemelidir.

## 8. Eksik veri ve örneklem büyüklüğü

Eksik ölçüm “normal”, “sıfır” veya negatif bulgu sayılmamalıdır. Eksikliğin nedeni, oranı ve zamanı; YBÜ/servis ve hasta alt grupları için ayrı raporlanmalıdır. UUN yapılmayan hastalarda azot dengesi üretmemek ve değerlendirilebilen hasta oranını raporlamak mümkündür. Çoklu atama düşünülürse değişken listesi, varsayımlar ve doğrulama sürecinde nasıl uygulanacağı önceden yazılmalıdır. Tam olgu analizi ve farklı eksiklik varsayımlarıyla duyarlılık analizleri planlanmalıdır.

Sayısal örneklem büyüklüğü bu aşamada belirlenemez. Karşılaştırmalı etki araştırması için beklenen klinik anlamlı fark, varyans/standart sapma veya olay oranı, alfa, güç, takip kaybı ve hasta içi korelasyon gerekir. Doğrulama araştırmasında ise hedeflenen güven aralığı genişliği ve beklenen performans/olay sıklığı ayrıca gereklidir. Hasta-gün sayısı bağımsız hasta sayısının yerine kullanılamaz. Ön çalışma bu parametreleri tahmin edebilir; son örneklem gerekçesi biyoistatistikçi tarafından oluşturulmalıdır. [Örnekleme özgü dış doğrulama yaklaşımı](https://doi.org/10.1136/bmj-2023-074821), tek bir ezber hasta sayısına tercih edilmelidir.

## 9. Etik, KVKK ve hasta verisi mimarisi

Etik kurul ve kurum veri sorumlusu, çalışmanın bakım, araştırma ve yazılım geliştirme amaçlarını ayrı değerlendirmelidir. Açık rıza gerekliliği ve varsa uygulanabilecek diğer hukuki şartlar kurum tarafından belirlenmelidir; hekimin erişim yetkisi her araştırma/aktarım için otomatik yetki sayılmamalıdır. KVKK'nın [güncel özel nitelikli veri açıklaması](https://www.kvkk.gov.tr/Icerik/2051/Ozel-Nitelikli-Kisisel-Veriler) ve [6. madde değişikliğine ilişkin rehberi](https://www.kvkk.gov.tr/Icerik/8184/Ozel-Nitelikli-Kisisel-Verilerin-Islenmesine-Iliskin-Rehber) bu incelemede kullanılmalıdır.

Önerilen mimari varsayılan olarak veri minimizasyonu yapar: T.C. kimlik numarası, ad-soyad, barkod ve iletişim bilgileri araştırma hesapları için gerekmiyorsa alınmaz. Takma kimlik anahtarı kurumda ayrı, erişimi sınırlı tutulur. Takma kimlikleştirme anonimleştirme değildir. Laboratuvar PDF'sinin görünen veya gizli kimlik alanları gözden geçirilmeden araştırma dosyası diye dışarı aktarılmamalıdır.

Hasta dosyasının tarayıcı içinde işlenmesi hedefleniyorsa bunun gerçek ağ trafiğiyle doğrulanması gerekir. Üçüncü taraf OCR, LLM, hata izleme, analitik, CDN ve depolama hizmetlerine gönderim olmaması ayrıca sınanmalıdır. “Tarayıcıda çalışıyor” ifadesi tek başına verinin cihazdan çıkmadığını göstermez. Klinik dosyaların herkese açık siteye, repoya veya örnek veri paketine konulmaması gerekir.

Kurum içi sunucu kullanılırsa yetki rolleri, kimlik doğrulama, erişim kaydı, aktarımda/depolamada şifreleme, anahtar yönetimi, yedekleme, saklama-imha süresi ve olay müdahalesi tanımlanmalıdır. Dış hizmet veya yurt dışı aktarım planlanırsa işleyen/sorumlu rolleri ve aktarım koşulları ayrıca incelenmelidir. Bu taslak mimarinin kurulmuş, denetlenmiş veya KVKK'ya uygun olduğu iddiasını içermez.

## 10. Raporlama ve ilerleme koşulları

Yayın, kullanılan sürümü, ölçüm ve birim sözlüğünü, kaynakların erişim düzeyini, protokol sapmalarını, başarısız/eksik örnekleri ve bütün önceden belirlenmiş sonlanımları içermelidir. İlk taslaktaki EFFORT Protein için yalnız özet erişimi ifadesi daha sonraki SBÜ VETİS tam metin incelemesiyle güncellenmiştir. EFFORT, GLIM 2026, GLINTS 2026 ve Deng 2026 için daha önce kaydedilmiş VETİS incelemesi; 24 Ekim tarihli açık web odaklı ek taramadan ayrı erişim olayıdır. AHA 2026 kısmi dizin erişimi ve NEXIS 2026 özgün özet erişimi gibi sınırlar kaynak bazında korunur. Yeni eklerin tamamının VETİS tam metninin okunduğu iddia edilmez.

Klinik tercih ekranı hekim yorumunu, kaynak kimliklerini, girdilerin inceleme anındaki kopyasını, gerekçeyi ve zamanı kaydeder. Bu kayıt tedavi etkisi kanıtı veya protokol uyumu denetimi değildir. Hasta girdileri veya klinik onaylar değişince yeniden inceleme gerekir. Dış JSON’dan alınan onay güncel klinik inceleme olarak kabul edilmez; özgün kayıtta tarihsel veri olarak kalır. Tercih ekranı hedefleri/dozları değiştirmez ve yüksek riskteki hesaplama engellerini kaldırmaz.

Bu sürümdeki odaklı karşılaştırmalar sistematik derleme yerine geçmez. Tam bilimsel değerlendirme için önceden kaydedilmiş PICO/uygunluk planı, veri tabanına özgü arama dizgileri, yinelenenlerin ayıklanması, bağımsız çift tarama, protokol/kayıt/düzeltme eşleştirmesi ve çalışma tasarımına uygun yanlılık riski değerlendirmesi tamamlanmalıdır. GRADE veya RoB 2 puanı otomatik olarak üretilmez. Özellikle farklı faz, müdahale, kontrol ve sonlanımları olan çalışmalar tek bir doz etkisi gibi birleştirilmemelidir.

Prospektif veriler olmadan “klinik olarak valide”, “katabolizma/anabolizmayı tanılar” veya “sonuçları iyileştirir” ifadeleri kullanılmamalıdır. Yeni klinik kural veya kaynak güncellemesi sürüm değişikliği sayılmalı; teknik regresyon testleri ve değişikliğin klinik kapsam incelemesi tamamlanmadan kullanım kapsamı genişletilmemelidir.


## 0.3 ek: günlük gerçekleşen alımın analizi

Gerçek enerji/protein alımı, aynı tam 24 saat boyunca değişmeden geçerli olduğu doğrulanan hekim hedefiyle karşılaştırılır. Olgu, yatış, ortam, faz ve plan sürümü farklı kayıtlar birleştirilmez. Kayıt kimliği gözlem günü değildir; yeniden kaydetme veya içe aktarma yeni hasta-günü yaratmaz. Çakışmalar, revizyon seçimi ve dışlanan kayıtlar analiz izinde korunur. Kapsama yalnız korunan hizalı dönemler arasındadır; tüm yatış süresi veya tam veri varlığı anlamına gelmez. Eksik günler sıfır kabul edilmez. JSON aktarılmış karşılaştırmayı kaynak izi olarak korur fakat dış seçim/onayları etkinleştirmez. CSV, seçilen/dahil edilen kayıt ve dışlama nedenlerini taşır. Ayrıntı FOLLOW-UP-METHODS.md belgesindedir. Bu oranlar ve azot dengesi seyri için klinik sonuçta yarar veya optimum doz validasyonu yapılmış değildir.

## 0.3.6 teknik ek: çevrimdışı sentetik analiz ön denemesi

25 Ekim 2026'da hazırlanan [ayrı analiz paketi](./ANALYSIS-DRY-RUN-METHODS.md), dış planlı-ölçüm çizelgesini, paydaları, eksiklikleri, seçilmiş revizyonları ve aynı hastadaki tekrarlı pencereleri sentetik verilerle işler. Günlük aday−referans farkı, açık bir pencere ağırlıklı hedef ve hasta ağırlıklı betimsel duyarlılık ile hesaplanır; isteğe bağlı varyans bileşenleri gösterimi ve hasta düzeyinde yeniden örnekleme koşulları ayrıca yazılır. Bu, uygulamanın JSON şeması veya gerçek bir fizyolojik referans değildir. Sentetik bağımsızlık beyanı gerçek ölçüm bağımsızlığını kanıtlamaz; teknik ön deneme nihai SAP, uygunluk kararı veya klinik validasyon yerine geçmez. Araştırma ekibinin referans, ana hedef büyüklük, klinik kabul sınırı, seri bağımlılık ve örneklem kararları açık kalır.

## Odaklı özgün çalışma taraması eki · 25 Ekim 2026

FOCUSED-SEARCH-METHODS.md, 12 yürütülmüş PubMed sorgusunu ve tekrar üretilebilir ham kayıt paketini açıklar. 3977 sorgu üyeliği, PMID ile 2544 benzersiz aday kayda indirgenmiştir; bu sayılar uygun çalışma, bağımsız deney veya hasta sayısı değildir. Bağımsız insan elemesi, tam metin çıkarımı ve tasarıma uygun yanlılık/kanıt kesinliği değerlendirmesi bekler. Klinik algoritmaya otomatik doz veya kesin metabolik tanı kuralı eklenmez.

## Güncel kaynak erişimi açıklaması · 26 Ekim 2026

Bu ek, **0.3.1 / 24 Ekim 2026 tarihli özgün araştırma taslağını** ve önerilen çalışma seçimlerini korur. Başlangıç paragrafındaki Eylül 2026 UCR kaynağının yalnız indekslenen özet düzeyinde olduğu ifadesi, o tarihin erişim kaydıdır; güncel erişim düzeyi aşağıdaki tarihli notlarda ayrılır. Bu açıklama geriye dönük protokol/SAP önbelirlemesi, onaylanmış protokol değişikliği, etik izin veya klinik validasyon değildir.

- **UCR, 25 Ekim özgün kaynak incelemeleri:** Zhou'nun yetkili kurum erişimiyle ana yöntem/sonuç ve görünen tabloları incelendi; şekilleri ve ekleri okunmadı. Servis EFFORT makalesinin kamuya açık WUR özgün metni, tabloları ve Şekil 3 incelendi; ekler/SAP doğrulanmadı. Çalışma ölçekleri uygulamanın kütle oranlarıyla eşitlenmez; basılı EFFORT formül/ölçek uyuşmazlığı çözülmüş sayılmaz. [YBÜ/servis UCR kaynak yöntemi](./UCR-ORIGINAL-SOURCE-METHODS.md).
- **Deng, 26 Ekim özgün ana HTML incelemesi:** Ana yöntem/sonuç, altı tablonun metni ve şekil açıklamaları incelendi; şekil görüntüleri ve ek okunmadı. Günlük MIMIC-IV analizi ile ilk hafta ortalamalı/başlangıç fizyolojili NEED analizi ayrıdır. Bu erişim ortak bir fizyolojik pencere, metabolik tanı veya doz kuralı doğrulamaz. [Deng kaynak ve yöntem notu](./DENG-METABOLIC-SOURCE-METHODS.md).
- **Fradkin, 26 Ekim yayıncı ana metni ve güncel resmî kayıt:** Özgün ana yöntem/sonuç ile güncel kayıt incelendi; protokol DOI'si bibliyografik olarak doğrulandı. Özgün protokol/SAP, tarihsel kayıt sürümleri, akış görüntüsü ve ek okunmadı. Farklı örneklem ve izlem başlangıçları eşitlenmez. [Enerji ölçümü ve izlem kaynak yöntemi](./ENERGY-MEASUREMENT-AND-DELIVERY-SOURCE-METHODS.md).

Erişim durumları yayın ve erişim yoluna özgüdür; bir sağlayıcıdaki tarayıcı kontrolü veya ret diğer bütün yayıncı yollarının kapalı olduğunu göstermez. Bu ek yeni kaynak erişimi gerçekleştirmez ve diğer yayınların daha sonra değişebilecek erişim kaydını genellemez. Güncel uygulama sınırları [metabolik yöntem ve doğrulama planında](./METABOLIC-METHODS-AND-VALIDATION.md) tutulur. Bağımsız referans, sonlanım, örneklem ve analiz kararları ile kurum/etik onayları araştırma ekibi tarafından tamamlanmalıdır; kaynak okuması bu kararların yerine geçmez.
