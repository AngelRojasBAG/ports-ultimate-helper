import type {Snapshot} from './sync-storage';
import {validObservation} from './sync-storage';
import type {Slot} from './crew-grid';
import type {Records,Observation} from './sync-session';
export function reusableRoster(saved:Snapshot|null,slots:Slot[]):Records{
 if(!saved)return {};
 const all=Object.values(saved.records).filter(validObservation),out:Records={};
 for(const s of slots){if(s.kind==='captain')continue;
 const matches=all.filter(o=>o.kind===s.kind&&o.fingerprint===s.fingerprint);
 if(matches.length===1&&slots.filter(t=>t.kind===s.kind&&t.fingerprint===s.fingerprint).length===1)out[s.id]={...matches[0],details:matches[0].details?{...matches[0].details,assignmentKnown:false}:undefined};
 }
 return out;
}
export function sameIdentity(a:Observation,b:Observation){return a.kind===b.kind&&a.reading.name.toUpperCase()===b.reading.name.toUpperCase()&&a.reading.level===b.reading.level&&(['morale','combat','seafaring','speed'] as const).every(k=>a.reading[k]===b.reading[k])&&a.details?.traitsText===b.details?.traitsText&&a.details?.personality===b.details?.personality;}
