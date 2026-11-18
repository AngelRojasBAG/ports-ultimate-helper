import {readShips} from '../core/ship-records';
import {equipmentStats,observedUnlocks,rankCurrentShips} from '../core/ship-planner';
import {parts,partSources} from '../data/ship-parts';
export function mountShipPlanner(root:HTMLElement){
 const sec=document.createElement('section');sec.innerHTML='<h2>Planificador de expediciones</h2><p>Compara configuraciones guardadas. No reasigna tripulantes ni estima bonos desconocidos.</p><button class="planner-refresh">Actualizar datos locales</button><div class="planner-parts"></div><form><p>Requisitos numéricos de la expedición (0 si no aplica).</p>'+['Morale','Combat','Seafaring'].map((n,i)=>'<label>'+n+'<input name="r'+i+'" type="number" min="0" step="1" value="0" required></label>').join('')+'<button>Comparar barcos disponibles</button></form><div class="planner-result" role="status"></div><details><summary>Catálogo de piezas de referencia</summary><div class="planner-catalog"></div></details>';root.append(sec);
 const list=sec.querySelector<HTMLElement>('.planner-parts')!,out=sec.querySelector<HTMLElement>('.planner-result')!,cat=sec.querySelector<HTMLElement>('.planner-catalog')!,form=sec.querySelector('form')!;
 function line(parent:HTMLElement,text:string){const p=document.createElement('p');p.textContent=text;parent.append(p);}
 function refresh(){const ships=readShips(localStorage);list.replaceChildren();cat.replaceChildren();
 const unlocked=observedUnlocks(ships);line(list,unlocked.length+' piezas confirmadas por equipamiento observado; otras piezas pueden estar desbloqueadas.');
 for(const s of ships){const stats=s.componentsVerified?equipmentStats(s.components):null;line(list,'Barco '+s.id+' · '+(stats?'Aporte de piezas M/C/S/V: '+stats.join(' / '):'Piezas sin verificar o fuera del catálogo'));}
 for(const p of parts)line(cat,p.name+' · '+p.stats.join(' / ')+' · '+(unlocked.includes(p)?'Observada':'Sin confirmar'));
 for(const url of partSources){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent=new URL(url).hostname;cat.append(a,document.createElement('br'));}
 out.textContent='Introduce los requisitos para comparar las últimas lecturas.';
 }
 sec.querySelector<HTMLButtonElement>('.planner-refresh')!.onclick=refresh;
 form.onsubmit=e=>{e.preventDefault();out.replaceChildren();try{const fd=new FormData(form),req=[0,1,2].map(i=>Number(fd.get('r'+i)));if(!req.some(n=>n>0)){line(out,'Introduce al menos un requisito.');return;}const ranked=rankCurrentShips(readShips(localStorage),req);if(!ranked.length){line(out,'No hay barcos disponibles con lectura visual guardada.');return;}for(const {ship,success} of ranked)line(out,ship.name+' · '+success.toFixed(2)+'% estimado · Speed '+ship.totals[3]+' · lectura '+new Date(ship.observedAt).toLocaleString());line(out,'La disponibilidad es la última observada, no un estado en tiempo real. Comprueba el resultado en el juego.');}catch{line(out,'Requisitos inválidos.')}};
 refresh();
}
