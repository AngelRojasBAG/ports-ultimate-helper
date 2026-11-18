import {it,expect} from 'vitest';
import {fullTraitRow,readFullCrewTrait} from '../src/core/ports-full-traits';
import {trainDetailGlyphs} from '../src/core/ports-detail-characters';
const mask={w:6,h:20,bits:Array.from({length:20},(_,y)=>y<10?'011010':y===12?'000010':'000000').join('')};
it('retains descender and refuses a nonblank separator',()=>{
 const row=fullTraitRow(mask)!;expect(row.h).toBe(13);expect(row.bits.slice(-row.w)).toContain('1');
 const bad={...mask,bits:mask.bits.slice(0,13*6)+'100000'+mask.bits.slice(14*6)};
 expect(fullTraitRow(bad)).toBeNull();
});
it('matches a known full trait, rejects conflicting labels, quarantines old glyphs',()=>{
 const s=[{field:'details' as const,text:'Plucky',mask}];
 expect(readFullCrewTrait(mask,s,'crew')?.traitsText).toBe('Plucky');
 expect(readFullCrewTrait(mask,[...s,{...s[0],text:'Loyal'}],'crew')).toBeNull();
 expect(trainDetailGlyphs(s)).toEqual([]);
});
