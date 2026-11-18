import {it,expect} from 'vitest';
import {titleSeeds} from '../src/core/ports-title-seeds';
import {matchTitleWithNoise} from '../src/core/ports-glyph-font';
import {knownCrewName} from '../src/core/crew-name';
it('recognizes measured Blazing Lantern title without learning local glyphs',()=>{
 const s=titleSeeds[0],m=s.mask;expect(knownCrewName(s.text)).toBe(true);expect(matchTitleWithNoise(m,titleSeeds)).toBe(s.text);
 const expanded={w:m.w+6,h:m.h+2,bits:'0'.repeat(m.w+5)+'1'+'0'.repeat(m.w+6)+Array.from({length:m.h},(_,y)=>'000'+m.bits.slice(y*m.w,(y+1)*m.w)+'000').join('')};
 expect(matchTitleWithNoise(expanded,titleSeeds)).toBe(s.text);
 const i=m.bits.indexOf('1');expect(matchTitleWithNoise({...m,bits:m.bits.slice(0,i)+'0'+m.bits.slice(i+1)},titleSeeds)).toBeNull();
});
