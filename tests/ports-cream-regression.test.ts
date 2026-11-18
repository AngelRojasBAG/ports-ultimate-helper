import {it,expect} from 'vitest';
import {seededTraits} from '../src/core/ports-trait-seeds';
import {matchTraitTemplate} from '../src/core/ports-trait-dual';
import {observedFields} from '../src/core/ports-observed-fields';
import {matchSample} from '../src/core/ports-text-patterns';
import {parseDetails} from '../src/core/unit-details';
it('recognizes both observed Cowardly colors and new crew traits',()=>{for(const s of seededTraits.filter(s=>['Cowardly','Misery Guts','Eager'].includes(s.text)))expect(matchTraitTemplate(s.mask,seededTraits,s.threshold)).toBe(s.text);});
it('recognizes observed ship, level and captain details',()=>{for(const s of observedFields)expect(matchSample(observedFields,s.field,s.mask)).toBe(s.text);const d=parseDetails('',observedFields[3].text,'captain');expect(d.traitsText).toBe('Cursed');expect(d.personality).toBe('Abrasive');});
