import {captureGame} from '../alt1/capture';
import {findRosterAnchor} from '../core/roster-anchor';
import {parseReading,type Reading} from '../core/roster-reader';

export function mountRosterReader(root:HTMLElement){
 const sec=document.createElement('section');sec.className='assistant';sec.innerHTML='<h2>Sincronizar Crew Roster</h2><p>Abre Crew Roster. Activa el lector y selecciona un tripulante en el juego. No necesitas escribir.</p><button id="reader-start">Activar lector</button><button id="reader-stop" disabled>Detener lector</button><p id="reader-status" role="status"></p><p id="reader-data"></p><button id="reader-confirm" disabled>Confirmar lectura</button><small>Modo experimental: reconocimiento de fuente y posición aún sin validar. Las lecturas no se guardan sin confirmación.</small>';root.append(sec);
 const start=sec.querySelector<HTMLButtonElement>('#reader-start')!,stop=sec.querySelector<HTMLButtonElement>('#reader-stop')!,status=sec.querySelector<HTMLElement>('#reader-status')!,data=sec.querySelector<HTMLElement>('#reader-data')!,confirm=sec.querySelector<HTMLButtonElement>('#reader-confirm')!;
 let timer:number|undefined,pending:Reading|null=null;
 const read=(x:number,y:number)=>{const api=window.alt1;if(!api?.bindReadString)return '';for(const f of ['chat','chatmono','xpcounter']){try{const v=api.bindReadString(1,f,Math.round(x),Math.round(y));if(v?.trim())return v.trim()}catch{}}return ''};
 function tick(){pending=null;confirm.disabled=true;data.textContent='';try{const api=window.alt1;if(!api)throw Error('Alt1 no disponible.');const w=api.rsWidth??0,h=api.rsHeight??0;if(!api.permissionPixel||w<1||h<1)throw Error('RuneScape no disponible.');const anchor=findRosterAnchor(captureGame(api));
 if(!anchor){status.textContent='Crew Roster no detectado visualmente. Comprueba que el encabezado esté visible.';return}
 status.textContent='Crew Roster detectado visualmente ('+Math.round(anchor.score*100)+'% de coincidencia).';
 if(!api.bindRegion||!api.bindReadString||api.bindRegion(0,0,w,h)<=0){data.textContent='Ventana detectada; OCR nativo no disponible.';return}
 const scale=anchor.scale;
 const px=(x:number,y:number)=>read(anchor.x+x*scale,anchor.y+y*scale);
 const lines=[px(-208,352),px(-265,382),px(-278,406),px(-278,423),px(-140,406),px(-140,423)];
 pending=parseReading(lines);confirm.disabled=!pending;data.textContent=pending?JSON.stringify(pending):'Estadísticas aún no reconocidas. OCR: '+lines.map(x=>x||'—').join(' | ')+'';
 }catch(e){status.textContent=e instanceof Error?e.message:'Error de lectura';pending=null;confirm.disabled=true}}
 start.onclick=()=>{start.disabled=true;stop.disabled=false;tick();timer=window.setInterval(tick,3500)};
 stop.onclick=()=>{window.clearInterval(timer);pending=null;confirm.disabled=true;start.disabled=false;stop.disabled=true;status.textContent='Lector detenido.'};
 confirm.onclick=()=>{if(!pending)return;try{const key='ports-helper.observations.v1';const existing=JSON.parse(localStorage.getItem(key)||'[]');const list=Array.isArray(existing)?existing:[];const signature=JSON.stringify(pending);if(!list.some(x=>JSON.stringify(x.reading)===signature))list.push({reading:pending,observedAt:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(list));status.textContent='Observación guardada. Todavía no identifica unidades duplicadas.'}catch{status.textContent='No se pudo guardar la observación.'}};
}
