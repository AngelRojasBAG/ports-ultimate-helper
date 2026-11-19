import type {LockState} from './ports-menu-reader';
export type PartObservation={category:string;name:string;state:Exclude<LockState,'unknown'>;observedAt:string};
export type VoyageObservation={name:string;totals:number[];requirements:number[];observedAt:string};
export const KEY='ports-helper.menu-observations.v1';
type State={parts:PartObservation[];voyage:VoyageObservation|null;voyages?:VoyageObservation[]};
const states=['equipped','available','locked-gold','locked-grey'];
const categories=['ram','deck','rudder','hull'];
const nums=(a:unknown):a is number[]=>Array.isArray(a)&&a.length===3&&a.every(n=>Number.isSafeInteger(n)&&n>=0);
export function loadMenus(s:Storage):State{try{const v=JSON.parse(s.getItem(KEY)??'null');if(v&&Array.isArray(v.parts))return {parts:v.parts.filter((p:PartObservation)=>p&&categories.includes(p.category)&&typeof p.name==='string'&&states.includes(p.state)&&typeof p.observedAt==='string'),voyages:Array.isArray(v.voyages)?v.voyages.filter((q:VoyageObservation)=>q&&typeof q.name==='string'&&nums(q.totals)&&nums(q.requirements)):[],voyage:v.voyage&&typeof v.voyage.name==='string'&&nums(v.voyage.totals)&&nums(v.voyage.requirements)?v.voyage:null};}catch{}return {parts:[],voyage:null};}
export function mergeParts(old:PartObservation[],category:string,rows:{name:string|null;state:LockState}[],at:string){const next=[...old];if(!categories.includes(category))return next;for(const r of rows){if(!r.name||r.state==='unknown'||!states.includes(r.state))continue;const i=next.findIndex(p=>p.category===category&&p.name===r.name);const item:PartObservation={category,name:r.name,state:r.state,observedAt:at};if(i<0)next.push(item);else next[i]=item;}return next;}
export function saveMenus(s:Storage,state:State){if(state.voyage)state.voyages=[...(state.voyages??[]).filter(v=>v.name!==state.voyage!.name||v.requirements.join()!==state.voyage!.requirements.join()),state.voyage].slice(-40);const prior=s.getItem(KEY);if(prior)s.setItem(KEY+'.previous',prior);s.setItem(KEY,JSON.stringify(state));}
export function makeVoyage(v:{name:string|null;totals:(number|null)[];requirements:(number|null)[]},at:string):VoyageObservation|null{return v.name&&nums(v.totals)&&nums(v.requirements)&&v.requirements.some(n=>n>0)?{name:v.name,totals:v.totals,requirements:v.requirements,observedAt:at}:null;}
