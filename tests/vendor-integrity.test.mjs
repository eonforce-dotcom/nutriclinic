import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {verifyVendor} from '../verify-vendor.mjs';

test('the vendored parser, worker and license match the approved manifest and npm graph is empty',()=>{
 assert.deepEqual(verifyVendor(),{version:'6.2.108',files:3,npmDependencies:0});
});
test('modified, missing or identity-swapped vendored files fail closed before release',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nutriclinic-vendor-check-'));
 t.after(()=>{const checked=path.resolve(root);assert.ok(checked.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(checked).startsWith('nutriclinic-vendor-check-'));fs.rmSync(checked,{recursive:true,force:true});});
 const source=new URL('../dist/vendor/',import.meta.url);
 for(const name of ['dependencies.json','pdf.mjs','pdf.worker.mjs','PDFJS-LICENSE.txt'])fs.copyFileSync(new URL(name,source),path.join(root,name));
 fs.appendFileSync(path.join(root,'pdf.worker.mjs'),'\n/* synthetic change */');
 assert.throws(()=>verifyVendor(root),/integrity mismatch/);
 fs.copyFileSync(new URL('pdf.worker.mjs',source),path.join(root,'pdf.worker.mjs'));
 fs.unlinkSync(path.join(root,'pdf.mjs'));assert.throws(()=>verifyVendor(root));
 fs.copyFileSync(new URL('pdf.mjs',source),path.join(root,'pdf.mjs'));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'dependencies.json'),'utf8'));manifest.components[0].version='0.0.0';
 fs.writeFileSync(path.join(root,'dependencies.json'),JSON.stringify(manifest));assert.throws(()=>verifyVendor(root),/Unapproved vendor identity/);
});
