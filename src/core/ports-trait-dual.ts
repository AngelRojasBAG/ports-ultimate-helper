import type {Mask,Sample,Frame} from './ports-text-patterns';
import {extractMask} from './ports-text-patterns';
import {seededTraits} from './ports-trait-seeds';
import {fullTraitRow,fullRowSimilarity} from './ports-full-traits';
import {splitCoreLine} from './ports-detail-characters';
import {fontForGlyphs,type Glyph,type GlyphEngine} from './ports-glyph-font';
import {knownTraits} from './unit-details';
export type Threshold=90|110;
export type TraitSample={text:string;threshold:Threshold;mask:Mask};
const KEY='ports-helper.full-trait-font.v1';
const key=(m:Mask)=>m.w+'/'+m.h+'/'+m.bits;
export function traitRows(frame:Frame,x:number,y:number,w:number,h:number){
 return ([90,110] as const).map(threshold=>({threshold,mask:extractMask(frame,x,y,w,h,'details',threshold)})).map(p=>({...p,mask:p.mask?fullTraitRow(p.mask):null}));
}
export function canonicalTrait(s:string){return knownTraits.find(t=>t.toLowerCase()===s.trim().toLowerCase())??null;}
export function alignTrait(text:string,mask:Mask):Glyph[]|null{
 const canonical=canonicalTrait(text);if(!canonical||mask.h!==13)return null;
 const chars=[...canonical.replace(/ /g,'')],parts=splitCoreLine(mask);
 const expected=[...canonical].reduce<number[]>((a,ch,i)=>{if(ch===' ')a.push(canonical.slice(0,i).replace(/ /g,'').length);return a;},[]);
 // Search only joins across a single empty column. Reject ambiguous alignments.
 // No blind merging: this font also has one-pixel gaps between actual letters.
 const paths:Glyph[][]=[];
 function walk(i:number,j:number,current:Glyph[]){
  if(paths.length>1)return;
  if(i===parts.length&&j===chars.length){paths.push(current);return;}
  if(i>=parts.length||j>=chars.length||parts.length-i<chars.length-j)return;
  if(j>0&&((parts[i].gap>=4)!==expected.includes(j)))return;
  const part=parts[i];walk(i+1,j+1,[...current,{chr:chars[j],mask:part.mask}]);
  const next=parts[i+1];
  if(next&&next.gap===1&&part.mask.w+next.mask.w+1<=12){
   const w=part.mask.w+next.mask.w+1;
   const bits=Array.from({length:13},(_,y)=>part.mask.bits.slice(y*part.mask.w,(y+1)*part.mask.w)+'0'+next.mask.bits.slice(y*next.mask.w,(y+1)*next.mask.w)).join('');
   walk(i+2,j+1,[...current,{chr:chars[j],mask:{w,h:13,bits}}]);
  }
 }
 walk(0,0,[]);return paths.length===1?paths[0]:null;
}
export function trainFullTraits(samples:TraitSample[],threshold:Threshold):Glyph[]{
 const map=new Map<string,Glyph>(),bad=new Set<string>();
 for(const s of samples){if(s.threshold!==threshold)continue;for(const g of alignTrait(s.text,s.mask)??[]){const k=key(g.mask);if(map.has(k)&&map.get(k)!.chr!==g.chr)bad.add(k);else map.set(k,g);}}
 return [...map].filter(([k])=>!bad.has(k)).map(([,g])=>g);
}
export function readFullCharacters(mask:Mask,glyphs:Glyph[],engine:GlyphEngine){
 let result='';
 const parts=splitCoreLine(mask);if(!parts.length)return null;
 for(const p of parts){
  const m=p.mask,choices=glyphs.filter(g=>g.mask.w===m.w&&g.mask.h===m.h),matches=choices.filter(g=>key(g.mask)===key(m));
  if(new Set(matches.map(g=>g.chr)).size!==1)return null;
  const im=new ImageData(m.w+40,m.h+40);
  for(let i=3;i<im.data.length;i+=4)im.data[i]=255;
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.bits[y*m.w+x]==='1'){const i=((y+20)*im.width+x+20)*4;im.data[i]=im.data[i+1]=im.data[i+2]=255;}
  const chr=engine.readChar(im,fontForGlyphs(choices,m.h),[255,255,255],20,20+m.h-1,false,true)?.chr;
  if(chr!==matches[0].chr)return null;
  if(result&&p.gap>=3)result+=' ';result+=chr;
 }
 return canonicalTrait(result);
}
export function loadTraitSamples():TraitSample[]{
 const data:unknown=JSON.parse(localStorage.getItem(KEY)??'[]');
 if(!Array.isArray(data)||data.length>1000)return [...seededTraits];
 return [...seededTraits,...data.filter(s=>s&&typeof s.text==='string'&&canonicalTrait(s.text)&&(s.threshold===90||s.threshold===110)&&s.mask&&Number.isInteger(s.mask.w)&&s.mask.w>0&&s.mask.w<=270&&s.mask.h===13&&typeof s.mask.bits==='string'&&s.mask.bits.length===13*s.mask.w&&/^[01]+$/.test(s.mask.bits))];
}
export function saveTraitSamples(text:string,rows:ReturnType<typeof traitRows>){
 const canonical=canonicalTrait(text);if(!canonical)throw Error('Selecciona un trait válido.');
 const current=loadTraitSamples();const accepted=rows.filter(r=>r.mask&&alignTrait(canonical,r.mask));
 if(!accepted.length)throw Error('La segmentación no coincide con el texto; no se guardó.');
 for(const r of accepted){const mask=r.mask!;const same=current.filter(s=>s.threshold===r.threshold&&key(s.mask)===key(mask));if(same.some(s=>s.text!==canonical))throw Error('Patrón contradictorio.');if(!same.length)current.push({text:canonical,threshold:r.threshold,mask});}
 if(current.length>1000)throw Error('Límite de patrones.');
 localStorage.setItem(KEY,JSON.stringify(current));return accepted.map(r=>r.threshold);
}
export function matchTraitTemplate(mask:Mask,samples:TraitSample[],threshold:Threshold){
 const scores=new Map<string,number>();
 for(const s of samples){
  if(s.threshold!==threshold||!canonicalTrait(s.text))continue;
  const score=fullRowSimilarity(mask,s.mask);
  scores.set(s.text,Math.max(scores.get(s.text)??0,score));
 }
 const ranked=[...scores].sort((a,b)=>b[1]-a[1]);
 if(!ranked[0]||ranked[0][1]<.90||ranked[0][1]-(ranked[1]?.[1]??0)<.12)return null;
 return ranked[0][0];
}
export function readDualTrait(rows:ReturnType<typeof traitRows>,samples:TraitSample[],engine:GlyphEngine){
 const results=rows.map(r=>{
  if(!r.mask)return {threshold:r.threshold,value:null,method:'none'};
  const chars=readFullCharacters(r.mask,trainFullTraits(samples,r.threshold),engine);
  const template=matchTraitTemplate(r.mask,samples,r.threshold);
  if(chars&&template&&chars!==template)return {threshold:r.threshold,value:null,method:'conflict'};
  return {threshold:r.threshold,value:chars??template,method:chars?'characters':template?'template':'none'};
 });
 const primary=results.find(r=>r.threshold===90)?.value,secondary=results.find(r=>r.threshold===110)?.value;
 return {value:primary&&primary===secondary?primary:null,results,method:results.every(r=>r.method==='characters')?'characters':'template'};
}
