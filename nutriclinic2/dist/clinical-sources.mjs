import {malnutritionSources,malnutritionEnglishTranslations} from './criteria-malnutrition.mjs';
import {functionSources} from './criteria-function.mjs';
import {clinicalSources,clinicalEnglishTranslations} from './clinical-context.mjs';
export const additionalTranslations={...malnutritionEnglishTranslations,...clinicalEnglishTranslations,'Ölçek ve ölçüt kaynağı':'Scale and criteria source','Yalnız belirtilen klinik bağlamda ve özgün formuyla uygulanır.':'Use only in the stated clinical context and with the original form.'};
const adapt=source=>{
 const result={...source,kind:'Ölçek ve ölçüt kaynağı',application:'Yalnız belirtilen klinik bağlamda ve özgün formuyla uygulanır.'};
 for(const [key,value]of Object.entries(source))if(value&&typeof value==='object'&&'en'in value){additionalTranslations[value.tr]=value.en;result[key]=value.tr;}
 result.summary=result.note;result.limitations=result.note;delete result.note;return result;
};
export const additionalSources=[...malnutritionSources,...functionSources.map(adapt),...clinicalSources];
