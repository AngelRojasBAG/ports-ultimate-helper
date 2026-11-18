import {it,expect} from 'vitest';
import {splitGlyphs,trainGlyphs,fontForGlyphs} from '../src/core/ports-glyph-font';
import type {Sample} from '../src/core/ports-text-patterns';
it('splits title from measured body and preserves word gap',()=>{
 const rows=Array.from({length:10},()=> '1100000011').join('');
 const parts=splitGlyphs('title',{w:10,h:10,bits:rows});
 expect(parts.map(p=>p.mask.w)).toEqual([2,2]);expect(parts[1].gap).toBe(6);
});
it('rejects inconsistent labels and wrong character count',()=>{
 const mask={w:4,h:1,bits:'1111'};
 const samples:Sample[]=[{field:'ship',text:'-',mask}];
 const glyphs=trainGlyphs(samples,'ship');expect(glyphs[0].chr).toBe('-');
 expect(fontForGlyphs(glyphs,1).chars[0].pixels.length).toBe(12);
 expect(trainGlyphs([...samples,{field:'ship',text:'1',mask}],'ship')).toEqual([]);
});
