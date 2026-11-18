import {it,expect} from 'vitest';
import {parseDetails} from '../src/core/unit-details';
it('reads captain personality with observed OCR prefix',()=>{
 const result=parseDetails('-','Multi-Talented, Fast Learner,\nEagle-Eyed, Tough as Nails\n2 Personality:calm','captain');
 expect(result).toEqual({assignedShip:null,assignmentKnown:true,traitsText:'Multi-Talented, Fast Learner, Eagle-Eyed, Tough as Nails',personality:'Calm'});
});
it('rejects missing and malformed personality values',()=>{
 for(const t of ['Personality:','Personality: 123','Other Personality: Calm']){
  expect(parseDetails('-',t,'captain').personality).toBeNull();
 }
});
it('does not attach personality to crew',()=>{
 expect(parseDetails('1','Personality: Calm','crew').personality).toBeNull();
});
