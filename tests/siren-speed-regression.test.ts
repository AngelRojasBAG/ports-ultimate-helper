import {it,expect} from 'vitest';
import {verifyDigit,readVerifiedNumber,digitRows} from '../src/core/ports-digit-font';
it('accepts the observed Siren Whalerider seven variant with exact verification',()=>{
 const seven='1111110/0000110/0000100/0000100/0001100/0001000/0011000/0010000/0110000';
 const frame={width:21,height:9,data:new Uint8ClampedArray(21*9*4)};
 for(const [j,rows] of [seven,digitRows['0']].entries())rows.split('/').forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')frame.data.set([255,255,255,255],(y*21+j*7+x)*4)}));
 expect(verifyDigit(seven)).toBe('7');expect(readVerifiedNumber(frame,0,0,verifyDigit)).toBe('70');expect(readVerifiedNumber(frame,0,0,()=> '1')).toBeNull();
});
