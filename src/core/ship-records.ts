export const shipStats=['Morale','Combat','Seafaring','Speed'] as const;
export const componentNames=['Ram / figurehead','Deck item 1','Deck item 2','Rudder','Hull'] as const;
export type ShipRecord={id:number;name:string;components:string[];totals:number[];observedAt:string;source:'manual'|'visual';state?:'available'|'underway';componentsVerified?:boolean};
export const SHIP_KEY='ports-helper.ships.v1';
export function validShip(v:unknown):v is ShipRecord{
 if(!v||typeof v!=='object')return false;const s=v as ShipRecord;
 return Number.isInteger(s.id)&&s.id>=1&&s.id<=4&&typeof s.name==='string'&&s.name.length<=100&&Array.isArray(s.components)&&s.components.length===5&&s.components.every(x=>typeof x==='string'&&x.length<=120)&&Array.isArray(s.totals)&&s.totals.length===4&&s.totals.every(x=>Number.isSafeInteger(x)&&x>=0)&&(s.source==='manual'||s.source==='visual')&&(s.state===undefined||s.state==='available'||s.state==='underway')&&(s.componentsVerified===undefined||typeof s.componentsVerified==='boolean')&&typeof s.observedAt==='string'&&Number.isFinite(Date.parse(s.observedAt));
}
export function readShips(store:Storage):ShipRecord[]{
 try{const data:unknown=JSON.parse(store.getItem(SHIP_KEY)??'[]');if(!Array.isArray(data))return [];return data.filter(validShip).filter((s,i,a)=>a.findIndex(t=>t.id===s.id)===i);}catch{return [];}
}
export function saveShip(store:Storage,ship:ShipRecord){
 if(!validShip(ship))throw Error('Datos del barco inválidos.');
 const next=[...readShips(store).filter(s=>s.id!==ship.id),ship].sort((a,b)=>a.id-b.id);
 const prior=store.getItem(SHIP_KEY);if(prior!==null)store.setItem(SHIP_KEY+'.previous',prior);
 store.setItem(SHIP_KEY,JSON.stringify(next));return next;
}

export type ShipReading={id:number|null;name:string|null;totals:(number|null)[];components:(string|null)[];state:string};
export function mergeShipReading(reading:ShipReading,old:ShipRecord|undefined,observedAt:string):ShipRecord|null{
 if(reading.id===null||!reading.name||reading.totals.length!==4||reading.totals.some(n=>n===null||!Number.isSafeInteger(n)||n<0)||!['available','underway'].includes(reading.state))return null;
 if(old&&(old.id!==reading.id||old.name.toUpperCase()!==reading.name.toUpperCase()))old=undefined;
 const complete=reading.state==='available'&&reading.components.length===5&&reading.components.every(n=>typeof n==='string'&&n.length>0);
 const components=complete?reading.components as string[]:reading.state==='underway'?(old?.components??Array(5).fill('')):Array(5).fill('').map((_,i)=>reading.components[i]??'');
 const record:ShipRecord={id:reading.id,name:reading.name,totals:reading.totals as number[],components,source:'visual',state:reading.state as 'available'|'underway',componentsVerified:complete,observedAt};
 return validShip(record)?record:null;
}
