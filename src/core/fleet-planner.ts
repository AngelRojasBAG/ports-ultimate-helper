import {optimize,type Plan} from './ports-optimizer';
import type {Records} from './sync-session';
import type {ShipRecord} from './ship-records';
import type {PartObservation} from './menu-storage';
import type {Stats} from '../data/ship-parts';
export type FleetRequest={ship:number;name:string;requirements:number[]};
export type FleetPlan={request:FleetRequest;plan:Plan|null};
export function planFleet(records:Records,ships:ShipRecord[],parts:PartObservation[],requests:FleetRequest[],tier:number,bonus:Stats):FleetPlan[]{
 if(requests.length>4||new Set(requests.map(r=>r.ship)).size!==requests.length)throw Error('Selecciona cada barco una sola vez.');
 const remaining={...records};const result:FleetPlan[]=[];
 for(const request of requests){const plan=optimize(remaining,ships,parts,request.ship,request.requirements,tier,bonus);if(plan){delete remaining[plan.captain[0]];for(const [id] of plan.crew)delete remaining[id];}result.push({request,plan});}
 return result;
}
