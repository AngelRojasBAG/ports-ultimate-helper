import type {Slot} from './crew-grid';
import type {Observation,Records} from './sync-session';
import {validObservation,snapshot,type Snapshot} from './sync-storage';
import {slotComplete} from './slot-state';
import {parseDetails} from './unit-details';
export const SYNC_KEY='ports-helper.verified-roster.v1';
export type ReadRow={label:string;value:string|null;source:string};
export function observationFromRows(slot:Slot,rows:ReadRow[]):Observation|null{
 const v=(label:string)=>rows.find(r=>r.label===label)?.value??null;
 const name=v('Nombre'),level=v('Nivel'),ship=v('Barco'),traits=v('Traits'),personality=v('Personalidad');
 const stats=['Morale','Combat','Seafaring','Speed'].map(v);
 if(!name||!level||!ship||!traits||!(/^(?:[1-9]|10)$/).test(level)||!(/^[1-4-]$/).test(ship)||stats.some(s=>s===null||! /^-?\d+$/.test(s)))return null;
 if(slot.kind==='captain'&&!personality)return null;
 const details=parseDetails(ship,traits+(personality?'\nPersonality: '+personality:''),slot.kind);
 if(!details.assignmentKnown||!details.traitsText||(slot.kind==='captain'&&!details.personality))return null;
 const [morale,combat,seafaring,speed]=stats.map(Number);
 const o:Observation={kind:slot.kind,fingerprint:slot.fingerprint,observedAt:new Date().toISOString(),reading:{name,level:Number(level),morale,combat,seafaring,speed},details};
 return validObservation(o)?o:null;
}
export function readVerified(store:Storage):Snapshot|null{
 try{const s=JSON.parse(store.getItem(SYNC_KEY)??'null');if(s&&Array.isArray(s.grid)&&s.records&&typeof s.savedAt==='string')return s;}catch{}return null;
}
// Never remap portraits to different slots. Identical portraits are not unique IDs.
export function matchingRecords(saved:Snapshot|null,slots:Slot[]):Records{
 if(!saved||saved.grid.length!==slots.length||!slots.every(s=>saved.grid.some(g=>g.id===s.id&&g.kind===s.kind&&g.fingerprint===s.fingerprint)))return {};
 return Object.fromEntries(slots.flatMap(s=>{const o=saved.records[s.id];return validObservation(o)&&o.kind===s.kind&&slotComplete(s,saved.records,true)?[[s.id,o]]:[]}));
}
export function saveVerified(store:Storage,slots:Slot[],slot:Slot,rows:ReadRow[]){
 const o=observationFromRows(slot,rows);if(!o)return null;
 const old=readVerified(store),archiveKey=SYNC_KEY+'.identity-archive';const records=matchingRecords(old,slots);
 if(old&&Object.keys(old.records).length===old.grid.length&&old.grid.length>0){const existingArchive=store.getItem(archiveKey);if(!existingArchive||Object.keys(records).length===old.grid.length)store.setItem(archiveKey,JSON.stringify(old));}
 // Keep original records recoverable; never promote provisional remaps to verified.
 const next=snapshot({...records,[slot.id]:o},slots);
 const prior=store.getItem(SYNC_KEY);
 if(prior)store.setItem(SYNC_KEY+'.previous',prior);
 store.setItem(SYNC_KEY,JSON.stringify(next));return next;
}
export function readingSignature(o:Observation){return JSON.stringify([o.kind,o.fingerprint,o.reading,o.details]);}
