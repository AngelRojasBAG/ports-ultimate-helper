import {captureGame} from '../alt1/capture';
import {selectedMasks,matchReading,numericPanel} from '../core/edit-panel-reader';
import {readVerified} from '../core/verified-roster';
import {loadAlt1OCR} from './alt1-ocr-lab';
import type {Mask} from '../core/ports-text-patterns';
function image(m:Mask){const im=new ImageData(m.w+20,m.h+20);for(let i=3;i<im.data.length;i+=4)im.data[i]=255;for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.bits[y*m.w+x]==='1'){const i=((y+10)*im.width+x+10)*4;im.data[i]=im.data[i+1]=im.data[i+2]=255;}return im;}
export async function readMaskText(m:Mask|null,accept:(t:string)=>boolean){
 if(!m)return null;const {ocr,fonts}=await loadAlt1OCR(),im=image(m),votes=new Map<string,Set<string>>();
 for(const {name,font} of fonts){if(Math.abs(font.height-m.h)>4)continue;try{const t=ocr.findReadLine(im,font,[[255,255,255]],8,8,m.w+4,m.h+4).text.trim().toUpperCase();if(accept(t)){const set=votes.get(t)??new Set<string>();set.add(name);votes.set(t,set);}}catch{}}
 const ranked=[...votes].sort((a,b)=>b[1].size-a[1].size);return ranked.length&&ranked[0][1].size>=2&&ranked[0][1].size>(ranked[1]?.[1].size??0)?ranked[0][0]:null;
}
export function mountEditPanel(root:HTMLElement){
 const sec=document.createElement('section');sec.innerHTML='<h2>Identificar Selected / Compare</h2><p>Selecciona o compara un personaje en Edit Crew. Diagnóstico experimental de solo lectura.</p><button>Leer panel derecho</button><div role="status"></div><details><summary>Máscaras de diagnóstico</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere"></pre></details>';root.append(sec);
 const btn=sec.querySelector('button')!,out=sec.querySelector<HTMLElement>('[role=status]')!,debug=sec.querySelector('pre')!;
 btn.onclick=async()=>{btn.disabled=true;out.replaceChildren();try{const snapshot=readVerified(localStorage),m=selectedMasks(captureGame(window.alt1));if(!snapshot||!m)throw Error('Abre Edit Crew y sincroniza la tripulación primero.');debug.textContent=JSON.stringify(m,null,2);for(const [label,section] of Object.entries(m)){const name=await readMaskText(section.name,t=>Object.values(snapshot.records).some(o=>o.reading.name.toUpperCase()===t));const stats=await Promise.all(section.stats.map(async q=>numericPanel(q)??(await readMaskText(q,t=>/^-?\d{1,5}$/.test(t))!==null?Number(await readMaskText(q,t=>/^-?\d{1,5}$/.test(t))):null)));const ids=matchReading(snapshot,name,stats);const line=document.createElement('p');line.textContent=label+': '+(name??'Nombre pendiente')+' · '+stats.map(n=>n??'?').join('/')+' · '+(ids.length===1?'Coincidencia de nombre y estadísticas: '+ids[0]:ids.length?'Ambiguo: '+ids.join(', '):'Sin confirmar');out.append(line);}}catch(e){out.textContent=String(e)}finally{btn.disabled=false}};
}
