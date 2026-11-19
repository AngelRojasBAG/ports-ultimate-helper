import {crop,readShipNumber} from './ship-visual-reader';
import {editAnchor} from './edit-crew-guide';
import type {Frame,Mask} from './ports-text-patterns';
import type {Snapshot} from './sync-storage';
// Selected and Compare share a right panel. Offsets relative to CREW ROSTER.
export function selectedMasks(f:Frame){
 const a=editAnchor(f);if(!a)return null;
 const section=(dy:number)=>({name:crop(f,a.x+183,a.y-310+dy,195,16,true),stats:[0,1,2,3].map(i=>crop(f,a.x+281,a.y-291+dy+13*i,85,12,false,100))});
 return {selected:section(0),compare:section(126)};
}
export function matchReading(snapshot:Snapshot,name:string|null,stats:(number|null)[]){
 if(!name||stats.length!==4||stats.some(n=>n===null))return [];
 return Object.entries(snapshot.records).filter(([,o])=>o.reading.name.toUpperCase()===name.toUpperCase()&&[o.reading.morale,o.reading.combat,o.reading.seafaring,o.reading.speed].every((n,i)=>n===stats[i])).map(([id])=>id);
}
export function numericPanel(m:Mask|null){return readShipNumber(m);}
