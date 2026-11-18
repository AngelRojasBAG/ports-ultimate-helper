import {it,expect} from 'vitest';
import {splitCoreLine,trainDetailGlyphs} from '../src/core/ports-detail-characters';
it('splits core rows and retains gap widths',()=>{
 const parts=splitCoreLine({w:7,h:7,bits:'1100011'.repeat(7)});
 expect(parts.map(p=>p.mask.w)).toEqual([2,2]);expect(parts[1].gap).toBe(3);
});
it('does not learn a label whose segmentation count is inconsistent',()=>{
 expect(trainDetailGlyphs([{field:'details',text:'Plucky',mask:{w:2,h:39,bits:'11'.repeat(39)}}])).toEqual([]);
});
