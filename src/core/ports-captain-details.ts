import type {Mask,Sample} from './ports-text-patterns';
import {parseDetails} from './unit-details';
export function bands(mask:Mask):Mask[]{
 const out:Mask[]=[];let start=-1;
 for(let y=0;y<=mask.h;y++){
 const ink=y<mask.h&&mask.bits.slice(y*mask.w,(y+1)*mask.w).includes('1');
 if(ink&&start<0)start=y;
 if(!ink&&start>=0){let left=mask.w,right=-1;for(let j=start;j<y;j++)for(let x=0;x<mask.w;x++)if(mask.bits[j*mask.w+x]==='1'){left=Math.min(left,x);right=Math.max(right,x);}
 if(right>=left)out.push({w:right-left+1,h:y-start,bits:Array.from({length:y-start},(_,j)=>mask.bits.slice((start+j)*mask.w+left,(start+j)*mask.w+right+1)).join('')});start=-1;}
 }return out;
}
export function bandScore(a:Mask,b:Mask){
 if(Math.abs(a.w-b.w)>2||Math.abs(a.h-b.h)>2)return 0;
 let best=0;
 for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){
 let inter=0,union=0;
 for(let y=-2;y<Math.max(a.h,b.h)+2;y++)for(let x=-2;x<Math.max(a.w,b.w)+2;x++){
 const aa=x>=0&&x<a.w&&y>=0&&y<a.h&&a.bits[y*a.w+x]==='1';
 const xx=x+dx,yy=y+dy,bb=xx>=0&&xx<b.w&&yy>=0&&yy<b.h&&b.bits[yy*b.w+xx]==='1';
 if(aa||bb)union++;if(aa&&bb)inter++;
 }if(union)best=Math.max(best,inter/union);
 }return best;
}
export function readCaptainDetails(mask:Mask|null,samples:Sample[]){
 if(!mask)return null;const observed=bands(mask);
 if(observed.length<2)return null;
 const candidates=new Map<string,{traitsText:string;personality:string;score:number}>();
 for(const s of samples){
 if(s.field!=='details'||!/^Personality:/im.test(s.text))continue;
 const parsed=parseDetails('',s.text,'captain');if(!parsed.traitsText||!parsed.personality)continue;
 const ref=bands(s.mask);if(ref.length!==observed.length)continue;
 const score=Math.min(...ref.map((b,i)=>bandScore(observed[i],b)));
 const key=parsed.traitsText+'|'+parsed.personality;
 if(score>(candidates.get(key)?.score??-1))candidates.set(key,{traitsText:parsed.traitsText,personality:parsed.personality,score});
 }
 const ranked=[...candidates.values()].sort((a,b)=>b.score-a.score);
 return ranked[0]&&ranked[0].score>=.90&&ranked[0].score-(ranked[1]?.score??0)>=.12?ranked[0]:null;
}
