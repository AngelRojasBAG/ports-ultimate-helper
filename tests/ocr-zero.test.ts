import {it,expect} from 'vitest';
import {parseReading} from '../src/core/roster-reader';
const lines=['CARD SHARP','Level 6','Morale: 1200 Seafaring: O','Combat: 0 Speed: 70'];
it('reads reported Card Sharp sample',()=>{
 const result=parseReading(lines);
 expect(result).toEqual({name:'CARD SHARP',level:6,morale:1200,combat:0,seafaring:0,speed:70});
});
it('accepts isolated lowercase o',()=>{
 const input=lines.map(x=>x.replace('Seafaring: O','Seafaring: o'));
 expect(parseReading(input)?.seafaring).toBe(0);
});
it('rejects ambiguous mixed tokens and partial numbers',()=>{
 for(const value of ['O70','1O','10.5','1,2','OO','OTHER']){
  const input=lines.map(x=>x.replace('Seafaring: O','Seafaring: '+value));
  const result=parseReading(input);
  expect(result).toBeNull();
 }
});
it('preserves name and signed stats',()=>{
 const result=parseReading(['STORM RIDERS CLANSMAN','Level 7','Morale: O Seafaring: 860','Combat: -10 Speed: 0']);
 expect(result).toEqual({name:'STORM RIDERS CLANSMAN',level:7,morale:0,combat:-10,seafaring:860,speed:0});
});
