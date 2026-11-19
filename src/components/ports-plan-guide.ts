import {captureGame} from '../alt1/capture';
import {findRosterAnchor} from '../core/roster-anchor';
import {inspectGrid} from '../core/crew-grid';
import {overlayRect} from '../core/overlay-coordinates';
import type {Snapshot} from '../core/sync-storage';
import type {Slot} from '../core/crew-grid';
export function guideSlots(snapshot:Snapshot,slots:Slot[],ids:string[]):Slot[]{
 if(slots.length!==snapshot.grid.length||!snapshot.grid.every(g=>slots.some(s=>s.id===g.id&&s.kind===g.kind&&s.fingerprint===g.fingerprint)))return [];
 return slots.filter(s=>ids.includes(s.id)&&snapshot.records[s.id]?.fingerprint===s.fingerprint);
}
export function mountPlanGuide(root:HTMLElement){
 const panel=document.createElement('div');panel.innerHTML='<label><input type="checkbox"> Mostrar selección recomendada en Crew Roster</label><p class="guide-status"></p><div class="sync-grid"></div>';root.append(panel);
 const check=panel.querySelector('input')!,status=panel.querySelector<HTMLElement>('.guide-status')!,grid=panel.querySelector<HTMLElement>('.sync-grid')!;
 let snapshot:Snapshot|null=null,ids:string[]=[],timer:number|undefined,lastKey='',lastAt=0;
 const group='ports-plan-guide';
 function clear(){try{window.alt1?.overLayClearGroup?.(group);}catch{}lastKey='';}
 function stop(){if(timer!==undefined)window.clearInterval(timer);timer=undefined;clear();window.dispatchEvent(new CustomEvent('ports-plan-guide-active',{detail:false}));}
 function tick(){try{if(!snapshot)return;const f=captureGame(window.alt1),a=findRosterAnchor(f);if(!a||a.scale!==1){clear();status.textContent='Abre Crew Roster a escala 100%. Edit Crew aún no está calibrado.';return;}const slots=inspectGrid(f,a),matches=guideSlots(snapshot,slots,ids);if(matches.length!==ids.length){clear();status.textContent='La cuadrícula cambió. Vuelve a sincronizar y optimizar.';return;}const api=window.alt1;if(!api?.permissionOverlay||!api.overLaySetGroup){status.textContent='Permiso de overlays no disponible.';return;}const setting=localStorage.getItem('ports-helper.overlay-scale')??'auto',scale=setting==='auto'?window.devicePixelRatio||1:Number(setting);const key=JSON.stringify([scale,matches.map(s=>[s.id,s.x,s.y,s.w,s.h])]);if(key!==lastKey||performance.now()-lastAt>2400){clear();api.overLaySetGroup(group);for(const s of matches){const r=overlayRect({x:s.x-5,y:s.y-5,w:s.w+10,h:s.h+10},scale);api.overLayRect?.(0xff45ef78|0,r.x,r.y,r.w,r.h,3200,2);}api.overLaySetGroup('');lastKey=key;lastAt=performance.now();}status.textContent=matches.length+' unidades recomendadas resaltadas. Solo identificación por casilla, no confirma asignaciones.';}catch{clear();status.textContent='No se pudo localizar Crew Roster.';}}
 check.disabled=true;check.onchange=()=>{stop();if(check.checked&&snapshot){window.dispatchEvent(new CustomEvent('ports-plan-guide-active',{detail:true}));timer=window.setInterval(tick,700);tick();}};
 return {reset(){stop();check.checked=false;check.disabled=true;snapshot=null;ids=[];grid.replaceChildren();status.textContent='';},set(s:Snapshot,next:string[]){stop();check.checked=false;check.disabled=false;snapshot=s;ids=next;grid.replaceChildren();for(const g of s.grid){const cell=document.createElement('span');cell.className=ids.includes(g.id)?'sync-done':'sync-pending';cell.textContent=g.id;const r=s.records[g.id]?.reading;cell.title=r?r.name+' · '+[r.morale,r.combat,r.seafaring,r.speed].join('/'):'Sin registro';grid.append(cell);}status.textContent='Verde: unidades recomendadas según Crew Roster. Abre Crew Roster para ver los marcos.';}};
}
