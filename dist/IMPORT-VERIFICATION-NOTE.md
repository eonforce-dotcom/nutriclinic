# File review and provenance verification / Aktarım ve kaynak izi

24 October2026 · interface0.3.2 · synthetic data only. This is software verification, not clinical validation or evidence of patient benefit.

## Correct browser entry point

The visible laboratory upload area is a label linked to the native file input. Supported browser automation successfully opened the chooser by clicking its visible “Select laboratory results” text. Earlier attempts targeted the visually hidden1×1px input and did not emit an event. Those attempts did not establish an application failure; the previous verification limitation is now resolved for the tested CSV flow.

## Verified data path

The synthetic CSV below was selected through the visible control, reviewed, selected and applied in the browser:

```csv
test;value;unit;date
albumin;31;g/L;2026-10-23
uun;13;g N/24h;2026-10-24
```

The blood date remained23October and UUN date24October. Values31 and13 were retained; laboratory, collection and target confirmations required review. After “Clear import”, both values/dates remained and the preview disappeared. A saved JSON record retained the two original source entries, their units, dates and structured-file-review provenance. Clearing a preview therefore does not erase evidence supporting already entered measurements.

With a valid preview already visible, selecting a10,485,761-byte file removed the old apply button/rows and displayed a persistent10MB error. Existing measurements were retained and relevant laboratory/target confirmations were false. No stale preview could be mistaken for the rejected file's contents.

## Asynchronous regression tests

Nine tests run the actual application handler source in an isolated Node VM with a minimal DOM and controlled promises. They deliberately resolve an older operation after a newer operation. This verifies handler behavior without substituting a separate copy of its algorithm. Covered sequences include:

- CSV/JSON selection A→B, B completes before A; only B may update the preview.
- Stale TXT success/error cannot replace current status/text.
- PDF cancellation at six asynchronous stages; obsolete work cannot publish text, and an opened PDF releases its own resources.
- Research JSON A→B; stale success, failure or final input cleanup cannot replace B's records/state.
- New assessment, example, saved-visit opening, synthetic follow-up, case/date edits and record clearing invalidate the relevant pending jobs.
- Preview clearing preserves source provenance; new cases/examples explicitly clear it and saved-visit opening restores its recorded provenance.
- Oversized laboratory files clear stale previews; cancelling a chooser with no file is a no-op.

Laboratory and research streams have separate generation identifiers. A stale operation may clean up its own PDF resources but may not change the current preview, status, input or records. Opening a saved visit resets all five laboratory/collection/product/target confirmations without modifying its historical source snapshot.

The VM tests complement real-browser flow tests; they do not measure OCR accuracy, patient outcomes or physiological validity. PDF/TXT content remains review-only and is not automatically mapped into laboratory fields. Scanned-image OCR is not implemented. Printed PDF pagination remains a separate uncompleted verification item.

Research JSON was also exported and reopened through its visible chooser in the browser: three records remained, no unverified follow-up plots were activated, and opening one record preserved its UUN value/date while resetting all five confirmations. The old output was not accepted as a current verified interpretation.

## Türkçe kısa açıklama

Bu sürümde dosya seçimi görünür yükleme alanından uçtan uca test edildi. Farklı kan/UUN tarihleri ayrı kaldı; “aktarımı temizle” sonrasında ölçümlerle birlikte kaynak izi de korundu. Büyük dosyada önceki aktar düğmesi kaldırılıp kalıcı hata gösterildi.

Yavaş biten eski dosyanın yeni olguyu/önizlemeyi geri yazması düzeltildi. Dokuz test uygulamanın gerçek işleyicilerini kontrollü gecikmelerle çalıştırır; ayrıca tarayıcıda CSV ve JSON kaynak çıktısı incelendi. Bunlar yazılım doğruluğunu sınar; klinik validasyon, OCR başarımı veya hasta yararı göstermez. PDF sayfa düzeni doğrulaması ve gerçek klinik çalışma ayrı aşamalardır.
