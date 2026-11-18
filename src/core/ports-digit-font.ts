// Pixel patterns taken from original 1920x1009 Ports screenshots at scale 1.
// Each digit is a 7x9 cell, using min(R,G,B)>100 to isolate cream text.
export const digitRows:Record<string,string>={
 '0':'0111000/1101100/1000100/1000100/1000100/1000100/1000100/1101100/0111000',
 '1':'0110000/1110000/0010000/0010000/0010000/0010000/0010000/0010000/0010000',
 '2':'0111000/1001100/0000100/0001100/0001000/0011000/0110000/1100000/1111100',
 '3':'1111000/1001100/0000100/0001100/0111000/0001100/0000100/0001100/1111000',
 '4':'0001100/0001100/0010100/0110100/0100100/1100100/1111110/0000100/0000100',
 '5':'1111000/1000000/1000000/1111000/0001100/0000100/0000100/0001100/1111000',
 '6':'0111000/1100000/1000000/1111000/1001100/1000100/1000100/1101100/0111000',
 '7':'1111110/0000010/0000100/0000100/0001100/0001000/0011000/0010000/0110000',
 '8':'0111000/1000100/1000100/1101000/0111000/1001100/1000100/1001100/0111000',
 '9':'0111000/1001100/1000100/1001100/0111100/0000100/0001100/0001000/1110000'
};
export function createDigitFont(){
 const chars=Object.entries(digitRows).map(([chr,rows],i)=>{
  const pixels:number[]=[];
  rows.split('/').forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')pixels.push(x,y,255)}));
  return {chr,width:7,bonus:pixels.length/3*5,secondary:false,templatex:i*8,pixels};
 });
 return {chars,width:7,spacewidth:3,shadow:false,height:9,basey:8,bonusperpixel:5};
}
// Compare the whole digit cell, not just the foreground pixels. An ambiguous or
// unknown pattern remains pending. This is a verification guard, not an OCR fallback.
export function verifyDigit(rows:string):string|null{
 const exact=Object.entries(digitRows).filter(([,pattern])=>pattern===rows);
 return exact.length===1?exact[0][0]:null;
}
export type NumericFrame={width:number;height:number;data:Uint8ClampedArray};
export function cellMask(frame:NumericFrame,x:number,y:number):string|null{
 if(x<0||y<0||x+7>frame.width||y+9>frame.height)return null;
 const rows:string[]=[];
 for(let dy=0;dy<9;dy++){
  let row='';
  for(let dx=0;dx<7;dx++){const i=((y+dy)*frame.width+x+dx)*4;row+=Math.min(frame.data[i],frame.data[i+1],frame.data[i+2])>100?'1':'0'}
  rows.push(row);
 }
 return rows.join('/');
}
export function readVerifiedNumber(frame:NumericFrame,x:number,y:number,read:(rows:string)=>string|null,maxDigits=5):string|null{
 let result='';
 for(let n=0;n<maxDigits;n++){
  const mask=cellMask(frame,x+n*7,y);
  if(mask===null)return null;
  if(!mask.includes('1'))return result||null;
  const chr=read(mask);
  if(chr===null||verifyDigit(mask)!==chr)return null;
  result+=chr;
 }
 const following=cellMask(frame,x+maxDigits*7,y);
 return following&&!following.includes('1')?result:null;
}
