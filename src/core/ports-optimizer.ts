import {parts,type Part,type Stats} from '../data/ship-parts';
import type {PartObservation} from './menu-storage';
import type {ShipRecord} from './ship-records';
import type {Records} from './sync-session';
import {validObservation} from './sync-storage';
export const fortBonuses=[0,3,6,10] as const;
export function successFor(t:Stats,r:number[],tier:number){if(!r.some(n=>n>0))return 0;return Math.max(0,Math.min(100,...r.flatMap((n,i)=>n>0?[100*t[i]/n+(fortBonuses[tier]??0)]:[])));}
export function eligibleParts(obs:PartObservation[],ships:ShipRecord[]){return parts.filter(p=>{const o=obs.find(o=>o.name===p.name&&o.category===p.kind);return o?o.state==='available'||o.state==='equipped':ships.some(s=>s.componentsVerified&&s.components.includes(p.name));});}
export function eligibleUnits(records:Records,ships:ShipRecord[],target:number){return Object.entries(records).filter(([,o])=>validObservation(o)&&o.details?.assignmentKnown&&!!o.details.traitsText&&(o.kind!=='captain'||!!o.details.personality)&&(o.details.assignedShip===null||o.details.assignedShip===target||ships.some(s=>s.id===o.details!.assignedShip&&s.state==='available'&&s.source==='visual')));}
type Unit=ReturnType<typeof eligibleUnits>[number];
export type Plan={captain:Unit;crew:Unit[];equipment:Part[];stats:Stats;success:number;examined:number};
const add=(a:Stats,b:Stats):Stats=>[a[0]+b[0],a[1]+b[1],a[2]+b[2],a[3]+b[3]];
const unitStats=([,o]:Unit):Stats=>[o.reading.morale,o.reading.combat,o.reading.seafaring,o.reading.speed];
export function optimize(records:Records,ships:ShipRecord[],obs:PartObservation[],target:number,req:number[],tier:number,bonus:Stats):Plan|null{
 if(!ships.some(s=>s.id===target&&s.state==='available'&&s.source==='visual')||req.length!==3||req.some(n=>!Number.isFinite(n)||n<0)||!req.some(n=>n>0)||bonus.some(n=>!Number.isFinite(n)))return null;
 const units=eligibleUnits(records,ships,target),captains=units.filter(u=>u[1].kind==='captain'),crew=units.filter(u=>u[1].kind==='crew');
 const available=eligibleParts(obs,ships),ram=available.filter(p=>p.kind==='ram'),deck=available.filter(p=>p.kind==='deck'),rudder=available.filter(p=>p.kind==='rudder').sort((a,b)=>b.stats[3]-a.stats[3])[0],hull=available.filter(p=>p.kind==='hull');
 if(!captains.length||!crew.length||!ram.length||!deck.length||!rudder||!hull.length)return null;
 const sets:{equipment:Part[];stats:Stats}[]=[];
 for(const a of ram)for(let i=0;i<deck.length;i++)for(let j=i;j<deck.length;j++)for(const h of hull){const equipment=[a,deck[i],deck[j],rudder,h];sets.push({equipment,stats:equipment.reduce((sum,p)=>add(sum,p.stats),[0,0,0,0] as Stats)});}
 const frontier=sets.filter((s,i)=>!sets.some((t,j)=>i!==j&&t.stats.every((v,k)=>v>=s.stats[k])&&(t.stats.some((v,k)=>v>s.stats[k])||j<i)));
 let best:Plan|null=null,examined=0;
 // Exhaustive search over distinct roster slots and non-dominated equipment for the additive model.
 function visit(captain:Unit,chosen:Unit[],sum:Stats,start:number){
 for(const e of frontier){const base=add(sum,e.stats);const stats=base.map((n,i)=>Math.max(0,Math.floor(n*(1+bonus[i]/100)))) as Stats;const success=successFor(stats,req,tier);examined++;
 if(!best||success>best.success||(success===best.success&&stats[3]>best.stats[3]))best={captain,crew:[...chosen],equipment:e.equipment,stats,success,examined:0};}
 if(chosen.length===5)return;
 for(let i=start;i<crew.length;i++){chosen.push(crew[i]);visit(captain,chosen,add(sum,unitStats(crew[i])),i+1);chosen.pop();}
 }
 // Avoid a long synchronous search on large future catalogues.
 const count=crew.length;let combinations=1,term=1;for(let k=1;k<=Math.min(5,count);k++){term=term*(count-k+1)/k;combinations+=term;}
 if(combinations*captains.length*frontier.length>3000000)throw Error('Demasiadas combinaciones para esta versión. Reduce el conjunto disponible.');
 for(const captain of captains)visit(captain,[],unitStats(captain),0);
 const result=best as Plan|null;return result?{...result,examined}:null;
}
