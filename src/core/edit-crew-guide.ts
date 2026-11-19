import {fromHex,findAnchor} from './ship-visual-reader';
import type {PixelFrame} from './roster-anchor';
import type {Slot} from './crew-grid';
import type {Snapshot} from './sync-storage';
const anchor=fromHex(98,'fdf87ee2181f81f07bfefdf8,184dc3263100dc3188a6264dc,300cc3063300cc60d806060cc,300cc3037b00cc60ce06060cc,300d83e35a00d860c70607cd8,300f8323de00f860c306064f8,380d83018e00d870c186060d8,1c4cc3218c00cc319106064cc,fde77e10401e71f1e070fde7');
export function editGrid(f:PixelFrame):Slot[]|null{
 const a=findAnchor(f,anchor);if(!a)return null;
 const slots:Slot[]=[];
 for(let row=0;row<5;row++)for(let col=0;col<6;col++){
 const cx=a.x-99+(col===0?0:56+(col-1)*52),cy=a.y-291+row*55;
 if(cx-24<0||cy-24<0||cx+24>=f.width||cy+24>=f.height)continue;
 let colorful=0;const sig:number[]=[];
 for(let iy=0;iy<8;iy++)for(let ix=0;ix<8;ix++){const x=Math.round(cx+(ix-3.5)*3.4),y=Math.round(cy+(iy-3.5)*3.4),i=(y*f.width+x)*4,r=f.data[i],g=f.data[i+1],b=f.data[i+2];if(Math.max(r,g,b)-Math.min(r,g,b)>45&&Math.max(r,g,b)>90)colorful++;sig.push((r>>5)*64+(g>>5)*8+(b>>5));}
 if(colorful<16)continue;
 slots.push({id:row+':'+col,kind:col===0?'captain':'crew',x:cx-21,y:cy-21,w:42,h:42,selected:false,fingerprint:sig.join('.')});
 }return slots;
}
export function portraitCandidates(snapshot:Snapshot,slots:Slot[],ids:string[]){
 // Candidate only: an identical portrait does not establish personal identity.
 const wanted=ids.flatMap(id=>snapshot.records[id]?[snapshot.records[id]]:[]);
 return slots.filter(s=>wanted.some(o=>o.kind===s.kind&&o.fingerprint===s.fingerprint));
}
