import {it,expect} from 'vitest';
import {matchDetailLine,detailLines,trainDetailLines,readDetailLines} from '../src/core/ports-detail-lines';
it('rejects a visually identical conflicting trait',()=>{
 const mask={w:3,h:7,bits:'111'.repeat(7)};
 expect(matchDetailLine(mask,[{mask,text:'Plucky',role:'traits'},{mask,text:'Loyal',role:'traits'}],'traits')).toBeNull();
});
it('recognizes known line and ignores flavour text',()=>{
 const mask={w:3,h:39,bits:'111'.repeat(39)};
 const samples=[{field:'details' as const,text:'Plucky\nReliable only when drunk.',mask}];
 expect(detailLines(mask,'crew')).toHaveLength(1);
 expect(trainDetailLines(samples,'crew')).toHaveLength(1);
 expect(readDetailLines(mask,samples,'crew').traitsText).toBe('Plucky');
 expect(readDetailLines(mask,samples,'captain').traitsText).toBeNull();
});
