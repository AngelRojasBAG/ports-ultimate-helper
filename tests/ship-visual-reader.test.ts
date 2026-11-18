import {it,expect} from 'vitest';import {fromHex,readShipNumber,findAnchor} from '../src/core/ship-visual-reader';
it('reads measured ship panel digits and rejects unknowns',()=>{
 const m=fromHex(5,'e,18,10,1e,1b,11,11,1b,e');expect(readShipNumber(m)).toBe(6);
 expect(readShipNumber({...m,bits:'1'.repeat(45)})).toBeNull();
});
it('finds a unique exact template even after shifting',()=>{
 const m=fromHex(3,'5,2,7');const f={width:10,height:9,data:new Uint8ClampedArray(10*9*4)};
 for(let y=0;y<3;y++)for(let x=0;x<3;x++)if(m.bits[y*3+x]==='1')f.data.set([255,255,255,255],((y+4)*10+x+2)*4);
 expect(findAnchor(f,m)).toEqual({x:2,y:4});
});
