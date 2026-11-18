import {traitRows,saveTraitSamples,loadTraitSamples,alignTrait,trainFullTraits} from '../core/ports-trait-dual';
import {knownTraits} from '../core/unit-details';
import {captureGame} from '../alt1/capture';
import {findRosterAnchor} from '../core/roster-anchor';
import {inspectGrid,selectedSlot} from '../core/crew-grid';
import {extractMask,type Mask} from '../core/ports-text-patterns';
import {splitGlyphs} from '../core/ports-glyph-font';
import {fullTraitRow} from '../core/ports-full-traits';

import {combinedFonts,learnedGlyphs,saveEntry,labelMask,families,type Family} from '../core/ports-glyph-registry';
import {loadSamples} from './ports-unified-reader';
export function mountGlyphTrainer(root:HTMLElement){
 const sec=document.createElement('section');sec.innerHTML='<h2>Fuentes · Calibración individual</h2><p>Enseña solo los símbolos desconocidos. Revisa el recorte y el carácter antes de guardar.</p><button id="glyph-scan">Detectar caracteres faltantes</button><p role="status"></p><div class="glyph-tasks"></div><button id="glyph-view">Ver fuentes aprendidas</button><div class="glyph-library"></div>';root.append(sec);
 const status=sec.querySelector<HTMLElement>('[role=status]')!,tasks=sec.querySelector<HTMLElement>('.glyph-tasks')!,library=sec.querySelector<HTMLElement>('.glyph-library')!;
 function image(mask:Mask){
  const canvas=document.createElement('canvas');canvas.width=mask.w;canvas.height=mask.h;canvas.className='glyph-pixels';
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#222';ctx.fillRect(0,0,mask.w,mask.h);ctx.fillStyle='#fff';
  for(let i=0;i<mask.bits.length;i++)if(mask.bits[i]==='1')ctx.fillRect(i%mask.w,Math.floor(i/mask.w),1,1);
  canvas.style.width=Math.min(400,mask.w*5)+'px';canvas.style.height='auto';return canvas;
 }
 sec.querySelector<HTMLButtonElement>('#glyph-view')!.onclick=()=>{
  try{library.replaceChildren();const fonts=combinedFonts(loadSamples());
   for(const f of families){const d=document.createElement('details');const summary=document.createElement('summary');summary.textContent=f+' · '+new Set(fonts[f].map(g=>g.chr)).size+' símbolos · '+fonts[f].length+' variantes';d.append(summary);
    const grid=document.createElement('div');grid.className='glyph-grid';for(const g of fonts[f]){const card=document.createElement('div');card.append(image(g.mask),document.createTextNode(g.chr));grid.append(card)}d.append(grid);library.append(d);}
  }catch(e){status.textContent=String(e)}
 };
 sec.querySelector<HTMLButtonElement>('#glyph-scan')!.onclick=()=>{
  tasks.replaceChildren();
  try{
   const samples=loadSamples(),fonts=combinedFonts(samples),frame=captureGame(window.alt1),a=findRosterAnchor(frame);
   if(!a||a.scale!==1)throw Error('Abre Crew Roster al 100%.');
   const slot=selectedSlot(inspectGrid(frame,a));if(!slot)throw Error('Selecciona una unidad inequívoca.');
   const regions=[['title',-350,338,330,23],['level',-315,361,115,30],['ship',-382,338,24,20],['details',-315,436,270,47]] as const;
   let missing=0,unsegmented=0;
   for(const [f,dx,dy,w,h] of regions){
    const mask=extractMask(frame,a.x+dx,a.y+dy,w,h,f);if(!mask){unsegmented++;continue;}
    if(f==='details'){const block=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Traits · vista completa (sin calibración individual)';block.append(summary);const row=fullTraitRow(mask);const msg=document.createElement('p');msg.textContent='Fragmentos de 7 px desactivados. Vista del primer renglón completo, incluyendo ascendentes y descendentes.';block.append(msg,image(row??mask));for(const threshold of [90,110,130,150]){const variant=extractMask(frame,a.x+dx,a.y+dy,w,h,f,threshold);if(!variant)continue;const caption=document.createElement('p');caption.textContent='Umbral '+threshold+' · diagnóstico';block.append(caption,image(fullTraitRow(variant)??variant));}if(slot.kind==='crew'){
      const rows=traitRows(frame,a.x+dx,a.y+dy,w,h);
      const select=document.createElement('select');const empty=document.createElement('option');empty.value='';empty.textContent='Seleccionar trait visible';select.append(empty);
      for(const trait of knownTraits){const opt=document.createElement('option');opt.value=trait;opt.textContent=trait;select.append(opt);}
      const preview=document.createElement('div'),save=document.createElement('button');save.textContent='Registrar línea 90/110';save.disabled=true;
      select.onchange=()=>{preview.replaceChildren();let ok=false;for(const row of rows){const parts=row.mask?alignTrait(select.value,row.mask):null;const p=document.createElement('p');p.textContent=row.threshold+': '+(parts?'Alineación por caracteres':'No segmentable');preview.append(p);if(parts){ok=true;const grid=document.createElement('div');grid.className='glyph-grid';for(const part of parts){const card=document.createElement('div');card.append(image(part.mask),document.createTextNode(part.chr));grid.append(card);}preview.append(grid);}}save.disabled=!ok;};
      save.onclick=()=>{try{const accepted=saveTraitSamples(select.value,rows);status.textContent='Patrones completos guardados: '+accepted.join(', ')+' · '+loadTraitSamples().length+' muestras.';save.disabled=true;}catch(e){status.textContent=String(e)}};
      const info=document.createElement('p');info.textContent='Fuentes nuevas: '+[90,110].map(n=>n+': '+new Set(trainFullTraits(loadTraitSamples(),n as 90|110).map(g=>g.chr)).size+' símbolos').join(' / ')+'. Revisa cada letra antes de guardar.';
      block.append(info,select,preview,save);
     }tasks.append(block);continue;}
    const lines=[splitGlyphs(f,mask)];if(!lines[0].length)unsegmented++;
    const block=document.createElement('details');block.open=true;const summary=document.createElement('summary');summary.textContent=f;block.append(summary);
    for(const [lineNo,parts] of lines.entries()){
     const caption=document.createElement('p');caption.textContent='Línea '+(lineNo+1)+' · '+(parts.map(p=>labelMask(p.mask,fonts[f])??'?').join('')||'Sin segmentar');block.append(caption,image(mask));
     parts.forEach((part,index)=>{
      if(labelMask(part.mask,fonts[f])!==null)return;
      missing++;
      const row=document.createElement('div');row.className='glyph-task';
      const label=document.createElement('small');label.textContent='Posición '+(index+1)+' · '+part.mask.w+'×'+part.mask.h;
      const input=document.createElement('input');input.maxLength=1;input.placeholder='?';input.setAttribute('aria-label','Carácter '+(index+1));
      const save=document.createElement('button');save.textContent='Guardar';
      save.onclick=()=>{try{const chr=f==='title'?input.value.toUpperCase():input.value;saveEntry({family:f,chr,mask:part.mask},learnedGlyphs(samples,f));input.disabled=true;save.disabled=true;save.textContent='Guardado';}catch(e){status.textContent=String(e)}};
      row.append(label,image(part.mask),input,save);block.append(row);
     });
    }
    tasks.append(block);
   }
   status.textContent='Casilla '+slot.id+' · '+missing+' fragmentos desconocidos · '+unsegmented+' campos sin segmentar. No guardes fragmentos unidos o incompletos.';
  }catch(e){status.textContent=String(e)}
 };
}
