import {captureGame} from '../alt1/capture';
import {findRosterAnchor} from '../core/roster-anchor';
import {inspectGrid,selectedSlot} from '../core/crew-grid';
import {extractMask,matchSample,addSample,type Sample,type Field,type Mask} from '../core/ports-text-patterns';
const KEY='ports-helper.text-patterns.v1';
const regions:{field:Field;label:string;dx:number;dy:number;w:number;h:number}[]=[
 {field:'title',label:'Nombre',dx:-350,dy:338,w:330,h:23},
 {field:'level',label:'Nivel',dx:-315,dy:361,w:115,h:30},
 {field:'ship',label:'Barco (1–4 o -)',dx:-382,dy:338,w:24,h:20},
 {field:'details',label:'Traits y personalidad (texto completo)',dx:-315,dy:436,w:270,h:47}
];
export function mountTextCalibration(root:HTMLElement){
 const sec=document.createElement('section');sec.className='assistant';
 sec.innerHTML='<h2>Calibración de texto · Ports</h2><p>Selecciona una unidad y captura sus campos. Si no hay coincidencia exacta, transcribe el recorte para enseñar ese patrón. No modifica el registro de tripulación.</p><button id="pt-capture">Capturar campos</button><p id="pt-status" role="status"></p><div id="pt-fields"></div><button id="pt-export">Exportar patrones</button><label>Importar patrones<input id="pt-import" type="file" accept=".json"></label>';
 root.append(sec);
 const status=sec.querySelector<HTMLElement>('#pt-status')!,fields=sec.querySelector<HTMLElement>('#pt-fields')!;
 let samples:Sample[]=[];
 function valid(s:unknown):s is Sample{
  if(!s||typeof s!=='object')return false;
  const a=s as Sample;
  return regions.some(r=>r.field===a.field)&&typeof a.text==='string'&&!!a.mask&&Number.isInteger(a.mask.w)&&Number.isInteger(a.mask.h)&&a.mask.w>0&&a.mask.w<=330&&a.mask.h>0&&a.mask.h<=58&&typeof a.mask.bits==='string'&&a.mask.bits.length===a.mask.w*a.mask.h&&/^[01]+$/.test(a.mask.bits);
 }
 function decode(raw:string){const x:unknown=JSON.parse(raw);if(!Array.isArray(x)||x.length>1000||!x.every(valid))throw Error('Archivo de patrones inválido.');let result:Sample[]=[];for(const a of x)result=addSample(result,a);return result;}
 try{samples=decode(localStorage.getItem(KEY)??'[]')}catch{status.textContent='No se pudieron recuperar los patrones anteriores.'}
 function persist(next:Sample[]){localStorage.setItem(KEY,JSON.stringify(next));samples=next;}
 sec.querySelector<HTMLButtonElement>('#pt-capture')!.onclick=()=>{
  fields.replaceChildren();
  try{
   const frame=captureGame(window.alt1),a=findRosterAnchor(frame);
   if(!a||a.scale!==1)throw Error('Abre Crew Roster a escala 100%.');
   const slot=selectedSlot(inspectGrid(frame,a));
   if(!slot)throw Error('Selecciona una unidad inequívoca.');
   for(const r of regions){
    const x=Math.round(a.x+r.dx),y=Math.round(a.y+r.dy);
    const mask=extractMask(frame,x,y,r.w,r.h,r.field);
    const block=document.createElement('div');const label=document.createElement('p');label.textContent=r.label;block.append(label);
    if(!mask){const msg=document.createElement('p');msg.textContent='Sin patrón visible';block.append(msg);fields.append(block);continue;}
    const canvas=document.createElement('canvas');canvas.width=r.w;canvas.height=r.h;canvas.style.maxWidth='100%';const img=new ImageData(r.w,r.h);
    for(let j=0;j<r.h;j++){const start=((y+j)*frame.width+x)*4;img.data.set(frame.data.subarray(start,start+r.w*4),j*r.w*4);}
    canvas.getContext('2d')!.putImageData(img,0,0);block.append(canvas);
    const value=matchSample(samples,r.field,mask);
    const result=document.createElement('p');result.textContent=value===null?'Pendiente de calibración':'Coincidencia exacta: '+value;block.append(result);
    const input=document.createElement('textarea');input.rows=r.field==='details'?3:1;input.value=value??'';input.placeholder=r.field==='level'?'Solo el número':r.field==='ship'?'1, 2, 3, 4 o -':'Transcribe el recorte';block.append(input);
    const save=document.createElement('button');save.textContent='Registrar patrón';save.onclick=()=>{try{const text=input.value.trim();persist(addSample(samples,{field:r.field,text,mask}));result.textContent='Patrón registrado: '+text;status.textContent=samples.length+' patrones locales.';}catch(e){status.textContent=String(e)}};block.append(save);fields.append(block);
   }
   status.textContent='Casilla '+slot.id+' · '+samples.length+' patrones locales · Sin escribir en tripulación.';
  }catch(e){status.textContent=String(e)}
 };
 sec.querySelector<HTMLButtonElement>('#pt-export')!.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(samples)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ports-text-patterns.json';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),30000)};
 const file=sec.querySelector<HTMLInputElement>('#pt-import')!;file.onchange=async()=>{try{const f=file.files?.[0];if(!f)return;if(f.size>20000000)throw Error('Archivo demasiado grande.');let next=samples;for(const a of decode(await f.text()))next=addSample(next,a);persist(next);status.textContent=samples.length+' patrones importados y locales.';}catch(e){status.textContent=String(e)}finally{file.value=''}};
}
