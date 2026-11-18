import {parts,partKinds,type Stats} from '../data/ship-parts';
import type {ShipRecord} from './ship-records';
import {chance} from './chance';
export function equipmentStats(names:readonly string[]):Stats|null{
 if(names.length!==5)return null;const sums:Stats=[0,0,0,0];
 for(let i=0;i<5;i++){const p=parts.find(p=>p.name.toLowerCase()===names[i].toLowerCase()&&p.kind===partKinds[i]);if(!p)return null;p.stats.forEach((n,j)=>sums[j]+=n);}
 return sums;
}
export function observedUnlocks(ships:ShipRecord[]){
 return parts.filter(p=>ships.some(s=>s.source==='visual'&&s.componentsVerified===true&&s.components.some((n,i)=>n.toLowerCase()===p.name.toLowerCase()&&partKinds[i]===p.kind)));
}
export function rankCurrentShips(ships:ShipRecord[],requirements:number[]){
 if(!requirements.some(n=>n>0))return [];
 return ships.filter(s=>s.state==='available'&&s.source==='visual').map(s=>({ship:s,success:chance(s.totals.slice(0,3),requirements)!})).sort((a,b)=>b.success-a.success||b.ship.totals[3]-a.ship.totals[3]||a.ship.id-b.ship.id);
}
