import {isSelectionYellow} from './selection-guard';
import type {PixelFrame,RosterAnchor} from './roster-anchor';
export interface Slot {id:string;kind:'captain'|'crew';x:number;y:number;w:number;h:number;selected:boolean;fingerprint:string;selectionScore?:number}
function rgb(f:PixelFrame,x:number,y:number){const i=(Math.round(y)*f.width+Math.round(x))*4;return [f.data[i]||0,f.data[i+1]||0,f.data[i+2]||0]}
export function inspectGrid(f:PixelFrame,a:RosterAnchor):Slot[]{
 const slots:Slot[]=[];const s=a.scale;
 // Reference centres measured from Crew Roster sample; coordinates relative to heading centre.
 for(let row=0;row<5;row++)for(let col=0;col<6;col++){
  const cx=a.x+(-344+52.1*col)*s,cy=a.y+(82+55.4*row)*s;
  const w=Math.round((col===0?47:43)*s),h=Math.round(43*s),x=Math.round(cx-w/2),y=Math.round(cy-h/2);
  if(x<0||y<0||x+w>=f.width||y+h>=f.height)continue;
  let colorful=0;const sig:number[]=[];
  for(let iy=0;iy<8;iy++)for(let ix=0;ix<8;ix++){const [r,g,b]=rgb(f,cx+(ix-3.5)*3.4*s,cy+(iy-3.5)*3.4*s);if(Math.max(r,g,b)-Math.min(r,g,b)>45&&Math.max(r,g,b)>90)colorful++;sig.push((r>>5)*64+(g>>5)*8+(b>>5))}
  if(colorful<16)continue;
  let score=0;let borderScore=0;
  for(const d of [-4,-3,-2,-1,0,1,2,3,4]){
   const hx=w/2+d*s,hy=h/2+d*s;
   for(let edge=0;edge<4;edge++){let run=0,best=0;for(let k=0;k<25;k++){const t=(k/24-.5)*.76;const xx=edge<2?cx+t*w:cx+(edge===2?-hx:hx);const yy=edge<2?cy+(edge===0?-hy:hy):cy+t*h;const [r,g,b]=rgb(f,xx,yy);if(isSelectionYellow(r,g,b)){run++;best=Math.max(best,run)}else run=0}score=Math.max(score,best);if(edge===1||edge===3)borderScore=Math.max(borderScore,best)}
  }
  slots.push({id:row+':'+col,kind:col===0?'captain':'crew',x,y,w,h,selected:false,selectionScore:col===0?borderScore:score,fingerprint:sig.join('.')});
 }
 const ranked=slots.slice().sort((a,b)=>(b.selectionScore??0)-(a.selectionScore??0));
 if(ranked[0]&&(ranked[0].selectionScore??0)>=10&&(ranked[0].selectionScore??0)-(ranked[1]?.selectionScore??0)>=5)ranked[0].selected=true;
 return slots;
}
export function selectedSlot(slots:Slot[]){const candidates=slots.filter(s=>s.selected);return candidates.length===1?candidates[0]:null}
export function sameGrid(a:Slot[],b:Slot[]){return a.length===b.length&&a.every((s,i)=>s.id===b[i].id&&s.fingerprint===b[i].fingerprint)}
