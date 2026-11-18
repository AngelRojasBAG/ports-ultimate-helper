import {captureGame} from '../alt1/capture';
import {findRosterAnchor,type RosterAnchor} from '../core/roster-anchor';
type Color=[number,number,number];
type Font={width:number;height:number;basey:number;spacewidth:number;chars:unknown[]};
type Engine={findReadLine:(buffer:ImageData,font:Font,colors:Color[],x:number,y:number,w:number,h:number)=>{text:string}};
type Globals=Window&{OCR?:Engine;Alt1Fonts?:Record<string,unknown>};
const g=window as Globals;
const folder=new URL('./alt1-ocr/',location.href);
function script(file:string){return new Promise<void>((resolve,reject)=>{const el=document.createElement('script');el.src=new URL(file,folder).href;el.onload=()=>resolve();el.onerror=()=>reject(Error('No se pudo cargar '+file));document.head.append(el)})}
let loading:Promise<{ocr:Engine;fonts:{name:string;font:Font}[]}>|undefined;
function load(){return loading??=(async()=>{await script('base.js');await script('ocr.js');if(!g.OCR?.findReadLine)throw Error('OCR de Alt1 no disponible');const res=await fetch(new URL('fonts.json',folder));if(!res.ok)throw Error('No se pudo cargar el catálogo de fuentes');const list=await res.json() as {name:string;file:string}[];const fonts:{name:string;font:Font}[]=[];for(const f of list){await script(f.file);let obj:unknown=g.Alt1Fonts;for(const part of f.name.split('/'))obj=(obj as Record<string,unknown>|undefined)?.[part];const font=obj as Font;if(font?.chars?.length&&font.width>0)fonts.push({name:f.name,font});}if(!fonts.length)throw Error('No se pudieron inicializar las fuentes');return {ocr:g.OCR,fonts};})().catch(e=>{loading=undefined;throw e})}
const regions=[
 {name:'Nombre',dx:-350,dy:338,w:330,h:23,palette:'gold'},
 {name:'Nivel',dx:-315,dy:361,w:115,h:30,palette:'white'},
 {name:'Morale / Seafaring',dx:-315,dy:392,w:270,h:22,palette:'mixed'},
 {name:'Combat / Speed',dx:-315,dy:414,w:270,h:22,palette:'mixed'},
 {name:'Traits / personalidad',dx:-315,dy:436,w:270,h:47,palette:'white'},
 {name:'Barco',dx:-382,dy:338,w:24,h:20,palette:'white'}
];
const gold:Color[]=[[255,215,140],[240,200,130],[238,187,115]];
const white:Color[]=[[255,255,255],[220,220,220],[190,185,175]];
function crop(frame:ImageData,a:RosterAnchor,r:typeof regions[number]){const x=Math.round(a.x+r.dx*a.scale),y=Math.round(a.y+r.dy*a.scale),w=Math.round(r.w*a.scale),h=Math.round(r.h*a.scale);if(x<0||y<0||x+w>frame.width||y+h>frame.height)throw Error('Recorte fuera de pantalla: '+r.name);const out=new ImageData(w+40,h+40);for(let i=0;i<out.data.length;i+=4){out.data[i]=48;out.data[i+1]=44;out.data[i+2]=37;out.data[i+3]=255;}for(let row=0;row<h;row++){const start=((y+row)*frame.width+x)*4;out.data.set(frame.data.subarray(start,start+w*4),((row+20)*out.width+20)*4)}return {out,w,h}}
function bands(img:ImageData,w:number,h:number){const b:{first:number;last:number;minX:number;maxX:number}[]=[];let current:typeof b[number]|null=null;for(let y=20;y<20+h;y++){let min=Infinity,max=-1;for(let x=20;x<20+w;x++){const i=(y*img.width+x)*4,r=img.data[i],g=img.data[i+1],bl=img.data[i+2];if(r>125&&g>100&&(Math.min(r,g,bl)>110||r-bl>35)){min=Math.min(min,x);max=Math.max(max,x)}}if(max>=min){if(!current){current={first:y,last:y,minX:min,maxX:max};b.push(current)}else{current.last=y;current.minX=Math.min(current.minX,min);current.maxX=Math.max(current.maxX,max)}}else current=null;}return b.filter(q=>q.last-q.first>=2||q.maxX-q.minX>=2)}
export function mountAlt1Lab(root:HTMLElement){
 const section=document.createElement('section');section.className='assistant';section.innerHTML='<h2>Laboratorio OCR · Solo Alt1</h2><p>Selecciona una unidad en Crew Roster y pulsa Analizar. Se prueban las fuentes de Alt1 sin Tesseract. No se escribe en tu registro.</p><button id="alt1-lab-run">Analizar unidad seleccionada</button><p id="alt1-lab-status" role="status"></p><div id="alt1-lab-output"></div>';root.append(section);
 const btn=section.querySelector<HTMLButtonElement>('#alt1-lab-run')!,status=section.querySelector<HTMLElement>('#alt1-lab-status')!,output=section.querySelector<HTMLElement>('#alt1-lab-output')!;
 btn.onclick=async()=>{btn.disabled=true;output.replaceChildren();status.textContent='Cargando fuentes especializadas…';try{const {ocr,fonts}=await load();const frame=captureGame(window.alt1),a=findRosterAnchor(frame);if(!a)throw Error('Abre Crew Roster con el panel completo visible.');const started=performance.now();for(const r of regions){status.textContent='Analizando '+r.name+'…';const {out,w,h}=crop(frame,a,r);const group=document.createElement('details');group.open=true;const heading=document.createElement('summary');heading.textContent=r.name;group.append(heading);const canvas=document.createElement('canvas');canvas.width=out.width;canvas.height=out.height;canvas.getContext('2d')!.putImageData(out,0,0);canvas.style.maxWidth='100%';group.append(canvas);const rows=bands(out,w,h);
 for(const {name,font} of fonts){try{const results:string[]=[];for(const row of rows){const palette=r.palette==='gold'?gold:r.palette==='white'?white:[...gold,...white];const x=Math.max(0,row.minX-2),end=Math.min(out.width-font.width,row.maxX+1);const y=Math.max(font.basey,row.last-3),bottom=Math.min(out.height-font.height+font.basey,row.last+7);if(end<=x||bottom<=y)continue;
 // Search near the first visible glyph; keep competing font results separate.
 const text=ocr.findReadLine(out,font,palette,x,y,Math.min(end-x,Math.max(12,font.width*2)),bottom-y).text.trim();if(text)results.push(text);}
 const line=document.createElement('p');line.textContent=name+': '+(results.join(' / ')||'—');group.append(line);
 }catch(e){const line=document.createElement('p');line.textContent=name+': '+String(e);group.append(line)}}
 output.append(group);await new Promise<void>(resolve=>window.setTimeout(resolve,0));}
 status.textContent='Prueba terminada: '+fonts.length+' fuentes, '+Math.round(performance.now()-started)+' ms de análisis total. Sin guardar datos.';}catch(e){status.textContent=String(e)}finally{btn.disabled=false}};
}
