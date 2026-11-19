import {fromHex} from './ship-visual-reader';
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
export function editGrid(f:PixelFrame):Slot[]|null{
 const a=editAnchor(f);if(!a)return null;const slots:Slot[]=[];
 for(let row=0;row<4;row++)for(let col=0;col<6;col++){
 const cx=a.x-98+(col===0?0:51+(col-1)*52),cy=a.y+[-291,-235,-183,-129][row];
 if(cx-24<0||cy-24<0||cx+24>=f.width||cy+24>=f.height)continue;
 let colorful=0;const sig:number[]=[];
 for(let iy=0;iy<8;iy++)for(let ix=0;ix<8;ix++){const x=Math.round(cx+(ix-3.5)*3.4),y=Math.round(cy+2+(iy-3.5)*3.4),i=(y*f.width+x)*4,r=f.data[i],g=f.data[i+1],b=f.data[i+2];if(Math.max(r,g,b)-Math.min(r,g,b)>45&&Math.max(r,g,b)>90)colorful++;sig.push((r>>5)*64+(g>>5)*8+(b>>5));}
 if(colorful<16)continue;
 slots.push({id:row+':'+col,kind:col===0?'captain':'crew',x:cx-18,y:cy-20,w:42,h:42,selected:false,fingerprint:sig.join('.')});
 }return slots;
}
export function portraitCandidates(snapshot:Snapshot,slots:Slot[],ids:string[]){
 const wanted=ids.flatMap(id=>snapshot.records[id]?[snapshot.records[id]]:[]);
 return slots.filter(s=>wanted.some(o=>{if(o.kind!==s.kind)return false;if(o.fingerprint===s.fingerprint)return true;const a=s.fingerprint.split('.'),b=o.fingerprint.split('.');return a.length===64&&b.length===64&&a.filter((v,i)=>v===b[i]).length>=48;}));
}
