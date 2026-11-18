import {parseDetails,resolveDetailPasses} from '../core/unit-details';
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

export async function readDetails(frame:ImageData,a:RosterAnchor,kind:'crew'|'captain'='crew'){
 const src=document.createElement('canvas');src.width=frame.width;src.height=frame.height;src.getContext('2d')!.putImageData(frame,0,0);
 function crop(dx:number,dy:number,w:number,h:number){const x=Math.round(a.x+dx*a.scale),y=Math.round(a.y+dy*a.scale),ww=Math.round(w*a.scale),hh=Math.round(h*a.scale);if(x<0||y<0||x+ww>frame.width||y+hh>frame.height)throw Error('Detalle fuera de pantalla.');const c=document.createElement('canvas');c.width=ww*4;c.height=hh*4;c.getContext('2d')!.drawImage(src,x,y,ww,hh,0,0,c.width,c.height);return c;}
 const w=await getWorker();
 const original=crop(-315,436,270,47);
 const clean=document.createElement('canvas');clean.width=original.width;clean.height=original.height;const tc=clean.getContext('2d')!;tc.drawImage(original,0,0);
 const image=tc.getImageData(0,0,clean.width,clean.height);
 for(let i=0;i<image.data.length;i+=4){const r=image.data[i],g=image.data[i+1],b=image.data[i+2];const ink=Math.min(r,g,b)>120&&Math.max(r,g,b)-Math.min(r,g,b)<65;image.data[i]=image.data[i+1]=image.data[i+2]=ink?0:255;image.data[i+3]=255;}
 tc.putImageData(image,0,0);
 const trait=await w.recognize(clean);
 const passes=[{text:trait.data.text,confidence:trait.data.confidence}];
 const first=parseDetails('',trait.data.text,kind);
 if(trait.data.confidence<75||!first.traitsText||(kind==='captain'&&!first.personality)){
  const fallback=await w.recognize(original);
  passes.push({text:fallback.data.text,confidence:fallback.data.confidence});
  const contrast=document.createElement('canvas');contrast.width=original.width;contrast.height=original.height;
  const cc=contrast.getContext('2d')!;cc.drawImage(original,0,0);const im=cc.getImageData(0,0,contrast.width,contrast.height);
  for(let i=0;i<im.data.length;i+=4){const v=Math.min(im.data[i],im.data[i+1],im.data[i+2]);const gray=Math.max(0,Math.min(255,255-(v-45)*1.7));im.data[i]=im.data[i+1]=im.data[i+2]=gray;im.data[i+3]=255;}cc.putImageData(im,0,0);
  const third=await w.recognize(contrast);passes.push({text:third.data.text,confidence:third.data.confidence});
 }
 await w.setParameters({tessedit_pageseg_mode:PSM.SINGLE_LINE});
 try{
 const marker=crop(-382,338,24,20);
 const ctx=marker.getContext('2d')!;
 const im=ctx.getImageData(0,0,marker.width,marker.height);
 // A free-unit marker is a small, isolated horizontal white stroke. Do not infer free from empty OCR.
 let minX=marker.width,minY=marker.height,maxX=-1,maxY=-1,count=0;
 for(let y=0;y<marker.height;y++)for(let x=0;x<marker.width;x++){const i=(y*marker.width+x)*4;const r=im.data[i],g=im.data[i+1],b=im.data[i+2];if(Math.min(r,g,b)>145&&Math.max(r,g,b)-Math.min(r,g,b)<45){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);count++;}}
 const ww=maxX-minX+1,hh=maxY-minY+1;
 const dash=count>0&&ww>=8*a.scale&&ww<=32*a.scale&&hh>=2*a.scale&&hh<=12*a.scale&&ww/hh>=2&&count/(ww*hh)>.35&&minX>0&&minY>0&&maxX<marker.width-1&&maxY<marker.height-1;
 const assignment=dash?null:await w.recognize(marker);
 const markerText=dash?'-':assignment&&assignment.data.confidence>=75?assignment.data.text:'';
 return {details:resolveDetailPasses(markerText,passes,kind),rawTraits:passes.map(p=>Math.round(p.confidence)+'%: '+p.text.trim()).join('\n---\n'),rawAssignment:dash?'-':assignment?.data.text??''};
 }finally{await w.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK});}
}
