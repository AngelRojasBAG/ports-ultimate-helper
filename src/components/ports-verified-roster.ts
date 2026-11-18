import type {Slot} from '../core/crew-grid';
import {readVerified,matchingRecords,saveVerified,observationFromRows,readingSignature,type ReadRow} from '../core/verified-roster';
import type {Snapshot} from '../core/sync-storage';
const GROUP='ports-verified-roster';
export function mountVerifiedRoster(sec:HTMLElement){
 const panel=document.createElement('div');panel.className='verified-roster';
 panel.innerHTML='<label><input type="checkbox" class="sync-enabled"> Sincronizar automáticamente</label><label><input type="checkbox" class="sync-overlay"> Mostrar marcos en el juego</label><p class="sync-status" role="status">Sincronización desactivada.</p><progress max="24" value="0"></progress><p class="sync-count"></p><div class="sync-grid"></div><details><summary>Tripulación guardada</summary><div class="sync-list"></div></details>';
 sec.prepend(panel);
 const enabled=panel.querySelector<HTMLInputElement>('.sync-enabled')!,overlay=panel.querySelector<HTMLInputElement>('.sync-overlay')!,status=panel.querySelector<HTMLElement>('.sync-status')!,count=panel.querySelector<HTMLElement>('.sync-count')!,grid=panel.querySelector<HTMLElement>('.sync-grid')!,list=panel.querySelector<HTMLElement>('.sync-list')!,progress=panel.querySelector<HTMLProgressElement>('progress')!;
 let previous='',slots:Slot[]=[],last:Snapshot|null=readVerified(localStorage);
 const clear=()=>{try{window.alt1?.overLayClearGroup?.(GROUP)}catch{}};
 function render(){
  const records=matchingRecords(last,slots);const n=Object.keys(records).length;
  progress.max=slots.length||24;progress.value=n;
  count.textContent=slots.length?n+'/'+slots.length+' registros compatibles · verifica cada unidad':'Abre Crew Roster para comprobar el registro guardado.';
  grid.replaceChildren();
  for(const s of slots){const cell=document.createElement('span');cell.className=records[s.id]?'sync-done':'sync-pending';cell.textContent=s.id;cell.title=records[s.id]?.reading.name??'Pendiente';grid.append(cell);}
  list.replaceChildren();
  for(const [id,o] of Object.entries(last?.records??{})){const item=document.createElement('p');item.textContent=id+' · '+o.reading.name+' · Lv '+o.reading.level+' · '+[o.reading.morale,o.reading.combat,o.reading.seafaring,o.reading.speed].join('/')+' · '+(o.details?.traitsText??'')+' · barco '+(o.details?.assignedShip??'-');list.append(item);}
 }
 function draw(){
  clear();const api=window.alt1;if(!overlay.checked||!enabled.checked||!api?.permissionOverlay||!api.overLaySetGroup)return;
  try{api.overLaySetGroup(GROUP);const records=matchingRecords(last,slots);for(const s of slots){const color=records[s.id]?0xff45cf78:0xffdeb56b;api.overLayRect?.(color|0,s.x,s.y,s.w,s.h,1500,1);}api.overLaySetGroup('');}catch{clear();}
 }
 render();overlay.onchange=()=>{if(!overlay.checked)clear();};
 return {enabled,reset(){previous='';clear();},pause(){previous='';slots=[];clear();render();},refresh(next:Slot[]){slots=next;render();draw();},accept(next:Slot[],slot:Slot,rows:ReadRow[]){
  slots=next;if(!enabled.checked){previous='';render();return;}
  const o=observationFromRows(slot,rows);if(!o){previous='';status.textContent='Lectura incompleta: registro anterior conservado.';render();draw();return;}
  const signature=JSON.stringify([next.map(s=>[s.id,s.kind,s.fingerprint]),slot.id,readingSignature(o)]);
  if(previous!==signature){previous=signature;status.textContent='Confirmando lectura en una segunda captura…';render();draw();return;}
  previous='';
  try{const saved=saveVerified(localStorage,next,slot,rows);if(saved){last=saved;status.textContent='Guardado: '+o.reading.name+' · '+slot.id;}}catch(e){status.textContent='No se pudo guardar: '+String(e);}
  render();draw();
 },status};
}
