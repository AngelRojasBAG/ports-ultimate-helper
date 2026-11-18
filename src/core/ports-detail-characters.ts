import {detailLines} from './ports-detail-lines';
import type {Mask,Sample} from './ports-text-patterns';
import {fontForGlyphs,type Glyph,type GlyphEngine} from './ports-glyph-font';
import {parseDetails} from './unit-details';
type Kind='crew'|'captain';
export function splitCoreLine(mask:Mask){
 const parts:{mask:Mask;gap:number}[]=[];let start=-1,last=0;
 for(let x=0;x<=mask.w;x++){
  let ink=false;if(x<mask.w)for(let y=0;y<mask.h;y++)if(mask.bits[y*mask.w+x]==='1'){ink=true;break;}
  if(ink&&start<0)start=x;
  if(!ink&&start>=0){
   const w=x-start;
   parts.push({mask:{w,h:mask.h,bits:Array.from({length:mask.h},(_,y)=>mask.bits.slice(y*mask.w+start,y*mask.w+x)).join('')},gap:parts.length?start-last:0});last=x;start=-1;
  }
 }
 return parts;
}
// Legacy seven-row glyphs can encode incomplete or joined letters.
 // Keep the public API but quarantine this family until a full-height
 // character alignment is validated against independent samples.
export function trainDetailGlyphs(_samples:Sample[]):Glyph[]{return [];}
export function readDetailCharacters(_mask:Mask,_samples:Sample[],_kind:Kind,_engine:GlyphEngine,_trained?:Glyph[]){
 return {traitsText:null as string|null,personality:null as string|null,coverage:'',read:[] as (string|null)[]};
}
