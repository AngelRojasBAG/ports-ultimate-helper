import type {Slot} from '../core/crew-grid';
import type {Records} from '../core/sync-session';
const GROUP='ports-helper-crew';
const color=(r:number,g:number,b:number)=>(255<<24)|(r<<16)|(g<<8)|b;
let previous='',renewAt=0;
export function clearOverlay(){previous='';renewAt=0;try{window.alt1?.overLayClearGroup?.(GROUP)}catch{}}
export function drawOverlay(slots:Slot[],records:Records,active:string|null){const api=window.alt1;if(!api?.permissionOverlay||!api.overLayRect||!api.overLaySetGroup)return false;
 const next=slots.find(s=>records[s.id]?.fingerprint!==s.fingerprint);
 const rects=slots.map(s=>({x:s.x-2,y:s.y-2,w:s.w+4,h:s.h+4,c:records[s.id]?.fingerprint===s.fingerprint?color(55,220,100):s.id===active?color(255,200,45):s.id===next?.id?color(60,160,255):color(165,165,165)}));
 const key=JSON.stringify(rects);if(key===previous&&Date.now()<renewAt)return true;
 const atomic=!!(api.overLayFreezeGroup&&api.overLayContinueGroup);
 try{if(atomic)api.overLayFreezeGroup!(GROUP);api.overLayClearGroup?.(GROUP);api.overLaySetGroup(GROUP);for(const r of rects)api.overLayRect(r.c,r.x,r.y,r.w,r.h,30000,2);previous=key;renewAt=Date.now()+20000;return true}catch{previous='';return false}finally{if(atomic)try{api.overLayContinueGroup!(GROUP)}catch{}}}
