import {createWorker,PSM,type Worker} from 'tesseract.js';
import type {RosterAnchor} from '../core/roster-anchor';
let workerPromise:Promise<Worker>|undefined;
async function getWorker(){if(!workerPromise){workerPromise=(async()=>{const w=await createWorker('eng',1,{workerPath:new URL('./ocr/worker.min.js',location.href).href,corePath:new URL('./ocr/core/',location.href).href,langPath:new URL('./ocr/lang/',location.href).href,workerBlobURL:false});try{await w.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK});return w}catch(e){await w.terminate();throw e}})().catch(e=>{workerPromise=undefined;throw e})}return workerPromise;}
export function panelBounds(a:RosterAnchor){return {x:Math.round(a.x-315*a.scale),y:Math.round(a.y+338*a.scale),w:Math.round(270*a.scale),h:Math.round(98*a.scale)}}
export async function readPanel(frame:ImageData,a:RosterAnchor){const r=panelBounds(a);if(r.x<0||r.y<0||r.x+r.w>frame.width||r.y+r.h>frame.height)throw Error('Panel fuera de la captura.');const src=document.createElement('canvas');src.width=frame.width;src.height=frame.height;src.getContext('2d')!.putImageData(frame,0,0);const out=document.createElement('canvas');out.width=r.w*4;out.height=r.h*4;const ctx=out.getContext('2d')!;ctx.drawImage(src,r.x,r.y,r.w,r.h,0,0,out.width,out.height);const clean=document.createElement('canvas');clean.width=out.width;clean.height=out.height;const c=clean.getContext('2d')!;c.drawImage(out,0,0);
 // Remove the XP progress bar only, leaving the name, level and all four stats unchanged.
 const mask={x:Math.floor(clean.width*.45),y:Math.floor(clean.height*.25),w:Math.ceil(clean.width*.55),h:Math.floor(clean.height*.30)};c.fillStyle='#302c25';c.fillRect(mask.x,mask.y,mask.w,mask.h);
 // Read the title independently, using only gold text pixels. Avoid panel edges and XP bar.
 const titleX=Math.round(a.x-315*a.scale),titleW=Math.round(270*a.scale),titleY=r.y,titleH=Math.round(23*a.scale);
 const title=document.createElement('canvas');title.width=titleW*4;title.height=titleH*4;
 const tc=title.getContext('2d')!;
 tc.drawImage(src,titleX,titleY,titleW,titleH,0,0,title.width,title.height);
 const pixels=tc.getImageData(0,0,title.width,title.height);
 for(let i=0;i<pixels.data.length;i+=4){const red=pixels.data[i],green=pixels.data[i+1],blue=pixels.data[i+2];const ink=red>110&&green>75&&red-blue>35&&green-blue>15;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=ink?0:255;pixels.data[i+3]=255;}
 tc.putImageData(pixels,0,0);
 // The title pass uses the full inner panel width (wider than the original stats crop).
 const wideX=Math.round(a.x-350*a.scale),wideW=Math.round(330*a.scale);
 if(wideX>=0&&wideX+wideW<=frame.width){title.width=wideW*4;title.height=titleH*4;const t=title.getContext('2d')!;t.drawImage(src,wideX,titleY,wideW,titleH,0,0,title.width,title.height);const im=t.getImageData(0,0,title.width,title.height);for(let i=0;i<im.data.length;i+=4){const red=im.data[i],green=im.data[i+1],blue=im.data[i+2];const ink=red>110&&green>75&&red-blue>35&&green-blue>15;im.data[i]=im.data[i+1]=im.data[i+2]=ink?0:255;im.data[i+3]=255;}t.putImageData(im,0,0);}
 // Remove title from body OCR; combine independent readings without guessing a name.
 c.fillRect(0,0,clean.width,titleH*4);
 const w=await getWorker();
 await w.setParameters({tessedit_pageseg_mode:PSM.SINGLE_LINE});
 let nameResult;try{nameResult=await w.recognize(title);}finally{await w.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK});}
 const res=await w.recognize(clean);
 const name=nameResult.data.text.trim().replace(/\s+/g,' ');
 return {text:name+'\n'+res.data.text,confidence:Math.min(nameResult.data.confidence,res.data.confidence),preview:out};}
