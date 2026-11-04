import test from 'node:test';
import assert from 'node:assert/strict';
import {aboutLicensesMarkup,initAboutLicenses} from '../dist/about-licenses.mjs';
import {UI_VERSION} from '../dist/config.mjs';

test('public reuse information distinguishes required notices/source from requested academic citation',()=>{
 const html=aboutLicensesMarkup({copyrightHolder:'Example Clinic',authors:['Example Author'],year:2026},'en');
 assert.match(html,/AGPL-3\.0-only/);assert.match(html,new RegExp(UI_VERSION.replaceAll('.','\\.')));
 assert.match(html,/© 2026 Example Clinic/);assert.match(html,/Academic citation is requested, not an additional mandatory condition/);
 assert.match(html,/commercially redistribute/);assert.match(html,/Modified versions offered over a network/);
 assert.match(html,/does not require publishing patient records/);assert.match(html,/Third-party components.*retain their own licenses/);
 assert.match(html,/supports clinical decisions and does not replace them/);
 const links=[...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1]);
 assert.deepEqual(links,['./legal/LICENSE.txt','./legal/NOTICE.txt','./source-code.zip','./CITATION.cff','./legal/THIRD-PARTY-NOTICES.txt']);
});

test('author/citation values are escaped as data and cannot inject markup or request URLs',()=>{
 const html=aboutLicensesMarkup({copyrightHolder:'<img src=x onerror="alert(1)">',authors:[{given:'A<script>',family:'B & C'}],citation:'<a href="https://example.invalid">evil</a>'},'en');
 assert.doesNotMatch(html,/<img|<script|href="https:/);assert.match(html,/&lt;img src=x onerror=&quot;/);
 assert.match(html,/A&lt;script&gt; B &amp; C/);assert.match(html,/&lt;a href=&quot;https:/);
});

test('Turkish and pending metadata do not invent an owner or mandatory citation',()=>{
 const html=aboutLicensesMarkup({},'tr');
 assert.match(html,/Hakkında ve Lisanslar/);assert.match(html,/Atıf bilgileri tamamlanmayı bekliyor/);
 assert.match(html,/yazar bilgileri doğrulandığında/);assert.match(html,/ek bir zorunluluk değildir/);
 assert.doesNotMatch(html,/©|Example Author|Copyright holder/);
});

function fixture(t,{native=true}={}){
 const original=Object.getOwnPropertyDescriptor(globalThis,'document');
 let language='en';
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.attrs={};this.handlers={};this.children=[];this.parentElement=null;this.textContent='';this.scrollTop=0;this.isConnected=true;}
  setAttribute(name,value){this.attrs[name]=String(value);}
  getAttribute(name){return this.attrs[name]??null;}
  hasAttribute(name){return Object.hasOwn(this.attrs,name);}
  removeAttribute(name){delete this.attrs[name];}
  append(child){this.children.push(child);child.parentElement=this;}
  contains(other){return other===this||this.children.some(child=>child.contains(other));}
  addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);}
  removeEventListener(name,fn){this.handlers[name]=(this.handlers[name]||[]).filter(value=>value!==fn);}
  emit(name,values={}){const event={target:this,preventDefault(){this.prevented=true;},...values};for(const fn of this.handlers[name]||[])fn(event);return event;}
  focus(){doc.activeElement=this;}
  remove(){if(this.parentElement){const index=this.parentElement.children.indexOf(this);this.parentElement.children.splice(index,1);this.parentElement=null;}this.isConnected=false;}
  set innerHTML(value){this.html=value;this.children=[];for(const match of value.matchAll(/<(button|a)\b[^>]*>/g)){const node=new Element(match[1]);const id=match[0].match(/id="([^"]+)"/);if(id)node.id=id[1];if(match[1]==='a')node.setAttribute('href','local');this.append(node);}}
  get innerHTML(){return this.html;}
  querySelector(selector){return this.children.find(child=>selector==='#'+child.id)||null;}
  querySelectorAll(){return this.children;}
 }
 const doc={body:new Element('body'),activeElement:null};
 doc.createElement=tag=>{const node=new Element(tag);if(native&&tag==='dialog'){node.showModal=()=>{node.open=true;node.setAttribute('open','');};node.close=()=>{node.open=false;node.removeAttribute('open');node.emit('close');};}return node;};
 const button=new Element('button');button.textContent='Original';button.setAttribute('title','Original title');doc.body.append(button);button.focus();
 globalThis.document=doc;
 const ui=initAboutLicenses({button,getLanguage:()=>language,metadata:{copyrightHolder:'Example Clinic',authors:['Example Author']}});
 t.after(()=>{ui.destroy();if(original)Object.defineProperty(globalThis,'document',original);else delete globalThis.document;});
 return {ui,button,doc,get dialog(){return doc.body.children.find(child=>child.tagName==='DIALOG');},language:value=>{language=value;ui.refresh();}};
}

