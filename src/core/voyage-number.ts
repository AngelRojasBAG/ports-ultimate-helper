import {digitRows,greenDigitRows} from './ports-digit-font';
import type {Mask} from './ports-text-patterns';
function trim(rows:string[]):Mask|null{const w=rows[0].length;const cols=Array.from({length:w},(_,i)=>rows.some(r=>r[i]==='1'));const l=cols.indexOf(true),r=cols.lastIndexOf(true);return l<0?null:{w:r-l+1,h:rows.length,bits:rows.map(q=>q.slice(l,r+1)).join('')};}
const templates=[...Object.entries(digitRows),...Object.entries(greenDigitRows)].map(([n,s])=>({n,m:trim(s.split('/'))!}));
// Match all ink, allowing zero or more blank columns between characters.
export function decodeVoyageNumber(m:Mask|null):number|null{
 if(!m||m.h!==9||m.w>48)return null;
 const memo=new Map<number,string[]>();
 function walk(x:number):string[]{while(x<m!.w&&Array.from({length:9},(_,y)=>m!.bits[y*m!.w+x]).every(v=>v==='0'))x++;if(x===m!.w)return [''];if(memo.has(x))return memo.get(x)!;const found=new Set<string>();for(const {n,m:t} of templates){if(x+t.w>m!.w)continue;const bits=Array.from({length:9},(_,y)=>m!.bits.slice(y*m!.w+x,y*m!.w+x+t.w)).join('');if(bits!==t.bits)continue;for(const tail of walk(x+t.w)){if(tail.length<6)found.add(n+tail);if(found.size>1)break;}if(found.size>1)break;}const result=[...found];memo.set(x,result);return result;}
 const values=walk(0);return values.length===1&&/^(0|[1-9]\d{0,5})$/.test(values[0])?Number(values[0]):null;
}
