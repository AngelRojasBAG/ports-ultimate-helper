import type {Slot} from './crew-grid';
import type {Records} from './sync-session';
export function slotComplete(s:Slot,records:Records,extra:boolean){
 const o=records[s.id];if(!o||o.fingerprint!==s.fingerprint)return false;
 if(!extra)return true;
 const d=o.details;return !!d&&d.assignmentKnown===true&&(d.assignedShip===null||[1,2,3,4].includes(d.assignedShip))&&typeof d.traitsText==='string'&&d.traitsText.trim().length>0&&(s.kind!=='captain'||typeof d.personality==='string'&&d.personality.trim().length>0);
}
export function slotState(s:Slot,records:Records,extra:boolean,active:string|null,next:string|null){
 if(slotComplete(s,records,extra))return 'done';
 if(s.id===active)return 'active';
 if(s.id===next)return 'next';
 return records[s.id]?.fingerprint===s.fingerprint?'partial':'pending';
}
