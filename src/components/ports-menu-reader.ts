import {captureGame} from '../alt1/capture';
import {readPartMenu,readVoyageList} from '../core/ports-menu-reader';
export function mountMenuReader(root:HTMLElement){
 const sec=document.createElement('section');sec.innerHTML='<h2>Leer mejoras y expediciones</h2><p>Abre un menú de piezas o Voyage List. Lectura experimental, sin guardar ni modificar el juego.</p><button class="menu-read">Leer panel actual</button><pre class="menu-result" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre><button class="menu-copy" disabled>Copiar diagnóstico</button>';root.append(sec);
 const out=sec.querySelector<HTMLElement>('.menu-result')!,copy=sec.querySelector<HTMLButtonElement>('.menu-copy')!;
 sec.querySelector<HTMLButtonElement>('.menu-read')!.onclick=()=>{try{const f=captureGame(window.alt1);const result=readPartMenu(f)??readVoyageList(f);out.textContent=result?JSON.stringify(result,null,2):'Panel no identificado. La escala de las nuevas capturas puede diferir de la captura nativa de Alt1.';}catch(e){out.textContent=String(e)}copy.disabled=false;};
 copy.onclick=()=>void navigator.clipboard.writeText(out.textContent??'').catch(()=>{const ta=document.createElement('textarea');ta.value=out.textContent??'';out.after(ta);ta.select();});
}
