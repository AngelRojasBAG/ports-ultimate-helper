import type {PixelFrame,RosterAnchor} from './roster-anchor';
export interface Slot {id:string;kind:'captain'|'crew';x:number;y:number;w:number;h:number;selected:boolean;fingerprint:string}
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
  let bright=0,total=0;for(let k=0;k<12;k++){const t=(k+1)/13;for(const [xx,yy] of [[x+t*w,y+2*s],[x+t*w,y+h-2*s],[x+2*s,y+t*h],[x+w-2*s,y+t*h]]){const [r,g,b]=rgb(f,xx,yy);total++;if(r>180&&g>125&&b<100&&r-b>100)bright++}}
  slots.push({id:row+':'+col,kind:col===0?'captain':'crew',x,y,w,h,selected:bright/total>.38,fingerprint:sig.join('.')});
 }
 return slots;
}
export function selectedSlot(slots:Slot[]){const candidates=slots.filter(s=>s.selected);return candidates.length===1?candidates[0]:null}
export function sameGrid(a:Slot[],b:Slot[]){return a.length===b.length&&a.every((s,i)=>s.id===b[i].id&&s.fingerprint===b[i].fingerprint)}
