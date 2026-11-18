import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const root='node_modules/alt1/dist',dest='public/alt1-ocr';
await mkdir(dest,{recursive:true});
for(const name of ['base','ocr'])await copyFile(root+'/'+name+'/index.js',dest+'/'+name+'.js');
const fonts=["aa_8px","aa_8px_mono","aa_10px_mono","aa_12px_mono","aa_8px_mono_allcaps","aa_9px_mono_allcaps","pixel_8px_digits","chatbox/10pt","chatbox/12pt","chatbox/14pt","chatbox/16pt","chatbox/18pt","chatbox/20pt","chatbox/22pt"];
const available=[];
for(const name of fonts){const flat=name.replaceAll('/','-');try{await copyFile(root+'/fonts/'+name+'.js',dest+'/'+flat+'.js');available.push({name,file:flat+'.js'});}catch(e){console.warn('Font unavailable:',name,e.code);}}
if(!available.length)throw Error('No packaged Alt1 fonts found');
await writeFile(dest+'/fonts.json',JSON.stringify(available));
