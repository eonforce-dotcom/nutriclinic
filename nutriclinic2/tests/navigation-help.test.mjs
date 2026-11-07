import test from 'node:test';
import assert from 'node:assert/strict';
import {initNavigationHelp,navigationHelp} from '../dist/navigation-help.mjs';

function fixture(t){
 const names=['document','window','setTimeout','clearTimeout'];
 const originals=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 let now=0,next=0,lang='en';const timers=new Map();
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.parentElement=null;this.attributes={};this.dataset={};this.style={};this.handlers={};this.hidden=false;this.textContent='';}
  setAttribute(name,value){this.attributes[name]=String(value);if(name==='id')this.id=value;}
  getAttribute(name){return name==='id'?this.id??null:this.attributes[name]??null;}
  removeAttribute(name){delete this.attributes[name];}
  append(...elements){for(const element of elements){element.remove();this.children.push(element);element.parentElement=this;}}
  before(element){const parent=this.parentElement,index=parent.children.indexOf(this);element.remove();parent.children.splice(index,0,element);element.parentElement=parent;}
  remove(){if(this.parentElement){const list=this.parentElement.children;list.splice(list.indexOf(this),1);this.parentElement=null;}}
  contains(other){return !!other&&(this===other||this.children.some(child=>child.contains(other)));}
  addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
  removeEventListener(type,fn){this.handlers[type]=(this.handlers[type]||[]).filter(item=>item!==fn);}
  emit(type,extra={}){const event={type,target:this,relatedTarget:null,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extra};for(const fn of this.handlers[type]||[])fn(event);return event;}
  querySelectorAll(selector){const found=[];const walk=node=>{for(const child of node.children){if(selector==='button[data-view]'&&child.tagName==='BUTTON'&&child.dataset.view)found.push(child);walk(child);}};walk(this);return found;}
  getBoundingClientRect(){return this.className==='navigation-help-tooltip'?{width:345,height:210,left:0,top:0,right:345,bottom:210}:{left:20,top:300,right:225,bottom:350,width:205,height:50};}
 }
 const body=new Element('body'),nav=new Element('nav');nav.id='mainNavigation';body.append(nav);
 const buttons=Object.keys(navigationHelp).map(id=>{const node=new Element('button');node.dataset.view=id;nav.append(node);return node;});
 const doc=new Element('document');doc.body=body;doc.documentElement={clientWidth:1100,clientHeight:800};
 doc.createElement=tag=>new Element(tag);doc.getElementById=id=>{let found;const visit=node=>{if(node.id===id)found=node;for(const child of node.children)visit(child);};visit(body);return found??null;};
 const win=new Element('window');win.innerWidth=1100;win.innerHeight=800;
 globalThis.document=doc;globalThis.window=win;
 globalThis.setTimeout=(fn,delay)=>{const id=++next;timers.set(id,{fn,at:now+delay});return id;};globalThis.clearTimeout=id=>timers.delete(id);
 const tick=duration=>{const end=now+duration;for(;;){const due=[...timers].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn();}now=end;};
 const ui=initNavigationHelp({getLanguage:()=>lang});
 t.after(()=>{ui.destroy();for(const [name,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}});
 const entry=id=>{const button=buttons.find(node=>node.dataset.view===id),row=button.parentElement;return {button,row,help:row.children[1],tooltip:doc.getElementById(`navigation-help-${id}`)};};
 return {doc,win,nav,buttons,ui,entry,tick,setLanguage:value=>{lang=value;ui.refresh();}};
}

test('delayed hover opens body-mounted accessible help and moving onto the help keeps it available',t=>{
 const h=fixture(t),e=h.entry('assessment');
 assert.equal(e.tooltip.parentElement,h.doc.body);assert.equal(e.tooltip.getAttribute('role'),'tooltip');
 assert.equal(e.button.getAttribute('aria-describedby'),e.tooltip.id);assert.equal(e.help.getAttribute('aria-controls'),e.tooltip.id);
 e.row.emit('pointerenter',{pointerType:'mouse'});h.tick(649);assert.equal(e.tooltip.hidden,true);h.tick(1);assert.equal(e.tooltip.hidden,false);
 assert.equal(e.help.getAttribute('aria-expanded'),'true');assert.match(e.tooltip.children[2].textContent,/Start here/);
 e.row.emit('pointerleave');h.tick(100);e.tooltip.emit('pointerenter');h.tick(600);assert.equal(e.tooltip.hidden,false);
 e.tooltip.emit('pointerleave');h.tick(199);assert.equal(e.tooltip.hidden,false);h.tick(1);assert.equal(e.tooltip.hidden,true);
});

