import {shipSlots,shipwrights,warehouses,resources,traits} from '../data/mechanics';
import {chance} from '../core/chance';
export function mountMechanics(root:HTMLElement){
 const section=document.createElement('section');root.append(section);
 const h=document.createElement('h2');h.textContent='Mecánicas y mejoras';section.append(h);
 function group(title:string,rows:string[],url:string){const d=document.createElement('details');const s=document.createElement('summary');s.textContent=title;d.append(s);for(const row of rows){const p=document.createElement('p');p.textContent=row;d.append(p)}const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent='Fuente: RuneScape Wiki';d.append(a);section.append(d)}
 group('Componentes: 5 ranuras',shipSlots.map(x=>x.name+' · '+x.stats).concat('Las mejoras desbloqueadas se pueden reutilizar en todos los barcos y ambas ranuras de cubierta.'),'https://runescape.wiki/w/Player-owned_port');
 group('Shipwright (10 variantes)',shipwrights.map(([name,...stats])=>name+' · M/C/S/V: '+stats.join('% / ')+'%'),'https://runescape.wiki/w/Player-owned_port/Buildings');
 group('Warehouse (9 variantes)',warehouses.map(w=>w.name+' · Chimes '+w.chimes+'% · '+resources.map((r,i)=>w.bonuses[i]?r+' '+w.bonuses[i]+'%':'').filter(Boolean).join(' / ')),'https://runescape.wiki/w/Player-owned_port/Buildings');
 group('Traits (catálogo parcial)',traits.map(([n,e])=>n+' · '+e),'https://runescape.wiki/w/Player-owned_port/Captains_and_crew');
 const calc=document.createElement('section');root.append(calc);calc.innerHTML='<h2>Probabilidad de expedición</h2><p>Introduce los totales finales del barco y los requisitos. No añade bonificaciones. Deja en 0 los requisitos que no apliquen.</p><form>'+['Morale','Combat','Seafaring'].map((n,i)=>'<label>'+n+' — Total<input name="t'+i+'" type="number" min="0" value="0" required></label><label>'+n+' — Requisito<input name="r'+i+'" type="number" min="0" value="0" required></label>').join('')+'<button>Calcular</button></form><p role="status"></p>';
 const form=calc.querySelector('form')!;const result=calc.querySelector<HTMLParagraphElement>('[role=status]')!;form.onsubmit=e=>{e.preventDefault();const f=new FormData(form);try{const value=chance([0,1,2].map(i=>Number(f.get('t'+i))),[0,1,2].map(i=>Number(f.get('r'+i))));result.textContent=value===null?'Introduce algún requisito.':'Probabilidad matemática: '+value.toFixed(2)+'% (redondeo visual del juego pendiente de validar).'}catch{result.textContent='Datos inválidos.'}};
}
