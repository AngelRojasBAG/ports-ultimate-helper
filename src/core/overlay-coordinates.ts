// Overlay coordinates may be DPI-scaled by Alt1 independently of capture.
// Keep this conversion outside the OCR and slot geometry.
export function overlayRect(rect:{x:number;y:number;w:number;h:number},scale:number){
 const s=Number.isFinite(scale)&&scale>=1&&scale<=3?scale:1;
 const x=Math.round(rect.x/s),y=Math.round(rect.y/s);
 return {x,y,w:Math.round((rect.x+rect.w)/s)-x,h:Math.round((rect.y+rect.h)/s)-y};
}
