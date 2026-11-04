import test, {after} from 'node:test';
import assert from 'node:assert/strict';

// Text extraction never renders. The browser build constructs this matrix at
// module load; no canvas/native package is loaded or needed for these fixtures.
const originalMatrix=globalThis.DOMMatrix;
const originalToHex=Object.getOwnPropertyDescriptor(Uint8Array.prototype,'toHex');
// PDF.js6 uses the browser's Uint8Array.toHex. Node24's older V8 needs this
// test-only byte-format adapter; production vendor/browser files are untouched.
if(!originalToHex)Object.defineProperty(Uint8Array.prototype,'toHex',{configurable:true,value(){return Buffer.from(this.buffer,this.byteOffset,this.byteLength).toString('hex');}});
after(()=>{if(originalToHex)Object.defineProperty(Uint8Array.prototype,'toHex',originalToHex);else delete Uint8Array.prototype.toHex;});
globalThis.DOMMatrix=class DOMMatrix {};
const pdfjs=await import('../dist/vendor/pdf.mjs');
if(originalMatrix===undefined)delete globalThis.DOMMatrix;else globalThis.DOMMatrix=originalMatrix;
pdfjs.GlobalWorkerOptions.workerSrc=new URL('../dist/vendor/pdf.worker.mjs',import.meta.url).href;

function fixture(withAction=false){
 const text='Albumin 31 g/L | CRP 28 mg/L | Potassium 4.1 mmol/L';
 const stream=`BT /F1 12 Tf 40 760 Td (${text}) Tj ET`;
 const objects=[`<< /Type /Catalog /Pages 2 0 R${withAction?' /OpenAction 6 0 R':''} >>`,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
 if(withAction)objects.push('<< /Type /Action /S /JavaScript /JS (globalThis.__nutriclinicPdfScriptRan=true;) >>');
 let content='%PDF-1.7\n';const offsets=[0];
 for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(content));content+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
 const xref=Buffer.byteLength(content);content+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 return new Uint8Array(Buffer.from(content));
}
async function read(bytes){
 let renderingCalls=0;
 class NoCanvas { create(){renderingCalls++;throw Error('Rendering not part of text import');} }
 const task=pdfjs.getDocument({data:bytes,CanvasFactory:NoCanvas,useWorkerFetch:false,disableAutoFetch:true,disableStream:true,useWasm:false,disableFontFace:true,useSystemFonts:false,verbosity:0});
 let doc;
 try{doc=await task.promise;assert.equal(doc.numPages,1);const page=await doc.getPage(1),text=await page.getTextContent();return {text:text.items.map(item=>item.str).join(' '),renderingCalls};}
 finally{await task.destroy();}
}
test('the actual patched PDF parser extracts known lab text without optional native canvas packages',async()=>{
 assert.equal(pdfjs.version,'6.2.108');
 assert.deepEqual(await read(fixture()),{text:'Albumin 31 g/L | CRP 28 mg/L | Potassium 4.1 mmol/L',renderingCalls:0});
});
test('a PDF containing a script action is read as text without instantiating a scripting/viewer layer',async()=>{
 assert.equal(globalThis.__nutriclinicPdfScriptRan,undefined);
 assert.match((await read(fixture(true))).text,/Albumin 31 g\/L/);
 assert.equal(globalThis.__nutriclinicPdfScriptRan,undefined);
});
