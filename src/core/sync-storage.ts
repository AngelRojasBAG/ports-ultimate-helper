import type {Slot} from './crew-grid';
import type {Records,Observation} from './sync-session';
import {knownCrewName} from './crew-name';
export const KEY='ports-helper.slot-observations.v2';
export const LEGACY='ports-helper.slot-observations.v1';
export interface Snapshot {records:Records;grid:{id:string;kind:Slot['kind'];fingerprint:string}[];savedAt:string}
export function validObservation(v:unknown):v is Observation {
 if(!v||typeof v!=='object')return false;
 const o=v as Observation,r=o.reading;
 return (o.kind==='crew'||o.kind==='captain')&&typeof o.fingerprint==='string'&&o.fingerprint.length>0&&typeof o.observedAt==='string'&&!!r&&typeof r.name==='string'&&r.name.trim().length>2&&(o.kind==='captain'||knownCrewName(r.name))&&Number.isInteger(r.level)&&r.level>=0&&r.level<=10&&[r.morale,r.combat,r.seafaring,r.speed].every(n=>Number.isSafeInteger(n));
}
export function sanitize(v:unknown):Records{
 if(!v||typeof v!=='object'||Array.isArray(v))return {};
 return Object.fromEntries(Object.entries(v).filter(([k,o])=>/^[0-4]:[0-5]$/.test(k)&&validObservation(o)));
}
export function snapshot(records:Records,slots:Slot[]):Snapshot{return {records:sanitize(records),grid:slots.map(({id,kind,fingerprint})=>({id,kind,fingerprint})),savedAt:new Date().toISOString()}}
export function restore(saved:Snapshot,slots:Slot[]):Records{
 const records=sanitize(saved.records);
 const same=saved.grid.length===slots.length&&saved.grid.every(g=>slots.some(s=>s.id===g.id&&s.kind===g.kind&&s.fingerprint===g.fingerprint));
 const out:Records={};
 for(const s of slots){
  const exact=records[s.id];
  // Same grid: slots are tracked provisionally, not permanent identities.
  if(same&&exact?.kind===s.kind&&exact.fingerprint===s.fingerprint){out[s.id]=exact;continue}
  // Changed grid or legacy partial snapshot: only unique visible and stored fingerprint.
  // Captain icons do not identify the named captain, so never remap those by portrait.
  if(s.kind==='captain')continue;
  const candidates=Object.values(records).filter(o=>o.kind===s.kind&&o.fingerprint===s.fingerprint);
  if(candidates.length===1&&slots.filter(t=>t.kind===s.kind&&t.fingerprint===s.fingerprint).length===1)out[s.id]=candidates[0];
 }
 return out;
}
export function readSnapshot(store:Storage):Snapshot{
 try{const s=JSON.parse(store.getItem(KEY)||'null');if(s&&Array.isArray(s.grid)&&s.records&&typeof s.savedAt==='string')return {...s,records:sanitize(s.records)};}catch{}
 try{return {records:sanitize(JSON.parse(store.getItem(LEGACY)||'{}')),grid:[],savedAt:''}}catch{return {records:{},grid:[],savedAt:''}}
}
export function persist(store:Storage,records:Records,slots:Slot[]){
 const s=snapshot(records,slots);
 // Preserve the previous complete/partial snapshot before replacing it.
 const prior=store.getItem(KEY);if(prior)store.setItem(KEY+'.previous',prior);
 store.setItem(KEY,JSON.stringify(s));return s;
}
