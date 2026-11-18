import {it,expect} from 'vitest';
import {seededTraits} from '../src/core/ports-trait-seeds';
import {alignTrait,matchTraitTemplate,readDualTrait} from '../src/core/ports-trait-dual';
import {matchTitleWithNoise} from '../src/core/ports-glyph-font';
it('aligns the actual 13 fragments of Tough as Nails into 12 letters',()=>{
 for(const s of seededTraits.filter(s=>s.text==='Tough as Nails'))expect(alignTrait(s.text,s.mask)?.map(g=>g.chr).join('')).toBe('ToughasNails');
});
it('recognizes all six screenshot traits at both thresholds and tolerates tiny pixel loss',()=>{
 for(const s of seededTraits){
  expect(matchTraitTemplate(s.mask,seededTraits,s.threshold)).toBe(s.text);
  const i=s.mask.bits.indexOf('1'),mask={...s.mask,bits:s.mask.bits.slice(0,i)+'0'+s.mask.bits.slice(i+1)};
  expect(matchTraitTemplate(mask,seededTraits,s.threshold)).toBe(s.text);
  expect(matchTraitTemplate({...s.mask,bits:'0'.repeat(s.mask.bits.length)},seededTraits,s.threshold)).toBeNull();
 }
});
it('recovers a registered name with distant noise and rejects in-letter changes',()=>{
 const ref={w:4,h:10,bits:'1101'.repeat(10)};
 const s=[{field:'title' as const,text:'AB',mask:ref}];
 const mask={w:8,h:12,bits:'00000001'+'00000000'+Array.from({length:10},()=> '00110100').join('')};
 expect(matchTitleWithNoise(mask,s)).toBe('AB');
 expect(matchTitleWithNoise({...mask,bits:mask.bits.slice(0,-8)+'00000100'},s)).toBeNull();
});
