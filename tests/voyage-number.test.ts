import {it,expect} from 'vitest';import {decodeVoyageNumber} from '../src/core/voyage-number';import {digitRows} from '../src/core/ports-digit-font';
it('decodes a new combination with no whole-number template',()=>{const rows=Array.from({length:9},(_,y)=>[...'12345'].map(n=>digitRows[n].split('/')[y]).join('0'));expect(decodeVoyageNumber({w:rows[0].length,h:9,bits:rows.join('')})).toBe(12345);});
it('rejects unknown ink and empty crops',()=>{expect(decodeVoyageNumber(null)).toBeNull();expect(decodeVoyageNumber({w:1,h:9,bits:'111111111'})).toBeNull();});
