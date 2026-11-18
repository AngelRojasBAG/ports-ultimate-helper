import {KEY,sanitize,type Snapshot} from './sync-storage';
export function exportRoster(s:Snapshot){return JSON.stringify({format:'ports-roster-v1',snapshot:s},null,2)}
export function importRoster(store:Storage,raw:string):Snapshot{
 const v=JSON.parse(raw);const s=v?.snapshot;
 if(v?.format!=='ports-roster-v1'||!s||!Array.isArray(s.grid)||typeof s.savedAt!=='string'||!s.records||typeof s.records!=='object')throw Error('Formato de respaldo inválido.');
 const records=sanitize(s.records);
 if(Object.keys(records).length!==Object.keys(s.records).length||Object.keys(records).length>30)throw Error('Registros inválidos.');
 if(s.grid.length>30||!s.grid.every((g:any)=>g&&typeof g.id==='string'&&/^[0-4]:[0-5]$/.test(g.id)&&['crew','captain'].includes(g.kind)&&typeof g.fingerprint==='string'))throw Error('Cuadrícula inválida.');
 const snapshot:Snapshot={records,grid:s.grid,savedAt:s.savedAt};
 const prior=store.getItem(KEY);if(prior)store.setItem(KEY+'.before-import',prior);
 store.setItem(KEY,JSON.stringify(snapshot));return snapshot;
}
