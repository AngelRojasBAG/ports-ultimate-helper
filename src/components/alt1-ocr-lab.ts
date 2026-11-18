import {captureGame} from '../alt1/capture';
import {findRosterAnchor,type RosterAnchor} from '../core/roster-anchor';
type Color=[number,number,number];
type Font={width:number;height:number;basey:number;spacewidth:number;chars:unknown[]};
type Engine={findReadLine:(buffer:ImageData,font:Font,colors:Color[],x:number,y:number,w:number,h:number)=>{text:string}};
type Globals=Window&{OCR?:Engine;Alt1Fonts?:Record<string,unknown>};
const g=window as Globals;
const folder=new URL('./alt1-ocr/',location.href);
function script(file:string){return new Promise<void>((resolve,reject)=>{const el=document.createElement('script');el.src=new URL(file,folder).href;el.onload=()=>resolve();el.onerror=()=>reject(Error('No se pudo cargar '+file));document.head.append(el)})}
let loading:Promise<{ocr:Engine;fonts:{name:string;font:Font}[]}>|undefined;
function load(){return loading??=(async()=>{await script('base.js');await script('ocr.js');if(!g.OCR?.findReadLine)throw Error('OCR de Alt1 no disponible');const res=await fetch(new URL('fonts.json',folder));if(!res.ok)throw Error('No se pudo cargar el catálogo de fuentes');const list=await res.json() as {name:string;file:string}[];const fonts:{name:string;font:Font}[]=[];for(const f of list){await script(f.file);let obj:unknown=g.Alt1Fonts;for(const part of f.name.split('/'))obj=(obj as Record<string,unknown>|undefined)?.[part];const font=obj as Font;if(font?.chars?.length&&font.width>0)fonts.push({name:f.name,font});}if(!fonts.length)throw Error('No se pudieron inicializar las fuentes');return {ocr:g.OCR,fonts};})().catch(e=>{loading=undefined;throw e})}
const regions=[
 {name:'Nombre',dx:-350,dy:338,w:330,h:23,palette:'gold'},
 {name:'Nivel',dx:-315,dy:361,w:115,h:30,palette:'white'},
 {name:'Morale',dx:-315,dy:392,w:135,h:22,palette:'mixed'},
 {name:'Seafaring',dx:-180,dy:392,w:135,h:22,palette:'mixed'},
 {name:'Combat',dx:-315,dy:414,w:135,h:22,palette:'mixed'},
 {name:'Speed',dx:-180,dy:414,w:135,h:22,palette:'mixed'},
 {name:'Traits / personalidad',dx:-315,dy:436,w:270,h:58,palette:'white'},
 {name:'Barco',dx:-382,dy:338,w:24,h:20,palette:'white'}
];
const gold:Color[]=[[255,215,140],[240,200,130],[238,187,115]];
const white:Color[]=[[255,255,255],[220,220,220],[190,185,175]];
function crop(frame:ImageData,a:RosterAnchor,r:typeof regions[number]){const x=Math.round(a.x+r.dx*a.scale),y=Math.round(a.y+r.dy*a.scale),w=Math.round(r.w*a.scale),h=Math.round(r.h*a.scale);if(x<0||y<0||x+w>frame.width||y+h>frame.height)throw Error('Recorte fuera de pantalla: '+r.name);const out=new ImageData(w+40,h+40);for(let i=0;i<out.data.length;i+=4){out.data[i]=48;out.data[i+1]=44;out.data[i+2]=37;out.data[i+3]=255;}for(let row=0;row<h;row++){const start=((y+row)*frame.width+x)*4;out.data.set(frame.data.subarray(start,start+w*4),((row+20)*out.width+20)*4)}return {out,w,h}}
function bands(img:ImageData,w:number,h:number){const b:{first:number;last:number;minX:number;maxX:number}[]=[];let current:typeof b[number]|null=null;for(let y=20;y<20+h;y++){let min=Infinity,max=-1;for(let x=20;x<20+w;x++){const i=(y*img.width+x)*4,r=img.data[i],g=img.data[i+1],bl=img.data[i+2];if(r>125&&g>100&&(Math.min(r,g,bl)>110||r-bl>35)){min=Math.min(min,x);max=Math.max(max,x)}}if(max>=min){if(!current){current={first:y,last:y,minX:min,maxX:max};b.push(current)}else{current.last=y;current.minX=Math.min(current.minX,min);current.maxX=Math.max(current.maxX,max)}}else current=null;}return b.filter(q=>q.last-q.first>=2||q.maxX-q.minX>=2)}

