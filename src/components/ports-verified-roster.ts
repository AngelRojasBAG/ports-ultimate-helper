import {mountRosterManager} from './ports-roster-manager';
import {overlayRect} from '../core/overlay-coordinates';
import type {Slot} from '../core/crew-grid';
import {readVerified,matchingRecords,saveVerified,observationFromRows,readingSignature,type ReadRow} from '../core/verified-roster';
import type {Snapshot} from '../core/sync-storage';
const GROUP='ports-verified-roster';
export function mountVerifiedRoster(sec:HTMLElement){
 const panel=document.createElement('div');panel.className='verified-roster';
 panel.innerHTML='<label><input type="checkbox" class="sync-enabled"> Sincronizar automáticamente</label><label><input type="checkbox" class="sync-overlay"> Mostrar marcos en el juego</label><details><summary>Ajuste de marcos</summary><label>Escala de pantalla<select class="overlay-scale"><option value="auto">Automática (DPI)</option><option value="1">100%</option><option value="1.25">125%</option><option value="1.5">150%</option><option value="1.75">175%</option><option value="2">200%</option></select></label><small class="overlay-info"></small></details><p class="sync-status" role="status">Sincronización desactivada.</p><progress max="24" value="0"></progress><p class="sync-count"></p><div class="sync-grid"></div><details><summary>Tripulación guardada</summary><div class="sync-list"></div></details>';
 sec.prepend(panel);
 const enabled=panel.querySelector<HTMLInputElement>('.sync-enabled')!,overlay=panel.querySelector<HTMLInputElement>('.sync-overlay')!,status=panel.querySelector<HTMLElement>('.sync-status')!,count=panel.querySelector<HTMLElement>('.sync-count')!,grid=panel.querySelector<HTMLElement>('.sync-grid')!,list=panel.querySelector<HTMLElement>('.sync-list')!,progress=panel.querySelector<HTMLProgressElement>('progress')!;
 const scaleSelect=panel.querySelector<HTMLSelectElement>('.overlay-scale')!,scaleInfo=panel.querySelector<HTMLElement>('.overlay-info')!;
 try{scaleSelect.value=localStorage.getItem('ports-helper.overlay-scale')??'auto';if(!scaleSelect.value)scaleSelect.value='auto';}catch{}
 function scale(){return scaleSelect.value==='auto'?(window.devicePixelRatio||1):Number(scaleSelect.value);}
 let previous='',slots:Slot[]=[],last:Snapshot|null=readVerified(localStorage);
 const updateManager=mountRosterManager(list);
 const clear=()=>{try{window.alt1?.overLayClearGroup?.(GROUP)}catch{}};
 function render(){
  const records=matchingRecords(last,slots);const n=Object.keys(records).length;
  progress.max=slots.length||last?.grid.length||24;progress.value=slots.length?n:Object.keys(last?.records??{}).length;
  count.textContent=slots.length?n+'/'+slots.length+' registros compatibles · verifica cada unidad':Object.keys(last?.records??{}).length+' registros locales · abre Crew Roster para comprobarlos';
  grid.replaceChildren();
  for(const s of (slots.length?slots:last?.grid??[])){const cell=document.createElement('span');cell.className=records[s.id]?'sync-done':'sync-pending';cell.textContent=s.id;cell.title=records[s.id]?.reading.name??'Pendiente';grid.append(cell);}
  updateManager(last,!!slots.length&&n===Object.keys(last?.records??{}).length);
 }
 let drawnKey='',drawnAt=0;
 function draw(){
  scaleInfo.textContent='DPI navegador: '+window.devicePixelRatio+' · divisor aplicado: '+scale();const api=window.alt1;if(!overlay.checked||!enabled.checked||!api?.permissionOverlay||!api.overLaySetGroup){clear();drawnKey='';return;}
  const signature=JSON.stringify([scale(),slots.map(s=>[s.id,s.x,s.y,s.w,s.h,!!matchingRecords(last,slots)[s.id]])]);
  if(signature===drawnKey&&performance.now()-drawnAt<2400)return;
  clear();drawnKey=signature;drawnAt=performance.now();
  try{api.overLaySetGroup(GROUP);const records=matchingRecords(last,slots);for(const s of slots){const color=records[s.id]?0xff45cf78:0xff8090b0;const rect=overlayRect({x:s.x-5,y:s.y-5,w:s.w+10,h:s.h+10},scale());api.overLayRect?.(color|0,rect.x,rect.y,rect.w,rect.h,3200,1);}api.overLaySetGroup('');}catch{clear();}
 }
 render();overlay.onchange=()=>{drawnKey='';if(!overlay.checked)clear();else draw();};scaleSelect.onchange=()=>{try{localStorage.setItem('ports-helper.overlay-scale',scaleSelect.value)}catch{};draw();};
 return {enabled,clearOverlay:clear,reset(){previous='';},pause(){previous='';clear();drawnKey='';status.textContent='Captura suspendida · registros conservados';},refresh(next:Slot[]){slots=next;render();draw();},accept(next:Slot[],slot:Slot,rows:ReadRow[]){
  slots=next;if(!enabled.checked){previous='';render();return;}
  const o=observationFromRows(slot,rows);if(!o){previous='';status.textContent='Lectura incompleta: registro anterior conservado.';render();draw();return;}
  const signature=JSON.stringify([next.map(s=>[s.id,s.kind,s.fingerprint]),slot.id,readingSignature(o)]);
  if(previous!==signature){const existing=matchingRecords(last,slots)[slot.id];if(existing&&readingSignature(existing)===readingSignature(o))return;previous=signature;status.textContent='Confirmando lectura en una segunda captura…';render();draw();return;}
  previous='';
  const existing=matchingRecords(last,slots)[slot.id];if(existing&&readingSignature(existing)===readingSignature(o)){status.textContent='Guardado: '+o.reading.name+' · '+slot.id;return;}
  try{const saved=saveVerified(localStorage,next,slot,rows);if(saved){last=saved;status.textContent='Guardado: '+o.reading.name+' · '+slot.id;}}catch(e){status.textContent='No se pudo guardar: '+String(e);}
  render();draw();
 },status};
}
