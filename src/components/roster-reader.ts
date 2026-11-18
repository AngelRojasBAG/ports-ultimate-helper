import {isRosterTitle,parseReading,type Reading} from '../core/roster-reader';
type Point={x:number;y:number};
export function mountRosterReader(root:HTMLElement){
 const sec=document.createElement('section');sec.className='assistant';sec.innerHTML='<h2>Sincronizar Crew Roster</h2><p>Abre Crew Roster. Activa el lector y selecciona un tripulante en el juego. No necesitas escribir.</p><button id="reader-start">Activar lector</button><button id="reader-stop" disabled>Detener lector</button><p id="reader-status" role="status"></p><p id="reader-data"></p><button id="reader-confirm" disabled>Confirmar lectura</button><small>Modo experimental: reconocimiento de fuente y posición aún sin validar. Las lecturas no se guardan sin confirmación.</small>';root.append(sec);
 const start=sec.querySelector<HTMLButtonElement>('#reader-start')!,stop=sec.querySelector<HTMLButtonElement>('#reader-stop')!,status=sec.querySelector<HTMLElement>('#reader-status')!,data=sec.querySelector<HTMLElement>('#reader-data')!,confirm=sec.querySelector<HTMLButtonElement>('#reader-confirm')!;
 let timer:number|undefined,anchor:Point|null=null,pending:Reading|null=null;
 const read=(x:number,y:number)=>{const api=window.alt1;if(!api?.bindReadString)return '';for(const f of ['chat','chatmono','xpcounter']){try{const v=api.bindReadString(1,f,Math.round(x),Math.round(y));if(v?.trim())return v.trim()}catch{}}return ''};
 function tick(){try{const api=window.alt1;if(!api?.bindRegion||!api.bindReadString)throw Error('Lectura nativa no disponible.');const w=api.rsWidth??0,h=api.rsHeight??0;if(!api.permissionPixel||w<1||h<1)throw Error('RuneScape no disponible.');if(api.bindRegion(0,0,w,h)<=0)throw Error('No se pudo vincular imagen.');
 // Search around the centered title at reference scale; fallback is intentionally conservative.
 const scale=w/1920;
 const expected={x:w/2,y:h/2-254*scale};
 const offsets=[0,-4,4,-8,8,-12,12,-20,20];
 anchor=null;for(const dy of offsets){for(const dx of offsets){const x=expected.x+dx*scale,y=expected.y+dy*scale;if(isRosterTitle(read(x,y))){anchor={x,y};break}}if(anchor)break}
 if(!anchor){status.textContent='Buscando Crew Roster. Si está abierto, la fuente o posición aún no se reconoce.';pending=null;confirm.disabled=true;return}
 status.textContent='Crew Roster detectado. Selecciona una unidad.';
 const px=(x:number,y:number)=>read(anchor!.x+x*scale,anchor!.y+y*scale);
 const lines=[px(-208,352),px(-265,382),px(-278,406),px(-278,423),px(-140,406),px(-140,423)];
 pending=parseReading(lines);confirm.disabled=!pending;data.textContent=pending?JSON.stringify(pending):'Panel aún no reconocido. No se guardarán valores incompletos.';
 }catch(e){status.textContent=e instanceof Error?e.message:'Error de lectura';pending=null;confirm.disabled=true}}
 start.onclick=()=>{start.disabled=true;stop.disabled=false;tick();timer=window.setInterval(tick,3500)};
 stop.onclick=()=>{window.clearInterval(timer);start.disabled=false;stop.disabled=true;status.textContent='Lector detenido.'};
 confirm.onclick=()=>{if(!pending)return;try{const key='ports-helper.observations.v1';const existing=JSON.parse(localStorage.getItem(key)||'[]');const list=Array.isArray(existing)?existing:[];const signature=JSON.stringify(pending);if(!list.some(x=>JSON.stringify(x.reading)===signature))list.push({reading:pending,observedAt:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(list));status.textContent='Observación guardada. Todavía no identifica unidades duplicadas.'}catch{status.textContent='No se pudo guardar la observación.'}};
}
