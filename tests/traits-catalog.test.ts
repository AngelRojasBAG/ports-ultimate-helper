import {it,expect} from 'vitest';
import {parseDetails} from '../src/core/unit-details';
it('accepts the two reported Golden Katana traits',()=>{
 expect(parseDetails('2','Mutinous\nEarned the Fremennik name Fastink','crew').traitsText).toBe('Mutinous');
 expect(parseDetails('2','Plucky\nReliable only when drunk.','crew').traitsText).toBe('Plucky');
});
it('preserves all four captain traits and repeats',()=>{
 const result=parseDetails('3','Misery Guts, Plucky,\nQuick-Footed, Loyal\nPersonality: Calm','captain');
 expect(result.traitsText).toBe('Misery Guts, Plucky, Quick-Footed, Loyal');
 expect(result.personality).toBe('Calm');
 expect(parseDetails('3','Plucky, Plucky\nPersonality: Calm','captain').traitsText).toBe('Plucky, Plucky');
});
it('does not treat a partially recognized captain as complete',()=>{
 const result=parseDetails('3','Misery Guts, Plucky,\nCuller asi Bey LI\nersonality: Calin','captain');
 expect(result.traitsText).toBeNull();
 expect(result.personality).toBeNull();
});
