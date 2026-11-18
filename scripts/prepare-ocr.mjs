import {mkdir,copyFile,readdir} from 'node:fs/promises';import {join} from 'node:path';
await mkdir('public/ocr/core',{recursive:true});await mkdir('public/ocr/lang',{recursive:true});await copyFile('node_modules/tesseract.js/dist/worker.min.js','public/ocr/worker.min.js');
for(const f of await readdir('node_modules/tesseract.js-core')){if(/\.wasm(\.js)?$/.test(f))await copyFile(join('node_modules/tesseract.js-core',f),join('public/ocr/core',f))}
const res=await fetch('https://tessdata.projectnaptha.com/4.0.0_fast/eng.traineddata.gz');if(!res.ok)throw Error('English OCR data unavailable: '+res.status);const {writeFile}=await import('node:fs/promises');await writeFile('public/ocr/lang/eng.traineddata.gz',Buffer.from(await res.arrayBuffer()));
