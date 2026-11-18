import type {Mask,Sample} from './ports-text-patterns';
import {parseDetails} from './unit-details';
type Kind='crew'|'captain';
type Line={mask:Mask;text:string;role:'traits'|'personality'};
function line(m:Mask,y:number,h:number):Mask|null{
 if(y+h>m.h)return null;
 let l=m.w,r=-1;
 for(let j=y;j<y+h;j++)for(let x=0;x<m.w;x++)if(m.bits[j*m.w+x]==='1'){l=Math.min(l,x);r=Math.max(r,x);}
 if(r<l)return null;
 return {w:r-l+1,h,bits:Array.from({length:h},(_,i)=>m.bits.slice((y+i)*m.w+l,(y+i)*m.w+r+1)).join('')};
}
// Seven core rows of each line avoid overlapping descenders/ascenders
// in the three-line captain layout. These offsets are calibrated to the
// exported masks at scale 1, not arbitrary text positions.
export function detailLines(m:Mask,kind:Kind):Mask[]{
 const offsets=kind==='captain'?[3,19,29]:[3];
 return offsets.map(y=>line(m,y,7)).filter((x):x is Mask=>x!==null);
}
export function trainDetailLines(samples:Sample[],kind:Kind):Line[]{
 const result:Line[]=[];
 for(const s of samples){
  if(s.field!=='details')continue;
  const lines=s.text.split('\n').map(v=>v.trim()).filter(Boolean);
  const captain=lines.some(v=>/^Personality:/i.test(v));
  if(captain!==(kind==='captain'))continue;
  // Only train the observed layout: two trait rows and one personality
  // row for captains; one trait row for crew. Never learn flavour text.
  if(captain&&(lines.length!==3||!/^Personality:/i.test(lines[2])))continue;
  const masks=detailLines(s.mask,kind);
  if(masks.length!==(captain?3:1))continue;
  masks.forEach((mask,i)=>result.push({mask,text:lines[i],role:i===2?'personality':'traits'}));
 }
 return result;
}
function agreement(a:Mask,b:Mask){
 if(a.h!==b.h||Math.abs(a.w-b.w)>2)return 0;
 let best=0;
 for(let shift=-2;shift<=2;shift++){
  let inter=0,union=0;
  for(let y=0;y<a.h;y++)for(let x=-2;x<Math.max(a.w,b.w)+2;x++){
   const aa=x>=0&&x<a.w&&a.bits[y*a.w+x]==='1';
   const bx=x+shift;
   const bb=bx>=0&&bx<b.w&&b.bits[y*b.w+bx]==='1';
   if(aa||bb)union++;if(aa&&bb)inter++;
  }
  if(union)best=Math.max(best,inter/union);
 }
 return best;
}
export function matchDetailLine(mask:Mask,templates:Line[],role:Line['role']){
 const ranked=new Map<string,{text:string;score:number}>();
 for(const t of templates){
  if(t.role!==role)continue;
  const k=t.text.toLowerCase(),score=agreement(mask,t.mask);
  if(score>(ranked.get(k)?.score??-1))ranked.set(k,{text:t.text,score});
 }
 const sorted=[...ranked.values()].sort((a,b)=>b.score-a.score);
 const best=sorted[0];if(!best||best.score<.78||best.score-(sorted[1]?.score??0)<.12)return null;
 return best;
}
export function readDetailLines(mask:Mask,samples:Sample[],kind:Kind){
 const templates=trainDetailLines(samples,kind),lines=detailLines(mask,kind);
 const results=lines.map((m,i)=>matchDetailLine(m,templates,i===2?'personality':'traits'));
 const count=kind==='captain'?2:1;
 const traits=results.length>=count&&results.slice(0,count).every(Boolean)?results.slice(0,count).map(r=>r!.text).join('\n'):'';
 const personality=kind==='captain'?results[2]?.text??'':'';
 const parsed=parseDetails('',traits+(personality?'\n'+personality:''),kind);
 return {traitsText:traits?parsed.traitsText:null,personality:parsed.personality,results};
}
