import {editGrid,editAnchor,editShipHeader,portraitCandidates,assignedCandidates} from '../core/edit-crew-guide';
import {readShip} from '../core/ship-visual-reader';
import {captureGame} from '../alt1/capture';
import {findRosterAnchor} from '../core/roster-anchor';
import {inspectGrid,type Slot} from '../core/crew-grid';
import {overlayRect} from '../core/overlay-coordinates';
import type {Snapshot} from '../core/sync-storage';
export function guideSlots(snapshot:Snapshot,slots:Slot[],ids:string[]):Slot[]{
 if(slots.length!==snapshot.grid.length||!snapshot.grid.every(g=>slots.some(s=>s.id===g.id&&s.kind===g.kind&&s.fingerprint===g.fingerprint)))return [];
 return slots.filter(s=>ids.includes(s.id)&&snapshot.records[s.id]?.fingerprint===s.fingerprint);
}
type Target={ship:number;name:string;equipment:string[];stats:number[]};
export function mountPlanGuide(root:HTMLElement){
 const panel=document.createElement('div');panel.innerHTML='<h3>Preparación guiada</h3><label><input type="checkbox"> Mostrar selección recomendada en Crew Roster / Edit Crew</label><p class="guide-status" role="status"></p><progress value="0" max="6"></progress><p class="guide-count"></p><details><summary>Personajes de la recomendación</summary><div class="guide-units"></div></details><details open><summary>Componentes y estadísticas finales</summary><div class="guide-parts"></div></details><div class="sync-grid"></div>';root.append(panel);
 const check=panel.querySelector('input')!,status=panel.querySelector<HTMLElement>('.guide-status')!,grid=panel.querySelector<HTMLElement>('.sync-grid')!,progress=panel.querySelector('progress')!,count=panel.querySelector<HTMLElement>('.guide-count')!,units=panel.querySelector<HTMLElement>('.guide-units')!,parts=panel.querySelector<HTMLElement>('.guide-parts')!;
 let snapshot:Snapshot|null=null,ids:string[]=[],target:Target|null=null,timer:number|undefined,lastKey='',lastAt=0;
 const group='ports-plan-guide';
 const line=(el:HTMLElement,t:string)=>{const p=document.createElement('p');p.textContent=t;el.append(p);};
 function clear(){try{window.alt1?.overLayClearGroup?.(group);}catch{}lastKey='';}
 function stop(){if(timer!==undefined)window.clearInterval(timer);timer=undefined;clear();window.dispatchEvent(new CustomEvent('ports-plan-guide-active',{detail:false}));}
 function showParts(actual:ReturnType<typeof readShip>|null,totals:(number|null)[]|null){
 if(!target)return;parts.replaceChildren();const labels=['Ram','Deck 1','Deck 2','Rudder','Hull'];const expected=[...target.equipment];const observed=actual?.components??[];
 // Deck slots interchangeable.
 const deckOk=observed[1]!=null&&observed[2]!=null&&[observed[1],observed[2]].sort().join('|')===[expected[1],expected[2]].sort().join('|');
 expected.forEach((n,i)=>line(parts,labels[i]+': '+n+' · '+(observed[i]==null?'Pendiente de lectura':observed[i]===n||((i===1||i===2)&&deckOk)?'Coincide':'Cambiar (actual: '+observed[i]+')')));
 const match=totals?.length===4&&totals.every((n,i)=>n===target!.stats[i]);line(parts,'M/C/S/V esperado: '+target.stats.join(' / '));line(parts,'M/C/S/V observado: '+(totals?.map(n=>n??'?').join(' / ')??'Pendiente'));if(match)line(parts,'Las cuatro estadísticas coinciden. Esto no prueba identidades individuales.');
 }
 function draw(matches:{slot:Slot;color:number}[]){const api=window.alt1;if(!api?.permissionOverlay||!api.overLaySetGroup)return;const setting=localStorage.getItem('ports-helper.overlay-scale')??'auto',scale=setting==='auto'?window.devicePixelRatio||1:Number(setting);const key=JSON.stringify([scale,matches.map(({slot:s,color})=>[s.id,s.x,s.y,s.w,s.h,color])]);if(key===lastKey&&performance.now()-lastAt<2400)return;clear();api.overLaySetGroup(group);for(const {slot:s,color} of matches){const r=overlayRect({x:s.x-5,y:s.y-5,w:s.w+10,h:s.h+10},scale);api.overLayRect?.(color|0,r.x,r.y,r.w,r.h,3200,2);}api.overLaySetGroup('');lastKey=key;lastAt=performance.now();}
 function tick(){try{if(!snapshot||!target)return;const f=captureGame(window.alt1),ea=editAnchor(f),edit=ea?editGrid(f,ea):null;if(edit&&ea){
 const header=editShipHeader(f,ea);if(header.id!==target.ship||header.name!==target.name){clear();progress.value=0;count.textContent='Asignación no comprobada';status.textContent='Barco objetivo '+target.ship+' · '+target.name+'; abierto: '+(header.id??'?')+' · '+(header.name??'no reconocido')+'. Marcos suspendidos.';showParts(null,null);return;}
 const assigned=assignedCandidates(snapshot,edit,ids),remaining=ids.filter(id=>!assigned.some(([i])=>i===id));
 const pending=portraitCandidates(snapshot,edit.filter(s=>!s.id.startsWith('0:')),remaining);
 progress.value=assigned.length;count.textContent=assigned.length+'/'+ids.length+' coincidencias visuales asignadas (no identidades confirmadas) · fila superior: '+edit.filter(s=>s.id.startsWith('0:')).map(s=>s.id+' Nv '+(s.level??'?')).join(', ');
 status.textContent='Barco '+target.ship+' · '+edit.length+' retratos · '+edit.filter(s=>s.level!=null).length+' niveles · '+pending.length+' candidatos pendientes. Azul: asignado compatible; ámbar: disponible compatible.';
 showParts(null,header.totals);draw([...assigned.map(([,slot])=>({slot,color:0xff69a9ef})),...pending.map(slot=>({slot,color:0xffe9a94b}))]);return;
 }
 const a=findRosterAnchor(f);if(a&&a.scale===1){const slots=inspectGrid(f,a),exact=guideSlots(snapshot,slots,ids),provisional=exact.length!==ids.length,matches=provisional?portraitCandidates(snapshot,slots,ids):exact;draw(matches.map(slot=>({slot,color:provisional?0xffe9a94b:0xff45ef78})));status.textContent='Crew Roster · '+matches.length+' candidatos; abre Edit Crew del barco '+target.ship;return;}
 clear();const ship=readShip(f);if(ship?.id===target.ship&&ship.name===target.name&&ship.state==='available'){showParts(ship,ship.totals);status.textContent='Barco objetivo localizado · comprobación de componentes y estadísticas.';}else status.textContent='Abre Edit Crew o la vista del barco objetivo '+target.ship+'.';
 }catch{clear();status.textContent='Lectura temporalmente no disponible.';}}
 check.disabled=true;check.onchange=()=>{stop();if(check.checked&&snapshot){window.dispatchEvent(new CustomEvent('ports-plan-guide-active',{detail:true}));timer=window.setInterval(tick,700);tick();}};
 return {reset(){stop();check.checked=false;check.disabled=true;snapshot=null;target=null;ids=[];grid.replaceChildren();units.replaceChildren();parts.replaceChildren();progress.value=0;count.textContent='';status.textContent='';},set(s:Snapshot,next:string[],t:Target){stop();check.checked=false;check.disabled=false;snapshot=s;ids=next;target=t;progress.max=ids.length;progress.value=0;count.textContent='Pendiente de comprobar asignaciones';grid.replaceChildren();units.replaceChildren();for(const g of s.grid){const cell=document.createElement('span');cell.className=ids.includes(g.id)?'sync-done':'sync-pending';cell.textContent=g.id;grid.append(cell);}for(const id of ids){const r=s.records[id]?.reading;if(r)line(units,r.name+' · Nv '+r.level+' · '+[r.morale,r.combat,r.seafaring,r.speed].join('/'));}showParts(null,null);status.textContent='Barco objetivo '+t.ship+' · '+t.name+'. Activa la guía.';}};
}
