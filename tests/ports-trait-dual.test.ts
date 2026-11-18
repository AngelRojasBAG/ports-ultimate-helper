import {it,expect} from 'vitest';
import {alignTrait,trainFullTraits} from '../src/core/ports-trait-dual';
const mask={w:11,h:13,bits:'10101010101'.repeat(13)};
it('learns only count-aligned known traits, keeps thresholds separate',()=>{
 expect(alignTrait('Plucky',mask)?.map(g=>g.chr).join('')).toBe('Plucky');
 expect(alignTrait('Loyal',mask)).toBeNull();
 // Same glyph for different letters in synthetic example is ambiguous.
 expect(trainFullTraits([{text:'Plucky',threshold:90,mask}],90)).toEqual([]);
 expect(trainFullTraits([{text:'Plucky',threshold:90,mask}],110)).toEqual([]);
});
