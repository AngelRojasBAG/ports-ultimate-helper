import {it,expect} from 'vitest';
import {parseDetails} from '../src/core/unit-details';
it('normalizes the observed Mutinous OCR alias',()=>{
 expect(parseDetails('2','MUtlNOUS\n-arned the Fremennik name Farstink','crew').traitsText).toBe('Mutinous');
});
it('normalizes Jack Thorn observed aliases',()=>{
 const r=parseDetails('3','hisery Guts, Plucky,\nGuick-Footed, Loyal\nPersonality: Calfn','captain');
 expect(r.traitsText).toBe('Misery Guts, Plucky, Quick-Footed, Loyal');
 expect(r.personality).toBe('Calm');
});
it('recognizes Jan Bligh label and preserves repeated traits',()=>{
 const r=parseDetails('-','Eagle-Eyed, Eager,\nEagle-Eyed\nPersonaiity: Exuberant','captain');
 expect(r.traitsText).toBe('Eagle-Eyed, Eager, Eagle-Eyed');
 expect(r.personality).toBe('Exuberant');
});
it('rejects unknown tokens rather than guessing',()=>{
 expect(parseDetails('2','Mutinoux','crew').traitsText).toBeNull();
 expect(parseDetails('3','Plucky\nPersonality: Calin','captain').personality).toBeNull();
});