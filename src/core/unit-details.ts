export interface UnitDetails {assignedShip:number|null;assignmentKnown:boolean;traitsText:string|null;personality:string|null}
export const knownTraits=['No Traits','Eager','Misery Guts','Eagle-Eyed','Short Sighted','Plucky','Cowardly','Quick-Footed','Slow','Loyal','Mutinous','Tough as Nails','Feeble','Fast Learner','Slow-Witted','Awe-Inspiring','Vapid','Seafarer','Landlubber','Slayer','Pacifist','Workhorse','Glutton','Opportunist','Pilferer','Multi-Talented','Cursed','Leader','Gloombringer','Seafriend','Storm Magnet','Tactician','Liability','Lookout','Albatross','Merchant','Solidarity','Staunch','Rallying Cry','Good Fortune','Resurrects','Undead'] as const;
const personalities=['Abrasive','Approachable','Calm','Cruel','Eccentric','Exuberant','Vicious'];
const norm=(s:string)=>s.trim().replace(/[−–—]/g,'-').replace(/\s+/g,' ').toLowerCase();
// Explicit, observed OCR aliases. Do not guess arbitrary nearby vocabulary.
const traitAliases:Record<string,string>={'mutlnous':'Mutinous','hisery guts':'Misery Guts','guick-footed':'Quick-Footed'};
const personalityAliases:Record<string,string>={'calfn':'Calm'};
function resolve<T extends string>(value:string, vocabulary:readonly T[],aliases:Record<string,string>):T|undefined {
 const key=norm(value);
 const exact=vocabulary.find(k=>norm(k)===key);
 if(exact)return exact;
 const alias=Object.prototype.hasOwnProperty.call(aliases,key)?aliases[key]:undefined;
 return alias?vocabulary.find(k=>k===alias):undefined;
}
export function parseDetails(assignment:string,traits:string,kind:'crew'|'captain'):UnitDetails{
 const marker=assignment.trim().replace(/[−–—]/g,'-');const assignmentKnown=/^[1-4-]$/.test(marker);
 const lines=traits.split('\n').map(s=>s.trim()).filter(Boolean);
 const personalityPattern=/^(?:[0-9]\s+)?(?:Personality|Personaiity)\s*:\s*([A-Za-z]+(?:[ -][A-Za-z]+)*)$/i;
 const personalityMatches=lines.map(s=>s.match(personalityPattern)).filter(m=>m!==null);
 const personality=personalityMatches.length===1?resolve(personalityMatches[0][1],personalities,personalityAliases)??null:null;
 // Captains have no flavour text: reject incomplete or unknown trait lines, rather than silently dropping them.
 // Crew flavour text follows the trait block. Read the leading trait block only.
 const end=lines.findIndex(s=>personalityPattern.test(s));
 const traitLines=kind==='captain'?(end>=0?lines.slice(0,end):lines):lines.slice(0,1);
 const tokens=traitLines.join(' ').split(',').map(s=>s.trim()).filter(Boolean);
 const matched=tokens.map(t=>resolve(t,knownTraits,traitAliases));
 const valid=matched.length>0&&matched.length<=4&&matched.every(Boolean)&&(!matched.includes('No Traits')||matched.length===1);
 return {assignedShip:assignmentKnown&&marker!=='-'?Number(marker):null,assignmentKnown,traitsText:valid?matched.join(', '):null,personality:kind==='captain'?personality:null};
}
