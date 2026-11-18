import type {Mask,Sample,Frame} from './ports-text-patterns';
import {extractMask} from './ports-text-patterns';
import {fullTraitRow} from './ports-full-traits';
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
 if(parts.length!==chars.length)return null;
 // Verify that inter-word gaps agree with the transcription.
 const expected=[...canonical].reduce<number[]>((a,ch,i)=>{if(ch===' ')a.push(canonical.slice(0,i).replace(/ /g,'').length);return a;},[]);
 const gaps=parts.flatMap((p,i)=>i&&p.gap>=3?[i]:[]);
 if(expected.join(',')!==gaps.join(','))return null;
 return parts.map((p,i)=>({chr:chars[i],mask:p.mask}));
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
 if(!Array.isArray(data)||data.length>1000)return [];
 return data.filter(s=>s&&typeof s.text==='string'&&canonicalTrait(s.text)&&(s.threshold===90||s.threshold===110)&&s.mask&&Number.isInteger(s.mask.w)&&s.mask.w>0&&s.mask.w<=270&&s.mask.h===13&&typeof s.mask.bits==='string'&&s.mask.bits.length===13*s.mask.w&&/^[01]+$/.test(s.mask.bits));
}
export function saveTraitSamples(text:string,rows:ReturnType<typeof traitRows>){
 const canonical=canonicalTrait(text);if(!canonical)throw Error('Selecciona un trait válido.');
 const current=loadTraitSamples();const accepted=rows.filter(r=>r.mask&&alignTrait(canonical,r.mask));
 if(!accepted.length)throw Error('La segmentación no coincide con el texto; no se guardó.');
 for(const r of accepted){const mask=r.mask!;const same=current.filter(s=>s.threshold===r.threshold&&key(s.mask)===key(mask));if(same.some(s=>s.text!==canonical))throw Error('Patrón contradictorio.');if(!same.length)current.push({text:canonical,threshold:r.threshold,mask});}
 if(current.length>1000)throw Error('Límite de patrones.');
 localStorage.setItem(KEY,JSON.stringify(current));return accepted.map(r=>r.threshold);
}
export function readDualTrait(rows:ReturnType<typeof traitRows>,samples:TraitSample[],engine:GlyphEngine){
 const results=rows.map(r=>({threshold:r.threshold,value:r.mask?readFullCharacters(r.mask,trainFullTraits(samples,r.threshold),engine):null}));
 const primary=results.find(r=>r.threshold===90)?.value,secondary=results.find(r=>r.threshold===110)?.value;
 return {value:primary&&primary===secondary?primary:null,results};
}
