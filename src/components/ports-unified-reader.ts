import {titleSeeds} from '../core/ports-title-seeds';
import {traitRows,readDualTrait,loadTraitSamples} from '../core/ports-trait-dual';
import {readFullCrewTrait} from '../core/ports-full-traits';
import {loadAlt1OCR} from './alt1-ocr-lab';
import {captureGame} from '../alt1/capture';
import {findRosterAnchor} from '../core/roster-anchor';
import {inspectGrid,selectedSlot} from '../core/crew-grid';
import {extractMask,matchSample,addSample,type Sample,type Field} from '../core/ports-text-patterns';
import {decodeGlyphs,matchTitleWithNoise,type GlyphEngine} from '../core/ports-glyph-font';
import {readDetailLines} from '../core/ports-detail-lines';
import {cellMask,readSignedNumber} from '../core/ports-digit-font';
import {readGlyph,type DigitEngine} from './ports-numeric-lab';
import {knownCrewName} from '../core/crew-name';
import {parseDetails} from '../core/unit-details';
import {combinedFonts} from '../core/ports-glyph-registry';
import {readDetailCharacters} from '../core/ports-detail-characters';
const KEY='ports-helper.text-patterns.v1';
let samplesRaw:string|undefined,samplesCache:Sample[]=[];
export function loadSamples():Sample[]{
 const text=localStorage.getItem(KEY)??'[]';if(text===samplesRaw)return samplesCache;
 const raw:unknown=JSON.parse(text);
 if(!Array.isArray(raw)||raw.length>1000)throw Error('Patrones locales inválidos.');
 let out:Sample[]=[];
 for(const s of raw){
  if(!s||!['title','level','ship','details'].includes(s.field)||typeof s.text!=='string'||!s.mask||!Number.isInteger(s.mask.w)||!Number.isInteger(s.mask.h)||s.mask.w<1||s.mask.w>330||s.mask.h<1||s.mask.h>58||typeof s.mask.bits!=='string'||s.mask.bits.length!==s.mask.w*s.mask.h||!/^[01]+$/.test(s.mask.bits))throw Error('Patrón local inválido.');
  out=addSample(out,s);
 }
 samplesRaw=text;samplesCache=out;return out;
}
export function mountUnifiedReader(root:HTMLElement){
 const sec=document.createElement('section');
 sec.innerHTML='<h2>Leer unidad seleccionada</h2><p>Selecciona una unidad en Crew Roster. Una captura, todos los campos, sin modificar registros.</p><button>Leer unidad</button><label><input type="checkbox" class="auto-unit"> Lectura automática (solo diagnóstico)</label><p role="status" aria-live="polite"></p><dl class="unit-result"></dl><button class="copy-unit" disabled>Copiar resultado</button>';
 root.append(sec);
 const button=sec.querySelector('button')!,out=sec.querySelector('dl')!,status=sec.querySelector<HTMLElement>('[role=status]')!,copy=sec.querySelector<HTMLButtonElement>('.copy-unit')!;
 let report='',lastKey='',stableKey='',stableCount=0,busy=false;
 const auto=sec.querySelector<HTMLInputElement>('.auto-unit')!;
 async function run(automatic=false){
  if(busy)return;
  busy=true;
  button.disabled=true;if(!automatic)status.textContent='Cargando Alt1…';
  try{
   await loadAlt1OCR();
   const engine=(window as Window&{OCR?:GlyphEngine&DigitEngine}).OCR;
   if(!engine?.readChar)throw Error('OCR no disponible.');
   const samples=loadSamples(),frame=captureGame(window.alt1),a=findRosterAnchor(frame);
   if(!a||a.scale!==1)throw Error('Abre Crew Roster a escala 100%.');
   const slot=selectedSlot(inspectGrid(frame,a));if(!slot)throw Error('Selecciona una unidad inequívoca.');
   const t=performance.now();
   if(automatic&&!auto.checked)return;
   // Hash the complete panel, not just the slot, to detect changes in place.
   let hash=2166136261;for(let y=a.y+338;y<a.y+483;y++)for(let x=a.x-382;x<a.x-20;x++){const i=(y*frame.width+x)*4;hash=Math.imul(hash^frame.data[i]^frame.data[i+1]<<8^frame.data[i+2]<<16,16777619);}
   const key=slot.id+'/'+slot.fingerprint+'/'+hash;
   if(automatic){if(key!==stableKey){stableKey=key;stableCount=1;return;}if(++stableCount<2||key===lastKey)return;}
   lastKey=key;copy.disabled=true;out.replaceChildren();report='';
   const fonts=combinedFonts(samples);
   const crop=(field:Field,dx:number,dy:number,w:number,h:number)=>extractMask(frame,a.x+dx,a.y+dy,w,h,field);
   const rows:{label:string;value:string|null;source:string}[]=[];
   const numericDebug:string[]=['Ancla: '+a.x+'/'+a.y+' · escala '+a.scale];
   const push=(label:string,value:string|null,source:string)=>rows.push({label,value,source});
   const regions=[['title','Nombre',-350,338,330,23],['level','Nivel',-315,361,115,30],['ship','Barco',-382,338,24,20]] as const;
   for(const [field,label,dx,dy,w,h] of regions){
    const mask=crop(field,dx,dy,w,h),glyphs=fonts[field];
    let value=mask?decodeGlyphs(field,mask,glyphs,engine):null;
    let source='Alt1 caracteres';
    const exact=matchSample(samples,field,mask)??(field==='title'?matchTitleWithNoise(mask,[...samples,...titleSeeds]):null);
    if(value!==null&&exact!==null&&value.toUpperCase()!==exact.toUpperCase()){value=null;source='Conflicto';}
    else if(value===null&&exact!==null){value=exact;source=field==='title'?'Patrón de nombre verificado':'Patrón registrado';}
    if(field==='title'&&slot.kind==='crew'&&value&&!knownCrewName(value)){value=null;source='Nombre fuera del catálogo';}
    if(field==='title'&&value===null&&mask)numericDebug.push('Nombre máscara '+mask.w+'x'+mask.h+' · '+mask.bits);
    push(label,value,source+' · cobertura '+[...new Set(glyphs.map(g=>g.chr))].sort().join(' '));
   }
   for(const [label,dx,dy] of [['Morale',-246,401],['Combat',-246,418],['Seafaring',-126,401],['Speed',-126,418]] as const){
    const x=a.x+dx,y=a.y+dy,value=readSignedNumber(frame,x,y,mask=>readGlyph(engine,mask));
    push(label,value,'Alt1 numérico · '+x+'/'+y);
    if(value===null)numericDebug.push(label+' '+x+'/'+y+' · '+Array.from({length:5},(_,i)=>cellMask(frame,x+i*7,y)??'fuera').join(' | '));
   }
   const mask=crop('details',-315,436,270,47);
   const independent=mask?readDetailCharacters(mask,samples,slot.kind,engine,fonts.details):null;
   const full=mask?readFullCrewTrait(mask,samples,slot.kind):null;
   const dual=slot.kind==='crew'?readDualTrait(traitRows(frame,a.x-315,a.y+436,270,47),loadTraitSamples(),engine):null;
   if(dual)numericDebug.push('Traits OCR 90/110: '+dual.results.map(q=>q.threshold+'='+ (q.value??'Pendiente')).join(' / '));
   const lines=mask?readDetailLines(mask,samples,slot.kind):null;
   const exact=mask?matchSample(samples,'details',mask):null;
   const known=exact?parseDetails('',exact,slot.kind):null;
   for(const [key,label] of [['traitsText','Traits'],['personality','Personalidad']] as const){
    if(key==='personality'&&slot.kind==='crew')continue;
    const values=[independent?.[key],key==='traitsText'?full?.traitsText:null,key==='traitsText'?dual?.value:null,lines?.[key],known?.[key]].filter((v):v is string=>!!v);
    const conflict=new Set(values.map(v=>v.toLowerCase())).size>1;
    push(label,conflict?null:values[0]??null,conflict?'Conflicto':independent?.[key]?'Alt1 caracteres':key==='traitsText'&&dual?.value?(dual.method==='characters'?'Alt1 caracteres 90+110':'Patrón verificado 90+110'):known?.[key]?'Patrón registrado':key==='traitsText'&&full?'Patrón de línea completa':lines?.[key]?'Patrón por línea':'Sin coincidencia');
   }
   const complete=rows.filter(r=>r.value!==null).length;
   for(const r of rows){
    const dt=document.createElement('dt'),dd=document.createElement('dd'),small=document.createElement('small');
    dt.textContent=r.label;dd.textContent=r.value??'Pendiente';dd.className=r.value===null?'pending':'valid';small.textContent=r.source;dd.append(document.createElement('br'),small);out.append(dt,dd);
   }
   status.textContent='Casilla '+slot.id+' · '+complete+'/'+rows.length+' campos · '+Math.round(performance.now()-t)+' ms · Solo lectura';
   report=status.textContent+'\n'+rows.map(r=>r.label+': '+(r.value??'Pendiente')+' ['+r.source+']').join('\n')+'\n'+numericDebug.join('\n');copy.disabled=false;
  }catch(e){lastKey='';stableKey='';stableCount=0;out.replaceChildren();copy.disabled=true;status.textContent=String(e)}finally{button.disabled=false;busy=false}
 }
 button.onclick=()=>void run();
 let timer:number|undefined;
 auto.onchange=()=>{if(timer!==undefined)window.clearInterval(timer);timer=undefined;lastKey='';stableKey='';stableCount=0;if(auto.checked){timer=window.setInterval(()=>{if(sec.closest('details')?.open!==false)void run(true)},600);void run(true);}};
 copy.onclick=async()=>{try{await navigator.clipboard.writeText(report);status.textContent='Diagnóstico copiado.'}catch{const ta=document.createElement('textarea');ta.value=report;ta.rows=10;sec.append(ta);ta.select()}};
}
