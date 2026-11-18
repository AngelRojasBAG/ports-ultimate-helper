export interface Unit {id:string;name:string;kind:'crew'|'captain';level:number;stats:number[];traits:string;available:boolean}
export function validUnit(u:Unit):boolean{return !!u.name.trim()&&Number.isInteger(u.level)&&u.level>=0&&u.level<=10&&u.stats.length===4&&u.stats.every(x=>Number.isSafeInteger(x))&&['crew','captain'].includes(u.kind);}
export function canAdd(units:Unit[],u:Unit){return validUnit(u)&&units.filter(x=>x.kind===u.kind).length<(u.kind==='crew'?25:5);}
const key='ports-helper.roster.v1';
export function readRoster():Unit[]{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.filter(validUnit):[]}catch{return []}}
export function writeRoster(v:Unit[]){localStorage.setItem(key,JSON.stringify(v))}
