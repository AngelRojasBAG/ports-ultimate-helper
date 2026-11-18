import {it,expect} from 'vitest';
import {digitRows,createDigitFont,verifyDigit,readVerifiedNumber} from '../src/core/ports-digit-font';
it('contains ten distinct measured glyph patterns',()=>{
 expect(Object.keys(digitRows)).toHaveLength(10);
 expect(new Set(Object.values(digitRows)).size).toBe(10);
 const font=createDigitFont();expect(font.chars).toHaveLength(10);
 for(const [digit,rows] of Object.entries(digitRows))expect(verifyDigit(rows)).toBe(digit);
});
it('rejects invalid or ambiguous OCR outputs',()=>{
 const frame={width:21,height:9,data:new Uint8ClampedArray(21*9*4)};
 for(let i=3;i<frame.data.length;i+=4)frame.data[i]=255;
 for(const [n,d] of [...'28'].entries())digitRows[d].split('/').forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1'){const i=(y*21+n*7+x)*4;frame.data[i]=frame.data[i+1]=frame.data[i+2]=255;}}));
 expect(readVerifiedNumber(frame,0,0,verifyDigit)).toBe('28');
 expect(readVerifiedNumber(frame,0,0,()=> '9')).toBeNull();
});
