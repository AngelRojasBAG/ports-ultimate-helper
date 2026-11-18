import {it,expect} from 'vitest';
import {parseDetails} from '../src/core/unit-details';
it('reads wrapped captain traits including trailing commas',()=>{
 const d=parseDetails('—','Multi-Talented, Fast Learner,\nEagle-Eyed, Tough as Nails\nPersonality: Calm','captain');
 expect(d).toEqual({assignedShip:null,assignmentKnown:true,traitsText:'Multi-Talented, Fast Learner, Eagle-Eyed, Tough as Nails',personality:'Calm'});
});
it('does not infer free assignment from missing text',()=>{
 expect(parseDetails('','No Traits','crew').assignmentKnown).toBe(false);
});