test('native dialog has a labelled heading, closes on Escape and returns focus to its opener',t=>{
 const h=fixture(t);h.button.emit('click');const dialog=h.dialog;
 assert.equal(dialog.open,true);assert.equal(dialog.getAttribute('aria-labelledby'),'aboutLicensesTitle');assert.equal(dialog.getAttribute('data-no-i18n'),'');
 assert.equal(h.doc.activeElement.id,'aboutLicensesClose');assert.equal(h.button.getAttribute('aria-haspopup'),'dialog');
 const event=dialog.emit('keydown',{key:'Escape'});assert.equal(event.prevented,true);assert.equal(dialog.open,false);assert.equal(h.doc.activeElement,h.button);
 h.ui.open();dialog.emit('cancel');assert.equal(dialog.open,false);assert.equal(h.doc.activeElement,h.button);
});

test('locale refresh updates legal information and button help without closing the dialog',t=>{
 const h=fixture(t);h.ui.open();h.language('tr');
 assert.equal(h.dialog.open,true);assert.equal(h.dialog.getAttribute('lang'),'tr');assert.equal(h.button.textContent,'Hakkında ve Lisanslar');
 assert.match(h.button.getAttribute('title'),/yeniden kullanım/);assert.match(h.dialog.innerHTML,/AGPLv3 koşullarıyla/);
 assert.equal(h.doc.activeElement.id,'aboutLicensesClose');h.language('en');assert.equal(h.button.textContent,'About & licenses');
});

test('a programmatic opener restores the previously focused control once after native close',t=>{
 const h=fixture(t),other=new h.button.constructor('select');h.doc.body.append(other);other.focus();
 h.ui.open();assert.equal(h.doc.activeElement.id,'aboutLicensesClose');h.ui.hide();assert.equal(h.doc.activeElement,other);
});

test('fallback dialog contains keyboard focus, close action works and destroy restores the opener',t=>{
 const h=fixture(t,{native:false});h.ui.open();const dialog=h.dialog,links=dialog.querySelectorAll(),first=links[0],last=links.at(-1);
 assert.equal(dialog.hasAttribute('open'),true);first.focus();assert.equal(dialog.emit('keydown',{key:'Tab',shiftKey:true}).prevented,true);assert.equal(h.doc.activeElement,last);
 assert.equal(dialog.emit('keydown',{key:'Tab'}).prevented,true);assert.equal(h.doc.activeElement,first);
 first.emit('click');assert.equal(dialog.hasAttribute('open'),false);assert.equal(h.doc.activeElement,h.button);
 h.ui.destroy();assert.equal(h.dialog,undefined);assert.equal(h.button.textContent,'Original');assert.equal(h.button.getAttribute('title'),'Original title');assert.equal(h.button.getAttribute('aria-controls'),null);
 h.button.emit('click');assert.equal(h.dialog,undefined);
});
