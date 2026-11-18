
import {createDigitFont,readVerifiedNumber} from '../core/ports-digit-font';
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
   // Reference anchor is near (1060,212). Probe a small offset around the
   // four observed value starts; report alternatives instead of selecting arbitrarily.
   const fields=[['Morale',-245,401],['Combat',-245,418],['Seafaring',-125,401],['Speed',-125,418]] as const;
   const results:string[]=[];
   for(const [name,dx,dy] of fields){
    const candidates=new Map<string,string>();
    for(let oy=-3;oy<=3;oy++)for(let ox=-4;ox<=4;ox++){
     const x=Math.round(anchor.x+dx+ox),y=Math.round(anchor.y+dy+oy);
     // Reject starts inside a preceding glyph.
     let left=false;for(let j=0;j<9;j++){const i=((y+j)*frame.width+x-1)*4;if(Math.min(frame.data[i],frame.data[i+1],frame.data[i+2])>100)left=true;}
     if(left)continue;
     const value=readVerifiedNumber(frame,x,y,m=>readGlyph(engine,m));
     if(value!==null)candidates.set(value,'x='+x+', y='+y);
    }
    results.push(name+': '+(candidates.size===1?[...candidates.entries()].map(([v,pos])=>v+' ('+pos+')').join(''):candidates.size?'Ambiguo: '+[...candidates.keys()].join(', '):'Pendiente'));
   }
   out.textContent=results.join('\n');
   status.textContent='Escala '+anchor.scale+' · ancla '+anchor.x+'/'+anchor.y+' · '+Math.round(performance.now()-t)+' ms · Sin guardar datos.';
  }catch(e){status.textContent=String(e)}finally{button.disabled=false}
 };
}
