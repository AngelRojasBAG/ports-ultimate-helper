import {it,expect} from 'vitest';
import {statInk,greenDigitRows,verifyDigit,readSignedNumber,digitRows} from '../src/core/ports-digit-font';
import {cleanTitleMask,splitGlyphs} from '../src/core/ports-glyph-font';
it('isolates native red and green stats without accepting panel brown',()=>{
 expect(statInk(246,2,1)).toBe(true);expect(statInk(30,136,8)).toBe(true);expect(statInk(50,46,40)).toBe(false);
});
it('reads measured green variants and red cells with exact full-mask guard',()=>{
 const frame={width:42,height:9,data:new Uint8ClampedArray(42*9*4)};
 for(let i=0;i<frame.data.length;i+=4)frame.data.set([50,46,40,255],i);
 const values='860';
 for(let j=0;j<values.length;j++){
  const rows=(greenDigitRows[values[j]]??digitRows[values[j]]).split('/');
  rows.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')frame.data.set([30,136,8,255],(y*42+j*7+x)*4)}));
 }
 expect(readSignedNumber(frame,0,0,verifyDigit)).toBe('860');
});
it('removes a remote top pixel and preserves the title body',()=>{
 const rows=['000000000001','000000000000',...Array.from({length:10},()=> '110001100000'),'000000000000'];
 const mask={w:12,h:13,bits:rows.join('')};
 expect(cleanTitleMask(mask)?.w).toBe(7);expect(splitGlyphs('title',mask)).toHaveLength(2);
});
