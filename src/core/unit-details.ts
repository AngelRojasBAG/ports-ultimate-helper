export interface UnitDetails {assignedShip:number|null;assignmentKnown:boolean;traitsText:string|null;personality:string|null}
export function parseDetails(assignment:string,traits:string,kind:'crew'|'captain'):UnitDetails{
 const marker=assignment.trim();const assignmentKnown=/^[1-4-]$/.test(marker);
 const lines=traits.split('\n').map(s=>s.trim()).filter(Boolean);
 const personalityLine=lines.find(s=>/^Personality\s*:/i.test(s));
 // Crew flavor text is not reliably distinguishable from a trait without a complete vocabulary.
 const known=['No Traits','Cowardly','Merchant','Solidarity','Staunch','Rallying Cry','Good Fortune','Resurrects','Undead','Multi-Talented','Fast Learner','Eagle-Eyed','Tough as Nails','Eager','Misery Guts','Cursed','Leader','Gloombringer','Seafriend','Storm Magnet','Tactician','Liability','Lookout','Albatross'];
 const matches=lines.filter(s=>s.split(',').every(t=>known.some(k=>k.toLowerCase()===t.trim().toLowerCase())));
 return {assignedShip:assignmentKnown&&marker!=='-'?Number(marker):null,assignmentKnown,traitsText:matches.length?matches.join(', '):null,personality:kind==='captain'&&personalityLine?personalityLine.replace(/^Personality\s*:\s*/i,''):null};
}
