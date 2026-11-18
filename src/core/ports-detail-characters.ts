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
export function trainDetailGlyphs(samples:Sample[]){
 const store=new Map<string,Glyph>(),conflicts=new Set<string>();
 for(const s of samples){
  if(s.field!=='details')continue;
  const text=s.text.split('\n').map(x=>x.trim()).filter(Boolean);
  const captain=text.some(x=>/^Personality:/i.test(x));
  if(captain&&text.length!==3)continue;
  const lines=detailLines(s.mask,captain?'captain':'crew');
  lines.forEach((mask,i)=>{
   const chars=[...(text[i]??'').replace(/\s/g,'')],parts=splitCoreLine(mask);
   if(parts.length!==chars.length||!parts.length)return;
   parts.forEach((part,j)=>{
    const key=part.mask.w+'/'+part.mask.bits,chr=chars[j];
    if(store.has(key)&&store.get(key)!.chr!==chr)conflicts.add(key);
    else store.set(key,{chr,mask:part.mask});
   });
  });
 }
 return [...store].filter(([k])=>!conflicts.has(k)).map(([,v])=>v);
}
function readLine(mask:Mask,glyphs:Glyph[],engine:GlyphEngine):string|null{
 let out='';
 for(const part of splitCoreLine(mask)){
  const m=part.mask,choices=glyphs.filter(g=>g.mask.w===m.w&&g.mask.h===m.h),matches=choices.filter(g=>g.mask.bits===m.bits);
  if(new Set(matches.map(g=>g.chr)).size!==1)return null;
  const im=new ImageData(m.w+40,m.h+40);
  for(let i=3;i<im.data.length;i+=4)im.data[i]=255;
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.bits[y*m.w+x]==='1'){const i=((y+20)*im.width+x+20)*4;im.data[i]=im.data[i+1]=im.data[i+2]=255;}
  const chr=engine.readChar(im,fontForGlyphs(choices,m.h),[255,255,255],20,20+m.h-1,false,true)?.chr;
  if(chr!==matches[0].chr)return null;
  if(out&&part.gap>=3)out+=' ';out+=chr;
 }
 return out||null;
}
export function readDetailCharacters(mask:Mask,samples:Sample[],kind:Kind,engine:GlyphEngine){
 const glyphs=trainDetailGlyphs(samples),lines=detailLines(mask,kind);
 const read=lines.map(m=>readLine(m,glyphs,engine));
 const count=kind==='captain'?2:1;
 const traits=read.length>=count&&read.slice(0,count).every(Boolean)?read.slice(0,count).join('\n'):'';
 const personality=kind==='captain'?read[2]??'':'';
 const parsed=parseDetails('',traits+(personality?'\n'+personality:''),kind);
 return {traitsText:traits?parsed.traitsText:null,personality:parsed.personality,coverage:[...new Set(glyphs.map(g=>g.chr))].sort().join(' '),read};
}
