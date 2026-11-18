import type {Frame,Mask} from './ports-text-patterns';
export function fromHex(w:number,rows:string):Mask{return {w,h:rows.split(',').length,bits:rows.split(',').map(r=>BigInt('0x'+r).toString(2).padStart(w,'0')).join('')};}
const anchor=fromHex(77,'1fbfc7bfe01fbf0fdc67,c99e32660319b864c62,c187306006099860ee6,c187306006019860ef6,f98330600601b07c6b4,c98330600601f0647bc,c18730600709b86079c,c98e306003899c64318,1fbfc78f801fbcefc318');
const voyageAnchor=fromHex(91,'78e3e38e181f9f81e1e7dff,38c6799c18398c80c0ce531,18ce39d83c708c00c0ce030,1d8c18f03c600c00c0cf030,d8c18706c600f80c0c7830,f0c18607e63cc80c0c1c30,f0e1860c6718c00c0c8c30,6073060c7798c80ccc9c30,603e0f1c79f9f81fdef87c');
const title=fromHex(147,'7f9c73f03f8041f87380080810101c3f30cff,c0c3180186060c832000c083018206130418,c0c3180186060cc34000c0c301820c030418,c0c31801830a0c83800140c702830c030418,c0ff1f01830b0c83800160e502c1cc030418,c0c31801831f0f03c003e12907c0cc030418,c0c3180182118d836002313904604c030418,c0c3180186318cc3300631118c6446118818,c0c71f01f830cc731c061b118c3781f0f018');
const voyageTitle=fromHex(111,'7ee7e073fc01f8f841dfe0407eff,306320806003098c60830060c218,3063308060060104708300618018,306320c060060306588300a18018,3e632070600603064c8300b18018,3063c03060060306468301f18018,3063601060060304438301198018,306331106003098c41830318c218,30631de06000f870c083030c3e18');
const digits=[['0',5,'e,1b,13,11,11,11,13,1b,e'],['1',3,'3,7,5,1,1,1,1,1,1'],['2',5,'e,13,1,3,2,6,c,18,1f'],['3',5,'1e,13,1,3,e,3,1,3,1e'],['4',6,'6,6,e,1a,12,32,3f,2,2'],['5',5,'1f,10,10,1e,3,1,1,3,1e'],['6',5,'e,18,10,1e,1b,11,11,1b,e'],['7',6,'3f,3,2,6,6,4,c,8,18']] as const;
const templates=digits.map(([ch,w,r])=>({ch,mask:fromHex(w,r)}));
function ink(f:Frame,x:number,y:number,gold=false){const i=(y*f.width+x)*4,r=f.data[i],g=f.data[i+1],b=f.data[i+2];return gold?r>145&&g>100&&r-b>35&&g-b>15:Math.min(r,g,b)>100;}
function inside(f:Frame,x:number,y:number,w:number,h:number){return x>=0&&y>=0&&x+w<=f.width&&y+h<=f.height;}
export function crop(f:Frame,x:number,y:number,w:number,h:number,gold=false):Mask|null{
 if(!inside(f,x,y,w,h))return null;
 let l=w,r=-1,t=h,b=-1;const rows:string[]=[];
 for(let j=0;j<h;j++){let row='';for(let i=0;i<w;i++){const bit=ink(f,x+i,y+j,gold);row+=bit?'1':'0';if(bit){l=Math.min(l,i);r=Math.max(r,i);t=Math.min(t,j);b=Math.max(b,j);}}rows.push(row);}
 if(r<l)return null;return {w:r-l+1,h:b-t+1,bits:rows.slice(t,b+1).map(s=>s.slice(l,r+1)).join('')};
}
const same=(a:Mask|null,b:Mask)=>!!a&&a.w===b.w&&a.h===b.h&&a.bits===b.bits;
export function findAnchor(f:Frame,m:Mask){
 const marks:number[]=[],blanks:number[]=[];for(let i=0;i<m.bits.length;i++)(m.bits[i]==='1'?marks:blanks).push(i);
 const probes=[marks[0],marks[Math.floor(marks.length/2)],marks[marks.length-1],blanks[Math.floor(blanks.length/2)]];
 let found:{x:number;y:number}|null=null;
 for(let y=0;y<=f.height-m.h;y++)for(let x=0;x<=f.width-m.w;x++){
 if(!probes.every(i=>ink(f,x+i%m.w,y+Math.floor(i/m.w))===(m.bits[i]==='1')))continue;
 let ok=true;for(let i=0;i<m.bits.length;i++){if(ink(f,x+i%m.w,y+Math.floor(i/m.w))!==(m.bits[i]==='1')){ok=false;break;}}
 if(ok){if(found)return null;found={x,y};}
 }return found;
}
export function readShipNumber(m:Mask|null):number|null{
 if(!m||m.h!==9)return null;let start=-1,s='';
 for(let x=0;x<=m.w;x++){
 const present=x<m.w&&Array.from({length:9},(_,y)=>m.bits[y*m.w+x]).includes('1');
 if(present&&start<0)start=x;
 if(!present&&start>=0){const w=x-start,part={w,h:9,bits:Array.from({length:9},(_,y)=>m.bits.slice(y*m.w+start,y*m.w+x)).join('')};const hit=templates.filter(t=>same(part,t.mask));if(hit.length!==1)return null;s+=hit[0].ch;start=-1;}
 }return s&&s.length<=6?Number(s):null;
}
const icons=[
 ['Ghostly Figurehead',745,480,'3b1405431b0c350c014313025e321c2b13083313073b1405431b0c4d24133b1b0c4323112b13083313075e321c4d2413431302432311331b0e1e0401603c215e321c4d24134d2413432311'],
 ['Large Crate of Riches',887,417,'23130b3d3d40503f3c4323115f2b101b0b061b0b060000011309051309051304012b13083c2312331b0e1b0b062b09012b13085f402c603c213b14056e3b1e6e422c331b0e6e422c714c29'],
 ['Large Crate of Riches',1115,395,'6e2b0b5f2b10b6662eba733a532f1b531b055e1d014d12028236098743171304011e04012b09014313026e20037b4d273c2312130401130401230b03874317874c207b3b183b1b0c130401'],
 ['Polished Rudder',1255,512,'825946987962987962a77c61945a36431302531b055e1d01705035986a5a431302331307331307230b03230b035f2b105f2b104f220a4f220a431b0c8259468259466f534a6f534a6e422c'],
 ['Golden Hull',1005,520,'98784e896747705035714c2986512b86512b7b4d2786512b97592b97592b6f35116033135f2b104f220a4b1b073b14052b09011e04011304010b04030b04030b04030b04031e04011e0401']
] as const;
function iconMatches(f:Frame,x:number,y:number,hex:string){
 if(!inside(f,x,y,5,5))return false;
 for(let j=0;j<5;j++)for(let i=0;i<5;i++)for(let c=0;c<3;c++){const k=((j*5+i)*3+c)*2;if(f.data[((y+j)*f.width+x+i)*4+c]!==parseInt(hex.slice(k,k+2),16))return false;}return true;
}
export function readShip(f:Frame){
 const a=findAnchor(f,anchor);if(!a)return null;const dx=a.x-968,dy=a.y-227;
 const id=same(crop(f,836+dx,146+dy,19,19),fromHex(5,'7,f,1f,3,3,3,3,3,3,3'))?1:null;
 const name=same(crop(f,920+dx,145+dy,190,20,true),title)?'THE DARK AMASCUT':null;
 const totals=[[950,170,40,16],[950,190,40,16],[1088,170,32,16],[1088,190,32,16]].map(([x,y,w,h])=>readShipNumber(crop(f,x+dx,y+dy,w,h)));
 // Component icon samples are diagnostic candidates, not sufficient for automatic storage.
 const components=icons.map(([n,x,y,hex])=>iconMatches(f,x+dx,y+dy,hex)?n:null);
 return {id,name,totals,components,anchor:a};
}
export function readVoyage(f:Frame){
 const a=findAnchor(f,voyageAnchor);if(!a)return null;
 const name=same(crop(f,a.x+263,a.y-31,125,16,true),voyageTitle)?'FIRST CONTACT':null;
 return {name,anchor:a};
}