test('keyboard focus gets delayed help and Escape suppresses it until focus and pointer leave',t=>{
 const h=fixture(t),e=h.entry('labs');e.row.emit('focusin');h.tick(650);assert.equal(e.tooltip.hidden,false);
 h.doc.emit('keydown',{key:'Escape'});assert.equal(e.tooltip.hidden,true);e.row.emit('pointerenter',{pointerType:'mouse'});h.tick(1000);assert.equal(e.tooltip.hidden,true);
 e.row.emit('focusout');e.row.emit('pointerleave');e.row.emit('focusin');h.tick(650);assert.equal(e.tooltip.hidden,false);
});

test('touch help is an explicit adjacent control, stays open for reading and dismisses outside',t=>{
 const h=fixture(t),e=h.entry('research');assert.equal(e.help.parentElement,e.button.parentElement);assert.equal(e.button.contains(e.help),false);
 e.row.emit('pointerenter',{pointerType:'touch'});h.tick(1000);assert.equal(e.tooltip.hidden,true);
 const click=e.help.emit('click');assert.equal(click.prevented,true);assert.equal(click.stopped,true);assert.equal(e.tooltip.hidden,false);
 e.row.emit('pointerleave');h.tick(1000);assert.equal(e.tooltip.hidden,false);
 h.doc.emit('pointerdown',{target:h.doc.body});assert.equal(e.tooltip.hidden,true);assert.equal(e.help.getAttribute('aria-expanded'),'false');
 e.help.emit('click');assert.equal(e.tooltip.hidden,false);e.help.emit('click');assert.equal(e.tooltip.hidden,true);
});

test('changing language updates both visible purpose/action and accessible controls while open',t=>{
 const h=fixture(t),e=h.entry('plan');e.help.emit('click');assert.match(e.help.getAttribute('aria-label'),/^Menu help:/);
 h.setLanguage('tr');assert.equal(e.tooltip.hidden,false);assert.equal(e.tooltip.children[0].textContent,'Beslenme planı');
 assert.match(e.tooltip.children[1].textContent,/^Ne işe yarar:/);assert.match(e.tooltip.children[2].textContent,/^Ne yapmalısınız:/);
 assert.match(e.help.getAttribute('aria-label'),/^Menü yardımı:/);assert.equal(e.button.getAttribute('aria-describedby'),e.tooltip.id);
 h.setLanguage('en');assert.match(e.tooltip.children[1].textContent,/^Purpose:/);assert.match(e.tooltip.children[2].textContent,/^Your next step:/);
});

test('narrow viewport clamps help inside the screen, and printing or navigation closes it',t=>{
 const h=fixture(t),e=h.entry('components');h.win.innerWidth=390;h.win.innerHeight=420;e.help.emit('click');
 assert.equal(e.tooltip.style.left,'10px');assert.ok(parseFloat(e.tooltip.style.top)>=10);assert.ok(parseFloat(e.tooltip.style.top)+210<=410);
 h.win.emit('beforeprint');assert.equal(e.tooltip.hidden,true);e.help.emit('click');e.button.emit('click');assert.equal(e.tooltip.hidden,true);
});

test('destroy removes help controls and restores the original menu buttons and descriptions',t=>{
 const h=fixture(t),button=h.buttons[0];h.entry('assessment').help.emit('click');h.ui.destroy();
 assert.equal(button.parentElement,h.nav);assert.equal(button.getAttribute('aria-describedby'),null);
 assert.equal(h.doc.body.children.some(node=>node.getAttribute('role')==='tooltip'),false);assert.equal(h.nav.children.length,10);
});
