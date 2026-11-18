
import {createDigitFont,readSignedNumber,cellMask} from '../core/ports-digit-font';
import {captureGame} from '../alt1/capture';
import {findRosterAnchor} from '../core/roster-anchor';
type DigitEngine={readChar:(buffer:ImageData,font:ReturnType<typeof createDigitFont>,color:[number,number,number],x:number,y:number,backwards:boolean,allowSecondary:boolean)=>{chr:string}|null};
const font=createDigitFont();
function readGlyph(engine:DigitEngine,rows:string){
 const im=new ImageData(27,29);
 for(let i=3;i<im.data.length;i+=4)im.data[i]=255;
 rows.split('/').forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1'){const i=((y+10)*im.width+x+10)*4;im.data[i]=im.data[i+1]=im.data[i+2]=255;}}));
 return engine.readChar(im,font,[255,255,255],10,18,false,true)?.chr??null;
}
export function mountNumericLab(root:HTMLElement,initialize:()=>Promise<unknown>){
 const sec=document.createElement('section');sec.className='assistant';
 sec.innerHTML='<h2>Prueba Alt1 · ports-stats</h2><p>Fuente numérica personalizada, escala 100%. Solo diagnóstico; no guarda registros. Selecciona un tripulante o capitán.</p><button>Probar estadísticas numéricas</button><p role="status"></p><pre style="white-space:pre-wrap"></pre>';
 root.append(sec);
 const button=sec.querySelector('button')!,status=sec.querySelector<HTMLElement>('[role=status]')!,out=sec.querySelector('pre')!;
 button.onclick=async()=>{
  button.disabled=true;out.textContent='';status.textContent='Cargando OCR Alt1…';
  try{
   await initialize();
   const engine=(window as Window&{OCR?:DigitEngine}).OCR;
   if(!engine?.readChar)throw Error('OCR.readChar no disponible.');
   const frame=captureGame(window.alt1),anchor=findRosterAnchor(frame);
   if(!anchor)throw Error('Crew Roster no detectado.');
   if(Math.abs(anchor.scale-1)>.01)throw Error('Escala detectada '+anchor.scale+'. Usa 100%.');
   const t=performance.now();
   // Calibrated relative to the detected heading at scale 1.
   const fields=[['Morale',-246,401],['Combat',-246,418],['Seafaring',-126,401],['Speed',-126,418]] as const;
   const results:string[]=[];
   for(const [name,dx,dy] of fields){
    const x=Math.round(anchor.x+dx),y=Math.round(anchor.y+dy);
    const value=readSignedNumber(frame,x,y,m=>readGlyph(engine,m));
    const mask=cellMask(frame,x,y);
    results.push(name+': '+(value===null?'Pendiente · patrón inicial '+(mask??'fuera de captura'):value+' (x='+x+', y='+y+')'));
   }
   out.textContent=results.join('\n');
   status.textContent='Escala '+anchor.scale+' · ancla '+anchor.x+'/'+anchor.y+' · '+Math.round(performance.now()-t)+' ms · Sin guardar datos.';
  }catch(e){status.textContent=String(e)}finally{button.disabled=false}
 };
}
