import type {Snapshot} from '../core/sync-storage';
import {validObservation} from '../core/sync-storage';
export function mountRosterManager(root:HTMLElement){
 const box=document.createElement('div');box.className='roster-manager';
 box.innerHTML='<p class="roster-summary"></p><input class="roster-search" placeholder="Buscar nombre o trait"><div class="roster-filters"><select class="roster-kind" aria-label="Tipo"><option value="">Todos</option><option value="crew">Tripulantes</option><option value="captain">Capitanes</option></select><select class="roster-ship" aria-label="Barco"><option value="">Todos los barcos</option><option value="-">Sin asignar</option><option>1</option><option>2</option><option>3</option><option>4</option></select></div><select class="roster-sort" aria-label="Orden"><option value="slot">Orden de casilla</option><option value="name">Nombre</option><option value="level">Nivel ↓</option><option value="morale">Morale ↓</option><option value="combat">Combat ↓</option><option value="seafaring">Seafaring ↓</option><option value="speed">Speed ↓</option></select><div class="roster-cards"></div><button class="roster-export">Exportar respaldo JSON</button>';
 root.append(box);
 const search=box.querySelector<HTMLInputElement>('.roster-search')!,kind=box.querySelector<HTMLSelectElement>('.roster-kind')!,ship=box.querySelector<HTMLSelectElement>('.roster-ship')!,sort=box.querySelector<HTMLSelectElement>('.roster-sort')!,cards=box.querySelector<HTMLElement>('.roster-cards')!,summary=box.querySelector<HTMLElement>('.roster-summary')!,exportButton=box.querySelector<HTMLButtonElement>('.roster-export')!;
 let saved:Snapshot|null=null,compatible=false,renderKey='';
 function render(){
 const all=Object.entries(saved?.records??{}).filter(([,o])=>validObservation(o));
 const q=search.value.trim().toLowerCase();
 const filtered=all.filter(([,o])=>(!kind.value||o.kind===kind.value)&&(!ship.value||String(o.details?.assignedShip??'-')===ship.value)&&[o.reading.name,o.details?.traitsText,o.details?.personality].join(' ').toLowerCase().includes(q));
 const order=sort.value;
 filtered.sort((a,b)=>{if(order==='slot')return a[0].localeCompare(b[0],undefined,{numeric:true});if(order==='name')return a[1].reading.name.localeCompare(b[1].reading.name);const k=order as 'level'|'morale'|'combat'|'seafaring'|'speed';return b[1].reading[k]-a[1].reading[k]||a[0].localeCompare(b[0]);});
 summary.textContent=filtered.length+'/'+all.length+' unidades · '+all.filter(([,o])=>o.kind==='captain').length+' capitanes · '+(compatible?'Cuadrícula compatible':'Último registro local, pendiente de comprobar');
 cards.replaceChildren();
 for(const [id,o] of filtered){const card=document.createElement('article');card.className='roster-card';const title=document.createElement('strong');title.textContent=o.reading.name;const meta=document.createElement('small');meta.textContent=id+' · '+(o.kind==='captain'?'Capitán':'Tripulante')+' · Nv '+o.reading.level+' · Barco '+(o.details?.assignedShip??'-');const stats=document.createElement('div');stats.className='roster-stats';for(const [label,key] of [['M','morale'],['C','combat'],['S','seafaring'],['V','speed']] as const){const cell=document.createElement('span');cell.textContent=label+' '+o.reading[key];stats.append(cell);}const traits=document.createElement('small');traits.textContent=[o.details?.traitsText,o.details?.personality].filter(Boolean).join(' · ');card.append(title,meta,stats,traits);cards.append(card);}
 exportButton.disabled=!all.length;
 }
 for(const input of [search,kind,ship,sort])input.addEventListener('input',render);
 exportButton.onclick=()=>{if(!saved)return;const url=URL.createObjectURL(new Blob([JSON.stringify(saved,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ports-tripulacion-'+new Date().toISOString().slice(0,10)+'.json';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return (next:Snapshot|null,verified:boolean)=>{const key=JSON.stringify([next,verified]);if(key===renderKey)return;renderKey=key;saved=next;compatible=verified;render();};
}
