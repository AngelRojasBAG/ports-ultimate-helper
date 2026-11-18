import {it,expect} from 'vitest';
import {resolveDetailPasses} from '../src/core/unit-details';
it('accepts two matching validated low-confidence passes',()=>{
 const a={text:'MUtlNOUS\n-arned the Fremmenik name Farstink',confidence:62};
 const b={text:'Mutinous\nEarned the Fremennik name Farstink',confidence:70};
 expect(resolveDetailPasses('2',[a,b],'crew').traitsText).toBe('Mutinous');
});
it('rejects a single low-confidence reading',()=>{
 expect(resolveDetailPasses('2',[{text:'Mutinous',confidence:60}],'crew').traitsText).toBeNull();
});
it('rejects conflicting recognized traits',()=>{
 expect(resolveDetailPasses('2',[{text:'Plucky',confidence:90},{text:'Mutinous',confidence:90}],'crew').traitsText).toBeNull();
});
it('retains repeated captain traits and resolves observed label',()=>{
 const text='Eagle-Eyed, Eager,\nEagle-Eyed\nPersonaiity: Exuberant';
 const r=resolveDetailPasses('-',[{text,confidence:60},{text,confidence:64}],'captain');
 expect(r.traitsText).toBe('Eagle-Eyed, Eager, Eagle-Eyed');
 expect(r.personality).toBe('Exuberant');
});
