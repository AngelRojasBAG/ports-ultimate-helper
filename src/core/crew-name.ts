import {crew,undead} from '../data/catalog';
const names=[...crew,...undead].map(x=>x.name.toUpperCase());
export function knownCrewName(name:string){return names.includes(name.trim().toUpperCase())}
