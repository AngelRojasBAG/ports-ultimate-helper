import {it,expect} from 'vitest';
import {addEntry,mergeGlyphs,labelMask,type Entry} from '../src/core/ports-glyph-registry';
const mask={w:2,h:2,bits:'1110'};
it('adds only valid single symbols, isolates fonts, rejects contradictions',()=>{
 const e:Entry={family:'title',chr:'F',mask};
 expect(addEntry([],e)).toEqual([e]);
 expect(()=>addEntry([e],{...e,chr:'P'})).toThrow();
 expect(addEntry([e],{...e,family:'ship',chr:'1'})).toHaveLength(2);
 expect(()=>addEntry([],{...e,chr:'foo'})).toThrow();
 expect(mergeGlyphs([e],[{chr:'P',mask}])).toEqual([]);
 expect(labelMask(mask,[e])).toBe('F');
});
