import {decodeVoyageNumber} from './voyage-number';
import {fromHex,crop,readShipNumber} from './ship-visual-reader';
import type {Frame,Mask} from './ports-text-patterns';
const headers=[
 ['ram',-59,-10,142,'3f00808107013f707c619f87ee39f820fe07,1900c0830802183184608c830618c0306188,1980c0c30804183100608cc30618c0306188,190140c70c04183300608c830618c05060cc,190160e507081f3300608c83e7f8f85860c7,1e03e129031818330c608f030618c0f860c3,1b023139011018330c608d830618c08c6081,19863111912018318c310cc30618c18c6191,18e61b119e0018307c1e0c73e638f9867e1e'],
 ['deck',-83,-10,93,'1fc3f1fb9c073fcfc4083801,c3183099003060604184007,c318601a003060606184003,c198601c003060606386003,c19f601c0030607c7283803,c198601e003060609481803,c118601b003060609c80803,c31830998030606088c8803,fc1f0f98e030607d88cf007'],
 ['deck',-82,-10,96,'fe1f8fdce039fe7e2041c03e,618c184c8018303020c20023,618c300d0018303030c20003,60cc300e0018303031c30003,60cfb00e0018303e3941c002,60cc300f001830304a40c004,608c300d801830304e404008,618c184cc018303044644019,7e0f87cc7018303ec467803f'],
 ['rudder',-98,-10,65,'1f830cfe1fc3f7e07,c8304618c3183208,cc304618c3183308,c830460cc198320c,c830460cc19f3207,f030460cc1983c03,d8304608c1183601,cc188618c3183311,c70f07e0fc1f31de'],
 ['hull',-108,-10,43,'71c619c1c07,30c608c0c08,30c608c0c08,30c608c0c0c,3fc608c0c07,30c608c0c03,30c608c0c01,30c310c0c11,31c1e0f8f9e']
] as const;
const names:Record<string,[string,string]>={'110x13:49055ea1':['ram','Ghostly Figurehead'],'59x10:2ffd8e3e':['ram','Battle Ram'],'112x13:1c9305b7':['ram','Intrepid Figurehead'],'50x9:4f6cba87':['ram','War Ram'],'118x13:53f39d89':['ram','Inspiring Figurehead'],'120x13:663707b4':['deck','Large Crate of Riches'],'85x13:d8422fbe':['deck','Ornate Rigging'],'96x10:6cbe04f7':['deck','Eastern Artefacts'],'96x10:85209533':['deck','Eastern Artefacts'],'58x9:346780b8':['deck','Cannon x3'],'104x13:af61990f':['deck','Whaleskin Rigging'],'94x10:75fffbac':['rudder','Polished Rudder'],'82x10:583b4b45':['rudder','Gilded Rudder'],'103x10:649d1995':['rudder','Enchanted Rudder'],'88x10:581d3fef':['rudder','Skeletal Rudder'],'150x10:dee0c3e3':['rudder','Rudder that Parts the Seas'],'64x10:84d80d45':['hull','Golden Hull'],'79x10:29a11fef':['hull','Hull of Storms'],'46x10:d70f8a82':['hull','War Hull'],'69x13:24f8fb02':['hull','Hull of Glory'],'90x10:05782046':['hull','Storm Rider Hull']};
export function maskKey(m:Mask|null){if(!m)return '';let h=2166136261;for(const c of m.bits)h=Math.imul(h^Number(c),16777619)>>>0;return m.w+'x'+m.h+':'+h.toString(16).padStart(8,'0');}
export function findGold(f:Frame,m:Mask){
 const gold=(x:number,y:number)=>{const i=(y*f.width+x)*4,r=f.data[i],g=f.data[i+1],b=f.data[i+2];return r>145&&g>100&&r-b>35&&g-b>15;};
 const marks=Array.from(m.bits).flatMap((v,i)=>v==='1'?[i]:[]);const probes=[marks[0],marks[Math.floor(marks.length/2)],marks[marks.length-1]];
 let found:{x:number;y:number}|null=null;
 for(let y=0;y<=f.height-m.h;y++)for(let x=0;x<=f.width-m.w;x++){if(!probes.every(i=>gold(x+i%m.w,y+Math.floor(i/m.w))))continue;let ok=true;for(let i=0;i<m.bits.length;i++){if(gold(x+i%m.w,y+Math.floor(i/m.w))!==(m.bits[i]==='1')){ok=false;break;}}if(ok){if(found)return null;found={x,y};}}
 return found;
}
export type LockState='equipped'|'available'|'locked-gold'|'locked-grey'|'unknown';
export function classifyBadge(g:number,o:number,w:number):LockState{
 if(g===27&&o===0&&w===1)return 'equipped';if(g===0&&o===0&&w===0)return 'available';if(g===0&&o===61&&w===15)return 'locked-gold';if(g===0&&o===0&&w===48)return 'locked-grey';return 'unknown';
}
export function readPartMenu(f:Frame){
 for(const [category,dx,dy,w,hex] of headers){const a=findGold(f,fromHex(w,hex));if(!a)continue;const x=a.x+dx,y=a.y+dy;if(x<0||y<0||x+263>f.width||y+215>f.height)continue;
 const rows=Array.from({length:5},(_,j)=>{const yy=y+28+j*37;const key=maskKey(crop(f,x+8,yy,199,25,false,160)),entry=names[key];let g=0,o=0,w=0;for(let h=0;h<25;h++)for(let k=211;k<237;k++){const i=((yy+h)*f.width+x+k)*4,R=f.data[i],G=f.data[i+1],B=f.data[i+2];if(G>130&&G>R+35&&G>B+35)g++;if(R>160&&R>B+60)o++;if(Math.min(R,G,B)>130)w++;}
 return {name:entry?.[0]===category?entry[1]:null,state:classifyBadge(g,o,w),mask:key,badge:[g,o,w]};});
 return {category,rows,anchor:a,partial:true};}return null;
}
const voyageNames:Record<string,string>={'122x10:6d6acd4e':'FIRST CONTACT','34x10:9506cec4':'I SPY','126x10:cfff2162':'BUILDING PLANS'};
// Exact glyph matching; unknown or ambiguous titles remain null.
const voyageGlyphs=new Map<string,Set<string>>();
function addVoyageGlyphs(name:string,w:number,bits:string,ranges:[number,number][]){
 const letters=name.replace(/ /g,'');
 if(bits.length!==w*10||letters.length!==ranges.length)throw new Error('Invalid voyage glyph sample');
 ranges.forEach(([l,r],i)=>{const key=(r-l+1)+':'+Array.from({length:10},(_,y)=>bits.slice(y*w+l,y*w+r+1)).join('');const values=voyageGlyphs.get(key)??new Set<string>();values.add(letters[i]);voyageGlyphs.set(key,values);});
}
addVoyageGlyphs('I SPY',34,'1100000000111100011011100011000011110000000100000001100010000100001011000000010000000110001100011000001100000001100000011000100000100100110000000111100001100010000011100011000000000111000110010000000110001100000000001100011000000000011000110000000000010001100000000001100011000000000001000110000000000110001100000001111000011000000000011000',[[0,1],[9,13],[17,23],[26,33]]);
addVoyageGlyphs('BUILDING PLANS',126,'110110000110000010001100011000000011111110000011000100000001000001111110000000011011100011000000000001000000010000000100001111110011000110000010001100011000000011000011100011000110000001000010000000000000011000100011000000000001000000011000000100010000110001000110000010001100011000000011000001100011000111000001000100000000000000011000110011000000000011100000011100000100010000110010000110000010001100011000000011000000110011000101100001001100000000000000011000100011000000000011100000010110000100011000110110000110000010001100011000000011000000110011000100110001001100000000000000011000100011000000000100110000010011000100011110110011000110000010001100011000000011000000110011000100011001001100000011000000011001000011000000000100110000010001100100000111110001100110000010001100011000000011000000110011000100001101001100000011000000011000000011000000000111110000010000110100000011110001100110000010001100011000000011000000100011000100000111000110000011000000011000000011000000001000011000010000011100000001110001100010000100001100011000000011000001100011000100000011000011000011000000011000000011000000001000011000010000001100000001111110000001111000001100011111100011111110000011000100000001000000111110000000011000000011111100011000001100010000000100011110',[[0,6],[9,16],[20,21],[25,30],[34,43],[46,47],[51,59],[62,71],[79,85],[88,93],[97,105],[109,117],[121,125]]);
export function decodeVoyageTitle(m:Mask|null):string|null{
 if(!m||m.h!==10||m.w>355||m.bits.length!==m.w*m.h)return null;
 const empty=(x:number)=>Array.from({length:10},(_,y)=>m.bits[y*m.w+x]).every(v=>v==='0');
 const memo=new Map<number,string[]>();
 function walk(pos:number):string[]{
 if(memo.has(pos))return memo.get(pos)!;
 let x=pos;while(x<m!.w&&empty(x))x++;
 if(x===m!.w)return [''];
 const found=new Set<string>();
 for(let w=1;w<=12&&x+w<=m!.w;w++){
 const key=w+':'+Array.from({length:10},(_,y)=>m!.bits.slice(y*m!.w+x,y*m!.w+x+w)).join('');
 const letters=voyageGlyphs.get(key);if(!letters)continue;
 for(const letter of letters)for(const tail of walk(x+w)){found.add((pos>0&&x-pos>=7?' ':'')+letter+tail);if(found.size>1)break;}
 if(found.size>1)break;
 }
 const result=[...found];memo.set(pos,result);return result;
 }
 const values=walk(0);return values.length===1&&values[0]?values[0]:null;
}
const voyageHeader=fromHex(89,'1c70f1c60807c7c0e0e1cff,c6318c40c1846006062018,c4208480c1006006062018,4460c68143006006063018,6860c30163007c06061c18,6860c303e30c6006060c18,30608302330c6006060418,30318306318c6006064418,e0306187c7c07c67818');
const knownNumbers:Record<string,number>={'26x9:90cee157':6500,'24x9:cf833837':5171,'20x9:dcfd3ad8':204,'20x9:0d05d380':214};
export function readVoyageList(f:Frame){
 const a=findGold(f,voyageHeader);if(!a)return null;const dx=a.x-405,dy=a.y-70;
 if(535+dx<0||95+dy<0||815+dx>f.width||465+dy>f.height)return null;
 const titleMask=crop(f,458+dx,95+dy,355,22,true);const nameKey=maskKey(crop(f,560+dx,95+dy,155,22,true)),name=voyageNames[maskKey(titleMask)]??voyageNames[nameKey]??decodeVoyageTitle(titleMask);
 const read=(x:number,y:number)=>{const masks=[160,100,130].map(t=>crop(f,x+dx,y+dy,40,20,false,t));const key=maskKey(masks[0]);const values=[...new Set(masks.flatMap(m=>[knownNumbers[maskKey(m)],readShipNumber(m),decodeVoyageNumber(m)]).filter((n):n is number=>typeof n==='number'))];return {value:values.length===1?values[0]:null,blank:masks.every(m=>!m),mask:key,patterns:masks};};
 const totals=[382,414,445].map(y=>read(535,y));
 const requirements=[383,414,445].map(y=>read(763,y));
 return {name,titleMask,totals:totals.map(r=>r.value),requirements:requirements.map(r=>r.blank?0:r.value),diagnostics:{nameKey,totals,requirements},anchor:a};
}
