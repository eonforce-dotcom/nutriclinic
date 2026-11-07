import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

export function verifyVendor(directory=path.join(import.meta.dirname,'dist/vendor')) {
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'dependencies.json'),'utf8'));
 if(manifest.schemaVersion!=='nutriclinic-vendored-dependencies-1'||manifest.components?.length!==1)throw Error('Unexpected vendor inventory');
 const component=manifest.components[0];
 if(component.name!=='pdfjs-dist'||component.version!=='6.2.108'||component.repository!=='https://github.com/mozilla/pdf.js')throw Error('Unapproved vendor identity');
 const expected=['PDFJS-LICENSE.txt','pdf.mjs','pdf.worker.mjs'];
 if(JSON.stringify(Object.keys(component.files).sort())!==JSON.stringify(expected.sort()))throw Error('Unexpected vendor members');
 for(const name of expected){
  const file=path.join(directory,name),real=fs.realpathSync(file),root=fs.realpathSync(directory);
  if(path.dirname(real)!==root)throw Error('Vendor path escaped directory');
  const checksum=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(checksum!==component.files[name].sha256)throw Error('Vendor integrity mismatch: '+name);
 }
 const pkg=JSON.parse(fs.readFileSync(new URL('./package.json',import.meta.url),'utf8'));
 for(const kind of ['dependencies','devDependencies','optionalDependencies'])if(Object.keys(pkg[kind]||{}).length)throw Error('Unexpected npm dependency graph');
 return {version:component.version,files:expected.length,npmDependencies:0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(verifyVendor()));
