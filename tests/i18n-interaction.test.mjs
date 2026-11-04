import test from 'node:test';
import assert from 'node:assert/strict';
import {initI18n,getLocale,getNumberLocale} from '../dist/i18n.mjs';

function fixture(t,storedLanguage='en',{languages=['en-GB'],timeZone='Europe/London',blockedStorage=false}={}){
 const names=['document','window','localStorage','MutationObserver','NodeFilter'];
 const originals=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 const handlers=new Map(),saved=new Map(storedLanguage == null ? [] : [['nutriklinik-language',storedLanguage]]),printHandlers=new Map();
 const select={value:'',addEventListener:(type,handler)=>handlers.set(type,handler)};
 const root={lang:''};let observed;
 globalThis.document={documentElement:root,getElementById:id=>id==='languageSelect'?select:null,
  createTreeWalker:()=>({nextNode:()=>false}),querySelectorAll:()=>[]};
 globalThis.window={addEventListener:(type,handler)=>printHandlers.set(type,handler)};
 globalThis.localStorage={getItem:key=>{if(blockedStorage)throw Error('Storage blocked');return saved.get(key);},setItem:(key,value)=>{if(blockedStorage)throw Error('Storage blocked');saved.set(key,value);}};
 globalThis.NodeFilter={SHOW_TEXT:4};
 globalThis.MutationObserver=class{constructor(callback){observed=callback;}disconnect(){}observe(){}};
 t.after(()=>{for(const [name,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}});
 return {select,root,saved,environment:{getSavedLanguage:()=>globalThis.localStorage.getItem('nutriklinik-language'),getPreferredLanguages:()=>languages,getTimeZone:()=>timeZone},mutate:()=>observed(),change:()=>handlers.get('change')(),print:()=>printHandlers.get('beforeprint')()};
}

test('an intervening status DOM update does not overwrite a pending native language selection',t=>{
 const h=fixture(t);let renders=0;
 initI18n(()=>{renders++;},h.environment);
 assert.equal(h.select.value,'en');
 // A native select can emit input before change. Autosave/status DOM updates in
 // that interval must not reset the value the user is about to commit.
 h.select.value='tr';h.mutate();
 assert.equal(h.select.value,'tr');
 h.change();
 assert.equal(getLocale(),'tr');assert.equal(getNumberLocale(),'tr-TR');
 assert.equal(h.root.lang,'tr');assert.equal(h.saved.get('nutriklinik-language'),'tr');
 assert.equal(renders,2);
 h.print();assert.equal(h.select.value,'tr');assert.equal(h.root.lang,'tr');
 h.select.value='en';h.mutate();h.change();
 assert.equal(getLocale(),'en');assert.equal(h.root.lang,'en');
 assert.equal(h.saved.get('nutriklinik-language'),'en');
});

test('a saved Turkish preference initializes the control before rendering the workspace',t=>{
 const h=fixture(t,'tr');const rendered=[];
 initI18n(()=>rendered.push({selected:h.select.value,locale:getLocale()}),h.environment);
 assert.deepEqual(rendered,[{selected:'tr',locale:'tr'}]);
 assert.equal(h.root.lang,'tr');h.mutate();assert.equal(h.select.value,'tr');
});

test('an automatic Turkish first visit is not stored until the user chooses a language',t=>{
 const h=fixture(t,null,{languages:['en-GB'],timeZone:'Europe/Istanbul'});
 initI18n(()=>{},h.environment);
 assert.equal(h.select.value,'tr');assert.equal(h.root.lang,'tr');
 assert.equal(h.saved.has('nutriklinik-language'),false);
 h.select.value='en';h.change();
 assert.equal(h.saved.get('nutriklinik-language'),'en');
 initI18n(()=>{},h.environment);
 assert.equal(h.select.value,'en');assert.equal(h.root.lang,'en');
});

test('blocked preference storage still permits automatic locale and manual switching',t=>{
 const h=fixture(t,null,{languages:['tr-TR'],timeZone:'UTC',blockedStorage:true});
 initI18n(()=>{},h.environment);
 assert.equal(h.root.lang,'tr');h.select.value='en';
 assert.doesNotThrow(()=>h.change());
 assert.equal(getLocale(),'en');assert.equal(h.root.lang,'en');
 assert.equal(h.saved.size,0);
});
