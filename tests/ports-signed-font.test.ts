import {it,expect} from 'vitest';
import {digitRows,readSignedNumber,verifyDigit} from '../src/core/ports-digit-font';
function frame(text:string){
 const f={width:64,height:9,data:new Uint8ClampedArray(64*9*4)};
 const ink=(x:number,y:number)=>{const i=(y*f.width+x)*4;f.data[i]=f.data[i+1]=f.data[i+2]=255;};
 let x=0;
 for(const ch of text){
  if(ch==='-'){for(let i=0;i<3;i++)ink(x+i,4);x+=4;continue;}
  if(ch==='?'){ink(x,0);ink(x,7);x+=4;continue;}
  digitRows[ch].split('/').forEach((r,y)=>[...r].forEach((v,dx)=>{if(v==='1')ink(x+dx,y);}));
  x+=7;
 }
 return f;
}
it('preserves sign and accepts zero and ordinary integers',()=>{
 for(const value of ['-10','-750','0','280','940','860'])expect(readSignedNumber(frame(value),0,0,verifyDigit)).toBe(value);
});
it('rejects an unknown prefix instead of dropping it',()=>{
 expect(readSignedNumber(frame('?10'),0,0,verifyDigit)).toBeNull();
});
