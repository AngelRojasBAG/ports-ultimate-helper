import type {Mask,Sample,Field} from './ports-text-patterns';
export type Glyph={chr:string;mask:Mask};
export type GlyphField=Exclude<Field,'details'>;
function slice(m:Mask,x:number,y:number,w:number,h:number):Mask{
 return {w,h,bits:Array.from({length:h},(_,i)=>m.bits.slice((y+i)*m.w+x,(y+i)*m.w+x+w)).join('')};
}
function columns(m:Mask):{x:number;w:number}[]{
 const out:{x:number;w:number}[]=[];let start=-1;
 for(let x=0;x<=m.w;x++){
  let ink=false;if(x<m.w)for(let y=0;y<m.h;y++)if(m.bits[y*m.w+x]==='1'){ink=true;break;}
  if(ink&&start<0)start=x;
  if(!ink&&start>=0){out.push({x:start,w:x-start});start=-1;}
 }
 return out;
}
export function splitGlyphs(field:GlyphField,mask:Mask):{mask:Mask;gap:number}[] {
 if(field==='ship')return [{mask,gap:0}];
 if(field==='level'){
  if(mask.h!==11||mask.w<48)return [];
  const runs=columns(mask);
  // The measured Level prefix ends at column 35; the first digit starts at 42.
  if(runs.length<6||runs[4].x!==34||runs[4].w!==2||runs[5].x!==42)return [];
  return runs.slice(5).map((r,i)=>({mask:slice(mask,r.x,0,r.w,11),gap:i?r.x-runs[4+i].x-runs[4+i].w:0}));
 }
 // Preserve the descender: the real J is identical to I in the first 10 rows.
 if(mask.h<10||mask.h>12)return [];
 const body:Mask={w:mask.w,h:12,bits:mask.bits.padEnd(mask.w*12,'0')};
 const runs=columns(body);
 return runs.map((r,i)=>({mask:slice(body,r.x,0,r.w,12),gap:i?r.x-runs[i-1].x-runs[i-1].w:0}));
}
export function trainGlyphs(samples:Sample[],field:GlyphField):Glyph[]{
 const map=new Map<string,Glyph>();const conflicts=new Set<string>();
 for(const s of samples){
  if(s.field!==field)continue;
  const text=field==='title'?s.text.toUpperCase().replace(/ /g,''):s.text;
  const glyphs=splitGlyphs(field,s.mask);
  if(glyphs.length!==text.length)continue;
  for(let i=0;i<glyphs.length;i++){
   const mask=glyphs[i].mask,key=mask.w+'/'+mask.h+'/'+mask.bits,chr=text[i];
   if(map.has(key)&&map.get(key)!.chr!==chr)conflicts.add(key);
   else map.set(key,{chr,mask});
  }
 }
 return [...map].filter(([key])=>!conflicts.has(key)).map(([,g])=>g);
}
export function fontForGlyphs(glyphs:Glyph[],height:number){
 const chars=glyphs.map((g,i)=>{
  const pixels:number[]=[];
  for(let y=0;y<g.mask.h;y++)for(let x=0;x<g.mask.w;x++)if(g.mask.bits[y*g.mask.w+x]==='1')pixels.push(x,y,255);
  return {chr:g.chr,width:g.mask.w,bonus:pixels.length/3*5,templatex:i*20,secondary:false,pixels};
 });
 return {chars,width:Math.max(1,...chars.map(c=>c.width)),height,basey:height-1,spacewidth:3,shadow:false,bonusperpixel:5};
}
export type GlyphEngine={readChar:(im:ImageData,font:ReturnType<typeof fontForGlyphs>,col:[number,number,number],x:number,y:number,backwards:boolean,allowSecondary:boolean)=>{chr:string}|null};
export function decodeGlyphs(field:GlyphField,mask:Mask,glyphs:Glyph[],engine:GlyphEngine):string|null{
 const parts=splitGlyphs(field,mask);if(!parts.length)return null;
 let result='';
 for(const part of parts){
  const m=part.mask;
  const exact=glyphs.filter(g=>g.mask.w===m.w&&g.mask.h===m.h&&g.mask.bits===m.bits);
  if(new Set(exact.map(g=>g.chr)).size!==1)return null;
  // Restrict candidates to same height and width, but do not feed the
  // expected character into the OCR. Full mask validation is independent.
  const candidates=glyphs.filter(g=>g.mask.h===m.h&&g.mask.w===m.w);
  const font=fontForGlyphs(candidates,m.h);
  const im=new ImageData(m.w+40,m.h+40);
  for(let i=3;i<im.data.length;i+=4)im.data[i]=255;
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.bits[y*m.w+x]==='1'){const i=((y+20)*im.width+x+20)*4;im.data[i]=im.data[i+1]=im.data[i+2]=255;}
  const chr=engine.readChar(im,font,[255,255,255],20,20+m.h-1,false,true)?.chr;
  if(chr!==exact[0].chr)return null;
  if(field==='title'&&result&&part.gap>=5)result+=' ';
  result+=chr;
 }
 if(field==='level'&&!/^(?:[1-9]|10)$/.test(result))return null;
 if(field==='ship'&&!/^[1-4-]$/.test(result))return null;
 return result;
}
