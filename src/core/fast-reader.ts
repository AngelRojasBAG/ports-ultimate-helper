import type {PixelFrame,RosterAnchor} from './roster-anchor';
import {mask} from './roster-anchor';
import type {Slot} from './crew-grid';
export function anchorStillVisible(f:PixelFrame,a:RosterAnchor):boolean{
 let yes=0,no=0,p=0,n=0;
 for(let y=0;y<13;y++)for(let x=0;x<104;x++){const xx=Math.round(a.x+(x-52)*a.scale),yy=Math.round(a.y+(y-6)*a.scale);if(xx<0||yy<0||xx>=f.width||yy>=f.height)return false;const i=(yy*f.width+xx)*4,r=f.data[i],g=f.data[i+1],b=f.data[i+2],gold=r>120&&g>85&&r-b>35&&g-b>15;if(mask[y][x]==='1'){p++;if(gold)yes++}else{n++;if(!gold)no++}}
 return (yes/p+no/n)/2>=.91;
}
// Exact pixel comparison of the relevant text areas, excluding XP bar and decorative portrait.
export function panelKey(f:PixelFrame,a:RosterAnchor):string|null{
 const boxes=[[-350,338,330,23],[-315,361,115,31],[-315,392,270,44]];
 const bytes:number[]=[];
 for(const [dx,dy,w,h] of boxes){const x=Math.round(a.x+dx*a.scale),y=Math.round(a.y+dy*a.scale),ww=Math.round(w*a.scale),hh=Math.round(h*a.scale);if(x<0||y<0||x+ww>f.width||y+hh>f.height)return null;
 for(let j=0;j<hh;j++)for(let k=0;k<ww;k++){const i=((y+j)*f.width+x+k)*4;bytes.push(f.data[i],f.data[i+1],f.data[i+2])}}
 let key='';for(let i=0;i<bytes.length;i+=8192)key+=String.fromCharCode(...bytes.slice(i,i+8192));return key;
}
export function selectionKey(s:Slot,panel:string){return s.id+'|'+s.fingerprint+'|'+panel}
