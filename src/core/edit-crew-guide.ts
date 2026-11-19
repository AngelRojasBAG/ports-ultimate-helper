import {fromHex,readShipHeader} from './ship-visual-reader';
import type {PixelFrame} from './roster-anchor';
import type {Slot} from './crew-grid';
import type {Snapshot} from './sync-storage';
const anchor=fromHex(97,'3e781f300c07807039fe3e78,c26418318806418c40303064,806618118806610440303066,1806418129006430660303064,180641e1ad006430638303c64,1807818085007830618303078,806c180c6006c1040830306c,c266180c2006618c88303066,3e631f0020063070f0303e63');
const close=fromHex(85,'3e601c0e3e00f9e07cc03,c26063103003099060c62,806041103002019860462,18060c19830060190604a4,18060c18e3c060190786b4,18060c186300601e060214,80604102300201b060318,c26063223003099860308,3e7c1c3c3e00f98c7c008');
export function editAnchor(f:PixelFrame){
 const bright=new Uint8Array(f.width*f.height);for(let i=0;i<bright.length;i++)bright[i]=+(Math.min(f.data[i*4],f.data[i*4+1],f.data[i*4+2])>160);
 const score=(m:typeof anchor,x:number,y:number)=>{if(x<0||y<0||x+m.w>f.width||y+m.h>f.height)return 0;let hit=0,union=0;for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const a=bright[(y+j)*f.width+x+i],b=Number(m.bits[j*m.w+i]);hit+=a&b;union+=a|b;}return union?hit/union:0;};
 const probes=Array.from(anchor.bits).flatMap((v,i)=>v==='1'?[i]:[]).filter((_,i)=>i%19===0);
 let best:{x:number;y:number;score:number}|null=null;
 for(let y=345;y<=f.height-anchor.h;y++)for(let x=100;x<=f.width-anchor.w;x++){let n=0;for(const i of probes)n+=bright[(y+Math.floor(i/anchor.w))*f.width+x+i%anchor.w];if(n<probes.length*.7)continue;const s=score(anchor,x,y);if(s<.78)continue;let top=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)top=Math.max(top,score(close,x+7+dx,y-345+dy));if(top<.78)continue;if(!best||s+top>best.score)best={x,y,score:s+top};}
 return best;
}
// Eight-pixel white level glyphs measured from the Edit Crew PNG of 19 Nov.
const levelMasks:Record<number,string>={3:'0110/1001/0001/0110/0001/0001/1001/0110',5:'1111/1000/1000/1110/0001/0001/1001/0110',6:'00110/01001/10000/10110/11001/10001/10001/01110',7:'1111/0001/0010/0010/0100/0100/1000/1000',8:'01110/10001/10001/01110/10001/10001/10001/01110'};
export function readIconLevel(f:PixelFrame,cx:number,cy:number,row:number,captain:boolean):number|null{
 const x=cx+(captain?9:13),y=cy+(row===0?9:row===3?7:9),w=captain?14:10;
 if(x<0||y<0||x+w>f.width||y+8>f.height)return null;
 const rows=Array.from({length:8},(_,j)=>Array.from({length:w},(_,k)=>{const i=((y+j)*f.width+x+k)*4;return Math.min(f.data[i],f.data[i+1],f.data[i+2])>190?'1':'0';}).join(''));
 const cols=Array.from({length:w},(_,i)=>rows.some(r=>r[i]==='1'));const l=cols.indexOf(true),r=cols.lastIndexOf(true);
 if(l<0)return null;const key=rows.map(s=>s.slice(l,r+1)).join('/');
 const match=Object.entries(levelMasks).find(([,v])=>v===key);return match?Number(match[0]):null;
}
export type EditSlot=Slot&{level?:number|null};
export function editGrid(f:PixelFrame,a=editAnchor(f)):EditSlot[]|null{if(!a)return null;const slots:EditSlot[]=[];
 for(let row=0;row<4;row++)for(let col=0;col<6;col++){
 const cx=a.x-98+(col===0?0:(row===0?56:51)+(col-1)*52),cy=a.y+[-291,-235,-183,-129][row];
 if(cx-24<0||cy-24<0||cx+24>=f.width||cy+24>=f.height)continue;
 let colorful=0;const sig:number[]=[];
 for(let iy=0;iy<8;iy++)for(let ix=0;ix<8;ix++){const x=Math.round(cx+(ix-3.5)*3.4),y=Math.round(cy+2+(iy-3.5)*3.4),i=(y*f.width+x)*4,r=f.data[i],g=f.data[i+1],b=f.data[i+2];if(Math.max(r,g,b)-Math.min(r,g,b)>45&&Math.max(r,g,b)>90)colorful++;sig.push((r>>5)*64+(g>>5)*8+(b>>5));}
 if(colorful<16)continue;
 slots.push({id:row+':'+col,kind:col===0?'captain':'crew',x:cx-18,y:cy-20,w:42,h:42,selected:false,fingerprint:sig.join('.'),level:readIconLevel(f,cx,cy,row,col===0)});
 }return slots;
}
export function portraitScore(a:string,b:string){
 if(a===b)return 64;
 const x=a.split('.'),y=b.split('.');return x.length===64&&y.length===64?x.filter((v,i)=>v===y[i]).length:0;
}
export function portraitCandidates(snapshot:Snapshot,slots:EditSlot[],ids:string[]){
 const all=Object.entries(snapshot.records);
 return slots.filter(s=>{
  const ranked=all.filter(([,o])=>o.kind===s.kind&&(s.level==null||o.reading.level===s.level)).map(([id,o])=>({id,score:portraitScore(s.fingerprint,o.fingerprint)})).sort((a,b)=>b.score-a.score);
  const best=ranked[0];if(!best||best.score<48)return false;
  // Compare against non-recommended portraits too. Do not highlight a clearly better non-target match.
  const wanted=ranked.filter(r=>ids.includes(r.id));if(!wanted.length||wanted[0].score<best.score-1)return false;
  return true;
 });
}

export function editShipHeader(f:PixelFrame,a:NonNullable<ReturnType<typeof editAnchor>>){
 return readShipHeader(f,{x:a.x+7,y:a.y-345});
}
export function assignedCandidates(snapshot:Snapshot,slots:EditSlot[],ids:string[]){
 const assigned=slots.filter(s=>s.id.startsWith('0:'));
 const options=assigned.map(s=>({slot:s,ids:ids.filter(id=>portraitCandidates(snapshot,[s],[id]).length>0&&s.level!=null)}));
 // Maximum bipartite matching; one recommendation cannot count twice.
 const used=new Map<string,EditSlot>();
 function visit(i:number,seen:Set<string>):boolean{
  for(const id of options[i].ids){if(seen.has(id))continue;seen.add(id);const previous=used.get(id);
   if(!previous||visit(options.findIndex(o=>o.slot.id===previous.id),seen)){used.set(id,options[i].slot);return true;}
  }return false;
 }
 options.forEach((_,i)=>visit(i,new Set()));
 return [...used.entries()];
}
