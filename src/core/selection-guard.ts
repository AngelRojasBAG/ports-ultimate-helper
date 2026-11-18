import type {Reading} from './roster-reader';
export function sameReading(a:Reading,b:Reading){return a.name.trim().toUpperCase()===b.name.trim().toUpperCase()&&a.level===b.level&&a.morale===b.morale&&a.combat===b.combat&&a.seafaring===b.seafaring&&a.speed===b.speed;}
export function overlayColor(state:'done'|'active'|'next'|'partial'|'pending'):[number,number,number] {
 return {done:[55,220,100],active:[190,100,245],next:[60,160,255],partial:[245,105,35],pending:[165,165,165]}[state] as [number,number,number];
}
export function isSelectionYellow(r:number,g:number,b:number){return r>185&&g>135&&b<105&&r-b>100&&g-b>65;}
