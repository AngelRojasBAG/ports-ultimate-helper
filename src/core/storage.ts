export interface PortSettings { ships:number; region:string }
const key='ports-helper.settings.v1';
export const defaults:PortSettings={ships:3,region:'The Scythe'};
export function loadSettings():PortSettings {
 try { const v=JSON.parse(localStorage.getItem(key)??'null'); return v && Number.isInteger(v.ships) && v.ships>=1 && v.ships<=4 && typeof v.region==='string' ? {ships:v.ships,region:v.region}: {...defaults}; } catch { return {...defaults}; }
}
export function saveSettings(v:PortSettings){localStorage.setItem(key,JSON.stringify(v));}
