import {captureGame} from '../alt1/capture';
import {loadSettings} from '../core/storage';
import {componentNames,shipStats,readShips,saveShip,type ShipRecord} from '../core/ship-records';
export function mountShips(root:HTMLElement){
 const panel=document.createElement('section');
 panel.innerHTML='<h2>Barcos</h2><p class="ship-summary"></p><div class="ship-tabs"></div><details><summary>Ficha del barco</summary><form><label>Nombre (opcional)<input name="name" maxlength="100"></label>'+componentNames.map((n,i)=>'<label>'+n+'<input name="part'+i+'" maxlength="120" placeholder="Sin identificar"></label>').join('')+'<p>Totales visibles en el juego (incluyen tripulación y bonos). No son estadísticas base del barco.</p><div class="ship-stats">'+shipStats.map((n,i)=>'<label>'+n+'<input name="stat'+i+'" type="number" min="0" step="1" required></label>').join('')+'</div><button type="submit">Guardar ficha manual</button></form></details><div class="ship-card"></div><details><summary>Captura de pantalla · configuración del lector</summary><p>Abre la pantalla de configuración de barcos, selecciona uno y captura la ventana del juego. La captura no guarda información ni ejecuta acciones.</p><button class="ship-capture">Capturar pantalla del barco</button><canvas class="ship-preview" hidden></canvas><button class="ship-download" disabled>Exportar captura PNG</button><p class="ship-capture-status"></p></details><p class="ship-status" role="status"></p>';
 root.append(panel);
 const tabs=panel.querySelector<HTMLElement>('.ship-tabs')!,summary=panel.querySelector<HTMLElement>('.ship-summary')!,form=panel.querySelector('form')!,card=panel.querySelector<HTMLElement>('.ship-card')!,status=panel.querySelector<HTMLElement>('.ship-status')!,canvas=panel.querySelector<HTMLCanvasElement>('canvas')!,download=panel.querySelector<HTMLButtonElement>('.ship-download')!,captureStatus=panel.querySelector<HTMLElement>('.ship-capture-status')!;
 let selected=1,records=readShips(localStorage);
 const field=(name:string)=>form.elements.namedItem(name) as HTMLInputElement;
 function render(){
 const count=loadSettings().ships;if(selected>count)selected=1;
 summary.textContent=records.filter(s=>s.id<=count).length+'/'+count+' fichas manuales registradas · lector automático pendiente';
 tabs.replaceChildren();for(let i=1;i<=count;i++){const b=document.createElement('button');b.type='button';b.textContent='Barco '+i;b.setAttribute('aria-pressed',String(i===selected));b.onclick=()=>{selected=i;render()};tabs.append(b);}
 const s=records.find(s=>s.id===selected);field('name').value=s?.name??'';componentNames.forEach((_,i)=>field('part'+i).value=s?.components[i]??'');shipStats.forEach((_,i)=>field('stat'+i).value=s?String(s.totals[i]):'');
 card.replaceChildren();
 if(!s){card.textContent='Barco '+selected+' · sin ficha registrada';return;}
 const title=document.createElement('strong');title.textContent=s.name||'Barco '+selected;card.append(title);
 for(const [i,n] of componentNames.entries()){const line=document.createElement('p');line.textContent=n+': '+(s.components[i]||'Sin identificar');card.append(line);}
 const stats=document.createElement('p');stats.textContent=shipStats.map((n,i)=>n+' '+s.totals[i]).join(' · ');card.append(stats);
 const meta=document.createElement('small');meta.textContent='Fuente manual · '+new Date(s.observedAt).toLocaleString();card.append(meta);
 }
 form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;try{const ship:ShipRecord={id:selected,name:field('name').value.trim(),components:componentNames.map((_,i)=>field('part'+i).value.trim()),totals:shipStats.map((_,i)=>field('stat'+i).valueAsNumber),source:'manual',observedAt:new Date().toISOString()};records=saveShip(localStorage,ship);render();status.textContent='Ficha guardada.';}catch(err){status.textContent=String(err)}};
 panel.querySelector<HTMLButtonElement>('.ship-capture')!.onclick=()=>{try{const frame=captureGame(window.alt1);canvas.width=frame.width;canvas.height=frame.height;canvas.getContext('2d')!.putImageData(frame,0,0);canvas.hidden=false;download.disabled=false;captureStatus.textContent=frame.width+' × '+frame.height+' · captura de juego sin OCR';}catch(err){canvas.hidden=true;download.disabled=true;captureStatus.textContent=String(err)}};
 download.onclick=()=>{canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ports-barco-'+selected+'.png';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');};
 window.addEventListener('ports-settings-changed',render);render();
}
