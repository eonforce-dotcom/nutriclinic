const B=(en,tr)=>({en,tr});
const valid=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
export const malnutritionSources=[
 {id:'espen-diagnosis-2015',title:'Diagnostic criteria for malnutrition — an ESPEN Consensus Statement',year:2015,kind:'Konsensus',url:'https://pubmed.ncbi.nlm.nih.gov/25799486/',doi:'10.1016/j.clnu.2015.03.001',access:'Özgün indekslenen özet',summary:'Risk taraması sonrası BKİ veya istemsiz kayıp ile BKİ/FFMI birleşimi değerlendirilir.',application:'Aday örüntü hesaplanır; klinik doğrulama gerekir.',limitations:'FFMI ile appendiküler kas indeksi farklıdır. Ödem ve ölçüm yöntemi dikkate alınır.'},
 {id:'and-aspen-malnutrition-2012',title:'AND/ASPEN consensus: characteristics for identification and documentation of adult malnutrition',year:2012,kind:'Konsensus',url:'https://pubmed.ncbi.nlm.nih.gov/22709779/',doi:'10.1016/j.jand.2012.03.012',access:'Özgün özet ve yayıncı uygulama metni',summary:'Altı klinik özellikten en az ikisi değerlendirilir; etiyoloji, süre ve muayene önemlidir.',application:'Klinisyenin doğruladığı özellikler sayılır; şiddet otomatik atanmaz.',limitations:'YBÜ’de el kavrama ölçümü bu amaçla önerilmez; nörolojik parezi ve sıvı yükü yorum gerektirir.'},
 {id:'espen-screening-nrs2002',title:'ESPEN guidelines for nutrition screening 2002 — NRS 2002',year:2003,kind:'Resmî tarama rehberi',url:'https://www.espen.org/documents/Screening.pdf',doi:null,access:'Resmî tam metin',summary:'Beslenme bozulması ve hastalık şiddeti puanlarına 70 yaş ve üzerinde bir puan eklenir.',application:'Klinisyenin iki alt puanı ve yaştan toplam hesaplanır; toplam ≥3 risk göstergesidir.',limitations:'Hastalık alt puanı otomatik olarak SOFA/SAPS puanına çevrilmez; tarama malnütrisyon tanısı değildir.'},
];
export const malnutritionEnglishTranslations={
 'Özgün indekslenen özet':'Original indexed abstract','Konsensus':'Consensus','Resmî tarama rehberi':'Official screening guideline',
 'Risk taraması sonrası BKİ veya istemsiz kayıp ile BKİ/FFMI birleşimi değerlendirilir.':'After positive screening, assess BMI or the combination of unintentional loss with BMI/FFMI.',
 'Aday örüntü hesaplanır; klinik doğrulama gerekir.':'Candidate patterns are calculated; clinical confirmation is required.',
 'FFMI ile appendiküler kas indeksi farklıdır. Ödem ve ölçüm yöntemi dikkate alınır.':'FFMI differs from appendicular muscle index. Account for edema and measurement method.',
 'Özgün özet ve yayıncı uygulama metni':'Original abstract and publisher implementation article',
 'Altı klinik özellikten en az ikisi değerlendirilir; etiyoloji, süre ve muayene önemlidir.':'At least two of six clinical characteristics are assessed; etiology, duration and examination matter.',
 'Klinisyenin doğruladığı özellikler sayılır; şiddet otomatik atanmaz.':'Clinician-confirmed characteristics are counted; severity is not assigned automatically.',
 'YBÜ’de el kavrama ölçümü bu amaçla önerilmez; nörolojik parezi ve sıvı yükü yorum gerektirir.':'Grip strength is not recommended for this purpose in ICU; neurological paresis and fluid overload require interpretation.',
 'Beslenme bozulması ve hastalık şiddeti puanlarına 70 yaş ve üzerinde bir puan eklenir.':'Add one point at age 70 or older to the nutritional impairment and disease-severity scores.',
 'Klinisyenin iki alt puanı ve yaştan toplam hesaplanır; toplam ≥3 risk göstergesidir.':'The total uses two clinician-rated components and age; ≥3 indicates nutritional risk.',
 'Hastalık alt puanı otomatik olarak SOFA/SAPS puanına çevrilmez; tarama malnütrisyon tanısı değildir.':'The disease component is not automatically converted from SOFA/SAPS; screening is not a malnutrition diagnosis.',
};
export function evaluateMalnutrition(d={},m={}){
 const adult=valid(d.age,18,120),reliable=d.fluidWeight==='reliable';
 const bmi=valid(d.height,100,230)&&valid(d.weight,20,350)&&reliable?d.weight/(d.height/100)**2:null;
 const loss=valid(d.usualWeight,20,350)&&valid(d.weight,20,350)&&reliable?(d.usualWeight-d.weight)/d.usualWeight*100:null;
 const ffmi=valid(m.fatFreeMass,1,250)&&valid(d.height,100,230)&&m.ffmMethodValid===true&&reliable?m.fatFreeMass/(d.height/100)**2:null;
 const lowBmi=bmi==null?null:bmi<(d.age<70?20:22);
 const lowFfmi=ffmi==null||!['male','female'].includes(d.sex)?null:ffmi<(d.sex==='male'?17:15);
 const lossMet=loss==null||m.lossUnintentional!==true?null:loss>10?true:valid(d.lossMonths,0.1,3)?loss>5:null;
 let espen='incomplete';
 if(adult&&d.screenPositive===true&&bmi!==null){
   if(bmi<18.5||(lossMet===true&&(lowBmi===true||lowFfmi===true)))espen='met';
   else if(lossMet===false||(lowBmi===false&&lowFfmi===false))espen='not_met';
 }
 const fields=['aspenIntake','aspenWeight','aspenMuscle','aspenFat','aspenFluid',...(d.context==='icu'?[]:['aspenGrip'])];
 const count=fields.filter(k=>m[k]==='yes').length,unknown=fields.filter(k=>!['yes','no'].includes(m[k])).length;
 const aspenStatus=!adult||!['acute','chronic','social'].includes(m.aspenContext)?'incomplete':count>=2?'met':unknown?'incomplete':'not_met';
 const nrsKnown=adult&&valid(m.nrsNutrition,0,3)&&Number.isInteger(m.nrsNutrition)&&valid(m.nrsDisease,0,3)&&Number.isInteger(m.nrsDisease);
 const nrs=nrsKnown?m.nrsNutrition+m.nrsDisease+(d.age>=70?1:0):null;
 return [
  {id:'espen2015',title:B('ESPEN 2015 malnutrition pattern','ESPEN 2015 malnütrisyon örüntüsü'),status:espen,summary:espen==='met'?B('Candidate ESPEN diagnostic pattern met after positive screening.','Pozitif tarama sonrası aday ESPEN tanısal örüntüsü karşılandı.'):espen==='not_met'?B('These ESPEN criteria are not met by the supplied reliable measurements.','Verilen güvenilir ölçümlerle bu ESPEN ölçütleri karşılanmadı.'):B('Complete positive screening, reliable measures and the relevant loss/body-composition assessment.','Pozitif tarama, güvenilir ölçüm ve ilgili kayıp/vücut bileşimi değerlendirmesini tamamlayın.'),details:[B('BMI <18.5; or unintentional loss >10% at any time / >5% over 3 months plus age-specific low BMI or sex-specific low FFMI.','BKİ <18,5; veya herhangi dönemde >%10 / 3 ayda >%5 istemsiz kayıp ile yaşa göre düşük BKİ ya da cinsiyete göre düşük FFMI.'),B('FFMI is total fat-free mass / height²; it is not appendicular muscle mass. No automatic severity or feeding dose.','FFMI toplam yağsız kütle / boy²’dir; appendiküler kas kütlesi değildir. Otomatik şiddet veya besleme dozu verilmez.')],values:{bmi,weightLoss:loss,ffmi},sourceIds:['espen-diagnosis-2015']},
  {id:'aspen',title:B('AND/ASPEN clinical characteristics','AND/ASPEN klinik özellikleri'),status:aspenStatus,summary:B(`${count} clinician-confirmed characteristics; ${unknown} not assessed. This is a candidate checklist, not automatic diagnosis or severity.`,`${count} klinisyen tarafından doğrulanan özellik; ${unknown} değerlendirilmedi. Bu aday kontrol listesidir; otomatik tanı veya şiddet değildir.`),details:[B('Energy intake, loss of weight/muscle/fat, fluid accumulation and grip must be assessed using the original context-specific definitions. A blood albumin result is not a criterion.','Enerji alımı, ağırlık/kas/yağ kaybı, sıvı birikimi ve kavrama özgün bağlama ait tanımlarla değerlendirilir. Kan albümini ölçüt değildir.'),B('Grip is excluded from the count in ICU. Neurological weakness can confound functional findings.','YBÜ’de kavrama sayımdan dışlanır. Nörolojik güçsüzlük işlev bulgularını karıştırabilir.')],values:{count,unknown},sourceIds:['and-aspen-malnutrition-2012']},
  {id:'nrs2002',title:B('NRS 2002 nutritional risk','NRS 2002 beslenme riski'),status:nrs==null?'incomplete':nrs>=3?'met':'not_met',summary:nrs==null?B('Enter both clinician-rated 0–3 components; age is added automatically.','Klinisyenin değerlendirdiği iki 0–3 alt puanı girin; yaş otomatik eklenir.'):B(`NRS 2002 = ${m.nrsNutrition} + ${m.nrsDisease} + ${d.age>=70?1:0} = ${nrs}; ${nrs>=3?'nutritional risk identified':'risk threshold not reached'}.`,`NRS 2002 = ${m.nrsNutrition} + ${m.nrsDisease} + ${d.age>=70?1:0} = ${nrs}; ${nrs>=3?'beslenme riski saptandı':'risk eşiğine ulaşılmadı'}.`),details:[B('Risk screening is not a diagnosis. Use the original component definitions; no automatic protein/energy escalation.','Risk taraması tanı değildir. Özgün alt puan tanımlarını kullanın; otomatik protein/enerji artışı yapılmaz.')],values:{score:nrs},sourceIds:['espen-screening-nrs2002']},
 ];
}
