import type {Reading} from './roster-reader';
export interface Observation {reading:Reading;fingerprint:string;observedAt:string;kind:'crew'|'captain'}
export type Records=Record<string,Observation>;
export function signature(slot:string,fingerprint:string,r:Reading){return JSON.stringify([slot,fingerprint,r])}
export function stable(previous:string|null,current:string){return previous===current}
export function recordSlot(records:Records,id:string,observation:Observation):Records{return {...records,[id]:observation}}
