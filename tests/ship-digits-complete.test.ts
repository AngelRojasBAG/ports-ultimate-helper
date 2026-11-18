import {it,expect} from 'vitest';import {fromHex,readShipNumber} from '../src/core/ship-visual-reader';
it('reads previously missing digits from ship 2',()=>{
 expect(readShipNumber(fromHex(5,'1e,13,11,1f,e,1b,11,13,1e'))).toBe(8);
 expect(readShipNumber(fromHex(5,'e,13,11,13,1f,1,3,2,1c'))).toBe(9);
});
