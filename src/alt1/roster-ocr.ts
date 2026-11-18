import {createWorker,PSM,type Worker} from 'tesseract.js';
import type {RosterAnchor} from '../core/roster-anchor';
let workerPromise:Promise<Worker>|undefined;
async function getWorker(){if(!workerPromise){workerPromise=(async()=>{const w=await createWorker('eng',1,{workerPath:new URL('./ocr/worker.min.js',location.href).href,corePath:new URL('./ocr/core/',location.href).href,langPath:new URL('./ocr/lang/',location.href).href,workerBlobURL:false});try{await w.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK});return w}catch(e){await w.terminate();throw e}})().catch(e=>{workerPromise=undefined;throw e})}return workerPromise;}
export function panelBounds(a:RosterAnchor){return {x:Math.round(a.x-315*a.scale),y:Math.round(a.y+338*a.scale),w:Math.round(270*a.scale),h:Math.round(98*a.scale)}}
export async function readPanel(frame:ImageData,a:RosterAnchor){const r=panelBounds(a);if(r.x<0||r.y<0||r.x+r.w>frame.width||r.y+r.h>frame.height)throw Error('Panel fuera de la captura.');const src=document.createElement('canvas');src.width=frame.width;src.height=frame.height;src.getContext('2d')!.putImageData(frame,0,0);const out=document.createElement('canvas');out.width=r.w*4;out.height=r.h*4;const ctx=out.getContext('2d')!;ctx.drawImage(src,r.x,r.y,r.w,r.h,0,0,out.width,out.height);const clean=document.createElement('canvas');clean.width=out.width;clean.height=out.height;const c=clean.getContext('2d')!;c.drawImage(out,0,0);
 // Remove the XP progress bar only, leaving the name, level and all four stats unchanged.
 const mask={x:Math.floor(clean.width*.45),y:Math.floor(clean.height*.25),w:Math.ceil(clean.width*.55),h:Math.floor(clean.height*.30)};c.fillStyle='#302c25';c.fillRect(mask.x,mask.y,mask.w,mask.h);
 // Replace the narrow title strip with a wider crop, scaled down to fit the full title.
 const titleX=Math.round(a.x-365*a.scale),titleW=Math.round(370*a.scale),titleH=Math.round(23*a.scale);
 if(titleX>=0&&titleX+titleW<=frame.width&&r.y+titleH<=frame.height){
 c.fillRect(0,0,clean.width,titleH*4);
 c.drawImage(src,titleX,r.y,titleW,titleH,0,0,clean.width,titleH*4);
 }
 const w=await getWorker();const res=await w.recognize(clean);return {text:res.data.text,confidence:res.data.confidence,preview:out};}