function pixelColors(img:ImageData,w:number,h:number,palette:string):Color[]{
 const counts=new Map<string,{color:Color,count:number}>();
 for(let y=20;y<20+h;y++)for(let x=20;x<20+w;x++){
  const i=(y*img.width+x)*4;const r=img.data[i],g=img.data[i+1],b=img.data[i+2];
  const light=Math.min(r,g,b)>125&&Math.max(r,g,b)-Math.min(r,g,b)<65;
  const yellow=r>145&&g>100&&r-b>35&&g-b>15;
  if(!(palette==='gold'?yellow:palette==='white'?light:light||yellow))continue;
  const key=[r,g,b].map(v=>Math.round(v/8)).join(',');
  const old=counts.get(key);if(old)old.count++;else counts.set(key,{color:[r,g,b],count:1});
 }
 const ranked=[...counts.values()].sort((a,b)=>b.count-a.count);
 const defaults=palette==='gold'?gold:palette==='white'?white:[...gold,...white];
 const result:Color[]=[];
 for(const c of [...ranked.slice(0,6).map(v=>v.color),...defaults]){
  if(!result.some(q=>q.every((v,i)=>Math.abs(v-c[i])<10)))result.push(c);
 }
 return result;
}
function scoreText(text:string,field:string){
 const letters=(text.match(/[a-z]/gi)||[]).length,digits=(text.match(/\d/g)||[]).length,noise=(text.match(/[^a-z0-9 ,.:\-]/gi)||[]).length;
 if(field==='Barco')return /^[1-4-]$/.test(text)?100:0;
 if(field==='Nivel')return /^level\s+(?:10|[1-9])$/i.test(text)?100:letters+digits-noise*3;
 if(['Morale','Combat','Seafaring','Speed'].includes(field)){
  const re=new RegExp('^'+field+'\\s*:?\\s*[−-]?\\d[\\d,]*(root:HTMLElement){
 const section=document.createElement('section');section.className='assistant';section.innerHTML='<h2>Laboratorio OCR · Solo Alt1</h2><p>Selecciona una unidad en Crew Roster y pulsa Analizar. Se prueban fuentes de Alt1 con colores de la captura y búsqueda ampliada de posiciones. Sin Tesseract. No se escribe en tu registro.</p><button id="alt1-lab-run">Analizar unidad seleccionada</button><p id="alt1-lab-status" role="status"></p><div id="alt1-lab-output"></div>';root.append(section);
 const btn=section.querySelector<HTMLButtonElement>('#alt1-lab-run')!,status=section.querySelector<HTMLElement>('#alt1-lab-status')!,output=section.querySelector<HTMLElement>('#alt1-lab-output')!;
 btn.onclick=async()=>{btn.disabled=true;output.replaceChildren();status.textContent='Cargando fuentes especializadas…';try{const {ocr,fonts}=await load();const frame=captureGame(window.alt1),a=findRosterAnchor(frame);if(!a)throw Error('Abre Crew Roster con el panel completo visible.');const started=performance.now();for(const r of regions){status.textContent='Analizando '+r.name+'…';const {out,w,h}=crop(frame,a,r);const group=document.createElement('details');group.open=true;const heading=document.createElement('summary');heading.textContent=r.name;group.append(heading);const canvas=document.createElement('canvas');canvas.width=out.width;canvas.height=out.height;canvas.getContext('2d')!.putImageData(out,0,0);canvas.style.maxWidth='100%';group.append(canvas);const rows=bands(out,w,h);
 const colors=pixelColors(out,w,h,r.palette);
 const diagnostics=document.createElement('p');diagnostics.textContent='Bandas: '+rows.map(q=>(q.first-20)+'–'+(q.last-20)).join(', ')+' · RGB: '+colors.map(c=>c.join('/')).join(', ');group.append(diagnostics);
 const candidates:{font:string,text:string,score:number,where:string}[]=[];
 for(const {name,font} of fonts){
  for(let ri=0;ri<rows.length;ri++){
   const row=rows[ri];const found=new Map<string,{font:string,text:string,score:number,where:string}>();
   for(const col of colors){
    const x=Math.max(0,row.minX-5),end=Math.min(out.width-font.width,row.maxX+1);
    const y=Math.max(font.basey,row.first-2),bottom=Math.min(out.height-font.height+font.basey,row.last+9);
    if(end<=x||bottom<=y)continue;
    // Probe several segments separately, not just the leftmost glyph; scan each color independently.
    for(let sx=x;sx<end;sx+=Math.max(8,font.width)){
     try{
      const text=ocr.findReadLine(out,font,[col],sx,y,Math.min(end-sx,Math.max(8,font.width)),bottom-y).text.trim();
      if(!text)continue;
      const score=scoreText(text,r.name);
      if(score<=0)continue;
      const where='línea '+(ri+1)+' · RGB '+col.join('/')+' · x '+(sx-20);
      if(!found.has(text))found.set(text,{font:name,text,score,where});
     }catch{}
    }
   }
   candidates.push(...[...found.values()].sort((a,b)=>b.score-a.score).slice(0,3));
  }
 }
 const ranked=candidates.sort((a,b)=>b.score-a.score);
 const unique=new Map<string,typeof ranked[number]>();
 for(const c of ranked){const key=c.font+'|'+c.text;if(!unique.has(key))unique.set(key,c);}
 for(const c of [...unique.values()].slice(0,15)){
  const line=document.createElement('p');line.textContent=c.font+': '+c.text+' ['+c.where+']';group.append(line);
 }
 if(!ranked.length){const line=document.createElement('p');line.textContent='Sin candidatos legibles.';group.append(line);}
 output.append(group);await new Promise<void>(resolve=>window.setTimeout(resolve,0));}
 status.textContent='Prueba terminada: '+fonts.length+' fuentes, '+Math.round(performance.now()-started)+' ms de análisis total. Sin guardar datos.';}catch(e){status.textContent=String(e)}finally{btn.disabled=false}};
}
,'i');
  if(re.test(text))return 100;
  if(/^[−-]?\d[\d,]*$/.test(text))return 30+digits;
 }
 return letters+digits-noise*3;
}

