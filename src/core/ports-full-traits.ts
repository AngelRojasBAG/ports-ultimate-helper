import type {Mask,Sample} from './ports-text-patterns';
import {parseDetails} from './unit-details';
type Kind='crew'|'captain';
export function fullTraitRow(m:Mask):Mask|null{
 // All eight exported detail masks begin with a 10-pixel main body
 // followed by optional descenders in rows 10..12 and blank rows 13..15.
 // Refuse a crop that does not exhibit this separator.
 if(m.h<16)return null;
 const counts=Array.from({length:m.h},(_,y)=>m.bits.slice(y*m.w,(y+1)*m.w).replace(/0/g,'').length);
 if(counts.slice(13,16).some(n=>n!==0)||counts.slice(3,10).some(n=>n===0))return null;
 let left=m.w,right=-1;
 for(let y=0;y<13;y++)for(let x=0;x<m.w;x++)if(m.bits[y*m.w+x]==='1'){left=Math.min(left,x);right=Math.max(right,x);}
 if(right<left)return null;
 return {w:right-left+1,h:13,bits:Array.from({length:13},(_,y)=>m.bits.slice(y*m.w+left,y*m.w+right+1)).join('')};
}
export function fullRowSimilarity(a:Mask,b:Mask){
 if(a.h!==b.h||Math.abs(a.w-b.w)>2)return 0;
 let best=0;
 for(let offset=-2;offset<=2;offset++){
  let same=0,total=0;
  for(let y=0;y<a.h;y++)for(let x=-2;x<Math.max(a.w,b.w)+2;x++){
   const aa=x>=0&&x<a.w&&a.bits[y*a.w+x]==='1',xx=x+offset;
   const bb=xx>=0&&xx<b.w&&b.bits[y*b.w+xx]==='1';
   if(aa||bb)total++;if(aa&&bb)same++;
  }
  if(total)best=Math.max(best,same/total);
 }
 return best;
}
export function readFullCrewTrait(mask:Mask,samples:Sample[],kind:Kind){
 if(kind!=='crew')return null;
 const row=fullTraitRow(mask);if(!row)return null;
 const candidates=new Map<string,number>();
 for(const s of samples){
  if(s.field!=='details'||/^Personality:/im.test(s.text))continue;
  const trait=parseDetails('',s.text,'crew').traitsText,ref=fullTraitRow(s.mask);
  if(!trait||!ref)continue;
  candidates.set(trait,Math.max(candidates.get(trait)??0,fullRowSimilarity(row,ref)));
 }
 const ranked=[...candidates].sort((a,b)=>b[1]-a[1]);
 if(!ranked[0]||ranked[0][1]<.85||ranked[0][1]-(ranked[1]?.[1]??0)<.15)return null;
 return {traitsText:ranked[0][0],score:ranked[0][1]};
}
