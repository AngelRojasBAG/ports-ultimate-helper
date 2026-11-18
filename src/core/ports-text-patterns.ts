export type Mask={w:number;h:number;bits:string};
export type Frame={width:number;height:number;data:Uint8ClampedArray};
export type Field='title'|'level'|'ship'|'details';
export type Sample={field:Field;text:string;mask:Mask};
export function extractMask(f:Frame,x:number,y:number,w:number,h:number,field:Field):Mask|null{
 if(x<0||y<0||x+w>f.width||y+h>f.height)return null;
 const a:number[][]=[];let l=w,r=-1,t=h,b=-1;
 for(let j=0;j<h;j++){const row:number[]=[];for(let i=0;i<w;i++){
  const k=((y+j)*f.width+x+i)*4,R=f.data[k],G=f.data[k+1],B=f.data[k+2];
  const ink=field==='title'?R>145&&G>100&&R-B>35&&G-B>15:Math.min(R,G,B)>130&&Math.max(R,G,B)-Math.min(R,G,B)<70;
  row.push(+ink);if(ink){l=Math.min(l,i);r=Math.max(r,i);t=Math.min(t,j);b=Math.max(b,j)}
 }a.push(row)}
 if(r<l)return null;
 return {w:r-l+1,h:b-t+1,bits:a.slice(t,b+1).map(row=>row.slice(l,r+1).join('')).join('')};
}
export function validText(field:Field,text:string){
 if(field==='level')return /^(?:[1-9]|10)$/.test(text);
 if(field==='ship')return /^[1-4-]$/.test(text);
 if(field==='title')return /^[A-Za-z][A-Za-z .'\-]{1,70}$/.test(text);
 return text.length<=200&&/^[A-Za-z][A-Za-z0-9 ,.'\n:\-]*$/.test(text);
}
export function matchSample(samples:Sample[],field:Field,mask:Mask|null):string|null{
 if(!mask)return null;
 const matches=new Set(samples.filter(s=>s.field===field&&s.mask.w===mask.w&&s.mask.h===mask.h&&s.mask.bits===mask.bits).map(s=>s.text));
 return matches.size===1?[...matches][0]:null;
}
export function addSample(samples:Sample[],sample:Sample):Sample[]{
 if(!validText(sample.field,sample.text))throw Error('Texto no válido.');
 const same=samples.filter(s=>s.field===sample.field&&s.mask.w===sample.mask.w&&s.mask.h===sample.mask.h&&s.mask.bits===sample.mask.bits);
 if(same.some(s=>s.text!==sample.text))throw Error('Patrón contradictorio; no se guardó.');
 if(same.length)return samples;
 if(samples.length>=1000)throw Error('Límite de calibraciones.');
 return [...samples,sample];
}