export function mountAlt1Lab(root:HTMLElement){
 const section=document.createElement('section');section.className='assistant';section.innerHTML='<h2>Laboratorio OCR · Solo Alt1</h2><p>Selecciona una unidad en Crew Roster y pulsa Analizar. Se prueban las fuentes de Alt1 sin Tesseract. No se escribe en tu registro.</p><button id="alt1-lab-run">Analizar unidad seleccionada</button><p id="alt1-lab-status" role="status"></p><div id="alt1-lab-output"></div>';root.append(section);
 const btn=section.querySelector<HTMLButtonElement>('#alt1-lab-run')!,status=section.querySelector<HTMLElement>('#alt1-lab-status')!,output=section.querySelector<HTMLElement>('#alt1-lab-output')!;
 btn.onclick=async()=>{btn.disabled=true;output.replaceChildren();status.textContent='Cargando fuentes especializadas…';try{const {ocr,fonts}=await load();const frame=captureGame(window.alt1),a=findRosterAnchor(frame);if(!a)throw Error('Abre Crew Roster con el panel completo visible.');const started=performance.now();for(const r of regions){status.textContent='Analizando '+r.name+'…';const {out,w,h}=crop(frame,a,r);const group=document.createElement('details');group.open=true;const heading=document.createElement('summary');heading.textContent=r.name;group.append(heading);const canvas=document.createElement('canvas');canvas.width=out.width;canvas.height=out.height;canvas.getContext('2d')!.putImageData(out,0,0);canvas.style.maxWidth='100%';group.append(canvas);const rows=bands(out,w,h);
 for(const {name,font} of fonts){try{const results:string[]=[];for(const row of rows){const palette=r.palette==='gold'?gold:r.palette==='white'?white:[...gold,...white];const x=Math.max(0,row.minX-2),end=Math.min(out.width-font.width,row.maxX+1);const y=Math.max(font.basey,row.last-3),bottom=Math.min(out.height-font.height+font.basey,row.last+7);if(end<=x||bottom<=y)continue;
 // Search near the first visible glyph; keep competing font results separate.
 const text=ocr.findReadLine(out,font,palette,x,y,Math.min(end-x,Math.max(12,font.width*2)),bottom-y).text.trim();if(text)results.push(text);}
 const line=document.createElement('p');line.textContent=name+': '+(results.join(' / ')||'—');group.append(line);
 }catch(e){const line=document.createElement('p');line.textContent=name+': '+String(e);group.append(line)}}
 output.append(group);await new Promise<void>(resolve=>window.setTimeout(resolve,0));}
 status.textContent='Prueba terminada: '+fonts.length+' fuentes, '+Math.round(performance.now()-started)+' ms de análisis total. Sin guardar datos.';}catch(e){status.textContent=String(e)}finally{btn.disabled=false}};
}
