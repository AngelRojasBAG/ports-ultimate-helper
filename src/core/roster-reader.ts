export interface Reading {name:string;level:number;morale:number;combat:number;seafaring:number;speed:number}
export function parseReading(lines:string[]):Reading|null{
 const text=lines.join('\n');const name=lines[0]?.trim();
 // Normalize only an isolated O/o in a labeled numeric field. Never alter names or mixed tokens.
 const num=(label:string)=>{
  const m=text.match(new RegExp('\\b'+label+'\\s*[:;]?\\s*([^\\s]+)','i'));
  if(!m)return NaN;
  const token=m[1];
  if(/^[Oo]$/.test(token))return 0;
  if(!/^[−–-]?(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(token))return NaN;
  return Number(token.replace(/,/g,'').replace(/[−–]/g,'-'));
 };
 const level=num('Level'),morale=num('Morale'),combat=num('Combat'),seafaring=num('Seafaring'),speed=num('Speed');
 if(!name||! /^[A-Za-z][A-Za-z '\u2019-]{2,60}$/.test(name)||!Number.isInteger(level)||level<0||level>10||[morale,combat,seafaring,speed].some(n=>!Number.isSafeInteger(n)))return null;
 return {name,level,morale,combat,seafaring,speed};
}
export function normalizeTitle(s:string){return s.toUpperCase().replace(/[^A-Z]/g,'')}
export function isRosterTitle(s:string){return normalizeTitle(s)==='CREWROSTER'}
