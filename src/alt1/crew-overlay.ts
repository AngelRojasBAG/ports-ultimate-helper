import type {Slot} from '../core/crew-grid';
import type {Records} from '../core/sync-session';
const GROUP='ports-helper-crew';
const color=(r:number,g:number,b:number)=>(255<<24)|(r<<16)|(g<<8)|b;
export function clearOverlay(){try{window.alt1?.overLayClearGroup?.(GROUP)}catch{}}
export function drawOverlay(slots:Slot[],records:Records,active:string|null){const api=window.alt1;if(!api?.permissionOverlay||!api.overLayRect||!api.overLaySetGroup)return false;
 try{clearOverlay();api.overLaySetGroup(GROUP);const next=slots.find(s=>!records[s.id]);for(const s of slots){const saved=records[s.id]?.fingerprint===s.fingerprint;const c=saved?color(55,220,100):s.id===active?color(255,200,45):s.id===next?.id?color(60,160,255):color(165,165,165);api.overLayRect(c,s.x-2,s.y-2,s.w+4,s.h+4,5500,2)}return true}catch{return false}}
